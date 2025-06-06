import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@autoprovisioner/tf-service";

export const createClient = (
  projectsClientBaseUrl: string,
  getHeaders: () => Promise<Record<string, string>> | Record<string, string>,
) =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${projectsClientBaseUrl}/trpc`,
        headers: getHeaders,
      }),
    ],
  });

export type ProjectsClient = ReturnType<typeof createClient>;
