---
name: ztothez-design-engineering
description: Design, implement, audit, or refactor production UI/UX systems with architecture evaluation, semantic design tokens, accessible components, AI workspaces, and operational dashboards. Use when user asks to "design a new dashboard", "generate frontend UI", "create workspace patterns", "build a design system", "review UI architecture", "improve UX", or "standardize design tokens". Apply to Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Codex, Qoder, and Lovable workflows.
---

# ZtotheZ Design Engineering System

Use ZtotheZ Design Engineering to create task-centered interfaces whose visual system, component boundaries, runtime behavior, and evidence are explicit enough to implement and evaluate. Preserve the user's stack, product constraints, and existing design language unless the user requests a redesign.

## Operating Rules

1. Inspect the repository, current UI, framework, routes, shared components, tokens, tests, and build commands before proposing changes.
2. Identify the requested mode: new interface, focused feature, redesign, design-system work, AI workspace, operational dashboard, architecture review, or UX audit.
3. Determine the primary user, their highest-frequency task, data sensitivity, deployment context, supported devices, and consequential actions. Infer only low-risk details; surface assumptions that affect architecture or behavior.
4. Put the working task surface before promotional content. Optimize for clear action, state visibility, recovery, and evidence before decoration.
5. Reuse established project conventions where they are coherent. Introduce a new abstraction only when it removes demonstrated duplication, isolates a likely change, or creates a required variation point.
6. Work iteratively. Implement the smallest coherent slice, verify behavior, and refactor without changing observable behavior before expanding the surface.
7. Never present a mock interaction as implemented. Distinguish verified behavior, proposed behavior, and untested assumptions.

## Knowledge Retrieval Workflow

### Step 1: Search The Approved Scope

Use `search_design_knowledge` when the task needs guidance beyond this skill. Write a specific query containing the design problem, relevant quality attribute, and product context. Restrict `categories` when the task clearly belongs to architecture, Figma and design systems, UX patterns, or usability evaluation.

The search result must include ranked repository-relative source paths, section excerpts, confidence, and matched terms. Treat `SKILL.md` results as authoritative and other indexed files as approved supporting guidance.

### Step 2: Inspect Exact Sources

Read the highest-value result through its category-specific MCP tool before applying detailed rules. Load only the files needed to resolve the task. Do not treat a search excerpt as a complete specification when the surrounding section contains constraints, exceptions, or validation requirements.

### Step 3: Handle No-Match Results

When retrieval returns `no-match`, refine the query or broaden only the approved categories. If no approved source matches, state the knowledge gap and proceed from current product requirements, repository evidence, public standards, or official platform documentation as appropriate. Never fill the gap from legacy archives, ignored local research, or a third-party design product.

Do not let supporting retrieval override current repository behavior, product contracts, user requirements, or this root skill. Cite the repository-relative paths that materially affected a recommendation or implementation.

## Design & Architecture Workflow

### Step 1: Frame The System

Write a compact design brief before implementation:

- Primary user and job to be done.
- Critical path and success condition.
- Core entities, data ownership, and processing boundary.
- Functional requirements and quality attributes.
- Constraints from the current stack, platform, organization, security model, and delivery scope.
- Expected variation points, integrations, and product-family reuse.

Prioritize quality attributes such as usability, accessibility, modifiability, performance, reliability, availability, security, portability, and variability. Make each important attribute measurable rather than using labels such as `fast`, `simple`, or `secure` without criteria.

### Step 2: Select And Document Architecture

Choose architecture from the task shape, not fashion. Multiple styles may coexist when their boundaries are explicit.

- Use layered architecture to separate presentation, application policy, domain behavior, and infrastructure. Lower layers provide services upward; use callbacks or abstractions when a lower layer must signal upward without depending on presentation.
- Use MVC or an equivalent unidirectional state pattern for interactive systems that need multiple views, synchronized state, or replaceable presentation.
- Use pipes and filters for independent, preferably stateless transformation stages such as document or media processing. Define pipe data formats, buffering, cancellation, and error propagation.
- Use client-server when a server owns shared resources, policy, transactions, or security. Account for latency, service failure, and recovery.
- Use message passing when participants are dynamic or independently deployed. Specify message schema, event or command semantics, delivery guarantees, ordering, retries, idempotency, and observability.
- Use microservices only when independent deployment, scaling, ownership, or technology boundaries justify network and operational complexity.
- For reusable product platforms, define shared scope, common requirements, and explicit variation points. Prefer configuration and plugin interfaces over inheritance-heavy white-box frameworks.

