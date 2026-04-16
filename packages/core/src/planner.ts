import type { Message, Result } from "@alpclaw/utils";
import { ok, err, createError, createLogger } from "@alpclaw/utils";
import type { ProviderRouter } from "@alpclaw/providers";
import type { SkillManifest, ToolDefinition } from "@alpclaw/utils";

const log = createLogger("core:planner");

export interface Plan {
  steps: PlanStep[];
  reasoning: string;
  estimatedComplexity: "simple" | "moderate" | "complex";
}

export interface PlanStep {
  description: string;
  toolOrSkill?: string;
  dependsOn?: number[];
}

/**
 * Planner uses the LLM to break down tasks into executable steps.
 */
export class Planner {
  constructor(private router: ProviderRouter) {}

  async createPlan(
    taskDescription: string,
    availableTools: ToolDefinition[],
    availableSkills: SkillManifest[],
    contextHints: string[] = [],
  ): Promise<Result<Plan>> {
    const toolNames = availableTools.map((t) => `${t.name}: ${t.description}`).join("\n");
    const skillNames = availableSkills.map((s) => `${s.name}: ${s.description}`).join("\n");
    const context = contextHints.length > 0 ? `\nRelevant context:\n${contextHints.join("\n")}` : "";

    const systemPrompt = `You are a task planner for an autonomous agent. Break down the user's task into concrete, executable steps.

Available tools:
${toolNames}

Available skills:
${skillNames}
${context}

Respond with a JSON object matching this schema:
{
  "reasoning": "brief explanation of your approach",
  "estimatedComplexity": "simple" | "moderate" | "complex",
  "steps": [
    { "description": "what to do", "toolOrSkill": "name of tool/skill to use (optional)", "dependsOn": [step indices this depends on (optional)] }
  ]
}

Keep the plan practical and minimal. Only include steps that are necessary.`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: taskDescription },
    ];

    log.info("Creating plan", { taskDescription: taskDescription.slice(0, 100) });

    const result = await this.router.route(
      { messages, temperature: 0.2, maxTokens: 2000 },
      { taskType: "reasoning" },
    );

    if (!result.ok) return result as Result<never>;

    try {
      const content = result.value.content.trim();
      // Extract JSON from potential markdown code block
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return err(createError("task", "Planner did not return valid JSON"));
      }

      const plan = JSON.parse(jsonMatch[0]) as Plan;

      if (!plan.steps || plan.steps.length === 0) {
        return err(createError("task", "Planner returned empty plan"));
      }

      log.info("Plan created", {
        steps: plan.steps.length,
        complexity: plan.estimatedComplexity,
      });

      return ok(plan);
    } catch (cause) {
      return err(createError("task", "Failed to parse plan", { cause }));
    }
  }
}
