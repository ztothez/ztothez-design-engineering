# Product Design Brief Contract

Use this module before generating a new product interface, redesigning a consequential workflow, or
compiling downstream architecture and visual contracts. It turns product intent into a reviewable
input boundary and prevents an agent from filling missing users, data behavior, recovery, or success
criteria with generic UI conventions.

## Required Sequence

1. Record sources before conclusions. Classify user statements, research, analytics, existing
   product behavior, technical evidence, standards, and agent assumptions separately.
2. State the current problem and desired outcome using source references. An agent assumption alone
   cannot establish the product problem or primary audience.
3. Define included and excluded scope. Resolve contradictory scope before planning.
4. Identify at least one primary audience with concrete goals, operating context, constraints,
   accessibility needs, expertise, and non-agent evidence.
5. Define measurable user, operational, business, or risk-reduction outcomes. Unknown baselines are
   valid when their reason is explicit.
6. Model primary tasks with trigger, goal, frequency, criticality, inputs, data, success signal,
   failure impact, and recovery. Consequential tasks must declare their data boundary.
7. Classify each data source as live, demo, hybrid, imported, cached, user input, or local static.
   Declare latency, sensitivity, freshness, limitations, fallback, disclosure, and origin
   preservation. Configuration is not proof that a live service is connected.
8. Declare every applicable state. Async and operational products generally need loading, empty,
   success, error, partial, stale, and disconnected behavior. Sensitive products need unauthorized
   behavior. State requirements are derived from the declared data rather than added decoratively.
9. Declare platforms, viewports, input methods, constraints, and prioritized requirements. A
   responsive web product covers 375, 768, 1024, and 1440 CSS pixels plus keyboard, pointer, touch,
   and assistive-technology operation.
10. Keep assumptions visible. Unresolved high-risk assumptions block generation; unresolved
    medium-risk assumptions remain warnings.
11. Bind every must-have requirement and every task to an observable acceptance criterion. Naming a
    human verification method does not create human evidence.
12. Decide whether product-task, interface-trust, information-design, and design-deliverable
    contracts are planned, already exist, or are genuinely not applicable.

## Generation Boundary

A brief is generation-ready only when it passes semantic validation and has `status: validated`.
That status authorizes design planning, not production release. Continue through architecture,
interface trust, information design, visual design, implementation, browser verification, and the
quality gate.

Do not convert uncertainty into invented personas, fake metrics, unsupported live labels, generic
dashboard cards, or placeholder acceptance criteria. Record the uncertainty as an assumption,
assign risk, and define how it will be validated.

## Commands

Start from `product-design-brief.template.yaml`, then run:

```bash
npm run validate-brief -- --brief path/to/product-design-brief.yaml
```

MCP clients can call `validate_product_design_brief`. External brief roots must be explicitly
listed in `ZTOTHEZ_DESIGN_BRIEF_ROOTS`. The tool is read-only and returns the same structured report
as the CLI.

## Evidence Limits

- Structural and semantic validation does not prove that a proposed product is desirable.
- A source reference proves traceability, not source quality.
- Agent assumptions remain agent evidence even when a contract is validated.
- Human-expert and representative-user acceptance methods require separately attributable evidence.
- Interactive success, accessibility, responsive composition, and truthful runtime behavior require
  downstream implementation and browser evidence.
