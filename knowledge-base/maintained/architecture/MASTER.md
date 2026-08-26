# Maintained Design Architecture

Use this module set when a design task changes system boundaries, shared components, runtime ownership, product-family reuse, or consequential quality attributes. These files are independently authored for ZtotheZ Design Engineering and are the only architecture references in the distributable knowledge index.

## Routing

| Need | Module |
|---|---|
| Quality attributes, scenarios, trade-offs, or architecture review | `quality-attributes-and-evaluation.md` |
| Components, state ownership, coupling, cohesion, or package boundaries | `component-boundaries.md` |
| Shared product families, variation points, plugins, or platform evolution | `product-platforms.md` |

## Operating Contract

1. Start with actors, critical tasks, sources of truth, failure states, and measurable quality scenarios.
2. Draw dependency and runtime boundaries before choosing patterns or packages.
3. Keep domain policy independent from rendering and infrastructure details.
4. Use explicit contracts for state, events, errors, cancellation, retries, and ownership.
5. Record consequential decisions with alternatives, trade-offs, and reversal cost.
6. Validate important scenarios through source inspection, tests, runtime evidence, and attributable review as appropriate.

Architecture vocabulary is not evidence. A named pattern is acceptable only when the implemented dependency direction and runtime behavior support the required tasks and quality attributes.
