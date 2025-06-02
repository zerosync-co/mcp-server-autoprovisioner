/// <reference types="../worker-configuration.d.ts" />

import { Hono } from "hono";
import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { env } from "cloudflare:workers";

export type Bindings = Env & {
  OAUTH_PROVIDER: OAuthHelpers;
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

  if (!auth?.userId) {
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

  const userId = auth.userId;

  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: oauthReqInfo,
    userId,
    metadata: {},
    scope: oauthReqInfo.scope,
    props: {
      userId,
    },
  });

  return Response.redirect(redirectTo);
});

export default app;
