import { z } from "zod";
import { credentialKeysSchema } from "../../tf-service/src/mod.ts"; // FIXME--

export const provider = z.string().describe(
  "The cloud provider (e.g., 'cloudflare', 'aws', 'azure', 'gcp', 'random')",
);

export const directory = z.string().describe(
  "The name of the directory (e.g., 'cloudflare-workers-terraform-example')",
);

export const filePath = z.string().describe(
  "The path to the file (e.g., 'main.tf', 'index.ts')",
);

export const fileContent = z.string().describe("The content within a file");

export const repositoryOwner = z.string().describe("GitHub repository owner");

export const repositoryName = z.string().describe("GitHub repository name");

export const repositoryUrl = z.string().describe("GitHub repository URL");

export const projectName = z.string().describe(
  "Infrastructure-as-Code project name",
);

// FIXME--
export const providerContents = z.string().describe(
  "provider.tf file contents",
);

export const projectId = z.string().uuid().describe(
  "Infrastructure-as-Code project id",
);

export const terraformProviderSource = z.string().describe(
  "The terraform provider documentation source (e.g., 'registry.opentofu.org/cloudflare/cloudflare')",
);

export const terraformProviderResource = z.string().describe(
  "The terraform provider resource documentation source (e.g., 'cloudflare_workers_script')",
);

export const terraformProviderNamespace = z.string().describe(
  "The terraform provider namespace (e.g., 'cloudflare')",
);

export const terraformProviderName = z.string().describe(
  "The terraform provider name (e.g., 'cloudflare')",
);

export const terraformProviderVersion = z.string().describe(
  "The terraform provider version (e.g., 'v5.5.0')",
);

export const credentialKeys = credentialKeysSchema.describe(
  "Set of credential keys required for authentication (e.g., 'DIGITALOCEAN_TOKEN', 'CLOUDFLARE_API_TOKEN')",
);
