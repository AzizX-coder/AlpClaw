import { describe, it, expect } from "vitest";
import { TaskManager } from "./task-manager.js";

describe("TaskManager", () => {
  it("creates a task with correct defaults", () => {
    const tm = new TaskManager();
    const task = tm.create("Test task");

    expect(task.id).toMatch(/^task_/);
    expect(task.description).toBe("Test task");
    expect(task.status).toBe("pending");
    expect(task.steps).toEqual([]);
    expect(task.retries).toBe(0);
    expect(task.maxRetries).toBe(3);
  });

  it("gets a task by ID", () => {
    const tm = new TaskManager();
    const task = tm.create("Find me");
    const found = tm.get(task.id);

    expect(found).toBeDefined();
    expect(found!.description).toBe("Find me");
  });

  it("updates task status", () => {
    const tm = new TaskManager();
    const task = tm.create("Status test");

    tm.setStatus(task.id, "executing");
    expect(tm.get(task.id)!.status).toBe("executing");
  });

  it("adds steps to a task", () => {
    const tm = new TaskManager();
    const task = tm.create("Multi-step");

    const step1 = tm.addStep(task.id, "First step", "fs.read");
    const step2 = tm.addStep(task.id, "Second step", "terminal.run");

    expect(task.steps.length).toBe(2);
    expect(step1.id).toMatch(/^step_/);
    expect(step2.toolName).toBe("terminal.run");
  });

  it("updates step status and output", () => {
    const tm = new TaskManager();
    const task = tm.create("Step update test");
    const step = tm.addStep(task.id, "Run command");

    tm.updateStep(task.id, step.id, { status: "executing" });
    expect(step.status).toBe("executing");
    expect(step.startedAt).toBeDefined();

    tm.updateStep(task.id, step.id, { status: "completed", output: "done" });
    expect(step.status).toBe("completed");
    expect(step.completedAt).toBeDefined();
    expect(step.output).toBe("done");
  });

  it("completes a task with a result", () => {
    const tm = new TaskManager();
    const task = tm.create("Complete me");

    tm.complete(task.id, {
      success: true,
      output: "all good",
      summary: "Task completed",
    });

    expect(task.status).toBe("completed");
    expect(task.result?.success).toBe(true);
  });

  it("handles retries correctly", () => {
    const tm = new TaskManager();
    const task = tm.create("Retry test");

    expect(tm.retry(task.id)).toBe(true);
    expect(task.retries).toBe(1);
    expect(task.status).toBe("correcting");

    expect(tm.retry(task.id)).toBe(true);
    expect(tm.retry(task.id)).toBe(true);
    expect(tm.retry(task.id)).toBe(false); // 4th attempt > maxRetries(3)
    expect(task.status).toBe("failed");
  });

  it("tracks parent-child relationships", () => {
    const tm = new TaskManager();
    const parent = tm.create("Parent task");
    const child1 = tm.create("Child 1", {}, parent.id);
    const child2 = tm.create("Child 2", {}, parent.id);

    const children = tm.getChildren(parent.id);
    expect(children.length).toBe(2);
    expect(children.map((c) => c.description)).toContain("Child 1");
    expect(children.map((c) => c.description)).toContain("Child 2");
  });

  it("lists all tasks", () => {
    const tm = new TaskManager();
    tm.create("Task A");
    tm.create("Task B");
    tm.create("Task C");

    expect(tm.list().length).toBe(3);
  });
});
