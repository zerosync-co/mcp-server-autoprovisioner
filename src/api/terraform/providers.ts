import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  provider,
  terraformProviderName,
  terraformProviderNamespace,
  terraformProviderVersion,
} from "../../schemas.ts";

const OPENTOFU_REGISTRY_API_BASE_URL = "https://api.opentofu.org";

export function searchTerraformProviders(
  server: McpServer,
) {
  server.tool(
    "search_tf_providers",
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

export function getProviderTerraformInformation(server: McpServer) {
  server.tool(
    "get_provider_tf_information",
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
