# Corpus Benchmark

This directory is the maintained evaluation corpus for ZtotheZ Design Engineering. It measures whether retrieval, architecture auditing, product-contract validation, and anti-slop rules produce the expected decisions on controlled positive and negative cases.

## Files

- `corpus.yaml` is the executable case manifest and score policy.
- `corpus.schema.yaml` is the portable schema for corpus authors and external tooling.
- `PROVENANCE.md` records ownership, licensed references, derivation, and redistribution boundaries.
- `cases/` contains small project-owned repositories and one deliberately incomplete product contract.

## Evaluation

Run:

```bash
npm run evaluate-corpus
```

The command exits unsuccessfully when the overall threshold, a dimension threshold, or recommendation mean reciprocal rank is missed. A case passes only when the observed result matches its declared expectation. Negative cases pass when the system rejects the known defect or explicitly abstains.

## Interpretation

- Recommendation relevance measures whether the expected approved source appears within the declared maximum rank.
- Abstention measures whether out-of-scope queries return `no-match` without archive fallback.
- Architectural integrity measures clean acceptance and known architecture-rule detection.
- Task completeness measures valid product contracts and rejection of broken cross-references.
- Anti-slop rejection measures clean acceptance and deterministic rejection of mock production paths or nonfunctional controls.

Passing this corpus proves behavior only for the included cases. It does not prove universal recommendation quality, product usability, legal clearance, or visual quality.
