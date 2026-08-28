# React And TypeScript Generation Adapter

Use this adapter only after a product design brief compiles to a design plan with `status: ready`
and `implementationReady: true`. It creates a new independent React, TypeScript, and Vite fixture.
It does not merge into an existing application, repair a product, prove visual quality, or authorize
release.

## Input Gate

1. Validate the source brief and all four downstream contract declarations.
2. Compile the brief and preserve the complete design-plan artifact.
3. Stop when the plan is blocked or provisional. Never edit compiled readiness fields manually.
4. Provide an existing real generation root, one absent child output path, and a passing portfolio
   registry. The adapter refuses existing output, symlinked parents, traversal, and any target that
   overlaps a portfolio root.
5. Keep the portfolio registry local. Its absolute paths authorize denial checks and must not enter
   generated files or reports.

## Generated Architecture

The initial `react-typescript-vite` adapter generates:

- A complete local demonstration task and a disconnected-source recovery path.
- Reducer-owned task state separate from rendering and source-boundary declarations.
- Separate demo, imported, cached, and live modes with origin, freshness, connection, and
  limitation text. Missing live, import, or cache evidence remains unavailable rather than
  borrowing demonstration values.
- Primitive and semantic CSS tokens, responsive composition, visible focus, minimum target
  geometry, non-color status labels, and reduced-motion behavior.
- Unit tests, build and typecheck scripts, a traceable plan summary, and a checksummed deterministic
  generation manifest.

The adapter interpolates only validated plan data into a generated constant. It never treats plan
text as executable source and never imports implementation from an external design product.

## Command

```bash
zz-design generate-react \
  --plan path/to/ready-design-plan.json \
  --generation-root .ztothez-design-generated \
  --output .ztothez-design-generated/example-app \
  --portfolio-registry .ztothez-design-local/portfolio-registry.yaml \
  --json
```

Create the generation root before running the command. The output directory must not exist. Use
`generation-adapter.schema.yaml` to validate the generated `ztothez-design-generation.json` file.

## Evidence Boundary

- Deterministic files and checksums prove repeatable transformation for the same plan and adapter
  version. They do not prove the chosen design is desirable.
- Static audit and generated unit tests prove only the implemented source rules and reducer paths.
- Live connectivity remains unimplemented until a real target adapter receives authenticated
  runtime evidence. Imported and cached modes remain unavailable until valid records exist.
- Browser, accessibility, interaction, visual composition, security, integration, and attributable
  human review remain later gates.
- Existing-repository adaptation is outside version 1.0. Use the independent fixture path until a
  separate convention-aware merge adapter has its own containment and regression evidence.
