import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@autoprovisioner/tf-service";
import { getInitializedLocalState } from "./utils.ts";

export const createClient = (projectsClientBaseUrl: string) =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${projectsClientBaseUrl}/trpc`,
        headers: async () => {
          const localState = await getInitializedLocalState();

          return {
            Authorization: `Bearer ${localState.accessToken?.value}`,
          };
        },
      }),
    ],
  });

export type ProjectsClient = ReturnType<typeof createClient>;
