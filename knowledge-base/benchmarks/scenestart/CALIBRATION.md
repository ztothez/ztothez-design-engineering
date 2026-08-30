# SceneStart Benchmark Calibration

## Calibration Context

- Date: 2026-08-27
- Application reference: `portfolio:scenestart`
- Runtime: local TanStack Start development server at `http://127.0.0.1:4173`
- Browser: Chromium 151 connected through a loopback CDP endpoint
- Contract viewports: 320, 390, 768, 1024, and 1440 CSS pixels
- Human attestations: `local-first-boundary` passed by ZtotheZ, product owner and maintainer

## Final Profile Results

| Profile | Journey | Runtime | Acceptance | Gate |
|---|---:|---:|---:|---:|
| `studio-export` | 1 of 1 passed | 0 errors, 1 warning | 6 passed | Pass |
| `guided-workshop` | 1 of 1 passed | 0 errors, 0 warnings | 6 passed | Pass |
| `learning-persistence` | 1 of 1 passed | 0 errors, 0 warnings | 4 passed | Pass |
| `release-provenance` | 1 of 1 passed | 0 errors, 0 warnings | 5 passed | Pass |

Every profile captured five base-route and five completed-journey screenshots. All four
journeys completed, including their state assertions and retained download evidence where
required.

The remaining Studio warning is a single early canvas sample without pixel variation. The
completed journey screenshots contain the rendered production, so this is retained as a timing
warning rather than suppressed or promoted to a product failure.

The aggregate release gate passes all four required profiles and all 10 acceptance criteria with
zero failed or unverified criteria. The `local-first-boundary` result uses the attributable
ZtotheZ review in `human-review.md` and `attestations.yaml`; the remaining criteria use contract,
runtime, accessibility, screenshot, network, and export evidence.

## Remediated Product Findings

- Demo Studio now initializes from local storage before the first client render. The completed
  Workshop project therefore arrives in Studio with the same handle and project state.
- A storage round-trip regression test covers the Workshop-to-Studio transfer.
- Home actions, footer links, shared support navigation, Studio controls, release actions, and
  release checklist labels now expose stable touch targets.
- Studio and remix sliders use a 44 CSS pixel interaction area.
- The visually hidden Studio file input has an explicit accessible name.
- Release-provenance checkboxes use a 24 CSS pixel control inside a 44 CSS pixel label target.
- Fixed-height release controls were replaced with growable minimum heights so labels remain
  readable at 200 percent text size.
- The Studio metadata section is named `Project details`, avoiding an unsupported operational
  status interpretation of the previous `Production` heading.
- The three interactive Core Demo Craft lessons now expose `CHECK GOAL AND COMPLETE`. An unmet
  goal reveals actionable guidance; a satisfied goal completes only after learner confirmation.
- The learning journey completes all nine lessons, verifies `PATH COMPLETE`, navigates away, and
  confirms that `9/9 DONE` persists when the route is reopened.

## Verifier Correction

The 200 percent text-resize rule previously reported a normal single-line input value as clipped
when the native control exposed horizontal value scrolling. The rule now evaluates text nodes
and genuinely constrained buttons while leaving native editable-value scrolling intact. The
runtime regression fixture contains a long editable value and proves that it is not reported as
lost content; the existing clipped-text fixture remains detected.

Managed environments may start Chromium separately and set
`ZTOTHEZ_DESIGN_CHROMIUM_CDP_URL` to a loopback HTTP origin such as
`http://127.0.0.1:9222`. The runtime policy rejects non-loopback hosts, WebSocket URLs,
credentials, paths, queries, and fragments. Direct Playwright launch remains the default.

## Retained Evidence

- `evidence/interface-quality/scenestart/studio-export/`
- `evidence/interface-quality/scenestart/guided-workshop/`
- `evidence/interface-quality/scenestart/learning-persistence/`
- `evidence/interface-quality/scenestart/release-provenance/`
- `evidence/interface-quality/scenestart/release/`

The Studio profile retained the versioned project JSON and standalone HTML production. The
Workshop profile retained its standalone HTML production. The release profile retained its
generated `readme.txt`. Blob-based downloads are captured through the verifier's CSP-compatible
evidence path without weakening SceneStart's CSP.

## Verification Results

- SceneStart tests: 21 files and 229 tests passed.
- SceneStart production build: passed.
- ZtotheZ regression suite: 65 tests passed, including the runtime verifier through the loopback
  CDP path and the SceneStart contract, profiles, and clean-room authority checks.
- ZtotheZ TypeScript typecheck, production build, package check, installed-package smoke,
  independence check, archive-removal smoke, release pack, and offline release verification:
  passed.
- SceneStart lint remains affected by the existing workspace formatting baseline and was not
  treated as evidence produced by this remediation.

## Review Boundary

The SceneStart benchmark is complete under its declared maintainer-review evidence model. This
does not create representative-user evidence or independent comparative validation. Those claims
remain governed by V2 Item 8 and require their own supplied sessions.
