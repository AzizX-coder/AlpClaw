#!/usr/bin/env tsx

/**
 * AlpClaw CLI — interactive agent runner.
 *
 * Usage:
 *   pnpm dev                     # Start interactive mode
 *   pnpm dev "analyze this repo" # Run a single task
 */

import { createInterface } from "node:readline";
import { AlpClaw } from "@alpclaw/core";
import type { AgentPhase, Task } from "@alpclaw/utils";
import { createLogger } from "@alpclaw/utils";

const log = createLogger("cli");

const PHASE_LABELS: Record<AgentPhase, string> = {
  intake: "Receiving task",
  understand: "Understanding",
  plan: "Planning",
  context_fetch: "Fetching context",
  tool_select: "Selecting tools",
  execute: "Executing",
  verify: "Verifying",
  correct: "Self-correcting",
  finalize: "Finalizing",
  persist: "Saving memory",
};

async function main() {
  console.log(`
╔══════════════════════════════════════════════╗
║          ▄▀█ █░░ █▀█ █▀▀ █░░ ▄▀█ █░█░█     ║
║          █▀█ █▄▄ █▀▀ █▄▄ █▄▄ █▀█ ▀▄▀▄▀     ║
║                                              ║
║        Autonomous Agent Platform v0.1        ║
╚══════════════════════════════════════════════╝
`);

  // Initialize AlpClaw
  const alpclaw = AlpClaw.create();

  const providerList = alpclaw.router.listProviders();
  const available = providerList.filter((p) => p.available);
  const connectorList = alpclaw.connectors.list();
  const skillList = alpclaw.skills.list();

  console.log(`Providers:  ${providerList.map((p) => `${p.name}${p.available ? " ✓" : " ✗"}`).join(", ")}`);
  console.log(`Connectors: ${connectorList.map((c) => c.name).join(", ")}`);
  console.log(`Skills:     ${skillList.map((s) => s.name).join(", ")}`);
  console.log(`Safety:     ${alpclaw.config.safety.mode} mode`);
  console.log("");

  if (available.length === 0) {
    console.log("⚠  No providers configured. Set API keys in .env file.");
    console.log("   See .env.example for required variables.");
    console.log("   The agent will not be able to plan or reason without a provider.\n");
  }

  // Check for single-task mode
  const taskArg = process.argv[2];
  if (taskArg) {
    await runTask(alpclaw, taskArg);
    return;
  }

  // Interactive mode
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question("\n🔹 Enter task (or 'quit'): ", async (input) => {
      const trimmed = input.trim();
      if (trimmed === "quit" || trimmed === "exit" || trimmed === "q") {
        console.log("Goodbye!");
        rl.close();
        return;
      }

      if (trimmed.length === 0) {
        prompt();
        return;
      }

      await runTask(alpclaw, trimmed);
      prompt();
    });
  };

  prompt();
}

async function runTask(alpclaw: AlpClaw, description: string): Promise<void> {
  console.log(`\n─── Task: ${description} ───\n`);

  const agent = alpclaw.createAgent({
    onPhaseChange: (phase: AgentPhase, task: Task) => {
      const label = PHASE_LABELS[phase] || phase;
      process.stdout.write(`  ◆ ${label}...\n`);
    },
    onToolCall: (toolName: string, args: Record<string, unknown>) => {
      console.log(`  ⚡ Tool: ${toolName}`, JSON.stringify(args).slice(0, 80));
    },
    onStepComplete: (step: string, result: unknown) => {
      console.log(`  ✓ ${step}`);
    },
    onError: (error: string, phase: AgentPhase) => {
      console.log(`  ✗ [${phase}] ${error}`);
    },
    onConfirmationRequired: async (action: string, risk: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`  ⚠ ${action} (risk: ${risk}). Allow? [y/N] `, (answer) => {
          rl.close();
          resolve(answer.toLowerCase() === "y");
        });
      });
    },
  });

  const result = await agent.run(description);

  console.log("\n─── Result ───\n");

  if (result.ok) {
    const task = result.value;
    console.log(`Status:  ${task.status}`);
    console.log(`Steps:   ${task.steps.length}`);
    console.log(`Retries: ${task.retries}`);
    if (task.result) {
      console.log(`Success: ${task.result.success}`);
      console.log(`Summary: ${task.result.summary}`);
    }
  } else {
    console.log(`Error: ${result.error.message}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
