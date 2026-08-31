# ZtotheZ Design Engineering Knowledge Base

This directory contains the maintained, distributable knowledge used by the ZtotheZ Design Engineering System and its root [`SKILL.md`](../SKILL.md). Treat `SKILL.md` as the primary instruction set. [`ROADMAP.md`](../ROADMAP.md) governs planned work and clean-room certification. Local historical material outside the approved retrieval scope is not an implementation authority and is not distributed.

## Product Identity

| Surface | Identifier |
|---|---|
| Product | ZtotheZ Design Engineering System |
| Short name | ZtotheZ Design Engineering |
| Repository | `ztothez-design-engineering` |
| Agent Skill | `ztothez-design-engineering` |
| MCP server | `ztothez-design-engineering` |
| npm package | `@ztothez/design-engineering` |
| Full CLI command | `ztothez-design` |
| Short CLI command | `zz-design` |

Both CLI commands invoke the same stdio MCP server. Use `ztothez-design --help` or `zz-design --help` for local command discovery. Historical evidence paths retain their original names and are not current product identifiers.

Version 2.0 is a pre-publication identity reset, not a compatibility alias layer. Current integrations must use `run_design_quality_gate`, `aggregate_design_quality_gates`, `ZTOTHEZ_DESIGN_*` environment variables, `ZTDE-*` finding IDs, `data-ztothez-design-*` runtime annotations, and `.ztothez-design-quality-gate/` or `.ztothez-design-runtime/` output directories. Old identifiers are retained only inside archived sources and completed historical evidence.

## Directory Map

| Path | Contents | Use when |
|---|---|---|
| `maintained/architecture/` | Independently authored quality-attribute, architecture-evaluation, component-boundary, and product-platform guidance | Evaluating architecture, coupling, cohesion, trade-offs, and shared product variation |
| `maintained/product-patterns/` | Independently authored AI-workspace and operational-dashboard contracts | Designing task-centered workspaces and operational tools without importing a template catalog |
| `design-intelligence/` | Maintained product intake, planning, contained generation and repair, interface trust, operational information design, visual polish, brand, Figma production, asset generation, iconography, presentation, licensing, accessibility, and integrated validation modules | Running the bounded product-task through generated implementation, finding-bound repair, and human-review workflow or creating visual-system deliverables with structured provenance, tokens, accessibility, and handoff evidence |
| `benchmarks/` | Executable product contracts, journey profiles, acceptance criteria, and anti-pattern corpora | Evaluating whether generated UI is behaviorally coherent, evidence-backed, and production-ready for a specific product domain |
| `usability-evaluation/` | Maintained heuristic-evaluation workflow, portable schema, and review template | Conducting a UX audit, defining human-review evidence, separating automated findings from user-testing claims, or turning usability risks into acceptance criteria |
| `retrieval-scope.yaml` | Explicit allowlist for the distributable BM25 index | Auditing or changing which knowledge files can appear in ranked retrieval |
| `provenance.yaml` | Machine-readable ownership, license, transformation, and distribution records | Auditing every shipped knowledge artifact before release |
| `dependencies.yaml` | Direct dependency role, boundary, license, fallback, and replacement plan | Reviewing supply-chain exposure and local fallback behavior |

## Public Knowledge Boundary

Only the maintained files listed above, the benchmark contracts, and the explicit retrieval,
provenance, and dependency manifests belong in the public repository. Raw architecture notes,
historical Figma research, legacy design-system sources, converted UX references, books, and course
materials are retained only in private backup. They are not runtime dependencies, package inputs,
retrieval fallbacks, or implementation authorities.

Do not recreate raw or historical archive directories alongside the maintained knowledge corpus.
Admit a new public knowledge artifact only after it has an independently authored maintained form,
an approved retrieval purpose, and a provenance record that permits distribution.

## Scoped Knowledge Retrieval

Use `search_design_knowledge` to search the approved distributable corpus before opening deep source files. The deterministic BM25 index is governed by `retrieval-scope.yaml`, which names every eligible Markdown file and marks the root `SKILL.md` as authoritative.

