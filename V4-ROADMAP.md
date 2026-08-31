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
existing repository remains outside adapter version 1.2.1.

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

Status: **Done**

Implemented evidence: the version 2.1 design-deliverable contract now requires every asset to
declare purpose and explicit failure behavior in addition to source, rights, and alternatives.
Rule `ZTDE-DI-310` rejects missing or semantically contradictory asset fallback declarations.
Declared contrast coverage now binds typography, focus, interaction-state, and chart-series tokens
to their rendered surfaces in the default mode and every declared color mode; the maintained
template passes 20 contrast pairs and mutation fixtures exercise missing state and chart coverage.

Runtime checks `ZTDE-RUNTIME-020` through `ZTDE-RUNTIME-022` enforce opt-in decision order,
reachable next action, action and region density limits, purposeful status, evidence-backed visual
claims, rendered focus, state and chart contrast, and asset metadata. `verify-ui` and
`verify_ui_runtime` accept explicit light and dark color schemes. The active CI lane captures and
retains eight screenshots plus the report for the passing composition fixture at 375, 768, 1024,
and 1440 CSS pixels; a negative fixture proves each new runtime rule fails closed.

The version 1.2.1 React adapter emits the composition semantics, keeps context, primary outcome,
and next action ahead of detailed provenance and supporting information, preserves a compact source
disclosure beside the action, and passes generated typecheck, reducer tests, production build, 200
percent text resize, responsive, light, and dark browser verification. It emits no unapproved
assets and does not invoke an external asset service. Asset creation remains an optional specialized
stage governed by the maintained provenance contract.

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

Status: **Done**

Implemented evidence: `knowledge-base/design-intelligence/closed-loop-repair.md`, the portable
version 1.0 request schema and maintained template define a finding-bound repair protocol for
manifest-owned `react-typescript-vite` fixtures. Every finding must resolve uniquely from fresh
architecture or runtime evidence, bind to an acceptance criterion in the selected profile, declare
the complete contract, static, browser, and screenshot evidence set, and receive at least one exact
digest and occurrence-count preconditioned operation. One to three attempts must be declared before
execution; repair remains CLI-only and MCP remains read-only.

`src/repair/` authorizes only real generated targets contained by an explicit generation root and
separate from every validated portfolio root. It rejects traversal, source or manifest symlinks,
non-manifest files, remote verification URLs, evidence redirected into the target, stale or
ambiguous findings, undeclared files, and failed exact preconditions. The runner snapshots regular
project files, requires the loopback server plan ID to equal the generation manifest before every
gate, applies only exact replacements, reruns the complete profile quality gate, verifies unchanged
target plan, route, profile, journeys, viewports, browser and tool versions, checks every screenshot
digest, and reports whether unrelated files retained their hashes.

Repeated finding fingerprints and verification failures stop immediately with an unresolved report
and byte-for-byte restoration of every operation file. A successful run requires every referenced
finding to be absent and the full gate to pass. Regression cases cover success with eight before and
eight after screenshots, repeated-fingerprint rollback, precondition denial without writing,
attempt bounds, traversal, remote hosts, symlinked evidence redirection, and rejection of invented
human-attestation fields. A mismatched runtime plan ID is rejected before source mutation. The
active CI lane compiles a ready synthetic plan, generates, builds, and serves a fresh fixture through
the production adapter, verifies it against a dedicated synthetic contract, repairs one injected
static finding, and uploads the complete portable evidence directory. Automated repair always
reports `humanEvidence: not-generated` and does not authorize release.

Connect generation to contract validation, static audit, browser verification, screenshot evidence,
and bounded remediation. Repairs must target supported findings and preserve unrelated behavior.

Completion criteria:

- Every repair references a finding, acceptance criterion, expected evidence, and stopping condition.
- Repeated failure stops with an unresolved report instead of producing uncontrolled rewrites.
- Before and after evidence preserves viewport, route, state, tool version, and checksum identity.
- Human evidence is never generated or silently replaced by automated evidence.

### 6. Interaction And Recovery Verification

Status: **Done**

Implemented evidence: AegisOPS and SceneStart retain their original version `1.0` journey suites as
historical compatibility artifacts. Dedicated `interaction-journeys.json` suites use version `1.1`
and bind to separate version `1.2` interaction product contracts. Each benchmark task uses one
combined journey with observable start, failure, preserved-state, recovery, success, and export
evidence where applicable.

The verifier now supports controlled local-storage availability independently from browser network
state. SceneStart demonstrates an actual `localStorage.setItem` failure, keeps the project handle in
memory, restores storage, persists the handle, completes Workshop, exports HTML, and enters Studio
with the handle intact. Its Studio journey rejects a real file-input upload before completing both
exports. AegisOPS demonstrates a controlled pipeline failure, preserves the ATT&CK input, retries in
disclosed demo mode, succeeds, and exports the SIGMA artifact.

