# Private Research And Independent Implementation Policy

Private research may inform questions, comparison criteria, and candidate capabilities, but it is
not production authority. Raw publications, course material, product repositories, converted
documents, screenshots, and research archives remain outside Git, packages, release assets, MCP
roots, retrieval indexes, generated prompts, and runtime fallback paths.

## One-Way Admission Flow

1. Keep the original source in an owner-controlled private archive.
2. Record source identity, ownership or license status, acquisition basis, and a local integrity
   hash without publishing private paths or content.
3. Describe the design problem and observable behavior in original language. Do not copy source
   prose, code, schemas, taxonomies, templates, identifiers, datasets, or visual assets.
4. Verify official requirements against their primary authority. Treat product behavior and
   publications as comparative evidence, not standards.
5. Independently author a ZtotheZ model entity, rule, metric, exception, or knowledge-gap record.
6. Implement the capability from the project-owned specification without consulting source code
   during implementation.
7. Evaluate it with synthetic fixtures, owner-authorized products, and locked holdouts that do not
   contain the source implementation.
8. Perform provenance, privacy, similarity, license, and owner review before public admission.

The flow never runs backwards. Production code and agents must not retrieve a private source to
explain, repair, or complete an admitted rule.

Public knowledge admission is enforced by `governance/knowledge-admission.json`,
`governance/knowledge-admission.schema.json`, and `npm run knowledge:admission`. The manifest is
derived from the public inventory and provenance records, then checked against current file
digests, package scope, retrieval decisions, source evidence, and review authority.

Public source removal is enforced by `governance/public-knowledge-boundary.json`,
`governance/public-knowledge-boundary.schema.json`, and `npm run knowledge:boundary`. Removed
sources are recorded as current-tree removals with private backup confirmation; historical Git
objects, tags, releases, and npm versions require separate owner approval before any destructive
or public operation.

## Comparative Evaluation

Comparative products may reveal that another workflow is easier to use, more complete, more
visually coherent, or better verified. Record only:

- The product task being compared.
- The observable outcome and evidence method.
- The general capability gap.
- A source-neutral acceptance criterion.
- The independent benchmark that will verify the new implementation.

Do not reproduce another product's implementation, internal organization, branded terminology,
catalog, prompt, or source-specific scoring model. Similar outcomes are acceptable only when they
follow from common product requirements, official standards, independently documented rationale,
or owner-observed task evidence.

## Fail-Closed Rules

- Unknown ownership, permission, license, or source identity blocks public admission.
- AI analysis cannot approve license, provenance, consent, or human attribution.
- Raw source availability cannot satisfy evidence for an independently authored rule.
- A source-only success does not authorize copying or close a product benchmark.
- No-match behavior produces a knowledge gap, never a private-source fallback.
- Private corpus size or repetition does not establish correctness or permission.

## Required Public Evidence

An admitted capability requires a stable project-owned identifier, original rationale, authority
class, scope, precedence, evidence class, implementation reference, positive and negative cases,
abstention behavior, and an attributable owner review. Generated explanatory Markdown is a view of
that structured authority and must not become a second independent rule source.
