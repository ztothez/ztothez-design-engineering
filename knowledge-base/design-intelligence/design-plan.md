# Deterministic Design Plan Compiler

Use this module after a version 1.0 product design brief is generation-ready and before production
UI generation. The compiler turns product intent into an inspectable implementation boundary while
preserving unresolved evidence as provisional or blocked work.

## Compile Sequence

1. Validate the brief. A draft or semantically invalid brief produces a blocked plan.
2. Canonically hash the brief and record the compiler version. The same brief and compiler version
   must produce the same plan without timestamps or environment-dependent identifiers.
3. Build the six-level decision flow for every task: context and provenance, primary outcome and
   action, impact and exceptions, evidence, bounded next action, then recovery and verification.
4. Establish one stable task-oriented design route per task. The later generation adapter must map
   it to an existing target router without collision and report unsupported integration.
5. Separate the task shell, domain-state controller, decision summary, evidence detail, and bounded
   action and recovery component. Rendering components do not own service or domain state.
6. Assign every declared interface state to one domain-state controller and preserve its behavior,
   disclosure, and recovery contract.
7. Evaluate every downstream declaration. Existing product-task, interface-trust,
   information-design, and design-deliverable files must remain inside the project root and pass
   their maintained validators. Planned contracts remain provisional. Invalid or unavailable
   existing contracts block implementation.
8. Declare semantic color, typography, spacing, shape, motion, and data-visualization roles. Do not
   generate raw design values at the planning stage.
9. Preserve declared platforms, viewports, input modes, and constraints. Require browser evidence
   for responsive order, reflow, text resize, focus, targets, and reduced motion.
10. Derive assets only from brand or content requirements. Do not add decorative assets by default.
    Every required asset needs purpose, provenance, rights, alternatives, and failure behavior.
11. Copy acceptance methods and expected evidence into verification obligations. Human methods
    remain future evidence requirements and never become generated attestations.

## Readiness States

- `blocked`: the brief is not generation-ready or a declared existing downstream contract is
  invalid, unavailable, or outside the allowed root.
- `provisional`: planning can continue, but a downstream contract or target route still requires
  confirmation.
- `ready`: every applicable downstream contract and target integration decision is confirmed. A
  ready plan still does not prove implementation or release quality.

`planningReady` authorizes bounded contract and architecture work. `implementationReady` authorizes
the next generation adapter only after all implementation prerequisites are confirmed. Neither
status authorizes release.

## Traceability

Every decision and generated section references one or more stable traces:

- `brief`: a specific brief field or record.
- `standard`: an independently maintained ZtotheZ design-engineering rule.
- `assumption`: an explicit assumption already recorded in the brief.

The compiler rejects its own output if any trace reference is missing. It does not introduce silent
assumptions, generated personas, fake routes, unsupported data behavior, or human evidence.

## Commands

```bash
npm run compile-plan -- \
  --brief path/to/product-design-brief.yaml \
  --project-root . \
  --json
```

Installed clients can use `zz-design compile-plan`. MCP clients can call
`compile_design_plan`. MCP uses `ZTOTHEZ_DESIGN_BRIEF_ROOTS`; the brief and every declared existing
downstream contract must stay inside the matched configured root.

Use `design-plan.schema.yaml` as the portable version 1.0 output contract.

## Evidence Limits

- Determinism proves repeatable transformation, not that the plan is the best product solution.
- Contract validation proves declaration consistency, not rendered or runtime behavior.
- A confirmed design route is not proof that a target application's router can accept it unchanged.
- Token requirements do not prove visual composition, contrast, or responsive behavior.
- Human-expert and representative-user obligations require attributable evidence outside the plan.
