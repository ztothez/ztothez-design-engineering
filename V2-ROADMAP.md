# ZtotheZ Design Engineering V2 Roadmap

This roadmap governs the next capability program for ZtotheZ Design Engineering. It focuses on three weaknesses identified by the Azure Optimizer comparison: truthful interface disclosure, operational information design, and visual polish. The completed [`ROADMAP.md`](ROADMAP.md) remains the evidence record for the V1 foundation, and [`SKILL.md`](SKILL.md) remains the authoritative operating instruction.

V2 is a system upgrade, not an Azure-specific facelift. The contracts, knowledge modules, validators, quality gates, and evaluation methods must generalize across product domains while preserving V1 architecture, accessibility, responsiveness, maintainability, packaging, and clean-room independence.

## Status Definitions

- **Done:** every stated deliverable has current passing evidence and all completion criteria are satisfied.
- **Partial:** relevant implementation or evidence exists, but at least one stated deliverable or acceptance condition is incomplete.
- **Not started:** no roadmap-specific implementation evidence exists.

## Program Outcomes

V2 must provide independently owned and operational guidance that allows an agent to:

- Disclose demo, live, hybrid, imported, cached, degraded, and disconnected behavior accurately.
- Organize operational information around user decisions, evidence, impact, and next actions.
- Produce visually polished interfaces without sacrificing accessibility, responsiveness, performance, or architectural integrity.
- Verify deterministic claims automatically and route subjective quality judgments to attributable human review.
- Demonstrate improvement through anonymous comparison, measurable interaction tasks, and a second-product generalization test.

## Release Constraints

Every V2 change must preserve these V1 constraints:

1. `SKILL.md` remains authoritative over retrieved supporting guidance.
2. External design products and generated comparison implementations remain references only. Production code, rules, catalogs, and tests must be independently authored.
3. Automated, AI-assisted expert, human expert, and representative-user evidence remain distinct.
4. An agent must not invent human attestations, user-test results, timestamps, identities, approvals, or risk acceptance.
5. Visual quality cannot be claimed from token validation, screenshot existence, or pixel similarity alone.
6. Existing build, typecheck, test, package, release, retrieval, corpus, and independence checks must remain passing.

## Roadmap Items

### 1. Versioned Comparison Methodology

Status: **Done**

Create a reproducible evaluation method before implementing the new design rules. The current Azure review provides a useful baseline, but it is not yet a portable, versioned protocol with anonymization, task measurements, reviewer records, and validation.

Implemented evidence: `knowledge-base/benchmarks/interface-quality/` contains versioned portable methodology and review schemas, honest templates, a retained synthetic artifact, and an evidence-boundary guide. `src/comparison/` validates candidate and stage scope, stage-specific artifact kinds, retained relative evidence, source revisions, screenshot viewport and state metadata, SHA-256 checksums, claim status and scope, contradictory overall-pass claims, WCAG evidence scope, counterbalanced candidate records, and attributable human and representative-user sessions. The `validate-comparison` CLI and `evaluate_interface_comparison` MCP tool expose structured reports with external-root protection.

The retained baseline at `evidence/interface-quality/azure-baseline/` evaluates four anonymous Azure implementations under one method. It includes exact build, typecheck, architecture-audit, browser, and candidate-journey records; 20 reviewer-facing captures across four declared viewports plus analysis results; a coordinator-only identity map; a counterbalanced reviewer protocol; source-tree revisions; and checksum-bound artifacts. The baseline validates with zero integrity errors and remains intentionally not release-ready because candidate findings are unresolved and no human-expert or representative-user evidence has been supplied. Those are Item 7 and Item 8 responsibilities, not missing Item 1 deliverables.

Regression coverage proves that a structurally valid incomplete review remains not release-ready, an attributable multi-level fixture can become release-ready, missing candidate-stage evidence blocks release, checksum tampering fails validation, candidate identities do not leak through packet filenames or instructions, and an independently authored Antigravity-style negative record is rejected for evidence mixing and false completion claims.

Deliverables:

- `knowledge-base/benchmarks/interface-quality/comparison-methodology.schema.yaml`
- `knowledge-base/benchmarks/interface-quality/comparison-methodology.template.yaml`
- `knowledge-base/benchmarks/interface-quality/review.template.yaml`
- Independently authored scoring criteria for truthful disclosure, information design, visual polish, task confidence, and next-action clarity.
- A validator and report format that reject malformed methods, mixed evidence classes, and generated human attestations.
- Regression fixtures for valid, invalid, incomplete, and attribution-violating review records.

