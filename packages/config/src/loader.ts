import { config as loadDotenv } from "dotenv";
import { ConfigSchema, type AlpClawConfig } from "./schema.js";
import { readGlobalConfig } from "./global-store.js";
import { createError, type Result, ok, err } from "@alpclaw/utils";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
export type AlpClawConfigOverrides = DeepPartial<AlpClawConfig>;

/**
 * Layered config, lowest → highest precedence:
 *   1. defaults (schema)
 *   2. ~/.alpclaw/config.json
 *   3. .env / process env
 *   4. explicit overrides passed to loadConfig()
 */
export function loadConfig(overrides?: AlpClawConfigOverrides): Result<AlpClawConfig> {
  loadDotenv();

  try {
    const global = readGlobalConfig();

    const globalLayer = {
      providers: {
        default: global.defaultProvider,
        defaultModel: global.defaultModel,
        apiKeys: global.apiKeys || {},
      },
      safety: { mode: global.safetyMode },
    };

    const envLayer = {
      providers: {
        default: process.env["ALPCLAW_DEFAULT_PROVIDER"],
        defaultModel: process.env["ALPCLAW_DEFAULT_MODEL"],
        apiKeys: extractApiKeys(),
      },
      safety: { mode: process.env["ALPCLAW_SAFETY_MODE"] },
      memory: { storagePath: process.env["ALPCLAW_MEMORY_PATH"] },
      agent: { maxRetries: process.env["ALPCLAW_MAX_RETRIES"] ? parseInt(process.env["ALPCLAW_MAX_RETRIES"], 10) : undefined },
      logging: { level: process.env["ALPCLAW_LOG_LEVEL"] },
    };

    const layered = deepMerge(deepMerge(globalLayer, envLayer), (overrides || {}) as Record<string, unknown>);
    const cleaned = dropUndefined(layered);
    const parsed = ConfigSchema.parse(cleaned);
    return ok(parsed);
  } catch (cause) {
    return err(createError("config", "Failed to load configuration", { cause }));
  }
}

function extractApiKeys(): Record<string, string> {
  const keys: Record<string, string> = {};
  const mapping: Record<string, string> = {
    ANTHROPIC_API_KEY: "claude",
    OPENAI_API_KEY: "openai",
    GOOGLE_API_KEY: "gemini",
    DEEPSEEK_API_KEY: "deepseek",
    OPENROUTER_API_KEY: "openrouter",
  };

  for (const [envVar, provider] of Object.entries(mapping)) {
    const value = process.env[envVar];
    if (value) keys[provider] = value;
  }

  return keys;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
}

function dropUndefined(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue;
    out[k] = dropUndefined(v);
  }
  return out;
}
