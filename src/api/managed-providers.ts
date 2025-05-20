import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function listManagedProviders(
  server: McpServer,
) {
  server.tool(
    "list_managed_providers",
    "List providers that have the option to be deployed without external credentials",
    () => ({
      content: [{
        type: "resource",
        resource: {
          text: JSON.stringify(["cloudflare"]),
          uri: "list managed providers TODO",
          mimeType: "application/json",
          // description: `Get an example terraform configuration directory`,
        },
      }],
    }),
  );
}

export function registerManagedProvidersApi(server: McpServer) {
  listManagedProviders(server);
}
