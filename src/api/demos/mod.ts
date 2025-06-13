import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pulumiDODropletsDemo } from "./pulumi-do-droplets.ts";

export function registerDemosApi(mcpServer: McpServer) {
  pulumiDODropletsDemo(mcpServer);
}
