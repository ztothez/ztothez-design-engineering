# ZtotheZ Design Engineering CI Integration

The active `.github/workflows/quality.yml` workflow validates this skill repository on pushes, pull requests, and manual dispatches. It installs the root and Azure V2 benchmark lockfile dependencies plus Chromium, then runs both builds and typechecks, benchmark contract validation, the full regression suite, a CLI quality gate against `ci/fixtures/responsive-overview.html`, the reusable V2 state matrix in `ci/fixtures/v2-quality-states.html`, and the Azure V2 product journey matrix. Complete machine-readable reports and viewport captures are retained as workflow artifacts even when a gate fails.

The V2 fixture covers normal, long-content, empty, partial, slow, fallback, stale, and disconnected states across initial, loading, result, error, history, and export stages. It opts into interface-trust and chart checks, masks only the declared dynamic clock, writes a screenshot baseline, and immediately verifies a second run against it at 375, 768, 1024, and 1440 CSS pixels. A matching screenshot hash detects change only. It is not visual-quality approval.

The V4 visual-composition fixture opts into the version 1.0 composition markers. CI verifies its
context, primary outcome, next action, action and region limits, state meaning, visual-claim
evidence, chart alternative and contrast, and rendered asset metadata at 375, 768, 1024, and 1440
CSS pixels in light and dark modes. The eight screenshots and runtime report are retained as a
separate artifact. This proves deterministic enforcement, not aesthetic preference or human review.

These deterministic fixtures prove that the quality-gate engine and responsive browser checks can produce complete passing reports. They are not evidence that AegisOPS or another product passes its own journeys.

The Azure V2 product lane runs ESLint, TypeScript, the Next production build, a zero-warning static audit, and `knowledge-base/benchmarks/azure-optimizer/v2-journeys.json` against the versioned 40-capture baseline. It covers demo, live local-API, slow, fallback, disconnected, partial, stale, finding-history, and provenance-export behavior. Its artifact remains automated evidence and does not satisfy the Item 8 human-review gate.

The solo-maintainer lane recompiles the attributed coordinator-only review and runs `assess-maintainer`. It must report `engineeringReady: true` while preserving `externalReleaseReady: false` until the anonymous expert and representative-user thresholds are met. This lane permits Item 9 engineering; it cannot certify independent human validation.

Diagnostic uploads use `if-no-files-found: warn` because an upstream build or gate can fail before creating its output directory. The originating step remains the authoritative failure; artifact collection must not hide it behind a secondary upload error. The release archive upload remains strict because it runs only after a successful release build.

## Product Integration

`github-actions-design-quality-gate.example.yml` is a repository-adaptation template, not an active workflow. Copy it into the target application's `.github/workflows/` directory only after implementing one deterministic startup command per journey profile.

The workflow deliberately separates profile execution from release adjudication:

1. Each matrix job starts the service state declared by that profile.
2. Each job writes and uploads its complete quality-gate directory, even when the gate fails.
3. The release job downloads all evidence and runs `aggregate-gates`.
4. Aggregation derives required profiles and criterion obligations from the product contract. Missing or duplicate reports, contract or failure-policy mismatches, incomplete gates, failed profiles, and unverified blocker criteria prevent release.

Expected network failures belong in the journey profile's `expectedNetwork` array. Match them narrowly by method, URL fragment, and HTTP status. A declared failure must occur within its minimum and maximum count; declarations are not global suppression rules.

Human review evidence must come from an approved reviewer and be supplied through `--attestations`. Never generate an attestation in CI or have an agent attest to its own output.
