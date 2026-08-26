# AegisOPS Benchmark Manifest

This benchmark turns independently normalized AegisOPS product evidence into executable requirements. It is not a replacement application, a style template, or permission to copy obsolete implementation details.

## Authority Order

1. Current AegisOPS requirements and working implementation are authoritative for behavior, data contracts, supported modes, and framework choices.
2. `SOURCE-EVIDENCE.md` records the normalized product and design snapshot without requiring the local raw corpus.
3. `product-contract.yaml` is the normalized benchmark contract used by ZtotheZ Design Engineering validation tools.
4. Current task completion, state integrity, and accessible operation override historical fixed compositions.
5. Historical implementation and submission material explains intent only and may contain obsolete technology, claims, labels, and integrations.
6. Root `SKILL.md` remains the governing design-engineering instruction.

When sources disagree, preserve current product behavior and record the discrepancy. Never silently restore an old framework, dependency, fixed layout, metric, or marketing claim.

## Corpus Boundaries

- AegisOPS is user-owned source material, not a third-party design-skill dependency.
- No AegisOPS application code, images, UI-kit implementation, or submission material is imported or packaged by this benchmark.
- `SOURCE-EVIDENCE.md` stores independently authored product observations and hashes for local provenance inputs.
- Repeated local design-system fragments are duplicate evidence and must not be weighted as independent support.
- Unrelated financial and roadmap material is outside this benchmark and must never be retrieved or packaged.

## Benchmark Use

Use this benchmark to evaluate whether an implementation:

- Supports the operator's complete detection-readiness task rather than presenting a decorative SOC dashboard.
- Preserves Single Technique, APT Group, Kill Chain, and Topology Lab semantics.
- Exposes pipeline progress, success, failure, retry, and labeled demo fallback states.
- Connects coverage, safety, latency, and readiness values to inspectable evidence.
- Produces usable Sigma, SPL, playbook, VECTR, validation, and PDF artifacts where supported.
- Keeps consequential status and controls readable and operable at every required viewport.
- Makes authorized defensive scope explicit and avoids unsupported offensive or commercial claims.

Run `npm run validate-contract -- --contract knowledge-base/benchmarks/aegisops/product-contract.yaml` before using this benchmark in a quality gate.

Execute one runtime profile against an already-running application with:

```bash
npm run verify-ui -- --url URL \
  --journeys knowledge-base/benchmarks/aegisops/journeys.json \
  --profile responsive-overview
```

Run all required stages and produce one handoff decision with:

```bash
npm run quality-gate -- \
  --contract knowledge-base/benchmarks/aegisops/product-contract.yaml \
  --repo PATH_TO_AEGISOPS_FRONTEND \
  --url URL \
  --profile responsive-overview
```

Manual-review criteria require a human-authored attestation file. Start from `attestations.template.yaml`; do not treat an empty template as evidence. AI agents may format reviewer-provided findings but must never invent a reviewer, review time, decision, or evidence path.
