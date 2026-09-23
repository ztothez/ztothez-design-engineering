# ZtotheZ Design Engineering V6 Roadmap

Status: **Done locally; owner accepted on 2026-09-08. V5 remains authoritative.**

The owner accepted local implementation completion and the stated evidence limitations in
[V6-OWNER-REVIEW.md](V6-OWNER-REVIEW.md). This is not authority cutover or publication approval.
The final local verification passed 235 tests and all required build, package, independence,
content, and migration checks. The review record links the retained evidence.

V6 advances the validated ZtotheZ Design Engineering engine for AI coding agents. The immediate
opportunity is the additional engine capability in `Design Blueprint Generator/`: richer plan
compilation, repair workflows, evidence aggregation, contract handling, and portfolio-safe
adapters. A human-facing UI can be retained as an optional local inspection console, but it is
not the product priority and is not required for MCP or CLI operation.

The Blueprint Generator is a prototype and reference implementation, not a production dependency.
V6 will audit and selectively integrate its useful engine modules into this repository, preserve a
single production authority during migration, and remove the prototype tree from the final runtime
path. The engine is not excluded; wholesale unreviewed copying is excluded.
The existing V5 provenance, privacy, package, portfolio, and no-publication boundaries remain in
force throughout V6.

## V6 Objective

Deliver an agent-facing design-engineering engine that lets an AI coding agent:

1. State a product brief and see whether it is ready for design work.
2. Compile that brief into inspectable architecture, state, token, responsive, asset, and
   verification decisions.
3. Review retrieved decision rules and understand why each rule was selected.
4. Inspect quality-gate findings with measured values, evidence tiers, blockers, and remediation.
5. Compare alternatives on the same brief without confusing visual preference with engineering
   evidence.
6. Retrieve and export machine-readable decisions through the existing CLI and MCP server.

An optional local console may expose these same artifacts for human inspection. It must remain a
client of the engine, never a second source of truth.

## Boundaries Before Implementation

- `SKILL.md`, the V5 authoritative model, admission manifests, and compiled authority remain the
  production source of truth until a V6 cutover is explicitly qualified.
- `Design Blueprint Generator/` is an untracked prototype. Do not add it wholesale or make
  production code depend on its package lock, generated route tree, frontend, or framework
  configuration. Its engine is explicitly in scope for audit and selective extraction into the
  existing engine after provenance, tests, API ownership, and boundary review.
- Do not ingest `.env`, Supabase credentials, private keys, service-role configuration, user
  content, or generated build output. The prototype's environment integrations are excluded from
  V6 unless a separate security design approves them.
- Do not copy prompts, catalogues, names, wording, source code, visual assets, or schemas from
  third-party products. Behavioural observations may inform an independently authored requirement
  only when the existing clean-room records and provenance policy permit it.
- The workbench must operate without a network or model gateway for its core workflow. Any future
  optional model-assisted proposal feature must remain clearly labelled, bounded, and unable to
  promote its own output into authority.
- Original projects under the portfolio workspaces remain read-only. UI actions may inspect
  retained reports, but they must call the existing isolated portfolio boundary for benchmarking.
- No commit, push, tag, npm publish, GitHub release, or website deployment is part of V6
  implementation unless separately authorized.

## Candidate Capabilities From The Prototype

These are inputs to design and acceptance criteria, not an automatic implementation checklist.

