import { describe, it, expect } from "vitest";
import { HttpConnector } from "./http.js";

describe("HttpConnector", () => {
  const http = new HttpConnector({ timeoutMs: 2000 });

  it("rejects non-http URLs", async () => {
    const res = await http.execute("request", { url: "file:///etc/passwd" });
    expect(res.ok).toBe(false);
  });

  it("rejects unknown actions", async () => {
    const res = await http.execute("mystery", { url: "https://example.com" });
    expect(res.ok).toBe(false);
  });

  it("lists a single request action", () => {
    const actions = http.listActions();
    expect(actions).toHaveLength(1);
    expect(actions[0]!.name).toBe("request");
  });

  it("exposes a tool definition namespaced as http.request", () => {
    const tools = http.toToolDefinitions();
    expect(tools[0]!.name).toBe("http.request");
  });
});
