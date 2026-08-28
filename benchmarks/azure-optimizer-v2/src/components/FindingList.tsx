import { ArrowRight } from "lucide-react";
import type { Finding } from "../domain/data";

interface FindingListProps {
  findings: Finding[];
  selectedId: string;
  onSelect: (finding: Finding) => void;
}

export function FindingList({ findings, selectedId, onSelect }: FindingListProps) {
  return (
    <section className="findings-panel" aria-labelledby="findings-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Prioritized review queue</p>
          <h2 id="findings-heading">Findings</h2>
        </div>
        <span className="count-label">{findings.length} evidenced</span>
      </div>
      <ol className="finding-list">
        {findings.map((finding) => (
          <li key={finding.id}>
            <button
              className="finding-row"
              data-finding-id={finding.id}
              data-selected={selectedId === finding.id}
              onClick={() => onSelect(finding)}
              type="button"
            >
              <span className="finding-rank" aria-label={`Priority ${finding.rank}`}>{finding.rank}</span>
              <span className="finding-copy">
                <span className="finding-meta">
                  <span className="severity" data-severity={finding.severity}>{finding.severity}</span>
                  <span>{finding.id}</span>
                  <span>{finding.affectedScope}</span>
                </span>
                <strong>{finding.title}</strong>
                <span>{finding.impact}</span>
              </span>
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
