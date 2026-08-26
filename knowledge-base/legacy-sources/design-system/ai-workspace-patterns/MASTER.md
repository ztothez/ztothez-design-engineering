# AI Workspace Patterns

> Purpose: reusable UI/UX guidance for AI analysis, review, agent, evidence, and decision-support interfaces.
> The guidance is product-neutral and should not expose private app names, model experiments, or personal visual preferences.

---

## Global Rules

### Semantic Tokens

Use semantic roles instead of fixed personal palette values:

| Role | Usage |
|---|---|
| Background | Page canvas and shell |
| Surface | Editor, chat, result, and evidence panels |
| Surface elevated | Modals, popovers, drawers |
| Foreground | Primary text |
| Muted foreground | Metadata, helper text, timestamps |
| Border | Panel divisions and control boundaries |
| Accent | Primary action and active navigation |
| Success | Passed, verified, complete |
| Warning | Needs attention, limited confidence, queued |
| Info | In progress, processing, retrieved |
| Danger | Failed, blocked, critical, destructive |
| Focus | Keyboard and accessibility focus |

Never convey severity or AI confidence by color alone. Pair color with labels, icons, values, or explanatory text.

### Typography

- Use readable body text for explanations and results.
- Use monospace for code, prompts, logs, identifiers, and raw model/tool traces.
- Keep generated content visually distinct from human-authored or approved content.

### Component Standards

- Primary actions name the outcome, for example `Analyze`, `Generate`, `Review`, `Approve`, or `Export`.
- Buttons have disabled, loading, success, error, and focus states.
- Inputs have visible labels and validation messages.
- Result cards expose summary, impact, evidence, confidence, and action.
- Modals are reserved for interruption, confirmation, or focused secondary tasks.

---

## AI UX Rules

- Show feedback within 100ms after submit.
- Use skeletons or staged status after 300ms.
- For long AI operations, show the current phase: validating, retrieving, reasoning, generating, saving.
- Preserve user input after errors, rate limits, and retries.
- Show sources, citations, retrieved context, or evidence when the AI makes claims.
- Mark uncertain or partial output clearly.
- Require human confirmation for destructive or consequential AI actions.
- Provide retry, copy, export, report issue, and clear/reset where relevant.

---

## Page Pattern

1. Context/input panel.
2. Configuration controls.
3. Primary action.
4. Processing status.
5. Results summary.
6. Findings or generated output.
7. Evidence and sources.
8. Next actions.

---

## Anti-Patterns

- Presenting AI suggestions as verified facts without evidence.
- Hiding model, data, or privacy boundaries where they affect trust.
- Blocking the whole interface during long AI work unless required.
- Using chat as the only interface for structured workflows.
- Shipping generic error messages that do not explain recovery.
- Making visual style more prominent than the user's task and evidence.

---

## Pre-Delivery Checklist

- [ ] AI states include empty, loading, success, partial, low-confidence, blocked, error, and rate-limited.
- [ ] User input is preserved after failure.
- [ ] Claims include evidence or a clear limitation statement.
- [ ] Consequential actions require review.
- [ ] Results are navigable by keyboard and screen reader.
- [ ] Motion respects reduced-motion settings.
- [ ] Mobile layout avoids simultaneous competing scroll regions.