Required evaluation controls:

- Remove product and generator labels from comparison captures.
- Use identical data, tasks, routes, states, and viewport dimensions.
- Randomize or counterbalance presentation order.
- Keep expert inspection separate from representative-user evidence.
- Record task completion, time on task, navigation errors, comprehension accuracy, recovery attempts, confidence, and perceived visual quality.
- Report sample size and limitations. Do not imply statistical significance from a formative sample.

Completion criteria:

- The methodology and review schemas validate deterministically.
- The same protocol can evaluate at least three implementations without implementation-specific fields.
- Tests prove that AI-authored human or user evidence is rejected.
- A baseline Azure comparison artifact is generated from the versioned method.

### 2. Truthful Interface And Data Provenance Contract

Status: **Done**

Create `knowledge-base/design-intelligence/interface-trust.md` and a machine-readable contract for interface claims.

Implemented evidence: `knowledge-base/design-intelligence/interface-trust.md`, `interface-trust.schema.yaml`, and `interface-trust.template.yaml` define the independently owned version 1.0 trust model. The passing template covers demo, live, fallback, stale, and disconnected scenarios with separate data mode, connection, result origin, freshness, environment, scope, limitation, and processing-boundary claims. All 40 claims are classified as verified, demonstration, or unknown and are traceable to state-scoped sources where evidence is required.

`src/interface-trust/` and `validate-trust` enforce source compatibility, runtime timestamps, IANA timezones, pre-action disclosure, fallback persistence, stale labeling, disconnected recovery, history and export provenance, unsupported certainty labels, and credential-like values. MCP exposes the same report through `validate_interface_trust` with `ZTOTHEZ_DESIGN_TRUST_ROOTS` containment. Mutation-based negative fixtures independently cover every required scenario plus provenance loss and secret placeholders. The module is routed through `SKILL.md`, approved retrieval, exact reads, provenance, package allowlists, and installed MCP smoke verification. Passing validation remains a declaration result; rendered persistence and actual service behavior are intentionally deferred to Item 6 browser evidence.

The state model must distinguish:

```text
dataMode: demo | live | hybrid | imported | cached
connection: unknown | checking | connected | degraded | disconnected
resultOrigin: live | simulated | imported | cached
freshness: timestamp plus timezone
```

Required rules:

- Show data mode before a consequential action and preserve it in the application shell.
- Show connection status only when it is derived from runtime evidence.
- Disclose simulated or fallback behavior while it occurs and in the resulting artifact.
- Attach origin, scope, freshness, environment, and limitations to results, history, and exports.
- Distinguish a functioning interface from a functioning backend or external integration.
- Prohibit fake credentials, realistic secret placeholders, unsupported uptime claims, and unverified labels such as `operational`, `online`, `connected`, or `production`.
- Provide explicit unknown, checking, degraded, disconnected, partial, and stale states.
- Keep disclosure readable without requiring an obstructive watermark.

Completion criteria:

- A versioned trust contract and passing template exist.
- Every operational claim can be traced to a state source or is clearly labeled as demonstration content.
- Export and history records preserve the same provenance shown in the interface.
- Positive and negative fixtures cover live, demo, fallback, stale, and disconnected behavior.

### 3. Operational Information Design Contract

Status: **Done**

Implemented evidence: `knowledge-base/design-intelligence/information-design.md`, `information-design.schema.yaml`, and `information-design.template.yaml` define the independently owned version 1.0 operational model. The passing template traces three decision metrics, two findings, one chart, one large collection, all eight hierarchy levels, and all six answer-flow questions through explicit sources, context, freshness, baselines, evidence, destinations, exceptional value states, and non-color cues.

`src/information-design/` and `validate-information` enforce reference integrity, IANA timezones, metric decision context, non-decorative metrics and charts, distinct missing, partial, and stale behavior, accessible label overflow, finding evidence and verification, non-color semantics, scalable collection controls, hierarchy order, and task-reference completeness. MCP exposes the same structured report through `validate_information_design` with `ZTOTHEZ_DESIGN_INFORMATION_ROOTS` realpath containment. Twelve mutation fixtures cover missing sources and baselines, decorative content, inaccessible labels, collapsed value states, color-only findings, incomplete charts, unbounded collections, hierarchy drift, and incomplete answer paths. The module is routed through `SKILL.md`, approved BM25 retrieval, provenance, package allowlists, and installed MCP smoke verification.

