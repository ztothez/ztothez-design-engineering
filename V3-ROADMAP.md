# ZtotheZ Design Engineering V3 Roadmap

V3 turns the user's existing product portfolio into a local, evidence-producing benchmark program.
Its purpose is to test whether ZtotheZ Design Engineering generalizes across real product domains,
stacks, interface types, and maturity levels without modifying, copying, or packaging the original
projects.

[`SKILL.md`](SKILL.md) remains the authoritative operating instruction. [`ROADMAP.md`](ROADMAP.md)
and [`V2-ROADMAP.md`](V2-ROADMAP.md) remain the evidence records for the completed V1 and V2
engineering programs. V3 must preserve every V1 and V2 quality, evidence, packaging, and clean-room
boundary.

## Status Definitions

- **Done:** every deliverable and completion criterion has current passing evidence.
- **Partial:** implementation exists, but at least one required criterion is incomplete.
- **Not started:** no roadmap-specific implementation evidence exists.
- **Deferred:** deliberately outside the current release scope and not a release blocker.

## Program Outcome

V3 must answer four questions with reproducible evidence:

1. Does the system find useful, accurate design-engineering problems across unrelated products?
2. Does it abstain when a rule is unsupported, inapplicable, or cannot be verified?
3. Do promoted rules improve held-out products without overfitting to Azure Optimizer, AegisOPS,
   SceneStart, or one frontend stack?
4. Can all benchmarking run without changing an original project or exposing private source, data,
   screenshots, credentials, or client information?

V3 is a benchmark and system-improvement program. It is not permission to refactor the source
projects, ingest them into the distributable knowledge base, train on their implementation, or
publish their artifacts.

## Source Classes

The local registry may discover candidates from these user-authorized root classes:

| Root class | Intended benchmark value | Default handling |
|---|---|---|
| `Studio/clients/` | Client sites and production-facing workflows | Private, local-only, explicit project opt-in |
| `Studio/fullstack/` | Full-stack products, portfolio sites, and alternate implementations | Local-only, canonical project selection |
| `Studio/personal/` | Personal tools and complex application workflows | Private, exclude user data and credentials |
| `Studio/portfolio/` | Existing AegisOPS, Azure Optimizer, SceneStart, and visual baselines | Reuse existing contracts where available |
| `AI/` | AI workspaces, analysis tools, and mixed-stack systems | First-party projects only; exclude vendor, model, and research mirrors |
| `apps/` | Active utility applications and shared design-system consumers | Deduplicate against personal and shared roots |

Absolute paths belong only in a gitignored local registry. They must never appear in the npm
package, offline release, public evidence, retrieval index, or generated knowledge documents.

## Non-Negotiable Safety Rules

1. Treat every registered source root as read-only.
2. Never run installs, formatters, builds, tests, migrations, development servers, browser sessions,
   or cleanup commands with an original project as the working directory.
3. Run executable stages only in a disposable snapshot owned by this repository's local benchmark
   workspace.
4. Record source state before and after every run. Fail the run if tracked content, untracked
   content, file metadata covered by policy, or repository status changes.
5. Never read or copy `.env` files, credentials, keys, browser profiles, databases, uploads, user
   records, model weights, dependency trees, build output, or operating-system metadata.
6. Do not contact production services. Browser journeys use declared local fixtures, mocks, or
   disconnected states with truthful disclosure.
7. Do not publish client artifacts or private screenshots. Publication requires an explicit
   per-project policy in the local registry.
8. Do not add project source to BM25 retrieval, MCP knowledge reads, package files, release archives,
   or skill instructions.
9. Do not copy project-specific code, components, visual styling, content, or brand assets into the
   maintained system. Promote only independently authored, generalized rules supported by evidence.
10. Remediation output is advisory. Emit reports or patch files into the benchmark workspace and
    apply nothing to an original project without a separate explicit user request.

## Roadmap Items

### 1. Local Corpus Registry And Classification

Status: **Done**

