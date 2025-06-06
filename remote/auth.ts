/// <reference types="../worker-configuration.d.ts" />

import { Hono } from "hono";
import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { env } from "cloudflare:workers";

export type Bindings = Env & {
  OAUTH_PROVIDER: OAuthHelpers;
};

export type Props = {
  clerkToken: string;
  githubToken?: string;
};

const app = new Hono<{
  Bindings: Bindings;
}>();

app.use(
  "*",
  clerkMiddleware({
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
    jwtKey: env.CLERK_JWK,
  }),
);

app.get("/authorize", async (c) => {
  const oauthReqInfo = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw);
  if (!oauthReqInfo.clientId) {
    return c.text("Invalid request", 400);
  }

  const auth = getAuth(c);
  const userId = auth?.userId;

  if (!userId) {
    const mcpRedirectUrl = new URL(
      `${c.env.MCP_SERVER_AUTOPROVISIONER_BASE_URL}/authorize`,
    );
    for (const [key, value] of Object.entries(c.req.query())) {
      mcpRedirectUrl.searchParams.append(key, value);
    }

    const authRedirectUrl = new URL("/sign-in", c.env.CLERK_REDIRECT_URL);
    authRedirectUrl.searchParams.append(
      "redirect_url",
      mcpRedirectUrl.toString(),
    );

    return Response.redirect(authRedirectUrl.toString());
  }

  const clerkToken = await auth.getToken({ template: "cli" });
  if (!clerkToken) {
    throw new Error("failed to resolve clerk token");
  }

  let githubToken: string | undefined;

  try {
    const clerkClient = c.get("clerk");
    const githubTokens = await clerkClient.users.getUserOauthAccessToken(
      userId,
      "github",
    );

    if (githubTokens?.data?.length) {
      githubToken = githubTokens.data[0].token;
    }
  } catch (_) {
    console.warn(`failed to resolve github token for ${userId}`);
  }

  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReqInfo,
    userId,
    metadata: {},
    scope: oauthReqInfo.scope,
    props: {
      clerkToken,
      githubToken,
    } satisfies Props,
  });

  return Response.redirect(redirectTo);
});

export default app;
