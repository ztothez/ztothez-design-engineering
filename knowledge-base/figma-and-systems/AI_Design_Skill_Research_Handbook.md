# AI Design Skill Research Handbook
## Regenerated edition

> **Recovery note.** This file is a faithful reconstruction created from the surviving `deep-research-report-figma.md` compilation. The original generated handbook was stored in temporary sandbox storage and is no longer recoverable byte-for-byte. This edition preserves the research conclusions, operating model, accessibility thresholds, Figma guidance, and AI-design implications documented in the surviving compilation, while rebuilding the missing long-form structure.

---

## Contents

1. Executive summary
2. The governing model: design as a decision system
3. Problem framing and discovery
4. Information architecture and user flows
5. Interaction design and usability heuristics
6. Visual hierarchy and interface composition
7. Accessibility as a design gate
8. Responsive and adaptive design
9. Platform-aware product design
10. Design systems and component architecture
11. Figma production model
12. Prototyping and behavioral specification
13. Developer handoff
14. AI-readable design systems
15. Prompting AI for design work
16. Design critique and evaluation
17. End-to-end operating workflows
18. Quality gates and checklists
19. Recovery provenance and source notes

---

# 1. Executive summary

The central conclusion of the surviving research is simple but consequential:

**An effective AI design system should behave as a product-design decision system, not primarily as a visual generator.**

The system should first understand the user, task, context, constraints, and desired outcome. It should then structure the flow, organize information, reuse established patterns, specify interaction states, adapt the result to the target platform and viewport, audit accessibility, and only then increase visual fidelity.

The durable operating sequence is:

> **Understand → Frame → Flow → Structure → Reuse → Design → States → Adapt → Audit → Prototype → Test → Handoff → Critique**

This sequence combines the recurring priorities documented in the surviving research compilation: user-centered discovery, classical usability heuristics, current Figma UI principles, design-system discipline, responsive behavior, accessibility standards, platform conventions, and modern Figma production practices.

A practical priority hierarchy follows:

**user outcome → accessibility → comprehensibility → interaction flow → platform conventions → system consistency → responsive behavior → visual hierarchy → brand expression → novelty**

This hierarchy is a synthesis rather than an official industry ranking. Its purpose is operational: when two design goals conflict, it tells an AI which goal should normally win.

---

# 2. The governing model: design as a decision system

A visual generator can make attractive screens while still producing a weak product. A product-design decision system reasons about why the screen exists, what the user must accomplish, what information is required, what can go wrong, and how the interface behaves when the ideal path is not available.

The system therefore treats every interface as a set of linked decisions:

- Who is the user?
- What are they trying to accomplish?
- What is the primary task?
- What information do they need before acting?
- What action is primary?
- Which actions are secondary, reversible, destructive, or risky?
- What happens before, during, and after each action?
- What changes on small screens?
- What changes with keyboard, pointer, touch, assistive technology, or reduced space?
- Which design-system primitives and patterns already solve the problem?
- What must developers know to implement the intended behavior?

A design is considered complete only when it communicates these decisions—not when it merely looks polished.

## 2.1 The default order of operations

When asked to design an interface, work in this order:

1. Clarify the product outcome.
2. Identify the user and core task.
3. Extract requirements and constraints.
4. Map the flow.
5. Establish information hierarchy.
6. Select or define reusable patterns.
7. Specify states and edge cases.
8. Define responsive/adaptive behavior.
9. Apply visual hierarchy and brand expression.
10. Audit accessibility.
11. Prototype critical behavior.
12. Prepare handoff information.
13. Critique the result against the original outcome.

Skipping directly to visual styling is an exception, not the default.

---

# 3. Problem framing and discovery

The surviving research connects the design process to user-centered discovery models such as the Design Council's Double Diamond and GOV.UK guidance. Operationally, the important distinction is between understanding a problem and producing a solution.

## 3.1 Minimum design brief

Before designing, establish as many of these fields as the task permits:

### User
- Primary user or audience
- Experience level
- Accessibility considerations that materially affect the task
- Environment of use
- Frequency of use

