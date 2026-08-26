# AegisOPS Acceptance Criteria

The machine-readable criteria live in `product-contract.yaml`. This document explains how reviewers should interpret their evidence.

## Product Coherence

- A mode changes the task model, accepted input, progress semantics, and result grouping. It is not merely a selected visual tab.
- The selected scenario remains identifiable in every generated output and export.
- The four agent stages have distinct responsibilities. Their outputs must not collapse into interchangeable generic text.
- Validation reports both covered and missing observables. A high score without inspectable evidence is a failure.

## State And Recovery

- Idle explains the required input and does not imply that results already exist.
- Running identifies progress, prevents duplicate submission, retains input, and keeps unrelated navigation usable.
- Success exposes artifacts and evidence without replacing the operator's input or history.
- Error explains the recoverable cause, preserves the scenario, and presents retry and Demo mode guidance.
- Demo mode is labeled before and after execution. Historical AMD or ROCm evidence must not appear as a current live measurement.

## Responsive Operation

At 375, 768, 1024, and 1440 CSS pixels:

- Hero status, mission controls, pipeline metadata, readiness gates, logs, and agent status remain readable.
- Dense two-column desktop groups stack or adapt before labels and values collide.
- No `overflow: hidden` container may conceal operational text or controls.
- Logs and data regions may scroll internally when clearly bounded, but the page must not create competing horizontal scroll regions.
- Primary run, retry, and export actions remain reachable by keyboard and pointer.

## Evidence Standard

An acceptance criterion passes only when the required evidence type exists:

- `contract`: the requirement and source of truth are explicitly defined.
- `runtime`: browser assertions prove rendered behavior.
- `screenshot`: the complete viewport can be inspected without clipping or overlap.
- `network`: request status and returned data support the UI claim.
- `accessibility`: names, focus behavior, announcements, and non-color cues are verified.
- `export`: downloaded content matches the current run and expected format.
- `manual-review`: a qualified reviewer checks semantic or safety quality that cannot be inferred from presentation alone.

Passing screenshots alone never prove product coherence, metric validity, or export integrity.
