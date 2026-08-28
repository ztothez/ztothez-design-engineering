import { AlertTriangle, CircleCheck, Database, Link2Off } from "lucide-react";
import type { AnalysisResult } from "../domain/analysis-client";
import { snapshot, type Scenario } from "../domain/data";

interface TrustBarProps {
  scenario: Scenario;
  result: AnalysisResult | null;
  onReconnect: () => void;
}

export function TrustBar({ scenario, result, onReconnect }: TrustBarProps) {
  const disconnected = scenario === "disconnected";
  const fallback = scenario === "fallback";
  const stale = scenario === "stale" || result?.freshness === "stale";
  const livePath = scenario === "live" || scenario === "slow";
  const mode = stale || disconnected ? "cached" : livePath ? "live" : fallback ? "hybrid" : scenario === "partial" ? "imported" : "demo";
  const origin = fallback ? "simulated" : result?.processingOrigin ?? (stale || disconnected ? "cached" : "imported");

  return (
    <section className="trust-bar" aria-label="Data and processing provenance">
      <div className="trust-item trust-mode">
        <Database aria-hidden="true" size={17} />
        <span>
          <small>Data mode</small>
          <strong data-ztothez-design-data-mode={mode}>Data mode: {mode}</strong>
        </span>
      </div>
      <div className="trust-item">
        {disconnected ? <Link2Off aria-hidden="true" size={17} /> : <CircleCheck aria-hidden="true" size={17} />}
        <span>
          <small>Connection</small>
          <strong data-ztothez-design-connection={disconnected ? "disconnected" : fallback ? "degraded" : livePath ? "connected" : "local"}>
            {disconnected ? "Connection: disconnected" : fallback ? "Connection: degraded local adapter" : livePath ? "Connection: local analysis API" : "Connection: local fixture only"}
          </strong>
          {disconnected && <button className="trust-recovery" data-ztothez-design-recovery-action onClick={onReconnect} type="button">Reconnect</button>}
        </span>
      </div>
      <div className="trust-item">
        {fallback ? <AlertTriangle aria-hidden="true" size={17} /> : <Database aria-hidden="true" size={17} />}
        <span>
          <small>Processing origin</small>
          <strong data-ztothez-design-result-origin={origin}>
            {fallback ? "Result origin: disclosed local fallback simulation" : `Result origin: ${origin}`}
          </strong>
        </span>
      </div>
      <div className="trust-item">
        <span>
          <small>Source freshness</small>
          <strong
            data-ztothez-design-freshness={stale ? "stale" : "current"}
            data-ztothez-design-timestamp={snapshot.capturedAt}
            data-ztothez-design-timezone={snapshot.timezone}
          >
            {stale ? "Stale snapshot" : "Snapshot"}: May 10, 2024 10:30 EEST
          </strong>
        </span>
      </div>
    </section>
  );
}
