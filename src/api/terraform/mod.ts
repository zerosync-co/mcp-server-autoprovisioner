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
  applyProjectInfrastructure,
  destroyProjectInfrastructure,
  initializeInfrastructureProject,
  readInfrastructureProjectFile,
  readInfrastructureProjectFs,
  writeProjectInfrastructure,
} from "./projects.ts";

export function registerTerraformApi(
  mcpServer: McpServer,
  projectsClient: ProjectsClient,
) {
  initializeInfrastructureProject(mcpServer, projectsClient);
  readInfrastructureProjectFs(mcpServer, projectsClient);
  readInfrastructureProjectFile(mcpServer, projectsClient);
  writeProjectInfrastructure(mcpServer, projectsClient);
  applyProjectInfrastructure(mcpServer, projectsClient);
  destroyProjectInfrastructure(mcpServer, projectsClient);

  listTerraformProviderResources(mcpServer, projectsClient);
  listTerraformProviderResourceSchemas(mcpServer, projectsClient);
  getTerraformProviderResourceSchemaDetails(mcpServer, projectsClient);

  searchTerraformProviders(mcpServer);
  getProviderTerraformInformation(mcpServer);
}