| Prototype capability | V6 treatment | Production constraint |
|---|---|---|
| Brief composer | Adopt its validation concepts into CLI/MCP flows | Must use the maintained product-brief schema and fail closed on missing evidence |
| Reviewer and composer run logic | Audit and extract useful engine behavior | Must return typed evidence, gates, questions, and honest limitations |
| Side-by-side comparison | Integrate comparison evaluation into the engine | Must separate preference, task evidence, automated evidence, and human evidence |
| Pattern catalogue | Integrate retrieval metadata into MCP | Must use the existing approved retrieval/index path, not a second corpus |
| Pattern draft shelf | Adapt as provisional proposal storage | Drafts never become authority without explicit owner review and a maintained source record |
| Pattern generator | Defer behind a local/offline boundary | No external model is required; generated proposals remain likely-risk and non-authoritative |
| Design-plan compiler | Integrate and reconcile with existing authority/compiler modules | One schema, one compiler, deterministic output, no duplicate decision engine |
| Repair workflow | Integrate after audit evidence is stable | Repair only disposable generated fixtures unless separately authorized |
| Portfolio adapters | Integrate as read-only MCP/CLI report access | Never run commands or expose source roots through MCP |
| Supabase/auth integration | Exclude from the first V6 slice | No credentials, remote persistence, or account dependency in the local-first core |

## Roadmap Items

### 1. Workbench Product Contract

Status: **Done**

Define the workbench itself as a product with primary users, supported tasks, offline behavior,
data sensitivity, and recovery paths. The first task is: create or load a brief, understand its
readiness blockers, and produce a traceable plan. The second task is: inspect a quality result and
know what to fix next.

Completion criteria:

- A maintained workbench product contract and journeys exist.
- Empty, loading, invalid, incomplete, pass, fail, offline, and permission-denied states are
  specified.
- The contract distinguishes a local report from a live benchmark or a human review.
- The contract validates through the existing product-contract tooling.

Evidence: `knowledge-base/benchmarks/agent-workbench/product-contract.yaml` defines the
source-only agent workbench contract, three agent modes, two actors, eight acceptance criteria,
explicit blocked/incomplete/recovery states, evidence-class boundaries, and deterministic handoff
requirements. `journeys.json` provides the maintained qualification profile. The contract validator
passes with one primary task and three recovery tasks. `tests/contracts.test.ts` verifies the
contract, task model, recovery coverage, and source-only boundary.

### 2. Prototype Engine Capability Audit

Status: **Done**

Inventory the prototype `engine/` against the current repository module-by-module. Classify each
capability as already present, genuinely additive, duplicate, unsafe, unverified, or deferred.
Compare schemas, package boundaries, tests, runtime roots, and public-content behavior before any
code is moved.

Evidence: [`V6-ENGINE-AUDIT.md`](V6-ENGINE-AUDIT.md). The audit found a mostly duplicated
prototype engine and identified only the clean-room pipeline and decision-rule modules as
candidate additive capabilities. The prototype UI, Supabase/auth integrations, duplicate server,
parallel package boundary, unverified documents, secrets, and generated output remain excluded.

Completion criteria:

- [x] Prototype engine inventory and module-by-module disposition recorded.
- [x] Duplicate, additive, unsafe, unverified, and deferred capabilities classified.
- [x] Root package, MCP, knowledge, and source-boundary independence checked.
- [x] No prototype source was copied, imported, packaged, or made a runtime fallback.

### 3. Engine Integration And API Reconciliation

Status: **Done**

Integrate only the additive engine capabilities identified in Item 2. Reconcile types, schemas,
CLI commands, MCP tools, report formats, and authority boundaries with the current V5 engine.
Prefer extending existing modules over adding parallel implementations.

Evidence: `src/design-plan/reconciliation.ts` provides the root-owned typed reconciliation
schema, staged readiness report, and independently authored decision rules. The same function is
used by the MCP `reconcile_design_plan` tool and the `zz-design reconcile-plan` CLI command. A
provisional or blocked compiled plan remains non-ready, and every selected rule carries a
`SKILL.md` source reference plus explicit proof and limitations.

Completion criteria:

- [x] Integrated modules are imported by the existing CLI/MCP architecture.
- [x] A blocked or provisional plan cannot be presented as implementation-ready.
- [x] Every output links to a requirement, approved source, or evidence record.
- [x] The same input uses the same deterministic reconciliation function in CLI and MCP.

### 4. Agent-Facing Plan, Review, And Repair Tools

Status: **Done**

