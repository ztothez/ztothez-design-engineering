# Operational Dashboard Patterns

## Start With Work, Not Metrics

Identify the highest-frequency decision and the records, jobs, or obligations needed to make it. The first viewport should expose current scope, exceptions, and the next action. Metrics summarize current evidence; they do not replace the work surface.

## Shared Structure

1. Scope header: period, workspace, environment, destination, or queue.
2. Evidence-backed summary: a small set of definitions with current source and time context.
3. Work controls: search, filters, sorting, saved views, and selection count where needed.
4. Main records surface: stable columns, textual status, ownership, timestamps, and row actions.
5. Detail or inspector: history, evidence, validation, and recovery actions.
6. Lifecycle actions: import, export, backup, migration, reset, archive, or delete only when the product owns those states.

## Operational States

Use waiting, active, blocked, failed, completed, overdue, partial, and cancelled only when the domain defines them. Every status needs text and a current source of truth. Preserve user input and filters after recoverable failures. Explain destination, overwrite, retention, and external processing before consequential actions.

## Responsive Behavior

Recompose dense tables into prioritized records or horizontal regions with explicit affordances. Keep filters and bulk actions reachable, preserve selected scope, and avoid competing page-level scroll containers. Verify long identifiers, localized labels, 200 percent reflow, text resizing, and touch targets.
