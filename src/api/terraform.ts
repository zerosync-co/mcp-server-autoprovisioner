import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectsClient } from "../projects-client.ts";
import { getTRPCErrorMessage } from "../utils.ts";
import {
  projectId,
  provider,
  terraformProviderName,
  terraformProviderNamespace,
  terraformProviderResource,
  terraformProviderSource,
  terraformProviderVersion,
} from "../schemas.ts";

const OPENTOFU_REGISTRY_API_BASE_URL = "https://api.opentofu.org";

function listTerraformProviderResources(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "list_terraform_provider_sources",
    "List terraform provider sources documentation",
    { projectId },
    async (data) => {
      try {
        const providerSources = await projectsClient.projects.providerSources
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

function listTerraformProviderResourceSchemas(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "list_terraform_provider_resource_schemas",
    "List terraform provider resource schemas documentation",
    { projectId, providerSource: terraformProviderSource },
    async (data) => {
      try {
        const resourceSchemas = await projectsClient.projects
          .resourceSchemasByProviderSource
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

function getTerraformProviderResourceSchemaDetails(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "get_terraform_provider_resource_schema_details",
    "Get terraform provider resource schema details documentation",
    {
      projectId,
      providerSource: terraformProviderSource,
      resource: terraformProviderResource,
    },
    async (data) => {
      try {
        const resourceSchema = await projectsClient.projects
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

function searchTerraformProviders(
  server: McpServer,
) {
  server.tool(
    "search_terraform_providers",
    "Search for terraform registry documentation describing a provider",
    { provider },
    async (data) => {
      try {
        const res = await fetch(
          `${OPENTOFU_REGISTRY_API_BASE_URL}/registry/docs/search?q=${
            encodeURIComponent(data.provider)
          }`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!res.ok) {
          return {
            isError: true,
            content: [{
              type: "text",
              text: `failed to search providers; ${res.statusText}`,
            }],
          };
        }

        const results = await res.json() as any[];
        if (!results?.length) {
          return {
            isError: true,
            content: [{
              type: "text",
              text: `No results found`,
            }],
          };
        }

        // TODO-- resource
        return {
          content: [{
            type: "text",
            text: JSON.stringify(
              results.length > 3 ? results.slice(0, 3) : results,
            ),
            mimeType: "application/json",
          }],
        };
      } catch (e) {
        console.error("failed to search providers;", e);

        return {
          isError: true,
          content: [{
            type: "text",
            text: `Something went wrong`,
          }],
        };
      }
    },
  );
}

function getProviderTerraformInformation(server: McpServer) {
  server.tool(
    "get_provider_terraform_information",
    "Get high level provider terraform documentation",
    {
      namespace: terraformProviderNamespace,
      name: terraformProviderName,
      version: terraformProviderVersion,
    },
    async (data) => {
      try {
        const res = await fetch(
          `${OPENTOFU_REGISTRY_API_BASE_URL}/registry/docs/providers/${data.namespace}/${data.name}/${data.version}/index.md`,
        );

        if (!res.ok) {
          return {
            isError: true,
            content: [{
              type: "text",
              text: `failed to get provider index document; ${res.statusText}`,
            }],
          };
        }

        return {
          content: [{
            type: "text",
            text: await res.text(),
          }],
        };
      } catch (e) {
        console.error("failed to get provider index document;", e);

        return {
          isError: true,
          content: [{
            type: "text",
            text: `Something went wrong`,
          }],
        };
      }
    },
  );
}

export function registerTerraformApi(
  mcpServer: McpServer,
  projectsClient: ProjectsClient,
) {
  listTerraformProviderResources(mcpServer, projectsClient);
  listTerraformProviderResourceSchemas(mcpServer, projectsClient);
  getTerraformProviderResourceSchemaDetails(mcpServer, projectsClient);
  searchTerraformProviders(mcpServer);
  getProviderTerraformInformation(mcpServer);
}
