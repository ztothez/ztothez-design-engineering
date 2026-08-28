# Product Task Contracts

Product task contracts prevent a generic dashboard checklist from replacing the actual purpose of
a product. Contract version `1.1` adds an archetype-aware `benchmark` block to the existing actors,
modes, states, outputs, acceptance criteria, journeys, and viewports.

## Required Workflow

1. Select the closest archetype from `archetype-profiles.yaml`.
2. Declare whether the product surface is browser, desktop, or source-only.
3. Mark all seven quality dimensions as required or not applicable and explain every decision.
4. Define at least one primary task from observable start state to observable success.
5. Define at least one visible failure and recovery path.
6. Bind browser tasks to an existing journey, route, and viewport no wider than 768 CSS pixels.
7. Keep missing evidence as `unverified`, executed failure as `failed`, and unsupported capability as
   `limitation`.
8. Compare implementations only when they share the same task-contract ID, archetype, primary task
   intent, and observable success.

## Evidence Boundary

A valid contract proves that the task and evidence requirements are coherent. It does not prove the
product completed the task. Runtime and acceptance evidence establish behavior later. Missing
runtime results are not product failures, and an executed failed journey is not a verifier
limitation.

Source-only tools can activate source audit, architecture, state, and maintainability requirements
without declaring browser routes or responsive evidence. Browser products cannot omit their narrow
task path or call it not applicable.
