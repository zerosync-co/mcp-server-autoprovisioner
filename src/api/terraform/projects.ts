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
    "initialize_tf_project",
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

export function listProjects(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "list_tf_projects",
    "list terraform projects",
    async () => {
      try {
        const projectIds = await projectsClient.projects.terraform.list.query();

        return {
          content: [{
            type: "resource",
            resource: {
              text: JSON.stringify({ projectIds }),
              uri: "resource template TODO",
              mimeType: "application/json",
              description: `List terraform projects`,
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

export function readProjectFs(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "read_tf_project_fs",
    "Read the top-level files of a terraform project",
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

export function readProjectFile(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "read_tf_project_file",
    "Read the contents of a terraform project file",
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

export function writeToProject(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "write_tf_configuration",
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

export function getGitUrl(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "get_tf_project_git_clone_url",
    "Get a git-cloneable url for a terraform project",
    {
      projectId,
    },
    async (data) => {
      try {
        const url = await projectsClient.projects.terraform.getGitCloneUrl
          .query(data.projectId);

        return {
          content: [{
            type: "resource",
            resource: {
              text: url,
              uri: "resource template TODO",
              mimeType: "text",
              description: `${data.projectId} git-cloneable url`,
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