### Task
- Primary job to be done
- User's success condition
- Most important decision
- Critical information required to make that decision
- Secondary actions

### Product
- Platform: web, mobile, desktop software, embedded, kiosk, other
- Existing design system
- Existing components or patterns
- Brand constraints
- Content model
- Data availability

### Constraints
- Required states
- Regulatory or accessibility target
- Responsive requirements
- Technical limitations
- Localization expectations
- Authentication/permissions
- Offline or degraded-network behavior
- Deadline or scope constraints

### Evidence
- Research supplied by the user
- Existing analytics
- Support issues
- Competitor/reference products
- Known usability problems
- Existing screenshots or prototypes

When a field is unknown, do not silently invent precision. Use a reasonable assumption and label it.

## 3.2 Problem statement

A useful problem statement contains:

**[User] needs to [task/outcome] in [context], but [barrier], so the design must [design responsibility].**

Example:

> A returning project manager needs to identify overdue work during a short daily review, but the current dashboard gives equal visual weight to all tasks, so the design must make exceptions and urgency immediately scannable without hiding normal work.

This framing is more useful to design than a purely stylistic request such as "make the dashboard modern."

---

# 4. Information architecture and user flows

Good interface structure reduces the amount of interpretation demanded from the user.

## 4.1 Flow before screens

Map the task before drawing high-fidelity screens.

For each flow, identify:

- Entry point
- Preconditions
- Main path
- Branches
- Validation
- Empty states
- Loading states
- Success
- Partial success
- Recoverable failure
- Unrecoverable failure
- Cancellation or exit
- Return path

A screen should exist because it serves a step in a flow, not because a product category conventionally has that screen.

## 4.2 Information hierarchy

For each screen, determine:

1. What must the user understand first?
2. What must they decide?
3. What must they do?
4. What supporting information may be consulted?
5. What information can be deferred?

Use progressive disclosure where detail can be safely delayed. Do not hide information merely because space is constrained; responsive design should prioritize and restructure content rather than automatically delete it.

## 4.3 Navigation

Choose navigation based on information architecture and frequency, not visual trend.

Questions to test:

- Can the user tell where they are?
- Can they predict where a navigation choice leads?
- Is the current location visible?
- Are high-frequency destinations easier to access?
- Are labels based on user vocabulary?
- Does small-screen navigation preserve essential destinations?
- Is there a clear way back or out?

---

# 5. Interaction design and usability heuristics

The surviving research uses Nielsen's usability heuristics as broad interaction principles. They are not narrow stylistic rules.

## 5.1 Visibility of system status

The interface should communicate what is happening.

Specify:
- loading
- progress
- saving
- syncing
- success
- failure
- queued work
- disabled states and reasons
- optimistic updates where appropriate

Avoid actions that appear to do nothing.

## 5.2 Match between system and real-world mental models

Use concepts, labels, units, and ordering that match how users think about the task.

Prefer:
- recognizable domain terms
- natural sequence
- familiar grouping
- expected control behavior

Avoid internal engineering terminology unless the users themselves use it.

## 5.3 User control and freedom

Provide:
- cancel
- back
- undo when feasible
- non-destructive escape routes
- clear close/dismiss behavior
- confirmation for consequential actions where appropriate

Do not trap users in modal or multi-step flows without an exit path.

## 5.4 Consistency and standards

Reuse:
- component behavior
- icon meaning
- placement conventions
- terminology
- keyboard behavior
- spacing rhythm
- status patterns

Novel behavior creates a learning tax. Spend that tax only when the benefit is material.

## 5.5 Error prevention and recovery

Prevent predictable errors before submission.

Use:
- constraints
- sensible defaults
- input formatting
- inline validation
- destructive-action separation
- confirmation for irreversible effects
- clear error copy with a recovery path

Error messages should explain what happened, what the user can do, and what remains preserved.

## 5.6 Recognition rather than recall

Keep choices, context, and prior state visible where useful.

Prefer:
- visible labels
- recent items
- contextual actions
- previews
- persistent selection
- inline help

Avoid making users memorize arbitrary values across steps.

## 5.7 Efficiency

Support both first-time and experienced users.

