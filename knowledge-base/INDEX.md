# ZtotheZ Design Engineering Knowledge Base

This directory archives the source material used by the ZtotheZ Design Engineering System and its root [`SKILL.md`](../SKILL.md). Treat `SKILL.md` as the primary, production-ready instruction set. [`ROADMAP.md`](../ROADMAP.md) governs planned work and clean-room independence. Load archived material only when a task needs deeper rationale, source-specific detail, historical examples, or implementation patterns not required by the core skill.

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
| `architecture/` | Software architecture, SOLID, design smells, components and interfaces, package design, design patterns, architectural styles, ATAM, evaluation, and product platforms | Evaluating architecture, resolving coupling or cohesion problems, documenting trade-offs, selecting a pattern or style, or designing reusable platforms |
| `design-intelligence/` | Maintained brand, Figma production, asset generation, iconography, presentation, licensing, visual-accessibility, and manifest-validation modules | Creating visual-system deliverables that need structured provenance, token, accessibility, and handoff evidence |
| `ux-patterns/` | Maintained product-owned UX and software-architecture patterns; raw books, articles, and research conversions remain local-only | Investigating a specialized UX question or applying an approved product pattern beyond the core skill |
| `legacy-sources/design-system/` | AI workspace, operational dashboard, and enterprise-readiness pattern libraries | Implementing a concrete AI workspace or dashboard page and needing detailed page anatomy, states, tokens, or runtime requirements |
| `legacy-sources/historical-readiness-source-ai-uix-readiness-plan/` | Earlier readiness plan and duplicated design-system source material | Auditing history or comparing the synthesized skill against the earlier plan; do not load by default |
| `legacy-sources/external-design-reference-skill-main/` | Archived third-party repository retained for provenance and comparative behavioral research | Comparing externally observable capabilities or auditing provenance; never import, adapt, package, or treat it as a production dependency |
| `benchmarks/` | Executable product contracts, journey profiles, acceptance criteria, and anti-pattern corpora | Evaluating whether generated UI is behaviorally coherent, evidence-backed, and production-ready for a specific product domain |
| `usability-evaluation/` | Maintained heuristic-evaluation workflow, portable schema, and review template | Conducting a UX audit, defining human-review evidence, separating automated findings from user-testing claims, or turning usability risks into acceptance criteria |
| `retrieval-scope.yaml` | Explicit allowlist for the distributable BM25 index | Auditing or changing which knowledge files can appear in ranked retrieval |

## Scoped Knowledge Retrieval

Use `search_design_knowledge` to search the approved distributable corpus before opening deep source files. The deterministic BM25 index is governed by `retrieval-scope.yaml`, which names every eligible Markdown file and marks the root `SKILL.md` as authoritative.

The tool returns:

- Ranked repository-relative source paths.
- The matching document title and section.
- Bounded excerpts and normalized matched terms.
- Numeric relevance scores and `high`, `medium`, or `low` confidence.
- An explicit `no-match` result when no approved source contains the searchable query terms.

Available scopes are `skill`, `architecture`, `design-intelligence`, `figma-and-systems`, `ux-patterns`, and `usability-evaluation`. Search all scopes only when the task crosses domains. After ranking, read the selected file through its category-specific MCP tool so constraints outside the excerpt are not lost.

Ignored books, raw local research, usability source conversions, benchmark evidence, and every `legacy-sources/` directory are outside the retrieval manifest. A no-match result must not trigger an archive fallback. Refine the query, broaden approved categories, or record a knowledge gap instead.

## Product Benchmarks

Product benchmarks supplement the root skill with domain semantics and executable acceptance evidence. Validate the selected contract before implementation, load only its manifest and contract by default, and add historical sources only when a criterion needs deeper grounding.

