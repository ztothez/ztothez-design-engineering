# Design Intelligence Router

Use this maintained module set when a request needs interface trust, operational information design, visual polish, brand identity, Figma libraries, generated or sourced assets, icon systems, presentations, licensing records, or visual-accessibility review. Keep the root `SKILL.md` authoritative and load only the modules required by the deliverables.

## Required Workflow

For an interface system, use this order and record every stage in `design-deliverable.yaml`:

1. Validate the product task and product contract.
2. Create and validate the truth and data-source contract from `interface-trust.template.yaml`.
3. Create and validate the information architecture from `information-design.template.yaml`.
4. Declare the interaction and state model.
5. Declare the visual direction using `visual-polish.md`.
6. Build primitive, semantic, and component token layers.
7. Implement the smallest coherent task path.
8. Attach deterministic automated verification evidence.
9. Request attributable human visual review of rendered output.

Before this sequence, inspect the existing brand, tokens, components, assets, rights records, and implementation stack. Preserve coherent systems unless redesign is requested. During it, route to the smallest relevant modules, record rights evidence for every distributable asset, and keep unresolved assets out of production output. A declaration validator cannot prove pixels, runtime behavior, legal clearance, usability, or human validation.

## Module Routing

| Deliverable | Read |
|---|---|
| Operational state, external data, generated results, fallback, history, or export provenance | `interface-trust.md` |
| Operational metrics, findings, charts, hierarchy, long labels, or large collections | `information-design.md` |
| Visual direction, typography, composition, density, states, motion, charts, or rendered visual review | `visual-polish.md` |
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

The interface-trust contract has the same boundary. Passing validation proves internal source and disclosure consistency, not that the rendered interface displays the declarations or that an external service is available.

The information-design contract proves declaration structure and decision traceability only. It does not prove correct calculations, rendered hierarchy, responsive behavior, or representative-user comprehension.

The visual-polish report separates structural pass, verified rendered evidence, attributable human review, and release readiness. Planned screenshots and agent-authored critique never satisfy the latter two gates.

The integrated design report also separates generation readiness, contract validation, automated verification, and human review. `passed` means the manifest is internally consistent; only `integration.releaseReady` means every declared V2 gate is complete.

## Completion Gate

A design-intelligence deliverable is ready for handoff only when:

- The manifest passes with no errors.
- Every shipped asset has approved rights status and traceable evidence.
- Token references terminate at valid primitives and declared contrast pairs pass.
- Semantic icons have accessible names or equivalent visible text.
- Presentation slides use declared masters and have explicit reading order.
- Final artifacts have been inspected at their actual size and channel.
- Interface systems have verified captures at 375, 768, 1024, and 1440 CSS pixels and attributable human review before visual release.
- Remaining warnings and limitations are reported rather than hidden.
