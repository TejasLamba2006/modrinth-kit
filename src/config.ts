import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export function configPath(): string {
  const base = process.env.XDG_CONFIG_HOME ?? (process.platform === "win32" ? process.env.APPDATA : undefined) ?? join(homedir(), ".config");
  return join(base!, "modrinth-kit", "config.json");
}

interface StoredConfig {
  token?: string;
  staging_token?: string;
}

export async function readStored(): Promise<StoredConfig> {
  try {
    return JSON.parse(await readFile(configPath(), "utf8"));
  } catch {
    return {};
  }
}

export async function writeStored(cfg: StoredConfig): Promise<string> {
  const p = configPath();
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  return p;
}

/** Precedence: explicit flag > env > stored config. Staging prefers MODRINTH_STAGING_TOKEN and its own stored slot. */
export async function resolveToken(flag: string | undefined, staging: boolean): Promise<string | undefined> {
  if (flag) return flag;
  const env = staging ? process.env.MODRINTH_STAGING_TOKEN ?? process.env.MODRINTH_TOKEN : process.env.MODRINTH_TOKEN;
  if (env) return env;
  const stored = await readStored();
  return staging ? stored.staging_token : stored.token;
}
