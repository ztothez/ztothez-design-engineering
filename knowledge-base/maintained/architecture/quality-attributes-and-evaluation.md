# Quality Attributes And Architecture Evaluation

Use this lightweight Architecture Tradeoff Analysis Method, or ATAM, workflow to build a utility tree and identify sensitivity points and trade-off points from measurable scenarios.

## Step 1: Define Scenarios

Write each consequential quality requirement as:

```text
source -> stimulus -> environment -> affected artifact -> response -> measurable result
```

Cover normal operation, a likely change, and a stress or failure condition. Prefer observable measures such as completion rate, response latency, recovery time, changed modules, supported viewport, or evidence requirement.

## Step 2: Build A Utility Tree

Group scenarios under usability, accessibility, modifiability, reliability, performance, security, portability, and variability. Rank business importance and implementation risk independently. Evaluate high-importance or high-risk scenarios first.

## Step 3: Inspect Decisions

For each scenario, identify:

- The decision that enables or threatens it.
- Sensitivity points where a small change strongly affects the result.
- Trade-off points where one decision improves one attribute while weakening another.
- Assumptions that lack current evidence.
- Risks, non-risks, and required follow-up evidence.

## Step 4: Record The Decision

Record context, selected option, alternatives, rationale, affected attributes, constraints, evidence, reversal trigger, and migration cost. Do not use an architecture decision record to justify an option after the fact.

## Step 5: Verify

Trace scenarios through logical components, source packages, runtime processes, deployment boundaries, and representative user journeys. Static structure cannot prove runtime recovery, accessibility, usability, or performance; pair each claim with the appropriate evidence method.
