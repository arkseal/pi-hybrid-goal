import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { GoalManager } from "./goal-state.js";
import { buildCompactionGoalDelta } from "./compaction-delta.js";

export { GoalManager } from "./goal-state.js";
export { buildCompactionGoalDelta } from "./compaction-delta.js";

let pendingCompactionDelta: string | null = null;

export default function hybridGoalExtension(pi: ExtensionAPI) {
  // 1. Tool: goal_complete
  pi.registerTool({
    name: "goal_complete",
    label: "Goal Complete",
    description: "Signal that the current autonomous goal objective has been completely satisfied and verified.",
    promptSnippet: "Mark the active goal as complete with a verification summary",
    parameters: Type.Object(
      {
        summary: Type.String({
          description: "Summary of changes made, tests passed, and criteria satisfied",
        }),
      },
      { additionalProperties: false }
    ),
    renderCall(args: any, theme: any, context: any) {
      const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
      let content = theme.fg("success", theme.bold("goal_complete "));
      if (args?.summary) {
        const preview = args.summary.length > 70 ? `${args.summary.slice(0, 67)}...` : args.summary;
        content += theme.fg("muted", `"${preview}"`);
      }
      text.setText(content);
      return text;
    },
    async execute(_toolCallId, params) {
      const res = GoalManager.completeGoal(params.summary);
      if (!res.success) {
        return {
          content: [{ type: "text", text: `Error: ${res.error}` }],
          details: { error: res.error },
        };
      }
      return {
        content: [{ type: "text", text: `Goal completed successfully:\n${params.summary}` }],
        details: { status: "completed" },
      };
    },
  });

  // 2. Tool: goal_blocked
  pi.registerTool({
    name: "goal_blocked",
    label: "Goal Blocked",
    description: "Signal that the goal cannot proceed without user input, missing credentials, or external blockers.",
    promptSnippet: "Pause goal when blocked on missing credentials or ambiguous requirements",
    parameters: Type.Object(
      {
        reason: Type.String({ description: "Why the goal cannot continue autonomously" }),
        suggestedAction: Type.Optional(
          Type.String({ description: "What the user can do to unblock the goal" })
        ),
      },
      { additionalProperties: false }
    ),
    renderCall(args: any, theme: any, context: any) {
      const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
      let content = theme.fg("error", theme.bold("goal_blocked "));
      if (args?.reason) {
        const preview = args.reason.length > 70 ? `${args.reason.slice(0, 67)}...` : args.reason;
        content += theme.fg("accent", `"${preview}"`);
      }
      text.setText(content);
      return text;
    },
    async execute(_toolCallId, params) {
      const res = GoalManager.blockGoal(params.reason, params.suggestedAction);
      if (!res.success) {
        return {
          content: [{ type: "text", text: `Error: ${res.error}` }],
          details: { error: res.error },
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Goal blocked: ${params.reason}${params.suggestedAction ? `\nSuggested action: ${params.suggestedAction}` : ""}`,
          },
        ],
        details: { status: "blocked" },
      };
    },
  });

  // 3. Tool: goal_wait
  pi.registerTool({
    name: "goal_wait",
    label: "Goal Wait",
    description: "Pause execution briefly to await asynchronous background processes or external changes.",
    promptSnippet: "Wait for background build or test run",
    parameters: Type.Object(
      {
        seconds: Type.Optional(
          Type.Integer({ minimum: 1, maximum: 60, description: "Seconds to pause (default 5)" })
        ),
      },
      { additionalProperties: false }
    ),
    renderCall(args: any, theme: any, context: any) {
      const text = (context.lastComponent as Text | undefined) ?? new Text("", 0, 0);
      let content = theme.fg("toolTitle", theme.bold("goal_wait "));
      const sec = args?.seconds ?? 5;
      content += theme.fg("accent", `${sec}s`);
      text.setText(content);
      return text;
    },
    async execute(_toolCallId, params) {
      const sec = params.seconds ?? 5;
      await new Promise((r) => setTimeout(r, sec * 1000));
      return {
        content: [{ type: "text", text: `Waited for ${sec}s.` }],
        details: { waitedSeconds: sec },
      };
    },
  });

  // 4. Command: /goal <objective>
  pi.registerCommand("goal", {
    description: "Start an autonomous goal session: /goal <objective>",
    handler: async (args, ctx) => {
      const objective = (args ?? "").trim();
      if (!objective) {
        ctx.ui?.notify?.("Usage: /goal <objective description>", "warning");
        return;
      }
      const record = GoalManager.startGoal(objective);
      ctx.ui?.notify?.(`Started goal [${record.id}]: ${objective}`, "info");
    },
  });

  // 5. Compaction Resync: preserve goal objective after history compaction without busting prompt cache
  pi.on("session_before_compact", () => {
    pendingCompactionDelta = buildCompactionGoalDelta();
  });

  pi.on("context", (event) => {
    if (!pendingCompactionDelta) return;
    const delta = pendingCompactionDelta;
    pendingCompactionDelta = null;

    // Append as a user message at the end of the context (preserves system prompt cache prefix!)
    event.messages.push({
      role: "user",
      content: delta,
      timestamp: Date.now(),
    });
    return { messages: event.messages };
  });
}
