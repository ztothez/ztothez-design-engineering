# Master Digital Product UIX Architecture Handbook

## Deliverable

The deep-research synthesis has been compiled into the requested Markdown artifact:

**[Download `Master_Digital_Product_UIX_Architecture_Handbook.md`](sandbox:/mnt/data/Master_Digital_Product_UIX_Architecture_Handbook.md)**

The current artifact is approximately **60.4 KB of Markdown** and is structured as a principal-level architecture handbook rather than a collection of visual-design tips. It covers the operating model for Product Design, UX/Research, UI, Design Systems, and UX Engineering; enterprise SaaS architecture; responsive web systems; iOS/iPadOS; Android/Material 3; desktop software; WCAG 2.2; defensive UX; performance; DTCG design tokens; Figma variables/components; and design-to-code architecture.

The research also builds on the earlier UI/UX/Figma investigation you supplied, especially its conclusion that a capable design agent needs explicit user intent, information structure, component contracts, semantic tokens, states, accessibility requirements, responsive behavior, and edge cases rather than merely more visual-style vocabulary. fileciteturn2file0

## Principal research findings

The strongest cross-disciplinary conclusion is that mature digital product design should be modeled as:

> **Understand → Frame → Measure → Flow → Structure → Reuse → Design → Specify states → Adapt → Audit → Prototype → Test → Implement → Observe → Learn → Iterate**

That structure is consistent with the Design Council’s divergent/convergent Double Diamond, GOV.UK’s practice of continuing user research through discovery, alpha, beta, and live operation, and Google’s HEART framework for connecting product goals to user-centered signals and metrics. citeturn15search2turn15search3turn15search1

Accordingly, the handbook treats the principal disciplines as overlapping but separately accountable. **Product Designers** own end-to-end outcome and behavior coherence; **UX Designers/Information Architects** own task structure, findability, mental-model alignment, and cognitive load; **UX Researchers** own evidence quality; **UI Designers** own perceptual hierarchy and interaction presentation; **Design Systems Designers/Engineers** own reusable semantics, contracts, governance, and adoption; and **UX Engineers/Web Design Engineers** own the executable bridge between Figma intent and production behavior. This is a multidisciplinary model rather than a serial “design → handoff → development” model, consistent with GOV.UK’s guidance on multidisciplinary digital-service teams. citeturn15search15turn15search6

The handbook therefore includes an organizational relationship model, lifecycle exit criteria, opportunity-brief and decision-record templates, a HEART-oriented measurement architecture, a federated design-system organizational model, and a hiring matrix spanning research, information architecture, visual design, accessibility, Figma architecture, tokens, component APIs, React, responsive CSS, Storybook, AST/static analysis, performance, governance, and migration.

## Platform and system architecture

For **enterprise web and B2B SaaS**, the research treats tables, filtering systems, saved views, batch actions, pagination, split panes, wizards, and operational dashboards as interaction systems rather than isolated widgets. Shopify’s current Index Table model combines search/filtering, sorting, selection, bulk operations, and pagination, while Carbon similarly documents table-level toolbars, sorting, selection/batch behavior, and pagination as coordinated behaviors. citeturn19search0turn19search1turn19search15

The handbook consequently specifies a production data-table contract covering stable row identity, sorting, filter state, search scope, cross-page selection semantics, loading, empty versus no-results states, errors, permissions, density, responsive behavior, virtualization, accessibility, and localization. This is important because “make the table responsive” is not a sufficient specification for high-density enterprise software.

For **responsive web design**, the requested `375 / 768 / 1024 / 1440+` widths are retained as **QA checkpoints rather than universal breakpoints**. The architectural preference is intrinsic sizing and component-local adaptation, with CSS Container Queries used when behavior should depend on allocated component width instead of global viewport width. Container Queries are defined in CSS Containment Level 3, and current Tailwind responsive tooling exposes container-query variants directly. citeturn1search1turn12search12

For **iOS and iPadOS**, the handbook distinguishes safe-area layout, hierarchical navigation, peer-level tabs, sheets, iPad sidebars/split views, Dynamic Type, SF Symbols, and semantic haptic feedback. Apple’s guidance recommends hit targets around **44 × 44 points** as a general interface-design target, and its accessibility guidance emphasizes larger text and Dynamic Type rather than fixed-height layouts that clip scaled text. citeturn16search1turn16search0turn16search13

