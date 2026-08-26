# Task Pattern: Pipeline Tracker

> Reusable pattern for staged records that move through a pipeline, such as applications, approvals, reviews, cases, or opportunities.

## Section Order

1. Header with active record count and current scope.
2. Cross-workspace navigation if this tracker belongs to a suite.
3. Summary metrics: total, waiting, in progress, blocked/rejected, completed/outcome, response or conversion rate.
4. Filter tabs and search.
5. Records table sorted by the user's most common lookup need.
6. Footer with export, import, reset/delete, and backup controls.

## Status Treatment

| Bucket | Token |
|---|---|
| Waiting | warning |
| Assessment or review | info |
| Interview or active step | info |
| Rejected or blocked | danger |
| Hold, outcome, or completed | success |

Use label text in every row; tint is supplemental.
