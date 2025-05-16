import {
  init,
  login,
  SupportedMcpClient,
  supportedMcpClients,
  supportedMcpClientsSchema,
} from "./init.ts";
import { main } from "./main.ts";
import { getAuthTokens } from "./utils.ts";

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
}

if (!cmd?.length) {
  printUsage();
  Deno.exit(0);
}

if (cmd === "init") {
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
} else if (cmd === "run") {
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
} else {
  throw new Error(`Unknown command: ${cmd}. Expected 'init' or 'run'.`);
}
