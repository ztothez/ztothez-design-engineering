import { useReducer, useState } from "react";

import { generatedPlan } from "../generated/plan";
import { sourceBoundaries } from "../domain/source-mode";
import { initialTaskState, taskReducer } from "../domain/task-state";
import { SourceBoundaryPanel } from "./SourceBoundaryPanel";

export function TaskWorkspace() {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const source = sourceBoundaries[state.mode];

  function runTask() {
    dispatch({ type: "start" });
    if (source.canRunTask) queueMicrotask(() => dispatch({ type: "complete" }));
  }

  return (
    <main className="workspace" data-ztothez-design-composition="1.0" data-ztothez-design-max-primary-actions="1" data-ztothez-design-max-visible-regions="4">
      <header className="product-header" data-ztothez-design-priority="context">
        <div>
          <p className="eyebrow">Azure estate optimization</p>
          <h1>{generatedPlan.product}</h1>
          <p className="lede">{generatedPlan.task.label}</p>
        </div>
        <span className="route-label">Route {generatedPlan.task.route}</span>
      </header>

      <section className="decision-layout" aria-labelledby="decision-heading">
        <div className="primary-flow" data-ztothez-design-region="primary-decision">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Overview</p>
              <h2 id="decision-heading">Potential Savings</h2>
            </div>
            <span className={`status status--${state.phase}`} data-ztothez-design-status data-ztothez-design-status-purpose="task-phase" data-ztothez-design-state-visual data-ztothez-design-non-color-cue="visible-text">{state.phase}</span>
          </div>
          <dl className="source-facts" aria-label="Local demonstration summary">
            <div><dt>Tracked resources</dt><dd>24</dd></div>
            <div><dt>Potential monthly savings</dt><dd>EUR 1,240</dd></div>
            <div><dt>Current findings</dt><dd>3</dd></div>
          </dl>
          <div className="finding" data-ztothez-design-priority="primary-outcome" data-ztothez-design-visual-claim="selected-record" data-ztothez-design-claim-basis="synthetic" data-ztothez-design-evidence-ref="local-fixture-priority-record-01">
            <p className="finding-label">Top Recommendations</p>
            <h3>Right-size {state.selectedRecord}</h3>
            <p>Local fixture evidence indicates sustained low utilization. Validate a smaller instance class in a non-production environment before changing capacity.</p>
            <p><strong>Limitation:</strong> This estimate is demonstration data and does not describe a connected Azure tenant.</p>
          </div>
          <div className="action-row" data-ztothez-design-priority="next-action">
            <p className="action-boundary"><strong>{source.label}</strong> · {source.origin}</p>
            <button type="button" aria-expanded={analysisVisible} onClick={() => setAnalysisVisible(true)}>Analysis</button>
            <button className="primary-action" type="button" data-ztothez-design-primary-action onClick={runTask} disabled={!analysisVisible || !source.canRunTask || state.phase === "running" || state.phase === "success"}>
              {state.phase === "running" ? "Running AI audit" : state.phase === "success" ? "Analysis complete" : "Run AI Audit"}
            </button>
            <button type="button" onClick={() => dispatch({ type: "return-to-review" })}>Return to review</button>
          </div>
          <ol className="answer-flow">
            {generatedPlan.informationFlow.map((entry) => (
              <li key={entry.id}><span>{entry.order}</span><div><strong>{entry.label}</strong><p>{entry.purpose}</p></div></li>
            ))}
          </ol>
        </div>

        <aside className="recovery" aria-labelledby="recovery-heading" data-ztothez-design-region="recovery">
          <p className="eyebrow">Recovery path</p>
          <h2 id="recovery-heading">Preserve context when a source is unavailable</h2>
          <p aria-live="polite" className="task-message">{state.message}</p>
          {!source.canRunTask && (
            <div className="recovery-actions">
              <button type="button" onClick={() => dispatch({ type: "retry-source" })}>Retry source</button>
              <button type="button" onClick={() => dispatch({ type: "use-demo-fallback" })}>Use disclosed demo fallback</button>
            </div>
          )}
          <p className="evidence-boundary">This fixture validates generated structure and state behavior. It does not prove live connectivity, rendered accessibility, product usability, or release readiness.</p>
        </aside>
      </section>

      <SourceBoundaryPanel mode={state.mode} onChange={(mode) => dispatch({ type: "select-mode", mode })} />
    </main>
  );
}
