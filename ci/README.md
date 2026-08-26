# ZtotheZ Design Engineering CI Integration

The active `.github/workflows/quality.yml` workflow validates this skill repository on pushes, pull requests, and manual dispatches. It installs the lockfile dependencies and Chromium, then runs the build, typecheck, benchmark contract validation, full regression suite, and a CLI quality gate against `ci/fixtures/responsive-overview.html`. The complete fixture evidence directory is retained as a workflow artifact even when a gate fails.

The deterministic fixture proves that the quality-gate engine and responsive browser checks can produce a complete passing report. It is not evidence that AegisOPS or another product passes its own journeys.

## Product Integration

`github-actions-design-quality-gate.example.yml` is a repository-adaptation template, not an active workflow. Copy it into the target application's `.github/workflows/` directory only after implementing one deterministic startup command per journey profile.

The workflow deliberately separates profile execution from release adjudication:

1. Each matrix job starts the service state declared by that profile.
2. Each job writes and uploads its complete quality-gate directory, even when the gate fails.
3. The release job downloads all evidence and runs `aggregate-gates`.
4. Aggregation derives required profiles and criterion obligations from the product contract. Missing or duplicate reports, contract or failure-policy mismatches, incomplete gates, failed profiles, and unverified blocker criteria prevent release.

Expected network failures belong in the journey profile's `expectedNetwork` array. Match them narrowly by method, URL fragment, and HTTP status. A declared failure must occur within its minimum and maximum count; declarations are not global suppression rules.

Human review evidence must come from an approved reviewer and be supplied through `--attestations`. Never generate an attestation in CI or have an agent attest to its own output.
