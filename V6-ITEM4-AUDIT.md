# V6 Item 4: Agent-Facing Plan, Review, And Repair Audit

Date: 2026-09-01
Status: complete

Item 4 is implemented by the maintained root engine. No second orchestrator is required.

## Existing Agent APIs

| Capability | Maintained API | Evidence boundary |
| --- | --- | --- |
| Plan compilation | `compile_design_plan` and `zz-design compile-plan` | Blocked and provisional plans retain non-ready status. |
| Root reconciliation | `reconcile_design_plan` and `zz-design reconcile-plan` | Decision rules are root-owned, traceable, and explicitly limited to declared evidence. |
| Heuristic review | `evaluate_heuristic_review` and `zz-design review-heuristics` | Findings carry severity, observation, evidence, confidence, remediation, and validation method. |
| Quality gate | `run_design_quality_gate` and `zz-design quality-gate` | Contract, architecture, runtime, and acceptance stages remain separate. |
| Review aggregation | `aggregate_design_quality_gates` and `zz-design aggregate-gates` | Multi-profile results preserve profile, criterion, and evidence relationships. |
| Bounded repair | `repair_react` and `zz-design repair-react` | Exact replacements, digest preconditions, attempt limits, restore-on-failure, and `humanEvidence: not-generated`. |
| Evidence inspection | `get_portfolio_benchmark_report` and retained report loaders | Registry IDs and summaries are exposed; original source paths and private content are not. |

## Requirement Verification

- Severity, measured value, threshold, evidence tier, source reference, remediation, and validation
  method are represented by the heuristic, acceptance, runtime, and repair schemas where the
  relevant evidence exists.
- Automated, AI-assisted expert, human expert, and representative-user evidence are distinct
  schema values. The evaluators reject missing attribution and never generate human attestations.
- Open severity 3 and 4 heuristic findings become blocker acceptance candidates through the
  maintained heuristic evaluator. This creates acceptance work only; it does not mark the work
  complete or fabricate review evidence.
- Absolute paths are kept out of portable reports and MCP responses where the relevant loader
  supports external roots. Portfolio access is read-only and benchmark execution remains behind
  the controlled portfolio runner.
- Blocked and provisional plans cannot authorize generation because the existing generation
  adapter requires implementation-ready plans.

## Decision

Item 4 is complete through composition of existing maintained APIs plus the V6 reconciliation
API. Adding a second review or repair orchestrator would create competing status semantics and
would weaken the single-authority boundary. Item 5 should extend scoped retrieval to expose the
reconciled decision-rule information through the existing authority-aware index.
