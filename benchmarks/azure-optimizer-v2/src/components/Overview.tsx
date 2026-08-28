import { ArrowRight, PlayCircle } from "lucide-react";
import { findings, metrics, snapshot, type Finding, type Scenario } from "../domain/data";
import { FindingDetail } from "./FindingDetail";
import { FindingList } from "./FindingList";
import { HealthChart } from "./HealthChart";
import { MetricCard } from "./MetricCard";

interface OverviewProps {
  scenario: Scenario;
  selected: Finding;
  onSelect: (finding: Finding) => void;
  onAnalyze: () => void;
}

export function Overview({ scenario, selected, onSelect, onAnalyze }: OverviewProps) {
  const visibleFindings = scenario === "partial" ? findings.slice(0, 2) : findings;
  return (
    <>
      <section className="priority-brief" aria-labelledby="priority-heading">
        <div>
          <p className="eyebrow">Highest-priority decision</p>
          <h2 id="priority-heading">Memory capacity has no measured headroom</h2>
          <p>Review the production compute evidence before changing instance size or scaling policy.</p>
        </div>
        <div className="priority-impact">
          <small>Current evidence</small>
          <strong>16 of 16 GB allocated</strong>
          <span>High severity · high confidence</span>
        </div>
        <button className="primary-button" onClick={() => onSelect(findings[0])} type="button">
          Review evidence <ArrowRight aria-hidden="true" size={17} />
        </button>
      </section>

      {scenario === "partial" && (
        <div className="state-notice" data-tone="warning" role="status">
          Partial result: telemetry checks completed. Governance and backup checks are unavailable.
        </div>
      )}
      {scenario === "stale" && (
        <div className="state-notice" data-tone="warning" role="status">
          Stale result: this May 10 snapshot must be refreshed before operational decisions.
        </div>
      )}

      <section className="metric-grid" aria-label="Estate metrics">
        {metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
      </section>

      <div className="decision-grid">
        <FindingList findings={visibleFindings} selectedId={selected.id} onSelect={onSelect} />
        <FindingDetail finding={selected} />
      </div>

      <div className="evidence-grid">
        <HealthChart />
        <section className="scope-panel" aria-labelledby="scope-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Decision boundary</p>
              <h2 id="scope-heading">What this result covers</h2>
            </div>
          </div>
          <dl>
            <div><dt>Environment</dt><dd>{snapshot.environment}</dd></div>
            <div><dt>Source</dt><dd>{snapshot.source}</dd></div>
            <div><dt>Scope</dt><dd>{snapshot.scope}</dd></div>
            <div><dt>Limitation</dt><dd>{snapshot.limitations[0]}</dd></div>
          </dl>
          <button className="secondary-button" onClick={onAnalyze} type="button">
            <PlayCircle aria-hidden="true" size={17} /> Open analysis workflow
          </button>
        </section>
      </div>
    </>
  );
}
