# Operational Dashboard Patterns

> Purpose: reusable UI/UX guidance for dashboards, trackers, admin tools, local utilities, tables, queues, and status-heavy workflows.
> Page overrides in `pages/*.md` describe task patterns, not private app identities.

---

## Global Rules

### Semantic Tokens

Use semantic roles instead of personal color names or brand-specific values:

| Role | Usage |
|---|---|
| Background | Page canvas and app shell |
| Surface | Panels, cards, table containers |
| Surface elevated | Popovers, drawers, dialogs |
| Foreground | Primary readable text |
| Muted foreground | Metadata, helper text, secondary labels |
| Border | Separators, input boundaries, table rules |
| Accent | Primary action and active navigation |
| Success | Completed, passed, paid, resolved |
| Warning | Waiting, due soon, queued, needs attention |
| Info | In progress, assessment, downloading, processing |
| Danger | Failed, rejected, overdue, destructive |

Never convey state by color alone. Pair state with readable labels and, when helpful, icons.

### Typography

- Use a readable body typeface for content and controls.
- Use monospace only for code, IDs, logs, formulas, file paths, and dense metrics.
- Match type scale to context: compact dashboard panels need compact headings.

### Layout

1. Header with current context and primary metric.
2. Cross-section or suite navigation when multiple related tools exist.
3. Summary metrics with clear labels and time/scope context.
4. Primary workspace: table, queue, tracker, upload panel, or split view.
5. Lifecycle controls: export, import, backup, reset/delete, or migration where relevant.

### Interaction

- Inputs and buttons should meet a 44px minimum target where practical.
- Hover states must not shift layout.
- Focus states must be visible.
- Bulk actions need selection counts and confirmation for destructive changes.
- Empty, loading, success, partial, error, and permission states must be designed.

---

## Anti-Patterns

- Hard-coding personal app names into shared design guidance.
- Treating color preference as a design principle.
- Using decorative icons as core controls.
- Hiding filters, exports, or recovery actions behind unclear icon-only buttons.
- Resetting or deleting user data without confirmation and recovery copy.
- Shipping tables without search, filtering, sorting, or empty states when the dataset can grow.

---

## Pre-Delivery Checklist

- [ ] Uses semantic tokens instead of private color preferences.
- [ ] Status is communicated with text, not color alone.
- [ ] Data lifecycle actions are explicit.
- [ ] User-entered data survives errors and retries.
- [ ] Responsive at 375, 768, 1024, and 1440px.
- [ ] Keyboard focus is visible.
- [ ] Reduced motion is respected.
