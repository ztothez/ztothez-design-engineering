# Azure Optimizer V2 Implementation

## Scope

The independently tracked implementation is in `benchmarks/azure-optimizer-v2/`. The original, Lovable, UI/UX Pro Max, and first ZtotheZ candidates in the comparison repository remain unchanged.

The V2 implementation uses the normalized dataset and task model from this benchmark. It does not import candidate implementation code and does not connect to an Azure tenant.

## Contract Mapping

| Requirement | Implementation |
|---|---|
| Persistent data origin and freshness | `TrustBar.tsx` is rendered across overview, analysis, history, and export views |
| Runtime-derived processing status | `analysis-client.ts` calls the local API boundary and retains response origin |
| Explicit fallback | A 503 response exposes retry and opt-in local fallback; no automatic simulation occurs |
| Prioritized information path | Overview presents context, priority, impact, evidence, action, owner, and validation |
| Metric integrity | Every summary metric exposes definition, source, scope, period, freshness, baseline, and decision purpose |
| Detailed finding review | Finding selection exposes observation, evidence, impact, remediation, owner, and validation |
| Provenance-preserving export | Blob download contains environment, scenario, origins, freshness, scope, findings, and limitations |
| Semantic visual system | Component source uses semantic CSS variables defined in `tokens.css` |
| Focused orchestration boundary | Network and fallback behavior is isolated in `src/domain/analysis-client.ts` |

## Verified States

The `azure-v2-state-matrix` profile in `v2-journeys.json` covers:

- Demo success.
- Live local API processing over the disclosed imported fixture.
- Slow analysis.
- Backend failure followed by explicit local fallback.
- Disconnection and recovery.
- Partial result.
- Stale result.
- Detailed finding review and history.
- Export with captured Blob provenance.

## Evidence Boundary

Automated verification establishes contract selectors, network responses, downloads, layout behavior, accessibility checks, and screenshot stability in the captured environment. It does not establish visual preference, domain correctness beyond the fixture, human comprehension, or representative-user task success. Those claims remain Item 8 reviewer-supplied work.
