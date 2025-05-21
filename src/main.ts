import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGithubApi } from "./api/github.ts";
import { registerManagedProvidersApi } from "./api/managed-providers.ts";
import { registerTerraformApi } from "./api/terraform/mod.ts";
import { createClient } from "./projects-client.ts";
import { deployTerraformProjectPrompt } from "./prompts.ts";
import { registerPulumiApi } from "./api/pulumi/mod.ts";

const server = new McpServer(
  { name: "AutoProvisioner", version: "0.1.0" },
  {
    instructions:
      "Utilize AutoProvisioner to automate production deployments, server setup, configuration management, and resource allocation",
  },
);

const projectsClient = createClient();

registerGithubApi(server);
registerManagedProvidersApi(server);
registerTerraformApi(server, projectsClient);
registerPulumiApi(server, projectsClient);

deployTerraformProjectPrompt(server);

export async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (_error) {
    Deno.exit(1);
  }
}
