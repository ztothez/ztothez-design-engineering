# Task Pattern: Period Records

> Reusable pattern for period-based records such as inflow, outflow, status, totals, and balance tracking.

## Section Order

1. Header with active period and current date.
2. Cross-workspace navigation if this record set belongs to a suite.
3. Period tabs or date-range selector.
4. Summary metrics: inflow, outflow, net, completed/open, balance.
5. Inflow table and outflow table.
6. Footer with period actions, export, import, reset/delete, and backup controls.

## Status Treatment

- Completed rows: success label and optional tint.
- Overdue dates: danger label.
- Due today or due soon: warning label.
- Numeric totals must include currency/unit labels where relevant.
