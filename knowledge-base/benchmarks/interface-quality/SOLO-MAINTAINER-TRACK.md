# Solo-Maintainer Validation Track

Use this track when an attributed project maintainer can perform expert inspection but independent experts or representative users are not currently available. It authorizes continued engineering only. It does not establish independent preference, representative-user comprehension, statistical confidence, or external release approval.

## Required Evidence

1. Preserve the anonymous comparison methodology and external release thresholds unchanged.
2. Record the maintainer review as `human-expert` and `reviewer-supplied`.
3. Disclose candidate exposure, identity knowledge, and conflicts accurately.
4. Score every human-expert criterion for every candidate with an observable rationale.
5. Preserve the completed source session and checksum through `compile-comparison`.
6. Require all target build, typecheck, architecture-audit, browser-verification, and product-journey stages to pass.
7. Require the target to meet the configured category floor and equal or exceed the configured comparator for every maintainer-scored category.

## Allowed Claim

When the assessment passes, report:

```text
Engineering may proceed under attributed solo-maintainer review. Independent human and representative-user validation remains pending.
```

Do not replace this with claims such as `human validated`, `user tested`, `preferred by users`, `externally approved`, or `release validated`.

## Command

```bash
npm run assess-maintainer -- \
  --methodology knowledge-base/benchmarks/azure-optimizer/v2-human-review-methodology.yaml \
  --review evidence/interface-quality/azure-v2-review/review.completed.yaml \
  --output evidence/interface-quality/azure-v2-review/maintainer-assessment.json \
  --require-engineering-ready
```

The generated report deliberately separates `engineeringReady`, `externalReleaseReady`, and `externalValidationPending`.
