# SceneStart Benchmark Manifest

This benchmark defines SceneStart as a local-first demoscene learning and production system. It evaluates task completion, state ownership, export integrity, learning continuity, release provenance, and honest product boundaries. It is not a visual template and does not treat neon styling as evidence of product quality.

## Authority Order

1. The current SceneStart implementation and root README are authoritative for supported behavior, routes, storage, exports, and technology choices.
2. `SOURCE-EVIDENCE.md` records the implementation snapshot used to create this benchmark without creating a runtime dependency on the separate SceneStart workspace.
3. `product-contract.yaml` is the normalized contract used by ZtotheZ Design Engineering validation tools.
4. Current design and responsive behavior may guide presentation, but task integrity and accessible operation override fixed visual composition.
5. Historical Hello, Scene! research explains product intent only. It cannot restore obsolete features or override the current implementation.

## Benchmark Boundaries

- SceneStart is user-owned source material, not a third-party design-skill dependency.
- No SceneStart source code is imported or packaged by this benchmark.
- The benchmark stores independently authored behavioral requirements and source hashes only.
- The product remains useful without accounts, application databases, analytics, or cloud project storage.
- External learning links are optional departures from the application, not runtime dependencies of exported productions.
- SceneStart assists preparation but does not certify originality, rights ownership, competition eligibility, or acceptance by an event organizer.

## Required Profiles

| Profile | Product question |
|---|---|
| `studio-export` | Can a maker edit a coherent multi-scene project and download both editable and playable artifacts? |
| `guided-workshop` | Can a beginner complete the six-step guided route and continue with the same project? |
| `learning-persistence` | Does completed learning progress survive navigation and remain attributable to the same local device state? |
| `release-provenance` | Can a producer document asset provenance and generate a release readme without implying certification? |

The `release-provenance` profile includes a blocker manual-review criterion for the local-first boundary. It must remain `UNVERIFIED` until an attributable human reviews the build and evidence. An AI agent must not create that attestation.

## Commands

Validate the benchmark:

```bash
npm run validate-contract -- \
  --contract knowledge-base/benchmarks/scenestart/product-contract.yaml
```

Run one profile against an already-running SceneStart application:

```bash
npm run quality-gate -- \
  --contract knowledge-base/benchmarks/scenestart/product-contract.yaml \
  --repo /home/ztothez/Studio/portfolio/scenestart \
  --url http://127.0.0.1:3000 \
  --profile studio-export \
  --output .ztothez-design-quality-gate/scenestart-studio
```

Use `attestations.template.yaml` only as an empty structure. Reviewer observations belong in `human-review.template.md` first and may be converted to an attestation only after the named reviewer approves the final wording and evidence.
