import { getTRPCErrorMessage } from "../../utils.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProjectsClient } from "../../projects-client.ts";
import {
  credentialKeys,
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
    "initialize_plm_project",
    "Create a new pulumi infrastructure project",
    {
      projectName,
      runtime: supportedRuntimesSchema,
      repositoryUrl: repositoryUrl.optional(),
      stackName: z.string().default("dev").describe(
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

export function listProjects(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "list_plm_projects",
    "list pulumi projects",
    async () => {
      try {
        const projectIds = await projectsClient.projects.pulumi.list.query();

        return {
          content: [{
            type: "resource",
            resource: {
              text: JSON.stringify({ projectIds }),
              uri: "resource template TODO",
              mimeType: "application/json",
              description: `List pulumi projects`,
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
    "read_plm_project_fs",
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
    "read_plm_project_file",
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
    "write_plm_configuration",
    "Write a pulumi configuration file",
    {
      projectId,
      filePath,
      fileContent,
      // validateAfterWrite ?
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
    "install_plm_project_dependency",
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
    "preview_plm_project",
    "Run pulumi preview for a given project and stack",
    {
      projectId,
      stackName: z.string().default("dev").describe(
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

export function getGitUrl(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "get_plm_project_git_clone_url",
    "Get a git-cloneable url for a pulumi project",
    {
      projectId,
    },
    async (data) => {
      try {
        const url = await projectsClient.projects.pulumi.getGitCloneUrl
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

export function applyInfrastructure(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "apply_plm_project_infrastructure",
    "Run 'pulumi up' for a given project and stack. This might take awhile",
    {
      projectId,
      stackName: z.string().default("dev").describe(
        "The associated stack name. Defaults to 'dev'.",
      ),
      credentialKeys,
    },
    async (data) => {
      try {
        const res = await projectsClient.projects.pulumi.up.mutate(
          data,
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify(res),
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

export function destroyInfrastructure(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "destroy_plm_project_infrastructure",
    "Run 'pulumi destroy' for a given project and stack. This will tear down all infrastructure",
    {
      projectId,
      stackName: z.string().default("dev").describe(
        "The associated stack name. Defaults to 'dev'.",
      ),
      credentialKeys,
    },
    async (data) => {
      try {
        const res = await projectsClient.projects.pulumi.destroy.mutate(
          data,
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify(res),
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

export function checkInfrastructureJob(
  server: McpServer,
  projectsClient: ProjectsClient,
) {
  server.tool(
    "poll_plm_project_infrastructure_job",
    "Check the status of an infrastructure job",
    {
      waitSeconds: z.number().default(30).describe(
        "Wait time in seconds until polling; default 30 seconds",
      ), // REVIEW-- http connection times out at 60 seconds. set max to 30 ?
      jobId: z.string().uuid().describe("Job ID"),
    },
    async (data) => {
      await new Promise((resolve) =>
        setTimeout(resolve, data.waitSeconds * 1000)
      );

      try {
        const res = await projectsClient.jobs.get.query(
          data.jobId,
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify(res),
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
