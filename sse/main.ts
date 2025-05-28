/// <reference types="../worker-configuration.d.ts" />

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGithubApi } from "../src/api/github.ts";
import { registerManagedProvidersApi } from "../src/api/managed-providers.ts";
import { registerTerraformApi } from "../src/api/terraform/mod.ts";
import { createClient } from "../src/projects-client.ts";
import { deployTerraformProjectPrompt } from "../src/prompts.ts";
import { registerPulumiApi } from "../src/api/pulumi/mod.ts";
import { McpAgent } from "agents/mcp";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import auth from "./auth.ts";
import { env } from "cloudflare:workers";

type Props = {
  userId: string;
  origin: string;
};

export class AutoProvisioner extends McpAgent<Env, unknown, Props> {
  server = new McpServer(
    { name: "AutoProvisioner", version: "0.1.0" },
    {
      instructions:
        "Utilize AutoProvisioner to automate production deployments, server setup, configuration management, and resource allocation",
    },
  );

  projectsClient = createClient(env.TF_SERVICE_BASE_URL);

  async init() {
    registerGithubApi(this.server, env.TF_SERVICE_BASE_URL);
    registerManagedProvidersApi(this.server);
    registerTerraformApi(this.server, this.projectsClient);
    registerPulumiApi(this.server, this.projectsClient);

    deployTerraformProjectPrompt(this.server);
  }
}

export default new OAuthProvider({
  apiRoute: "/sse",
  apiHandlers: {
    "/sse": AutoProvisioner.serveSSE("/sse"),
    "/mcp": AutoProvisioner.serve("/mcp"),
  },
  defaultHandler: auth as any,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});