Record each consequential decision with context, chosen option, alternatives, rationale, affected quality attributes, constraints, and reversal cost. Describe the architecture through the views needed by stakeholders: logical structure, development/package structure, runtime processes, deployment, and representative scenarios.

### Step 3: Evaluate Architecture With ATAM

Use a lightweight Architecture Tradeoff Analysis Method pass for new systems, shared components, consequential redesigns, or disputed architecture choices.

1. State business drivers, constraints, stakeholders, and the proposed architecture.
2. Build a utility tree from prioritized quality attributes.
3. Express each important scenario as `stimulus -> environment -> response -> measurable result`.
4. Include normal-use, anticipated-change, and stress or exploratory scenarios.
5. Rank scenarios by importance and implementation difficulty using `high`, `medium`, or `low`.
6. Link high-priority scenarios to the decisions that enable them.
7. Record risks, non-risks, sensitivity points, and trade-off points. State assumptions behind every non-risk.
8. Group related risks into risk themes and convert material risks into acceptance criteria or follow-up work.

Do not claim architectural completeness when a quality attribute cannot be evaluated from the documented decisions. Add the missing view, contract, or scenario.

### Step 4: Establish Component Boundaries

Treat a component as an independently understandable unit that exposes services through a well-defined interface and declares its context dependencies.

- Give each component one cohesive responsibility and one primary reason to change.
- Keep domain policy independent of UI frameworks, storage, network clients, analytics, and model providers.
- Define provided and required interfaces, data ownership, input and output types, preconditions, postconditions, errors, async behavior, and accessibility responsibilities.
- Make dependencies visible through parameters, props, context providers, or dependency injection. Avoid hidden globals and imports that bypass ownership boundaries.
- Design client-specific interfaces. Split broad interfaces when consumers depend on methods they do not use.
- Depend on abstractions at volatile boundaries. The policy-owning layer owns the abstraction; implementation details satisfy it.
- Ensure substitutions preserve client expectations. A variant must demand no more and guarantee no less than its contract.
- Keep component APIs stable while permitting internal implementation changes.

Apply package-level cohesion and coupling rules:

- Group code that is reused together, released together, and changed for the same reason.
- Keep package dependencies acyclic. Break cycles with dependency inversion or a new cohesive package.
- Depend toward stability; stable packages should expose abstractions, while volatile leaf packages may remain concrete.
- Treat the dependency graph as a buildability and change-impact map, not merely a feature map.

### Step 5: Detect Design Smells And Choose Patterns

Check every significant design for:

- `Rigidity`: a small change forces many changes.
- `Fragility`: changes break unrelated behavior.
- `Immobility`: useful code cannot be extracted from its context.
- `Viscosity`: shortcuts are easier than the intended extension path.
- `Needless complexity`: abstractions exist for hypothetical needs.
- `Needless repetition`: behavior or token values are copied instead of shared.
- `Opacity`: intent and ownership are hard to understand.

Refactor the smallest boundary that removes the cause. Select a pattern only when its problem and trade-off are present:

- Strategy or Template Method for a real algorithm variation point.
- Command for queued, logged, delayed, or undoable actions.
- Observer for multiple state views or event consumers; document implicit dependencies.
- State for behavior that changes across an explicit state machine.
- Adapter for an incompatible existing or third-party interface.
- Bridge for independently varying abstraction and implementation.
- Decorator for optional runtime responsibilities without expanding a core interface.
- Composite for uniform treatment of items and nested groups.
- Proxy for remote, persistent, permissioned, or otherwise mediated access.
- Factory when construction of volatile implementations must be isolated.
- Visitor only for stable hierarchies that need new operations; use an acyclic variant only when hierarchy growth justifies its complexity.

