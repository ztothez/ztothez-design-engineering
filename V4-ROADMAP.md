# ZtotheZ Design Engineering V4 Roadmap

V4 turns the validated design-engineering system into a closed-loop product delivery workflow. It
must begin from explicit product evidence, generate bounded implementation plans, verify working
interfaces, repair supported findings, and prove that improvements generalize without modifying
read-only benchmark sources.

[`SKILL.md`](SKILL.md) remains authoritative. V4 preserves every V1, V2, and V3 evidence, privacy,
clean-room, package, and source-mutation boundary.

## Status Definitions

- **Done:** every completion criterion has implemented and retained verification evidence.
- **Partial:** implementation exists, but at least one required criterion is incomplete.
- **In progress:** implementation is actively being built and is not yet qualified.
- **Not started:** no roadmap-specific implementation evidence exists.
- **Deferred:** deliberately outside the release scope and not a release blocker.

## Program Outcome

V4 must answer four questions:

1. Can the system refuse generation when users, tasks, data behavior, recovery, or acceptance
   evidence are materially undefined?
2. Can it compile validated product intent into an actionable design and implementation plan?
3. Can it build and repair a coherent task path while preserving truth, accessibility,
   maintainability, responsive behavior, and evidence boundaries?
4. Do the resulting improvements pass product-specific and held-out checks without copying an
   external design product or modifying a read-only benchmark source?

## Roadmap Items

### 1. Product Design Brief Contract

Status: **Done**

Implemented evidence: `knowledge-base/design-intelligence/product-design-brief.md`, the portable
schema, and the maintained hybrid live/demo template define the version 1.0 intake boundary.
`src/product-brief/` validates reference integrity, non-agent grounding for primary audiences,
scope conflicts, task recovery, consequential data boundaries, truthful fallback, derived states,
responsive platforms and input modes, unresolved assumptions, must-have acceptance coverage,
accessibility, sensitive-data policy, downstream decisions, placeholders, and generation status.

`zz-design validate-brief`, `npm run validate-brief`, and the read-only
`validate_product_design_brief` MCP tool return the same structured report. MCP paths use realpath
containment through `ZTOTHEZ_DESIGN_BRIEF_ROOTS` and reports expose only the source filename. Nine
mutation cases cover invented audiences, missing data, false fallback provenance, missing runtime
states, unresolved high risk, uncovered requirements, placeholders, incomplete responsive support,
and sensitive data without policy. The module is routed through `SKILL.md`, BM25 retrieval, exact
knowledge reads, provenance, package output, CI, and installed-package smoke validation.

Create a versioned, machine-readable intake contract for product evidence, audiences, outcomes,
tasks, data, interface states, platforms, constraints, requirements, assumptions, and acceptance
criteria. The contract must expose unresolved decisions instead of allowing an agent to invent them.

Completion criteria:

- A maintained guide, portable schema, and passing template exist.
- Runtime validation checks reference integrity, scope conflicts, primary-audience evidence,
  critical-task recovery, truthful data handling, required states, unresolved high-risk assumptions,
  and acceptance coverage for every must-have requirement.
- A CLI command and read-only traversal-protected MCP tool return the same structured report.
- Positive and mutation-based negative tests cover generation-readiness boundaries.
- Retrieval, package, provenance, installed-package smoke, and `SKILL.md` routing include the brief.

### 2. Design Plan Compiler

Status: **Done**

Implemented evidence: `src/design-plan/` compiles a generation-ready brief into a version 1.0
plan with canonical source digest, compiler version, six-level information architecture,
task-oriented routes, component and state ownership, downstream contract results, semantic token
roles, responsive behavior, asset policy, staged implementation, verification obligations, and
brief, standard, or assumption traces. The output has no compilation timestamp or absolute path,
and repeated compilation of the same brief and compiler version is byte-structure deterministic.

`zz-design compile-plan`, `npm run compile-plan`, and read-only MCP tool `compile_design_plan`
produce the same plan. MCP brief paths use configured-root realpath containment; downstream paths
must be project-relative and reject traversal and symlink escapes. Draft briefs and invalid existing contracts
block planning or implementation; planned contracts remain provisional; implementation readiness
requires all four applicable existing contract validators to pass. The portable schema, maintained
guide, BM25 retrieval case, provenance, package allowlist, installed-package CLI and MCP smoke, CI
compilation assertion, and deterministic, mutation, containment, and readiness tests retain the
completion evidence.

Compile a validated brief into an inspectable plan containing information architecture, decision
hierarchy, routes, component boundaries, state ownership, trust and information contracts, token
requirements, responsive behavior, assets, implementation stages, and verification obligations.

Completion criteria:

- Compilation is deterministic for the same brief and tool version.
- Every plan decision traces to a brief field, approved standard, or explicit agent assumption.
- Missing evidence produces a blocked or provisional decision rather than invented certainty.
- Generated plans validate against the existing architecture, trust, information, and design
  contracts before implementation begins.

### 3. Production UI Generation Adapters

Status: **Done**