The tool returns:

- Ranked repository-relative source paths.
- The matching document title and section.
- Bounded excerpts and normalized matched terms.
- Numeric relevance scores and `high`, `medium`, or `low` confidence.
- An explicit `no-match` result when no approved source contains the searchable query terms.

Available scopes are `skill`, `architecture`, `design-intelligence`, `ux-patterns`, and `usability-evaluation`. Search all scopes only when the task crosses domains. After ranking, read the selected file through its category-specific MCP tool so constraints outside the excerpt are not lost.

Ignored books, raw local research, historical conversions, and benchmark evidence are outside the retrieval manifest. A no-match result must not trigger a historical-source fallback. Refine the query, broaden approved categories, use current product evidence, consult an official standard, or record a knowledge gap instead.

## Product Benchmarks

The executable V4 delivery-pilot boundary is declared in `benchmarks/delivery-pilots.yaml`. Run
`zz-design qualify-pilots --config knowledge-base/benchmarks/delivery-pilots.yaml --evidence-root PATH`
after capturing the declared browser profiles. The report classifies product findings, verifier
limitations, source-policy restrictions, and system defects without generating human evidence.

Run the equivalent before-and-after and locked-holdout evaluation after pilot qualification:

```bash
zz-design evaluate-v4 \
  --config knowledge-base/benchmarks/v4-evaluation.yaml \
  --evidence-root PATH
```

The evaluation retains the attributable V2 visual review as calibration, verifies exact task,
state, route, and viewport identity, exercises maintained positive, negative, and abstention rule
fixtures, and requires the Azure holdout to pass before promoting a cross-product rule. It reports
each quality dimension separately and never manufactures human evidence or a composite vanity score.

After all declared browser reports exist, retain the final local release qualification with:

```bash
npm run v4:qualification -- \
  --pilot-evidence-root .ztothez-design-runtime/v4-pilots \
  --output .ztothez-design-runtime/v4-qualification
```

The ignored output binds command logs, checksums, pilot and holdout reports, package installation,
offline release, clean-room independence, CI coverage, documentation, and human-evidence limits.
This command performs no Git push, tag, npm publication, or website deployment.

Product benchmarks supplement the root skill with domain semantics and executable acceptance evidence. Validate the selected contract before implementation, load only its manifest and contract by default, and inspect its approved source-evidence summary only when a criterion needs deeper grounding.

- AegisOPS SOC readiness command center: `benchmarks/aegisops/MANIFEST.md` and `benchmarks/aegisops/product-contract.yaml`.
- AegisOPS runtime journey profiles: `benchmarks/aegisops/journeys.json`.
- AegisOPS qualified interaction and recovery boundary: `benchmarks/aegisops/interaction-product-contract.yaml` and `benchmarks/aegisops/interaction-journeys.json`.
- AegisOPS evidence interpretation, rejection examples, and current accessibility calibration: `benchmarks/aegisops/acceptance-criteria.md`, `benchmarks/aegisops/anti-patterns.md`, and `benchmarks/aegisops/CALIBRATION.md`.
- SceneStart local-first demoscene learning studio: `benchmarks/scenestart/MANIFEST.md` and `benchmarks/scenestart/product-contract.yaml`.
- SceneStart Studio, Workshop, Learn, and Release profiles: `benchmarks/scenestart/journeys.json`.
- SceneStart qualified storage and import recovery boundary: `benchmarks/scenestart/interaction-product-contract.yaml` and `benchmarks/scenestart/interaction-journeys.json`.
- SceneStart evidence boundaries, rejection examples, and calibration: `benchmarks/scenestart/acceptance-criteria.md`, `benchmarks/scenestart/anti-patterns.md`, and `benchmarks/scenestart/CALIBRATION.md`.
- System corpus manifest, portable schema, provenance, and controlled positive and negative cases: `benchmarks/corpus/corpus.yaml`, `benchmarks/corpus/corpus.schema.yaml`, `benchmarks/corpus/PROVENANCE.md`, and `benchmarks/corpus/cases/`.
- Portable anonymous comparison contracts: `benchmarks/interface-quality/comparison-methodology.schema.yaml`, `benchmarks/interface-quality/comparison-methodology-v1.1.schema.yaml`, `benchmarks/interface-quality/review.schema.yaml`, and `benchmarks/interface-quality/review-session.schema.yaml`.
- Solo-maintainer engineering continuation rules and claim boundaries: `benchmarks/interface-quality/SOLO-MAINTAINER-TRACK.md`.
- Azure V2 human and interaction review method: `benchmarks/azure-optimizer/v2-human-review-methodology.yaml`. Reviewer-facing evidence remains outside the distributable knowledge corpus under `evidence/interface-quality/azure-v2-review/`.
- Azure Optimizer locked interaction holdout: `benchmarks/azure-optimizer/interaction-product-contract.yaml` and `benchmarks/azure-optimizer/interaction-journeys.json`.
- Portable product-task profile, archetype activation rules, and evidence boundary: `benchmarks/portfolio-corpus/PRODUCT-TASK-CONTRACTS.md`, `benchmarks/portfolio-corpus/product-task-profile.schema.yaml`, and `benchmarks/portfolio-corpus/archetype-profiles.yaml`.