A particularly important correction is that “44px” should **not** be turned into a cross-platform accessibility law. Web CSS pixels, Apple points, and Android density-independent pixels are separate systems. Apple’s current accessibility material itself distinguishes common/default target geometry from smaller minimum cases, so the handbook uses 44pt as a high-quality Apple interaction default rather than claiming that every Apple control is normatively required to be exactly 44pt. citeturn16search13

For **Android**, the handbook incorporates Material 3 semantic color roles, Dynamic Color, tonal elevation, adaptive navigation, list-detail/supporting-pane composition, and current window-size classes. Current Android documentation places width-class lower bounds at **600dp, 840dp, 1200dp, and 1600dp** for Medium, Expanded, Large, and Extra Large respectively, while Google’s adaptive-app guidance emphasizes adapting to the current app window rather than assuming a device category. citeturn17search5turn18search2turn18search0

Material 3 also treats color through semantic role pairs and supports Android 12+ Dynamic Color; tonal surface treatment is a meaningful part of Material 3 elevation rather than relying exclusively on conventional drop shadows. citeturn17search0

For **desktop software**, the architecture explicitly adds resizing, persistent windows, menus, toolbars, sidebars, precision input, keyboard shortcuts, context menus, multiwindow ownership, drag-and-drop alternatives, and dense selection models. That prevents the common mistake of stretching a touch-first mobile composition across desktop-sized windows.

## Accessibility and runtime quality gates

The handbook turns accessibility into a **release gate**, not a post-design audit.

For WCAG 2.2, the researched thresholds include:

| Requirement | Target |
|---|---:|
| Normal text, AA | **4.5:1** |
| Qualifying large text, AA | **3:1** |
| Necessary UI/graphical contrast, AA | **3:1** |
| Normal text, AAA | **7:1** |
| Qualifying large text, AAA | **4.5:1** |
| Target Size Minimum, AA | **24 × 24 CSS px**, or compliant spacing/exception |
| Target Size Enhanced, AAA | **44 × 44 CSS px** |
| Apple general interface target | **44 × 44 pt** |
| Android touch target | **48 × 48dp** |

These values and their exceptions come from WCAG 2.2 and the associated W3C Understanding material rather than from generic UI-design conventions. citeturn0search6turn0search3turn17search1

The handbook also elevates keyboard focus into layout architecture. WCAG 2.2’s **Focus Not Obscured (Minimum)** is an AA concern, so sticky headers, persistent toolbars, bottom action bars, drawers, banners, and overlays must be tested against keyboard focus—not merely checked visually at rest. **Focus Appearance** is the corresponding enhanced AAA criterion. citeturn0search0turn0search5

Its component-state architecture is intentionally broader than the usual `default / hover / disabled` trio:

```text
Default
Hover
Active / Pressed
Focus-visible
Selected
Disabled
Read-only
Loading / Pending
Skeleton
Error
Success
Empty
No results
Partial data
Stale data
Permission denied
```

The handbook explicitly treats `hover ≠ focus`, `focus ≠ selected`, `disabled ≠ read-only`, and `empty ≠ no results` as architecture rules.

Defensive UX includes input retention after recoverable failures, field-associated error messages, authoritative server validation, stale/concurrent-edit handling, proportional destructive-action safeguards, and explicit async behavior. The requested `<100ms / 100–300ms / >300ms` response bands are deliberately presented as **product engineering targets, not fabricated WCAG requirements**.

The performance section uses current Core Web Vitals as runtime UX gates: **LCP ≤2.5 seconds, INP ≤200ms, and CLS ≤0.1**, evaluated at the 75th percentile in field data. citeturn1search2

Automated testing is treated as layered evidence rather than proof of accessibility. Storybook supports component interaction and accessibility testing through its testing architecture and axe integration; Pa11y CI provides route-oriented automated accessibility checks; axe-core supplies the underlying automated rules engine used in many environments; and jest-axe itself cautions that passing automated tests does not guarantee accessibility. citeturn12search0turn12search3turn13search0turn13search8turn14search1