Possible mechanisms:
- shortcuts
- saved defaults
- bulk actions
- recent items
- command palettes
- search
- templates
- autofill

Efficiency features should not obscure the primary path.

## 5.8 Minimalism

Minimalism means removing irrelevant competition, not removing useful information.

A screen is minimal when each element has a job and priority is clear.

---

# 6. Visual hierarchy and interface composition

The surviving research emphasizes hierarchy, progressive disclosure, consistency, contrast, accessibility, proximity, and alignment.

## 6.1 Hierarchy

Establish hierarchy with:
- typography
- size
- weight
- spacing
- position
- grouping
- contrast
- containment
- repetition

Do not rely on color alone to communicate priority or state.

## 6.2 Typography

Typography should communicate structure before personality.

Define:
- display
- heading levels
- body
- labels
- captions
- data/numeric styles if required
- code/monospace use if required

Test real content, including long headings, translated strings, dense data, and error messages.

## 6.3 Spacing

Spacing is semantic. It signals relationships.

Use smaller gaps within a group and larger gaps between groups. A tokenized spacing system makes this relationship consistent and easier for both humans and AI systems to interpret.

## 6.4 Color

Use semantic roles rather than raw values in product reasoning.

Examples:
- `color/text/primary`
- `color/text/secondary`
- `color/surface/default`
- `color/surface/elevated`
- `color/action/primary`
- `color/status/success`
- `color/status/warning`
- `color/status/danger`
- `color/border/subtle`

Semantic naming helps themes, modes, refactoring, handoff, and AI interpretation.

## 6.5 Content realism

Avoid lorem ipsum in production-intent design.

Use realistic:
- names
- dates
- prices
- table values
- validation messages
- empty states
- long strings
- truncation cases
- localization stress cases

The layout should be tested by content, not protected from it.

---

# 7. Accessibility as a design gate

The surviving research explicitly treats accessibility as a hard gate rather than a final polish pass.

## 7.1 Contrast thresholds documented in the research

The surviving compilation records WCAG 2.2 AA thresholds of:

- **4.5:1** minimum contrast for normal text
- **3:1** minimum contrast for large text

The design should not use low-contrast aesthetics to override these requirements.

## 7.2 Target size documented in the research

The compilation records WCAG 2.2 Target Size (Minimum) as generally using:

- **24 × 24 CSS pixels**, subject to defined exceptions

It separately notes the enhanced AAA target:

- **44 × 44 CSS pixels**

Do not treat CSS pixels, Android dp, and Apple points as interchangeable units.

## 7.3 Keyboard and focus

Specify:
- logical focus order
- visible focus indication
- keyboard reachability
- escape behavior
- modal focus containment
- return focus after dismissal
- skip or bypass mechanisms where necessary

The compilation also notes WCAG 2.2's AA Focus Not Obscured requirement.

## 7.4 Semantics

A visual design should imply an implementable semantic structure.

Consider:
- heading hierarchy
- landmarks
- button versus link behavior
- labels
- form relationships
- table semantics
- status announcements
- error association
- accessible names for icon-only controls

## 7.5 Color and state

Never make color the only signal for:
- errors
- success
- selection
- disabled state
- required fields
- chart categories

Combine color with text, iconography, shape, placement, or another perceivable cue.

## 7.6 Motion

Where motion is non-essential:
- keep it restrained
- avoid making understanding depend on animation
- provide reduced-motion behavior where implementation requires it

## 7.7 Accessibility review gate

Before marking a design ready:

- Check contrast
- Check focus visibility
- Check keyboard path
- Check target sizing
- Check labels
- Check error identification
- Check zoom/reflow implications
- Check screen-reader semantics implied by the structure
- Check color independence
- Check state communication
- Check content at enlarged text sizes

---

# 8. Responsive and adaptive design

The surviving research rejects the common pattern of creating one 375-pixel mobile screen and one 1440-pixel desktop screen and labeling the result responsive.

Responsive design is a set of behaviors.

## 8.1 Content-driven breakpoints

The surviving compilation notes web.dev guidance to let content determine breakpoints rather than relying only on device categories.

