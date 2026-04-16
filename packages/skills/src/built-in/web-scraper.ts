import type { Result, SkillManifest, SkillResult } from "@alpclaw/utils";
import { ok, err, createError } from "@alpclaw/utils";
import type { Skill, SkillContext } from "../skill.js";

/**
 * Web scraper — fetches a URL via the browser connector and extracts
 * structured information matching the user-provided question.
 */
export class WebScraperSkill implements Skill {
  readonly manifest: SkillManifest = {
    name: "web-scraper",
    description: "Fetch a webpage and extract structured answers to a specific question.",
    version: "1.0.0",
    tags: ["web", "scrape", "extract", "crawl", "research"],
    requiredConnectors: ["browser"],
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to scrape." },
        question: { type: "string", description: "What information to extract from the page." },
        followLinks: { type: "boolean", description: "If true, also list outbound links." },
      },
      required: ["url", "question"],
    },
  };

  async execute(params: Record<string, unknown>, ctx: SkillContext): Promise<Result<SkillResult>> {
    const url = String(params.url || "");
    const question = String(params.question || "");
    if (!url || !question) return err(createError("validation", "web-scraper requires url + question"));

    const page = await ctx.runConnector("browser.fetch_text", { url });
    if (!page.ok) return err(page.error);

    const { text } = page.value as { text: string };
    const linksPayload = params.followLinks
      ? await ctx.runConnector("browser.fetch_links", { url, limit: 20 })
      : null;

    const prompt = `You extracted this page text from ${url}. Answer the question strictly from this text — do not invent facts. If the answer isn't present, say so.

Question: ${question}

Page text:
"""
${text.slice(0, 12000)}
"""`;

    const answer = await ctx.complete(prompt, { temperature: 0.1 });
    if (!answer.ok) return answer as Result<never>;

    return ok({
      success: true,
      output: {
        url,
        question,
        answer: answer.value,
        links: linksPayload?.ok ? (linksPayload.value as any).links : undefined,
      },
      summary: answer.value,
    });
  }
}
