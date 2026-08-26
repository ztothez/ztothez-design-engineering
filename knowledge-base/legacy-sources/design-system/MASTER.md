# Design System Index

> Purpose: route designers and builders to reusable UI/UX pattern guidance.
> This file intentionally avoids private product names, app names, personal color choices, and implementation-only labels.

---

## Pattern Libraries

- `design-system/operational-dashboard-patterns/MASTER.md` - reusable guidance for dashboard, table, tracker, queue, and local utility interfaces.
- `design-system/operational-dashboard-patterns/pages/*.md` - task-pattern overrides for specific workflow types.
- `design-system/ai-workspace-patterns/MASTER.md` - reusable guidance for AI analysis, agent, evidence, and trust workflows.
- `design-system/ai-workspace-patterns/pages/*.md` - screen-pattern overrides for AI workspaces.
- `design-system/ENTERPRISE_READINESS.md` - production UX and runtime-readiness standards.

---

## How To Use

1. Start with the master UI/UX readiness plan at the repository root.
2. Choose the closest pattern library for the workflow.
3. Apply a page override only when it describes the same task shape.
4. Translate any product-specific details into generic design rules before sharing outside the implementation team.

---

## Shared Principles

- Design around the user's task, not the private app name.
- Use semantic tokens rather than fixed personal colors.
- Use typography by function: body, label, code, metric, metadata.
- Use status labels plus icons and text; never rely on color alone.
- Preserve user data during validation errors, retries, migrations, and navigation.
- Provide visible feedback for every async or AI operation.
- Keep destructive actions separated from primary positive actions.
- Test responsive behavior at mobile, tablet, laptop, and desktop widths.