Do not add factories, services, microservices, or pattern layers preemptively. Favor the simplest design that preserves identified variation points and quality requirements.

### Step 6: Standardize Design Tokens

Create a three-level token architecture and use it throughout the UI:

1. Primitive tokens hold raw values for color, spacing, type, radius, elevation, motion, and breakpoints.
2. Semantic tokens express intent: `background`, `surface`, `surface-elevated`, `foreground`, `muted-foreground`, `border`, `accent`, `success`, `warning`, `info`, `danger`, and `focus`.
3. Component tokens map semantic roles to local parts and states, such as `button-primary-background`, `input-border-error`, or `table-row-selected`.

Requirements:

- Use semantic names in components; never encode personal color names or raw palette values in component code.
- Define default, hover, active, disabled, focus, loading, success, warning, and error states where relevant.
- Use typography by function: body, label, heading, metadata, metric, and monospace for code, IDs, logs, paths, formulas, or model traces.
- Keep focus visible. Pair every status, severity, score, or confidence color with text, an icon, a value, or another non-color cue.
- Keep component dimensions stable across states so loading text, validation, hover, and dynamic values do not shift the layout.
- Map tokens into the project's native mechanism, such as CSS custom properties, theme objects, JSON tokens, or framework configuration. Keep one source of truth.

When no brand palette exists, choose accessible primitives only after semantic roles are defined. When a brand system exists, preserve it and repair contrast or state gaps at the semantic layer.

### Step 7: Design Interaction, State, And Responsiveness

For every task surface, design these states where applicable: empty, loading, success, partial, low-confidence, blocked, error, rate-limited, offline, and permission denied.

- Name primary actions by outcome, such as `Analyze`, `Generate`, `Review`, `Approve`, `Convert`, or `Export`.
- Give inputs visible labels, constraints, inline validation, and a recovery action. Preserve user-entered data across errors, retries, rate limits, and navigation.
- Show immediate feedback within 100 ms after submission. After 300 ms, use a skeleton or staged status for work that remains in progress.
- Keep destructive actions separate from positive primary actions. Confirm consequential or bulk changes and show the affected count.
- Use controls that match the choice: toggles for binary settings, segmented controls for small mode sets, menus for option sets, and sliders only for understandable ranges.
- Make target sizes at least 44 by 44 CSS pixels where practical. Provide visible keyboard focus and respect reduced motion.
- Test at 375, 768, 1024, and 1440 CSS pixels. Avoid competing scroll regions on mobile; use tabs, drawers, or stacked sections.

## AI Workspace Workflow

### Step 1: Choose The Workspace Pattern

- Choose `Structured Analysis` when users provide input, configure scope, inspect findings, compare evidence, or export a report.
- Choose `Conversational Agent` for iterative requests, context updates, tool calls, and approvals.
- Choose `Trust Entry` only when an entry screen is required to explain purpose, processing boundaries, evidence policy, and the route into the real workspace.
- Combine structured controls with chat when the task benefits from both. Do not force forms, evidence, filters, or approvals into chat messages.

### Step 2: Build The Information Architecture

Use this baseline and omit routes the product does not need:

```text
/           entry or direct workspace redirect
/analyze    structured input and result review
/agent      conversational work with context and tool visibility
/history    runs, versions, exports, and approvals
/settings   model, privacy, permission, and retention controls
```

For a structured analysis workspace:

1. Place input or context and configuration before one outcome-named primary action.
2. On desktop, use a 50/50 or 45/55 split when users compare input and output; make the divider resizable when comparison is frequent.
3. On tablet, stack panels and keep the primary action reachable.
4. On mobile, switch between `Input` and `Results` with tabs or a drawer.
5. Order results as summary, findings, recommendation, evidence, then action.
6. Give each finding a severity label, title, category, explanation, evidence, source jump, confidence or limitation, and suggested action.

For a conversational agent workspace:

