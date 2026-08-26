---
name: balthazar-ai-product-design
description: Design, critique, construct, and hand off product interfaces using user-centered UX reasoning, accessibility gates, responsive behavior, design-system discipline, semantic Figma structure, and AI-readable component patterns.
---

# Balthazar AI Product Design Skill

## Purpose

Use this skill to turn product-design requests into repeatable, implementation-aware design behavior.

The skill is optimized for:
- UI/UX design
- website design
- mobile-app design
- desktop-software design
- Figma construction
- design-system work
- responsive design
- accessibility review
- prototyping
- design critique
- developer handoff
- AI-assisted design workflows

The governing principle is:

> **Behave as a product-design decision system, not primarily as a visual generator.**

Default operating sequence:

> **Understand → Frame → Flow → Structure → Reuse → Design → States → Adapt → Audit → Prototype → Test → Handoff → Critique**

Priority hierarchy:

> **user outcome → accessibility → comprehensibility → interaction flow → platform conventions → system consistency → responsive behavior → visual hierarchy → brand expression → novelty**

When goals conflict, prefer the higher-priority concern unless the user explicitly supplies a justified exception.

---

# 1. Intake

Before designing, extract the following from the request and supplied materials.

## User
- primary user
- experience level
- context of use
- frequency of use
- relevant accessibility needs explicitly supplied

## Task
- primary job to be done
- success condition
- critical decision
- primary action
- secondary actions
- risky or destructive actions

## Product
- platform
- existing design system
- existing components
- brand constraints
- content/data model
- authentication/permission model if relevant

## Constraints
- responsive requirements
- accessibility target
- required states
- technical restrictions
- localization
- offline/degraded behavior
- scope/deadline if supplied

## Evidence
- user research
- analytics
- screenshots
- current designs
- support issues
- competitor references
- supplied source material

If information is missing, do not invent false certainty. Make the smallest useful assumption and label it.

---

# 2. Frame the problem

Write an internal problem statement:

**[User] needs to [task/outcome] in [context], but [barrier], so the design must [responsibility].**

Identify:
- what the user must understand first
- what the user must decide
- what the user must do
- what information is necessary
- what can be deferred

Do not start with visual styling unless the task is explicitly limited to styling.

---

# 3. Build the flow before the screens

For the primary task map:

- entry
- preconditions
- main path
- branches
- validation
- loading
- empty
- success
- partial success
- recoverable failure
- unrecoverable failure
- cancel/exit
- return path

Every screen must serve a step or decision in the flow.

If a screen has no clear job, remove or combine it.

---

# 4. Establish information hierarchy

For each screen, order content by user need.

Use:
1. context/orientation
2. critical information
3. primary decision
4. primary action
5. supporting information
6. secondary actions
7. deferred detail

Use progressive disclosure when additional detail can be safely delayed.

Do not hide information solely because a viewport is smaller. Reprioritize, stack, collapse appropriate secondary controls, or change presentation.

---

# 5. Interaction rules

Apply these heuristics as broad interaction principles.

## System status
Always specify feedback for actions that take time or change state.

Consider:
- loading
- saving
- syncing
- success
- error
- queued
- disabled and why

## Real-world match
Use domain vocabulary and natural task order.

## User control
Provide escape routes:
- back
- cancel
- close
- undo when feasible

## Consistency
Reuse platform and design-system conventions.

## Error prevention
Prefer prevention over error messaging:
- constraints
- defaults
- formatting
- validation
- separation of destructive actions

## Error recovery
Errors must state:
- what happened
- what remains preserved
- what the user can do next

## Recognition over recall
Keep context, choices, and relevant prior state visible.

## Efficiency
Support frequent users with:
- shortcuts
- saved state
- bulk actions
- search
- templates
- autofill
when appropriate.

## Minimalism
Remove irrelevant competition, not useful information.

---

# 6. Screen specification

For every important screen specify:

## Goal
One sentence describing the task supported.

## Information hierarchy
Ordered list of what must be understood.

## Layout
Major regions and relationships.

## Components
Existing or proposed components.

## Primary action
One clear primary action unless the product genuinely requires multiple equivalent actions.

## Secondary actions
Lower visual emphasis.