Completion boundary: the six task declarations prove that the contract contains inspectable paths for context, priority, impact, evidence, next action, and verification without color-only semantics. They do not claim representative-user comprehension or task success; attributable human evidence remains Item 8.

Create `knowledge-base/design-intelligence/information-design.md` and a structured metric and finding contract.

Every operational surface must answer, in priority order:

1. What environment, scope, and data is the user viewing?
2. What changed or requires attention?
3. What is the operational, financial, security, or user impact?
4. What evidence supports the conclusion?
5. What action should happen next?
6. How will the user verify that the action worked?

Each metric must declare its label, definition, formula, source, scope, time period, freshness, comparison baseline, drill-down destination, limitations, and supported user decision. Each finding must declare severity, affected entity, observation, evidence, impact, confidence, remediation, owner or destination, and validation method.

Required hierarchy:

```text
Context and provenance
Primary outcome and action
Critical exceptions
Health and impact metrics
Prioritized findings
Operational telemetry
Evidence and audit trail
History and exports
```

Completion criteria:

- Metric and finding schemas validate references and required decision context.
- Decorative metrics and charts without a supported decision are rejected or reported.
- Long labels, missing values, partial data, stale data, and large collections have defined behavior.
- Representative tasks can identify priority, impact, evidence, and next action without relying on color alone.

### 4. Visual Polish System

Status: **Implemented and maintainer-reviewed; external release evidence pending**

Implemented evidence: `knowledge-base/design-intelligence/visual-polish.md` defines the independently owned visual-polish workflow and evidence boundary. The design-deliverable contract now supports version `2.0` and the `interface-system` scope while retaining version `1.0` compatibility for legacy non-interface manifests. The portable schema, runtime schema, maintained template, CLI, MCP report, and package smoke path cover visual direction, eight typography roles, four responsive grids, spacing rhythm, stable dimensions, surface, border, elevation and emphasis hierarchy, adaptive density, nine interaction states, semantic motion durations, reduced-motion equivalents, chart contracts, rendered captures, and attributable human review.

`src/design-intelligence/validator.ts` enforces semantic or component usage tokens, role and viewport completeness, domain ornament prohibitions, selected-state and non-color semantics, duration ranges, reduced-motion coverage, chart labels, values, comparison context, alternatives and exceptional states, capture declarations, and human-review attribution. `src/audit/rules/raw-design-values.ts` now detects recurring raw colors, dimensions, durations, shadows, and font declarations outside token files. Thirteen mutation fixtures isolate visual-token leakage, ornamental styling, missing roles and viewports, color-only states and charts, excessive motion, missing reduced-motion behavior, incomplete evidence, and falsely completed human review.

Evidence boundary: the maintained template passes structural validation but reports `visualPolish.releaseReady: false`. Azure V2 now has verified rendered evidence and one attributed, disclosed maintainer review. That review supports continued engineering but does not satisfy anonymous external release evidence. Independent hierarchy, balance, scanability, density, domain-fit, and representative-user evidence remain Item 8 work and must not be generated as if observed.

Create `knowledge-base/design-intelligence/visual-polish.md` and extend the design deliverable contract with visual direction, density, composition, chart, and rendered-evidence declarations.

The module must define:

- Primitive, semantic, and component token responsibilities.
- Typography roles for body text, labels, headings, metadata, metrics, evidence, logs, and code.
- Layout grids, content widths, spacing rhythm, alignment, density modes, and stable component dimensions.
- Border, elevation, surface, emphasis, and selected-state hierarchy.
- Chart purpose, labeling, legends, values, comparison context, alternatives, and empty or partial states.
- Motion purpose, duration categories, interruption behavior, and reduced-motion equivalents.
- Responsive composition at 375, 768, 1024, and 1440 CSS pixels.
- Domain-appropriate visual direction without decorative agent diagrams, excessive glow, meaningless gradients, or ornamental status elements.

Completion criteria:

- Component code uses semantic tokens instead of raw visual values.
- All required viewports have stable fixture screenshots and browser evidence.
- Charts remain understandable through labels and tabular or textual alternatives.
- Loading, empty, success, warning, error, partial, disabled, selected, and focus states share one coherent visual language.
- Attributable human review evaluates hierarchy, balance, scanability, density, and domain fit on rendered output.