1. Show relevant context beside chat on desktop and in a drawer, accordion, or tab on mobile.
2. Distinguish user, AI, tool, system, and approval messages.
3. Make tool calls collapsible with tool name, state, and result summary.
4. Provide send, stop or cancel, retry, copy, regenerate, report, and clear controls where relevant.
5. Let users edit drafts or context during long work unless the submitted context must be immutable.

### Step 3: Make AI Work Inspectable

- Show phases such as `Validating`, `Retrieving context`, `Analyzing`, `Generating`, and `Saving` for long operations.
- Expose sources, citations, retrieved context, or evidence for factual claims.
- Mark uncertain, partial, unsupported, and low-confidence output explicitly.
- Separate generated suggestions from human-approved decisions.
- Require confirmation before destructive or consequential AI actions.
- Explain local, private-cloud, and third-party model or data-processing boundaries next to the input surface.
- Use `aria-live="polite"` for async result updates and move focus to the result summary after completion when that improves keyboard flow.
- Provide a tabular alternative for charts and show every score as a numeric or textual value.

## Operational Dashboard Workflow

### Step 1: Establish The Dashboard Shell

Use a restrained, information-dense shell in this order:

1. Header with current context, scope, and primary metric.
2. Cross-tool navigation only when the dashboard belongs to a suite.
3. Summary metrics with labels and time or scope context.
4. Primary workspace: table, queue, tracker, upload surface, or split view.
5. Lifecycle actions such as export, import, backup, migration, reset, or delete when the product owns user data.

Growing datasets require search, filtering, sorting, useful empty states, and pagination or virtualization when warranted. Bulk actions show selection counts and require confirmation when destructive.

### Step 2: Apply The Closest Task Pattern

| Pattern | Required task sequence |
|---|---|
| Document conversion | Processing boundary; drop zone and picker; category or destination; conversion action; preview; copy/download/open; saved destination and overwrite/retention details; recent conversions |
| Media processing | URL or file input; metadata fetch; category and quality preset; preview; active jobs with labeled progress; recent jobs; destination and third-party disclosure |
| Period records | Active period and date; period selector; inflow, outflow, net, completion, and balance metrics; inflow and outflow tables; lifecycle actions |
| Pipeline tracker | Active count and scope; totals by waiting, active, blocked, and completed state; response or conversion rate; tabs, search, and sortable records table; lifecycle actions |
| Repayment tracker | Active period; total, paid, outstanding, and progress metrics; open/completed/all filters; obligations with labeled row progress; lifecycle actions |

Use semantic status treatment consistently: `warning` for waiting or due soon, `info` for active processing or assessment, `success` for completed or resolved, and `danger` for failed, blocked, rejected, or overdue. Text labels are mandatory; tint is supplemental.

### Step 3: Design Data Safety And Recovery

- Explain where data is processed, stored, exported, and retained.
- Show destination and overwrite behavior before conversion or export.
- Preserve filters, edits, selections, and in-progress input after recoverable failures.
- Provide recovery actions for failed, overdue, partial, and interrupted jobs.
- Never imply local-only processing when data leaves the device.

## Heuristic Evaluation Workflow

Use this workflow when the user asks for a UX audit, heuristic analysis, usability review, redesign diagnosis, or release evaluation. Read `knowledge-base/usability-evaluation/HEURISTIC_EVALUATION.md` when method detail or a formal finding record is needed. Use `get_usability_evaluation` to retrieve this category when MCP is available.