Contract and mutation tests preserve the version boundary and reject missing task interaction.
Runtime tests cover file input and storage controls. The multi-product qualifier and CI validate
both interaction contracts and retain all three interaction reports at four required viewports.

### 7. Multi-Product Delivery Pilots

Status: **Done**

Implemented evidence: `knowledge-base/benchmarks/delivery-pilots.yaml` declares three independent
product domains and their repository-owned fixtures. Each product has a generation-ready brief, a
deterministically recompiled ready plan, a matching generation identity, product-specific
manifest-owned adaptations, and browser evidence at 375x812, 768x1024, 1024x768, and 1440x1000.

`zz-design qualify-pilots` fails closed on stale plans, missing manifest-owned files, missing or
invalid profile reports, failed journeys, and incomplete viewport coverage. Its report separates
system defects, product findings, verifier limitations, source-policy restrictions, and adapted
manifest files. It always reports `humanEvidence: not-generated`. SceneStart passes six profiles,
AegisOPS passes four, and Azure Optimizer passes three. CI rebuilds all fixtures, executes the thirteen
profiles, runs qualification, and retains the browser and qualification reports.

Exercise the V4 workflow on independent, disposable product fixtures derived from owner-authorized
requirements. Azure Optimizer, SceneStart, and AegisOPS may provide task contracts and baselines,
but their protected source roots remain read-only.

Completion criteria:

- At least three product domains complete brief, plan, implementation, and verification stages.
- Pilot work occurs in repository-owned fixtures or separately authorized development copies.
- Reports distinguish system defects, product findings, verifier limitations, and source-policy
  restrictions.

### 8. Before-And-After And Holdout Evaluation

Status: **Done**

Measure whether V4 changes improve task completeness, hierarchy, accessibility, responsiveness,
truthful disclosure, and maintainability without regressing locked products.

Completion criteria:

- Baseline and candidate evidence use equivalent tasks, states, routes, and viewports.
- Existing external human visual findings remain an authoritative V2 calibration input; V4 does not
  require collecting replacement reviews.
- Candidate rules pass deterministic fixtures and locked holdout evaluation before promotion.
- Reports preserve disagreement and avoid a single unsupported vanity score.

Implemented with `knowledge-base/benchmarks/v4-evaluation.yaml`, maintained positive, negative,
and abstention rule fixtures, and `zz-design evaluate-v4`. The retained local report compares the
same task semantics, state contracts, routes, and four viewports across historical and interaction
contracts for AegisOPS, SceneStart, and the locked Azure Optimizer holdout. All development and
holdout evidence passes. The evaluator retains the existing two-session V2 human calibration and
its seven warnings without rescoring it, reports dimensions separately, and does not generate human
evidence or a composite score. Only `task-bound-interaction-evidence` is promoted;
`storage-failure-control` remains withheld because the holdout has no browser-storage task.

### 9. V4 Qualification And Release

Status: **Done**

Qualify the end-to-end workflow in CI and an offline package while keeping private evidence local.
The planned public application and release website is `ztothez-design-engineering-website`. Keep
that site separate from the engine package and do not present it as operational or release-ready
until this item passes.

Completion criteria:

- CI covers brief rejection, plan traceability, generation containment, repair stopping conditions,
  browser journeys, private-evidence exclusion, and holdout regression.
- CLI, MCP, installation, migration, and troubleshooting documentation are complete.
- Package, offline archive, clean-room independence, and installed MCP smoke checks pass.
- A retained qualification report states only claims supported by executable and human evidence.

Implemented with the integrity-bound `zz-design qualify-v4` evaluator and
`npm run v4:qualification` evidence capture. The active workflow covers brief validation and
rejection regression tests, deterministic plan traceability, contained generation, bounded repair
stopping behavior, browser journeys, pilot qualification, locked holdout evaluation, package and
private-evidence boundaries, offline release, and archive-removal independence. Installation covers
the CLI and MCP clients, version `2.0.5` migration, rollback, and troubleshooting. The retained local
qualification passes every criterion while limiting human claims to existing V2 calibration and
explicitly excluding representative-user validation, universal quality, and external V4 release
approval. Current private V3 requalification is separately supported by its ignored local evidence.
This completion does not itself push, tag, or
publish any artifact or activate the separate release website.

## Execution Order

Implement Item 1 before compilation or generation. Implement Item 2 before Items 3 and 4. Build
Items 3 through 6 as one bounded loop, then prove generalization through Items 7 and 8. Complete
Item 9 only after every prior completion criterion has retained evidence.

## Current Status

Items 1 through 9 are Done. V4 is complete. Any publication, repository push, package release, or
website activation remains a separate explicit action after reviewing retained local evidence.