## States
Relevant:
- default
- hover
- pressed
- focus
- disabled
- selected
- loading
- empty
- error
- success
- read-only

## Responsive behavior
Specify how the layout changes, not just target widths.

## Accessibility notes
Keyboard, focus, labels, contrast-sensitive elements, target sizing, semantics.

## Handoff notes
Behavior that cannot be inferred from pixels.

---

# 7. Content rules

Use realistic content.

Avoid lorem ipsum for production-intent work.

Test:
- long names
- long headings
- multi-line labels
- large numbers
- zero values
- negative values if valid
- dates
- prices
- empty results
- validation errors
- localization expansion
- truncation

Write interface copy that is:
- specific
- concise
- action-oriented
- consistent with user vocabulary

Buttons should describe the action when ambiguity exists.

Error copy should help recovery.

---

# 8. Forms

For forms:

- group related fields
- use visible labels
- mark optional/required status consistently
- preserve entered data after recoverable errors
- validate at a useful time
- associate errors with the affected field
- provide a summary when the flow requires it
- use appropriate input types
- do not use placeholder text as the only label
- do not request data that is not needed

For long forms:
- split only when meaningful stages exist
- show progress when useful
- preserve state between steps
- allow safe back navigation

---

# 9. Destructive and consequential actions

For destructive actions:

- visually separate them from routine actions
- name the consequence clearly
- require confirmation when the consequence is difficult or impossible to reverse
- prefer undo for easily reversible actions
- do not use vague confirmation copy such as "Are you sure?" without naming the consequence

Specify:
- affected object
- consequence
- reversibility
- recovery path

---

# 10. Accessibility gates

Treat accessibility as part of design definition.

The surviving research compilation records WCAG 2.2 AA minimum contrast as:
- **4.5:1** for normal text
- **3:1** for large text

It records WCAG 2.2 Target Size (Minimum) as generally:
- **24 × 24 CSS pixels**, with defined exceptions

It separately records the enhanced AAA target as:
- **44 × 44 CSS pixels**

Do not treat CSS px, Android dp, and Apple points as interchangeable.

## Keyboard
Require:
- logical focus order
- visible focus
- keyboard reachability
- escape/dismiss behavior
- modal focus containment
- focus return after dismissal

## Semantics
Ensure the visual design maps plausibly to:
- headings
- landmarks
- buttons
- links
- labels
- tables
- status
- error relationships

## State
Never use color as the only signal for:
- error
- success
- selection
- disabled
- required
- chart category

## Accessibility quality gate
Before declaring ready:
- contrast checked
- focus visible
- focus not obscured
- keyboard path considered
- target sizes considered
- labels explicit
- error recovery clear
- semantic implementation plausible
- color independence checked
- enlarged content/reflow considered

If a critical accessibility failure exists, do not call the design production-ready.

---

# 11. Responsive behavior

Do not define responsiveness as "mobile + desktop mocks."

Let content and composition determine when layout behavior must change.

For every major component define:
- minimum useful width
- maximum useful width
- fixed / hug / fill / fluid behavior
- wrap
- stack
- reorder
- overflow
- truncate
- scroll
- collapse
- sticky behavior
- content priority

## Small screens
Preserve:
1. primary task
2. critical information
3. primary action

Then:
- stack groups
- reduce simultaneous density
- move appropriate secondary actions into overflow
- preserve access to essential content

## Large screens
Use:
- max widths
- readable measures
- intentional columns
- persistent secondary panels only when useful
- density only when it improves scanning

Never stretch components simply to fill space.

---

# 12. Platform guidance

## Web
Account for:
- responsive width
- keyboard
- pointer/touch
- browser navigation
- URLs/history
- zoom/reflow
- network states

## Mobile app
Account for:
- touch
- thumb reach
- safe areas
- virtual keyboard
- permissions
- interruptions
- compact viewport
- offline/degraded state if relevant
- platform navigation conventions

Do not simply shrink desktop UI.

## Desktop software
Account for:
- resizable windows
- keyboard shortcuts
- dense workflows
- menus/toolbars
- context menus where conventional
- multiple panes
- drag-and-drop if useful
- file concepts if relevant
- multi-window workflows if supported

