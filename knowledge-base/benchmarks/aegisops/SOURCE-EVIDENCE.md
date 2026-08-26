# AegisOPS Source Evidence

## Snapshot

- Observed: 2026-08-26
- Ownership context: user-owned portfolio project and design material
- Runtime dependency: none; the original files are local provenance inputs and are not distributed
- Product domain: security-operations readiness and defensive detection engineering
- Current implementation boundary: application behavior overrides historical design and submission material

## Normalized Product Evidence

- A senior SOC analyst or detection engineer selects an authorized MITRE ATT&CK technique or scenario and runs a staged Threat, Detection, Response, and Validation workflow.
- The pipeline must expose its current stage, completion, failure, retry, and explicitly labeled demo fallback instead of replacing unavailable live evidence with unlabeled mock output.
- Results connect scenario inputs and observables to Sigma-style detection logic, SPL hunting guidance, SOC response actions, coverage evaluation, and supported export artifacts.
- Coverage, safety, latency, model status, and readiness values require an inspectable source. Decorative percentages or status labels are not acceptable evidence.
- Single Technique, APT Group, Kill Chain, and Topology Lab are distinct task modes. Shared pipeline state must not erase their different inputs, progression, outputs, and recovery needs.
- Generated security content remains bounded to authorized defensive use and known ATT&CK behavior. It is reviewable engineering output, not automatic production truth.

## Normalized Design Evidence

- The primary surface is an operational command center, so the current task, pipeline state, findings, evidence, recovery controls, and exports take precedence over promotional content.
- Semantic status colors distinguish live, ready, warning, fallback, and failure states, but color is never the only carrier of meaning.
- Agent stages use stable identity and ordering while component composition adapts to available width. A historical desktop mockup is not permission for fixed-width clipping.
- Typography, contrast, focus, target size, keyboard operation, reflow, text resizing, and reduced-motion behavior remain quality-gate concerns even when historical visual material omitted them.
- The interface uses restrained operational language. Claims about coverage, performance, hardware, models, integrations, or commercial impact require current evidence.

## Provenance Boundaries

- No original application code, UI kit implementation, image, slide, submission text, or archived skill is imported by this benchmark.
- The distributable benchmark contains independently normalized behavioral requirements, acceptance criteria, journeys, anti-patterns, and source hashes only.
- Repeated local design-system copies are duplicate evidence and must not increase a recommendation's weight.
- Unrelated local financial and roadmap data is outside this product benchmark and must never be retrieved or packaged.

## Local Snapshot Hashes

| Local provenance input | SHA-256 |
|---|---|
| Design-system handbook | `75281f7dc0fc279b583c87ce2e135ea74ec798be33859f7f2ca356e9e28f7663` |
| Command-center composition | `f0c81df7551d2e26d57291863be0b5a5846b51f5a72924d0c21b5762525a6ca1` |
| Desktop visual reference | `866a06f75c08b2097bf9275d39308f414ead234b37c62cf63a7a6627b76f5b67` |
| Historical product README | `504c0d8fda01a4fee9b18a7110a0125cddbfc2cf797a424e9cb5f78d35dcda05` |
| Historical submission framing | `238121f7d0ee0c3f037bbb60ed5adb50d05ae116ea08d60a690c573cd5592150` |

A hash change is a review trigger, not proof that the benchmark or product regressed. Inspect current product behavior before revising this normalized record.
