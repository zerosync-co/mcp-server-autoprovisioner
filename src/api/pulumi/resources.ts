/*
 * This file is adapted from registry.ts in the pulumi/mcp-server project
 * (https://github.com/pulumi/mcp-server/blob/main/src/pulumi/registry.ts).
 * Original Author: Pulumi Corporation
 * Copyright (c) 2025 Pulumi Corporation
 * License: Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Modifications made by ZeroSync, Inc. for https://github.com/zerosync-co/mcp-server-autoprovisioner.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProjectsClient } from "../../projects-client.ts";

type ResourceProperty = {
  type: string;
  description: string;
};

type ResourceSchema = {
  description: string;
  properties: Record<string, ResourceProperty>;
  required: string[];
  inputProperties: Record<string, ResourceProperty>;
  requiredInputs: string[];
};

type Schema = {
  name: string;
  resources: Record<string, ResourceSchema>;
};

function formatSchema(
  resourceKey: string,
  resourceData: ResourceSchema,
): string {
  const inputProperties = Object.entries(resourceData.inputProperties ?? {})
    .sort(([nameA], [nameB]) => {
      const isRequiredA = (resourceData.requiredInputs ?? []).includes(nameA);
      const isRequiredB = (resourceData.requiredInputs ?? []).includes(nameB);
      if (isRequiredA !== isRequiredB) {
        return isRequiredA ? -1 : 1;
      }
      return nameA.localeCompare(nameB);
    })
    .map(([name, prop]) => {
      const isRequired = (resourceData.requiredInputs ?? []).includes(name);
      return `- ${name} (${prop.type}${isRequired ? ", required" : ""}): ${
        prop.description ?? "<no description>"
      }`;
    })
    .join("\n");

  const outputProperties = Object.entries(resourceData.properties ?? {})
    .sort(([nameA], [nameB]) => {
      const isRequiredA = (resourceData.required ?? []).includes(nameA);
      const isRequiredB = (resourceData.required ?? []).includes(nameB);
      if (isRequiredA !== isRequiredB) {
        return isRequiredA ? -1 : 1;
      }
      return nameA.localeCompare(nameB);
    })
    .map(([name, prop]) => {
      const isRequired = (resourceData.required ?? []).includes(name);
      return `- ${name} (${prop.type}${
        isRequired ? ", always present" : ""
      }): ${prop.description ?? "<no description>"}`;
    })
    .join("\n");

  return `
Resource: ${resourceKey}

${resourceData.description ?? "<no description>"}

Input Properties:
${inputProperties}

Output Properties:
${outputProperties}
`;
}

export function getResource(server: McpServer, projectsClient: ProjectsClient) {
  server.tool(
    "get_pulumi_resource",
    "Get information about a specific resource from the Pulumi Registry",
    {
      provider: z
        .string()
        .describe(
          "The cloud provider (e.g., 'aws', 'azure', 'gcp', 'random') or github.com/org/repo for Git-hosted components",
        ),
      module: z
        .string()
        .optional()
        .describe(
          "The module to query (e.g., 's3', 'ec2', 'lambda'). Optional for smaller providers, will be 'index by default.",
        ),
      resource: z
        .string()
        .describe(
          "The resource type to query (e.g., 'Bucket', 'Function', 'Instance')",
        ),
    },
    async (data) => {
      const schema = await projectsClient.projects.pulumi.getSchema.query(
        data.provider,
      ) as Schema;

      const resourceEntry = Object.entries(schema.resources).find(([key]) => {
        const [, modulePath, resourceName] = key.split(":");
        const mainModule = modulePath.split("/")[0];

        if (data.module) {
          return mainModule === data.module && resourceName === data.resource;
        } else {
          return resourceName === data.resource;
        }
      });

      if (resourceEntry) {
        const [resourceKey, resourceData] = resourceEntry;

        return {
          description: "Returns information about Pulumi Registry resources",
          content: [
            {
              type: "text" as const,
              text: formatSchema(resourceKey, resourceData),
            },
          ],
        };
      } else {
        const availableResources = Object.keys(schema.resources)
          .map((key) => key.split(":").pop())
          .filter(Boolean);

        return {
          description: "Returns information about Pulumi Registry resources", // Consider making this more specific, e.g., "Resource not found"
          content: [
            {
              type: "text" as const,
              text: `No information found for ${data.resource}${
                data.module ? ` in module ${data.module}` : ""
              }. Available resources: ${availableResources.join(", ")}`,
            },
          ],
        };
      }
    },
  );
}

export function listResources(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "list_pulumi_resources",
    "List all resource types for a given provider and module",
    {
      provider: z
        .string()
        .describe(
          "The cloud provider (e.g., 'aws', 'azure', 'gcp', 'random') or github.com/org/repo for Git-hosted components",
        ),
      module: z
        .string()
        .optional()
        .describe("Optional module to filter by (e.g., 's3', 'ec2', 'lambda')"),
    },
    async (data) => {
      const schema = await projectsClient.projects.pulumi.getSchema.query(
        data.provider,
      ) as Schema;

      // Filter and format resources
      const resources = Object.entries(schema.resources)
        .filter(([key]) => {
          if (data.module) {
            const [, modulePath] = key.split(":");
            const mainModule = modulePath.split("/")[0];
            return mainModule === data.module;
          }
          return true;
        })
        .map(([key, resource]) => {
          const resourceName = key.split(":").pop() || "";
          const modulePath = key.split(":")[1];
          const mainModule = modulePath.split("/")[0];
          // Trim description at first '#' character
          const shortDescription =
            resource.description?.split("\n")[0].trim() ?? "<no description>";
          return {
            name: resourceName,
            module: mainModule,
            description: shortDescription,
          };
        });

      if (resources.length === 0) {
        return {
          description: "No resources found",
          content: [
            {
              type: "text" as const,
              text: data.module
                ? `No resources found for provider '${data.provider}' in module '${data.module}'`
                : `No resources found for provider '${data.provider}'`,
            },
          ],
        };
      }

      const resourceList = resources
        .map((r) => `- ${r.name} (${r.module})\n  ${r.description}`)
        .join("\n\n");

      return {
        description: "Lists available Pulumi Registry resources",
        content: [
          {
            type: "text" as const,
            text: data.module
              ? `Available resources for ${data.provider}/${data.module}:\n\n${resourceList}`
              : `Available resources for ${data.provider}:\n\n${resourceList}`,
          },
        ],
      };
    },
  );
}
