# ZtotheZ Design Engineering Roadmap

This roadmap tracks the work required to turn the skill, local knowledge base, MCP server, and quality gate into an independently owned design-engineering system. [`SKILL.md`](SKILL.md) remains the authoritative operating instruction; roadmap items describe future engineering work, not capabilities that may be claimed before validation.

## Current Foundation

- Usability guidance is available through MCP.
- Heuristic reviews use a versioned schema with evidence provenance.
- Browser verification covers responsive integrity, accessibility, focus, contrast, target sizing, text resizing, reflow, and reduced motion.
- The published repository runs a deterministic GitHub Actions quality workflow and retains fixture-gate evidence.
- AegisOPS provides the first executable product benchmark.
- Approved design knowledge is available through deterministic, authority-aware BM25 retrieval with explicit abstention.
- Independently authored design-intelligence modules and a versioned deliverable manifest provide executable checks for tokens, provenance, visual accessibility, icon semantics, and presentation structure.
- A versioned positive and negative corpus measures retrieval relevance, abstention, architectural integrity, task completeness, and anti-slop rejection with attributable provenance and release thresholds.

## Roadmap Items

Status definitions:

- **Done:** every stated deliverable has current passing evidence.
- **Partial:** implementation evidence exists, but at least one stated deliverable or current acceptance condition is incomplete.
- **Not started:** no implementation of the roadmap-specific capability exists.

### 1. Publish And Activate CI

Status: **Done**

Initialize and publish the repository, run `.github/workflows/quality.yml` on GitHub, and retain the first complete passing evidence artifact.

Evidence: the repository is published at `https://github.com/ztothez/ztothez-design-engineering` with `main` tracking `origin/main`. GitHub Actions run `32947084426` passed build, typecheck, both benchmark-contract validations, all 21 regression tests, the deterministic fixture quality gate, and artifact upload. The retained `ztothez-design-fixture-quality-gate` artifact was created on 2026-08-26 with 14-day retention.

### 2. AegisOPS Product Workflow

Status: **Done**

Add deterministic `demo-success`, `offline-recovery`, and `responsive-overview` environments to the AegisOPS repository. Run each profile independently and aggregate them into one release decision.

Evidence: `knowledge-base/benchmarks/aegisops/` contains the contract and all three journey profiles. `.uix-quality-gate/aegis-release-strict/aggregate-report.json` and `.uix-quality-gate/aegis-release-final/aggregate-report.json` both pass with 3 of 3 profiles and 9 of 9 acceptance criteria verified.

### 3. Resolve AegisOPS Findings

Status: **Done**

Correct the verified contrast-token and control-size failures, rerun all required profiles, and preserve attributable human-review evidence separately from automated evidence.

Evidence: foreground tokens and primary target contracts were corrected without exemptions, and AegisOPS product tests, lint, and production build pass. The current strict reports at `.uix-quality-gate/aegis-demo-v191/`, `.uix-quality-gate/aegis-offline-v191/`, and `.uix-quality-gate/aegis-responsive-v191/` each pass with zero runtime errors and warnings. `.uix-quality-gate/aegis-release-v191/aggregate-report.json` passes with 3 of 3 profiles and 9 of 9 criteria. Existing user-authored attestations remain separate from automated evidence. See `knowledge-base/benchmarks/aegisops/CALIBRATION.md`.

### 4. SceneStart Product Benchmark

Status: **Done**

Create a second product contract, task journeys, acceptance criteria, anti-patterns, and human-review template for SceneStart. Use it to prove the system generalizes beyond a security-operations dashboard.

Evidence: `knowledge-base/benchmarks/scenestart/` contains the contract, four journey profiles, acceptance criteria, anti-patterns, human-review template, source evidence, and calibration. Contract tests pass, multi-route verification is implemented, and CSP-compatible Blob export evidence is covered by regression tests and real Studio and Release profile artifacts. SceneStart accessibility and Workshop-to-Studio state continuity are separately recorded product findings, not missing benchmark deliverables.

### 5. Scoped Knowledge Retrieval

