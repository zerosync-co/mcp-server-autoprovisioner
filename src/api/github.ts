import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Octokit } from "octokit";
import { repositoryName, repositoryOwner } from "../schemas.ts";
import { filePath } from "../schemas.ts";

// FIXME--
async function getGithubToken(
  projectClientBaseUrl: string,
  getBearerToken: () => Promise<string>,
) {
  try {
    const token = await getBearerToken();
    const res = await fetch(`${projectClientBaseUrl}/github_token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json() as any;
    return json.accessToken as string;
  } catch (e) {
    console.warn("failed to resolve github token;", e);
    return undefined;
  }
}

function readGithubProjectFs(
  server: McpServer,
  projectClientBaseUrl: string,
  getBearerToken: () => Promise<string>,
) {
  server.tool(
    "read_github_project_fs",
    "Read the top-level files of a GitHub project",
    {
      owner: repositoryOwner,
      repo: repositoryName,
    },
    async (data) => {
      const token = await getGithubToken(projectClientBaseUrl, getBearerToken);

      // refactor to just use fetch
      const response = await new Octokit({ auth: token }).rest
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
  projectClientBaseUrl: string,
  getBearerToken: () => Promise<string>,
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
      const token = await getGithubToken(projectClientBaseUrl, getBearerToken);
      const response = await new Octokit({ auth: token }).rest
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
  projectClientBaseUrl: string,
  getBearerToken: () => Promise<string>,
) {
  readGithubProjectFs(server, projectClientBaseUrl, getBearerToken);
  readGithubProjectFile(server, projectClientBaseUrl, getBearerToken);
}
