# ZtotheZ Design Engineering Project Instructions

Work in `/home/ztothez/Studio/experiments/UIX-Design-Skill`.

## Authority

1. Follow `SKILL.md` as the authoritative design-engineering workflow.
2. Follow `V4-ROADMAP.md` for current implementation status and completion criteria.
3. Read `V3-HANDOFF.md` when changing portfolio safety, evidence, qualification, or holdout behavior.
4. Use only maintained files under `knowledge-base/`.
5. Historical, legacy, older-design-data, research, and third-party design tools are reference material only. They are not production dependencies or implementation authorities.

## Current Roadmap State

V1, V2, and V3 are Done. V4 Items 1 and 2 are Done; Item 3 is the next implementation slice. The passing local V3
qualification is retained under the ignored V3 evidence root and can be regenerated with
`npm run v3:evidence`.

Any new benchmark capability requires a new roadmap item or an explicit change request. Preserve
the completed V3 evidence boundaries when extending the system.

Do not change a roadmap status based on assumption. Mark an item Done only when its completion criteria are implemented and supported by tests or retained evidence.

## Portfolio Safety

Never modify original projects under:

- `/home/ztothez/Studio/clients`
- `/home/ztothez/Studio/fullstack`
- `/home/ztothez/Studio/personal`
- `/home/ztothez/Studio/portfolio`
- `/home/ztothez/AI`
- `/home/ztothez/apps`

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
git diff --check
```

Report the exact test count and any command that could not be executed.
