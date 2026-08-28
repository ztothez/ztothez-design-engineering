# V3 Promoted Rule Set

These independently authored rules convert recurring portfolio findings into deterministic design-engineering checks. They do not contain project source, product-specific styling, private evidence, or copied third-party implementation.

## Semantic Token Boundary

- Report code: `ZTDE-DESIGN-001`
- Boundary: flag repeated raw color, spacing, and radius values in authored interface styles when semantic tokens should define the visual system.
- Accept: declared semantic tokens and token references.
- Abstain: generated drawing code and contexts where literal values are part of a data or canvas operation.
- Migration: introduce semantic tokens by role, replace repeated literals incrementally, and verify contrast and composition after migration.

## Interactive Control Integrity

- Report code: `ZTDE-SLOP-003`
- Boundary: flag rendered interactive controls that expose an action affordance without an action contract.
- Accept: controls connected to an explicit event or form behavior.
- Abstain: test-only fixtures and non-production examples excluded by audit policy.
- Migration: bind the control to a real task action, provide pending, success, empty, and error states where relevant, then verify keyboard operation.

## Component Review Threshold

- Report code: `ZTDE-ARCH-001`
- Boundary: flag rendering components above the maintained 400-line review threshold.
- Accept: focused rendering components below the threshold.
- Abstain: long non-rendering modules where component-size analysis is not applicable.
- Migration: separate domain state, data access, rendering regions, and reusable controls along existing ownership boundaries. Do not split files mechanically when responsibilities remain coupled.

## Verification

Each rule has a maintained positive, negative, and abstention fixture under `rule-fixtures/`. The regression suite materializes every fixture and executes the production repository auditor. Candidate-specific holdout reports and local portfolio evidence remain private and excluded from package output.
