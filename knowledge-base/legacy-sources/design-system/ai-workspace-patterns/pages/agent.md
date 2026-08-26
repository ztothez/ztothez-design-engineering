# Screen Pattern: Conversational Agent Workspace

> Overrides `MASTER.md` for conversational AI workflows that use user context, tool calls, long-running responses, or iterative review.

---

## Layout

- **Desktop:** Context panel and chat panel side by side when source material matters.
- **Mobile:** Chat visible by default; context in drawer, accordion, or tab.
- Avoid making chat the only interface when the task is better served by structured forms, tables, or review panels.

---

## Chat UX

| Rule | Implementation |
|---|---|
| Predictable process | Show thinking/working state after send |
| Transitional feedback | Typing or processing indicator within 100ms |
| Non-blocking work | Let users edit draft/context while the agent responds unless locked context is required |
| Error recovery | Failed call keeps the draft and offers retry |

---

## Message Types

1. **User message:** aligned consistently and clearly tied to submitted context.
2. **AI message:** readable markdown or structured content.
3. **Tool call:** collapsible operational step with tool name, state, and result summary.
4. **System:** muted status, rate limit, permission, or error message only.
5. **Approval request:** explicit confirmation for consequential actions.

---

## Input Area

- Multi-line textarea with visible label or accessible name.
- Send button with text or accessible label.
- Stop/cancel control for long responses.
- Disabled/loading state during submit only when duplicate sends would be harmful.
- Character, file, or context limit indicator when limits exist.

---

## Trust Rules

- Show what context was sent.
- Show tool calls when they affect the answer.
- Separate generated suggestions from approved decisions.
- Preserve the user's message after failure.
- Provide copy, retry, regenerate, report issue, and clear actions where relevant.
