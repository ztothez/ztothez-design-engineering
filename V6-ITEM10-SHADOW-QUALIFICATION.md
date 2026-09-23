# V6 Item 10 Shadow Qualification

Status: **Qualified locally; cutover not approved**

The `zz-design shadow-evaluate` command runs the V6 agent-facing workbench beside the retained V4
qualification and evaluation reports. It also reads the owner-authorized private V3 holdout report
without modifying the original projects or publishing its contents.

The current local result qualifies parity for AegisOPS, SceneStart, and Azure Optimizer across brief
readiness, design plans, retrieval, evidence classification, quality outcomes, and package boundaries.
The authorized holdout cohort contains `health`, `hunt-showdown-suomi-hub`, and `pdf-convert`; their
source-only limitations are preserved as limitations rather than promoted to product passes.

All differences are classified as intentional improvement, unsupported limitation, defect, or
unresolved risk. The result remains `lifecycle: shadow`, `authorityBeforeCutover: V5`, and
`cutoverStatus: not-approved`. V6 does not replace the V5 authority until the owner separately
approves that change after reviewing the retained report.

The generated JSON and Markdown report is intentionally kept under the ignored
`.ztothez-design-runtime/v6-shadow-cutover/` directory. No private project source, screenshots,
holdout content, or external tool source is copied into maintained authority or package output.
That directory contains the original qualification run; the dated
`.ztothez-design-runtime/v6-shadow-recheck-20260908/` directory contains the September 8 retained-evidence recheck.

## Fresh Rerun

On 2026-09-01, the three disposable fixtures were rerun from their maintained contracts using a
fresh browser evidence directory. AegisOPS passed 4 of 4 declared profiles, SceneStart passed 6 of
6, and Azure Optimizer passed 3 of 3. The subsequent multi-product qualification and V4 evaluation
both passed for all three products. The V6 shadow comparison passed against the same authorized
holdout cohort. At that checkpoint owner review was pending; cutover remains `not-approved`.

## Retained Evidence Recheck, 2026-09-08

The current evaluator was rerun against the retained September 1 pilot reports and authorized
private holdout report. The result is `shadow-qualified`, with cutover still `not-approved`.
The report is retained privately at
`.ztothez-design-runtime/v6-shadow-recheck-20260908/shadow-evaluation.json`.
This rechecks retained evidence; it is not a new browser run or a new human attestation.

## Owner Acceptance, 2026-09-08

The owner explicitly accepted local V6 implementation completion and the stated limitations.
See [V6-OWNER-REVIEW.md](V6-OWNER-REVIEW.md) for the attributable decision. V5 remains authoritative;
publication and V7 cutover are not authorized. The retained shadow reports are unchanged.
