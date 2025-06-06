/// <reference types="../worker-configuration.d.ts" />

import {
  createClient,
  createMCPServer,
  deployTerraformProjectPrompt,
  registerGithubApi,
  registerPulumiApi,
  registerTerraformApi,
} from "../src/mod.ts";
import auth, { Props } from "./auth.ts";
import { McpAgent } from "agents/mcp";
import { env } from "cloudflare:workers";
import OAuthProvider from "@cloudflare/workers-oauth-provider";

export class AutoProvisioner extends McpAgent<Env, unknown, Props> {
  server = createMCPServer();

  projectsClient = createClient(
    env.TF_SERVICE_BASE_URL,
    () => ({
      "Authorization": `Bearer ${this.props.clerkToken}`,
    }),
  );

  init() {
    registerGithubApi(this.server, () => this.props.githubToken);

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
