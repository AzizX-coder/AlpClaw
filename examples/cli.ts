#!/usr/bin/env tsx

/**
 * AlpClaw CLI — interactive agent runner.
 * Powered by @clack/prompts for an OpenClaw-like animated UX.
 */

import * as p from "@clack/prompts";
import pc from "picocolors"; // Wait, in other files picocolors is imported via `import pc from "picocolors"`. I'll let TS complain about CLI since tsx handles it fine. Let me fix the node core ones.
import { AlpClaw } from "@alpclaw/core";
import type { AgentPhase, Task } from "@alpclaw/utils";
import { createLogger, renderBanner } from "@alpclaw/utils";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

const log = createLogger("cli");

// Setup Markdown renderer for terminal (Auto CLI code shower)
marked.use(markedTerminal());

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

/**
 * Save an API key or config variable to local .env securely
 */
function saveToEnv(key: string, value: string) {
  const envPath = path.resolve(process.cwd(), ".env");
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  }

  // Replace or append
  const regex = new RegExp(`^${key}=.*`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}\n`;
  }

  fs.writeFileSync(envPath, content.trim() + "\n", "utf-8");
}

async function runSetup() {
  console.clear();
  console.log(renderBanner({ subtitle: "Onboarding Wizard" }));
  
  p.intro(pc.bgCyan(pc.black(" WELCOME TO ALPCLAW ")));
  p.log.message("Let's configure your agent platform. You can skip any step by hitting Enter.");

  const provider = await p.select({
    message: "Which default provider would you like to use for reasoning?",
    options: [
      { value: "ollama", label: "Ollama (Local/Free - Needs running service)" },
      { value: "openrouter", label: "OpenRouter (Access to DeepSeek, Qwen, Claude)" },
      { value: "claude", label: "Anthropic Claude" }
    ]
  });

  if (p.isCancel(provider)) process.exit(0);

  if (provider === "openrouter") {
    const key = await p.text({ message: "Enter your OpenRouter API Key:" });
    if (!p.isCancel(key) && key) saveToEnv("OPENROUTER_API_KEY", key as string);
  } else if (provider === "claude") {
    const key = await p.text({ message: "Enter your Anthropic API Key:" });
    if (!p.isCancel(key) && key) saveToEnv("ANTHROPIC_API_KEY", key as string);
  } else if (provider === "ollama") {
    p.log.message(pc.green("Ollama doesn't require an API key! Make sure it is running locally on port 11434."));
  }

  const safetyMode = await p.select({
    message: "Choose your Agent Safety Level:",
    options: [
      { value: "strict", label: "Strict (Requires human approval for ALL actions)" },
      { value: "standard", label: "Standard (Default, asks before dangerous deletions)" },
      { value: "permissive", label: "Permissive (Fully autonomous)" }
    ]
  });

  if (!p.isCancel(safetyMode)) {
    saveToEnv("ALPCLAW_SAFETY_MODE", safetyMode as string);
  }

  p.outro(pc.green("✓ Setup Complete! Run 'alpclaw' to enter the main menu."));
}

async function main() {
  const args = process.argv.slice(2);

  // Sub-commands routing
  if (args[0] === "setup") {
    await runSetup();
    return;
  }

  if (args[0] === "run" && args[1] === "telegram") {
    console.clear();
    console.log(renderBanner({ subtitle: "Telegram Connector Node" }));
    p.log.info("Spawning Telegraph process natively...");
    
    const botPath = path.resolve(process.cwd(), "bots", "telegram.ts");
    if(!fs.existsSync(botPath)) {
       p.log.error(pc.red("Telegram bot entrypoint not found at bots/telegram.ts"));
       process.exit(1);
    }
    
    // Spawn npx tsx bots/telegram.ts holding standard stdio forever
    const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
    spawnSync(cmd, ["tsx", botPath], { stdio: "inherit", env: process.env });
    return;
  }

  console.clear();
  console.log(renderBanner({ subtitle: "Autonomous Agent Platform v0.2.0" }));
  p.intro(pc.bgCyan(pc.black(" SYSTEM BOOT ")));

  const s = p.spinner();
  s.start("Initializing subsystems...");

  let alpclaw: AlpClaw;
  try {
    alpclaw = AlpClaw.create();
  } catch (err) {
    s.stop("Failed to initialize");
    p.cancel(String(err));
    process.exit(1);
  }

  s.stop(pc.green("All systems nominal."));

  // CLI execution if arguments are passed (direct prompt)
  if (args.length > 0) {
    await runTask(alpclaw, args.join(" "));
    p.outro(pc.cyan("Execution completed. Shutting down."));
    return;
  }

  // Interactive OpenClaw-like Main Menu
  await runMainMenu(alpclaw);
}

async function runMainMenu(alpclaw: AlpClaw) {
  while (true) {
    const action = await p.select({
      message: "AlpClaw Control Panel:",
      options: [
        { value: "chat", label: "💬 Agentic Chat (Start Task)" },
        { value: "telegram", label: "📱 Connect Telegram Node" },
        { value: "setup", label: "⚙️  Setup Wizard & Settings" },
        { value: "exit", label: "🚪 Exit" }
      ]
    });

    if (p.isCancel(action) || action === "exit") {
      p.outro(pc.cyan("Logging off. Goodbye!"));
      break;
    }

    if (action === "setup") {
      await runSetup();
      // Reload process so .env kicks in
      process.exit(0);
    }

    if (action === "telegram") {
      const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
      spawnSync(cmd, ["tsx", "examples/cli.ts", "run", "telegram"], { stdio: "inherit" });
      continue;
    }

    if (action === "chat") {
      // Chat loop
      while (true) {
        const input = await p.text({
          message: pc.cyan("What can I do for you? (type 'exit' to return to menu)"),
          placeholder: "e.g., scan my code for bugs, build a python script",
          validate: (val) => (val.trim().length === 0 ? "Please enter a task." : undefined),
        });

        if (p.isCancel(input) || input.toLowerCase() === "exit" || input.toLowerCase() === "menu") {
          break; // Go back to main menu
        }

        await runTask(alpclaw, input as string);
      }
    }
  }
}

async function runTask(alpclaw: AlpClaw, description: string): Promise<void> {
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

  p.log.step(pc.bold(`Executing: ${pc.cyan(description)}`));

  const agent = alpclaw.createAgent({
    onPhaseChange: (phase: AgentPhase, task: Task) => {
      const label = PHASE_LABELS[phase] || phase;
      updateSpinner(label);
    },
    onToolCall: (toolName: string, args: Record<string, unknown>) => {
      s.message(`${pc.magenta("⚡ Running")} ${pc.bold(toolName)} — ${pc.dim(JSON.stringify(args).slice(0, 50))}`);
    },
    onStepComplete: () => {},
    onError: (error: string, phase: AgentPhase) => {
      p.log.error(pc.red(`[${phase}] ${error}`));
    },
    onConfirmationRequired: async (action: string, risk: string): Promise<boolean> => {
      s.stop("Safety engine paused execution.");
      const allowed = await p.confirm({
        message: `${pc.bgYellow(pc.black(" WARN "))} Policy flagged action: ${pc.bold(action)} (Risk: ${pc.red(risk)}). Allow?`,
      });
      s = p.spinner();
      s.start("Resuming...");
      return !!allowed && !p.isCancel(allowed);
    },
  });

  const result = await agent.run(description);
  
  if (currentPhase) {
    s.stop(pc.green(`✓ ${currentPhase}`));
  }

  if (result.ok) {
    const task = result.value;
    
    // Auto CLI Code Shower -> Uses Marked
    const formattedSummary = task.result?.summary ? marked.parse(task.result.summary) : "No output.";
    
    p.note(
      [
        `${pc.cyan("Status:")}   ${task.status === "completed" ? pc.green(task.status) : pc.yellow(task.status)}`,
        `${pc.cyan("Steps:")}    ${task.steps.length}`,
        `\n${formattedSummary}`
      ].join("\n"),
      "Task Report"
    );
  } else {
    p.log.error(pc.bgRed(pc.white(` ERROR `)) + " " + result.error.message);
  }
}

main().catch((err) => {
  p.log.error(pc.bgRed(pc.white(" FATAL ERROR ")) + `\n\n${err?.stack || err}`);
  process.exit(1);
});
