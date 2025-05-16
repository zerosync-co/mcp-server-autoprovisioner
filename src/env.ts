function getEnvVar(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`${key} is undefined`);
  }

  return value;
}

export const TF_SERVICE_BASE_URL = getEnvVar("TF_SERVICE_BASE_URL");
