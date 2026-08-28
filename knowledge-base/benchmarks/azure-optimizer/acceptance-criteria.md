# Azure Optimizer Acceptance Criteria

The machine-readable criteria are in `product-contract.yaml`.

## Task Integrity

- The current environment, data origin, connection state, and freshness are visible without consulting documentation.
- Priority is derived from severity, impact, evidence, and scope rather than decorative prominence.
- Findings connect affected resources to observations, impact, remediation, and validation.
- Analysis input and context remain available through loading, error, fallback, and completion.
- Exports preserve the visible result and its provenance.

## Comparison Integrity

- Every candidate uses the same dataset, viewport dimensions, states, and task prompts.
- Candidate-specific selectors may differ, but success criteria cannot change by candidate.
- Unsupported or failed behavior is recorded as failed, partial, or not run.
- Screenshot similarity, source-code inspection, and automated accessibility checks cannot become human or representative-user evidence.
- Candidate labels remain anonymous in reviewer-facing materials.

## Responsive Evidence

At 375, 768, 1024, and 1440 CSS pixels, primary context, metrics, findings, provenance, and actions must not clip, overlap, or create incoherent competing scroll regions. Long labels, empty data, partial data, loading, fallback, disconnected, and export states remain in scope.
