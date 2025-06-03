import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Octokit } from "octokit";
import { repositoryName, repositoryOwner } from "../schemas.ts";
import { filePath } from "../schemas.ts";

function readGithubProjectFs(
  server: McpServer,
  getBearerToken: () => string | undefined,
) {
  server.tool(
    "read_github_project_fs",
    "Read the top-level files of a GitHub project",
    {
      owner: repositoryOwner,
      repo: repositoryName,
    },
    async (data) => {
      const response = await new Octokit({ auth: getBearerToken() }).rest
        .repos.getContent({
          owner: data.owner,
          repo: data.repo,
          path: "",
        });

      const files = response.data as unknown as any[];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            files: files.filter((item) => item.type === "file"),
          }),
        }],
      };
    },
  );
}

function readGithubProjectFile(
  server: McpServer,
  getBearerToken: () => string | undefined,
) {
  server.tool(
    "read_github_project_file",
    "Read the contents of a GitHub project file",
    {
      owner: repositoryOwner,
      repo: repositoryName,
      filePath,
    },
    async (data) => {
      const response = await new Octokit({ auth: getBearerToken() }).rest
        .repos.getContent({
          owner: data.owner,
          repo: data.repo,
          path: data.filePath,
          mediaType: {
            format: "raw",
          },
        });
      const fileData = response.data as any;

      return {
        content: [{
          type: "text",
          text: JSON.stringify(
            fileData,
          ),
        }],
      };
    },
  );
}

export function registerGithubApi(
  server: McpServer,
  getBearerToken: () => string | undefined,
) {
  readGithubProjectFs(server, getBearerToken);
  readGithubProjectFile(server, getBearerToken);
}
