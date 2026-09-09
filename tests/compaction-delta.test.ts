import { describe, expect, it, beforeEach } from "bun:test";
import { GoalManager } from "../src/goal-state";
import { buildCompactionGoalDelta } from "../src/compaction-delta";

describe("Compaction Goal Delta", () => {
  beforeEach(() => {
    GoalManager.reset();
  });

  it("returns null when no goal is active", () => {
    const delta = buildCompactionGoalDelta();
    expect(delta).toBeNull();
  });

  it("generates a concise <150 token delta block when a goal is active", () => {
    GoalManager.startGoal("Refactor database connection pool", [
      "Keep backward compatibility",
      "Ensure pool drains on SIGTERM",
    ]);

    const delta = buildCompactionGoalDelta();
    expect(delta).toBeDefined();
    expect(delta).toContain("POST-COMPACTION RESYNC");
    expect(delta).toContain("Objective: Refactor database connection pool");
    expect(delta).toContain("Constraints:");
    expect(delta).toContain("- Keep backward compatibility");
    // Ensure size is strictly bounded
    expect(delta!.length).toBeLessThan(600);
  });
});