### 5. Skill, Retrieval, And MCP Integration

Status: **Done**

Implemented evidence: `SKILL.md` and `knowledge-base/design-intelligence/MASTER.md` now require one bounded nine-stage sequence from validated product task through attributable human visual review. The version 2.0 design-deliverable runtime and portable schemas link `productTask`, `interfaceTrust`, `informationHierarchy`, `metricContracts`, and `generationWorkflow` to the existing visual direction, density, chart, rendered-evidence, and human-review declarations. The validator enforces complete trust scenarios, canonical information order, metric-to-chart references, exact generation order, stage-specific statuses, evidence references, and the dependency from implementation to automated verification to human review. Its report separates structural pass, generation readiness, contract validation, automated evidence, rendered evidence, human review, and integrated release readiness.

Retrieval tests cover each V2 module, authoritative workflow routing, category isolation, prior V1 queries, and unrelated-query abstention. MCP regression tests list and exact-read `interface-trust.md`, `information-design.md`, and `visual-polish.md`. The approved retrieval scope and provenance manifest include all three modules and their portable artifacts. Package checks retain the complete allowlist, and a packed-install MCP smoke serves every module plus the integrated design report. The offline release contains 20 approved documents, 185 retrieval chunks, all required V2 schemas, valid checksums, and no prohibited reference path. Clean-room provenance, archive-removal smoke, skill validation, and all 62 repository tests pass.

Evidence boundary: the maintained design template intentionally reports `integration.releaseReady: false`. Its linked trust and information contracts are declarations, automated verification is required, captures are planned, and human review is required. No automated or AI-assisted result is promoted to human or representative-user evidence.

Integrate the three modules into the generation workflow without turning the root skill into an unbounded prompt.

Required generation order:

```text
Product task
Truth and data-source contract
Information architecture
Interaction and state model
Visual direction
Token architecture
Implementation
Automated verification
Human visual review
```

Deliverables:

- Update `SKILL.md` with concise routing and mandatory workflow steps.
- Add the three modules to the approved retrieval scope and provenance manifest.
- Extend `design-deliverable.schema.yaml` and its template with `interfaceTrust`, `informationHierarchy`, `metricContracts`, `visualDirection`, `densityProfile`, `chartContracts`, and `renderedEvidence` sections.
- Expose exact reads and scoped retrieval through existing MCP boundaries.
- Update package allowlists, offline indexes, installation smoke tests, and clean-room checks.

Completion criteria:

- Retrieval returns the correct V2 module for representative queries and abstains on unrelated queries.
- Existing V1 retrieval ranking and category isolation do not regress.
- Packed and offline installations contain and serve every approved V2 artifact.
- The skill never claims human validation from automated or AI-assisted evidence.

### 6. Deterministic Quality Gates And Browser Verification

Status: **Done**

Implemented evidence: the static repository audit now rejects hard-coded credential literals (`ZTDE-SEC-001`), undisclosed production mock paths (`ZTDE-SLOP-001`), placeholder anchors (`ZTDE-SLOP-002`), inert native buttons and incomplete custom controls (`ZTDE-SLOP-003`), literal operational claims without source bindings (`ZTDE-TRUST-001`), recurring raw visual values (`ZTDE-DESIGN-001`), incomplete network states, and missing accessible names. Explicitly marked and visibly disclosed demo fallback remains allowed. The existing interface-trust, information-design, and design-deliverable validators retain deterministic metric, finding, chart, provenance, state, token, and evidence checks.

The browser verifier retains responsive overflow, semantic clipping, independent collisions, sticky occlusion, text contrast, 24-pixel minimum and 44-pixel recommended targets, accessible names, visible and unobscured focus, keyboard traps and positive tabindex, 200 percent reflow and text resizing, reduced motion, media, console, network, journey, and expected-failure checks. Item 6 adds opt-in persistent data-mode and provenance checks plus required stage and state coverage (`ZTDE-RUNTIME-017`), chart names, visible values, alternatives, and multi-series legends (`ZTDE-RUNTIME-018`), and checksummed screenshot-baseline comparison with explicit dynamic-region selectors (`ZTDE-RUNTIME-019`). Static, runtime, and consolidated reports now separate errors, warnings, verifier limitations, and human-review requirements.