1. Define the intended users, critical tasks, context, supported viewports, and states before judging the interface.
2. Run automated checks for facts that code and browser evidence can establish: overflow, clipping, collisions, occlusion, accessible names, focus, runtime failures, network behavior, and journey outcomes.
3. Execute representative tasks and inspect the relevant states against Nielsen's heuristics and domain-specific rules. Record one concrete problem per finding with location, trigger, observation, evidence, user impact, severity, confidence, correction, and validation method.
4. Distinguish evidence levels. Automated checks establish rendered or behavioral facts; expert inspection identifies likely usability risks; representative-user testing validates whether intended users can complete intended tasks. Never claim one evidence type proves another.
5. Prioritize by task consequence, affected users, frequency or reach, and recoverability. Visual prominence alone does not determine severity.
6. Convert major and blocker findings into acceptance criteria and regression journeys. Retest after correction.
7. Escalate unresolved mental-model, terminology, comprehension, or workflow assumptions to representative-user testing. Prefer iterative formative rounds over one final large test.
8. For a formal review, start from `knowledge-base/usability-evaluation/heuristic-review.template.yaml` and preserve the versioned schema. Classify every evidence item as `automated`, `ai-assisted-expert`, `human-expert`, or `representative-user`; human and user evidence must include attributable reviewer-provided metadata.
9. Validate the artifact with `evaluate_heuristic_review` or `npm run review-heuristics -- --review PATH`. Review and merge generated severity 3-4 acceptance candidates into the applicable product contract; the evaluator must not edit contracts automatically.
10. Never treat an AI-assisted review as a human-expert record, representative-user result, risk-acceptance decision, or manual-review attestation. An agent may format evidence supplied by a person but must not invent identity, timestamps, sessions, decisions, or approval.

## Enterprise Readiness

For production or enterprise-facing tools, include these requirements in architecture and UX acceptance criteria:

- Environment-driven configuration with startup validation.
- Authentication for every non-health endpoint outside local development.
- Explicit allowed hosts, security headers, sensitive-response `no-store` caching, and request body limits before expensive processing.
- Request IDs on responses, unauthenticated liveness checks, and metrics where operational visibility is required.
- Visible authentication and workspace or organization context.
- Health, rate-limit, and request-ID information where users need it for recovery or support.
- Documented processing, retention, import, export, backup, migration, and deletion behavior.
- Secrets, certificates, generated histories, exports, caches, seed data, and local state excluded from source control unless intentionally versioned.
- Production startup failure when identity configuration, sufficiently protected secrets, explicit hosts, or documented retention and export locations are missing.

## Compatibility & Output Rules

Generate artifacts that parse consistently in Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Kiro, Codex, Qoder, and Lovable.

1. Use UTF-8 Markdown with one YAML frontmatter block at the top of skill files. Keep `name` lowercase kebab-case and keep `description` a single-line scalar without XML angle brackets.
2. Use standard Markdown headings, lists, tables, and fenced code blocks. Always add a language identifier such as `tsx`, `css`, `json`, `yaml`, `bash`, or `text`.
3. Do not embed platform-specific tool-call syntax, hidden instructions, XML wrappers, editor macros, citations, or chat transcripts in generated source files.
4. When returning multiple files in chat, introduce each with `### relative/path.ext`, then provide exactly one fenced block containing the complete file. Do not place commentary inside code fences.
5. Use repository-relative paths in generated documentation and examples. Never emit machine-specific absolute paths, private product names, secrets, or environment values.
6. Produce complete imports, exports, types, event handlers, states, and accessible labels. Do not use ellipses, pseudo-code, placeholder callbacks, or omitted sections in implementation-ready output.
7. Preserve the repository's framework, package manager, formatter, linter, module system, naming conventions, and supported language level unless migration is requested.
8. Keep domain logic, design tokens, and contracts framework-neutral where practical. Place framework adapters at explicit boundaries.
9. Use stable token identifiers that are valid in CSS custom properties, JSON, JavaScript, TypeScript, and common design-token tools. Provide one canonical token source and generated adapters when multiple formats are required.
10. Make commands non-interactive and portable where practical. Put commands in `bash` fences and state any platform-specific prerequisite outside the command.
11. Keep generated code deterministic and locally runnable. Include or update focused tests and validation commands in proportion to the change.
12. If operating with file-editing tools, edit the repository directly and summarize changed paths and verification. If limited to chat output, use the complete-file convention above.

Do not create separate versions of the product for different AI IDEs. The source artifact is canonical; only invocation or installation instructions may vary by environment.

## Validation And Handoff

Before declaring completion:

