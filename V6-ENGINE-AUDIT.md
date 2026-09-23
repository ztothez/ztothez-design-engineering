# V6 Prototype Engine Capability Audit

Date: 2026-09-01
Status: complete
Scope: `Design Blueprint Generator/engine/`
Authority: the maintained root engine, `SKILL.md`, `V5-ROADMAP.md`, and the V6 boundary rules.

## Executive Result

The Blueprint Generator is a useful prototype reference, but it is not a second production
engine to merge wholesale. The maintained root engine already contains the larger and more
current quality-gate, authority, retrieval, portfolio, and release architecture. The Blueprint
engine contains 122 TypeScript files, while the root engine contains 142 TypeScript files. Most
of the apparent overlap is duplicated implementation.

The genuinely additive surface is limited to three engine modules:

- `engine/src/clean-room/pipeline.ts`: an explicit intent intake, staged composition/evaluation
  flow, evidence-tier reporting, and abstention behaviour.
- `engine/src/clean-room/patterns.ts`: a first-party decision-rule library that selects patterns
  from task signals and attaches required states, measurable floors, anti-patterns, and proof.
- `engine/src/clean-room/patterns-own-work.ts`: the prototype's locally authored pattern data.

These are candidates for selective extraction in V6 Item 3. They are not yet production
authorities, and their prototype wording, schemas, and thresholds must be reconciled with the
maintained authority model before use.

## Inventory And Disposition

| Prototype area | Disposition | Reason |
| --- | --- | --- |
| `src/clean-room/pipeline.ts` | **Candidate additive** | Provides a deterministic staged pipeline and explicit incomplete/fail outcomes. Reconcile with existing quality-gate reports, evidence tiers, and acceptance schemas. |
| `src/clean-room/patterns.ts` | **Candidate additive** | Provides constraint-selected decision rules rather than visual-style recommendations. Integrate through existing retrieval and authority compilation only after provenance review. |
| `src/clean-room/patterns-own-work.ts` | **Candidate additive** | Contains locally authored rules, but each rule still needs an admission record, test coverage, and threshold review. |
| Prototype `src/server.ts` | **Duplicate and unsafe to merge wholesale** | It duplicates the root MCP server and uses a separate environment-driven root model. Select individual reviewed tools only; keep root traversal, disclosure, and read-only boundaries authoritative. |
| Acceptance, audit, aggregate, contracts, corpus, evaluation, heuristics, information-design, interface-trust, repair, runtime, and portfolio modules | **Duplicate** | Equivalent capability already exists in the maintained root engine, with newer V5 authority and boundary checks. A parallel implementation would create conflicting behaviour. |
| Prototype `design-intelligence` and `design-plan` modules | **Duplicate pending comparison** | Root modules already own design intelligence and plan compilation. Compare behaviour in Item 3, then extend one root authority if a tested gap remains. |
| `src/routes/` and frontend components | **Deferred** | The product is an MCP and CLI system. The UI is an optional local inspection console, not a runtime dependency or required delivery surface. |
| Supabase, auth, hosted AI gateway, and remote persistence | **Excluded** | They add credentials, network, account, and data-retention risks that are outside the offline-first agent engine. |
| Prototype `knowledge-base/clean-room/` documents | **Unverified reference** | They may describe useful behaviours, but they are not admitted to the maintained knowledge boundary until authorship, provenance, independent wording, and authority status are reviewed. |
| Prototype `.env`, package lock, generated output, user content, and build artifacts | **Excluded** | Secrets, generated material, and user content must never enter production source, package output, MCP retrieval, or CI evidence. |

## Architecture Comparison

The root engine is the production authority because it has the maintained V5 modules for:

- authority compilation and rule registration;
- knowledge admission, quality, and public-boundary checks;
- source-removal qualification and independence checks;
- scoped retrieval and source disclosure;
- portfolio snapshot isolation and original-source digest verification;
- package, offline-release, and CI validation.

The Blueprint engine has a separate package manifest and a separate `clean-room` package scope.
Copying that boundary would reintroduce parallel manifests and make it possible for a packaged
runtime to use rules that were not admitted by the root authority pipeline.

The Blueprint server also exposes additional clean-room tools, including pattern retrieval and
pipeline execution. They are useful API candidates, but the server itself must not be copied.
Any replacement tools must be implemented in the root server with the existing path protection,
approved-category restrictions, read-only portfolio policy, and `console.error` diagnostic rule.

## Candidate Capability Requirements For Item 3

Before any candidate capability is integrated, it must satisfy all of the following:

