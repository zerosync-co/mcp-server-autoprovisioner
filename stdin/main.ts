import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGithubApi } from "../src/api/github.ts";
import { registerManagedProvidersApi } from "../src/api/managed-providers.ts";
import { registerTerraformApi } from "../src/api/terraform/mod.ts";
import { createClient } from "../src/projects-client.ts";
import { deployTerraformProjectPrompt } from "../src/prompts.ts";
import { registerPulumiApi } from "../src/api/pulumi/mod.ts";
import { getBuildEnvVar } from "../src/utils.ts";

export async function main() {
  const server = new McpServer(
    { name: "AutoProvisioner", version: "0.1.0" },
    {
      instructions:
        "Utilize AutoProvisioner to automate production deployments, server setup, configuration management, and resource allocation",
    },
  );

  const TF_SERVICE_BASE_URL = getBuildEnvVar("TF_SERVICE_BASE_URL");
  const projectsClient = createClient(TF_SERVICE_BASE_URL);

  registerGithubApi(server, TF_SERVICE_BASE_URL);
  registerManagedProvidersApi(server);
  registerTerraformApi(server, projectsClient);
  registerPulumiApi(server, projectsClient);

  deployTerraformProjectPrompt(server);

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (_error) {
    Deno.exit(1);
  }
}
