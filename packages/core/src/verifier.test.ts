import { describe, it, expect } from "vitest";
import { Verifier } from "./verifier.js";

describe("Verifier", () => {
  const verifier = new Verifier();

  describe("verifyToolOutput", () => {
    it("passes for successful output", () => {
      const result = verifier.verifyToolOutput("fs.read", {}, "file contents");
      expect(result.passed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("fails for error output", () => {
      const result = verifier.verifyToolOutput("fs.read", {}, null, {
        kind: "connector",
        message: "File not found",
        retryable: false,
      });
      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("suggests retry for retryable errors", () => {
      const result = verifier.verifyToolOutput("fs.read", {}, null, {
        kind: "connector",
        message: "Network timeout",
        retryable: true,
      });
      expect(result.suggestions.some((s) => s.includes("retryable"))).toBe(true);
    });

    it("flags null output without error", () => {
      const result = verifier.verifyToolOutput("fs.read", {}, null);
      expect(result.passed).toBe(false);
    });

    it("flags non-zero exit codes from terminal", () => {
      const result = verifier.verifyToolOutput(
        "terminal.run",
        {},
        { exitCode: 1, stderr: "command not found" },
      );
      expect(result.passed).toBe(false);
      expect(result.issues.some((i) => i.includes("exit code"))).toBe(true);
    });
  });

  describe("verifyTaskCompletion", () => {
    it("passes when all steps succeed", () => {
      const result = verifier.verifyTaskCompletion("Test task", [
        { description: "Step 1", success: true },
        { description: "Step 2", success: true },
      ]);
      expect(result.passed).toBe(true);
    });

    it("fails when any step fails", () => {
      const result = verifier.verifyTaskCompletion("Test task", [
        { description: "Step 1", success: true },
        { description: "Step 2", success: false },
      ]);
      expect(result.passed).toBe(false);
      expect(result.issues.some((i) => i.includes("Step 2"))).toBe(true);
    });

    it("fails when no steps were executed", () => {
      const result = verifier.verifyTaskCompletion("Test task", []);
      expect(result.passed).toBe(false);
    });
  });
});
