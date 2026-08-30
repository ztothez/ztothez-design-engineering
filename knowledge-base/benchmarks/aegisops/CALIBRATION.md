# AegisOPS Accessibility Remediation Calibration

## Calibration Context

- Date: 2026-08-26
- Application reference: `portfolio:AegisOPS`
- Audited frontend reference: `portfolio:AegisOPS/frontend`
- UIX quality gate: version 1.9.1
- Browser: Chromium 151.0.7922.108
- Failure policy: warnings and errors block release
- Human evidence: existing user-authored `attestations.yaml`; no AI-generated attestation was added

## Remediation

The version 1.8.0 accessibility calibration found repeated contrast and target-size failures across the viewport matrix. The repeated findings resolved to shared component ownership rather than twenty separate defects.

- Raised the muted, dim, and faint foreground token hierarchy so normal text clears 4.5:1 on the darkest supported panel where each token may render.
- Replaced the pointer-only demo toggle with a keyboard-native button using `role="switch"`, `aria-checked`, an accessible name, and a 44 by 44 CSS-pixel target.
- Increased mission input, mode buttons, sidebar navigation, artifact downloads, and export-error dismissal to 44-pixel target contracts.
- Increased artifact-card minimum height so larger actions do not compress or overlap card content.
- Added product regression tests for foreground-token contrast and primary-control target contracts.

No runtime exemption attributes were added.

## Product Verification

- Frontend tests: 4 passed.
- ESLint: passed.
- Next.js production build: passed.
- Wide and mobile completed-journey screenshots were inspected after automation and showed no incoherent overlap or clipping.

## Current Quality-Gate Evidence

| Profile | Journey | Runtime | Acceptance | Evidence directory |
|---|---:|---:|---:|---|
| `demo-success` | 9 of 9 steps passed | 0 errors, 0 warnings | 6 passed | `.uix-quality-gate/aegis-demo-v191/` |
| `offline-recovery` | 6 of 6 steps passed | 0 errors, 0 warnings | 3 passed | `.uix-quality-gate/aegis-offline-v191/` |
| `responsive-overview` | 4 of 4 steps passed | 0 errors, 0 warnings | 2 passed | `.uix-quality-gate/aegis-responsive-v191/` |

Each profile captured four base-state and four completed-journey screenshots. The demo profile retained the generated Sigma artifact through the CSP-compatible Blob evidence path. The offline profile observed the contract-required `POST /run` HTTP 500 response and preserved the user's input and recovery controls.

The aggregate report at `.uix-quality-gate/aegis-release-v191/aggregate-report.json` is complete and passing:

- 3 of 3 required profiles supplied and passed.
- 9 acceptance criteria passed.
- 0 failed criteria.
- 0 unverified criteria.
- 0 warning failures or unverified warning criteria.

## Decision

The contrast-token and control-size findings are resolved against the current UIX verifier. AegisOPS passes its complete release profile set under the strict warning-level policy. Reopen this decision if product UI changes or a newer verifier introduces evidence that invalidates these results.
