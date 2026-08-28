"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  AnalysisUnavailableError,
  buildProvenanceExport,
  createDisclosedFallback,
  runAnalysis,
  type AnalysisResult,
} from "../domain/analysis-client";
import { findings, snapshot, type Finding, type Scenario } from "../domain/data";
import { AnalysisPanel, type RunStatus } from "./AnalysisPanel";
import { ExportPanel } from "./ExportPanel";
import { HistoryPanel } from "./HistoryPanel";
import { Navigation, type WorkspaceView } from "./Navigation";
import { Overview } from "./Overview";
import { TrustBar } from "./TrustBar";

const scenarioLabels: Record<Scenario, string> = {
  demo: "Demo success",
  live: "Connected adapter",
  slow: "Slow analysis",
  fallback: "Backend failure and fallback",
  disconnected: "Disconnected",
  partial: "Partial result",
  stale: "Stale result",
};

function interfaceStage(view: WorkspaceView, status: RunStatus) {
  if (view === "history") return "history";
  if (view === "export") return "export";
  if (status === "loading") return "loading";
  if (status === "error") return "error";
  if (status === "complete") return "result";
  return "initial";
}

function interfaceState(scenario: Scenario, status: RunStatus, result: AnalysisResult | null) {
  if (status === "loading" && scenario === "slow") return "slow";
  if (result?.processingOrigin === "simulated" && scenario === "fallback") return "fallback";
  if (scenario === "demo" || scenario === "live") return "normal";
  return scenario;
}

export function DashboardApp({ initialScenario }: { initialScenario: Scenario }) {
  const [scenario, setScenario] = useState(initialScenario);
  const [view, setView] = useState<WorkspaceView>("overview");
  const [selected, setSelected] = useState<Finding>(findings[0]);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [exported, setExported] = useState(false);
  const stage = interfaceStage(view, status);
  const state = interfaceState(scenario, status, result);

  const pageTitle = useMemo(() => ({
    overview: "Infrastructure overview",
    analysis: "Analysis workflow",
    history: "Analysis history",
    export: "Provenance export",
  })[view], [view]);

  function changeScenario(next: Scenario) {
    setScenario(next);
    setStatus("idle");
    setResult(null);
    setError("");
    setExported(false);
    window.history.replaceState({}, "", `?state=${next}`);
  }

  async function executeAnalysis() {
    setStatus("loading");
    setError("");
    try {
      const nextResult = await runAnalysis(scenario);
      setResult(nextResult);
      setStatus("complete");
    } catch (cause) {
      setError(cause instanceof AnalysisUnavailableError ? cause.message : "Analysis failed.");
      setStatus("error");
    }
  }

  function useFallback() {
    setResult(createDisclosedFallback());
    setStatus("complete");
  }

  function reconnect() {
    changeScenario("live");
  }

  function exportResult() {
    const payload = buildProvenanceExport(result, scenario);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `azure-optimizer-${scenario}-provenance.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(true);
  }

  function showFinding(finding: Finding) {
    setSelected(finding);
    window.requestAnimationFrame(() => {
      const heading = document.getElementById("finding-detail-heading");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "nearest" });
    });
  }

  return (
    <div
      id="azure-v2-app"
      className="app-shell"
      data-ztothez-design-interface-trust
      data-ztothez-design-stage={stage}
      data-ztothez-design-state={state}
    >
      <Navigation active={view} onChange={setView} />
      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">{snapshot.environment}</p>
            <h1>{pageTitle}</h1>
            <p>Prioritize risk, inspect evidence, and preserve provenance before action.</p>
          </div>
          <label className="scenario-select">
            <span>Evidence scenario</span>
            <span className="select-control">
              <select value={scenario} onChange={(event) => changeScenario(event.target.value as Scenario)}>
                {Object.entries(scenarioLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <ChevronDown aria-hidden="true" size={16} />
            </span>
          </label>
        </header>

        <TrustBar scenario={scenario} result={result} onReconnect={reconnect} />

        <div className="workspace-content">
          {view === "overview" && (
            <Overview
              scenario={scenario}
              selected={selected}
              onSelect={showFinding}
              onAnalyze={() => setView("analysis")}
            />
          )}
          {view === "analysis" && (
            <AnalysisPanel
              scenario={scenario}
              status={status}
              result={result}
              error={error}
              onRun={executeAnalysis}
              onFallback={useFallback}
              onReconnect={reconnect}
            />
          )}
          {view === "history" && <HistoryPanel result={result} />}
          {view === "export" && <ExportPanel result={result} scenario={scenario} exported={exported} onExport={exportResult} />}
        </div>
      </main>
    </div>
  );
}
