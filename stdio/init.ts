import {
  getAuthConfigFilePath,
  getAuthTokens,
  isDirectory,
} from "../src/utils.ts";
import os from "node:os";
import * as path from "node:path";
import TOML from "smol-toml";
import open from "open";
import which from "which";
import { LocalState } from "../src/utils.ts";
import { z } from "zod";
import assert from "node:assert";

export const supportedMcpClients = ["claude_desktop", "cursor", "zed"] as const;
export const supportedMcpClientsSchema = z.enum(supportedMcpClients);
export type SupportedMcpClient = z.infer<typeof supportedMcpClientsSchema>;

export async function init(mcpClients: Set<SupportedMcpClient>) {
  try {
    getAuthTokens();
  } catch (_) {
    await login();

    getAuthTokens();
  }

  // FIXME--
  const whoamiRes = await fetch(
    "https://autoprovisioner.zerosync.co/api/whoami",
    {
      headers: {
        Authorization: `Bearer ${LocalState.accessToken?.value}`,
      },
    },
  );

  const whoami = await whoamiRes.json() as any;
  const accountId = whoami.id;

  mcpClients.forEach(async (client) => {
    switch (client) {
      case "claude_desktop": {
        await setClaudeDesktopConfig(accountId);
        break;
      }
      case "cursor": {
        await setCursorConfig(accountId);
        break;
      }
    }
  });
}

export async function login() {
  const urlToOpen = "https://autoprovisioner.zerosync.co/auth/cli";

  let server: Deno.HttpServer<Deno.NetAddr>;
  let loginTimeoutHandle: ReturnType<typeof setTimeout>;

  const timerPromise = new Promise<void>((_, reject) => {
    loginTimeoutHandle = setTimeout(async () => {
      await server.shutdown();
      clearTimeout(loginTimeoutHandle);
      reject(
        "Timed out waiting for authorization code, please try again.",
      );
    }, 120000); // wait for 120 seconds for the user to authorize
  });

  const loginPromise = new Promise<string>((resolve, reject) => {
    server = Deno.serve({
      port: 8976,
      hostname: "localhost",
    }, (req) => {
      async function finish(token: string | null, error?: Error) {
        clearTimeout(loginTimeoutHandle);
        await server.shutdown();

        if (error) {
          reject(error);
        } else {
          assert(token);
          resolve(token as string);
        }
      }

      assert(req.url, "This request doesn't have a URL"); // This should never happen
      if (req.method !== "GET") {
        return new Response("OK");
      }

      const { searchParams } = new URL(req.url);
      const token = searchParams.get("token");

      if (!token?.length) {
        finish(null, new Error("failed to resolve token"));
        return new Response("failed to resolve token", { status: 400 });
      }

      finish(token as string);
      return new Response("OK");
    });
  });

  // console.log(`Opening a link in your default browser: ${urlToOpen}`);
  await openInBrowser(urlToOpen);

  const token = await Promise.race([timerPromise, loginPromise]);

  const config = {
    access_token: token,
  };

  const configPath = getAuthConfigFilePath();

  Deno.mkdirSync(path.dirname(configPath), {
    recursive: true,
  });
  Deno.writeFileSync(
    path.join(configPath),
    new TextEncoder().encode(TOML.stringify(config)),
  );
}

async function openInBrowser(url: string): Promise<void> {
  const childProcess = await open(url);
  childProcess.on("error", () => {
    console.warn("Failed to open");
  });
}

async function setClaudeDesktopConfig(accountId: string) {
  const claudeConfigPath = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Claude",
    "claude_desktop_config.json",
  );

  const autoprovisionerConfig = {
    command: (await which("mcp-server-autoprovisioner")).trim(),
    args: ["run", accountId],
  };

  const configDirExists = isDirectory(path.dirname(claudeConfigPath));
  if (configDirExists) {
    let existingConfig = { mcpServers: {} } as {
      mcpServers: Record<string, object>;
    };
    try {
      existingConfig = JSON.parse(
        new TextDecoder().decode(Deno.readFileSync(claudeConfigPath)),
      );
    } catch (_e) {
      // no-op
    }

    const newConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        autoprovisioner: autoprovisionerConfig,
      },
    };
    Deno.writeFileSync(
      claudeConfigPath,
      new TextEncoder().encode(JSON.stringify(newConfig, null, 2)),
    );
  }
}

async function setCursorConfig(accountId: string) {
  // https://docs.cursor.com/context/model-context-protocol#configuration-locations
  const cursorConfigPath = path.join(
    os.homedir(),
    ".cursor",
    "mcp.json",
  );

  const autoprovisionerConfig = {
    command: (await which("mcp-server-autoprovisioner")).trim(),
    args: ["run", accountId],
  };

  const configDirExists = isDirectory(path.dirname(cursorConfigPath));
  if (configDirExists) {
    let existingConfig = { mcpServers: {} } as {
      mcpServers: Record<string, object>;
    };
    try {
      existingConfig = JSON.parse(
        new TextDecoder().decode(Deno.readFileSync(cursorConfigPath)),
      );
    } catch (_e) {
      // no-op
    }

    const newConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        autoprovisioner: autoprovisionerConfig,
      },
    };
    Deno.writeFileSync(
      cursorConfigPath,
      new TextEncoder().encode(JSON.stringify(newConfig, null, 2)),
    );
  }
}