Use `evaluate_corpus_benchmark` after changing retrieval, auditing, product-contract validation, anti-slop rules, or approved knowledge. CLI fallback:

```bash
npm run evaluate-corpus
```

The corpus reports recommendation relevance, abstention accuracy, architecture integrity, task completeness, anti-slop rejection, and recommendation mean reciprocal rank. Every case declares provenance and expected behavior. A passing corpus covers only its maintained cases and must not be presented as universal design or usability proof.

Use `validate_product_contract` when MCP is available. CLI fallback:

```bash
npm run validate-contract -- --contract knowledge-base/benchmarks/aegisops/product-contract.yaml
```

Contract version `1.1` binds the product archetype and activated quality dimensions to observable
primary task success, failure recovery, and narrow-viewport journeys. Missing evidence remains
`unverified`; an executed failed task remains `failed`; unsupported capabilities remain explicit
limitations. Do not rank products that use materially different task contracts.

For final evidence, prefer the consolidated quality gate against an already-running application:

```bash
npm run quality-gate -- \
  --contract knowledge-base/benchmarks/aegisops/product-contract.yaml \
  --repo PATH_TO_APPLICATION \
  --url http://127.0.0.1:3000 \
  --profile responsive-overview
```

The gate writes contract, architecture, runtime, acceptance-criterion, screenshot, and consolidated JSON and Markdown evidence. Runtime checks include overflow, semantic clipping, independent control collisions, sticky or fixed occlusion, text contrast, touch-target size, accessible names, visible and unobscured focus, keyboard traps and forced ordering, 200% reflow and text resizing, reduced motion, media rendering, console and network failures, and configured journeys. Base state and preserved post-journey state are checked at every configured viewport. Every blocker criterion in the selected profile must be `PASS`; `UNVERIFIED` is not success. Use `--attestations PATH` only for genuine human review records. AI agents must never create self-attestations. `--skip-runtime` is available for partial diagnostics, but the resulting gate is `INCOMPLETE` and cannot pass.

Runtime exemptions are narrow evidence annotations, not global suppressions:

- `data-ztothez-design-allow-overlap` and `data-ztothez-design-allow-clipping`: verified intentional composition or clipping.
- `data-ztothez-design-allow-contrast`: a background the solid-color sampler cannot model and that has separate contrast evidence.
- `data-ztothez-design-allow-small-target`: a documented target-size standards exception with equivalent operability.
- `data-ztothez-design-allow-focus-occlusion`: an intentional focus geometry case proven visible by another check.
- `data-ztothez-design-allow-reflow` and `data-ztothez-design-allow-text-resize`: a standards-permitted two-dimensional region such as code or a data table, never an ordinary page-level layout exemption.
- `data-ztothez-design-essential-motion`: motion required for the information or operation and reviewed under reduced-motion policy.
- `data-ztothez-design-runtime-ignore`: development or browser tooling outside the product UI; never use it on application content.

