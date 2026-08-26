# AI Workspace Patterns

## Task Model

Define the practitioner, input, configuration, run boundary, generated result, evidence, review decision, and export or handoff. Separate model output from validated product state.

## Workspace Structure

1. Use a persistent product shell with visible workspace and environment context.
2. Put input, configuration, and the primary run action in one owning region.
3. Show results beside input on wide screens when comparison is frequent; use explicit Input and Results views on narrow screens.
4. Keep findings, evidence, confidence, limitations, and approval state inspectable without hiding them behind decorative summaries.
5. Preserve input and completed evidence across retryable failures.

## Required States

- Empty: explain required input and available sources without fake examples presented as current results.
- Validating: identify invalid or unsupported input before an expensive run.
- Running: announce progress, prevent duplicate submission, and preserve cancellation semantics.
- Partial: retain usable output and identify missing stages or sources.
- Error: show cause, preserved state, retry, and safe fallback.
- Complete: connect each consequential result to evidence and available next actions.

## Trust Contract

Label generated, retrieved, inferred, validated, rejected, and human-approved information distinctly. Do not fabricate confidence, citations, savings, accuracy, latency, or completion. Require human approval where the product decision has legal, financial, safety, employment, security, or publication consequences.