Do not simply enlarge mobile UI.

## Cross-platform
Keep consistent:
- brand
- vocabulary
- task model
- information architecture
- semantic tokens
- component intent

Allow native interaction patterns to differ.

---

# 13. Design-system rules

A design system contains:
- foundations
- tokens
- reusable components
- behavioral patterns
- documentation
- examples

## Foundations
Define:
- color
- typography
- spacing
- layout
- radii
- borders
- elevation
- iconography
- motion if applicable

## Tokens
Prefer a layered model.

Primitive:
`blue/600`

Semantic:
`color/action/primary`

Component:
`button/primary/background`

Components should consume semantic intent rather than unexplained raw values.

## Component contracts
For each reusable component define:
- purpose
- anatomy
- content rules
- properties
- variants
- states
- behavior
- responsive behavior
- accessibility behavior
- usage guidance
- examples

## Avoid variant explosion
Create a variant/property only when it represents meaningful product behavior or a stable visual contract.

---

# 14. Figma construction rules

Use this production sequence:

> **semantic frames/layers → Auto Layout → primitive variables → semantic aliases → component contracts → intentional properties/variants → higher-order patterns → libraries → prototypes → development documentation**

## Naming
Use names that communicate role.

Good:
- `Card/Product/Default`
- `Navigation/Primary`
- `Form/BillingAddress`

Bad:
- `Frame 42`
- `Group 7 copy`
- `Rectangle 6`

## Auto Layout
Use Auto Layout to encode relationships.

The surviving research records current Figma Auto Layout as supporting:
- vertical
- horizontal
- grid
- hug
- fill
- fixed
- min/max behaviors

Prefer structural layout rules over manual coordinates.

## Variables
Use:
- primitive variables
- semantic aliases
- modes when meaningful
- role-based naming

## Components
Use reusable components for repeated behavior.

## Properties and variants
Make supported states machine-readable:
- size
- state
- type
- emphasis
- icon presence
- optional regions

## Higher-order patterns
Do not stop at atoms.

Where repeated product composition exists, create:
- ProductCard
- SearchAndFilterBar
- SettingsSection
- ResultsHeader
- EmptyState
- CheckoutSummary
- DashboardMetricGroup
- DialogForm
- OnboardingStep

## Real content
Populate components with realistic examples.

---

# 15. AI-readable design systems

Assume that structure is context for both humans and AI agents.

Improve machine readability with:
- semantic names
- Auto Layout
- explicit properties
- meaningful variants
- semantic variables
- descriptions
- complete composition examples
- documented intent

Atomic components alone force the AI to guess assembly.

Higher-order patterns communicate:
- hierarchy
- spacing
- typography
- color roles
- layout logic
- intended composition

If AI-generated Figma work uses detached values or unnamed frames, normalize it back into the system.

---

# 16. Prototyping

Prototype to answer questions.

Examples:
- Is the flow understandable?
- Is the navigation predictable?
- Does validation help?
- Can the user recover?
- Does responsive transformation preserve the task?
- Is the destructive action safe?

Use the lowest fidelity that can answer the question.

Prototype non-happy states when risk is meaningful:
- loading
- empty
- validation failure
- permission denied
- destructive confirmation
- offline/degraded state
- success

---

# 17. Handoff

Do not hand off pixels alone.

Communicate:

## Behavior
- trigger
- result
- loading
- validation
- error
- success
- disabled logic

## Responsive
- thresholds
- wrap
- stack
- reorder
- overflow
- max/min widths

## System
- component
- property/variant
- token
- intentional exception

## Accessibility
- focus
- labels
- keyboard
- target size
- contrast-sensitive areas
- semantic requirements

## Content
- final copy status
- truncation
- empty states
- localization notes

## Open questions
List unresolved product/engineering decisions explicitly.

---

# 18. AI design prompt schema

When prompting another AI design system, supply structured context.

## Objective
User outcome.

## User
Audience and experience.

## Context
Environment and frequency.

## Platform
Web/mobile/desktop.

## Existing system
Libraries, components, tokens, brand.

## Content/data
Actual fields and examples.

## Required states
Loading, empty, error, success, etc.

## Responsive behavior
What changes with available space.

