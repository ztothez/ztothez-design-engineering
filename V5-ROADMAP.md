# ZtotheZ Design Engineering V5 Roadmap

V5 establishes a provenance-controlled ZtotheZ design-engineering model and compiler. It makes the
public repository, npm package, offline runtime, MCP retrieval layer, and design-engineering rules
depend only on approved project-owned or explicitly licensed knowledge artifacts and independently
authored model entities.

[`SKILL.md`](SKILL.md) remains the primary authority. A file being present under `knowledge-base/`
must never make it authoritative, retrievable, distributable, or safe to publish by implication.
Every usable artifact must pass explicit admission, provenance, license, privacy, transformation,
and behavioral checks before it enters the compiled knowledge boundary.

V5 is a provenance and engineering-control program. It reduces avoidable intellectual-property,
privacy, supply-chain, and credibility risk, but it does not itself provide a legal opinion or
guarantee non-infringement.

## Current Baseline

Before V5 implementation, the repository tracked 179 files under `knowledge-base/`: 133 files were
inside the approved package boundary and 46 historical or raw reference files were public despite
being excluded from retrieval, packaging, and provenance coverage. The owner confirmed that those
46 files were backed up, approved their removal, and retained the maintained replacements.

The current tree contains 140 tracked knowledge files. All 140 are packaged and covered exactly by
the public provenance manifest; 24 knowledge files plus `SKILL.md` are eligible for scoped retrieval. The archive-free build,
regression suite, MCP and retrieval checks, corpus evaluation, package installation, and browser
fixture gate pass without the removed files.

V5 now has to preserve that boundary mechanically while replacing prose-led decisions with an
independently authored structured model, rule registry, and held-out qualification evidence.

## Migration Principle: Rely Now, Replace Safely

The current system must continue using `SKILL.md` and the approved public knowledge boundary
while V5 is developed. Those artifacts are the present operational source for architecture,
product patterns, design intelligence, usability evaluation, schemas, and benchmarks. V5 must not
remove or weaken a current capability merely to reduce the file count.

The long-term authority must become a ZtotheZ-owned structured design-engineering model rather than
a pile of source documents. Current maintained documents provide migration requirements and
comparison evidence. They do not automatically become permanent model truth. Each capability must
be independently expressed as measurable project-owned concepts, rules, relationships, thresholds,
and evidence contracts, then tested before authority moves to the new model.

Migration uses four stages:

1. **Current authority:** `SKILL.md` plus the approved maintained knowledge files continue serving
   production behavior.
2. **Shadow model:** the new model compiles and answers the same bounded tasks without controlling
   production decisions.
3. **Qualified parity:** deterministic and held-out evaluation proves equivalent or better task,
   accessibility, architecture, truth, visual, and provenance outcomes.
4. **Controlled cutover:** the model becomes authoritative only after owner approval; maintained
   Markdown becomes a generated or reviewed explanatory projection rather than the primary rule
   engine.

## Status Definitions

- **Done:** every completion criterion is implemented and supported by retained verification.
- **Partial:** relevant implementation exists, but at least one V5 criterion is incomplete.
- **In progress:** implementation is actively being built and is not yet qualified.
- **Not started:** no V5-specific implementation evidence exists.
- **Deferred:** explicitly outside V5 and not a release blocker.

## Non-Negotiable Boundaries

1. Do not treat directory location as provenance or permission.
2. Do not place raw books, converted publications, research archives, copied documentation,
   external-product files, or unknown-origin material in the public repository.
3. Preserve private originals and hashes outside Git before removing a tracked source.
4. Do not derive runtime rules directly from private or unapproved source files.
5. Do not use competitor-specific names as public denylist rules. Validate an explicit positive
   admission manifest instead.
6. Do not rewrite Git history, move tags, publish npm, create a release, or deploy a website during
   V5 implementation without a separate explicit owner authorization.
7. Never convert AI analysis into a human provenance attestation, license decision, or legal
   clearance.
8. A missing or uncertain source record must block admission, not be converted into an assumption.
9. A clean clone must build, test, retrieve, audit, and run offline without private source material.

## Target Knowledge Architecture

V5 uses the following one-way flow:

```text
Private source archive outside Git
  -> owner-reviewed extraction notes
  -> independently authored maintained module
  -> provenance and admission manifest
  -> ZtotheZ authoritative design-engineering model
  -> deterministic validation and compilation
  -> integrity-bound model artifact, knowledge index, and rule registry
  -> MCP retrieval, CLI, quality gates, package, and offline runtime
```

Production code must never follow this flow backwards. Runtime retrieval must not search private
sources, excluded directories, Git history, network archives, or undocumented local files when an
approved result is absent.

## Roadmap Items

### 1. Public Knowledge Surface Inventory

Status: **Done**

