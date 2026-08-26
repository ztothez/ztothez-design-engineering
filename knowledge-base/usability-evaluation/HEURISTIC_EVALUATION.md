# Heuristic Evaluation and Usability Evidence

Use this maintained reference for UX audits, release reviews, redesign diagnosis, and benchmark creation. It operationalizes the evidence boundaries and evaluation methods required by this system without depending on the local raw research corpus.

## Evidence Boundaries

Keep these evidence types distinct:

| Evidence | What it can establish | What it cannot establish |
|---|---|---|
| Automated runtime inspection | Rendered overflow, clipping, collisions, missing names, broken focus, blank media, console failures, network behavior, and journey assertions | Whether terminology matches the user's mental model or whether the complete task is understandable and efficient |
| Expert heuristic evaluation | Likely usability problems, violated interaction principles, inconsistent conventions, missing recovery, and cognitive burden | Actual prevalence or impact for representative users |
| Moderated or unmoderated usability testing | Whether intended users can complete intended tasks in the intended context; observed errors, recovery, and comprehension | Population-level rates from a small qualitative sample |
| Analytics and quantitative studies | Frequency, funnels, task timing, abandonment, and comparative measurements when instrumentation and sampling are valid | Root cause without qualitative or task evidence |

Never report an automated or heuristic result as proof that users succeeded. Treat heuristic findings as testable risk hypotheses and use representative-user testing for consequential workflows.

## Expert Evaluation Workflow

1. Define the intended users, domain, critical tasks, supported devices, environment, and states. Do not evaluate an abstract screen without its task contract.
2. Select relevant heuristics and domain rules. Weight them by task risk instead of treating every principle as equally important.
3. Brief evaluators with the same scope, tasks, evidence format, and product assumptions. Prefer evaluators with domain knowledge; use multiple independent reviewers for consequential work.
4. First pass: use the interface freely to understand its interaction model, boundaries, and likely focus areas.
5. Second pass: execute representative tasks and inspect each relevant state against the chosen heuristics.
6. Record one concrete problem per finding. Name the location, state, trigger, observed behavior, affected user outcome, evidence, and violated principle.
7. Debrief across evaluators. Merge duplicates, challenge false alarms, preserve disagreements, and prioritize remediation.
8. Convert material findings into acceptance criteria and regression checks. Retest corrected behavior and use representative users where assumptions remain.

## Nielsen Interaction Heuristics

Apply the ten principles contextually:

1. Keep system status visible with timely, truthful feedback.
2. Match user language, domain concepts, natural order, and real-world conventions.
3. Preserve user control with cancel, back, undo, retry, and clear exits where applicable.
4. Maintain internal consistency and follow platform and industry standards.
5. Prevent errors before relying on error messages.
6. Prefer recognition over recall; keep choices, context, and instructions available.
7. Support efficient repeat use without making novice paths opaque.
8. Remove irrelevant information and visual competition without hiding required task context.
9. Explain errors in user language, identify the cause, preserve work, and provide recovery.
10. Provide concise, searchable, task-focused help when the interface cannot be self-explanatory.

## Finding Record

Use `heuristic-review.template.yaml` as the starting artifact and validate it against `heuristic-review.schema.yaml`. The executable TypeScript schema is authoritative for the MCP server and CLI. Each file records the reviewed target, representative tasks, evidence provenance, findings, resolution decisions, and validation methods.

Use the following numeric severity scale in structured reviews:

- `0`: not a usability problem after review.
- `1`: cosmetic; no meaningful task impairment.
- `2`: minor; localized friction with a clear workaround.
- `3`: major; materially harms comprehension, efficiency, recovery, or task completion.
- `4`: catastrophic; prevents a critical task, creates unsafe ambiguity, or makes consequential controls inaccessible.

Each evidence entry must identify one evidence level:

- `automated`: browser, source, network, accessibility, or other deterministic inspection.
- `ai-assisted-expert`: an agent-assisted heuristic interpretation; never human evidence.
- `human-expert`: attributable expert review with contributor and timestamp.
- `representative-user`: attributable usability-session evidence with a privacy-preserving participant reference and timestamp.

Example finding excerpt:

```yaml
id: export-recovery-missing
title: Failed export has no safe recovery action
task: export-current-report
heuristic:
  id: error-recovery
  name: Help users recognize, diagnose, and recover from errors
location: Reports view at mobile-375 in export-error state
trigger: Attempt an export while the export service is unavailable.
observation: The failure removes the export action and does not explain whether the report was preserved.
evidence:
  - level: automated
    source: runtime/export-error/report.json
    detail: The journey found no visible retry control after the failed response.
impact: The user cannot determine whether retry is safe or whether work was lost.
severity: 3
confidence: high
status: open
remediation: Preserve the report, show the failure cause, and provide Retry and Dismiss actions.
validation:
  method: representative-user-test
  procedure: Repeat the recovery task and confirm that users understand report preservation and retry safety.
```

Do not derive severity from visual prominence alone. Consider task criticality, affected users, frequency or reach, recoverability, and consequence.

Run `evaluate_heuristic_review` through MCP or use the CLI fallback:

```bash
npm run review-heuristics -- --review PATH_TO_HEURISTIC_REVIEW
```

Use `--candidates` to print only the contract fragment. Use `--fail-on-open-major` when a CI or local policy should return exit code 2 for open severity 3 or 4 findings.

The evaluator converts each open severity 3 or 4 finding into an unapplied blocker acceptance-criterion candidate. Review the generated YAML before merging it into a product contract. The review artifact is never a manual acceptance attestation, and the evaluator never edits contracts or attestation files.

## Usability Testing Handoff

When expert or automated evidence cannot resolve a user assumption:

1. State the research question and target user group.
2. Write representative tasks with precise outcomes, realistic context, and coverage of essential UI areas.
3. Separate novice and expert groups when their skills or performance expectations differ.
4. Pilot the protocol before recruiting the full group.
5. Ask facilitators and observers not to coach, correct, or bias participants during the task.
6. Record behavior and one observation per note; collect subjective feedback after task performance.
7. Fix significant findings and run another small formative round rather than relying on one large final test.

## Provenance Boundary

The distributable workflow is self-contained. Local course handouts, converted books, and extended research notes may support future independently authored revisions, but they are not shipped, retrieved through MCP, or required at runtime. Add a rule to this maintained document only after its provenance and reuse status are recorded during the clean-room certification phase.
