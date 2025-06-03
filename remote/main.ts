/// <reference types="../worker-configuration.d.ts" />

import { registerGithubApi } from "../src/api/github.ts";
import { registerManagedProvidersApi } from "../src/api/managed-providers.ts";
import { registerTerraformApi } from "../src/api/terraform/mod.ts";
import { createClient } from "../src/projects-client.ts";
import { deployTerraformProjectPrompt } from "../src/prompts.ts";
import { registerPulumiApi } from "../src/api/pulumi/mod.ts";
import { McpAgent } from "agents/mcp";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import auth, { Props } from "./auth.ts";
import { env } from "cloudflare:workers";
import { createMCPServer } from "../src/server.ts";

export class AutoProvisioner extends McpAgent<Env, unknown, Props> {
  server = createMCPServer();

  projectsClient = createClient(
    env.TF_SERVICE_BASE_URL,
    () => ({
      "X-User-Id": this.props.userId,
      "CF-Access-Client-Id": env.CF_ACCESS_CLIENT_ID,
      "CF-Access-Client-Secret": env.CF_ACCESS_CLIENT_SECRET,
    }),
  );

  init() {
    registerGithubApi(this.server, () => this.props.githubToken);

    registerManagedProvidersApi(this.server);
    registerTerraformApi(this.server, this.projectsClient);
    registerPulumiApi(this.server, this.projectsClient);

    deployTerraformProjectPrompt(this.server);

    return Promise.resolve();
  }
}

export default new OAuthProvider({
  apiHandlers: {
    "/sse": AutoProvisioner.serveSSE("/sse"),
    "/mcp": AutoProvisioner.serve("/mcp"),
  },
  defaultHandler: auth,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