Implemented evidence: `knowledge-base/benchmarks/portfolio-corpus/` contains a portable version 1.0
schema and machine-neutral template. `src/portfolio/` validates the runtime schema, canonical root
and project paths, ownership, confidentiality, publication policy, cohorts, capabilities, path
patterns, entrypoints, duplicate and nested roots, duplicate projects, and real-path containment.
The `portfolio validate-registry` and `portfolio inventory` CLI commands expose local reports without
including absolute paths. The ignored local registry defines all six approved root classes and
enables only AegisOPS, Azure Optimizer, and SceneStart, which already have maintained benchmark
contracts. Metadata-only discovery currently identifies 20 manifest-bearing candidates after
vendor, research, dependency, model, backup, and comparison-tree exclusions.

Create a versioned public schema and a gitignored local registry. Discovery may report candidate
metadata, but a project becomes benchmark-eligible only after an explicit registry entry declares
its boundaries.

Required registry fields:

- Stable project ID and canonical real path.
- Ownership: `first-party`, `client-authorized`, `third-party-reference`, or `unknown`.
- Confidentiality: `public`, `private-local`, or `restricted`.
- Publication policy for source excerpts, screenshots, machine reports, and aggregate metrics.
- Product domain, interface archetype, intended users, and primary tasks.
- Framework, package manager, application entrypoint, and supported benchmark stages.
- Fixture mode, allowed environment variables, local ports, and network policy.
- Include and exclude paths, with an explanation for every nonstandard inclusion.
- Source revision, dirty-state disclosure, and canonicalization key.
- Development-cohort, holdout-cohort, or excluded status.

Required behavior:

- Resolve every path through `realpath` and reject roots outside the six locally approved classes.
- Deduplicate mirrors, backups, symlinks, generated copies, and projects appearing under both
  `Studio/personal/` and `apps/`.
- Exclude dependency trees, build artifacts, backups, captures, models, research mirrors, IDE
  distributions, and third-party comparison repositories by default.
- Require explicit review before enabling any `Studio/clients/` project.
- Preserve an exclusion reason instead of silently dropping an ineligible project.

Planned artifacts:

- `knowledge-base/benchmarks/portfolio-corpus/registry.schema.yaml`
- `knowledge-base/benchmarks/portfolio-corpus/registry.template.yaml`
- `.ztothez-design-local/portfolio-registry.yaml`
- `src/portfolio/`
- `zz-design portfolio inventory`
- `zz-design portfolio validate-registry`

Completion criteria:

- Every selected project has one canonical identity and explicit policy.
- Duplicate, nested, unknown-origin, and disallowed roots fail validation.
- The distributable template contains no machine-specific absolute path.
- Tests cover symlink escapes, path traversal, duplicate roots, private publication, and missing
  ownership.

### 2. Read-Only Snapshot And Mutation Guard

Status: **Done**

Implemented evidence: `src/portfolio/snapshot.ts` captures deterministic source and scoped Git
state, preserves pre-existing dirty worktrees, records metadata-only guards for prohibited content,
copies only approved files, translates contained symlinks into the snapshot, rejects escaping
symlinks, verifies source state after copying and on close, and removes failed or completed
snapshots by default. The Linux process boundary uses Bubblewrap with the snapshot as the only
writable project mount, no original-source mount, network isolation by default, an environment
allowlist, disabled package lifecycle scripts by default, output ceilings, timeouts, and detached
process-group cleanup. Unsupported hosts fail explicitly instead of running without isolation.

Fourteen focused registry and snapshot tests cover traversal, ownership, duplicates, private paths,
secret and dependency exclusion, internal and external symlinks, source mutation, callback failure,
dirty and require-clean Git states, source-path denial inside the process sandbox, network policy,
and timeout cleanup. A real create-and-delete SceneStart snapshot copied 230 approved entries and
closed with the original source digest unchanged. No build, test, formatter, or application command
was run in that original project.

Build a non-destructive execution boundary before running any project command. Static source checks
may open approved files read-only. Every command that can write must run in an isolated snapshot.

Snapshot workflow:

1. Resolve and validate the registered source root.
2. Capture a pre-run source manifest with relative path, type, size, mode, modification time,
   symlink target, and SHA-256 for approved regular files.
3. Capture Git status when the source is a Git worktree without requiring it to be clean.
4. Copy only approved source files into a unique workspace under
   `.ztothez-design-benchmarks/workspaces/`.