- AegisOPS SOC readiness command center: `benchmarks/aegisops/MANIFEST.md` and `benchmarks/aegisops/product-contract.yaml`.
- AegisOPS runtime journey profiles: `benchmarks/aegisops/journeys.json`.
- AegisOPS evidence interpretation, rejection examples, and current accessibility calibration: `benchmarks/aegisops/acceptance-criteria.md`, `benchmarks/aegisops/anti-patterns.md`, and `benchmarks/aegisops/CALIBRATION.md`.
- SceneStart local-first demoscene learning studio: `benchmarks/scenestart/MANIFEST.md` and `benchmarks/scenestart/product-contract.yaml`.
- SceneStart Studio, Workshop, Learn, and Release profiles: `benchmarks/scenestart/journeys.json`.
- SceneStart evidence boundaries, rejection examples, and calibration: `benchmarks/scenestart/acceptance-criteria.md`, `benchmarks/scenestart/anti-patterns.md`, and `benchmarks/scenestart/CALIBRATION.md`.
- System corpus manifest, portable schema, provenance, and controlled positive and negative cases: `benchmarks/corpus/corpus.yaml`, `benchmarks/corpus/corpus.schema.yaml`, `benchmarks/corpus/PROVENANCE.md`, and `benchmarks/corpus/cases/`.

Use `evaluate_corpus_benchmark` after changing retrieval, auditing, product-contract validation, anti-slop rules, or approved knowledge. CLI fallback:

```bash
npm run evaluate-corpus
```

The corpus reports recommendation relevance, abstention accuracy, architecture integrity, task completeness, anti-slop rejection, and recommendation mean reciprocal rank. Every case declares provenance and expected behavior. A passing corpus covers only its maintained cases and must not be presented as universal design or usability proof.

Use `validate_product_contract` when MCP is available. CLI fallback:

```bash
npm run validate-contract -- --contract knowledge-base/benchmarks/aegisops/product-contract.yaml
```

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

Load the smallest relevant file set instead of the complete archive:

- Comprehensive digital-product UI/UX architecture: `architecture/Master_Digital_Product_UIX_Architecture_Handbook.md`.
- Architecture foundations and documentation: `architecture/SDA5.md`, `architecture/SDA7.md`, `architecture/SDA_Architecture.md`, and `architecture/SDA_Architecture2.md`.
- SOLID, cohesion, and interface boundaries: `architecture/SDA3.md`, `architecture/SDA6.md`, and `architecture/SDA Components and Interfaces.md`.
- Design smells and refactoring pressure: `architecture/SDA2.md` and `architecture/DOOS_2 updated.md`.
- Design patterns: `architecture/SDA4.1.md`, `architecture/SDA4.2.md`, and `architecture/SDA_DP_set1.md` through `architecture/SDA_DP_set3.md`.
- Architectural styles: `architecture/SDA8.md` and `architecture/Styles1.md` through `architecture/Styles3.md`.
- Architecture quality evaluation: `architecture/ATAM.md`, `architecture/Evaluation.md`, `architecture/SDA10.md`, and `architecture/SDA11.md`.
- Package cohesion and coupling: `architecture/SDA12.md`, `architecture/SDA_Packages and Cohesion.md`, and `architecture/SDA_Packages and Coupling.md`.
- Product lines and reusable platforms: `architecture/SDA9.md` and `architecture/ProductPlatforms.md`.

## Usability Evaluation Routing

Start with `usability-evaluation/HEURISTIC_EVALUATION.md` for UX audits, redesign diagnosis, release review, or usability-test planning. It defines evidence boundaries, the expert-review sequence, finding records, severity, and the handoff to representative-user testing. Use `get_usability_evaluation` to list or read this category through MCP.

Use `usability-evaluation/heuristic-review.template.yaml` to start a structured review and `usability-evaluation/heuristic-review.schema.yaml` as its portable version 1.0 contract. Validate completed review artifacts with `evaluate_heuristic_review`. CLI fallback:

```bash
npm run review-heuristics -- --review PATH_TO_HEURISTIC_REVIEW
```

Use `--candidates` for a contract-ready YAML fragment and opt into a nonzero policy result with `--fail-on-open-major`. Open severity 3 and 4 findings produce unapplied blocker acceptance-criterion candidates. Review and merge those candidates into the applicable product contract, then bind them to representative journeys. The heuristic report cannot satisfy `manual-review` evidence and must never be converted into a human attestation by an AI agent.

The distributable repository intentionally excludes raw course handouts, converted books, and extended local research. Use the maintained workflow, schema, and template as the only MCP-accessible usability authority. Treat automated quality-gate findings as rendered evidence, AI-assisted expert review as likely-risk evidence, attributable human-expert review as expert evidence, and representative-user testing as task-performance evidence; never present one as another.

