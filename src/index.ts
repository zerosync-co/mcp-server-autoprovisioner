import {
  init,
  login,
  SupportedMcpClient,
  supportedMcpClients,
  supportedMcpClientsSchema,
} from "./init.ts";
import { main } from "./main.ts";
import { getAuthTokens, LocalState } from "./utils.ts";
import { VERSION } from "./env.ts";

const [cmd, ...args] = Deno.args;

function printUsage() {
  console.log("MCP AutoProvisioner: Automate Infrastructure");
  console.log("");
  console.log("Commands:");

  console.log(
    `- init <mcp clients...>                                        Init and install configuration. Supported MCP Clients: ${
      supportedMcpClients.join(", ")
    }. Default: claude_desktop`,
  );
  console.log("     mcp-server-autoprovisioner init claude_desktop cursor    ");

  console.log(
    "- run  <user id>                                               Start MCP AutoProvisioner",
  );
  console.log("     mcp-server-autoprovisioner run user_123...");

  console.log(
    "- whoami                                                       Retrieve your user information",
  );

  console.log(
    "- version                                                      MCP AutoProvisioner version",
  );
}

if (!cmd?.length) {
  printUsage();
  Deno.exit(0);
}

switch (cmd) {
  case "init": {
    const mcpClientsToInstall = new Set<SupportedMcpClient>();
    if (args.length > 0) {
      args.forEach((client) => {
        const isSupportedClientResult = supportedMcpClientsSchema.safeParse(
          client,
        );
        if (isSupportedClientResult.success) {
          mcpClientsToInstall.add(isSupportedClientResult.data);
        }
      });

      if (!mcpClientsToInstall.size) {
        console.error(
          `${args.join(", ")} ${
            args.length > 1 ? "are" : "is"
          } invalid. Supported MCP Clients: ${supportedMcpClients.join(", ")}`,
        );

        Deno.exit(1);
      }
    } else {
      mcpClientsToInstall.add("claude_desktop");
    }

    init(mcpClientsToInstall);

    break;
  }
  case "run": {
    const [accountId, ..._rest] = args;
    if (!accountId) {
      throw new Error(
        `Missing account ID. Usage: mcp-server-autoprovisioner run [account_id]`,
      );
    }

    try {
      getAuthTokens();
    } catch (_) {
      await login();
    }

    main();

    break;
  }
  case "whoami": {
    getAuthTokens();

    const whoamiRes = await fetch(
      "https://autoprovisioner.zerosync.co/api/whoami",
      {
        headers: {
          Authorization: `Bearer ${LocalState.accessToken?.value}`,
        },
      },
    );

    const whoami = await whoamiRes.json();
    console.log(whoami.id);

    break;
  }
  case "version": {
    console.log(VERSION);

    break;
  }
  default: {
    throw new Error(
      `Unknown command: ${cmd}. Expected 'init', 'run', 'whoami', or 'version'.`,
    );
  }
}