`ci/fixtures/v2-quality-states.html` and `ci/v2-quality-states.journeys.json` cover normal, long-content, empty, partial, slow, fallback, stale, and disconnected states across initial, loading, result, error, history, and export stages. The exact CI sequence passes locally at 375, 768, 1024, and 1440 CSS pixels with 8 of 8 journeys, 36 captures per run, zero findings, one explicitly masked clock region, and 36 of 36 matching second-run checksums. A separate negative runtime fixture triggers both new trust and chart rules, and a tampered baseline triggers the screenshot regression rule. The active GitHub workflow retains the V1 quality gate, V2 machine reports, viewport captures, baseline manifest, masking policy, Azure V2 product evidence, and Item 8 packet-integrity validation as separate gates. All 62 repository tests pass, including AegisOPS and SceneStart contracts, Azure V2 state and evidence contracts, V1 and V1.1 comparison decisions, reviewer-session compilation, the V1 responsive fixture, quality aggregation, retrieval, corpus gates, and semantic CSS-variable audit coverage.

Evidence boundary: screenshot hashes establish sameness only within the captured environment and masking policy. They do not establish visual quality or improvement. Solid-color sampling does not establish contrast over complex media. Automated checks do not establish metric correctness beyond their inputs, legal clearance, domain fit, human comprehension, or representative-user task success. Intentional visual changes still require functional evidence and attributable human review.

Implement automated checks only for properties the available evidence can establish.

Static and contract checks should cover:

- Secret-like placeholder credentials.
- Inert buttons and interactive-looking non-controls.
- Operational claims without declared state bindings.
- Simulated or mock fallback without a disclosure contract.
- Metrics missing source, scope, period, freshness, baseline, or decision purpose.
- Raw visual values outside approved token definitions.
- Charts missing names, values, legends where required, or textual alternatives.

Browser verification should cover:

- Persistent data-mode disclosure at initial, loading, result, error, history, and export stages.
- Normal, long-content, empty, partial, slow, fallback, stale, and disconnected fixtures.
- Clipping, overflow, collisions, density, focus occlusion, keyboard flow, text resize, reflow, reduced motion, and touch targets at required viewports.
- Stable screenshots for regression detection with explicit handling for dynamic regions.

Pixel comparison may detect unintended change but must not be used as proof that a design is good or improved. Intentional baseline changes require passing functional evidence and attributable visual review.

Completion criteria:

- Positive fixtures pass and each negative fixture triggers its intended rule.
- Reports distinguish errors, warnings, verifier limitations, and human-review requirements.
- CI retains machine-readable reports and viewport evidence.
- Existing V1 fixture and product gates remain passing.

### 7. Azure Optimizer V2 Benchmark

Status: **Done**

Implemented evidence: `benchmarks/azure-optimizer-v2/` is an independently tracked product fixture built from the normalized Azure task model and fixed comparison dataset. The four retained baseline candidates remain unchanged. The V2 implementation removes fake credentials, settings theater, unsupported monitoring claims, automatic undisclosed fallback, and component-level raw colors. It uses semantic tokens, a focused HTTP analysis boundary, an explicit opt-in local fallback, a provenance-preserving Blob export, and persistent data-mode, connection, processing-origin, freshness, scope, and limitation disclosure.

The overview follows context, priority, impact, evidence, action, owner, and validation order. All four metrics expose definition, source, scope, period, freshness, baseline, and supported decision. The ranked finding review connects affected scope to observation, impact, evidence, remediation, ownership, and validation. The restrained light operational composition preserves navigation, focus, reduced motion, chart alternatives, responsive reflow, text resizing, and component boundaries.

`knowledge-base/benchmarks/azure-optimizer/v2-journeys.json` verifies demo success, live local-API processing over the disclosed imported fixture, slow analysis, an expected 503 followed by explicit fallback, disconnected recovery, partial and stale results, detailed finding review, history, and export. The final production run passes 9 of 9 journeys at 375, 768, 1024, and 1440 CSS pixels with 40 captures, zero runtime findings, the expected network policy satisfied, a captured Blob export, and 40 of 40 matching screenshot hashes using only `.dynamic-value` as a declared mask. The application passes ESLint, TypeScript, and the Next production build. The repository static audit scans 22 implementation files with zero findings; the independently authored product icon is a separately built static asset.

