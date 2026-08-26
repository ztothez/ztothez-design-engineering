# SceneStart Benchmark Calibration

## Calibration Context

- Date: 2026-08-26
- Application: `/home/ztothez/Studio/portfolio/scenestart`
- Runtime: local TanStack Start development server
- Browser: Chromium 151
- Contract viewports: 320, 390, 768, 1024, and 1440 CSS pixels
- Human attestations: none supplied

## Contract And Journey Results

- Contract validation passed with 3 actors, 4 modes, 10 acceptance criteria, 4 profiles, and 4 journeys.
- `learning-persistence` completed all 8 journey steps and preserved `1/9` progress across route navigation.
- `studio-export` completed all 13 steps and retained both generated artifacts: a 2,210-byte versioned project JSON and a 7,015-byte standalone HTML production.
- `guided-workshop` retained its HTML export but failed the final continuity assertion: after entering `NOVA` and choosing `CONTINUE IN DEMO STUDIO`, the Studio handle was `DEMO` instead of `NOVA`.
- `release-provenance` completed all 12 steps and retained a 926-byte `readme.txt` containing the production title, creator, licence, and AI-assistance disclosure.

Version 1.9.1 resolves the Blob evidence boundary without changing SceneStart's CSP. Before application code runs, the isolated journey page retains Blob objects associated with object URLs for up to 60 seconds. If Chromium cannot save a download directly, the verifier reads the retained Blob through the Blob API, enforces a 20 MB evidence limit, and writes the artifact to the evidence directory. A CSP-restricted fixture with immediate URL revocation verifies this path. If every path fails, the report preserves browser-save, browser-download, and fallback diagnostics instead of presenting the verifier limitation as a product download failure.

## Multi-Route Verifier Finding

Initial calibration revealed that the runtime verifier checked responsive and accessibility rules only on the base URL, while journeys could navigate to unscanned routes. Version 1.9.0 corrects this by preserving the completed journey state, resizing it through every contract viewport, rerunning rendered checks, and capturing one final-state screenshot per viewport.

The calibrated `learning-persistence` quality gate produced:

- Contract: pass.
- Architecture: pass with 7 warnings.
- Journey: 1 of 1 passed.
- Screenshots: 10, covering five base states and five completed journey states.
- Acceptance: learning persistence, honest scope, and responsive integrity passed; accessible operation failed.

The post-fix profile runs produced:

| Profile | Journey | Retained export evidence | Acceptance |
|---|---:|---|---:|
| `studio-export` | 13 of 13 steps passed | Project JSON and offline HTML | 4 passed, 2 failed |
| `guided-workshop` | 20 of 21 steps passed | Offline HTML | 0 passed, 6 failed |
| `learning-persistence` | 8 of 8 steps passed | Not applicable | 3 passed, 1 failed |
| `release-provenance` | 12 of 12 steps passed | Release readme | 2 passed, 2 failed, 1 unverified |

All four quality-gate runs remain failed overall because product findings are unresolved. A successful journey or retained download does not override blocker accessibility findings or manual-review requirements.

## Current Product Findings

### Blocker Accessibility Findings

- Home `RUN LIVE` control renders at approximately 82 by 31.5 CSS pixels.
- Home footer links render at approximately 15 CSS pixels high.
- Shared support link renders at approximately 16.5 CSS pixels high.
- Core Demo Craft concept-completion buttons render at approximately 33 CSS pixels high.
- The shared SceneStart brand link renders at 32 CSS pixels high, below the 44-pixel recommendation but above the 24-pixel minimum.

The generic runtime selector may collapse multiple same-tag targets into one reported selector. Source-level remediation must inspect every matching target rather than fixing only the first visible example.

### Architecture Review Warnings

- `DemoStudio.tsx` exceeds the 400-line review threshold.
- `CreatorStudio.tsx`, `GuidedWorkshop.tsx`, and `learn.$slug.tsx` combine large rendering surfaces with direct side-effect orchestration.
- `chart.tsx`, `foundation-paths.ts`, and `error-page.ts` contain repeated raw colors outside an identifiable token definition file.

Warnings are review triggers, not automatic proof of incorrect architecture. Refactor only where ownership, testability, or change isolation materially improves.

### Workshop Continuity Finding

The guided project is correct when exported, but the same handle is not visible after continuing into Demo Studio. The failure is reproducible at the final journey assertion and is separate from download evidence capture. Review the handoff between `GuidedWorkshop` and `DemoStudio`, especially initial state hydration and persistence effects; add a product-level regression test before changing the benchmark expectation.

### Canvas Evidence

One early Studio run sampled an initially uniform canvas before journey completion. Later route scans rendered variation. Treat this as a timing/calibration warning until repeated evidence proves either a blank-state defect or a sampler race; do not apply a blanket canvas exemption.

## Next Calibration Actions

1. Correct the Workshop-to-Studio project handoff and add a product-level regression test that proves the current handle and project survive navigation.
2. Increase target hit areas in shared navigation, home controls, learning controls, Workshop sliders, and support links; add an accessible name to the visually hidden control reported in the Workshop state.
3. Resolve or explicitly disposition the remaining contrast, focus, reflow, and target-size findings using the per-profile runtime reports.
4. Obtain attributable human review for `local-first-boundary`; AI-generated attestation is prohibited.
5. Rerun and aggregate all required profiles only after every blocker criterion is passed or legitimately attested.
