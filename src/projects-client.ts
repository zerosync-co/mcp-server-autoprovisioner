import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@autoprovisioner/tf-service";

export const createClient = (
  projectsClientBaseUrl: string,
  getBearerToken: () => Promise<string>,
) =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${projectsClientBaseUrl}/trpc`,
        headers: async () => {
          const token = await getBearerToken();

          return {
            Authorization: `Bearer ${token}`,
          };
        },
      }),
    ],
  });

export type ProjectsClient = ReturnType<typeof createClient>;
