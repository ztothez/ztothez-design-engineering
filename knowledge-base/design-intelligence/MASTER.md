# Design Intelligence Router

Use this maintained module set when a request extends beyond product UI into brand identity, Figma libraries, generated or sourced assets, icon systems, presentations, licensing records, or visual-accessibility review. Keep the root `SKILL.md` authoritative and load only the modules required by the deliverables.

## Required Workflow

1. Define the product task, audience, channels, constraints, and required deliverables before selecting a visual direction.
2. Inspect the existing brand, tokens, components, assets, rights records, and implementation stack. Preserve coherent systems unless redesign is requested.
3. Create a `design-deliverable.yaml` from `design-deliverable.template.yaml` and declare only deliverables in scope.
4. Build primitive, semantic, and component token layers before applying visual values to components or assets.
5. Route to the smallest relevant modules below.
6. Record source and rights evidence for every distributable asset. Keep unresolved assets out of production output.
7. Run `validate_design_deliverable` or `npm run validate-design -- --manifest PATH`.
8. Inspect actual exports and rendered implementation. The manifest validator cannot prove pixel output, Figma structure, legal clearance, or usability.

## Module Routing

| Deliverable | Read |
|---|---|
| Brand identity, logo family, voice, or visual direction | `brand-systems.md` |
| Figma variables, modes, components, libraries, or handoff | `figma-production.md` |
| Generated images, illustrations, photos, textures, charts, audio, or video | `asset-generation.md` |
| Product icons or a custom icon family | `iconography.md` |
| Presentation deck, report slides, or reusable masters | `presentation-design.md` |
| Any third-party, generated, commissioned, or user-provided asset | `licensing-and-provenance.md` |
| Color, contrast, non-color cues, alternatives, or export accessibility | `visual-accessibility.md` |

## Evidence Boundary

The design-deliverable manifest is a structured claim with evidence references. Passing validation means the declaration is internally consistent and its recorded token math meets the implemented checks. It does not mean:

- Every screen or exported asset uses the declared tokens.
- A Figma file contains the declared pages, variables, properties, or states.
- A rights basis is legally sufficient in every jurisdiction or channel.
- Generated media is free of confusing similarity or third-party claims.
- Rendered contrast, reading order, alternative text, or interaction behavior passes review.

Use source inspection, Figma inspection, export inspection, browser verification, and qualified human review to close those evidence gaps.

## Completion Gate

A design-intelligence deliverable is ready for handoff only when:

- The manifest passes with no errors.
- Every shipped asset has approved rights status and traceable evidence.
- Token references terminate at valid primitives and declared contrast pairs pass.
- Semantic icons have accessible names or equivalent visible text.
- Presentation slides use declared masters and have explicit reading order.
- Final artifacts have been inspected at their actual size and channel.
- Remaining warnings and limitations are reported rather than hidden.