5. Reject symlinks that resolve outside the source root.
6. Inject only declared fixture environment values into the snapshot.
7. Run installs, builds, tests, servers, and browser verification inside the snapshot.
8. Stop child processes and retain only policy-approved evidence.
9. Recompute the original source manifest and Git status.
10. Fail with a source-mutation error if any covered value changed.

Safety requirements:

- Original working trees may already be dirty. Preserve and compare that state; never clean it.
- Never call `git reset`, `git checkout`, `git clean`, package installation, or a formatter in an
  original source root.
- Dependency lifecycle scripts are disabled by default and may be enabled only for a reviewed
  adapter inside the snapshot.
- Network access is denied by default. An adapter may allow dependency installation, but product
  runtime traffic remains local and fixture-bound.
- Benchmark cancellation and failure must still stop servers and perform the post-run mutation
  check.

Completion criteria:

- A negative fixture that attempts to write into its source root is detected and fails.
- A dirty source repository remains byte-for-byte and status-for-status unchanged.
- Snapshot creation excludes secrets, data, dependencies, output, and external symlinks.
- Interrupted runs clean up processes without deleting or changing original files.

### 3. Stack And Capability Adapters

Status: **Done**

Implemented evidence: `src/portfolio/adapters.ts` defines six declarative adapters for React with
Vite or TanStack Router, Next.js, Angular, static web tools, Node plus Python full-stack products,
and source-only Python or desktop tools. Every adapter reports all eight benchmark capabilities as
`supported`, `unsupported`, or `not-applicable`. A supported executable stage requires both a
registry capability declaration and an exact registry command. Source audit is the only built-in
stage. Missing commands remain explicit limitations, while adapter, package-manager, stage, script,
path, and network-policy conflicts fail adapter validation.

The version 1.0 local registry contract now supports an explicit adapter and bounded per-stage
commands with relative working directories, timeouts, output ceilings, and dependency-network
declarations. Adapter policy permits only known executables and stage-specific package scripts.
Direct Node and Python execution requires a contained relative script and rejects eval flags and
parent traversal. Arguments are passed without a shell, and execution delegates to the Item 2
Bubblewrap snapshot boundary for environment allowlisting, network isolation, process-group
termination, diagnostic stream separation, and post-run source verification.

`zz-design portfolio capabilities --project ID` reports effective support without exposing local
paths. `zz-design portfolio run-stage --project ID --stage STAGE` executes only a validated command
inside a disposable snapshot and returns distinct passed, failed, timed-out, unsupported, and
not-applicable results. The three enabled local benchmarks now declare their stack adapters; their
undeclared executable commands are reported honestly as limitations rather than guessed from
package files.

Five focused adapter tests execute React/Vite, Next.js, Angular, and Node plus Python fixtures in
snapshots, verify source-only Python audit behavior, reject missing and unsafe commands, confirm
stdout and stderr separation, and prove timeout cleanup with unchanged source state. The complete
84-test suite, registry validation, clean-room independence check, package check, and diff check
pass. The adapter guide and portable registry schema are included in the package and provenance
manifest, while the machine-specific local registry remains excluded.

Support the corpus through declarative adapters rather than one hard-coded JavaScript workflow.
Initial adapters should cover the stacks found during discovery:

- React with Vite or TanStack Router.
- Next.js frontend applications.
- Angular applications.
- Static HTML, CSS, and JavaScript tools.
- Frontend plus Node or Python service applications.
- Source-only Python or desktop tools where browser verification is not applicable.

Each adapter must report capabilities independently:

```text
sourceAudit
typecheck
lint
unitTest
productionBuild
localFixtureServer
browserJourneys
exportVerification
```

An unavailable or inapplicable capability must be reported as `unsupported` or `not-applicable`, not
as passed and not as a product failure. Commands come from the local registry and adapter policy;
the benchmark runner must not guess and execute arbitrary package scripts.

Completion criteria:

- At least three frontend stacks and one full-stack fixture execute in snapshots.
- Source-only projects can produce useful audit evidence without browser claims.
- Missing commands, unsupported platforms, and unavailable services produce explicit limitations.
- Adapter tests prove command containment, timeout handling, process cleanup, and diagnostic output
  separation.

### 4. Product-Task Benchmark Contracts

Status: **Done**

