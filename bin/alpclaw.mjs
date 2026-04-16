#!/usr/bin/env node

/**
 * AlpClaw CLI launcher — bootstraps tsx and runs the CLI entry point.
 * Ensures compatibility across directories by running npx tsx natively.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = resolve(__dirname, "..", "examples", "cli.ts");

// Forward all args
const args = process.argv.slice(2);

const cmd = process.platform === "win32" ? "npx.cmd" : "npx";

const result = spawnSync(cmd, ["tsx", cliPath, ...args], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env, FORCE_COLOR: "1" },
});

process.exit(result.status ?? 1);
