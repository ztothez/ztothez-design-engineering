# V6 Item 6: Comparison And Review Evidence Audit

Date: 2026-09-01
Status: complete

Item 6 is implemented by the maintained comparison engine. The repository already has a
versioned methodology, review schema, evaluator, report formatter, CLI compiler, and MCP tool.

## Verified Capabilities

- Candidate IDs and labels are declared in the methodology and can remain anonymous.
- Every screenshot records candidate, viewport, state, dimensions, checksum, producer, scope, and
  retention status.
- Task prompts, success criteria, time, completion, comprehension, recovery, confidence, and
  perceived visual quality are represented separately.
- Rubric categories are weighted and independently evaluated. Visual quality, information
  findability, task performance, accessibility, and architecture are not collapsed into one score.
- Human expert and representative-user criteria are distinct from automated and AI-assisted
  evidence. Attribution, identity blinding, counterbalanced order, and complete matrices are
  validated for methodology version 1.1.
- Claims cannot cite another candidate's artifact, exceed the declared evidence scope, or claim
  accessibility conformance without matching structured evidence.
- Retained artifacts are checksum-verified and must remain inside the review directory.
- `compile-comparison-review` and `validate-comparison` operate locally. No GitHub, Supabase, or
  model provider is required to produce or validate a comparison packet.

## Existing Interfaces

- MCP: `evaluate_interface_comparison`
- CLI: `zz-design validate-comparison`
- CLI: `zz-design compile-comparison`
- Maintainer assessment: `zz-design assess-maintainer`

## Decision

Item 6 is complete through the existing comparison contract. The V6 work does not add a second
comparison schema or packet format. Future work should consume this contract when comparing the
reconciled plan or rendered candidates, while preserving the evidence-class and artifact
boundaries above.
