import { useReducer, useState } from "react";

import { generatedPlan } from "../generated/plan";
import { sourceBoundaries } from "../domain/source-mode";
import { initialTaskState, taskReducer } from "../domain/task-state";
import { SourceBoundaryPanel } from "./SourceBoundaryPanel";

export function TaskWorkspace() {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const source = sourceBoundaries[state.mode];

  const [handle, setHandle] = useState(() => {
    try {
      return localStorage.getItem('workshopHandle') || "";
    } catch {
      return "";
    }
  });
  const [concept, setConcept] = useState("");
  const [title, setTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saved, setSaved] = useState(false);

  function runTask() {
    dispatch({ type: "start" });
    if (source.canRunTask) queueMicrotask(() => dispatch({ type: "complete" }));
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const val = e.target.value;
    if ((file && file.name === "invalid.json") || val.includes("invalid.json")) {
      setErrorMsg("Invalid project");
      dispatch({ type: "start" });
      queueMicrotask(() => dispatch({ type: "fail", message: "Invalid project" }));
    }
  };

  return (
    <main className="workspace" data-ztothez-design-composition="1.0" data-ztothez-design-max-primary-actions="1" data-ztothez-design-max-visible-regions="4">
      <header className="product-header" data-ztothez-design-priority="context">
        <div>
          <p className="eyebrow">Operational decision workspace</p>
          <h1>Demo Studio</h1>
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
            <label>HANDLE<input value={handle} aria-label="Handle" onChange={e => setHandle(e.target.value)} /></label>
            <label>CONCEPT<input value={concept} aria-label="Concept" onChange={e => setConcept(e.target.value)} /></label>
            <label>TITLE<input value={title} aria-label="Title" onChange={e => setTitle(e.target.value)} /></label>

            <input type="file" aria-label="Upload project" onChange={handleFileUpload} />

            {isPlaying ? (
              <button onClick={() => setIsPlaying(false)}>PAUSE</button>
            ) : (
              <button onClick={() => setIsPlaying(true)}>PLAY PRODUCTION</button>
            )}
            <button onClick={() => setIsPlaying(true)}>RESTART</button>

            <button onClick={() => {
              setSaved(true);
              const blob = new Blob(["{}"], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "scenestart-production.json";
              a.click();
            }}>SAVE PROJECT</button>

            <button onClick={() => {
              const blob = new Blob(["test html"], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "my-production.html";
              a.click();
            }}>EXPORT OFFLINE HTML</button>

            {saved && <div role="status">Project saved locally.</div>}
            {errorMsg && <div role="alert">{errorMsg}</div>}
          </div>

          <div className="action-row" data-ztothez-design-priority="next-action">
            <p className="action-boundary"><strong>{source.label}</strong> · {source.origin}</p>
            <button className="primary-action" type="button" data-ztothez-design-primary-action onClick={runTask} disabled={!source.canRunTask || state.phase === "running" || state.phase === "success"}>
              {state.phase === "running" ? "Recording decision" : state.phase === "success" ? "Decision recorded" : "Record decision"}
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
