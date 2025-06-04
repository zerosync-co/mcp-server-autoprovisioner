/// <reference types="../worker-configuration.d.ts" />

import { registerGithubApi } from "../src/api/github.ts";
import { registerManagedProvidersApi } from "../src/api/managed-providers.ts";
import { registerTerraformApi } from "../src/api/terraform/mod.ts";
import { createClient } from "../src/projects-client.ts";
import { deployTerraformProjectPrompt } from "../src/prompts.ts";
import { registerPulumiApi } from "../src/api/pulumi/mod.ts";
import { McpAgent } from "agents/mcp";
import { env } from "cloudflare:workers";
import { createMCPServer } from "../src/server.ts";
import { createClerkClient } from "@clerk/backend";

type Props = {
  token?: string;
  githubToken?: string;
};

export class AutoProvisioner extends McpAgent<Env, unknown, Props> {
  server = createMCPServer();

  projectsClient = createClient(
    env.TF_SERVICE_BASE_URL,
    () => ({
      "Authorization": `Bearer ${this.props.token}`,
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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    const clerkClient = createClerkClient({
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
      jwtKey: env.CLERK_JWK,
    });

    const { toAuth, isSignedIn, token } = await clerkClient.authenticateRequest(
      request,
    );
    ctx.props.token = token;

    const auth = toAuth();
    const userId = auth?.userId;

    if (isSignedIn && userId) {
      const githubTokens = await clerkClient.users.getUserOauthAccessToken(
        userId,
        "github",
      );

      if (githubTokens?.data?.length) {
        ctx.props.githubToken = githubTokens.data[0].token;
      }
    }

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return AutoProvisioner.serveSSE("/sse").fetch(request, env, ctx);
    }

    if (url.pathname === "/mcp") {
      return AutoProvisioner.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
