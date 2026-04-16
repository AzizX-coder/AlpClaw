import {
  type SafetyVerdict,
  type SafetyMode,
  type RiskLevel,
  createLogger,
} from "@alpclaw/utils";
import { BUILT_IN_POLICIES, type SafetyPolicy } from "./policies.js";

const log = createLogger("safety");

const RISK_ORDER: Record<RiskLevel, number> = {
  safe: 0,
  moderate: 1,
  dangerous: 2,
  destructive: 3,
};

/**
 * SafetyEngine evaluates actions against registered policies
 * and returns a verdict indicating whether the action is allowed.
 */
export class SafetyEngine {
  private policies: SafetyPolicy[];
  private mode: SafetyMode;
  private customBlockedPatterns: RegExp[];

  constructor(mode: SafetyMode = "standard", blockedPatterns: string[] = []) {
    this.mode = mode;
    this.policies = [...BUILT_IN_POLICIES];
    this.customBlockedPatterns = blockedPatterns.map((p) => new RegExp(p, "i"));
  }

  /**
   * Evaluate an action string (command, tool input, etc.) against all policies.
   */
  evaluate(action: string, context?: string): SafetyVerdict {
    // Check custom blocked patterns first — always blocked
    for (const pattern of this.customBlockedPatterns) {
      if (pattern.test(action) || (context && pattern.test(context))) {
        log.warn("Action blocked by custom pattern", { action, pattern: pattern.source });
        return {
          allowed: false,
          reason: `Blocked by custom safety pattern: ${pattern.source}`,
          requiresConfirmation: false,
          riskLevel: "destructive",
        };
      }
    }

    // Evaluate against built-in policies
    let highestRisk: RiskLevel = "safe";
    const mitigations: string[] = [];
    const matchedPolicies: SafetyPolicy[] = [];

    for (const policy of this.policies) {
      if (!policy.activeModes.includes(this.mode)) continue;

      for (const pattern of policy.patterns) {
        const target = context ? `${action} ${context}` : action;
        if (pattern.test(target)) {
          matchedPolicies.push(policy);
          if (RISK_ORDER[policy.riskLevel] > RISK_ORDER[highestRisk]) {
            highestRisk = policy.riskLevel;
          }
          mitigations.push(`${policy.name}: ${policy.description}`);
          break; // One match per policy is enough
        }
      }
    }

    if (matchedPolicies.length === 0) {
      return {
        allowed: true,
        requiresConfirmation: false,
        riskLevel: "safe",
      };
    }

    const verdict = this.computeVerdict(highestRisk, matchedPolicies);
    if (!verdict.allowed || verdict.requiresConfirmation) {
      log.warn("Safety check flagged action", {
        action: action.slice(0, 100),
        risk: highestRisk,
        policies: matchedPolicies.map((p) => p.name),
      });
    }

    return { ...verdict, mitigations };
  }

  private computeVerdict(
    riskLevel: RiskLevel,
    matched: SafetyPolicy[],
  ): SafetyVerdict {
    switch (this.mode) {
      case "strict":
        return {
          allowed: riskLevel === "safe" || riskLevel === "moderate",
          requiresConfirmation: riskLevel === "moderate",
          riskLevel,
          reason:
            riskLevel !== "safe"
              ? `Strict mode: ${matched.map((p) => p.name).join(", ")}`
              : undefined,
        };

      case "standard":
        return {
          allowed: riskLevel !== "destructive",
          requiresConfirmation: riskLevel === "dangerous" || riskLevel === "moderate",
          riskLevel,
          reason:
            riskLevel === "destructive"
              ? `Blocked: ${matched.map((p) => p.name).join(", ")}`
              : undefined,
        };

      case "permissive":
        return {
          allowed: true,
          requiresConfirmation: riskLevel === "destructive",
          riskLevel,
          reason:
            riskLevel === "destructive"
              ? `Requires confirmation: ${matched.map((p) => p.name).join(", ")}`
              : undefined,
        };
    }
  }

  /** Add a custom policy at runtime. */
  addPolicy(policy: SafetyPolicy): void {
    this.policies.push(policy);
  }

  /** Change safety mode. */
  setMode(mode: SafetyMode): void {
    this.mode = mode;
    log.info("Safety mode changed", { mode });
  }

  getMode(): SafetyMode {
    return this.mode;
  }
}
