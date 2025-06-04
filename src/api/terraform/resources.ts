import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectsClient } from "../../projects-client.ts";
import { getTRPCErrorMessage } from "../../utils.ts";
import {
  projectId,
  terraformProviderResource,
  terraformProviderSource,
} from "../../schemas.ts";

export function listTerraformProviderResources(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "list_tf_provider_sources",
    "List terraform provider sources documentation",
    { projectId },
    async (data) => {
      try {
        const providerSources = await projectsClient.projects.terraform
          .providerSources
          .query(
            data.projectId,
          );

        return {
          content: [{
            type: "resource",
            resource: {
              text: JSON.stringify({ providerSources }),
              uri: `TODO`,
              mimeType: "application/json",
              description: `List ${data.projectId} provider sources`,
            },
          }],
        };
      } catch (e) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: getTRPCErrorMessage(e),
          }],
        };
      }
    },
  );
}

export function listTerraformProviderResourceSchemas(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "list_tf_provider_resource_schemas",
    "List terraform provider resource schemas documentation",
    { projectId, providerSource: terraformProviderSource },
    async (data) => {
      try {
        const resourceSchemas = await projectsClient.projects
          .terraform.resourceSchemasByProviderSource
          .query(data);

        return {
          content: [{
            type: "resource",
            resource: {
              text: JSON.stringify({ resourceSchemas }),
              uri: `TODO`,
              mimeType: "application/json",
              description: `List ${data.projectId} provider resources`,
            },
          }],
        };
      } catch (e) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: getTRPCErrorMessage(e),
          }],
        };
      }
    },
  );
}

export function getTerraformProviderResourceSchemaDetails(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "get_tf_provider_resource_schema_details",
    "Get terraform provider resource schema details documentation",
    {
      projectId,
      providerSource: terraformProviderSource,
      resource: terraformProviderResource,
    },
    async (data) => {
      try {
        const resourceSchema = await projectsClient.projects.terraform
          .resourceSchemaDetails
          .query({
            projectId: data.projectId,
            providerSource: data.providerSource,
            resourceSchema: data.resource,
          });

        return {
          content: [{
            type: "resource",
            resource: {
              text: JSON.stringify(resourceSchema),
              uri: `TODO`,
              mimeType: "application/json",
              description: `Get ${data.projectId} provider resource details`,
            },
          }],
        };
      } catch (e) {
        return {
          isError: true,
          content: [{
            type: "text",
            text: getTRPCErrorMessage(e),
          }],
        };
      }
    },
  );
}