A breakpoint is justified when the composition stops working well, for example:
- navigation no longer fits
- columns become too narrow
- actions collide
- text becomes unreadable
- dense data needs a different presentation
- a sidebar competes with the main task

## 8.2 Define behavior per component

For each component specify:

- minimum useful width
- maximum useful width
- fixed, fluid, hug, or fill behavior
- wrapping
- stacking
- reordering
- overflow
- truncation
- scrolling
- collapsing
- sticky behavior
- content priority
- touch/pointer implications

## 8.3 Small-screen strategy

On smaller screens:

1. Preserve the primary task.
2. Preserve critical information.
3. Reflow groups.
4. Stack where necessary.
5. Reduce simultaneous density.
6. Move secondary actions into appropriate overflow patterns.
7. Avoid hiding content merely because the viewport is smaller.

## 8.4 Large-screen strategy

Do not stretch every component infinitely.

Use:
- readable text measures
- max widths
- intentional multi-column layouts
- persistent secondary panels only when useful
- denser information where it improves scanning rather than merely filling space

---

# 9. Platform-aware product design

The surviving research references Microsoft Fluent's emphasis on adapting naturally to the platform instead of imposing one visual treatment everywhere.

## 9.1 Web

Account for:
- responsive widths
- keyboard
- pointer and touch
- browser conventions
- URLs and navigation history
- reflow
- zoom
- variable content
- network states

## 9.2 Mobile apps

Account for:
- thumb reach
- platform navigation conventions
- safe areas
- touch targets
- virtual keyboard
- permissions
- offline/degraded states
- interruptions
- compact viewport
- orientation if relevant

Do not simply shrink a desktop interface.

## 9.3 Desktop software

Account for:
- window resizing
- dense workflows
- keyboard shortcuts
- menus
- context menus where conventional
- multiple panes
- persistent toolbars
- drag-and-drop if appropriate
- file-system concepts where relevant
- multi-window workflows if supported

Do not simply enlarge a mobile interface.

## 9.4 Cross-platform consistency

Consistency should live at the level of:
- brand
- vocabulary
- task model
- information architecture
- semantic tokens
- core component intent

Platform-native behavior may legitimately differ.

---

# 10. Design systems and component architecture

The surviving research describes a design system as more than a component library. It includes reusable UI components, tokens, behavioral patterns, and documentation.

## 10.1 Foundations

Define:
- color
- typography
- spacing
- layout/grid
- radii
- borders
- elevation
- iconography
- motion if applicable

Prefer semantic tokens over raw-value usage in product components.

## 10.2 Token model

A robust token model often separates primitives and semantics.

Primitive:
- `blue/600`
- `gray/100`
- `space/200`

Semantic alias:
- `color/action/primary`
- `color/text/muted`
- `space/component/gap`

Component-level usage:
- `button/primary/background`
- `input/error/border`

This creates a hierarchy from raw value to meaning to component implementation.

## 10.3 Component contracts

Every reusable component should define:

- purpose
- anatomy
- content rules
- properties
- variants
- states
- interaction behavior
- responsive behavior
- accessibility behavior
- do/don't guidance
- examples

## 10.4 State completeness

For relevant components consider:
- default
- hover
- pressed
- focus
- disabled
- selected
- loading
- error
- success
- read-only
- empty

Do not multiply variants merely because the design tool makes variants easy. Each variant should represent a meaningful contract.

## 10.5 Higher-order patterns

The surviving research identifies higher-order compositions as especially important for AI context.

Examples:
- `ProductCard`
- `SearchAndFilterBar`
- `SettingsSection`
- `ResultsHeader`
- `EmptyState`
- `CheckoutSummary`
- `DashboardMetricGroup`
- `DialogForm`
- `OnboardingStep`

These patterns encode relationships that atomic controls alone do not communicate.

---

# 11. Figma production model

The surviving research modernized older Figma learning material around current capabilities.

The production model is:

> **semantic frames and layers → Auto Layout → primitive variables → semantic aliases → component contracts → intentional properties/variants → higher-order patterns → libraries → prototypes → ready-for-development documentation**

## 11.1 Semantic structure

Name frames and layers by role.

