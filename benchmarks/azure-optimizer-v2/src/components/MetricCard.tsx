import { CircleAlert, CircleCheck, CircleDollarSign, Layers3 } from "lucide-react";
import type { MetricContract } from "../domain/data";

const icons = {
  resources: Layers3,
  savings: CircleDollarSign,
  issues: CircleAlert,
  health: CircleCheck,
};

export function MetricCard({ metric }: { metric: MetricContract }) {
  const Icon = icons[metric.id as keyof typeof icons] ?? CircleCheck;
  return (
    <article className="metric-card" data-tone={metric.tone}>
      <div className="metric-heading">
        <span>{metric.label}</span>
        <Icon aria-hidden="true" size={18} />
      </div>
      <strong className="metric-value">{metric.value}</strong>
      <p className="metric-change">{metric.change}</p>
      <details className="metric-contract">
        <summary>Metric definition and evidence</summary>
        <dl>
          <div><dt>Definition</dt><dd>{metric.definition}</dd></div>
          <div><dt>Source</dt><dd>{metric.source}</dd></div>
          <div><dt>Scope</dt><dd>{metric.scope}</dd></div>
          <div><dt>Period</dt><dd>{metric.period}</dd></div>
          <div><dt>Freshness</dt><dd>{metric.freshness}</dd></div>
          <div><dt>Baseline</dt><dd>{metric.baseline}</dd></div>
          <div><dt>Decision</dt><dd>{metric.decision}</dd></div>
        </dl>
      </details>
    </article>
  );
}
