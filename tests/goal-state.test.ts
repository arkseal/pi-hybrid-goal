import { describe, expect, it, beforeEach } from "bun:test";
import { GoalManager } from "../src/goal-state";

describe("Goal State Manager", () => {
  beforeEach(() => {
    GoalManager.reset();
  });

  it("initializes an active goal", () => {
    GoalManager.startGoal("Implement OAuth PKCE flow", ["Must use Node crypto", "Add tests"]);
    const active = GoalManager.getActiveGoal();

    expect(active).toBeDefined();
    expect(active?.objective).toBe("Implement OAuth PKCE flow");
    expect(active?.status).toBe("in_progress");
    expect(active?.constraints.length).toBe(2);
  });

  it("marks goal complete with summary", () => {
    GoalManager.startGoal("Fix issue #42");
    const result = GoalManager.completeGoal("Fixed null pointer exception and added regression test.");

    expect(result.success).toBe(true);
    expect(GoalManager.getActiveGoal()?.status).toBe("completed");
    expect(GoalManager.getActiveGoal()?.summary).toContain("Fixed null pointer exception");
  });

  it("marks goal blocked with reason", () => {
    GoalManager.startGoal("Deploy to AWS");
    const result = GoalManager.blockGoal("Missing AWS_ACCESS_KEY_ID in environment", "Ask user to set credentials");

    expect(result.success).toBe(true);
    expect(GoalManager.getActiveGoal()?.status).toBe("blocked");
    expect(GoalManager.getActiveGoal()?.blockReason).toContain("Missing AWS_ACCESS_KEY_ID");
  });
});
