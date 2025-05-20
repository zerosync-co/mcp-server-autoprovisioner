import { TF_SERVICE_BASE_URL } from "./env.ts";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@autoprovisioner/tf-service";
import { getInitializedLocalState } from "./utils.ts";

export const createClient = () =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${TF_SERVICE_BASE_URL}/trpc`,
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
