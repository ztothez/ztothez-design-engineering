import type { AnalysisResult } from "../domain/analysis-client";
import { snapshot } from "../domain/data";

export function HistoryPanel({ result }: { result: AnalysisResult | null }) {
  const entries = [
    ...(result ? [{ id: result.runId, origin: result.processingOrigin, time: result.completedAt, findings: result.findings.length }] : []),
    { id: snapshot.id, origin: "imported", time: snapshot.capturedAt, findings: 4 },
  ];
  return (
    <section className="history-panel" aria-labelledby="history-heading">
      <p className="eyebrow">Provenance retained</p>
      <h2 id="history-heading">Analysis history</h2>
      <p>Every entry identifies its processing origin and source time. No scheduled monitoring is implied.</p>
      <div className="history-table-wrap">
        <table>
          <thead><tr><th>Run</th><th>Processing origin</th><th>Source or completion time</th><th>Findings</th></tr></thead>
          <tbody>{entries.map((entry) => (
            <tr key={`${entry.id}-${entry.origin}`}>
              <td>{entry.id}</td><td>{entry.origin}</td><td>{entry.time}</td><td>{entry.findings}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
