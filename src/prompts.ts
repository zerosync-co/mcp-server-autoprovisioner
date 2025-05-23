import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function deployTerraformProjectPrompt(server: McpServer) {
  server.prompt(
    "deploy_terraform_project",
    "Instructions for deploying infrastructure written in terraform with AutoProvisioner",
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
}