Expose the useful prototype engine behavior through stable CLI and MCP tools for plan compilation,
review aggregation, evidence inspection, and bounded repair requests. A console may render these
results later, but agent-readable structured output is the acceptance target.

Evidence: [`V6-ITEM4-AUDIT.md`](V6-ITEM4-AUDIT.md). The maintained CLI/MCP surface already
provides plan compilation, root reconciliation, heuristic review, quality-gate execution,
multi-profile aggregation, retained evidence inspection, and bounded repair. Existing schemas
preserve evidence classes, derive severity 3 and 4 acceptance candidates without attestations,
and keep blocked or provisional plans non-ready.

Completion criteria:

- [x] Findings show severity, measured value, threshold, evidence tier, source reference, remediation,
  and validation method where applicable.
- [x] Automated, AI-assisted expert, human expert, and representative-user evidence remain distinct.
- [x] Unresolved severity 3 and 4 findings become acceptance candidates without creating attestations.
- [x] Absolute local paths, secrets, and private source content are not exposed through CLI, MCP, or
  exported reports.

### 5. Decision-Rule Retrieval And Draft Review

Status: **Done**

Expose approved retrieval through MCP and CLI responses. For each selected rule, return the
selecting signal, confidence, obligations, states, numeric floors, anti-pattern, proof method, and
source reference. Add provisional draft handling only after the read-only retrieval contract is
complete. An optional UI may render these responses later.

Evidence: `retrieve_design_decision_rules` and `zz-design retrieve-rules` use the same root-owned
typed decision-rule selector as plan reconciliation. The response includes selecting signals,
confidence, obligations, states, floors, anti-pattern, proof method, source reference, explicit
no-match status, and limitations. Prose retrieval remains on the existing scoped BM25 and
compiled-authority index; no second index or hidden fallback corpus was introduced.

Completion criteria:

- [x] Retrieval uses the existing scoped authority boundary; prose retrieval remains BM25-backed
  and structured rules use the same approved root boundary.
- [x] No second index or hidden fallback corpus is introduced.
- [x] No-match and confidence results are visible and actionable.
- [x] Draft proposals are not packaged as authority and cannot self-adopt; draft authoring remains
  deferred until a separate controlled workflow is added.

### 6. Comparison And Review Evidence

Status: **Done**

Provide a same-brief comparison contract and report for alternative plans, rendered candidates, or
quality reports. Agent and CLI output must preserve candidate names, viewports, task context, and
evidence links. A future console can present the same packet to a non-technical reviewer, but the
machine-readable comparison is the required product surface.

Evidence: [`V6-ITEM6-AUDIT.md`](V6-ITEM6-AUDIT.md). The maintained comparison methodology,
review schema, evaluator, local CLI compiler, and MCP evaluator already provide anonymous
candidate packets, viewport and task context, checksum-bound artifacts, separate rubric criteria,
and distinct human, user, AI-assisted, and automated evidence classes.

Completion criteria:

- [x] Comparison packets use stable candidate/view labels and direct image/report links.
- [x] Visual preference, information-findability, task performance, accessibility, and architecture
  are separate criteria.
- [x] Human feedback can be imported as attributable records, but the system never fabricates or
  upgrades the evidence class.
- [x] The packet can be produced locally without GitHub, Supabase, or a model provider.

### 7. Read-Only Portfolio Report Access

Status: **Done**

Add MCP and CLI access for authorized benchmark inventory, retained report summaries, source-integrity
results, and verifier limitations. This is a reporting surface, not a project runner. A UI browser
is optional and must consume the same report API.

Evidence: [`V6-ITEM7-AUDIT.md`](V6-ITEM7-AUDIT.md). Existing portfolio MCP and CLI APIs provide
opt-in, read-only registry and retained-report access behind the disposable snapshot boundary.

Completion criteria:

- [x] Only registry IDs and retained summaries are exposed.
- [x] Benchmark execution remains behind `zz-design portfolio` and the existing snapshot boundary.
- [x] Original project paths, source files, private screenshots, and user data are omitted.
- [x] A report clearly identifies product findings, verifier limitations, unsafe configuration, and source mutation separately.

