# Operational Information Design

Use this module for dashboards, workspaces, reports, monitoring surfaces, findings queues, and any interface that presents metrics or charts to support a decision. Create an `information-design.yaml` from `information-design.template.yaml` before treating an operational surface as implementation-ready.

This contract defines decision structure. It does not award visual quality, prove runtime calculations, or substitute task declarations for attributable human evidence.

## Required Answer Flow

Make the surface answer these questions in order:

1. What environment, scope, data, source, and freshness am I viewing?
2. What changed or requires attention now?
3. What is the operational, financial, security, user, compliance, or reliability impact?
4. What evidence supports the conclusion?
5. What action should happen next, and who or what receives it?
6. How will success be verified?

Do not begin with a wall of equal-weight cards. Establish context and the primary outcome first, then exceptions, impact, findings, telemetry, evidence, and records.

## Step 1: Establish Context And Provenance

Declare the environment, scope, data description, source references, freshness, and limitations. Use explicit current, stale, unknown, or not-applicable freshness states. Current and stale data require an offset timestamp and IANA timezone.

Treat source, freshness, and comparison baseline as separate facts. A current API response does not prove that a derived metric uses the same scope. A comparison is unavailable until its baseline source and period are declared.

## Step 2: Define Decision Metrics

For every metric, declare:

- Label and plain-language definition.
- Formula, including exclusions and aggregation behavior.
- Source references, context, scope, and time period.
- Freshness and comparison baseline, or a reason the baseline is unknown or not applicable.
- Drill-down destination and limitations.
- The question it answers and the action it supports.
- Label and value-state policies.

Reject decorative metrics. A large number, trend arrow, status ring, or chart without a supported decision and drill-down consumes attention without helping the task.

Use explicit value behavior for `loading`, `available`, `missing`, `partial`, `stale`, and `error`. Never render missing as zero, partial as complete, or stale as current.

## Step 3: Structure Findings

Every finding must include severity, affected entity, observation, evidence, impact, confidence and basis, remediation, destination, and validation method. Preserve the path from finding to evidence to action to verification.

Do not use color as the only severity or state cue. Pair color with readable text, an icon, value, shape, pattern, or stable position. Do not infer confidence from severity; record them independently.

## Step 4: Justify Charts

Each chart must declare its source metrics, supported decision, drill-down, value-state policy, and accessible table or text alternative. Show a title and readable values. Show a legend or explain the direct-labeling strategy.

Remove a chart when a sentence, value, or table answers the task more directly. Never use charts as decorative proof that a dashboard is sophisticated.

## Step 5: Handle Labels And Collections

Wrap long labels by default. If truncation is necessary, provide keyboard and assistive-technology-accessible full text. Do not depend on pointer hover.

For collections over 100 items, use pagination or virtualization, provide search, and provide filtering or sorting. Declare empty, partial, and stale states. Test realistic long entity names, absent values, partial responses, stale records, and maximum expected collection size.

## Step 6: Apply The Eight-Level Hierarchy

Use this exact order for operational surfaces:

1. `context-provenance`
2. `primary-outcome-action`
3. `critical-exceptions`
4. `health-impact-metrics`
5. `prioritized-findings`
6. `operational-telemetry`
7. `evidence-audit-trail`
8. `history-exports`

Levels may share records, but each level needs declared content. Responsive layouts may change geometry, not the semantic order.

## Step 7: Declare Review Tasks

Add one or more structured tasks for all six answer questions: context, priority, impact, evidence, next action, and success verification. Reference the exact contract records needed for the expected answer and require non-color cues.

These task declarations prepare expert and representative-user review. They are not evidence that a person understood or completed the task. Record attributable review evidence separately under the V2 evidence workflow.

## Step 8: Validate And Verify

Validate the declaration:

```bash
npm run validate-information -- --contract PATH
```

Or use the MCP tool `validate_information_design`.

Resolve every error before implementation is information-design complete. Then verify rendered hierarchy, responsive reflow, value states, keyboard access, chart alternatives, and task comprehension separately.

## Rejection Patterns

- KPI cards with no definition, formula, source, period, or decision.
- Green and red states with no text or icon semantics.
- Charts that repeat a headline number without adding a comparison or diagnostic path.
- Findings without affected entities, evidence, remediation, ownership, or validation.
- Missing values displayed as zero or hidden.
- Stale values without timestamps, timezone, scope, and limitation.
- Ellipsized labels that cannot be revealed without a pointer.
- Unbounded tables that render thousands of rows without retrieval controls.
- Equal visual priority for context, exceptions, telemetry, history, and exports.
- Agent-authored task declarations presented as representative-user validation.