Status: **Done**

Add deterministic full-text or BM25 retrieval across approved knowledge categories. Return source paths, excerpts, confidence, and explicit no-match results while keeping `SKILL.md` authoritative.

Evidence: `knowledge-base/retrieval-scope.yaml` explicitly approves 43 distributable Markdown files across six categories and marks `SKILL.md` authoritative. `src/retrieval/` builds a deterministic 609-chunk Markdown index, applies BM25 ranking with bounded title and authority boosts, and returns source paths, sections, bounded excerpts, scores, confidence, matched terms, and explicit `no-match` reports. The `search_design_knowledge` MCP tool exposes structured and Markdown output. `tests/fixtures/retrieval-cases.yaml`, `tests/retrieval.test.ts`, and `tests/mcp.test.ts` verify ranking, category isolation, authority precedence, abstention, archive exclusion, category-escape rejection, and MCP behavior. The complete 30-test regression suite passes.

### 6. Installation And Packaging

Status: **Done**

Package the MCP server and document repeatable installation for Codex, Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Qoder, and Lovable.

Evidence: package `@ztothez/design-engineering` defines Node.js 22 compatibility, ESM exports, public scoped-package metadata, and the equivalent `ztothez-design` and `zz-design` executable aliases. Its explicit `files` allowlist includes the compiled runtime, authoritative skill, approved retrieval corpus, usability schemas, and benchmark contracts while excluding source archives, raw research, and tests. `npm run package:check` validates every approved retrieval file and benchmark artifact against the packed manifest. `npm run package:smoke` installs the tarball into an empty temporary project, verifies both CLI metadata contracts, starts the installed server over stdio, lists MCP tools, and executes authoritative scoped retrieval. `npm run release:pack` creates a versioned tarball and SHA-256 checksum. `docs/installation.md` documents repeatable setup for Codex, Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Qoder, and Lovable Desktop. `.github/workflows/quality.yml` runs the packed-install smoke test and retains the release archive as a CI artifact.

### 7. Design Intelligence Expansion

Status: **Done**

Add independently authored, structured modules for brand systems, Figma workflows, asset generation, iconography, presentation design, licensing, and visual-accessibility verification.

Evidence: `knowledge-base/design-intelligence/` contains an independently authored coordinating module and seven focused modules for brand systems, Figma production, asset generation, iconography, presentation design, licensing and provenance, and visual accessibility. The versioned `design-deliverable.schema.yaml` and passing `design-deliverable.template.yaml` define a portable contract for token architecture, brand references, Figma mappings, asset rights and generation provenance, icon semantics, presentation masters, and mode-aware contrast evidence. `src/design-intelligence/` implements deterministic `ZTDE-DI-*` findings, reference validation, token-cycle detection, WCAG contrast calculations, non-color-cue checks, and explicit limits around rendered proof and legal clearance. The `validate_design_deliverable` MCP tool and `validate-design` CLI expose the workflow with external-root restrictions. `get_design_intelligence` and the approved retrieval manifest expose the maintained guidance without admitting legacy archives. CI validates the maintained template, package checks enforce its distribution allowlist, packed-install smoke testing passes, and the complete 30-test regression suite covers valid, invalid, traversal, retrieval, and MCP behavior.

### 8. Corpus Benchmarking

Status: **Done**

Build positive and negative benchmark sets from user-owned projects and appropriately licensed sources. Measure recommendation relevance, abstention, architectural integrity, task completeness, and anti-slop rejection.