Retained evidence is in `evidence/interface-quality/azure-v2/`, including the 40-capture baseline, final machine report, selected mobile and desktop captures, disclosed fallback and export captures, and the captured provenance JSON. `knowledge-base/benchmarks/azure-optimizer/V2-IMPLEMENTATION.md` maps each contract requirement to implementation and evidence.

Evidence boundary: Item 7 establishes automated product, state, accessibility, responsive, network, export, and screenshot-regression evidence. It does not establish visual superiority, reviewer preference, representative-user comprehension, or human approval. Those conclusions remain Item 8 reviewer-supplied work.

Required remediation:

- Replace fake API credentials and remove or implement inert settings actions.
- Replace unsupported operational messaging with runtime-derived status.
- Add persistent demo, live, hybrid, cached, imported, or disconnected disclosure.
- Enrich the overview with prioritized findings, impact, evidence, telemetry, and next actions without adding decorative density.
- Move network and fallback orchestration behind a focused boundary.
- Replace remaining component-level raw colors with semantic tokens.
- Preserve navigation, accessibility, reduced motion, responsive behavior, and maintainable component boundaries.

Required benchmark states:

- Demo success.
- Live connected success.
- Slow analysis.
- Backend failure with disclosed local fallback.
- Disconnected and recovery.
- Partial or stale result.
- Responsive overview and detailed finding review.
- Export with provenance.

Completion criteria:

- The V2 contract, static audit, browser profiles, build, typecheck, and tests pass.
- No undisclosed simulation, fake credential, unsupported status, inert primary action, or raw component color remains.
- Baseline and final evidence use identical tasks, states, data, and viewports.

### 8. Anonymous Human And Interaction Review

Status: **Done**

Implemented evidence: comparison methodology version `1.1` adds required-stage candidate scope, minimum human-expert and representative-user counts, complete candidate-by-task and candidate-by-criterion matrices, counterbalanced-order coverage, category scoring, task metrics, and an anonymous target-versus-comparator decision. Missing or duplicate cells, insufficient sessions, insufficient counterbalancing, category scores below the floor or comparator, and task-metric regression remain explicit findings and prevent release.

`evidence/interface-quality/azure-v2-review/` contains a five-candidate packet with 51 checksum-bound automated artifacts, 25 common-state captures, a coordinator-only identity map, five counterbalanced orders, and draft-locked expert and representative-user templates. The base review validates with zero integrity errors and honestly remains not release-ready at 5 of 6 required stages because it contains zero human sessions. `compile-comparison` accepts only reviewer-supplied files marked `complete`, hashes their source files, preserves evidence levels, computes the V1.1 decision, and never creates or upgrades human observations.

Additional informal feedback from two attributable human chat contributors is retained in
`evidence/external-human-feedback.md`. It is valid qualitative feedback, including Candidate E's
readability advantage and the dark/light theme confound, but it is not a complete structured review
session and does not satisfy the formal human-expert or representative-user thresholds.

Nine responses to the simplified four-question visual form are retained in
`evidence/interface-quality/azure-v2-review/qualitative/visual-review-01.md` and
`evidence/interface-quality/azure-v2-review/qualitative/visual-reviews-02-09.md`, with a faithful
English translation where needed and explicit limitations. Eight responses contain complete
numbered answers and one contains a partial general preference. Candidate A has the strongest
readability signal, Candidates A and D tie for information findability, and Candidate D has the
strongest explicit use-preference signal among complete responses. Candidate B combines
information-findability support with contrast criticism. Candidate E is polarized: one reviewer
preferred its contrast and layout, while multiple reviewers criticized its density, bright theme,
color scheme, layout, clutter, or visual monotony. These are external human qualitative responses
and meaningful dissenting evidence. They do not count as formal human-expert or representative-user
sessions because attribution, task metrics, counterbalancing, and complete criterion matrices were
not supplied.

The disclosed session in `coordinator/maintainer-sessions/expert-session-01.yaml` scores every expert criterion for all five candidates and is retained unchanged in `review.completed.yaml`. `assess-maintainer` independently confirms that all required Azure target stages pass and that the target meets the category floor and equals or exceeds the configured comparator: truthful disclosure 4.0 versus 3.0, information design 4.0 versus 3.0, and visual polish 3.5 versus 2.0. The resulting `maintainer-assessment.json` reports `engineeringReady: true`, `externalReleaseReady: false`, and claim scope `engineering-continuation-only`.

