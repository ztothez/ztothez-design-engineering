# Product Platforms And Variation

## Step 1: Establish Shared Scope

Identify products, users, workflows, entities, quality requirements, and deployment constraints that are genuinely shared. Do not create a platform from visual similarity alone.

## Step 2: Classify Variation

For each difference, record whether it is required, optional, mutually exclusive, environment-specific, customer-specific, or experimental. Assign one owner and one binding time: build, deployment, startup, workspace configuration, or runtime user choice.

## Step 3: Select A Mechanism

- Configuration for bounded values with stable behavior.
- Composition for replaceable behavior assembled from explicit contracts.
- Plugins for independently delivered capabilities with lifecycle and compatibility boundaries.
- Feature flags for controlled rollout, not permanent product modeling.
- Separate products when shared abstractions would weaken ownership or create conditional logic everywhere.

## Step 4: Protect The Platform

Version extension contracts, validate configuration, isolate tenant data, define failure behavior for optional capabilities, and keep product-specific policy outside the shared core. Track compatibility, migration, deprecation, and removal.

## Step 5: Evaluate Economics

Measure whether reuse reduces total change cost after accounting for coordination, testing combinations, release coupling, and migration. Reopen the platform decision when variation grows faster than shared value.
