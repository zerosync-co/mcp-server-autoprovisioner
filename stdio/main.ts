import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  createClient,
  createMCPServer,
  deployTerraformProjectPrompt,
  getBuildEnvVar,
  getInitializedLocalState,
  registerGithubApi,
  registerPulumiApi,
  registerTerraformApi,
} from "../src/mod.ts";

export async function main() {
  const server = createMCPServer();

  const TF_SERVICE_BASE_URL = getBuildEnvVar("TF_SERVICE_BASE_URL");

  const localState = await getInitializedLocalState();
  const projectsClient = createClient(TF_SERVICE_BASE_URL, () => (
    {
      "Authorization": `Bearer ${localState.accessToken?.value}`,
    }
  ));

  registerGithubApi(server, () => undefined); // FIXME--

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