1. Have a root-owned TypeScript type and a stable Zod or structured schema.
2. Declare its source or derivation in the maintained provenance and admission records.
3. Return explicit `pass`, `incomplete`, or `fail` outcomes where inputs or evidence are missing.
4. Preserve evidence tiers and never promote likely risk into verified evidence.
5. Convert blocking findings into acceptance criteria without manufacturing human evidence.
6. Be reachable through the existing CLI or MCP architecture rather than a parallel server.
7. Have regression tests for traversal, abstention, deterministic output, and package boundaries.
8. Remain offline-capable and free of Supabase, hosted gateway, or credential requirements.

## Findings

### Strengths Worth Reusing

- The intent record prevents composition from beginning with an underspecified product, task,
  actor, stack, failure mode, or success signal.
- The pipeline stops at incomplete intake instead of inventing missing requirements.
- The pattern model links a task signal to structure, required states, measurable floors, an
  anti-pattern, and a proof method.
- The composer explicitly carries a provisional handoff when rendered evidence is absent.

### Limitations To Resolve

- The prototype reports textual stages but does not yet connect them to the root authority,
  contract, or evidence registries.
- Pattern floors are strings rather than typed, validated measurement objects.
- Pattern selection is regular-expression based and needs deterministic ranking, provenance, and
  no-match behaviour consistent with root retrieval.
- The prototype's clean-room documentation has not been independently admitted as maintained
  authority.
- The duplicate server creates a risk of inconsistent tool names, roots, and disclosure rules.

## Security And Independence Decision

No prototype source, document, asset, secret, remote integration, or package boundary is admitted
by this audit. The prototype remains an untouched local reference. The root project has no
production import from `Design Blueprint Generator/`, no package inclusion for that directory,
and no MCP retrieval root pointing to it.

The next implementation step is a narrow API reconciliation: model the intent record, typed
decision rules, and staged report inside existing root modules, then prove parity and boundary
behaviour with tests. Do not copy the prototype directory or make it a runtime fallback.

## Evidence

- Root engine inventory: 142 TypeScript files.
- Blueprint engine inventory: 122 TypeScript files.
- Unique Blueprint engine modules: the three `clean-room` modules listed above.
- Root production reference scan: no import or package reference to the Blueprint Generator.
- Root checks already passing for this V6 slice: build, typecheck, package check, knowledge
  admission, authority compilation, and `git diff --check`. The full 196-test run reached 194
  passes and exposed two public-content classification failures caused by these new root files;
  after policy registration, the affected public-content regression tests pass 3/3.

## Audit of Prototype Knowledge Base Plan (`.lovable/plan/`)

The `.lovable/plan/clean-room-design-architecture-knowledge-base-2026-08-31.md` document describes a proposal to parse the `DataForV5/` raw materials (PDFs, course handouts, third-party skills) and automatically synthesize a "clean-room" knowledge base with a 9-category taxonomy (`foundations/`, `requirements/`, `architecture/`, etc.).

### Disposition: Compatible Principles, Unsafe As-Is

This proposed clean-room ingestion pipeline should **not** be executed or merged into the production engine.

1. **Parallel Taxonomy Risk**: The root project already maintains an approved `knowledge-base/`
   with `INDEX.md`, provenance, retrieval scope, admission, and compiled authority artifacts.
   The proposed nine-category `clean-room/` tree would be a second knowledge authority unless
   every retained rule were individually admitted and bound to the root compiler.
2. **Bulk-ingestion Risk**: The plan proposes fetching and parsing large PDF/source groups and
   using an LLM to map concepts into new files. Its stated clean-room rules prohibit copied
   wording, which is directionally correct, but automation alone cannot establish independent
   authorship, accurate transformation, licensing posture, or complete source coverage. It must
   therefore remain a human-controlled research process outside production retrieval, with
   narrow outputs admitted one at a time.
3. **Workflow Duplication**: Intake, modelling, direction, composition, evaluation, gating, and
   handoff are a useful conceptual sequence. The root CLI already covers much of this behaviour,
   but not necessarily as one identical seven-stage implementation. The useful contribution is
   the contract and stage semantics, not a second orchestrator or background task system.
4. **UI Independence**: The Blueprint UI and document-management workflow are unnecessary for
   the MCP/CLI product and should remain optional inspection tooling. The underlying stage
   semantics and decision-rule engine remain valid candidates for Item 3 review.

### Recommendation

Do not execute the plan as a production ingestion pipeline. Use its stage contract as a candidate
for Item 3 and use research inputs only in a controlled scratch process. Admit only specific,
verifiable, independently authored rules (for example contrast minimums, accessibility
thresholds, or coupling constraints) directly into the existing root authority through explicit
provenance and validation. Do not make the proposed `clean-room/` tree, background ingestion,
remote Drive access, or LLM extraction a runtime dependency.