Create a machine-readable inventory of every file tracked under `knowledge-base/`. Record its
repository path, SHA-256 digest, purpose, current retrieval status, package status, public status,
provenance record, declared owner, license or permission basis, transformation status, reviewer,
review date, and disposition.

The deterministic inventory under `governance/` records every current tracked knowledge file and
fails when Git tracking, package scope, retrieval scope, provenance, content hashes, or retained
inventory bytes drift. The 179-file pre-cleanup count remains migration history, not the current
public boundary.

Completion criteria:

- Every tracked knowledge file appears exactly once in the inventory.
- Every inventory entry has one disposition: `admit`, `rewrite`, `private-archive`, `remove`, or
  `blocked`.
- `unknown` owner, license, permission, or transformation status cannot receive `admit`.
- The inventory identifies duplicate, superseded, generated, personal-data-bearing, and
  externally sourced material.
- The inventory command is deterministic and fails on unrecorded tracked files.

### 2. Knowledge Admission And Provenance Contract

Status: **Done**

Extend the current distribution-focused `knowledge-base/provenance.yaml` into a versioned admission
contract for every public knowledge artifact. Separate factual source identity from project review
and permitted use. Do not use a broad project license as proof that third-party input was lawfully
relicensed.

The V5 admission manifest under `governance/knowledge-admission.json` now covers every admitted
public `knowledge-base/` artifact. It is generated from the public inventory and provenance
manifest, then validated against current SHA-256 digests, package scope, retrieval decisions,
source evidence, owner and permission records, transformation history, official-standard
references, and review authority. `npm run knowledge:admission` fails closed on stale records,
unknown or provisional values, path traversal, symlink evidence, boundary drift, broad relicensing,
AI-completed review authority, and mismatched user-owned authorization.

Completion criteria:

- A portable schema validates source identity, owner, license or permission, evidence location,
  transformation method, public-distribution decision, package decision, and reviewer attribution.
- Each admitted artifact has a stable project-owned ID and content digest.
- Public standards cite the official authority and applicable reuse terms.
- User-owned evidence records authorization and redistribution boundaries.
- Unknown or conflicting records fail closed.
- An AI agent may propose a record but cannot mark legal review or human authorization complete.

### 3. Public Repository Knowledge Boundary

Status: **Done**

Make the set of publicly tracked knowledge files equal the admitted public manifest. Move raw,
historical, converted, duplicate, and unknown-origin sources to an owner-controlled private archive
outside the repository after preserving originals and hashes.

The current branch no longer contains the 46 baseline out-of-boundary files. Their owner-controlled
backup and current-tree disposition are confirmed in
`governance/public-knowledge-boundary.json`. `npm run knowledge:boundary` verifies that tracked
public knowledge equals the V5 admission manifest, every removed baseline file is absent from the
current filesystem, Git-tracked knowledge, retrieval scope, package boundary, and admission
manifest, and every removed category points to admitted maintained replacements. Historical Git
objects and release tags remain a separately controlled decision.

Completion criteria:

- `git ls-files knowledge-base` contains no file absent from the public admission manifest.
- The 46 baseline out-of-boundary files receive an explicit owner-reviewed disposition.
- Private archives remain outside Git, npm, release assets, offline runtime, CI artifacts, and MCP
  roots.
- Maintained replacements contain independently written operational rules rather than copied
  prose or cosmetically rewritten source text.
- Current-tree removal is verified before any separate decision about historical Git objects.
- History rewriting and tag movement remain a separately approved operation with retained evidence.

### 4. ZtotheZ Authoritative Design Engineering Model

Status: **Done**

Build a versioned, project-owned semantic model for design engineering. The model must represent
what the system knows and how it makes decisions without requiring raw source prose. It should
encode product archetypes, user tasks, state and recovery contracts, quality attributes, design
tokens, component responsibilities, information hierarchy, interaction patterns, visual
composition, accessibility constraints, evidence classes, verification methods, conflicts,
exceptions, and abstention behavior.

The model is not a language model trained on the source archive. It is an inspectable structured
knowledge and rule system authored for ZtotheZ, validated by schemas, and evaluated against product
evidence. Metrics and thresholds must state whether they come from an official standard, platform
requirement, measured portfolio result, product contract, or ZtotheZ engineering policy.

The V5 shadow model is implemented under `model/ztothez-design-engineering-model.json` with a
portable schema, TypeScript loader, validator, CLI check, MCP read-only inspection tool, package
verification, CI hook, and archive-smoke coverage. It contains project-owned entities for product
archetypes, tasks, state and recovery, quality attributes, semantic tokens, component
responsibilities, information priority, interaction, visual composition, accessibility, evidence
classes, verification, conflicts, exceptions, and abstention. It remains in shadow mode:
`SKILL.md` and the admitted maintained knowledge files remain the operational authority until
Items 5 through 8 prove compiled-rule parity and the owner approves cutover.

