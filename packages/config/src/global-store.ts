import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

/**
 * Persistent user config lives at ~/.alpclaw/config.json so `alpclaw` works
 * from any working directory without a local .env file.
 */

export interface GlobalConfigShape {
  defaultProvider?: string;
  defaultModel?: string;
  safetyMode?: "strict" | "standard" | "permissive";
  apiKeys?: Record<string, string>;
  bots?: Record<string, Record<string, string>>;
}

export function globalConfigDir(): string {
  return path.join(os.homedir(), ".alpclaw");
}

export function globalConfigPath(): string {
  return path.join(globalConfigDir(), "config.json");
}

export function readGlobalConfig(): GlobalConfigShape {
  const p = globalConfigPath();
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as GlobalConfigShape;
  } catch {
    return {};
  }
}

export function writeGlobalConfig(cfg: GlobalConfigShape): void {
  const dir = globalConfigDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const p = globalConfigPath();
  fs.writeFileSync(p, JSON.stringify(cfg, null, 2), { encoding: "utf-8", mode: 0o600 });
}

export function setGlobalValue<K extends keyof GlobalConfigShape>(
  key: K,
  value: GlobalConfigShape[K],
): void {
  const cfg = readGlobalConfig();
  cfg[key] = value;
  writeGlobalConfig(cfg);
}

export function setApiKey(provider: string, key: string): void {
  const cfg = readGlobalConfig();
  cfg.apiKeys = { ...(cfg.apiKeys || {}), [provider]: key };
  writeGlobalConfig(cfg);
}

export function setBotCredential(bot: string, field: string, value: string): void {
  const cfg = readGlobalConfig();
  cfg.bots = { ...(cfg.bots || {}) };
  cfg.bots[bot] = { ...(cfg.bots[bot] || {}), [field]: value };
  writeGlobalConfig(cfg);
}
