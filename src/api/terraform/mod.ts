import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProjectsClient } from "../../projects-client.ts";
import {
  getTerraformProviderResourceSchemaDetails,
  listTerraformProviderResources,
  listTerraformProviderResourceSchemas,
} from "./resources.ts";
import {
  getProviderTerraformInformation,
  searchTerraformProviders,
} from "./providers.ts";
import {
  applyInfrastructure,
  checkInfrastructureJob,
  destroyInfrastructure,
  getGitUrl,
  initializeInfrastructureProject,
  listProjects,
  planInfrastructure,
  readProjectFile,
  readProjectFs,
  writeToProject,
} from "./projects.ts";
import {
  getTerraformExampleDirectory,
  getTerraformExampleDirectoryFile,
  listExamples,
} from "./examples.ts";

export function registerTerraformApi(
  mcpServer: McpServer,
  projectsClient: ProjectsClient,
) {
  initializeInfrastructureProject(mcpServer, projectsClient);
  listProjects(mcpServer, projectsClient);
  readProjectFs(mcpServer, projectsClient);
  readProjectFile(mcpServer, projectsClient);
  writeToProject(mcpServer, projectsClient);
  planInfrastructure(mcpServer, projectsClient);
  applyInfrastructure(mcpServer, projectsClient);
  destroyInfrastructure(mcpServer, projectsClient);
  checkInfrastructureJob(mcpServer, projectsClient);

  listTerraformProviderResources(mcpServer, projectsClient);
  listTerraformProviderResourceSchemas(mcpServer, projectsClient);
  getTerraformProviderResourceSchemaDetails(mcpServer, projectsClient);

  searchTerraformProviders(mcpServer);
  getProviderTerraformInformation(mcpServer);

  listExamples(mcpServer, projectsClient);
  getTerraformExampleDirectory(mcpServer, projectsClient);
  getTerraformExampleDirectoryFile(mcpServer, projectsClient);

  getGitUrl(mcpServer, projectsClient);
}
