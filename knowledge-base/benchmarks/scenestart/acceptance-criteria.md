# SceneStart Acceptance Guide

The machine-readable criteria are in `product-contract.yaml`. This guide explains how to interpret their evidence without confusing interface appearance with product validity.

## Studio And Export

- Project identity, scene order, timing, transitions, messages, cues, effect parameters, preview, and downloads must derive from one current sanitized project.
- A downloaded JSON recipe proves a file was emitted only after its version, filename, limits, and current values are checked.
- A downloaded HTML file proves export mechanics only after its current values, start behavior, Escape behavior, deterministic renderers, and lack of playback-time network dependencies are inspected.
- Canvas pixels must be nonblank at required viewports. Pixel presence does not prove artistic quality, scene coherence, or learning effectiveness.
- Invalid import must not erase or silently replace the current production.

## Guided Workshop

- The six steps must communicate current and remaining work without a countdown or false urgency.
- A user may change parameters, preview the production, export it, and continue in Studio with the same handle and scenes.
- Completion means the workflow reached its defined terminal state. It does not mean the user learned the concepts unless representative-user evidence supports that conclusion.

## Learning Progress

- Progress is computed from current versioned state and the current lesson or requirement registry.
- Navigation or reload must not reset valid progress while localStorage remains available.
- Corrupt, obsolete, or impossible stored values must not create impossible completion.
- Estimated minutes are planning guidance, not measured user performance.

## Release Provenance

- Asset provenance remains unresolved until required fields and explicit rights confirmation exist.
- Rights confirmation records the producer's decision; it is not legal verification by SceneStart.
- The generated readme must include the current disclosure, credits, run instructions, and unresolved status.
- Checklist completion cannot be labeled competition-ready, accepted, certified, or original.

## Local-First Evidence

The interface and source contract can state local-first behavior, but screenshots cannot prove absence of upload. A human reviewer must inspect current network behavior, storage ownership, server routes, third-party scripts, and exported HTML before attesting to `local-first-boundary`.

Public pages may contain optional external links. The relevant distinction is whether authoring state is transmitted and whether exported playback requires the network, not whether the product contains any hyperlink.

## Responsive And Accessible Operation

At 320, 390, 768, 1024, and 1440 CSS pixels:

- Timeline entries, labels, values, and action groups remain readable.
- Preview regions maintain stable dimensions without covering authoring controls.
- Long concepts, cues, filenames, and disclosure text wrap without page-level horizontal overflow.
- Focus remains visible and unobscured through navigation, forms, range controls, downloads, and workshop progression.
- Status changes are textual and announced where consequential.
- Authoring motion respects reduced-motion preferences; exported artistic playback remains explicitly user-started.

## Evidence Limits

- `contract` proves the expected source of truth and behavior are specified.
- `runtime` proves the configured rendered journey completed.
- `screenshot` proves required viewport evidence exists and automated geometry checks passed.
- `accessibility` proves the automated name, focus, contrast, target, reflow, and motion checks passed.
- `export` proves a configured download occurred with the expected filename and captured artifact.
- `manual-review` proves only the named reviewer made the recorded decision at the recorded time.

No evidence type may be silently substituted for another.
