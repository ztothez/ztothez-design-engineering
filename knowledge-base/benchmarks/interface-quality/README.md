# Interface Quality Comparison

This directory defines the versioned method used to compare truthful disclosure, information design, visual polish, and task performance across anonymized interface candidates.

## Workflow

1. Copy `comparison-methodology.template.yaml` for V1 evidence-integrity checks, or implement `comparison-methodology-v1.1.schema.yaml` when complete human matrices and target-versus-comparator decisions are required.
2. Keep candidate labels anonymous. Store any identity mapping outside reviewer-facing artifacts.
3. Copy `review.template.yaml` and record retained automated artifacts, required-stage outcomes, reviewer-supplied sessions, task observations, ratings, and structured claims.
4. Run `npm run validate-comparison -- --methodology PATH --review PATH`.
5. For V1.1, configure minimum expert and user sessions, complete matrices, counterbalanced orders, required-stage candidates, the anonymous target, comparators, required categories, and task non-regression.
6. Keep session envelopes compatible with `review-session.schema.yaml`. Store reviewer-supplied files inside the review evidence root with top-level `status: complete`, then run `npm run compile-comparison -- --methodology PATH --base-review PATH --sessions DIRECTORY --output PATH`.
7. Treat `passed` as evidence-integrity validation. Read `humanReview.requirementsMet` and `benchmarkDecision.passed` independently. Treat `releaseReady` as the combined decision requiring every configured gate.

## Evidence Boundary

- Automated evidence proves only the rendered, compiled, network, contract, or journey facts it measured.
- AI-assisted expert evidence records an agent's reasoned inspection and cannot become human evidence through formatting.
- Human-expert evidence requires reviewer-supplied contributor and timestamp metadata.
- Representative-user evidence requires reviewer-supplied attribution, a pseudonymous participant identifier, and observed task results.
- Pixel differences detect change, not quality. A changed screenshot baseline requires functional evidence and attributable review.
- A passing schema does not establish that a claim is true. Every verified claim needs retained evidence whose scope matches the claim.
- A score matrix is complete only when every required candidate-task and candidate-criterion cell is present at the correct evidence level. `not-run` is evidence of non-completion, not permission to omit a cell.
- Benchmark release requires the anonymous target to meet the category floor, equal or exceed every configured comparator category, and avoid configured task-metric regression.

The templates contain no fabricated human sessions. They are expected to be structurally valid and not release-ready until real review evidence is supplied.
