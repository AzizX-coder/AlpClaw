import { describe, it, expect, beforeEach, afterAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { RunStore, RUN_SCHEMA_VERSION } from "./run-store.js";
import type { RunEvent } from "./events.js";

const base = fs.mkdtempSync(path.join(os.tmpdir(), "splash-runs-test-"));
const runsDir = path.join(base, "runs");
const logsDir = path.join(base, "logs");

describe("RunStore", () => {
  let store: RunStore;

  beforeEach(() => {
    if (fs.existsSync(base)) fs.rmSync(base, { recursive: true, force: true });
    store = new RunStore(runsDir, logsDir);
  });

  afterAll(() => {
    if (fs.existsSync(base)) fs.rmSync(base, { recursive: true, force: true });
  });

  it("persists and retrieves records", () => {
    store.save({
      schemaVersion: 1,
      id: "r1",
      task: "hello",
      mode: "foreground",
      status: "queued",
      createdAt: new Date().toISOString(),
      toolCalls: 0,
      steps: 0,
      retries: 0,
    });
    const got = store.get("r1");
    expect(got?.task).toBe("hello");
    expect(got?.status).toBe("queued");
  });

  it("rejects records with a different schema version", () => {
    const file = path.join(runsDir, "r2.json");
    fs.mkdirSync(runsDir, { recursive: true });
    fs.writeFileSync(
      file,
      JSON.stringify({
        schemaVersion: 999,
        id: "r2",
        task: "x",
        mode: "foreground",
        status: "queued",
        createdAt: "2024-01-01",
        toolCalls: 0,
        steps: 0,
        retries: 0,
      }),
    );
    expect(store.get("r2")).toBeNull();
  });

  it("lists runs newest-first", () => {
    store.save({
      schemaVersion: 1, id: "a", task: "a", mode: "foreground", status: "queued",
      createdAt: "2024-01-01T00:00:00Z", toolCalls: 0, steps: 0, retries: 0,
    });
    store.save({
      schemaVersion: 1, id: "b", task: "b", mode: "foreground", status: "queued",
      createdAt: "2024-06-01T00:00:00Z", toolCalls: 0, steps: 0, retries: 0,
    });
    const list = store.list();
    expect(list.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("appends events and reads them back", () => {
    const evts: RunEvent[] = [
      { type: "RunCreated", runId: "e1", at: "2024-01-01T00:00:00Z", task: "x", mode: "foreground" },
      { type: "RunStarted", runId: "e1", at: "2024-01-01T00:00:01Z" },
      { type: "PhaseChanged", runId: "e1", at: "2024-01-01T00:00:02Z", phase: "plan" },
    ];
    for (const e of evts) store.appendEvent("e1", e);
    const read = store.readEvents("e1");
    expect(read).toHaveLength(3);
    expect(read[2]?.type).toBe("PhaseChanged");
  });

  it("tail returns last N events", () => {
    for (let i = 0; i < 10; i++) {
      store.appendEvent("t1", {
        type: "LogLine", runId: "t1", at: new Date().toISOString(), level: "info", text: `msg ${i}`,
      });
    }
    const tail = store.tailEvents("t1", 3);
    expect(tail).toHaveLength(3);
    expect((tail[2] as any).text).toBe("msg 9");
  });

  it("schema version is 1", () => {
    expect(RUN_SCHEMA_VERSION).toBe(1);
  });
});
