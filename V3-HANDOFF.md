# V3 Implementation Handoff

## Current State

V3 Roadmap Items 1 through 9 are **Done**. Rule promotion and qualification fail closed, all three
candidate evaluations completed, and the final local V3 qualification passes.

The final Item 9 implementation is in:

- `src/portfolio/qualification-schema.ts`: V3 qualification targets, synthetic CI fixture categories, and qualification report schemas.
- `src/portfolio/qualification.ts`: V3 qualification targets evaluation, CI fixture verification, zero mutation & zero private leakage enforcement, and disallowed claim boundary detection.
- `cli/portfolio.ts`: `zz-design portfolio qualify-v3` command.
- `src/portfolio/mcp.ts`: `evaluateV3QualificationForMcp` opt-in MCP function.
- `tests/portfolio-qualification.test.ts`: test suite for qualification targets, CI fixtures, privacy enforcement, disallowed claim detection, and supported claims verification.

## Safety Invariants

- Never run benchmark commands in an original project root.
- Never modify files under `/home/ztothez/Studio/clients`, `fullstack`, `personal`, `portfolio`,
  `/home/ztothez/AI`, or `/home/ztothez/apps` while benchmarking.
- Use only roots and commands explicitly authorized by `.ztothez-design-local/portfolio-registry.yaml`.
- Keep local registries, snapshots, reports, screenshots, and private evidence out of Git, npm,
  offline releases, retrieval, and exact-file MCP knowledge access.
- Treat unsupported verification as a limitation, not a product pass or failure.
- Never generate a human attestation or relabel AI evidence as human evidence.

## Verified Local Baseline

- Development report: `v3-development-20260828-r6`
- Holdout report: `v3-holdout-20260828-r4`
- Registry digest: `b0cc9a19e94220f88a71d1731ccc50ec4330aec6eed5d738647ff4adfd81428e`
- Coverage: 12 projects, 12 domains, 8 declared stacks, 5 archetypes, and 3 locked holdouts.
- Both cohort reports have exact coverage, zero unsafe configurations, zero source mutations, and
  passing `verify-unchanged` results.
- Execution paths: authorized local source-only coverage plus public synthetic browser-only and
  Node plus Python full-stack fixtures executed in disposable snapshots.
- Promoted candidates: `semantic-token-boundary`, `interactive-control-integrity`, and
  `component-review-threshold`.
- Final report: `.ztothez-design-benchmarks/evidence/v3-final/qualification-report.json` with all
  14 criteria passing. The directory is private, ignored, and excluded from package output.

## Regeneration

```bash
npm run v3:evidence -- \
  --dev-run v3-development-20260828-r6 \
  --holdout-run v3-holdout-20260828-r4 \
  --output .ztothez-design-benchmarks/evidence/v3-final
```

The command captures exact command reports and checksummed logs, evaluates all three candidates,
and runs final qualification. GitHub Actions uses `--ci-only` because private portfolio reports and
the local registry must never be uploaded.

## Validation Commands

```bash
npm run build
npm run typecheck
npm test
npm run package:check
npm run package:smoke
npm run independence:check
git diff --check
```

Use synthetic fixtures for CI. Real local portfolio runs use the ignored registry and are required
for final V3 qualification. Do not change source projects to make a benchmark pass.
