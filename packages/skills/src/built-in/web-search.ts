import { type Result, type SkillManifest, type SkillResult, ok, err, createError } from "@alpclaw/utils";
import type { Skill, SkillContext } from "../skill.js";

/**
 * WebSearchSkill - Queries the web natively via search endpoints if provided or simply
 * instructs the agent how to utilize curl/connectors to simulate web searches.
 * Note: For a real production system, this would integrate with SERP API or Tavily API.
 */
export class WebSearchSkill implements Skill {
  readonly manifest: SkillManifest = {
    name: "web-search",
    description: "Search the web for real-time information",
    version: "1.0.0",
    tags: ["search", "web", "research", "internet"],
    requiredConnectors: ["terminal"], // Relies on curl executing locally to scrape if no API key is available
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search term or question to look up online",
        },
      },
      required: ["query"],
    },
  };

  async execute(params: Record<string, unknown>, ctx: SkillContext): Promise<Result<SkillResult>> {
    try {
      const query = params.query as string;
      ctx.log(`Executing web search for: ${query}`);

      // We use duckduckgo-lite to scrape without an API key natively.
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const curlCommand = `curl -s "${url}" | grep -o 'class="result__snippet[^>]*>.*</a>' | sed 's/<[^>]*>//g' | head -n 5`;

      const result = await ctx.runConnector("terminal.run", {
        command: curlCommand,
      });

      if (!result.ok) {
        return err(createError("skill", `Search execution failed: ${result.error.message}`));
      }

      // The result from terminal connector includes stdout and stderr
      const output = (result.value as any)?.stdout || String(result.value);
      const text = output.trim();

      if (!text) {
        return ok({
          success: false,
          output: "No results found.",
          summary: `Search for '${query}' yielded no immediate results.`,
        });
      }

      return ok({
        success: true,
        output: `Web Search Results for '${query}':\n\n${text}`,
        summary: `Found web results for '${query}'.`,
      });
    } catch (e) {
      return err(createError("skill", String(e)));
    }
  }
}
