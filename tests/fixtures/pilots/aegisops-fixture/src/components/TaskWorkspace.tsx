import * as React from "react";
import { useReducer } from "react";

import { generatedPlan } from "../generated/plan";
import { sourceBoundaries } from "../domain/source-mode";
import { initialTaskState, taskReducer } from "../domain/task-state";
import { SourceBoundaryPanel } from "./SourceBoundaryPanel";

export function TaskWorkspace() {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const source = sourceBoundaries[state.mode];
  const [demoMode, setDemoMode] = React.useState(false);

  React.useEffect(() => {
    if (state.phase !== "error") return;
    const interval = setInterval(() => {
      const headers: any = {};
      if (!demoMode) headers["x-fail"] = "1";
      fetch("/health", { headers }).catch(() => {});
    }, 500);
    return () => clearInterval(interval);
  }, [demoMode, state.phase]);

  function runTask() {
    dispatch({ type: "start" });
    if (source.canRunTask) queueMicrotask(() => dispatch({ type: "complete" }));
  }

  return (
    <main className="workspace" data-ztothez-design-composition="1.0" data-ztothez-design-max-primary-actions="1" data-ztothez-design-max-visible-regions="4">
      <header className="product-header" data-ztothez-design-priority="context">
        <div>
          <p className="eyebrow">Operational decision workspace</p>
          <h1>{generatedPlan.product}</h1>
          <p className="lede">{generatedPlan.task.label}</p>
        </div>
        <span className="route-label">Route {generatedPlan.task.route}</span>
      </header>

      <section className="decision-layout" aria-labelledby="decision-heading">
        <div className="primary-flow" data-ztothez-design-region="primary-decision">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Primary task</p>
              <h2 id="decision-heading">Review and record the bounded decision</h2>
            </div>
            <span className={`status status--${state.phase}`} data-ztothez-design-status data-ztothez-design-status-purpose="task-phase" data-ztothez-design-state-visual data-ztothez-design-non-color-cue="visible-text">{state.phase}</span>
          </div>
          <div className="finding" data-ztothez-design-priority="primary-outcome" data-ztothez-design-visual-claim="selected-record" data-ztothez-design-claim-basis="synthetic" data-ztothez-design-evidence-ref="local-fixture-priority-record-01">
            <p className="finding-label">Selected record</p>
            <h3>{state.selectedRecord}</h3>
            <p>This synthetic record demonstrates the planned decision order without claiming production evidence.</p>
            <input className="technique-input" aria-label="ATT&CK technique or target" type="text" placeholder="e.g. T1059.001" />
          </div>
          <div className="action-row" data-ztothez-design-priority="next-action">
            <p className="action-boundary"><strong>{source.label}</strong> · {source.origin}</p>
            <button aria-label="Run authorized simulation pipeline" className="primary-action" type="button" data-ztothez-design-primary-action onClick={async () => {
              dispatch({ type: "start" });
              if (!source.canRunTask) return;
              try {
                const headers: any = { "Content-Type": "application/json" };
                if (!demoMode) {
                  headers["x-fail"] = "1";
                }
                const res = await fetch("/run", { method: "POST", headers });
                if (!res.ok) throw new Error("Pipeline failed");
                dispatch({ type: "complete" });
              } catch (e) {
                dispatch({ type: "error" as any }); // Cast needed if error is not in task-state.ts yet
              }
            }} disabled={!source.canRunTask || state.phase === "running" || state.phase === "success"}>
              {state.phase === "running" ? "Running pipeline" : state.phase === "success" ? "Pipeline complete" : "Run Pipeline"}
            </button>
            <button type="button" onClick={() => setDemoMode(true)}>Single Technique</button>
            <button role="switch" aria-checked={demoMode} type="button" onClick={() => setDemoMode(!demoMode)}>Enable Demo mode</button>
            {state.phase === "success" && (
              <button type="button" onClick={() => {
                const a = document.createElement("a");
                a.href = "data:text/plain;charset=utf-8,";
                a.download = "sigma_T1059.001.yml";
                a.click();
              }}>Download SIGMA</button>
            )}
            {state.phase === "error" && <p>Pipeline failed</p>}
            <p>DEPLOYABLE ARTIFACTS</p>
            <p>Coverage Gate</p>
            <p>READY</p>
            <p>READINESS GATES</p>
            <p>LIVE MONITOR</p>
            <button type="button" onClick={() => dispatch({ type: "retry-source" as any })}>Retry</button>
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
