#!/usr/bin/env tsx

/**
 * AlpClaw CLI — interactive agent runner.
 * Powered by @clack/prompts for a modern animated UX.
 *
 * Usage:
 *   alpclaw                     # Start interactive mode
 *   alpclaw "analyze this repo" # Run a single task
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { AlpClaw } from "@alpclaw/core";
import type { AgentPhase, Task } from "@alpclaw/utils";
import { createLogger, renderBanner, style } from "@alpclaw/utils";

const log = createLogger("cli");

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

async function main() {
  // Clear screen and show banner
  console.clear();
  console.log(renderBanner({ subtitle: "Autonomous Agent Platform v0.2.0" }));

  p.intro(pc.bgCyan(pc.black(" SYSTEM BOOT ")));

  // Initialize AlpClaw
  const s = p.spinner();
  s.start("Initializing subsystems and loading providers");

  let alpclaw: AlpClaw;
  try {
    alpclaw = AlpClaw.create();
  } catch (err) {
    s.stop("Failed to initialize");
    p.cancel(String(err));
    process.exit(1);
  }

  const providerList = alpclaw.router.listProviders();
  const available = providerList.filter((p) => p.available);
  const connectorList = alpclaw.connectors.list();
  const skillList = alpclaw.skills.list();

  s.stop("All systems nominal.");

  // Display loaded modules
  p.note(
    [
      `${pc.cyan("Providers:")}  ${providerList.map((p) => `${p.name}${p.available ? pc.green(" ✓") : pc.red(" ✗")}`).join(", ")}`,
      `${pc.cyan("Connectors:")} ${connectorList.map((c) => c.name).join(", ")}`,
      `${pc.cyan("Skills:")}     ${skillList.map((s) => s.name).join(", ")}`,
      `${pc.cyan("Safety:")}     ${alpclaw.config.safety.mode} mode`,
    ].join("\n"),
    "Platform Status",
  );

  if (available.length === 0) {
    p.log.warn(pc.yellow("No default providers configured. Set API keys in .env file."));
    p.log.message(pc.dim("The agent will not be able to plan or reason without an active provider.\n"));
  }

  // Check for single-task mode
  const taskArg = process.argv[2];
  if (taskArg) {
    await runTask(alpclaw, taskArg);
    p.outro(pc.cyan("Execution completed. Shutting down."));
    return;
  }

  // Interactive mode
  while (true) {
    const input = await p.text({
      message: "What can I do for you today?",
      placeholder: "e.g., analyze this repo, fix the login bug, generate a readme",
      validate: (val) => (val.trim().length === 0 ? "Please enter a task." : undefined),
    });

    if (p.isCancel(input) || input.toLowerCase() === "quit" || input.toLowerCase() === "exit") {
      p.outro(pc.cyan("Logging off. Goodbye!"));
      break;
    }

    await runTask(alpclaw, input as string);
  }
}

async function runTask(alpclaw: AlpClaw, description: string): Promise<void> {
  let s = p.spinner();
  let currentPhase = "";
  
  // A small helper to restart spinners with new messages
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
    onStepComplete: (step: string, result: unknown) => {
       // Just update the phase
    },
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
    p.note(
      [
        `${pc.cyan("Status:")}   ${task.status === "completed" ? pc.green(task.status) : pc.yellow(task.status)}`,
        `${pc.cyan("Steps:")}    ${task.steps.length}`,
        `${pc.cyan("Retries:")}  ${task.retries}`,
        task.result ? `\n${pc.bold("Summary:")} ${task.result.summary}` : "",
      ].join("\n"),
      "Task Report",
    );
  } else {
    p.log.error(pc.bgRed(pc.white(` ERROR `)) + " " + result.error.message);
  }
}

main().catch((err) => {
  p.log.error(pc.bgRed(pc.white(" FATAL ERROR ")) + `\n\n${err?.stack || err}`);
  process.exit(1);
});

