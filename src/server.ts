import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createMCPServer() {
  return new McpServer(
    { name: "AutoProvisioner", version: "0.1.0" },
    {
      instructions:
        "Utilize AutoProvisioner to automate production deployments, server setup, configuration management, and resource allocation",
    },
  );
}