Implemented evidence: product-contract version `1.1` adds an archetype-aware `benchmark` profile
while preserving version `1.0` compatibility for legacy corpus fixtures. The profile declares one
of five archetypes, browser, desktop, or source-only interface scope, all seven V2 quality
dimensions as required or not applicable with reasons, primary product tasks, observable start and
success states, visible failure and recovery behavior, evidence requirements, comparison identity,
and a fixed evidence policy. Browser tasks must bind to an existing journey and verification
binding, a route, and a declared viewport no wider than 768 CSS pixels.

`src/contracts/archetypes.ts` owns the five independently authored archetype definitions and rejects
unsupported interface combinations or missing required dimensions. `src/contracts/validator.ts`
validates task actor, mode, state-machine, success-state, failure-state, journey, verification
binding, viewport, and duplicate references. Reports expose a `ready`, `legacy`, or `invalid` task
model plus primary, recovery, and narrow-viewport counts. Acceptance evaluation preserves the
declared boundary: absent journey evidence is `unverified`, executed failed behavior is `failed`,
and adapter-unavailable behavior remains a `limitation` rather than product evidence.

The portable artifacts under `knowledge-base/benchmarks/portfolio-corpus/` include
`PRODUCT-TASK-CONTRACTS.md`, `product-task-profile.schema.yaml`, and
`archetype-profiles.yaml`. The root skill, README, knowledge index, MCP product-contract report,
package, and provenance manifest route the same model. Comparison logic rejects legacy contracts,
different task-contract IDs, different archetypes, and materially different primary task intent or
observable success.

AegisOPS and Azure Optimizer now expose ready operational-dashboard task models. SceneStart exposes
a ready full-stack-workflow model with separate Workshop-to-Studio continuity and offline export
tasks. Each retained benchmark declares at least one primary task, failure and recovery state, and
narrow browser path using its existing actors, modes, state machines, journeys, bindings, and
viewports. No original portfolio source was read or changed for this migration.

Focused tests validate all five archetypes in positive and negative form, reject missing primary,
recovery, browser, dimension, state, and narrow-viewport declarations, validate all three real
benchmarks, reject unrelated product ranking, and distinguish missing evidence from executed
failure. The complete 90-test suite, clean-room independence check, package check, installed MCP
smoke, and diff check pass. The package contains 381 files; provenance covers 97 artifacts and
reference isolation inspects 206 files.

Benchmark products against their actual purpose instead of applying a generic dashboard checklist.
Each enabled project needs a compact local contract describing users, tasks, data boundaries,
routes, states, and observable completion.

Required archetype profiles:

- Operational dashboard or control surface.
- AI workspace, analysis tool, or generated-result workflow.
- Content, portfolio, or client-facing website.
- Utility, converter, tracker, or personal productivity application.
- Full-stack transactional or multi-user workflow.

Every profile reuses the V2 trust, information, visual, accessibility, responsive, state, and
maintainability dimensions but activates only relevant requirements. Product contracts must define
task success from observable state, not screenshot appearance or implementation-specific selectors
alone.

Completion criteria:

- At least four archetype profiles validate against positive and negative fixtures.
- Each real benchmark declares at least one primary task, one failure or recovery state, and one
  narrow-viewport path when a browser interface exists.
- Contracts distinguish missing evidence from failed product behavior.
- No project is ranked against another project with a materially different task contract.

### 5. Local Portfolio Benchmark Runner

Status: **Done**

Implemented evidence:

- `src/portfolio/runner.ts` executes every selected project independently inside a disposable
  snapshot, retains `report.json`, and verifies the original source digest after execution.
- `zz-design portfolio baseline`, `benchmark`, `verify-unchanged`, and `report` are implemented.
- Reports retain registry and source digests, revisions, adapter identity, declared commands and
  timeouts, environment policy, timestamps, exit status, fixture state, browser viewports,
  structured findings and limitations, artifact checksums, and a normalized result fingerprint.
- Exit codes distinguish findings, limitations, unsafe configuration, and source mutation.
- `tests/portfolio-runner.test.ts` proves mixed-stack continuation, report retention, deterministic
  fixture fingerprints, unsafe-project isolation, post-run source verification, loopback fixture
  readiness, consolidated quality-gate delegation, four-viewport capture, checksummed screenshots,
  and fixture shutdown.