Place an exemption on the smallest owning element and record why it is valid. Do not annotate a page shell merely to make a gate pass.

Journey profiles may declare narrowly scoped `expectedNetwork` failures for controlled recovery scenarios. Every policy matches a method, URL fragment, and HTTP status or explicit request failure, and must be observed within its declared count. Unmatched failures and unobserved expectations remain blockers.

After running every contract-required profile into a separate evidence directory, produce one release decision:

```bash
npm run aggregate-gates -- \
  --contract knowledge-base/benchmarks/aegisops/product-contract.yaml \
  --reports .ztothez-design-quality-gate/demo-success,.ztothez-design-quality-gate/offline-recovery,.ztothez-design-quality-gate/responsive-overview \
  --output .ztothez-design-quality-gate/release
```

The aggregator rejects missing or duplicate profiles, contract and failure-policy mismatches, incomplete reports, failed profile gates, and any blocker criterion that is failed or unverified in a required profile. This repository's `.github/workflows/quality.yml` runs build, typecheck, tests, contract validation, and a deterministic fixture gate. Adapt `ci/github-actions-design-quality-gate.example.yml` for a target product only after each required profile has a deterministic service startup command.

## Architecture Routing

Start with `maintained/architecture/MASTER.md`, then load one focused module:

- Measurable quality scenarios, utility trees, sensitivity, and trade-offs: `maintained/architecture/quality-attributes-and-evaluation.md`.
- Component ownership, coupling, cohesion, package direction, and contracts: `maintained/architecture/component-boundaries.md`.
- Shared product scope, variation points, plugins, configuration, and platform economics: `maintained/architecture/product-platforms.md`.

## Usability Evaluation Routing

Start with `usability-evaluation/HEURISTIC_EVALUATION.md` for UX audits, redesign diagnosis, release review, or usability-test planning. It defines evidence boundaries, the expert-review sequence, finding records, severity, and the handoff to representative-user testing. Use `get_usability_evaluation` to list or read this category through MCP.

Use `usability-evaluation/heuristic-review.template.yaml` to start a structured review and `usability-evaluation/heuristic-review.schema.yaml` as its portable version 1.0 contract. Validate completed review artifacts with `evaluate_heuristic_review`. CLI fallback:

```bash
npm run review-heuristics -- --review PATH_TO_HEURISTIC_REVIEW
```

Use `--candidates` for a contract-ready YAML fragment and opt into a nonzero policy result with `--fail-on-open-major`. Open severity 3 and 4 findings produce unapplied blocker acceptance-criterion candidates. Review and merge those candidates into the applicable product contract, then bind them to representative journeys. The heuristic report cannot satisfy `manual-review` evidence and must never be converted into a human attestation by an AI agent.

The distributable repository intentionally excludes raw course handouts, converted books, and extended local research. Use the maintained workflow, schema, and template as the only MCP-accessible usability authority. Treat automated quality-gate findings as rendered evidence, AI-assisted expert review as likely-risk evidence, attributable human-expert review as expert evidence, and representative-user testing as task-performance evidence; never present one as another.

## Product Pattern Routing

For implementation work, start with `maintained/product-patterns/MASTER.md` and load only the matching project-owned pattern:

- AI analysis, generation, review, and evidence workspaces: `maintained/product-patterns/ai-workspaces.md`.
- Pipelines, records, jobs, obligations, media, and document operations: `maintained/product-patterns/operational-dashboards.md`.

## Portfolio Benchmark Registry

Use `benchmarks/portfolio-corpus/registry.template.yaml` to define local project authorization and
`benchmarks/portfolio-corpus/registry.schema.yaml` as the portable version 1.0 contract. Store real
absolute roots only in `.ztothez-design-local/portfolio-registry.yaml`, which is intentionally
excluded from Git, retrieval, packaging, and offline releases.

