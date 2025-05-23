import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectsClient } from "../../projects-client.ts";
import { getTRPCErrorMessage } from "../../utils.ts";
import { directory, filePath, provider } from "../../schemas.ts";

export function listExamples(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "list_terraform_project_examples",
    "List example terraform configuration directories",
    {
      provider,
    },
    async (data) => {
      try {
        const examples = await projectsClient.examples.byProvider.query(
          data.provider,
        );

        return {
          content: [{
            type: "resource",
            resource: {
              text: JSON.stringify({ examples }),
              uri: "resource template TODO",
              mimeType: "application/json",
              description: `List example terraform configuration directories`,
              // TODO-- add dynamic details
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

export function getTerraformExampleDirectory(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "get_terraform_project_example_directory",
    "Get an example terraform configuration directory",
    { provider, directory },
    async (data) => {
      try {
        const files = await projectsClient.examples.directoryByPath.query({
          provider: data.provider,
          directoryPath: data.directory,
        });

        return {
          content: [{
            type: "resource",
            resource: {
              text: JSON.stringify({ files }),
              uri: "resource template TODO",
              mimeType: "application/json",
              description: `Get an example terraform configuration directory`,
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

export function getTerraformExampleDirectoryFile(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "get_terraform_project_example_directory_file",
    "Get a file from an example terraform configuration directory",
    {
      provider,
      directory,
      filePath,
    },
    async (data) => {
      try {
        const file = await projectsClient.examples.fileByPath.query({
          provider: data.provider,
          directoryPath: data.directory,
          filePath: data.filePath,
        });

        return {
          content: [{
            type: "resource",
            resource: {
              text: file,
              uri: "resource template TODO",
              mimeType: "application/json",
              description:
                `Get a file from an example terraform configuration directory`,
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