- Optional structured heuristic reviews preserve unresolved severity 3-4 acceptance work.
- `list_portfolio_projects` and `get_portfolio_benchmark_report` provide explicitly enabled,
  read-only MCP summaries without absolute roots or benchmark execution.

Create one orchestrator that executes approved stages, records exact provenance, and delegates to
the existing contract, audit, browser, acceptance, heuristic, and quality-gate modules.

Planned commands:

```text
zz-design portfolio inventory
zz-design portfolio baseline --project PROJECT_ID
zz-design portfolio benchmark --cohort development
zz-design portfolio benchmark --cohort holdout
zz-design portfolio verify-unchanged --run RUN_ID
zz-design portfolio report --run RUN_ID
```

Planned MCP behavior:

- List registered project IDs and declared capabilities without exposing absolute paths.
- Read completed structured benchmark reports.
- Explain findings and evidence limitations.
- Never mutate source or start an executable benchmark through knowledge-retrieval tools.
- Require explicit local enablement before exposing private report summaries.

Every run records the tool version, registry digest, source digest, source revision, adapter,
commands, environment policy, timestamps, exit status, timeouts, browser viewport, fixture state,
findings, limitations, and artifact checksums.

Completion criteria:

- One command can benchmark a mixed-stack cohort without entering original roots.
- A failed project does not stop evidence retention for other projects.
- Exit codes distinguish product findings, verifier limitations, unsafe configuration, and source
  mutation.
- Reports are deterministic for identical fixtures and normalize machine-specific paths.

Completion evidence: all criteria are covered by `portfolio-runner.test.ts`,
`portfolio-fixture-server.test.ts`, `portfolio-mcp.test.ts`, and the MCP regression suite.

### 6. Private Evidence Vault And Publication Controls

Status: **Done**

Implemented evidence:

- `src/portfolio/vault.ts` classifies evidence (`private-raw`, `redacted-report`, `approved-screenshot`, `public-synthetic`, `aggregate-metrics`), scans for secrets and prohibited absolute paths before retention, redacts machine paths/query parameters, enforces screenshot publication policy, and provides `deleteProjectEvidence`.
- `src/portfolio/run-schema.ts` extends `artifactSchema` with `evidenceClass`, `policyDecision`, and `sourceDigest`, updating report version to `1.2.0`.
- `src/portfolio/runner.ts` enforces pre-retention scanning, output redaction, screenshot opt-in policy, and artifact provenance binding.
- `cli/portfolio.ts` provides `zz-design portfolio prune-evidence --run ID [--project ID]`.
- `tests/portfolio-vault.test.ts` proves secret/path leakage detection, machine path redaction, screenshot opt-in enforcement, evidence pruning without schema corruption, and exclusion boundaries across packaging, Git, BM25 retrieval, and MCP tools.

Keep full local evidence outside the distributable package. Store it under
`.ztothez-design-benchmarks/`, indexed by run ID and project ID, with checksums and retention rules.

Evidence classes:

- Private raw source observations and logs.
- Redacted local machine reports.
- Screenshots and exports approved for local review.
- Public synthetic fixtures.
- Aggregate release metrics that contain no private project identity or content.

Required controls:

- Scan retained text for secrets and prohibited absolute paths before accepting a run.
- Redact environment values, query parameters, user records, local usernames, and source roots.
- Keep screenshot retention disabled for private client projects unless explicitly enabled.
- Bind every retained artifact to its source digest and policy decision.
- Prevent local registries, snapshots, private reports, and screenshots from entering npm packaging,
  offline release, Git, BM25 retrieval, or MCP exact-file knowledge access.
- Permit deletion of a project's local evidence without damaging aggregate schema validity.

Completion criteria:

- Package, provenance, independence, and archive-removal tests prove local evidence exclusion.
- Secret and path leakage fixtures fail before evidence is retained.
- Public summaries remain valid after all private evidence is removed.
- Client projects default to zero publishable artifacts.

### 7. Cross-Product Evaluation And Failure Taxonomy

Status: **Done**

Implemented evidence:

- `src/portfolio/taxonomy-schema.ts` defines schemas for 9 core dimensions (`product-task`, `interface-trust`, `information-design`, `visual-polish`, `accessibility`, `responsive`, `architecture`, `runtime-reliability`, `audit-precision`), per-project/dimension metrics, recurrence taxonomy, maintainer annotations, and comparison validation.
- `src/portfolio/taxonomy.ts` implements `evaluateCrossProductTaxonomy` (mapping run stages and findings to dimensions, building recurrence taxonomy, stack/archetype coverage, and applying maintainer false-positive/negative annotations without deleting original findings) and `validateCrossProjectComparison` (validating baseline vs candidate comparability).
- `cli/portfolio.ts` provides `zz-design portfolio cross-product --run ID [--annotations PATH]`.
- `src/portfolio/mcp.ts` exposes `getCrossProductEvaluationForMcp` for opt-in read-only MCP access.
- `tests/portfolio-taxonomy.test.ts` proves 9-dimension breakdown without vanity score collapsing, limitation/abstention isolation from pass/fail totals, recurrence failure grouping across projects/domains, maintainer false-positive annotations without finding deletion, and strict cross-project baseline comparison validation.

Measure system behavior across projects without collapsing unrelated products into one vanity score.
Keep per-project and per-dimension results visible.

Core dimensions:

- Product-task completeness and state continuity.
- Truthful disclosure and data provenance.
- Information hierarchy and decision support.
- Visual-system consistency and composition evidence.
- Accessibility and keyboard operation.
- Responsive structure and text reflow.
- Architecture, coupling, and maintainability.
- Runtime reliability, recovery, and export integrity where applicable.
- Audit precision, actionable remediation, and correct abstention.

Required measures:

- Eligible checks, passed checks, findings, limitations, and abstentions per project.
- Finding recurrence across independent projects and product domains.
- Confirmed false-positive and false-negative records.
- Rule coverage by stack and archetype.
- Baseline-to-candidate deltas only when task, state, fixture, viewport, and tool version are
  comparable.

Do not declare an overall aesthetic winner across unrelated products. Do not treat more findings as
proof that one project or stack is worse. Reports must distinguish product defects, unavailable
evidence, adapter gaps, and quality-gate defects.

Completion criteria:

- The taxonomy groups repeated failures without hiding project-specific context.
- Aggregate reports cannot count unsupported checks as passes or failures.
- Tests reject invalid cross-project comparisons and mixed baseline conditions.
- Maintainer corrections can label false positives without deleting the original finding.

### 8. Rule Promotion And Holdout Validation

Status: **Done**

Implemented evidence:

- `src/portfolio/promotion-schema.ts` defines schemas for rule candidates (`ruleCandidateSchema`), 7 promotion criteria evaluations (`promotionCriteriaEvaluationSchema`), holdout impact breakdown (`holdoutImpactSchema`), and promotion reports (`promotionReportSchema`).
- `src/portfolio/promotion.ts` implements `evaluateRuleCandidate` evaluating all 7 promotion criteria (independent authoring, 3+ project recurrence across 2+ domains or safety standard, positive/negative fixtures, false-positive analysis & abstention path, test regression checks, holdout validation with zero regressions, and original source immutability). Preserves rejected candidate rules and rejection rationale.
- `cli/portfolio.ts` provides `zz-design portfolio evaluate-rule --candidate PATH [--dev-run ID] [--holdout-run ID]`.
- `src/portfolio/mcp.ts` exposes `evaluateRulePromotionForMcp` for opt-in read-only MCP access.
- `tests/portfolio-promotion.test.ts` proves cohort locking enforcement, 4 candidate rules evaluated through full promotion or rejection paths (including recurrence-backed promotion, safety-backed promotion, recurrence rejection, and holdout regression rejection), holdout impact categorization, and promoted rule artifact generation (documentation, test references, report codes, migration guidance).

Use the development cohort to discover candidate improvements, then test them against projects that
were not used to author the rule.

A candidate rule may enter the maintained system only when:

1. It is independently authored and does not reproduce project implementation or proprietary
   content.
2. The failure appears in at least three eligible projects across at least two product domains, or
   a standards-backed safety requirement independently justifies it.
3. A focused positive fixture and negative fixture demonstrate the intended boundary.
4. False-positive analysis identifies legitimate exceptions and an abstention path.
5. Existing V1, V2, retrieval, corpus, MCP, package, and independence tests remain passing.
6. At least one held-out project benefits or remains correctly unaffected.
7. The original projects remain unchanged.

