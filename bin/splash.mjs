#!/usr/bin/env node
/**
 * Splash global launcher.
 *
 * Works whether Splash is:
 *   - Installed globally:  npm i -g splash
 *   - Linked for dev:      pnpm install (repo checkout)
 *   - npx'd:               npx splash
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
if (!tsxBin) tsxBin = "tsx";

let command = tsxBin;
let args = [cliPath, ...process.argv.slice(2)];

if (tsxBin.endsWith(".mjs")) {
  command = process.execPath;
  args = [tsxBin, ...args];
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  cwd: process.cwd(),
  env: {
    ...process.env,
    FORCE_COLOR: "1",
    SPLASH_HOME: packageRoot,
    ALPCLAW_HOME: packageRoot,
  },
});

if (result.error && result.error.code === "ENOENT") {
  console.error(
    "Splash: could not locate the tsx runtime.\n" +
      "Fix: run `npm install -g tsx` or reinstall Splash.",
  );
  process.exit(127);
}

process.exit(result.status ?? 1);
