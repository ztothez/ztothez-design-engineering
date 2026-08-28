import { CheckCircle2, ClipboardCheck, Database, ShieldAlert } from "lucide-react";
import type { Finding } from "../domain/data";

export function FindingDetail({ finding }: { finding: Finding }) {
  return (
    <aside className="finding-detail" aria-labelledby="finding-detail-heading">
      <div className="detail-heading">
        <span className="severity" data-severity={finding.severity}>{finding.severity}</span>
        <span>{finding.confidence} confidence</span>
      </div>
      <p className="eyebrow">Priority {finding.rank} · {finding.id}</p>
      <h2 id="finding-detail-heading" tabIndex={-1}>{finding.title}</h2>
      <p className="detail-impact">{finding.impact}</p>
      <dl className="detail-grid">
        <div>
          <dt><ShieldAlert aria-hidden="true" size={16} />Observation</dt>
          <dd>{finding.observation}</dd>
        </div>
        <div>
          <dt><Database aria-hidden="true" size={16} />Evidence</dt>
          <dd><ul>{finding.evidence.map((item) => <li key={item}>{item}</li>)}</ul></dd>
        </div>
        <div>
          <dt><CheckCircle2 aria-hidden="true" size={16} />Recommended action</dt>
          <dd>{finding.action}<span className="detail-owner">Owner: {finding.owner}</span></dd>
        </div>
        <div>
          <dt><ClipboardCheck aria-hidden="true" size={16} />Validation</dt>
          <dd>{finding.validation}</dd>
        </div>
      </dl>
    </aside>
  );
}