The runner must preserve rejected candidate rules and their reason. It must not tune thresholds until
all current projects pass, and a project finding does not authorize automatic source remediation.

Completion criteria:

- Development and holdout cohorts are locked before candidate-rule evaluation.
- At least three evidence-supported rule candidates complete the full promotion or rejection path.
- Holdout results identify regressions, unaffected products, and correct abstentions.
- Promoted rules include documentation, deterministic tests, report codes, and migration guidance.

### 9. V3 Qualification, CI, And Release

Status: **Done**

Implemented evidence:

- `src/portfolio/qualification-schema.ts` defines schemas for V3 qualification targets (`v3QualificationTargetSchema`), synthetic CI fixture categories (`ciFixtureCategorySchema`), and qualification reports (`v3QualificationReportSchema`).
- `src/portfolio/qualification.ts` implements `evaluateV3Qualification` verifying qualification targets ($\ge 12$ projects, $\ge 5$ domains, $\ge 3$ frontend stacks, $\ge 4$ archetypes, $\ge 3$ locked holdout projects, source-only / browser-only / full-stack paths, zero source root mutations, zero private path/secret leakage), 6 synthetic CI fixture categories, and strict disallowed claim boundaries (detecting and rejecting unverified claims of independent human validation, representative user validation, universal quality, or external tool superiority).
- `cli/portfolio.ts` provides `zz-design portfolio qualify-v3 [--dev-run ID] [--holdout-run ID]`.
- `src/portfolio/mcp.ts` exposes `evaluateV3QualificationForMcp` for opt-in read-only MCP access.
- `tests/portfolio-qualification.test.ts` proves V3 qualification targets evaluation, synthetic CI fixture category verification, zero mutation & zero private leakage enforcement, disallowed claim detection, and supported claims verification.

Qualify the benchmark system without placing private local projects on GitHub Actions. CI uses only
synthetic fixtures and explicitly approved public benchmark artifacts. Real portfolio runs remain
local, and release evidence contains only redacted aggregate summaries.

V3 qualification targets:

- At least 12 eligible first-party or client-authorized projects.
- At least five product domains, three frontend stacks, and four interface archetypes.
- At least three locked holdout projects not used to author promoted rules.
- At least one source-only, one browser-only, and one full-stack benchmark path.
- Zero detected changes in every original source root before and after each run.
- Zero private paths, secrets, client content, or project source files in the npm and offline release.
- All existing V1 and V2 gates remain passing.

Required CI fixtures:

- Registry traversal, duplicate-root, and ownership violations.
- Snapshot mutation, external symlink, secret-copy, and interrupted-process violations.
- Adapter success, unsupported capability, timeout, and failed build cases.
- Cross-product comparison misuse and unsupported-score inflation.
- Private evidence packaging and retrieval leakage.
- Rule-promotion success, rejection, false-positive, and holdout-regression paths.

V3 may be marked done when the targets pass and the retained report supports only these claims:

- The benchmark runner operated non-destructively on the declared corpus.
- The quality system produced evidence across the declared stacks and domains.
- Promoted rules passed their fixtures and locked holdout evaluation.
- Private source and evidence were excluded from distribution.

V3 must not claim independent human validation, representative-user validation, universal design
quality, or superiority over every external tool unless separate evidence explicitly supports that
claim.

## Execution Order

Implement Items 1 and 2 first. No real project command may run before both registry validation and
the mutation guard pass their negative fixtures.

Then implement Items 3 through 6 and baseline a small development cohort using disposable
snapshots. Expand to the full eligible corpus only after evidence privacy and process cleanup pass.

Implement Items 7 and 8 from retained baseline evidence. Lock the holdout cohort before promoting
any new rule. Complete Item 9 only after local qualification and public synthetic CI both pass.

## Current Status

Items 1 through 9 are **Done**. V3 Roadmap implementation and qualification are complete.
All 9 items have been implemented with deterministic tests, schema validations, disposable snapshot guards, secret/path redaction, cross-product taxonomy, holdout rule promotion, and release privacy enforcement.
The benchmark runner operates non-destructively on authorized project roots without modifying original sources, exposing private evidence, or making unverified claims.
