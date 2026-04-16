import type { Result } from "@alpclaw/utils";
import { ok, err } from "@alpclaw/utils";
import type { Skill, SkillContext, SkillManifest, SkillResult } from "../skill.js";

export class DatabaseAdminSkill implements Skill {
  readonly manifest: SkillManifest = {
    name: "database-admin",
    description: "Inspect local SQLite databases or Postgres configurations",
    version: "1.0.0",
    tags: ["database", "sql", "sqlite", "query", "admin"],
    requiredConnectors: ["terminal"],
    parameters: {
      type: "object",
      properties: {
        database_path: {
          type: "string",
          description: "Path to the sqlite database file",
        },
        query: {
          type: "string",
          description: "The SQL query to execute safely (READ ONLY)",
        },
      },
      required: ["database_path", "query"],
    },
  };

  async execute(params: Record<string, unknown>, ctx: SkillContext): Promise<Result<SkillResult>> {
    try {
      const dbPath = params.database_path as string;
      const query = params.query as string;

      if (!query.trim().toLowerCase().startsWith("select") && !query.trim().toLowerCase().startsWith(".table") && !query.trim().toLowerCase().startsWith(".schema")) {
        return err(new Error("Security violation: Only SELECT, .tables, or .schema queries are permitted by the db-admin skill."));
      }

      ctx.log(`Executing SQL on ${dbPath}`);
      const command = `sqlite3 "${dbPath}" "${query}" -header -column`;

      const result = await ctx.runConnector("terminal", "run", {
        command,
      });

      if (!result.ok) {
        return err(new Error(`SQL execution failed: ${result.error.message}`));
      }

      const output = (result.value as any)?.stdout || String(result.value);

      return ok({
        success: true,
        output: output.trim() ? output : "Query returned 0 rows.",
        summary: `Executed database query on ${dbPath}.`,
      });
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
