import { McpServer } from "@modelcontextprotocol/sdk";
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
  getGitUrl,
  initializeInfrastructureProject,
  listProjects,
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
