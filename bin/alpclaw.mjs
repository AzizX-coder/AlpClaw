#!/usr/bin/env node
/**
 * AlpClaw global launcher.
 *
 * Works whether AlpClaw is:
 *   - Installed globally:  npm i -g alpclaw
 *   - Linked for dev:      pnpm install (repo checkout)
 *   - npx'd:               npx alpclaw
 *
 * Resolves tsx from the package's own node_modules (falls back to workspace root
 * for the monorepo dev case), so users never have to deal with ts runtime setup.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as fs from "node:fs";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, "..");
const cliPath = resolve(packageRoot, "examples", "cli.ts");

const tsxName = "cli.mjs";

const tsxCandidates = [
  resolve(packageRoot, "node_modules", "tsx", "dist", tsxName),
  resolve(packageRoot, "..", "..", "node_modules", "tsx", "dist", tsxName),
  resolve(packageRoot, "..", "node_modules", "tsx", "dist", tsxName),
];

let tsxBin = tsxCandidates.find((p) => fs.existsSync(p));

// Last-resort fallback: rely on PATH (works if the user has tsx globally).
if (!tsxBin) tsxBin = "tsx";

let command = tsxBin;
let args = [cliPath, ...process.argv.slice(2)];

// If we resolved the JS file directly, use the current Node binary to run it.
// This completely avoids Windows `.cmd` shell parsing bugs with spaces in paths!
if (tsxBin.endsWith(".mjs")) {
  command = process.execPath;
  args = [tsxBin, ...args];
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  cwd: process.cwd(),
  env: { ...process.env, FORCE_COLOR: "1", ALPCLAW_HOME: packageRoot },
});

if (result.error && result.error.code === "ENOENT") {
  console.error(
    "AlpClaw: could not locate the tsx runtime.\n" +
      "Fix: run `npm install -g tsx` or reinstall AlpClaw.",
  );
  process.exit(127);
}

process.exit(result.status ?? 1);
