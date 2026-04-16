import { config as loadDotenv } from "dotenv";
import { ConfigSchema, type AlpClawConfig } from "./schema.js";
import { createError, type Result, ok, err } from "@alpclaw/utils";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
export type AlpClawConfigOverrides = DeepPartial<AlpClawConfig>;

/**
 * Loads configuration from environment variables and .env file.
 * Falls back to sensible defaults for everything.
 */
export function loadConfig(overrides?: AlpClawConfigOverrides): Result<AlpClawConfig> {
  loadDotenv();

  try {
    const envConfig = {
      providers: {
        default: process.env["ALPCLAW_DEFAULT_PROVIDER"] || "claude",
        defaultModel: process.env["ALPCLAW_DEFAULT_MODEL"] || "claude-sonnet-4-20250514",
        apiKeys: extractApiKeys(),
      },
      safety: {
        mode: process.env["ALPCLAW_SAFETY_MODE"] || "standard",
      },
      memory: {
        storagePath: process.env["ALPCLAW_MEMORY_PATH"] || ".alpclaw/memory",
      },
      agent: {
        maxRetries: parseInt(process.env["ALPCLAW_MAX_RETRIES"] || "3", 10),
      },
      logging: {
        level: process.env["ALPCLAW_LOG_LEVEL"] || "info",
      },
    };

    const merged = deepMerge(envConfig, overrides || {});
    const parsed = ConfigSchema.parse(merged);
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
