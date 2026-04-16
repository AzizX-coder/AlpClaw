import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@alpclaw/utils": resolve(__dirname, "packages/utils/src/index.ts"),
      "@alpclaw/config": resolve(__dirname, "packages/config/src/index.ts"),
      "@alpclaw/safety": resolve(__dirname, "packages/safety/src/index.ts"),
      "@alpclaw/memory": resolve(__dirname, "packages/memory/src/index.ts"),
      "@alpclaw/providers": resolve(__dirname, "packages/providers/src/index.ts"),
      "@alpclaw/connectors": resolve(__dirname, "packages/connectors/src/index.ts"),
      "@alpclaw/skills": resolve(__dirname, "packages/skills/src/index.ts"),
      "@alpclaw/core": resolve(__dirname, "packages/core/src/index.ts"),
    },
  },
});
