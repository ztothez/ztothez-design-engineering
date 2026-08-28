# V3 Implementation Handoff

## Current State

V3 Roadmap Items 1 through 9 are **ALL DONE**. The entire V3 Roadmap implementation, portfolio benchmarking system, cross-product taxonomy, holdout rule promotion pipeline, and qualification release framework are complete.

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

## Item 9 & V3 Roadmap Completion

V3 qualification verifies system targets ($\ge 12$ projects, $\ge 5$ domains, $\ge 3$ stacks, $\ge 4$ archetypes, $\ge 3$ locked holdout projects, source-only / browser-only / full-stack benchmark paths, zero source root mutations, zero private path/secret leakage), 6 synthetic CI fixture categories, and strict claim boundaries (rejecting unverified claims of independent human validation, representative user validation, universal design quality, or external tool superiority).

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

Use synthetic fixtures for automated tests. A real local portfolio run is optional and must use the
ignored local registry. Do not change source projects to make a benchmark pass.