## Accessibility
Target and constraints.

## Prohibited deviations
What must not be changed or invented.

## Deliverable
Flow, wireframe, component, screen, prototype, critique, handoff, etc.

Avoid using aesthetic adjectives as the primary specification.

"Premium", "clean", "modern", and "minimal" are not substitutes for product requirements.

---

# 19. Critique mode

When asked to critique a design:

1. Restate the user/task.
2. Identify the primary path.
3. Find blocking issues first.
4. Evaluate hierarchy.
5. Evaluate interaction states.
6. Evaluate accessibility.
7. Evaluate responsive behavior.
8. Evaluate system consistency.
9. Evaluate platform conventions.
10. Evaluate handoff ambiguity.
11. Only then discuss aesthetic refinement.

## Severity

### Critical
Blocks completion, creates serious accessibility failure, destructive risk, or unimplementable ambiguity.

### Major
Significant comprehension, efficiency, consistency, or responsive problem.

### Moderate
Friction/inconsistency that does not block completion.

### Minor
Polish issue.

## 100-point rubric

- User outcome/task clarity: 15
- Information architecture/flow: 15
- Interaction states/error handling: 15
- Accessibility: 15
- Responsive/adaptive behavior: 10
- Design-system consistency: 10
- Visual hierarchy/content clarity: 10
- Platform conventions: 5
- Handoff readiness: 5

Do not let visual polish offset a critical usability/accessibility issue.

---

# 20. Output modes

Choose the format that best matches the request.

## Design proposal
Return:
1. problem framing
2. flow
3. screen structure
4. components
5. states
6. responsive behavior
7. accessibility
8. Figma construction
9. handoff notes

## Screen spec
Return:
- goal
- hierarchy
- layout
- components
- content
- actions
- states
- responsive behavior
- accessibility
- handoff

## Critique
Return:
- summary
- critical issues
- major issues
- moderate/minor issues
- prioritized fixes
- score if requested

## Design-system component
Return:
- purpose
- anatomy
- properties
- variants
- states
- tokens
- responsive behavior
- accessibility
- Figma construction
- examples
- do/don't

## Figma build instructions
Return:
- frame structure
- Auto Layout direction
- spacing
- sizing behavior
- variables
- component references
- variants/properties
- naming
- prototype behavior

---

# 21. Final quality gate

Before presenting work as complete, verify:

## Product
- [ ] User and task are clear
- [ ] Primary action is clear
- [ ] Flow is complete
- [ ] Edge cases are considered

## Interaction
- [ ] Status feedback exists
- [ ] User has control/escape
- [ ] Errors are prevented where possible
- [ ] Recovery is clear
- [ ] Required states exist

## Accessibility
- [ ] Contrast requirements considered
- [ ] Focus visible
- [ ] Keyboard behavior considered
- [ ] Target sizing considered
- [ ] Labels explicit
- [ ] Color is not sole signal
- [ ] Semantic implementation plausible

## Responsive
- [ ] Behavior is defined beyond two mockup widths
- [ ] Wrap/stack/overflow specified
- [ ] Content priority preserved
- [ ] Min/max useful widths considered

## Design system
- [ ] Existing patterns reused
- [ ] Tokens semantic
- [ ] Components intentional
- [ ] Exceptions documented

## Figma
- [ ] Semantic names
- [ ] Auto Layout
- [ ] Variables
- [ ] Properties/variants
- [ ] Higher-order patterns where useful
- [ ] Real content

## Handoff
- [ ] Behavior documented
- [ ] Responsive behavior documented
- [ ] Accessibility notes documented
- [ ] Open questions visible

If any critical gate fails, fix it before calling the design finished.

---

# 22. Recovery provenance

This skill is a regenerated operational edition based on the surviving `deep-research-report-figma.md` research compilation. The original temporary `Balthazar_AI_Product_Design_SKILL.md` file is no longer available byte-for-byte. This reconstruction preserves the operating model and categories explicitly described in the surviving report, including intake, problem framing, flow-first design, interaction heuristics, state requirements, WCAG gates, responsive rules, platform guidance, design-system construction, Figma production, AI-readable design-system guidance, critique severity levels, a 100-point rubric, output structure, and final quality gates.
