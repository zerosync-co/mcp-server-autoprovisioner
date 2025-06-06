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
  const projectsClient = createClient(TF_SERVICE_BASE_URL, async () => {
    const localState = await getInitializedLocalState();
    return {
      "Authorization": `Bearer ${localState.accessToken?.value}`,
    };
  });

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