Use `benchmarks/portfolio-corpus/ADAPTERS.md` to select a stack adapter, declare exact stage
commands, and distinguish supported, unsupported, and not-applicable capabilities. Adapters never
discover and execute arbitrary package scripts.

Validate before discovery or snapshot creation:

```bash
zz-design portfolio validate-registry
zz-design portfolio inventory
zz-design portfolio capabilities --project PROJECT_ID
zz-design portfolio run-stage --project PROJECT_ID --stage STAGE
zz-design portfolio snapshot --project PROJECT_ID
```

Inventory is metadata-only and does not authorize execution. Snapshot creation copies only approved
files into `.ztothez-design-benchmarks/`, verifies the source before cleanup, and leaves all
remediation unapplied.

Run an isolated baseline or cohort benchmark and inspect its retained report:

```bash
zz-design portfolio baseline --project PROJECT_ID --run baseline-001
zz-design portfolio benchmark --cohort development --run development-001
zz-design portfolio benchmark --cohort holdout --run holdout-001
zz-design portfolio verify-unchanged --run development-001
zz-design portfolio report --run development-001
```

See `benchmarks/portfolio-corpus/PORTFOLIO-RUNNER.md` for stage behavior, report fields, exit codes,
and the current browser-verification limitations.

## AI Development Environment Guide

The repository paths above are the canonical references across Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Codex, Qoder, and Lovable. Do not create environment-specific copies of the knowledge base.

For repository-aware coding agents:

1. Start the request with the root `SKILL.md` as the governing instruction source.
2. Name the smallest relevant knowledge-base path in the request.
3. Ask the agent to inspect those files before proposing or implementing changes.
4. Require the agent to preserve the current stack and use only maintained guidance or approved benchmark evidence.
5. Ask it to report which sources materially affected the implementation and which verification commands it ran.

Example request:

```text
Use SKILL.md as the primary workflow. Before implementing this AI analysis screen,
read knowledge-base/maintained/product-patterns/ai-workspaces.md and
knowledge-base/maintained/architecture/quality-attributes-and-evaluation.md.
Preserve the existing framework and validate the completed interaction states.
```

In Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Codex, and Qoder, attach, mention, or request the repository-relative paths through the environment's normal file-context mechanism. Path syntax may differ by product, but the source files and precedence remain the same: `SKILL.md` first, targeted maintained files second.

For Lovable, keep this repository synchronized with the connected Git provider so maintained files are available in project context. Refer to the same repository-relative paths in the task. If the environment cannot read non-application Markdown automatically, provide only the relevant file as task context rather than importing the whole knowledge base into application code.

## Grounding Rules

- `SKILL.md` overrides supporting guidance when wording or scope conflicts.
- Prefer current project code and requirements over historical examples.
- Load only the maintained modules relevant to the task; broad context increases duplication and contradictory guidance.
- Do not copy private names, fixed personal color choices, obsolete framework decisions, or historical generated artifacts into new implementations.
- Convert source concepts into measurable requirements, explicit component contracts, semantic tokens, and testable interaction states.
- Record architectural decisions and trade-offs when deep sources materially change the implementation.

## Design Intelligence Routing

Start with `design-intelligence/MASTER.md` when the task includes brand identity, Figma production, generated or sourced assets, iconography, presentation design, licensing, or visual accessibility. Load only the matching focused modules.

For a new independent React and TypeScript fixture, validate the brief, compile an
implementation-ready plan, then follow `design-intelligence/generation-adapter.md`. Its CLI adapter
requires a separate generation root and a passing local portfolio registry, and it refuses existing,
symlinked, escaping, or portfolio-overlapping targets. The generated manifest follows
`design-intelligence/generation-adapter.schema.yaml`.

