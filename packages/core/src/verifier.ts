import type { Result, AlpClawError } from "@alpclaw/utils";
import { ok, err, createError, createLogger } from "@alpclaw/utils";

const log = createLogger("core:verifier");

export interface VerificationResult {
  passed: boolean;
  issues: string[];
  suggestions: string[];
}

/**
 * Verifier checks execution results for correctness and safety.
 */
export class Verifier {
  /**
   * Verify the output of a tool execution.
   */
  verifyToolOutput(
    toolName: string,
    input: Record<string, unknown>,
    output: unknown,
    error?: AlpClawError,
  ): VerificationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for errors
    if (error) {
      issues.push(`Tool ${toolName} returned error: ${error.message}`);
      if (error.retryable) {
        suggestions.push("Error is retryable — consider retrying with same or adjusted parameters");
      } else {
        suggestions.push("Error is not retryable — try a different approach");
      }
    }

    // Check for empty/null output when not expected
    if (!error && (output === null || output === undefined)) {
      issues.push(`Tool ${toolName} returned null/undefined output`);
      suggestions.push("Check if the tool parameters are correct");
    }

    // Check for command execution results
    if (toolName.startsWith("terminal")) {
      const cmdResult = output as { exitCode?: number; stderr?: string } | null;
      if (cmdResult?.exitCode && cmdResult.exitCode !== 0) {
        issues.push(`Command failed with exit code ${cmdResult.exitCode}`);
        if (cmdResult.stderr) {
          issues.push(`stderr: ${cmdResult.stderr.slice(0, 200)}`);
        }
        suggestions.push("Review command output and adjust");
      }
    }

    const passed = issues.length === 0;
    if (!passed) {
      log.warn("Verification failed", { toolName, issueCount: issues.length });
    }

    return { passed, issues, suggestions };
  }

  /**
   * Verify a task's overall completion.
   */
  verifyTaskCompletion(
    taskDescription: string,
    stepResults: { description: string; success: boolean; output?: unknown }[],
  ): VerificationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    const failedSteps = stepResults.filter((s) => !s.success);
    if (failedSteps.length > 0) {
      for (const step of failedSteps) {
        issues.push(`Step failed: ${step.description}`);
      }
      suggestions.push("Address failed steps before marking task complete");
    }

    if (stepResults.length === 0) {
      issues.push("No steps were executed");
      suggestions.push("Ensure the plan has actionable steps");
    }

    return { passed: issues.length === 0, issues, suggestions };
  }
}