1. Trace the primary task from entry through success and recovery.
2. Verify empty, loading, success, partial, error, rate-limit, and permission states that can occur.
3. Verify keyboard navigation, natural focus order, visible and unobscured focus, labels, async announcements, non-color status cues, reduced motion, and text alternatives.
4. Check responsive layouts at 375, 768, 1024, and 1440 CSS pixels. Verify 200% zoom reflow at effective widths down to 320 CSS pixels and 200% text-only resizing, including long labels, dense data, code, and tables.
5. Check minimum text contrast, 24 CSS-pixel target size, and the 44 CSS-pixel touch recommendation. Check that hover, loading, validation, and dynamic content do not shift fixed-format controls, overlap adjacent content, or hide focused controls behind sticky UI.
6. Confirm tokens are semantic, centralized, and consumed by components without stray raw values.
7. Inspect dependency direction, package cycles, component contracts, and ownership of state and side effects.
8. Run the repository's formatter, lint, typecheck, focused tests, and build when available. Report what ran and any residual risk; never imply unrun checks passed.
9. When a matching benchmark product contract exists, validate it with `validate_product_contract` before implementation and use its actors, modes, states, sources of truth, acceptance criteria, and journey profiles as the task model. Current product requirements and working behavior override archived examples. CLI fallback: `npm run validate-contract -- --contract PATH` from the ZtotheZ Design Engineering project.
10. When `audit_repository_architecture` is available, run it before handoff. Treat error findings as blockers and review every warning against product context. The static audit does not replace browser, interaction, accessibility, or responsive verification. If MCP is unavailable in this repository, use `npm run audit -- --repo PATH` from the ZtotheZ Design Engineering project.
11. When the application can run, use `verify_ui_runtime` against the local URL with representative product journeys. Inspect its screenshots and evidence for contrast, target size, focus, keyboard flow, reflow, text resizing, motion, collision, media, console, and network findings. Treat runtime errors as blockers and resolve or explicitly justify warnings. If MCP is unavailable, run `npm run verify-ui -- --url URL` from the ZtotheZ Design Engineering project. Runtime automation supplements, but does not replace, human review of content hierarchy, task fit, and visual quality.
12. When `run_design_quality_gate` is available, prefer it for final handoff because it consolidates contract, architecture, runtime, and profile-scoped acceptance evidence under one failure policy. Every blocker criterion must pass; `UNVERIFIED` is not success. The target application must already be running. CLI fallback: `npm run quality-gate -- --contract PATH --repo PATH --url URL --profile ID`. Never report a skipped runtime stage as a passing gate, and never invent or self-author a manual-review attestation.
13. Run every profile required by the contract in its declared service environment, preserving a separate evidence directory for each. Controlled offline profiles may declare expected network failures only with narrow method, URL, status, and occurrence bounds; an unobserved expectation is a failure, not permission to suppress errors. Aggregate profile reports with `aggregate_design_quality_gates` or `npm run aggregate-gates -- --contract PATH --reports DIR,DIR`. Release only when the aggregate report is complete and passing.

## Examples

### Example 1: Design A New Dashboard

User trigger: `Design a new pipeline dashboard for reviewing applications.`

Action sequence:

1. Inspect the stack and existing shell, then identify reviewer tasks, record states, privacy constraints, and common lookup behavior.
2. Frame measurable usability, accessibility, modifiability, and performance scenarios.
3. Select the operational pipeline pattern and document state ownership plus client-server boundaries.
4. Define primitive, semantic, and component tokens; map waiting, active, blocked, and completed statuses to text plus icon treatments.
5. Build the header, metrics, filters, search, sortable records table, row actions, and export/import/backup controls.
6. Implement empty, loading, partial, error, permission, and destructive-confirmation states.
7. Validate dependency direction, keyboard table use, responsive behavior at four target widths, tests, and build.

### Example 2: Generate An AI Analysis Workspace

User trigger: `Generate frontend UI for an AI document analysis workspace with evidence.`

Action sequence:

