import type { DataMode } from "../domain/source-mode";
import { sourceBoundaries } from "../domain/source-mode";

const modes: DataMode[] = ["demo", "imported", "cached", "live"];

export function SourceBoundaryPanel({ mode, onChange }: { mode: DataMode; onChange: (mode: DataMode) => void }) {
  const source = sourceBoundaries[mode];
  return (
    <section className="source-panel" aria-labelledby="source-heading" data-ztothez-design-data-mode={mode} data-ztothez-design-region="source-boundary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Data boundary</p>
          <h2 id="source-heading">{source.label}</h2>
        </div>
        <span className={`status status--${mode}`} data-ztothez-design-status data-ztothez-design-status-purpose="data-origin" data-ztothez-design-state-visual data-ztothez-design-non-color-cue="visible-text">{mode}</span>
      </div>
      <div className="mode-control" aria-label="Inspect data modes">
        {modes.map((entry) => (
          <button key={entry} type="button" aria-pressed={entry === mode} onClick={() => onChange(entry)}>
            {entry}
          </button>
        ))}
      </div>
      <dl className="source-facts">
        <div><dt>Origin</dt><dd>{source.origin}</dd></div>
        <div><dt>Freshness</dt><dd>{source.freshness}</dd></div>
        <div><dt>Connection</dt><dd>{source.connection}</dd></div>
      </dl>
      <p className="limitation"><strong>Limitation:</strong> {source.limitation}</p>
    </section>
  );
}
