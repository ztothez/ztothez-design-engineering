# Task Pattern: Repayment Tracker

> Reusable pattern for balances, commitments, repayment progress, and obligation status.

## Section Order

1. Header with active period.
2. Cross-workspace navigation if this tracker belongs to a suite.
3. Summary metrics: total, paid, outstanding, progress.
4. Filter tabs: open, completed, all.
5. Obligations table with row-level progress.
6. Footer with export, import, reset/delete, and backup controls.

## Status Treatment

- Open items: neutral/default surface.
- Completed items: success label and optional tint.
- Overdue or failed items: danger label and clear recovery action.
- Progress indicators: labeled values, not color-only gradients.
