import { getTRPCErrorMessage } from "../../utils.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProjectsClient } from "../../projects-client.ts";
import {
  fileContent,
  filePath,
  projectId,
  projectName,
  repositoryUrl,
} from "../../schemas.ts";
import { z } from "zod";

// https://www.pulumi.com/docs/iac/languages-sdks/
const supportedRuntimes = ["nodejs"] as const;
const supportedRuntimesSchema = z.enum(supportedRuntimes).describe(
  `The Pulumi runtime (e.g., ${
    supportedRuntimes.map((v) => `'${v}'`).join(", ")
  })`,
);

export function initializeProject(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "initialize_pulumi_project",
    "Create a new pulumi infrastructure project",
    {
      projectName,
      runtime: supportedRuntimesSchema,
      repositoryUrl: repositoryUrl.optional(),
      stackName: z.string().optional().describe(
        "The associated stack name. Defaults to 'dev'.",
      ),
    },
    async (data) => {
      try {
        const projectId = await projectsClient.projects.pulumi.create.mutate(
          {
            name: data.projectName,
            runtime: data.runtime,
            repositoryUrl: data.repositoryUrl,
            stackName: data.stackName,
          },
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ projectId }),
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

export function readProjectFs(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "read_pulumi_project_fs",
    "Read the top-level files of a pulumi project",
    { projectId },
    async (data) => {
      try {
        const files = await projectsClient.projects.pulumi.byId.query(
          data.projectId,
        );

        return {
          content: [{
            type: "resource",
            resource: {
              text: JSON.stringify({ files }),
              uri: "resource template TODO",
              mimeType: "application/json",
              description: `Read ${data.projectId} file structure`,
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

export function readProjectFile(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "read_pulumi_project_file",
    "Read the contents of a pulumi project file",
    { projectId, filePath },
    async (data) => {
      try {
        const file = await projectsClient.projects.pulumi.fileByPath.query(
          data,
        );

        return {
          content: [{
            type: "resource",
            resource: {
              text: file,
              uri: "resource template TODO",
              mimeType: "text/plain",
              description:
                `Read ${data.projectId} ${data.filePath} file contents`,
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

export function writeToProject(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "write_pulumi_configuration",
    "Write a pulumi configuration file",
    {
      projectId,
      filePath,
      fileContent,
    },
    async (data) => {
      try {
        await projectsClient.projects.pulumi.write.mutate({
          projectId: data.projectId,
          filePath: data.filePath,
          content: data.fileContent,
        });

        return {
          content: [{
            type: "text",
            text: "Success",
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

export function installDependency(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "install_pulumi_project_dependency",
    "Install pulumi infrastructure project dependency",
    {
      projectId,
      runtime: supportedRuntimesSchema, // FIXME-- should not have to pass this again
      dependency: z.string().describe(
        "The dependency (e.g., '@pulumi/cloudflare')",
      ),
    },
    async (data) => {
      try {
        await projectsClient.projects.pulumi.installDependency.mutate(
          {
            projectId: data.projectId,
            runtime: data.runtime,
            dependency: data.dependency,
          },
        );

        return {
          content: [{
            type: "text",
            text: "Success",
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

export function preview(server: McpServer, projectsClient: ProjectsClient) {
  server.tool(
    "preview_pulumi_project",
    "Run pulumi preview for a given project and stack",
    {
      projectId,
      stackName: z.string().optional().describe(
        "The associated stack name. Defaults to 'dev'.",
      ),
    },
    async (data) => {
      try {
        const previewRes = await projectsClient.projects.pulumi.preview.query(
          data,
        );

        return {
          content: [{
            type: "text",
            text: previewRes,
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
