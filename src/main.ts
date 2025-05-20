import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGithubApi } from "./api/github.ts";
import { registerExamplesApi } from "./api/examples.ts";
import { registerManagedProvidersApi } from "./api/managed-providers.ts";
import { registerProjectsApi } from "./api/projects.ts";
import { registerTerraformApi } from "./api/terraform.ts";
import { createClient } from "./projects-client.ts";
import { deployInfrastructurePrompt } from "./prompts.ts";

const server = new McpServer(
  { name: "AutoProvisioner", version: "0.1.0" },
  {
    instructions:
      "Utilize AutoProvisioner to automate production deployments, server setup, configuration management, and resource allocation",
  },
);

const projectsClient = createClient();

registerExamplesApi(server, projectsClient);
registerGithubApi(server);
registerManagedProvidersApi(server);
registerProjectsApi(server, projectsClient);
registerTerraformApi(server, projectsClient);

deployInfrastructurePrompt(server);

export async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (_error) {
    Deno.exit(1);
  }
}
