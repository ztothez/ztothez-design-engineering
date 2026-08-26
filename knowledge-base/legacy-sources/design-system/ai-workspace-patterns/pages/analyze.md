# Screen Pattern: Structured Analysis Workspace

> Overrides `MASTER.md` for structured AI analysis workspaces where users provide input, configure scope, run analysis, inspect results, and verify evidence.

---

## Layout

- **Pattern:** Split-pane workspace with input/context on one side and results/evidence on the other.
- **Desktop:** 50/50 or 45/55 split; resizable divider when users compare input and output.
- **Tablet:** Stacked input and results with sticky primary action.
- **Mobile:** Tab switcher for Input | Results to avoid simultaneous scroll regions.

---

## Input Panel

| Element | Spec |
|---|---|
| Input surface | Editor, textarea, upload area, or structured form based on domain need |
| Type/scope | Visible badge or selector for the supported input type |
| Strictness/detail | Labeled slider or segmented control with helper text |
| Primary CTA | Outcome-named action, disabled only with clear reason |
| Secondary action | Load example, clear, import, or paste from clipboard where useful |
| Privacy | Short line explaining processing boundary and retention |

Disable submit only when the input is empty, invalid, or blocked by a known limit, and explain why.

---

## Results Panel States

### Empty

- Show an icon or simple visual anchor.
- Explain what the user will see after running analysis.
- Provide an example or sample input when helpful.

### Loading

- Skeleton for structured result regions.
- Staged status such as `Validating`, `Retrieving context`, `Analyzing`, `Preparing results`.
- Do not block input edits unless the task requires input immutability.

### Success

1. Summary with visible text values.
2. Findings list with filters.
3. Primary recommendation or next action.
4. Evidence/source accordion.
5. Export, copy, save, or share action when relevant.

### Error

| Class | UI treatment |
|---|---|
| Invalid input | Inline alert near input with example |
| Rate limit | Toast or alert with countdown and preserved work |
| Service unavailable | Error card with retry |
| Partial result | Mark incomplete sections and explain what was skipped |

Every error states cause, recovery action, and whether user work was preserved.

---

## Finding Card Anatomy

```text
[Severity] Finding title              Category
Short explanation
[Expand] [Jump to source] [Copy action]
```

- Severity: icon, text label, and optional color treatment.
- Category: badge or metadata label.
- Expanded state: full explanation, evidence, source excerpt, and suggested action.

---

## Charts And Scores

- Use bullet charts, labeled bars, or tables for score-like values.
- Always show numeric or textual values.
- Provide a table fallback for assistive technologies.
- Do not rely on color-only zones.

---

## Keyboard

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + Enter` | Run primary analysis |
| `Ctrl/Cmd + K` | Focus input |
| `Escape` | Close drawer, popover, or focused detail panel |
