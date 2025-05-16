import * as path from "@std/path";
import xdgAppPaths from "xdg-app-paths";
import * as TOML from "@std/toml";
import * as jwt from "jsonwebtoken";

export function isDirectory(configPath: string) {
  try {
    return Deno.statSync(configPath).isDirectory;
  } catch (_error) {
    // ignore error
    return false;
  }
}

export function getGlobalConfigPath() {
  const configDir = xdgAppPaths(".autoprovisioner").config();
  return configDir;
}

const TOML_ERROR_NAME = "TomlError";
const TOML_ERROR_SUFFIX = " at row ";

type TomlError = Error & {
  line: number;
  col: number;
};

export function parseTOML(
  input: string,
  file?: string,
): Record<string, unknown> | never {
  try {
    // Normalize CRLF to LF to avoid hitting https://github.com/iarna/iarna-toml/issues/33.
    const normalizedInput = input.replace(/\r\n/g, "\n");
    return TOML.parse(normalizedInput);
  } catch (err) {
    const { name, message, line, col } = err as TomlError;
    if (name !== TOML_ERROR_NAME) {
      throw err;
    }
    const text = message.substring(0, message.lastIndexOf(TOML_ERROR_SUFFIX));
    const lineText = input.split("\n")[line];
    const location = {
      lineText,
      line: line + 1,
      column: col - 1,
      file,
      fileText: input,
    };
    throw new Error(
      `Error parsing TOML: ${text} at ${JSON.stringify(location)}`,
    );
  }
}

export interface State {
  accessToken?: AccessToken;
}

interface AccessToken {
  value: string;
}

export let LocalState: State = {};

export function getAuthConfigFilePath() {
  const configDir = getGlobalConfigPath();
  return path.join(configDir, "config", "default.toml");
}

export function getAuthTokens() {
  const configPath = getAuthConfigFilePath();

  try {
    Deno.lstatSync(configPath);
  } catch (_) {
    throw new Error(`No config file found at ${configPath}`);
  }

  const toml = parseTOML(
    new TextDecoder().decode(Deno.readFileSync(configPath)),
  ) as {
    access_token?: string;
  };

  const { access_token } = toml;
  if (!access_token) {
    throw new Error("failed to resolve access token");
  }

  const decoded = jwt.decode(access_token, { complete: true });
  if (!decoded || !decoded.payload) {
    throw new Error("Invalid JWT");
  }

  const exp = decoded.payload.exp;
  const currentTime = Math.floor(Date.now() / 1000);

  const isExpired = exp ? currentTime > exp : false;
  if (isExpired) {
    throw new Error("Access token has expired");
  }

  LocalState = {
    accessToken: {
      value: access_token,
    },
  };
}

export interface UserAuthConfig {
  access_token?: string;
}

export function writeAuthConfigFile(config: UserAuthConfig) {
  const configPath = getAuthConfigFilePath();

  Deno.mkdirSync(path.dirname(configPath), {
    recursive: true,
  });
  Deno.writeFileSync(
    path.join(configPath),
    new TextEncoder().encode(TOML.stringify(config as Record<string, unknown>)),
  );
}

export function getInitializedLocalState(): Promise<typeof LocalState> {
  return new Promise((resolve, reject) => {
    const intervalMs = 1000;
    const timeoutMs = 60 * 1000;
    let elapsed = 0;

    const checkInterval = setInterval(() => {
      elapsed += intervalMs;

      if (
        LocalState.accessToken?.value
      ) {
        clearInterval(checkInterval);
        resolve(LocalState);
      }

      if (elapsed >= timeoutMs) {
        clearInterval(checkInterval);
        reject(
          new Error(
            "failed to resolve initialized LocalState",
          ),
        );
      }
    }, intervalMs);
  });
}
