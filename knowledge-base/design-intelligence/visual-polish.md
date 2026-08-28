# Visual Polish System

Use this module when an implemented interface must feel intentional, balanced, legible, domain-appropriate, and ready for rendered review. Declare `interface-system` in a version `2.0` design-deliverable manifest and complete the visual-polish sections before implementation is called visually complete.

Visual polish is not decoration. It is the consistent control of hierarchy, typography, density, alignment, state language, chart communication, motion, and responsive composition around the product task.

## Evidence Boundary

Keep these outcomes separate:

1. `passed`: the manifest is structurally valid and its declared references are consistent.
2. `renderedEvidenceReady`: verified screenshots and runtime reports exist at every required viewport.
3. `humanReviewReady`: attributable reviewer-supplied evidence covers hierarchy, balance, scanability, density, and domain fit.
4. `releaseReady`: all three conditions are satisfied.

`planned` and `captured` evidence is not verified evidence. An agent must not mark a human review complete or create reviewer identities, observations, or approval records.

## Step 1: Choose A Domain Direction

Define the domain, visual intent, three to eight principles, prohibited treatments, and semantic token references. The direction must make the primary task easier to scan and trust.

For operational products, favor calm surfaces, explicit state labels, compact evidence, stable geometry, and high information contrast. For creative products, expression may be stronger, but interaction state and content hierarchy must remain readable.

Reject these default generator patterns unless a real product requirement establishes meaning:

- Decorative agent or node diagrams.
- Excessive glow around controls, cards, or status indicators.
- Gradients that do not encode a value, brand transition, or spatial function.
- Pulsing dots, shields, rings, or ornaments presented as operational proof.
- Repeated floating cards used as page sections.
- Oversized headings inside compact tools or dashboards.
- A one-hue palette that erases hierarchy between surfaces, actions, evidence, and states.

## Step 2: Bind Visual Usage To Semantic Tokens

Keep three token responsibilities:

- `primitive`: raw values such as colors, dimensions, font families, weights, durations, numbers, and shadows.
- `semantic`: product meaning such as primary text, raised surface, selected border, compact row height, or feedback duration.
- `component`: a stable component decision that references a semantic or primitive token where the design-system architecture requires it.

Visual-direction, typography, composition, density, states, motion, and chart contracts must reference semantic or component tokens. Never bind component usage directly to primitives. Repository audits must also reject repeated raw colors and visual values outside identifiable token-definition files.

## Step 3: Define Typography Roles

Declare all eight roles with family, size, weight, line-height, color, and usage:

1. `body`
2. `label`
3. `heading`
4. `metadata`
5. `metric`
6. `evidence`
7. `log`
8. `code`

Use at least 16 CSS pixels for body text unless a tested platform convention requires otherwise. Keep ordinary reading lines between 45 and 90 characters. Use tabular numerals for changing operational metrics and aligned comparisons.

Do not create hierarchy by font size alone. Combine role, weight, surface, spacing, and position. Keep metadata quieter than evidence and evidence quieter than the primary task outcome without reducing essential text below readable contrast or size.

## Step 4: Build Composition And Rhythm

Declare grids at 375, 768, 1024, and 1440 CSS pixels. For each viewport, specify columns, gutter, margin, and composition behavior. Responsive changes may alter geometry but must preserve semantic order and task continuity.

Define:

- Fluid, bounded, or hybrid content width with a maximum.
- A base spacing token and four or more allowed spacing steps.
- Alignment rules for headings, labels, values, controls, tables, and evidence.
- Stable dimensions for boards, rows, toolbars, media, charts, and controls whose content or state changes could shift layout.
- Canvas, subtle, raised, overlay, and inverse surfaces as needed.
- Default, strong, focus, and selected borders.
- Base, raised, and overlay elevation roles.
- Primary, secondary, tertiary, and muted emphasis.
- A selected state with background, border, visible indicator, and a non-color cue.

Use elevation to explain stacking or interaction, not to make every region float. Use borders to establish grouping and selected state, not to outline every element equally.

## Step 5: Choose Density Deliberately

Select `comfortable`, `compact`, `dense`, or `adaptive` from task frequency, data volume, pointer precision, and reading burden. Declare control height, row heights, spacing tokens, and no more than three simultaneous primary actions.

For each required viewport, state the density mode and visible priorities. On small screens, preserve the primary outcome, critical exceptions, and next action before telemetry or history. Do not solve crowding only by shrinking text.

## Step 6: Unify Interaction States

Define one visual language for:

```text
loading empty success warning error partial disabled selected focus
```

Each state needs behavior and semantic token bindings. Warning, error, partial, and selected states require text or a semantic icon in addition to color. Loading must preserve stable geometry. Empty states must explain scope and recovery. Partial and stale content must remain distinguishable from success. Disabled controls must remain legible and explain unavailable actions where necessary. Focus must remain visible against adjacent surfaces.

## Step 7: Constrain Motion

Use motion only to explain state change, continuity, feedback, progress, or spatial relationship. Define semantic duration categories:

- `instant`: 0 to 100 milliseconds.
- `feedback`: 100 to 220 milliseconds.
- `transition`: 150 to 350 milliseconds.
- `emphasis`: 200 to 500 milliseconds.

Declare the trigger, animated property, duration category, purpose, and whether each motion is interruptible. Every motion requires a reduced-motion equivalent that removes, replaces, or shortens movement while preserving state meaning. Avoid continuous ornamental movement and motion that delays task completion.

## Step 8: Design Charts As Decision Surfaces

For every chart, declare purpose, source metric identifiers, title and value visibility, label strategy, legend behavior, comparison context, accessible table or text alternative, loading, empty, partial, and error states, semantic tokens, and non-color cues.

Remove decorative charts. Prefer direct labels when they reduce lookup cost. Use tables when exact comparison is the task. Do not rely on hover for values, on color alone for series, or on a trend without baseline and period context.

## Step 9: Capture Required Viewports

Create one stable fixture or product journey and capture 375, 768, 1024, and 1440 CSS pixel evidence. A verified capture records:

- Screenshot path.
- Runtime report path.
- SHA-256 checksum of the screenshot.
- Exact viewport.

Use `planned` before capture, `captured` when files exist but have not been reviewed against the report, and `verified` only after evidence integrity and expected composition are checked. Browser verification must still inspect clipping, overlap, contrast, focus, target size, keyboard behavior, reflow, text resize, and reduced motion.

## Step 10: Require Attributable Human Review

Rendered human review must evaluate:

- Hierarchy.
- Balance.
- Scanability.
- Density.
- Domain fit.

Record reviewer-supplied name, role, offset timestamp, and an evidence reference whose kind is `review`. Preserve dissent and unresolved findings. Automated checks and AI-assisted critique may prepare the packet but cannot satisfy this gate.

## Validation

Validate the manifest:

```bash
npm run validate-design -- --manifest PATH
```

Or use MCP tool `validate_design_deliverable`.

Read `visualPolish.releaseReady` separately from `passed`. A structurally passing manifest with planned screenshots or required human review remains not ready for visual release.
