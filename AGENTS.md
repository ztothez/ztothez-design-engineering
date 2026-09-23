# ZtotheZ Design Engineering Project Instructions

Work in this repository root.

## Authority

1. Follow `SKILL.md` as the authoritative design-engineering workflow.
2. Follow `V5-ROADMAP.md` for current implementation status and completion criteria. Treat
   `V4-ROADMAP.md` as completed historical delivery evidence.
3. Read `V3-HANDOFF.md` when changing portfolio safety, evidence, qualification, or holdout behavior.
4. Use only maintained files under `knowledge-base/`.
5. Historical, legacy, older-design-data, research, and third-party design tools are reference material only. They are not production dependencies or implementation authorities.

## Current Roadmap State

V1, V2, V3, and V4 are historically Done. V5 Items 1 through 9 are locally implemented. Publication, tagging, package release, or website activation requires a
separate explicit request after retained evidence review.

Private V5 research inputs remain ignored and outside Git, packages, MCP roots, retrieval, CI
artifacts, and runtime fallback. Use them only through the one-way independent-implementation
policy under `governance/`; never ingest the corpus wholesale or copy source prose, code, schemas,
taxonomies, templates, identifiers, datasets, or visual assets into maintained authority.

The passing V3 baseline is documented in `V3-HANDOFF.md`. The current ignored registry contains 12
owner-authorized projects, and `npm run v3:evidence` has produced a passing private qualification
report. Keep the registry, cohort reports, and retained evidence private and excluded from Git and
package output.

Any new benchmark capability requires a new roadmap item or an explicit change request. Preserve
the completed V3 evidence boundaries when extending the system.

Do not change a roadmap status based on assumption. Mark an item Done only when its completion criteria are implemented and supported by tests or retained evidence.

## Portfolio Safety

Never modify original projects under:

- the owner-authorized clients workspace
- the owner-authorized fullstack workspace
- the owner-authorized personal workspace
- the owner-authorized portfolio workspace
- the owner-authorized AI workspace
- the owner-authorized apps workspace

Use `.ztothez-design-local/portfolio-registry.yaml` for authorization.

Run project commands only through `zz-design portfolio`. The runner must:

- Create a disposable snapshot.
- Execute only registry-declared commands.
- Never execute in the original project root.
- Verify the original source digest after execution.
- Treat unsupported evidence as a limitation.
- Distinguish product findings, verifier limitations, unsafe configuration, and source mutation.
- Keep private evidence outside Git and package output.

Never create human attestations or label AI-generated evidence as human or representative-user evidence.

## Engineering Rules

- Inspect existing modules before introducing abstractions.
- Preserve the current TypeScript, ESM, Zod, MCP SDK, and Node.js architecture.
- Use structured parsers and schemas instead of ad hoc text processing.
- Use `console.error()` for MCP diagnostics. Never use `console.log()` because stdout is reserved for JSON-RPC.
- Protect every local path against traversal, symlink escape, and unauthorized roots.
- Do not expose absolute source paths through MCP.
- MCP portfolio tools must remain read-only and must never execute benchmarks.
- Keep edits scoped to the active roadmap item.
- Do not alter unrelated user changes in the working tree.

## Required Verification

Before marking work complete, run:

```bash
npm run build
npm run typecheck
npm test
npm run package:check
npm run package:smoke
npm run independence:check
npm run independence:archive-smoke
npm run public-content:check
npm run knowledge-quality:check
npm run source-removal:qualify
npm run v5:migration
git diff --check
```

Report the exact test count and any command that could not be executed.
