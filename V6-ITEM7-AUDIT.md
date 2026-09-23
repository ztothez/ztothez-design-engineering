# V6 Item 7: Read-Only Portfolio Report Access Audit

Date: 2026-09-01
Status: complete

The maintained portfolio surface already provides the required read-only reporting boundary.

## Verified Interfaces

- MCP `list_portfolio_projects` returns enabled registry IDs, cohort, archetype, adapter, and capability status only.
- MCP `get_portfolio_benchmark_report` reads a completed retained report and can select one registry project without executing a benchmark.
- `zz-design portfolio` remains the only execution entry point for validation, snapshotting, benchmarking, and source-integrity checks.
- Portfolio MCP access is disabled unless `ZTOTHEZ_DESIGN_PORTFOLIO_MCP=enabled` is explicitly configured, and roots must be explicitly configured.

## Boundary Verification

- Registry validation rejects unowned, unresolved, or disallowed projects before listing them.
- Report reads are restricted to the configured report root and reject traversal.
- Responses expose registry IDs, retained summaries, stages, and classified artifacts, not source files or original project roots.
- Reports preserve separate counts and statuses for product findings, verifier limitations, unsafe configuration, and source mutation.
- Existing portfolio MCP tests verify opt-in behavior and assert that configured private filesystem paths are absent from returned summaries.
- Original projects remain read-only; execution uses the disposable snapshot runner and source-digest verification.

## Decision

Item 7 is complete using the existing portfolio MCP and CLI boundaries. No UI browser or benchmark runner was added.