For a fresh architecture or runtime finding in a generated fixture, read
`design-intelligence/closed-loop-repair.md` and validate the request shape with
`design-intelligence/repair-request.schema.yaml`. Run `zz-design repair-react` only against the
manifest-owned generated target and an already-running loopback URL. The command retains equivalent
before and after quality-gate evidence, rejects stale or ambiguous findings, and restores original
bytes on repeated or failed verification. It is intentionally CLI-only because MCP remains
read-only. Automated repair output never supplies human evidence.

For a new product or consequential redesign, start from `design-intelligence/product-design-brief.template.yaml` and use `design-intelligence/product-design-brief.schema.yaml` as the portable version 1.0 contract. Read `design-intelligence/product-design-brief.md`, then validate through MCP with `validate_product_design_brief`, or through CLI:

```bash
npm run validate-brief -- --brief PATH_TO_PRODUCT_DESIGN_BRIEF
```

The brief validator checks evidence-backed problems and primary audiences, measurable outcomes, task recovery, data and fallback truth, applicable states, platforms, unresolved assumptions, requirements, and acceptance coverage. Generation readiness authorizes planning only.

Compile a generation-ready brief through MCP with `compile_design_plan`, or through CLI:

```bash
npm run compile-plan -- --brief PATH_TO_PRODUCT_DESIGN_BRIEF --project-root . --json
```

Read `design-intelligence/design-plan.md` and validate machine output against
`design-intelligence/design-plan.schema.yaml`. The compiler produces stable information
architecture, route proposals, component and state boundaries, downstream contract results,
semantic token requirements, responsive rules, asset policy, implementation stages, verification
obligations, and source traces. Planned contracts stay provisional; target-router integration is
verified by the later generation adapter.

For operational claims, generated results, fallback, stale or disconnected behavior, history, or exports, start from `design-intelligence/interface-trust.template.yaml` and use `design-intelligence/interface-trust.schema.yaml` as the portable version 1.0 contract. Read `design-intelligence/interface-trust.md`, then validate through MCP with `validate_interface_trust`, or through CLI:

```bash
npm run validate-trust -- --contract PATH_TO_INTERFACE_TRUST_CONTRACT
```

The trust validator checks declaration structure, source traceability, state consistency, pre-action disclosure, fallback persistence, freshness metadata, disconnected recovery, credential-like values, and history or export provenance. It does not inspect rendered placement or prove runtime service availability.

For operational metrics, findings, charts, hierarchy, long labels, exceptional values, or large collections, start from `design-intelligence/information-design.template.yaml` and use `design-intelligence/information-design.schema.yaml` as the portable version 1.0 contract. Read `design-intelligence/information-design.md`, then validate through MCP with `validate_information_design`, or through CLI:

```bash
npm run validate-information -- --contract PATH_TO_INFORMATION_DESIGN_CONTRACT
```

The validator checks sources, context, metric decisions, findings, evidence, chart purpose, non-color cues, missing and stale states, scalable collections, the eight-level hierarchy, and six answer-flow task declarations. It does not inspect rendered output or turn agent-authored tasks into human evidence.

Create structured evidence from `design-intelligence/design-deliverable.template.yaml`; use `design-intelligence/design-deliverable.schema.yaml` as the portable contract. Version `1.0` remains readable for non-interface manifests. Use version `2.1` with `interface-system` for visual direction, typography, composition, density, states, motion, chart contracts, rendered evidence, and human visual review. Read `design-intelligence/visual-polish.md`, then validate through MCP with `validate_design_deliverable`, or through CLI:

```bash
npm run validate-design -- --manifest PATH_TO_DESIGN_DELIVERABLE
```

The validator checks declaration structure, semantic visual bindings, token references and cycles, responsive composition, typography, density, states, motion, charts, viewport-evidence declarations, human-review attribution, mode-aware contrast, Figma mappings, brand and presentation references, asset rights records, generated-media provenance, icon semantics, and non-color cues. A structural pass can remain visually not ready. Read `visualPolish.releaseReady`; only verified viewport records and reviewer-supplied human evidence satisfy that release gate.
