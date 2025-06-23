import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { digitalOceanDropletsDemo } from "./do-droplets.ts";

export function registerDemosApi(mcpServer: McpServer) {
  digitalOceanDropletsDemo(mcpServer);
}
