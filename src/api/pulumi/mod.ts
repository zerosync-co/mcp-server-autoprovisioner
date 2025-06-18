import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProjectsClient } from "../../projects-client.ts";
import { getResource, listResources } from "./resources.ts";
import {
  applyInfrastructure,
  checkInfrastructureJob,
  getGitUrl,
  initializeProject,
  installDependency,
  listProjects,
  preview,
  readProjectFile,
  readProjectFs,
  writeToProject,
} from "./projects.ts";

export function registerPulumiApi(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  getResource(server, projectsClient);
  listResources(server, projectsClient);

  initializeProject(server, projectsClient);
  listProjects(server, projectsClient);
  readProjectFs(server, projectsClient);
  readProjectFile(server, projectsClient);
  writeToProject(server, projectsClient);
  installDependency(server, projectsClient);
  preview(server, projectsClient);
  applyInfrastructure(server, projectsClient);
  checkInfrastructureJob(server, projectsClient);

  getGitUrl(server, projectsClient);
}
