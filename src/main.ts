import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Octokit } from "octokit";
import { getInitializedLocalState } from "./utils.ts";
import type { AppRouter } from "@autoprovisioner/tf-service";
import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import { TF_SERVICE_BASE_URL } from "./env.ts";

const OPENTOFU_REGISTRY_API_BASE_URL = "https://api.opentofu.org";

const tfService = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${TF_SERVICE_BASE_URL}/trpc`,
      headers: async () => {
        const localState = await getInitializedLocalState();

        return {
          Authorization: `Bearer ${localState.accessToken?.value}`,
        };
      },
    }),
  ],
});

const server = new McpServer(
  { name: "AutoProvisioner", version: "0.1.0" },
  {
    instructions:
      "Utilize AutoProvisioner to automate production deployments, server setup, configuration management, and resource allocation",
  },
);

function getTRPCErrorMessage(e: unknown): string {
  return e instanceof TRPCClientError ? e.message : "Internal Server Error";
}

// TODO-- llm can read tf state, this should not happen

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

server.tool(
  "read_github_project_fs",
  "Read the top-level files of a GitHub project",
  {
    owner: z.string().describe("GitHub repository owner"),
    repo: z.string().describe("GitHub repository name"),
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

server.tool(
  "read_github_project_file",
  "Read the contents of a GitHub project file",
  {
    owner: z.string().describe("GitHub repository owner"),
    repo: z.string().describe("GitHub repository name"),
    filePath: z.string().describe("GitHub repository file path"),
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

server.tool(
  "initialize_infrastructure_project",
  "Create a new terraform infrastructure project",
  {
    projectName: z.string(),
    providerContents: z.string(),
    repositoryUrl: z.string().optional(),
  },
  async (data) => {
    try {
      const projectId = await tfService.projects.create.mutate({
        name: data.projectName,
        providerContents: data.providerContents,
        repositoryUrl: data.repositoryUrl,
      });

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

server.tool(
  "read_infrastructure_project_fs",
  "Read the top-level files of an infrastructure project",
  { projectId: z.string() },
  async (data) => {
    try {
      const files = await tfService.projects.byId.query(data.projectId);

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

server.tool(
  "read_infrastructure_project_file",
  "Read the contents of an infrastructure project file",
  { projectId: z.string(), filePath: z.string() },
  async (data) => {
    try {
      const file = await tfService.projects.fileByPath.query(data);

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

server.tool(
  "list_provider_sources",
  "List terraform provider sources documentation",
  { projectId: z.string() },
  async (data) => {
    try {
      const providerSources = await tfService.projects.providerSources.query(
        data.projectId,
      );

      return {
        content: [{
          type: "resource",
          resource: {
            text: JSON.stringify({ providerSources }),
            uri: `TODO`,
            mimeType: "application/json",
            description: `List ${data.projectId} provider sources`,
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

server.tool(
  "list_provider_resource_schemas",
  "List terraform provider resource schemas documentation",
  { projectId: z.string(), providerSource: z.string() },
  async (data) => {
    try {
      const resourceSchemas = await tfService.projects
        .resourceSchemasByProviderSource
        .query(data);

      return {
        content: [{
          type: "resource",
          resource: {
            text: JSON.stringify({ resourceSchemas }),
            uri: `TODO`,
            mimeType: "application/json",
            description: `List ${data.projectId} provider resources`,
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

server.tool(
  "get_provider_resource_schema_details",
  "Get terraform provider resource schema details documentation",
  { projectId: z.string(), providerSource: z.string(), resource: z.string() },
  async (data) => {
    try {
      const resourceSchema = await tfService.projects.resourceSchemaDetails
        .query({
          projectId: data.projectId,
          providerSource: data.providerSource,
          resourceSchema: data.resource,
        });

      return {
        content: [{
          type: "resource",
          resource: {
            text: JSON.stringify(resourceSchema),
            uri: `TODO`,
            mimeType: "application/json",
            description: `Get ${data.projectId} provider resource details`,
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

server.tool(
  "search_terraform_providers",
  "Search for terraform registry documentation describing a provider",
  { provider: z.string() },
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

server.tool(
  "get_provider_terraform_information",
  "Get high level provider terraform documentation",
  { namespace: z.string(), name: z.string(), version: z.string() },
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

server.prompt(
  "deploy_infrastructure_project",
  "Instructions for deploying infrastructure with AutoProvisioner",
  { description: z.string() },
  (args) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            text: `Before proceeding:
              - verify that the description "${args.description}" is for a backend project (e.g., infrastructure projects, servers, serverless functions, databases, queues, etc)
              - if it is not a backend project, notify the user and do not proceed with AutoProvisioner (this tool)`,
            type: "text",
          },
        },
        {
          role: "user",
          content: {
            text: `description: ${args.description}`,
            // description = "intialize an infrastructure project for ${repoUrl}",
            // description = "create a cloudflare queue",
            type: "text",
          },
        },
        {
          // what if the role is assistant for everything other than description step
          role: "user",
          content: {
            // TODO-- ADD COSTS INFORMATION
            // if the providers are managed, show that as a seperate sub option also with costs (zerosync managed = 'free ish')
            //
            text: `step 1:
              - determine provider options that suit the task
              - list providers that can be managed
              - if a provider option can be managed, all deployment complexity will be managed by AutoProvisioner (this tool) through terraform; add that sub detail when presenting options
              - ask the user which provider(s) to use and give tradeoffs for each
              - do not ask the user about specific deployment strategies; AutoProvisioner (this tool) uses terraform`,
            type: "text",
          },
        },
        {
          role: "user",
          content: {
            text: `step 2:
              - using the provider(s) the user has selected:
              - search for the provider(s) registry links
              - get the provider(s) registry details for up to date documentation
              - initialize an infrastructure project
              - a default set of locals will be automatically created; do not pass them
              - provide the repository url if applicable`,
            type: "text",
          },
        },
        {
          role: "user",
          content: {
            text: `step 3:
              - read initialized infrastructure project structure and files
              - read example repositories
              - collect relevant documentation and schemas
              - prioritize using examples
              - pay special attention to the notes within example files`,
            type: "text",
          },
        },
        {
          role: "user",
          content: {
            text: `step 4:
              - create a plan of which terraform files you will write
              - assume that this project will be utilized to deploy to production
              - a public url is required with the format <project id>.<base domain>
              - do not utilize any other urls
              - utilize the locals that were automatically created after project init`,
            type: "text",
          },
        },
        {
          role: "user",
          content: {
            text: `step 5:
              - write the plan to the infrastructure project`,
            type: "text",
          },
        },
        {
          role: "user",
          content: {
            text: `step 6:
              - if the user chose a provider that can be managed, ask if they want to automatically deploy and no variables will need to be provided
              - if not, provide the user with instructions to get the required variables and deploy themselves`,
            type: "text",
          },
        },
      ],
    };
  },
);

server.tool(
  "list_infrastructure_project_examples",
  "List example terraform configuration directories",
  { provider: z.string() },
  async (data) => {
    try {
      const examples = await tfService.examples.byProvider.query(data.provider);

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

// enable user to input creds also
server.tool(
  "list_managed_providers",
  "List providers that have the option to be deployed without external credentials",
  () => ({
    content: [{
      type: "resource",
      resource: {
        text: JSON.stringify(["cloudflare"]),
        uri: "list managed providers TODO",
        mimeType: "application/json",
        // description: `Get an example terraform configuration directory`,
      },
    }],
  }),
);

server.tool(
  "get_infrastructure_project_example_directory",
  "Get an example terraform configuration directory",
  { provider: z.string(), dirPath: z.string() },
  async (data) => {
    try {
      const files = await tfService.examples.directoryByPath.query({
        provider: data.provider,
        directoryPath: data.dirPath,
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

server.tool(
  "get_infrastructure_project_example_directory_file",
  "Get a file from an example terraform configuration directory",
  {
    provider: z.string(),
    dirPath: z.string(),
    filePath: z.string(),
  },
  async (data) => {
    try {
      const file = await tfService.examples.fileByPath.query({
        provider: data.provider,
        directoryPath: data.dirPath,
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

server.tool(
  "write_project_infrastructure",
  "Write a terraform configuration file",
  {
    projectId: z.string(),
    filePath: z.string(),
    fileContent: z.string(),
  },
  async (data) => {
    try {
      await tfService.projects.write.mutate({
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

server.tool(
  "apply_project_infrastructure",
  "Apply a terraform infrastructure project",
  {
    // instead of checking if provider(s) are managed
    // need to check if sensitive project vars exist in backend ?
    projectId: z.string(),
  },
  async (data) => {
    try {
      await tfService.projects.applyInfrastructure.mutate(data.projectId);

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

server.tool(
  "destroy_project_infrastructure",
  "Destroy a terraform infrastructure project",
  {
    projectId: z.string(),
  },
  async (data) => {
    try {
      await tfService.projects.destroyInfrastructure.mutate(data.projectId);

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

export async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (_error) {
    Deno.exit(1);
  }
}