Prefer:
- `Checkout/Summary`
- `Card/Product/Default`
- `Navigation/Primary`
- `Form/BillingAddress`

Avoid:
- `Frame 42`
- `Group 17 copy`
- `Rectangle 6`

Semantic names improve human navigation, developer comprehension, and AI interpretation.

## 11.2 Auto Layout

The surviving compilation records current Figma Auto Layout as supporting:
- vertical flow
- horizontal flow
- grid flow
- hug
- fill
- fixed sizing
- minimum and maximum sizing behaviors

Use Auto Layout to encode relationships rather than manually placing objects whenever the composition is structurally responsive.

## 11.3 Variables

Use variables for:
- color
- spacing
- typography-related values where supported by the system
- radii
- sizing values where appropriate
- modes such as light/dark or density where relevant

Use aliases so components reference semantic intent rather than raw primitives.

## 11.4 Components and variants

The surviving compilation describes current Figma guidance as treating components as reusable elements and variants as organized versions around properties such as size, state, or type.

Use component properties intentionally:
- size
- state
- emphasis
- icon presence
- leading/trailing content
- optional sub-elements

Avoid variant explosions. Prefer composable properties over every possible Cartesian combination.

## 11.5 Libraries

A shared library should contain:
- foundations
- variables
- components
- patterns
- documentation
- examples

Treat the library as an evolving product, not a completed file.

---

# 12. Prototyping and behavioral specification

A prototype is useful when it answers a question.

## 12.1 Prototype questions

Examples:
- Can users understand the navigation?
- Is the multi-step flow clear?
- Does the filter behavior make sense?
- Is the destructive action sufficiently guarded?
- Does the responsive transformation preserve the task?
- Can the user recover from a failure?
- Is the onboarding sequence comprehensible?

## 12.2 Prototype fidelity

Use the lowest fidelity capable of answering the question.

Low fidelity:
- information order
- flow
- basic interaction model

Medium fidelity:
- component behavior
- states
- navigation
- content

High fidelity:
- motion
- final visual hierarchy
- implementation-sensitive behavior

## 12.3 State prototypes

Prototype more than the happy path where risk is meaningful.

Include:
- validation failure
- loading
- empty
- permission denied
- destructive confirmation
- saved state
- offline/degraded behavior if relevant

---

# 13. Developer handoff

The surviving research updates handoff around the modern Figma Dev Mode model and emphasizes that handoff is not merely pixel inspection.

A ready-for-development design communicates:

- behavior
- states
- responsive rules
- tokens
- components
- accessibility
- content
- unresolved questions

## 13.1 Handoff checklist

For each feature provide:

### Structure
- screen/frame names
- component names
- intended hierarchy

### Behavior
- triggers
- transitions
- validation
- success
- error
- loading
- disabled logic

### Responsive
- breakpoints or content thresholds
- stacking
- wrapping
- overflow
- order changes
- max/min widths

### System
- component references
- token references
- variants/properties
- exceptions

### Accessibility
- focus behavior
- labels
- keyboard interactions
- target sizes
- contrast-sensitive elements
- announcements if required

### Content
- final copy status
- truncation
- localization considerations
- empty-state content

### Open questions
- unresolved product choices
- engineering dependencies
- analytics requirements
- edge cases awaiting decision

---

# 14. AI-readable design systems

A major finding in the surviving research is:

**Good design-system structure is also AI context.**

The compilation reports current Figma guidance that agents interpret systems more accurately when teams provide:

- reusable blocks and patterns
- meaningful layer and component names
- Auto Layout
- explicit component properties and variants
- variables for color, spacing, and typography
- descriptions for components, styles, and variables
- higher-order compositions

## 14.1 Why atomic components are insufficient

An AI given only:
- Button
- Input
- Icon
- Avatar
- Divider

must infer how those pieces should form a product pattern.

An AI given:
- ProductCard
- SearchAndFilterBar
- SettingsSection
- ResultsHeader
- EmptyState
- CheckoutSummary

receives encoded layout, spacing, hierarchy, and behavioral intent.

## 14.2 Machine-readable intent

Improve AI interpretation through:

