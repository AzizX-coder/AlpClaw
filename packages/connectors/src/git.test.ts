import { describe, it, expect } from "vitest";
import { GitConnector } from "./git.js";

describe("GitConnector", () => {
  const git = new GitConnector();

  it("exposes expected actions", () => {
    const names = git.listActions().map((a) => a.name).sort();
    expect(names).toEqual(["add", "branch", "commit", "diff", "log", "status"]);
  });

  it("rejects unknown actions", async () => {
    const res = await git.execute("teleport", {});
    expect(res.ok).toBe(false);
  });

  it("requires paths for add", async () => {
    const res = await git.execute("add", { paths: [] });
    expect(res.ok).toBe(false);
  });

  it("requires message for commit", async () => {
    const res = await git.execute("commit", { message: "" });
    expect(res.ok).toBe(false);
  });
});
