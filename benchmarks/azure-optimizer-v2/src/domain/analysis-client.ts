import { findings, snapshot, type Finding, type Scenario } from "./data";

export interface AnalysisResult {
  runId: string;
  processingOrigin: "live" | "simulated" | "cached";
  dataOrigin: string;
  completedAt: string;
  freshness: "current" | "stale";
  findings: Finding[];
  limitations: string[];
}

export class AnalysisUnavailableError extends Error {
  constructor(message: string, public readonly canUseFallback: boolean) {
    super(message);
    this.name = "AnalysisUnavailableError";
  }
}

export async function runAnalysis(scenario: Scenario, signal?: AbortSignal): Promise<AnalysisResult> {
  try {
    const response = await fetch(`/api/analyze?scenario=${scenario}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ snapshotId: snapshot.id }),
      signal,
    });
    if (!response.ok) {
      throw new AnalysisUnavailableError(
        response.status === 503 ? "The benchmark analysis adapter is unavailable." : "Analysis failed.",
        scenario === "fallback",
      );
    }
    return await response.json() as AnalysisResult;
  } catch (error) {
    if (error instanceof AnalysisUnavailableError || error instanceof DOMException) throw error;
    throw new AnalysisUnavailableError("The analysis request could not reach the benchmark adapter.", scenario === "fallback");
  }
}

export function createDisclosedFallback(): AnalysisResult {
  return {
    runId: "local-fallback-fixed-fixture",
    processingOrigin: "simulated",
    dataOrigin: snapshot.source,
    completedAt: new Date().toISOString(),
    freshness: "current",
    findings,
    limitations: ["Local fallback used after an unavailable backend.", ...snapshot.limitations],
  };
}

export function buildProvenanceExport(result: AnalysisResult | null, scenario: Scenario) {
  return {
    schemaVersion: "1.0",
    product: "Azure Optimizer V2 benchmark",
    exportedAt: new Date().toISOString(),
    environment: snapshot.environment,
    scenario,
    dataOrigin: result?.dataOrigin ?? snapshot.source,
    processingOrigin: result?.processingOrigin ?? "imported",
    sourceCapturedAt: snapshot.capturedAt,
    timezone: snapshot.timezone,
    scope: snapshot.scope,
    findings: result?.findings ?? findings,
    limitations: result?.limitations ?? snapshot.limitations,
  };
}