### Semantic names
`Card/Product/Default` communicates more than `Frame 42 copy`.

### Auto Layout
Communicates intended resizing and content relationships.

### Properties
Communicate supported sizes, states, toggles, and optional regions.

### Semantic variables
`color/brand/primary` communicates role rather than unexplained color.

### Documentation
Explains when visually similar patterns have different purposes.

### Examples
Show complete, correct compositions rather than requiring the AI to infer all assembly rules.

---

# 15. Prompting AI for design work

The surviving compilation characterizes generative design as probabilistic and argues that structured inputs and constraints reduce ambiguity.

Replace:

> Make a premium modern dashboard.

With a brief containing:

- user
- task
- platform
- existing system
- content/data
- required states
- accessibility target
- responsive behavior
- prohibited deviations
- output expectation

## 15.1 Prompt schema

Use this structure:

### Objective
What user outcome should the design enable?

### User
Who is performing the task?

### Context
Where and how is the interface used?

### Platform
Web, mobile, desktop, or other.

### Existing system
Components, tokens, patterns, brand rules.

### Required content
Real fields, data, labels, messages.

### Required states
Loading, empty, error, success, disabled, etc.

### Responsive behavior
What must transform as space changes?

### Accessibility
Target standard and known requirements.

### Constraints
What must not change or be invented?

### Deliverable
Flow, wireframe, high-fidelity design, component set, critique, handoff spec, etc.

## 15.2 Prompting principle

Ask the model to reason in terms of **intent and constraints**, not aesthetic adjectives alone.

Aesthetic direction is valid, but it should sit after product requirements.

---

# 16. Design critique and evaluation

Critique should measure whether the interface solves the product problem.

## 16.1 Severity levels

### Critical
Blocks task completion, causes serious accessibility failure, creates destructive risk, or makes implementation intent ambiguous.

### Major
Significantly reduces comprehension, efficiency, responsiveness, consistency, or usability.

### Moderate
Creates friction or inconsistency but does not prevent task completion.

### Minor
Polish issue with limited product impact.

## 16.2 100-point evaluation rubric

This rubric is a proposed operational synthesis.

| Dimension | Points |
|---|---:|
| User outcome and task clarity | 15 |
| Information architecture and flow | 15 |
| Interaction states and error handling | 15 |
| Accessibility | 15 |
| Responsive/adaptive behavior | 10 |
| Design-system consistency | 10 |
| Visual hierarchy and content clarity | 10 |
| Platform conventions | 5 |
| Handoff readiness | 5 |
| **Total** | **100** |

### Interpretation
- 90–100: production-ready direction, pending normal implementation validation
- 80–89: strong, with targeted revisions
- 70–79: usable concept but material gaps remain
- 60–69: significant redesign required
- below 60: core product/design problem is unresolved

Do not allow visual polish to compensate for critical usability or accessibility failures.

---

# 17. End-to-end operating workflows

## 17.1 New feature design

1. Read requirements and source material.
2. State the user and outcome.
3. List assumptions.
4. Map the flow.
5. Identify information hierarchy.
6. Inventory existing patterns.
7. Define screen structure.
8. Define states.
9. Define responsive behavior.
10. Apply system tokens/components.
11. Apply visual hierarchy.
12. Audit accessibility.
13. Prototype risky interactions.
14. Prepare handoff.
15. Critique against the outcome.

## 17.2 Existing screen redesign

1. Identify current task and pain point.
2. Preserve behavior that already works.
3. List observed or supplied failures.
4. Separate structural problems from visual problems.
5. Fix hierarchy and flow before styling.
6. Reuse system patterns.
7. Add missing states.
8. Validate responsive behavior.
9. Audit accessibility.
10. Compare old and new against the same task.

## 17.3 Design-system component creation

1. Define purpose.
2. Gather real product examples.
3. Identify common anatomy.
4. Define content rules.
5. Define properties.
6. Define states.
7. Define responsive behavior.
8. Define accessibility behavior.
9. Map tokens.
10. Build with Auto Layout.
11. Add semantic naming.
12. Document usage.
13. Add complete composition examples.
14. Test with real content.
15. Publish/update library.