Completion criteria:

- A portable schema defines model entities, relationships, authority classes, metrics, conflicts,
  exceptions, evidence requirements, and versioning.
- Every model entity has a stable ZtotheZ ID, owner, rationale, evidence class, and lifecycle state.
- The model distinguishes official requirements, measured evidence, heuristics, product-specific
  decisions, and project-owned policy.
- Design decisions can be traced from product task to state, information priority, component,
  token, rule, verification method, and acceptance evidence.
- Contradictory rules resolve through explicit scope and precedence rather than document order.
- Unsupported requests produce an abstention or knowledge gap.
- No active model entity depends solely on an unavailable, private, unknown-origin, or removed
  source.
- The model runs in shadow mode until Item 8 proves qualified parity.

### 5. Deterministic Model Compiler And Rule Registry

Status: **Done**

Create a stable registry connecting every enforceable design rule, validation rule, model entity,
schema, and benchmark expectation to project-owned rationale and approved evidence. Compile the
admitted manifest and authoritative model into a deterministic runtime artifact containing model
entities, rule identities, source IDs, evidence classes, authority, integrity hashes, and build
metadata.

The existing BM25 index is deterministic and allowlisted, but V5 must bind it cryptographically to
the admission and rule registries and ensure all exact-read MCP routes use the same compiled scope.
During migration, document retrieval remains available as an explanatory and fallback surface;
after cutover, model decisions must not depend on searching prose at runtime.

The deterministic compiler is implemented through `zz-design compile-authority`. It generates
`governance/rule-registry.json` and `model/compiled-authority.json` from the admitted knowledge
manifest, retrieval scope, shadow model, and maintained public `ZTDE-*` rule identifiers. The
compiled artifact records admission, model, retrieval-scope, rule-registry, and payload SHA-256
hashes; exposes 140 admitted knowledge files, 25 retrieval files, 24 exact-read files, 20 model
entities, and 248 registered rules; and stays in shadow mode until V5 cutover. MCP exact-read
tools, BM25 retrieval, package smoke, archive smoke, CI, and independence checks now validate
against that compiled authority boundary.

Completion criteria:

- Compilation accepts only manifest-admitted paths and rejects symlinks, traversal, digest drift,
  unknown files, and missing source records.
- Repeated compilation from identical inputs is byte-for-byte deterministic.
- Every `ZTDE-*` rule has an owner, category, rationale, implementation location, model links,
  evidence class, and source IDs where applicable.
- Project policy is never presented as a statutory, WCAG, platform, or vendor requirement.
- MCP model queries, document search, and exact reads use one compiled authority boundary.
- `SKILL.md` remains the workflow authority during migration; supporting files cannot override it
  silently.
- No-match and knowledge-gap behavior remains explicit and never falls back to private material.
- Package and offline indexes include manifest and compiler versions plus integrity hashes.
- Reports expose model and rule identity without exposing private source paths.
- The compiler can generate reviewed Markdown reference views from the model without making those
  generated views a second independent authority.

### 6. Public-Repository Privacy And Content Gate

Status: **Done**

Add a neutral tracked-content gate for public files. Validate declared publication status, personal
data review, secrets, absolute machine paths, private evidence, raw conversation identifiers, and
files outside approved public roots without embedding unnecessary external-product names in the
repository.

Existing package scanning excludes secrets and private paths, but the recent contributor-handle
issue demonstrates that package-only controls do not protect the public Git tree.

Implemented with `governance/public-content-policy.json`, a portable schema, the
`zz-design validate-public-content` CLI command, package smoke coverage, independence validation,
and CI enforcement. Generated local evidence is now ignored and removed from the Git index; public
V4 visual calibration is represented by aggregate, anonymous, admitted benchmark artifacts under
`knowledge-base/benchmarks/interface-quality/evidence/`. The gate scans tracked files in a Git
workspace and packaged files in installed npm smoke tests, blocks private evidence roots, contact
details, raw conversation identifiers, secret-like values, and private machine paths, and reports
only file and policy identifiers without echoing sensitive matches.

Completion criteria:

- Every public evidence document has a privacy classification and publication decision.
- Public human-feedback artifacts use consented attribution or stable anonymous labels.
- Raw chat logs, contact details, handles, and private reviewer metadata remain outside Git unless
  explicit publication permission is recorded.
- The gate scans tracked source, not only npm contents.
- Findings identify the policy and file without reproducing unnecessary sensitive values.
- CI blocks new unclassified public content.

### 7. Knowledge Quality, Conflict, And Drift Evaluation

Status: **Done**