## Design systems, tokens, Figma, and design-to-code

The recommended design-system hierarchy is:

```text
Foundations
→ Primitive tokens
→ Semantic tokens
→ Component tokens
→ Primitive controls
→ Composite components
→ Workflow patterns
→ Templates / layouts
→ Product assemblies
→ Platform adapters
```

Atomic Design remains useful for its atoms → molecules → organisms → templates → pages composition model, but the handbook extends it with token semantics, API contracts, state behavior, accessibility guarantees, platform mapping, release/version policy, and production implementation. citeturn15search0

The token model uses:

```text
Primitive
color.blue.600

        ↓ aliases

Semantic
color.action.primary.background

        ↓ component specialization

Component
button.primary.background.default

        ↓ platform generation

CSS / Swift / Kotlin / Figma
```

The research is aligned to the **DTCG 2025.10 stable format**, including `$value`, `$type`, semantic aliases, JSON Pointer `$ref`, deprecation metadata, group behavior, and circular-reference validation. The handbook also makes the standards-status distinction explicit: the Design Tokens Community Group operates under W3C’s Community Group mechanism, but its format report is not itself a W3C Recommendation. citeturn11search0turn11search1

Figma architecture is modeled as:

```text
00_Primitives
    ↓ aliases
10_Semantic
    ↓
20_Component
    ↓
Component properties + slots
    ↓
Higher-order patterns
    ↓
Code Connect / production components
```

Current Figma documentation supports component properties for dimensions such as state, type, and size; slots provide controlled flexible content regions; variables support modes and aliases; and Code Connect maps design-system components and their properties to real production implementations. citeturn20search0turn20search1turn20search8turn20search6

That design-to-code bridge is not limited to React. Current Code Connect documentation covers production mappings across React/React Native, HTML/Web Components-oriented implementations, SwiftUI, and Jetpack Compose, while Dev Mode can attach development resources such as Storybook, GitHub, and Jira. citeturn20search6turn20search5turn21search0

The handbook also establishes a key principle for AI-assisted design: **higher-order patterns carry more useful product intent than a library containing only isolated atomic controls**. A production system should therefore include compositions such as `SearchAndFilterBar`, `DataTableToolbar`, `BulkActionBar`, `DialogForm`, `ListDetailWorkspace`, `SettingsSection`, `DashboardMetricGroup`, `EmptyState`, `ErrorState`, and `PermissionGate`, not only Buttons and Inputs. That extends the central finding of the earlier Figma research. fileciteturn2file0

## Research basis and current limitation

The research prioritized W3C/WCAG, the Design Tokens Community Group, Apple, Android/Material, Figma, React, Tailwind CSS, Storybook, ESLint, Deque axe-core, Pa11y, Design Council, GOV.UK, Google Research, and the primary documentation or repositories of major design-system ecosystems such as Fluent, Atlassian, Shopify, Carbon, Figma Code Connect, and Android’s Now in Android exemplar. Relevant modern implementation patterns—including AST-based design-system enforcement—are supported by ESLint’s custom-rule architecture and by Atlassian’s real-world design-system ESLint policy package. citeturn14search0turn19search16

The downloadable Markdown currently contains the completed research through the **Design-system and Figma architecture** portion, including the executive summary, discipline framework, role/KPI/hiring matrices, Mermaid organizational diagrams, web/SaaS architecture, responsive systems, iOS, Android, desktop, accessibility gates, state matrices, defensive UX, performance budgets, token architecture, DTCG examples, CSS Custom Properties, Tailwind patterns, Figma token/component architecture, and design-to-code guidance.

Because the generation environment reached its finalization boundary while compiling the artifact, the planned dedicated **frontend implementation appendix**—the longer Storybook configuration, `jest-axe`, Pa11y, custom ESLint AST rule, complete CI/CD pipeline examples—and the **full source-ledger appendix** were not appended to the Markdown file. The research behind those areas is reflected above, but I am not labeling the current file as containing sections that are not actually present.

**[Download the current `Master_Digital_Product_UIX_Architecture_Handbook.md`](sandbox:/mnt/data/Master_Digital_Product_UIX_Architecture_Handbook.md)**