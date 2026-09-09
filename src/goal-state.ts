export interface GoalRecord {
  id: string;
  objective: string;
  constraints: string[];
  status: "in_progress" | "completed" | "blocked";
  startTime: number;
  endTime?: number;
  summary?: string;
  blockReason?: string;
  suggestedAction?: string;
}

let activeGoal: GoalRecord | null = null;
let goalHistory: GoalRecord[] = [];

export const GoalManager = {
  getActiveGoal(): GoalRecord | null {
    return activeGoal;
  },

  startGoal(objective: string, constraints: string[] = []): GoalRecord {
    if (activeGoal && activeGoal.status === "in_progress") {
      goalHistory.push(activeGoal);
    }

    const id = `goal_${Date.now().toString(36)}`;
    activeGoal = {
      id,
      objective: objective.trim(),
      constraints: constraints.map((c) => c.trim()).filter(Boolean),
      status: "in_progress",
      startTime: Date.now(),
    };

    return activeGoal;
  },

  completeGoal(summary: string): { success: boolean; goal?: GoalRecord; error?: string } {
    if (!activeGoal || activeGoal.status !== "in_progress") {
      return { success: false, error: "No active goal in progress to complete." };
    }

    activeGoal.status = "completed";
    activeGoal.summary = summary.trim();
    activeGoal.endTime = Date.now();

    const finished = activeGoal;
    goalHistory.push(finished);
    return { success: true, goal: finished };
  },

  blockGoal(reason: string, suggestedAction?: string): { success: boolean; goal?: GoalRecord; error?: string } {
    if (!activeGoal || activeGoal.status !== "in_progress") {
      return { success: false, error: "No active goal in progress to block." };
    }

    activeGoal.status = "blocked";
    activeGoal.blockReason = reason.trim();
    activeGoal.suggestedAction = suggestedAction?.trim();
    activeGoal.endTime = Date.now();

    return { success: true, goal: activeGoal };
  },

  reset(): void {
    activeGoal = null;
    goalHistory = [];
  },
};
