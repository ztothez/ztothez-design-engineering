"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, Play, RotateCcw, Wifi } from "lucide-react";
import type { AnalysisResult } from "../domain/analysis-client";
import type { Scenario } from "../domain/data";

export type RunStatus = "idle" | "loading" | "error" | "complete";

interface AnalysisPanelProps {
  scenario: Scenario;
  status: RunStatus;
  result: AnalysisResult | null;
  error: string;
  onRun: () => void;
  onFallback: () => void;
  onReconnect: () => void;
}

export function AnalysisPanel(props: AnalysisPanelProps) {
  const { scenario, status, result, error, onRun, onFallback, onReconnect } = props;
  const slow = scenario === "slow";
  const disconnected = scenario === "disconnected";

  return (
    <section className="analysis-layout" aria-labelledby="analysis-heading">
      <div className="analysis-intro">
        <p className="eyebrow">Controlled benchmark workflow</p>
        <h2 id="analysis-heading">Run infrastructure analysis</h2>
        <p>The API evaluates the fixed imported fixture. It does not connect to or modify an Azure tenant.</p>
        <dl className="analysis-contract">
          <div><dt>Input</dt><dd>azure-benchmark-2024-05-10</dd></div>
          <div><dt>Processing path</dt><dd>{scenario === "live" || slow ? "Local HTTP analysis adapter" : "Declared benchmark simulation"}</dd></div>
          <div><dt>Consequence</dt><dd>Read-only report generation</dd></div>
          <div><dt>Fallback</dt><dd>{scenario === "fallback" ? "Available only after explicit confirmation" : "Not used"}</dd></div>
        </dl>
        {disconnected ? (
          <button id="reconnect-adapter" className="primary-button" data-ztothez-design-recovery-action onClick={onReconnect} type="button">
            <Wifi aria-hidden="true" size={17} /> Reconnect benchmark adapter
          </button>
        ) : (
          <button id="run-analysis" className="primary-button" data-ztothez-design-consequential-action onClick={onRun} type="button" disabled={status === "loading"}>
            {status === "loading" ? <LoaderCircle className="spin" aria-hidden="true" size={17} /> : <Play aria-hidden="true" size={17} />}
            {status === "loading" ? "Analysis in progress" : status === "complete" ? "Run analysis again" : "Run analysis"}
          </button>
        )}
      </div>

      <div className="analysis-status" aria-live="polite" aria-busy={status === "loading"}>
        {status === "idle" && !disconnected && (
          <div className="empty-status">
            <Play aria-hidden="true" size={24} />
            <h3>Ready to analyze</h3>
            <p>Processing origin and limitations will remain visible through the result.</p>
          </div>
        )}
        {disconnected && (
          <div className="empty-status" data-tone="warning">
            <Wifi aria-hidden="true" size={24} />
            <h3>Adapter disconnected</h3>
            <p>No analysis will run until the local benchmark adapter reconnects.</p>
          </div>
        )}
        {status === "loading" && (
          <div className="run-progress">
            <LoaderCircle className="spin" aria-hidden="true" size={26} />
            <h3>{slow ? "Analysis is taking longer than expected" : "Analyzing imported fixture"}</h3>
            <p>{slow ? "Input is preserved. You can continue waiting without restarting." : "Validating inventory, telemetry, and governance evidence."}</p>
            <ol><li data-complete>Load declared fixture</li><li>Evaluate evidence</li><li>Assemble report</li></ol>
          </div>
        )}
        {status === "error" && (
          <div className="run-error">
            <AlertTriangle aria-hidden="true" size={26} />
            <h3>Analysis adapter unavailable</h3>
            <p>{error} The imported input remains available.</p>
            <div className="button-row">
              <button className="secondary-button" onClick={onRun} type="button"><RotateCcw aria-hidden="true" size={17} /> Retry</button>
              {scenario === "fallback" && <button id="use-local-fallback" className="primary-button" onClick={onFallback} type="button">Use disclosed local fallback</button>}
            </div>
          </div>
        )}
        {status === "complete" && result && (
          <div className="run-complete">
            <CheckCircle2 aria-hidden="true" size={26} />
            <p className="eyebrow">Analysis complete</p>
            <h3>{result.findings.length} findings assembled</h3>
            <p>Processing origin: <strong>{result.processingOrigin}</strong>. Data origin: {result.dataOrigin}.</p>
            <dl>
              <div><dt>Run ID</dt><dd>{result.runId}</dd></div>
              <div className="dynamic-value"><dt>Completed</dt><dd>{result.completedAt}</dd></div>
              <div><dt>Freshness</dt><dd>{result.freshness}</dd></div>
              <div><dt>Limitations</dt><dd>{result.limitations.join(" ")}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