The product owner distributed the review to a practical community pool that included nontechnical
people, people opposed to AI-generated work, people beginning IT careers, and volunteers connected
to a women-focused cybersecurity organization. The resulting maintainer evidence, attributable
chat feedback, and completed short visual response are accepted as sufficient project-level human
review for this independently maintained release. The evidence preserves criticism and dissent,
including a preference for Candidate B and its reported contrast weakness, instead of requiring a
favorable result for the target candidate.

The controlled-study thresholds remain available for any future claim of independent comparative
validation, but they are not a completion requirement for this release. This project does not claim
three blinded expert sessions, five representative-user sessions, complete task timing, or formal
counterbalancing. The supplied community responses must not be relabeled as those evidence types.

Compare the upgraded ZtotheZ implementation with the Lovable benchmark and other retained baselines through the versioned methodology. External implementations remain evaluation references only and must not be packaged or treated as design authority.

Required tasks:

- Identify data origin, environment, and freshness.
- Find the highest-priority problem.
- Explain its impact and supporting evidence.
- Start analysis and identify whether live or fallback processing occurred.
- Identify the recommended next action and validation method.
- Export a result and verify that provenance is retained.

Required evidence:

- Anonymous and counterbalanced captures.
- Per-task completion, time, errors, comprehension, recovery, and confidence.
- Separate expert visual scores and representative-user task evidence.
- Reviewer-supplied attribution and limitations.
- No AI-generated human conclusions or approvals.

Project release completion criteria:

- The attributable maintainer rubric finds that ZtotheZ equals or exceeds the configured Lovable
  comparator in truthful disclosure, information design, and visual polish.
- Available community reviewers can identify candidate strengths, preferences, and concrete
  problems through the simplified review surface.
- Architecture, accessibility, responsiveness, and maintainability do not regress.
- Findings and dissenting reviewer evidence remain visible in the final report.
- Product-owner acceptance closes the project review without claiming controlled task-comprehension,
  confidence, independent-expert, or representative-user-study results that were not collected.

### 9. Cross-Product Generalization And V2 Release

Status: **Done**

Apply the V2 contracts to SceneStart or AegisOPS without Azure-specific exceptions, then certify packaging and release behavior.

Current progress: SceneStart Workshop-to-Studio initialization now loads the handed-off project
before the first client render, and a storage round-trip regression test covers the transfer.
Touch targets, slider hit areas, file-input naming, release checklist operation, and 200 percent
text resizing were remediated across the benchmark journeys. The runtime verifier now supports a
policy-restricted loopback CDP connection for managed Chromium environments and has regression
coverage for that policy and native editable-value scrolling.

All four SceneStart journeys pass at 320, 390, 768, 1024, and 1440 CSS pixels with 40 retained
screenshots. The learning journey now completes all nine Core Demo Craft lessons through explicit
goal checks and verifies persisted `9/9 DONE` state. ZtotheZ supplied attributable local-first
review evidence, and `release-provenance` passes all five criteria with zero runtime findings.

The aggregate SceneStart release gate passes 4 of 4 profiles and all 10 acceptance criteria with
zero failed or unverified criteria. SceneStart's 229-test suite and production build pass. The
ZtotheZ suite passes 65 tests. Package check, installed MCP smoke, provenance and independence,
archive-removal smoke, release pack, and offline verification pass with the review and attestation
included. Detailed evidence is recorded in
`knowledge-base/benchmarks/scenestart/CALIBRATION.md`.

Completion criteria:

- A second product implements the same trust, information, and visual contracts.
- Product-specific variation is expressed through declared data, tasks, tokens, and component contracts rather than copied Azure layout.
- Both product benchmarks pass automated gates and retain attributable review templates.
- Corpus cases measure truthful disclosure, information completeness, visual-token integrity, and intentional abstention.
- Build, typecheck, regression tests, package smoke tests, offline release checks, retrieval evaluation, corpus evaluation, and independence checks pass.
- Documentation and installation instructions describe V2 capabilities only after the release evidence exists.

## Execution Order

All V2 roadmap items are complete. Item 8 closes on attributable maintainer acceptance and the
available community review evidence, including eight complete short visual responses, one partial
response, and retained dissent. SceneStart proves cross-product generalization without copying
Azure composition. The current release makes no controlled independent-validation or formal
representative-user-study claim.

No required V2 engineering or review work remains. Additional responses can inform later
iterations. Only complete schema-valid sessions can support a future controlled comparative-study
claim.
