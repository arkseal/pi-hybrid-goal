import { GoalManager } from "./goal-state.js";

export function buildCompactionGoalDelta(): string | null {
  const goal = GoalManager.getActiveGoal();
  if (!goal || goal.status !== "in_progress") {
    return null;
  }

  const durationSec = Math.round((Date.now() - goal.startTime) / 1000);
  const lines = [
    `[POST-COMPACTION RESYNC id=${goal.id}]`,
    `Objective: ${goal.objective.slice(0, 200)}`,
    `Elapsed: ${durationSec}s`,
  ];

  if (goal.constraints.length > 0) {
    lines.push("Constraints:");
    for (const c of goal.constraints.slice(0, 5)) {
      lines.push(`- ${c.slice(0, 100)}`);
    }
  }

  lines.push("Instruction: Continue working toward completing this objective autonomously.");
  lines.push("Call goal_complete when all requirements and tests pass, or goal_blocked if unable to proceed.");

  return lines.join("\n");
}
