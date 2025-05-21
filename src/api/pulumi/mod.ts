import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProjectsClient } from "../../projects-client.ts";
import { getResource } from "./resources.ts";

export function registerPulumiApi(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  getResource(server, projectsClient);
}
