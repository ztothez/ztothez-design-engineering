# Component And Package Boundaries

## Ownership Rules

- One feature owns each mutable source of truth.
- Rendering consumes state and emits user intent; domain policy decides outcomes.
- Infrastructure adapters own transport, storage, and vendor details.
- Shared components own interaction behavior and accessibility contracts, not product-specific workflow policy.
- Cross-feature communication uses explicit events, commands, or query contracts.

## Coupling Review

Reject or refactor boundaries that create:

- Cyclic package dependencies.
- Feature code importing another feature's internal modules.
- Presentation components directly coordinating network, persistence, export, and domain validation.
- Shared utilities that encode unrelated business policy.
- Prop contracts that mirror an entire store instead of the component's actual needs.
- Global state used only to avoid defining ownership.

Depend on stable abstractions only where multiple implementations, test isolation, or a consequential change requires them. A wrapper that merely renames one dependency adds indirection without reducing coupling.

## Cohesion Review

Group code by shared reason to change. Split a module when separate owners, policies, lifecycles, or verification methods are entangled. Keep code together when splitting would scatter one invariant across files or force coordination through a vague utility layer.

## Contract Checklist

Define inputs, outputs, state transitions, loading and error behavior, cancellation, retries, idempotency, accessibility semantics, telemetry, and test seams. Verify package dependency direction with tooling and verify runtime ownership through journeys and failure cases.
