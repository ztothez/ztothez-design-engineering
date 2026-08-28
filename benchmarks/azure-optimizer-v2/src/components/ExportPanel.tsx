import { Download, FileJson, ShieldCheck } from "lucide-react";
import type { AnalysisResult } from "../domain/analysis-client";
import type { Scenario } from "../domain/data";

interface ExportPanelProps {
  result: AnalysisResult | null;
  scenario: Scenario;
  exported: boolean;
  onExport: () => void;
}

export function ExportPanel({ result, scenario, exported, onExport }: ExportPanelProps) {
  return (
    <section className="export-panel" aria-labelledby="export-heading">
      <div className="export-copy">
        <p className="eyebrow">Evidence-preserving handoff</p>
        <h2 id="export-heading">Export current result</h2>
        <p>The JSON bundle retains environment, scenario, data origin, processing origin, source freshness, findings, evidence, and limitations.</p>
        <button id="download-provenance" className="primary-button" onClick={onExport} type="button">
          <Download aria-hidden="true" size={17} /> Download provenance JSON
        </button>
        {exported && <p className="export-success" role="status"><ShieldCheck aria-hidden="true" size={17} /> Export created with provenance.</p>}
      </div>
      <div className="export-manifest">
        <FileJson aria-hidden="true" size={26} />
        <h3>Bundle manifest</h3>
        <dl>
          <div><dt>Scenario</dt><dd>{scenario}</dd></div>
          <div><dt>Data source</dt><dd>Imported fixed comparison fixture</dd></div>
          <div><dt>Processing origin</dt><dd>{result?.processingOrigin ?? "imported snapshot; analysis not run"}</dd></div>
          <div><dt>Finding count</dt><dd>{result?.findings.length ?? 4}</dd></div>
          <div><dt>Azure connection</dt><dd>None</dd></div>
        </dl>
      </div>
    </section>
  );
}