Extend the corpus beyond retrieval relevance to test whether maintained knowledge produces correct,
non-conflicting, task-appropriate rules. Add positive, negative, abstention, conflict, supersession,
stale-source, and document-versus-model parity fixtures.

Implemented with `knowledge-base/benchmarks/knowledge-quality/`, the
`zz-design evaluate-knowledge-quality` CLI command, the `evaluate_knowledge_quality` MCP tool,
package smoke coverage, CI enforcement, independence validation, and regression tests. The gate
evaluates source quality, retrieval quality, rule quality, and product outcome separately. It
checks explicit no-match behavior, rule provenance, conflict precedence, supersession records, and
shadow-model parity against admitted product interaction contracts without using private source
fallbacks or a compensating aggregate score.

Completion criteria:

- Tests detect conflicting token, accessibility, platform, architecture, and information-design
  guidance.
- Authority order and supersession are deterministic.
- Unsupported questions produce a knowledge gap instead of invented guidance.
- Evaluation reports separate source quality, retrieval quality, rule quality, and product outcome.
- Holdout cases prove that provenance controls do not reduce task completion or accessibility.
- Shadow-model decisions are compared against current production decisions without silently tuning
  locked holdouts.
- Cutover requires equivalent or better results in every activated quality dimension rather than a
  compensating aggregate score.

### 8. Source-Removal And Knowledge-Loss Qualification

Status: **Done**

Prove that all supported behavior survives removal of every non-admitted source and that admitted
knowledge remains sufficient for build, MCP, retrieval, audits, generation, repair, product pilots,
and offline use.

Implemented with `knowledge-base/benchmarks/source-removal/`, the
`zz-design qualify-source-removal` CLI command, the `qualify_source_removal` MCP tool, CI
enforcement, package smoke coverage, independence validation, and archive-free smoke execution.
The qualification exercises representative architecture, Figma, product-pattern, usability,
visual-polish, provenance, and explicit-gap queries against admitted maintained sources. It
records limitations separately and keeps the document-based boundary available for rollback until
the Item 9 release decision.

Completion criteria:

- A clean temporary workspace contains only admitted public knowledge and approved dependencies.
- Build, typecheck, all regressions, MCP smoke, retrieval, corpus, package, offline release, and
  browser quality gates pass.
- Architecture, Figma, product-pattern, usability, visual-polish, and provenance queries resolve
  from the structured model and admitted maintained sources or return an explicit gap.
- No test depends on a private source filename, external-product identifier, local absolute path,
  or historical Git object.
- The qualification report lists limitations without converting them into passing evidence.
- The current document-based boundary remains available for rollback until model cutover evidence
  is accepted.

### 9. Controlled V5 Migration And Release Decision

Status: **Done**

Prepare a local V5 qualification package and an owner-readable migration report. Separate local
implementation completion from public publication. Existing npm versions, tags, releases, and
websites remain unchanged until the owner explicitly approves each public operation.

Implemented with the local-only `npm run v5:migration` capture command and the V5 migration report
builder under `src/v5-migration/`. The command writes an ignored owner packet to
`.ztothez-design-runtime/v5-migration/` containing command logs, hashed evidence references,
`migration-report.json`, `migration-report.md`, package and public-file lists, draft release notes,
and an owner approval checklist. The report lists removed, privately archived, rewritten
replacement, admitted, and blocked artifact sets with pre-change and post-change hashes. Public
actions remain locked as `not-authorized`.

Completion criteria:

- The migration report lists every removed, privately archived, rewritten, admitted, and blocked
  artifact with pre-change and post-change hashes.
- A clean clone and packed installation produce the same approved knowledge identity.
- Release notes explain the provenance architecture without naming unnecessary comparative inputs.
- The owner reviews the complete diff, inventory, test evidence, package manifest, and public-file
  list before authorizing a commit or push.
- Git commit, history rewrite, tag update, npm publication, GitHub release, and website deployment
  are separate explicit approvals.
- V5 claims operational independence and provenance coverage only to the extent demonstrated by
  retained evidence.

## Execution Order

Implement Item 1 before moving or rewriting any knowledge file. Implement Item 2 before admitting
or publishing a replacement. Complete Item 3 before treating the public repository as provenance
controlled. Build Items 4 through 6 before compiling the V5 runtime. Run Items 7 and 8 against the
locked manifest. Complete Item 9 only after the owner reviews all retained local evidence.

## Current Status

Items 1 through 9 are Done locally with a deterministic 140-file public inventory, V5 admission
manifest, public knowledge boundary manifest, shadow design-engineering model, compiled authority
boundary, generated rule registry, public repository privacy gate, knowledge-quality benchmark,
source-removal qualification, CI drift gates, and local owner migration packet generation.

No V5 commit, push, history rewrite, tag change, npm publication, GitHub release, or website update
is authorized by this roadmap document.
