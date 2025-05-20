import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Octokit } from "octokit";
import { TF_SERVICE_BASE_URL } from "../env.ts";
import { getInitializedLocalState } from "../utils.ts";
import { repositoryName, repositoryOwner } from "../schemas.ts";
import { filePath } from "../schemas.ts";

// FIXME--
async function getGithubToken() {
  const localState = await getInitializedLocalState();
  const res = await fetch(`${TF_SERVICE_BASE_URL}/github_token`, {
    headers: {
      Authorization: `Bearer ${localState.accessToken?.value}`,
    },
  });

  const json = await res.json() as any;
  return json.accessToken as string;
}

function readGithubProjectFs(server: McpServer) {
  server.tool(
    "read_github_project_fs",
    "Read the top-level files of a GitHub project",
    {
      owner: repositoryOwner,
      repo: repositoryName,
    },
    async (data) => {
      const token = await getGithubToken();
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

function readGithubProjectFile(server: McpServer) {
  server.tool(
    "read_github_project_file",
    "Read the contents of a GitHub project file",
    {
      owner: repositoryOwner,
      repo: repositoryName,
      filePath,
    },
    async (data) => {
      const token = await getGithubToken();
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

export function registerGithubApi(server: McpServer) {
  readGithubProjectFs(server);
  readGithubProjectFile(server);
}