## Design-System Routing

For implementation work, start with one master document and add only the matching page pattern:

- Shared routing and enterprise requirements: `legacy-sources/design-system/MASTER.md` and `legacy-sources/design-system/ENTERPRISE_READINESS.md`.
- AI workspaces: `legacy-sources/design-system/ai-workspace-patterns/MASTER.md` and `UX-FOUNDATIONS.md`, then one of `pages/agent.md`, `pages/analyze.md`, or `pages/landing.md`.
- Operational dashboards: `legacy-sources/design-system/operational-dashboard-patterns/MASTER.md`, then one matching page under `pages/` for document conversion, media processing, period records, pipeline tracking, or repayment tracking.

## AI Development Environment Guide

The repository paths above are the canonical references across Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Codex, Qoder, and Lovable. Do not create environment-specific copies of the knowledge base.

For repository-aware coding agents:

1. Start the request with the root `SKILL.md` as the governing instruction source.
2. Name the smallest relevant knowledge-base path in the request.
3. Ask the agent to inspect those files before proposing or implementing changes.
4. Require the agent to preserve the current stack and treat archived examples as guidance rather than code that must be copied.
5. Ask it to report which sources materially affected the implementation and which verification commands it ran.

Example request:

```text
Use SKILL.md as the primary workflow. Before implementing this AI analysis screen,
read knowledge-base/legacy-sources/design-system/ai-workspace-patterns/MASTER.md,
knowledge-base/legacy-sources/design-system/ai-workspace-patterns/UX-FOUNDATIONS.md,
and knowledge-base/legacy-sources/design-system/ai-workspace-patterns/pages/analyze.md.
Use knowledge-base/architecture/ATAM.md only to evaluate consequential trade-offs.
Preserve the existing framework and validate the completed interaction states.
```

In Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Codex, and Qoder, attach, mention, or request the repository-relative paths through the environment's normal file-context mechanism. Path syntax may differ by product, but the source files and precedence remain the same: `SKILL.md` first, targeted archive files second.

For Lovable, keep this repository synchronized with the connected Git provider so the archived files are available in project context. Refer to the same repository-relative paths in the task. If the environment cannot read non-application Markdown automatically, provide only the relevant file as task context rather than importing the whole knowledge base into application code.

## Grounding Rules

- `SKILL.md` overrides archived guidance when wording or scope conflicts.
- Prefer current project code and requirements over historical examples.
- Do not load all archives for routine UI work; broad context increases duplication and contradictory guidance.
- Do not copy private names, fixed personal color choices, obsolete framework decisions, or generated artifacts into new implementations.
- Convert source concepts into measurable requirements, explicit component contracts, semantic tokens, and testable interaction states.
- Record architectural decisions and trade-offs when deep sources materially change the implementation.

## Figma, Visual Design & Design Systems

Use this category when work needs deeper visual-system grounding than the root `SKILL.md` provides:

- `figma-and-systems/AI_Design_Skill_Research_Handbook.md` - research guidance for Figma workflows, visual design principles, and design-system construction.
- `figma-and-systems/ZtotheZ_AI_Product_Design_SKILL.md` - operational product-design instructions and implementation workflow for AI coding agents.

Load the research handbook to understand rationale, terminology, and design-system evidence. Load the operational skill when translating those rules into implementation steps. When both are used, keep the root `SKILL.md` authoritative and use these files as focused supporting context.

## Design Intelligence Routing

Start with `design-intelligence/MASTER.md` when the task includes brand identity, Figma production, generated or sourced assets, iconography, presentation design, licensing, or visual accessibility. Load only the matching focused modules.

Create structured evidence from `design-intelligence/design-deliverable.template.yaml`; use `design-intelligence/design-deliverable.schema.yaml` as the portable version 1.0 contract. Validate it through MCP with `validate_design_deliverable`, or through CLI:

```bash
npm run validate-design -- --manifest PATH_TO_DESIGN_DELIVERABLE
```

The validator checks declaration structure, token references and cycles, mode-aware contrast, Figma mappings, brand and presentation references, asset rights records, generated-media provenance, icon semantics, and non-color cues. It does not inspect design-source files, exported media, rendered pixels, or legal sufficiency. Preserve those as separate evidence and human-review obligations.