1. Identify practitioner and reviewer flows, processing boundary, evidence source, retention policy, and consequential actions.
2. Choose the structured analysis pattern with a 45/55 desktop split and `Input` and `Results` mobile tabs.
3. Define contracts between input, job orchestration, result state, findings, evidence, and export modules.
4. Implement input validation, configuration, one `Analyze` action, immediate feedback, staged progress, and preserved input.
5. Render summary, filterable findings, recommendations, evidence, confidence or limitations, and next actions.
6. Add async announcements, focus transfer, source jumps, retry, copy, export, and human approval where required.
7. Exercise ATAM scenarios for rate limits, partial retrieval, provider failure, large input, and a change of model provider; then run project checks.

### Example 3: Refactor A Design System

User trigger: `Standardize design tokens and fix tightly coupled components in this UI.`

Action sequence:

1. Inventory raw values, duplicate styles, component variants, cross-package imports, state ownership, and change hotspots.
2. Classify smells such as needless repetition, rigidity, fragility, and opacity; identify the smallest boundaries that cause them.
3. Introduce primitive, semantic, and component tokens, then migrate shared components before feature surfaces.
4. Split mixed responsibilities, replace hidden dependencies with explicit contracts, and break cycles with dependency inversion or a cohesive package.
5. Preserve public behavior and visual intent while adding missing focus, disabled, loading, validation, and status states.
6. Verify no unresolved raw values remain outside the canonical token source, run visual and interaction checks, then run lint, tests, and build.

## Troubleshooting

| Problem | Diagnosis | Resolution |
|---|---|---|
| Missing or inconsistent tokens | Components contain raw colors, spacing, radii, or one-off status styles | Create primitive, semantic, and component layers; migrate shared components first; search for remaining raw values and document intentional exceptions |
| Bad component coupling | A visual component imports storage, networking, model clients, or unrelated feature state | Move policy and effects behind a client-owned interface; inject data and actions; keep the visual component responsible for rendering and local interaction |
| Circular package dependencies | Features import each other or a shared package imports a consumer | Map the dependency graph; move the stable contract to the policy owner or a new cohesive package; invert the volatile implementation dependency |
| Fat component API | Consumers receive many props or methods they never use | Split by client role and reason for change; expose focused interfaces and compose behavior at a higher boundary |
| Fragile variants | A subtype disables inherited behavior, throws unexpectedly, or requires stricter inputs | Restore substitutability, extract a valid common contract, or replace inheritance with composition and explicit strategies |
| Premature abstraction | Factories, services, or framework layers exist for a single stable implementation | Remove the unused indirection; reintroduce an abstraction only at a demonstrated variation or testing boundary |
| Unclear architecture choice | The team prefers a style but cannot connect it to requirements | Create measurable scenarios, compare options by quality attributes, and record risks, sensitivity points, trade-offs, and reversal cost |
| Opaque AI output | Results lack evidence, confidence, source context, or a clear next action | Reorder as summary, findings, recommendation, evidence, action; mark limitations and require review for consequential use |
| Frozen long-running UI | Submit gives no immediate response or blocks unrelated work | Show feedback within 100 ms, staged status after 300 ms, cancellation and retry, and keep editable work available unless immutability is required |
| Lost user input | Validation, rate limits, navigation, or service errors clear the form | Store drafts separately from request state; preserve input and configuration; explain cause, recovery, and preservation status |
| Color-only status | Severity, confidence, or progress is understandable only from hue | Add readable labels, icons or patterns, numeric values, and assistive-technology text; keep color supplemental |
| Dashboard cannot scale | A growing table lacks search, filters, sorting, empty states, or bulk feedback | Add controls based on lookup behavior, selection counts, pagination or virtualization, and explicit loading and empty states |
| Mobile scroll conflict | Split panes or nested tables create competing scroll regions | Replace simultaneous panes with tabs, drawers, or stacking; keep the primary action reachable and retest at 375 CSS pixels |
| Unsafe destructive action | Delete, reset, approval, or bulk mutation resembles a primary action | Separate it visually and structurally, show impact and selection count, require confirmation, and provide recovery copy where possible |
| Production trust gap | Users cannot tell auth context, processing location, retention, health, or failure identity | Surface workspace and auth context, processing boundaries, retention, status, rate-limit details, and request ID near the relevant workflow |
