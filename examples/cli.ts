#!/usr/bin/env tsx

/**
 * AlpClaw CLI — OpenClaw-style entrypoint.
 *
 * Usage:
 *   alpclaw                         Open an interactive chat.
 *   alpclaw "do X"                  Run a one-shot task from any directory.
 *   alpclaw init                    30-second setup wizard (writes ~/.alpclaw/config.json).
 *   alpclaw config list             Show current global config.
 *   alpclaw config set KEY VAL      Set a global config field.
 *   alpclaw config set-key P VAL    Save a provider API key (claude|openai|openrouter|...).
 *   alpclaw telegram|slack|...      Start a platform bot.
 *   alpclaw help                    Show this help.
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { AlpClaw } from "@alpclaw/core";
import type { AgentPhase, Task } from "@alpclaw/utils";
import { renderBanner } from "@alpclaw/utils";
import {
  readGlobalConfig,
  writeGlobalConfig,
  setApiKey,
  setBotCredential,
  setGlobalValue,
  globalConfigPath,
  type GlobalConfigShape,
} from "@alpclaw/config";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

marked.use(markedTerminal() as any);

const PHASE_LABELS: Record<AgentPhase, string> = {
  intake: "Receiving task",
  understand: "Understanding intent",
  plan: "Architecting plan",
  context_fetch: "Accessing memory",
  tool_select: "Selecting capabilities",
  execute: "Executing",
  verify: "Verifying results",
  correct: "Self-correcting",
  finalize: "Finalizing",
  persist: "Writing to persistent memory",
};

const BOT_SPECS: Record<
  string,
  { file: string; label: string; requiredKeys: string[] }
> = {
  telegram:  { file: "telegram.ts",  label: "Telegram",  requiredKeys: ["TELEGRAM_BOT_TOKEN"] },
  slack:     { file: "slack.ts",     label: "Slack",     requiredKeys: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"] },
  whatsapp:  { file: "whatsapp.ts",  label: "WhatsApp",  requiredKeys: ["TWILIO_AUTH_TOKEN", "TWILIO_WHATSAPP_FROM"] },
  messenger: { file: "messenger.ts", label: "Messenger", requiredKeys: ["FB_PAGE_ACCESS_TOKEN", "FB_VERIFY_TOKEN", "FB_APP_SECRET"] },
  discord:   { file: "discord.ts",   label: "Discord",   requiredKeys: ["DISCORD_PUBLIC_KEY", "DISCORD_BOT_TOKEN"] },
};

// ──────────────────────────────────────────────────────────────────────────
// Entry routing
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd) {
    await openChat();
    return;
  }

  switch (cmd) {
    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;
    case "init":
    case "setup":
      await runInit();
      return;
    case "config":
      await runConfig(args.slice(1));
      return;
    case "chat":
      await openChat();
      return;
    case "telegram":
    case "slack":
    case "whatsapp":
    case "messenger":
    case "discord":
      await runBot(cmd);
      return;
    case "run":
      if (args[1] && BOT_SPECS[args[1]]) {
        await runBot(args[1]);
        return;
      }
      break;
  }

  // Fallback: treat args as a one-shot prompt.
  await runOneShot(args.join(" "));
}

// ──────────────────────────────────────────────────────────────────────────
// Help
// ──────────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(renderBanner({ subtitle: "Autonomous Agent" }));
  console.log(
    [
      pc.bold("USAGE"),
      `  ${pc.cyan("alpclaw")}                          Open an interactive chat`,
      `  ${pc.cyan("alpclaw")} "build me a script"      Run a one-shot task`,
      "",
      pc.bold("COMMANDS"),
      `  ${pc.cyan("alpclaw init")}                     30-second setup wizard`,
      `  ${pc.cyan("alpclaw config list")}              Show config`,
      `  ${pc.cyan("alpclaw config set")} KEY VAL       Set a field (defaultModel, safetyMode, ...)`,
      `  ${pc.cyan("alpclaw config set-key")} P VAL     Save API key for provider (openrouter, claude, openai, ...)`,
      `  ${pc.cyan("alpclaw telegram")}|${pc.cyan("slack")}|${pc.cyan("whatsapp")}|${pc.cyan("messenger")}|${pc.cyan("discord")}   Start a platform bot`,
      `  ${pc.cyan("alpclaw help")}                     Show this help`,
      "",
      pc.bold("CONFIG"),
      `  Global config lives at ${pc.dim(globalConfigPath())}`,
      `  Env vars override config. .env in cwd is also read.`,
      "",
    ].join("\n"),
  );
}

// ──────────────────────────────────────────────────────────────────────────
// init / config
// ──────────────────────────────────────────────────────────────────────────

async function runInit() {
  console.log(renderBanner({ subtitle: "Setup" }));
  p.intro(pc.bgCyan(pc.black(" ALPCLAW INIT ")));
  p.log.message("Pick a provider and drop in a key. You can change this any time with `alpclaw config`.");

  const existing = readGlobalConfig();
  const next: GlobalConfigShape = { ...existing };
  next.apiKeys = { ...(existing.apiKeys || {}) };

  const provider = await p.select({
    message: "Default provider:",
    options: [
      { value: "openrouter", label: "OpenRouter — recommended, unlocks Kimi K2, DeepSeek, Qwen, Claude, GPT-4" },
      { value: "claude",     label: "Anthropic Claude" },
      { value: "openai",     label: "OpenAI (GPT-4o)" },
      { value: "gemini",     label: "Google Gemini" },
      { value: "deepseek",   label: "DeepSeek" },
      { value: "ollama",     label: "Ollama (local, no key needed)" },
    ],
  });
  if (p.isCancel(provider)) return abort();

  next.defaultProvider = provider as string;

  if (provider !== "ollama") {
    const key = await p.password({ message: `Paste your ${provider} API key (input hidden):` });
    if (p.isCancel(key)) return abort();
    if (key) next.apiKeys[provider as string] = key as string;
  }

  if (provider === "openrouter") {
    const model = await p.select({
      message: "Default model:",
      options: [
        { value: "moonshotai/kimi-k2",           label: "Kimi K2 (Moonshot) — long context, strong coding" },
        { value: "moonshotai/kimi-k2-0905",      label: "Kimi K2 0905 (newer snapshot)" },
        { value: "anthropic/claude-3.5-sonnet",  label: "Claude 3.5 Sonnet" },
        { value: "deepseek/deepseek-chat",       label: "DeepSeek V3" },
        { value: "qwen/qwen-2.5-coder-32b-instruct", label: "Qwen 2.5 Coder 32B" },
        { value: "openai/gpt-4o",                label: "GPT-4o" },
      ],
    });
    if (!p.isCancel(model)) next.defaultModel = model as string;
  }

  const safety = await p.select({
    message: "Safety level:",
    options: [
      { value: "standard",   label: "Standard — confirms risky actions (recommended)" },
      { value: "strict",     label: "Strict — confirms every action" },
      { value: "permissive", label: "Permissive — fully autonomous" },
    ],
  });
  if (!p.isCancel(safety)) next.safetyMode = safety as GlobalConfigShape["safetyMode"];

  writeGlobalConfig(next);
  p.outro(pc.green(`✓ Saved to ${globalConfigPath()}`));
  console.log(pc.dim(`\nTry it: ${pc.cyan("alpclaw \"summarize this folder\"")}`));
}

async function runConfig(args: string[]) {
  const sub = args[0];
  if (!sub || sub === "list" || sub === "show") {
    const cfg = readGlobalConfig();
    const redacted = {
      ...cfg,
      apiKeys: Object.fromEntries(
        Object.entries(cfg.apiKeys || {}).map(([k, v]) => [k, redact(v)]),
      ),
      bots: Object.fromEntries(
        Object.entries(cfg.bots || {}).map(([bot, fields]) => [
          bot,
          Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, redact(v)])),
        ]),
      ),
    };
    console.log(pc.dim(`# ${globalConfigPath()}`));
    console.log(JSON.stringify(redacted, null, 2));
    return;
  }

  if (sub === "path") {
    console.log(globalConfigPath());
    return;
  }

  if (sub === "set") {
    const [key, ...rest] = args.slice(1);
    const val = rest.join(" ");
    if (!key || val === "") {
      console.error("Usage: alpclaw config set <defaultProvider|defaultModel|safetyMode> <value>");
      process.exit(2);
    }
    const allowed = ["defaultProvider", "defaultModel", "safetyMode"] as const;
    if (!(allowed as readonly string[]).includes(key)) {
      console.error(`Unknown key. Allowed: ${allowed.join(", ")}`);
      process.exit(2);
    }
    setGlobalValue(key as (typeof allowed)[number], val as any);
    console.log(pc.green(`✓ ${key} = ${val}`));
    return;
  }

  if (sub === "set-key") {
    const [provider, ...rest] = args.slice(1);
    const val = rest.join(" ");
    if (!provider || !val) {
      console.error("Usage: alpclaw config set-key <provider> <api-key>");
      process.exit(2);
    }
    setApiKey(provider, val);
    console.log(pc.green(`✓ API key saved for ${provider}`));
    return;
  }

  if (sub === "set-bot") {
    const [bot, field, ...rest] = args.slice(1);
    const val = rest.join(" ");
    if (!bot || !field || !val) {
      console.error("Usage: alpclaw config set-bot <bot> <field> <value>");
      process.exit(2);
    }
    setBotCredential(bot, field, val);
    console.log(pc.green(`✓ ${bot}.${field} saved`));
    return;
  }

  console.error("Unknown config subcommand. Use: list | path | set | set-key | set-bot");
  process.exit(2);
}

// ──────────────────────────────────────────────────────────────────────────
// Bots
// ──────────────────────────────────────────────────────────────────────────

async function runBot(name: string) {
  const spec = BOT_SPECS[name];
  if (!spec) {
    console.error(`Unknown platform: ${name}`);
    process.exit(2);
  }

  // Hydrate env from global config (bots.<name>.*) so bot files can stay env-var-based.
  const cfg = readGlobalConfig();
  const botCreds = cfg.bots?.[name] || {};
  const env = { ...process.env };
  for (const k of spec.requiredKeys) {
    if (!env[k] && botCreds[k]) env[k] = botCreds[k];
  }
  // Also hydrate provider keys for the agent itself.
  for (const [prov, key] of Object.entries(cfg.apiKeys || {})) {
    const envKey = providerEnvKey(prov);
    if (envKey && !env[envKey]) env[envKey] = key;
  }

  // Check required keys.
  const missing = spec.requiredKeys.filter((k) => !env[k]);
  if (missing.length) {
    console.error(pc.red(`Missing ${spec.label} credentials: ${missing.join(", ")}`));
    console.error(pc.dim("Run `alpclaw config set-bot " + name + " <FIELD> <value>` for each."));
    process.exit(2);
  }

  const alpclawHome = process.env.ALPCLAW_HOME || process.cwd();
  const botPath = path.resolve(alpclawHome, "bots", spec.file);
  if (!fs.existsSync(botPath)) {
    console.error(pc.red(`Bot entrypoint not found at ${botPath}`));
    process.exit(1);
  }

  console.log(renderBanner({ subtitle: `${spec.label} bridge` }));
  console.log(pc.dim(`Starting ${name}...`));

  const tsxName = process.platform === "win32" ? "tsx.cmd" : "tsx";
  const tsxCandidates = [
    path.resolve(alpclawHome, "node_modules", ".bin", tsxName),
    path.resolve(alpclawHome, "..", "..", "node_modules", ".bin", tsxName),
    tsxName,
  ];
  const tsxBin = tsxCandidates.find((p) => fs.existsSync(p)) || tsxName;

  const result = spawnSync(tsxBin, [botPath], { stdio: "inherit", env });
  process.exit(result.status ?? 0);
}

function providerEnvKey(provider: string): string | null {
  switch (provider) {
    case "claude":     return "ANTHROPIC_API_KEY";
    case "openai":     return "OPENAI_API_KEY";
    case "gemini":     return "GOOGLE_API_KEY";
    case "deepseek":   return "DEEPSEEK_API_KEY";
    case "openrouter": return "OPENROUTER_API_KEY";
    default:           return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// One-shot + chat
// ──────────────────────────────────────────────────────────────────────────

function loadPersona(): string | undefined {
  const localChar = path.resolve(process.cwd(), "character.md");
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const globalChar = path.resolve(home, ".alpclaw", "character.md");
  if (fs.existsSync(localChar)) return fs.readFileSync(localChar, "utf-8");
  if (fs.existsSync(globalChar)) return fs.readFileSync(globalChar, "utf-8");
  return undefined;
}

function ensureConfigured(): void {
  const cfg = readGlobalConfig();
  const hasKey = Object.values(cfg.apiKeys || {}).some(Boolean) ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OLLAMA_BASE_URL;

  if (!hasKey) {
    console.log(renderBanner({ subtitle: "First run" }));
    console.log(pc.yellow("No API key configured yet. Run:"));
    console.log(`  ${pc.cyan("alpclaw init")}`);
    console.log(pc.dim("Or, without the wizard:"));
    console.log(`  ${pc.cyan("alpclaw config set-key openrouter sk-or-...")}`);
    process.exit(1);
  }
}

function buildAgent(): AlpClaw {
  ensureConfigured();
  try {
    return AlpClaw.create();
  } catch (err) {
    console.error(pc.red(`Failed to initialize AlpClaw: ${String(err)}`));
    process.exit(1);
  }
}

async function runOneShot(prompt: string) {
  const alpclaw = buildAgent();
  console.log(renderBanner({ subtitle: "Task", compact: true }));
  await runTask(alpclaw, prompt, loadPersona());
}

async function openChat() {
  const alpclaw = buildAgent();
  console.log(renderBanner({ subtitle: "Chat" }));
  p.intro(pc.bgCyan(pc.black(" ALPCLAW ")));
  p.log.message(pc.dim("Type your task. `exit` quits. `/help` for commands."));

  while (true) {
    const input = await p.text({
      message: pc.cyan("you"),
      placeholder: "e.g., scan this folder for bugs, build a fastapi app",
      validate: (val) => (!val || val.trim().length === 0 ? "Please enter a task." : undefined),
    });

    if (p.isCancel(input)) break;
    const text = String(input).trim();
    if (!text || text === "exit" || text === "quit") break;
    if (text === "/help") { printHelp(); continue; }
    if (text === "/config") { await runConfig(["list"]); continue; }

    await runTask(alpclaw, text, loadPersona());
  }

  p.outro(pc.cyan("bye"));
}

async function runTask(alpclaw: AlpClaw, description: string, persona?: string): Promise<void> {
  let s = p.spinner();
  let currentPhase = "";

  const updateSpinner = (message: string) => {
    if (currentPhase && currentPhase !== message) {
      s.stop(pc.green(`✓ ${currentPhase}`));
      s = p.spinner();
    }
    currentPhase = message;
    s.start(pc.blue(message));
  };

  p.log.step(pc.bold(description));

  const agent = alpclaw.createAgent({
    systemPersona: persona,
    onPhaseChange: (phase: AgentPhase, _task: Task) => {
      updateSpinner(PHASE_LABELS[phase] || phase);
    },
    onToolCall: (toolName: string, args: Record<string, unknown>) => {
      s.message(`${pc.magenta("⚡")} ${pc.bold(toolName)} ${pc.dim(JSON.stringify(args).slice(0, 60))}`);
    },
    onStepComplete: () => {},
    onError: (error: string, phase: AgentPhase) => {
      p.log.error(pc.red(`[${phase}] ${error}`));
    },
    onConfirmationRequired: async (action: string, risk: string): Promise<boolean> => {
      s.stop("Safety engine paused execution.");
      const allowed = await p.confirm({
        message: `${pc.bgYellow(pc.black(" WARN "))} ${pc.bold(action)} (risk: ${pc.red(risk)}). Allow?`,
      });
      s = p.spinner();
      s.start("Resuming...");
      return !!allowed && !p.isCancel(allowed);
    },
  });

  const result = await agent.run(description);

  if (currentPhase) s.stop(pc.green(`✓ ${currentPhase}`));

  if (result.ok) {
    const task = result.value;
    const body = task.result?.summary ? marked.parse(task.result.summary) : "No output.";
    p.note(
      [
        `${pc.cyan("status:")} ${task.status === "completed" ? pc.green(task.status) : pc.yellow(task.status)}`,
        `${pc.cyan("steps:")}  ${task.steps.length}`,
        `\n${body}`,
      ].join("\n"),
      "Result",
    );
  } else {
    p.log.error(pc.bgRed(pc.white(" ERROR ")) + " " + result.error.message);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function redact(v: string): string {
  if (!v) return "";
  if (v.length <= 8) return "****";
  return v.slice(0, 4) + "…" + v.slice(-4);
}

function abort(): never {
  p.cancel("Setup cancelled.");
  process.exit(0);
}

main().catch((err) => {
  console.error(pc.bgRed(pc.white(" FATAL ")) + `\n\n${err?.stack || err}`);
  process.exit(1);
});
