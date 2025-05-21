import { getTRPCErrorMessage } from "../../utils.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProjectsClient } from "../../projects-client.ts";
import {
  fileContent,
  filePath,
  projectId,
  projectName,
  providerContents,
  repositoryUrl,
} from "../../schemas.ts";

export function initializeInfrastructureProject(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "initialize_infrastructure_project",
    "Create a new terraform infrastructure project",
    {
      projectName,
      providerContents,
      repositoryUrl: repositoryUrl.optional(),
    },
    async (data) => {
      try {
        const projectId = await projectsClient.projects.terraform.create.mutate(
          {
            name: data.projectName,
            providerContents: data.providerContents,
            repositoryUrl: data.repositoryUrl,
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

export function readInfrastructureProjectFs(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "read_infrastructure_project_fs",
    "Read the top-level files of an infrastructure project",
    { projectId },
    async (data) => {
      try {
        const files = await projectsClient.projects.terraform.byId.query(
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

export function readInfrastructureProjectFile(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "read_infrastructure_project_file",
    "Read the contents of an infrastructure project file",
    { projectId, filePath },
    async (data) => {
      try {
        const file = await projectsClient.projects.terraform.fileByPath.query(
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

export function writeProjectInfrastructure(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "write_project_infrastructure",
    "Write a terraform configuration file",
    {
      projectId,
      filePath,
      fileContent,
    },
    async (data) => {
      try {
        await projectsClient.projects.terraform.write.mutate({
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

export function applyProjectInfrastructure(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "apply_project_infrastructure",
    "Apply a terraform infrastructure project",
    {
      // instead of checking if provider(s) are managed
      // need to check if sensitive project vars exist in backend ?
      projectId,
    },
    async (data) => {
      try {
        await projectsClient.projects.terraform.applyInfrastructure.mutate(
          data.projectId,
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
export function destroyProjectInfrastructure(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "destroy_project_infrastructure",
    "Destroy a terraform infrastructure project",
    {
      projectId,
    },
    async (data) => {
      try {
        await projectsClient.projects.terraform.destroyInfrastructure.mutate(
          data.projectId,
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