Evidence: `knowledge-base/benchmarks/corpus/` contains a versioned portable schema, executable manifest, provenance record, project-owned synthetic repositories, an incomplete task-contract fixture, and owner-authorized AegisOPS and SceneStart cases. The 13 maintained cases include 8 positive and 5 negative expectations across recommendation relevance, abstention, architectural integrity, task completeness, and anti-slop rejection. The corpus records four provenance sources, including user-owned product evidence and a W3C WCAG 2.2 reference under the W3C Document License 2015 without redistributing specification text. `src/corpus/` implements bounded loading, project-root containment, deterministic case evaluation, per-dimension scoring, mean reciprocal rank, provenance-preserving reports, and strict thresholds. `evaluate_corpus_benchmark` exposes structured MCP results with traversal protection, and `npm run evaluate-corpus` writes JSON and Markdown evidence when given `--output`. Calibration identified and corrected single-generic-term retrieval overmatching. The maintained corpus passes 13 of 13 cases at 100 percent across all five dimensions with recommendation MRR 0.75 against a 0.75 floor. All 34 regression tests, packed-install MCP smoke testing, and the package allowlist pass. The active GitHub workflow evaluates the corpus and is configured to retain its JSON and Markdown reports as a dedicated artifact.

### 9. Clean-Room Independence And Supply Resilience

Status: **Partial**

Maintain independently owned clean-room capability contracts. External design products are comparative references only; they must not become production dependencies, sources of copied implementation, or authorities over this system.

Evidence: the clean-room capability specification exists; static audits exclude knowledge and legacy directories; the SceneStart contract test rejects third-party authority paths; the scoped retrieval manifest excludes raw research and legacy archives; retrieval tests verify those exclusions and reject category escapes; and the independently owned ZtotheZ Design Engineering identity is applied to the skill, package, MCP server, CLI, rule IDs, runtime annotations, reports, and CI. Remaining: active guidance still points into legacy sources, and there is no project-owned provenance manifest, dependency inventory, global reference-import CI check, archive-removal test, installation isolation test, or offline release bundle.

#### Independence Rules

1. Do not import, execute, package, install, or call reference-project code, CLIs, hosted services, catalogs, templates, or update channels from production paths.
2. Keep reference repositories removable. The build, tests, MCP server, retrieval, quality gate, generated skill, and installer must continue to work when all reference archives are absent.
3. Reimplement observable capabilities from independently designed contracts. Do not copy or translate source code, internal structure, proprietary wording, or unverified assets.
4. Build knowledge from independently authored rules, user-owned material, public standards, official platform documentation, and sources with recorded reuse rights.
5. Record provenance, license status, version, freshness, and transformation history for every distributable catalog or asset.
6. Preserve local-first operation. After installation, core design guidance, retrieval, auditing, and quality-gate behavior must not require a vendor account or remote design service.
7. Treat commodity open-source libraries as replaceable infrastructure, not product authorities. Keep them lockfile-pinned, license-audited, isolated behind narrow interfaces, and covered by substitution or fallback plans.
8. Maintain explicit no-match and abstention behavior. A missing independent rule must never be silently filled from an archived reference dataset.
9. Preserve the independently owned ZtotheZ Design Engineering identity across distributable files and document any future compatibility or installation transition.

#### Deliverables

- A machine-readable provenance and license manifest for distributable knowledge and assets.
- A dependency inventory separating strategic capabilities from replaceable infrastructure.
- CI checks that reject imports and runtime paths into reference archives.
- Retrieval tests proving archived reference content is excluded from approved search categories.
- Behavioral compatibility tests based on inputs, outputs, states, and errors rather than reference internals.
- A product and package identity owned by this project.
- An offline release bundle containing the authoritative skill, schemas, knowledge indexes, and quality-gate runtime.

#### Completion Criteria

Item 9 is complete only when reference archives can be moved outside the workspace and all builds, tests, MCP operations, retrieval evaluations, fixture gates, and installation smoke tests still pass. Every shipped knowledge artifact must have acceptable provenance, and no supported workflow may require continued access to a reference vendor or repository.

## Execution Order

SceneStart product remediation can proceed separately from skill development. AegisOPS remediation is complete against the current verifier and must be reopened if later product or verifier changes invalidate its evidence.

Implement the remaining skill work in this order:

1. Item 9: Clean-Room Independence And Supply Resilience.

Item 9 is the final certification and hardening phase. Its independence rules still constrain all earlier implementation choices, but its completion checks, archive-removal tests, provenance audit, identity verification, and offline release bundle run only after Items 6 through 8 are complete.
