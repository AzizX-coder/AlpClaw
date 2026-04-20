#!/usr/bin/env node
/**
 * Legacy AlpClaw alias — delegates to the Splash launcher.
 * Kept so existing installs and scripts continue to work.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const splashLauncher = resolve(__dirname, "splash.mjs");

const result = spawnSync(process.execPath, [splashLauncher, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: process.cwd(),
  env: process.env,
});

process.exit(result.status ?? 1);