### 8. Handoff And Export Contract

Status: **Done**

Define a versioned workbench handoff that the CLI, MCP server, coding agents, and a human can all
consume. Export a brief reference, compiled plan, selected rules, gate results, open risks, and
next actions without embedding private sources or uncontrolled prose.

Evidence: `src/handoff/schema.ts` and `src/handoff/compiler.ts` define the versioned handoff and
SHA-256 payload integrity. `zz-design export-handoff` and MCP `export_design_handoff` use the same
compiler and keep plans provisional or blocked when their inputs are not ready.

Completion criteria:

- [x] A schema and validator exist for the handoff.
- [x] Export is deterministic and integrity-checksummed.
- [x] Import rejects stale schema versions, path escapes, unknown evidence classes, and unsupported
  authority claims through strict schema validation and portable-path checks.
- [x] The handoff round-trips through CLI and MCP tests. Any optional UI is tested as a consumer, not as
  a second implementation.

### 9. Offline-First Distribution And Security Review

Status: **Done**

Package the workbench only after the core workflow works without external services. Review all
dependencies, browser permissions, file access, environment variables, logging, and generated
artifacts. Keep remote AI generation and authentication optional and isolated.

Evidence: [`V6-ITEM9-SECURITY-REVIEW.md`](V6-ITEM9-SECURITY-REVIEW.md). Existing package, offline
release, independence, public-content, archive, runtime URL, path-root, and MCP transport checks
cover the current workbench boundary.

Completion criteria:

- [x] A clean install launches the workbench with no credentials and no network requirement for core
  flows.
- [x] Dependency, package, independence, public-content, and archive smoke checks pass.
- [x] No `.env`, service-role key, private research, or user-owned project source enters the package.
- [x] Security review records file-root, URL, report-redaction, and browser-boundary decisions.

### 10. Shadow Evaluation And Controlled Cutover

Status: **Done locally; owner accepted limitations; cutover not approved**

Run the workbench beside the existing CLI/MCP flows. Compare outputs on AegisOPS, SceneStart,
Azure Optimizer, and a permitted holdout without changing original projects. Cut over only when
the workbench is demonstrably equivalent or better and the owner approves the authority change.

Completion criteria:

- [x] `zz-design shadow-evaluate` compares retained V4 qualification/evaluation reports with the
  authorized private V3 holdout report.
- [x] The shadow run proves parity for brief readiness, plans, retrieval, evidence classification,
  quality outcomes, and package boundaries for AegisOPS, SceneStart, and Azure Optimizer.
- [x] Three permitted holdout products confirm retrieval, evidence classification, quality outcome,
  and package-boundary behavior. Brief-readiness and design-plan parity are proven only on the
  three development fixtures.
- [x] Differences are classified as defect, intentional improvement, unsupported limitation, or
  unresolved risk.
- [x] Cutover remains a separate owner decision; V5 authority remains active and no authority
  activation is performed by the evaluator.

## Suggested Delivery Order

Implement Items 1 through 4 first. That produces an agent-facing extension around the
already-qualified engine. Then add retrieval and comparison (Items 5 and 6), portfolio reporting
and handoff (Items 7 and 8), security/distribution (Item 9), and only then shadow evaluation and
cutover (Item 10).

The first implementation slice should audit and extract the prototype's brief validation, plan,
review, comparison, and evidence engine modules into existing CLI/MCP boundaries. A local UI is
deferred until the agent-facing contracts are stable. Do not copy the prototype repository or
introduce Supabase, a remote model gateway, or a parallel engine.

## V6 Completion Rule

V6 is complete only when the agent-facing engine is independently implemented, locally usable
through CLI and MCP, offline-safe, package-safe, evidence-honest, and shadow-qualified against the
existing ZtotheZ engine. A good-looking prototype, a passing unit test, or a generated screen alone
is not sufficient evidence of completion.
