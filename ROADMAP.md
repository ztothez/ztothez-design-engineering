# ZtotheZ Design Engineering Roadmap

This roadmap tracks the work required to turn the skill, local knowledge base, MCP server, and quality gate into an independently owned design-engineering system. [`SKILL.md`](SKILL.md) remains the authoritative operating instruction; roadmap items describe future engineering work, not capabilities that may be claimed before validation.

## Current Foundation

- Usability guidance is available through MCP.
- Heuristic reviews use a versioned schema with evidence provenance.
- Browser verification covers responsive integrity, accessibility, focus, contrast, target sizing, text resizing, reflow, and reduced motion.
- The workspace contains a deterministic GitHub Actions quality workflow, but it has not been activated in a published repository.
- AegisOPS provides the first executable product benchmark.

## Roadmap Items

Status definitions:

- **Done:** every stated deliverable has current passing evidence.
- **Partial:** implementation evidence exists, but at least one stated deliverable or current acceptance condition is incomplete.
- **Not started:** no implementation of the roadmap-specific capability exists.

### 1. Publish And Activate CI

Status: **Partial**

Initialize and publish the repository, run `.github/workflows/quality.yml` on GitHub, and retain the first complete passing evidence artifact.

Evidence: `.github/workflows/quality.yml` implements build, typecheck, contract validation, tests, a deterministic fixture gate, and artifact upload. Remaining: this workspace is not a Git repository, so there is no remote, GitHub Actions run, or retained GitHub artifact proving activation.

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

Status: **Not started**

Add deterministic full-text or BM25 retrieval across approved knowledge categories. Return source paths, excerpts, confidence, and explicit no-match results while keeping `SKILL.md` authoritative.

Evidence: none for the roadmap-specific retrieval capability. MCP currently lists or reads exact filenames through category-scoped tools; there is no full-text or BM25 index, ranked result schema, confidence calculation, explicit no-match result, or retrieval evaluation suite.

### 6. Installation And Packaging

Status: **Partial**

Package the MCP server and document repeatable installation for Codex, Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Qoder, and Lovable.

Evidence: the TypeScript package builds, exposes the `ztothez-design-engineering` stdio MCP server, has a lockfile, and starts locally with `npm start`. Package `@ztothez/design-engineering` now declares the equivalent `ztothez-design` and `zz-design` executable aliases. Remaining: `package.json` has no safe distributable `files` contract, no installer adapters or release archive exist, supported-agent setup documentation is incomplete, and there are no packed-installation smoke tests.

### 7. Design Intelligence Expansion

Status: **Partial**

Add independently authored, structured modules for brand systems, Figma workflows, asset generation, iconography, presentation design, licensing, and visual-accessibility verification.

Evidence: `knowledge-base/figma-and-systems/` provides substantial independently authored Figma and design-system guidance, `get_figma_system_rules` exposes it through MCP, and runtime verification covers visual accessibility. Remaining: dedicated brand-system, asset-generation, iconography, presentation, and licensing modules plus executable validation workflows are not implemented.

### 8. Corpus Benchmarking

Status: **Partial**

Build positive and negative benchmark sets from user-owned projects and appropriately licensed sources. Measure recommendation relevance, abstention, architectural integrity, task completeness, and anti-slop rejection.

Evidence: AegisOPS and SceneStart provide executable contracts, journeys, acceptance criteria, and anti-pattern documents, with contract regression tests and retained quality-gate evidence. Remaining: there is no formal positive/negative case corpus, relevance or abstention dataset, scoring model, or repeatable corpus-evaluation command.

### 9. Clean-Room Independence And Supply Resilience

Status: **Partial**

Maintain independently owned clean-room capability contracts. External design products are comparative references only; they must not become production dependencies, sources of copied implementation, or authorities over this system.

Evidence: the clean-room capability specification exists; static audits exclude knowledge and legacy directories; the SceneStart contract test rejects third-party authority paths; and the independently owned ZtotheZ Design Engineering identity is applied to the skill, package, MCP server, CLI, rule IDs, runtime annotations, reports, and CI. Remaining: active guidance still points into legacy sources, and there is no project-owned provenance manifest, dependency inventory, global reference-import CI check, archive-removal test, retrieval-exclusion suite, installation isolation test, or offline release bundle.

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

1. Finish Item 1: Publish And Activate CI.
2. Item 5: Scoped Knowledge Retrieval.
3. Item 6: Installation And Packaging.
4. Item 7: Design Intelligence Expansion.
5. Item 8: Corpus Benchmarking.
6. Item 9: Clean-Room Independence And Supply Resilience.

Item 9 is the final certification and hardening phase. Its independence rules still constrain all earlier implementation choices, but its completion checks, archive-removal tests, provenance audit, identity verification, and offline release bundle run only after Items 5 through 8 are complete.