## 17.4 AI-assisted Figma workflow

1. Supply structured brief.
2. Point the AI toward existing library patterns.
3. Require semantic components and Auto Layout.
4. Require variables/tokens instead of detached raw styling.
5. Require realistic content.
6. Require edge states.
7. Require responsive behavior.
8. Review component choices.
9. Review accessibility.
10. Normalize generated work back into the system.
11. Document intentional exceptions.

---

# 18. Quality gates and checklists

## 18.1 Before visual design

- [ ] User identified
- [ ] Primary task identified
- [ ] Success condition identified
- [ ] Required content identified
- [ ] Platform identified
- [ ] Constraints identified
- [ ] Flow mapped
- [ ] Existing system reviewed

## 18.2 Before high fidelity

- [ ] Information hierarchy works
- [ ] Primary action is clear
- [ ] Secondary actions are appropriately weighted
- [ ] Required states are listed
- [ ] Error paths are defined
- [ ] Responsive transformations are known
- [ ] Existing patterns are reused where appropriate

## 18.3 Accessibility gate

- [ ] Normal text contrast reaches the documented AA threshold
- [ ] Large text contrast reaches the documented AA threshold
- [ ] Target size requirements have been considered
- [ ] Keyboard focus is visible
- [ ] Focus will not be obscured
- [ ] Labels are explicit
- [ ] Color is not the only state signal
- [ ] Error recovery is understandable
- [ ] Semantic implementation is plausible
- [ ] Enlarged content/reflow has been considered

## 18.4 Responsive gate

- [ ] Breakpoints respond to content needs
- [ ] Component min/max widths are considered
- [ ] Wrapping is specified
- [ ] Stacking is specified
- [ ] Overflow is specified
- [ ] Content priority is specified
- [ ] Small-screen design preserves the primary task
- [ ] Large-screen design does not stretch without purpose

## 18.5 Figma construction gate

- [ ] Layers are semantically named
- [ ] Auto Layout encodes intended structure
- [ ] Variables are used where appropriate
- [ ] Semantic aliases are preferred
- [ ] Components have intentional properties
- [ ] Variants map to meaningful states/types
- [ ] Higher-order patterns exist where reuse justifies them
- [ ] Real content is used
- [ ] Library exceptions are documented

## 18.6 Handoff gate

- [ ] Behavior specified
- [ ] States specified
- [ ] Responsive behavior specified
- [ ] Tokens/components referenced
- [ ] Accessibility requirements captured
- [ ] Final copy status captured
- [ ] Open questions captured
- [ ] Critical prototype links or annotations included

---

# 19. Recovery provenance and source notes

This regenerated handbook is based on the surviving research compilation that accompanied the original generated artifacts. The compilation states that the original handbook was approximately 91 KB of Markdown and the operational skill approximately 18 KB. Those exact temporary files are no longer available, so this handbook should be treated as a **reconstructed edition**, not a byte-identical recovery.

The surviving compilation records research touching:

- Design Council Double Diamond
- GOV.UK user-centered design guidance
- Nielsen usability heuristics
- Figma UI principles
- Figma design systems
- current Figma Auto Layout
- Figma variables, modes, aliases, components, and variants
- Figma Dev Mode
- WCAG 2.2
- web.dev responsive design guidance
- Microsoft Fluent
- Figma AI guidance and custom skills
- Agent Skills Markdown structure
- Fabio Staiano's Figma curriculum and later edition updates

Where this regenerated edition gives exact accessibility thresholds or describes specific Figma capabilities, it follows the claims preserved in the surviving compilation. The full original research citations were represented in the compilation by internal citation identifiers from the earlier research session; those identifiers are archival and may not resolve outside that session.

---

# Appendix A — Surviving research compilation

The complete surviving research compilation is bundled alongside this regenerated handbook in the recovery ZIP. It remains the provenance record for this reconstruction.

# Appendix B — Durable design model

> **Understand → Frame → Flow → Structure → Reuse → Design → States → Adapt → Audit → Prototype → Test → Handoff → Critique**

Use this sequence as the default operating model for AI-assisted product design.
