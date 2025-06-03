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
import { verifyToken } from "@clerk/backend";

type Props = {
  userId: string;
  clerkToken: string;
};

export class AutoProvisioner extends McpAgent<Env, unknown, Props> {
  server = new McpServer(
    { name: "AutoProvisioner", version: "0.1.0" },
    {
      instructions:
        "Utilize AutoProvisioner to automate production deployments, server setup, configuration management, and resource allocation",
    },
  );

  async getBearerToken() {
    try {
      await verifyToken(this.props.clerkToken, {
        jwtKey: env.CLERK_JWK,
      });
      return this.props.clerkToken;
    } catch (_e) {
      // const grantKeys = await env.OAUTH_KV.list({
      //   prefix: `grant:${this.props.userId}`,
      // });
      // for (const key in grantKeys) {
      //   await env.OAUTH_KV.delete(key);
      // }

      // TODO-- should redirect to login
      // return Response.redirect ?
      throw new Error("unauthorized");
    }
  }

  projectsClient = createClient(
    env.TF_SERVICE_BASE_URL,
    this.getBearerToken,
  );

  init() {
    registerGithubApi(
      this.server,
      env.TF_SERVICE_BASE_URL,
      this.getBearerToken,
    );
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