Implemented a project-owned `react-typescript-vite` adapter and the installed
`zz-design generate-react` command. The adapter accepts only a validated design plan with
`implementationReady: true`, creates one absent child directory under an explicit generation root,
requires a passing portfolio registry, rejects symlinked or escaping targets, and rejects overlap
with every read-only portfolio root. Writes use an atomic temporary directory and deterministic
file checksums; rejected runs do not overwrite or partially populate a target.

The generated fixture implements one reducer-owned local demonstration task, a preserved-context
disconnected-source recovery path, semantic CSS tokens, responsive structure, generated unit
tests, and separate demo, imported, cached, and live disclosures. Unavailable imported, cached, and
live sources never borrow demonstration values or claim runtime evidence. The portable generation
manifest and maintained adapter guide define traceability, guarantees, and explicit evidence limits.

Qualification covers deterministic generation, implementation-readiness denial, existing-target
preservation, traversal and symlink containment, portfolio-root denial, absolute-path exclusion,
zero-warning architecture audit, installed CLI generation, generated dependency installation,
TypeScript checking, reducer tests, and a production Vite build. MCP remains read-only and exposes
no generation tool. This item creates independent fixtures only; convention-aware merging into an
existing repository remains outside adapter version 1.0.

Implement project-owned generation adapters for an initial React and TypeScript delivery path.
Adapters must follow an existing target repository's conventions or create a minimal independent
fixture when no target exists.

Completion criteria:

- Generated output implements one complete primary task and its recovery path.
- Components use semantic tokens and explicit domain-state ownership.
- Demo, imported, cached, and live behavior remain truthfully distinguishable.
- Generation never runs against read-only portfolio roots and never depends on an external design
  product.

### 4. Visual Composition And Asset Pipeline

Status: **Not started**

Turn visual direction into enforceable composition, typography, density, chart, icon, image, and
responsive decisions. Asset generation remains a specialized optional stage with provenance,
license, contrast, and fallback checks.

Completion criteria:

- Decision-first hierarchy remains measurable at 375, 768, 1024, and 1440 CSS pixels.
- Theme-specific text, focus, state, and chart contrast pass declared and rendered checks.
- Assets have purpose, source, rights, alternatives, and failure behavior.
- Composition checks reject clutter, ornamental status, unsupported visual claims, and hidden next
  actions without enforcing one universal style.

### 5. Closed-Loop Verification And Repair

Status: **Not started**

Connect generation to contract validation, static audit, browser verification, screenshot evidence,
and bounded remediation. Repairs must target supported findings and preserve unrelated behavior.

Completion criteria:

- Every repair references a finding, acceptance criterion, expected evidence, and stopping condition.
- Repeated failure stops with an unresolved report instead of producing uncontrolled rewrites.
- Before and after evidence preserves viewport, route, state, tool version, and checksum identity.
- Human evidence is never generated or silently replaced by automated evidence.

### 6. Interaction And Recovery Verification

Status: **Not started**

Expand executable journeys from rendered correctness into task progress, failure recovery, keyboard
operation, state continuity, export behavior, and offline or disconnected behavior where applicable.

Completion criteria:

- Primary and recovery journeys have observable start, success, failure, and preserved-state checks.
- Loading, empty, partial, stale, disconnected, unauthorized, and error states are verified only
  when applicable to the declared brief and data model.
- Unsupported automation remains a verifier limitation and cannot become a product pass.

### 7. Multi-Product Delivery Pilots

Status: **Not started**

Exercise the V4 workflow on independent, disposable product fixtures derived from owner-authorized
requirements. Azure Optimizer, SceneStart, and AegisOPS may provide task contracts and baselines,
but their protected source roots remain read-only.

Completion criteria:

- At least three product domains complete brief, plan, implementation, and verification stages.
- Pilot work occurs in repository-owned fixtures or separately authorized development copies.
- Reports distinguish system defects, product findings, verifier limitations, and source-policy
  restrictions.

### 8. Before-And-After And Holdout Evaluation

Status: **Not started**

Measure whether V4 changes improve task completeness, hierarchy, accessibility, responsiveness,
truthful disclosure, and maintainability without regressing locked products.

Completion criteria:

- Baseline and candidate evidence use equivalent tasks, states, routes, and viewports.
- Existing external human visual findings remain an authoritative V2 calibration input; V4 does not
  require collecting replacement reviews.
- Candidate rules pass deterministic fixtures and locked holdout evaluation before promotion.
- Reports preserve disagreement and avoid a single unsupported vanity score.

### 9. V4 Qualification And Release

Status: **Not started**

Qualify the end-to-end workflow in CI and an offline package while keeping private evidence local.

Completion criteria:

- CI covers brief rejection, plan traceability, generation containment, repair stopping conditions,
  browser journeys, private-evidence exclusion, and holdout regression.
- CLI, MCP, installation, migration, and troubleshooting documentation are complete.
- Package, offline archive, clean-room independence, and installed MCP smoke checks pass.
- A retained qualification report states only claims supported by executable and human evidence.

## Execution Order

Implement Item 1 before compilation or generation. Implement Item 2 before Items 3 and 4. Build
Items 3 through 6 as one bounded loop, then prove generalization through Items 7 and 8. Complete
Item 9 only after every prior completion criterion has retained evidence.

## Current Status

Items 1 through 3 are Done. Items 4 through 9 are not started. The next target is Item 4: Visual
Composition And Asset Pipeline.
