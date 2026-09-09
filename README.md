# pi-hybrid-goal

Minimal autonomous goal completion loop with compaction resync for the **pi** coding agent.

## Why This Architecture Minimizes Tokens

1. **Lean 3-Tool Surface (~150 tokens):**
   Heavy goal extensions register 8–12 tools with conversational questionnaires and complex state transitions (~600–900 prompt tokens per turn). `pi-hybrid-goal` exposes only **3 tools**:
   - `goal_complete`: `{ summary: string }`
   - `goal_blocked`: `{ reason: string, suggestedAction?: string }`
   - `goal_wait`: `{ seconds?: number }`

2. **Compaction Resync Delta (<150 tokens):**
   When Pi compacts a long-running session, `pi-hybrid-goal` serializes the active objective, requirements, and elapsed time into a concise `<150` token delta block.

3. **Cache-Preserving Context Injection:**
   The post-compaction resync block is injected via the `context` hook as a user message at the **end** of the message chain. It **never mutates `systemPrompt`**, keeping the prompt cache prefix 100% warm on Anthropic, DeepSeek, and OpenAI.

## Usage

Start a goal in Pi:
```text
/goal Refactor authentication module to support OAuth2 PKCE
```

The agent will work autonomously using standard editing and testing tools until satisfied, then call `goal_complete` with a summary of its verification.

## Running Tests

```bash
bun test
```
