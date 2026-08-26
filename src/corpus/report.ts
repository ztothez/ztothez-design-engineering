import type { CorpusReport } from "./schema.js";

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCorpusReport(report: CorpusReport): string {
  const lines = [
    "# ZtotheZ Corpus Benchmark",
    "",
    `- Corpus: \`${report.corpusId}\` version ${report.corpusVersion}`,
    `- Sources: ${report.sources}`,
    `- Cases: ${report.caseResults.length} total, ${report.positiveCases} positive, ${report.negativeCases} negative`,
    `- Overall: ${percent(report.overallScore)} required ${percent(report.overallMinimumScore)}`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    "",
    "## Dimensions",
    "",
  ];

  for (const dimension of report.dimensions) {
    const rank = dimension.meanReciprocalRank === undefined
      ? ""
      : `; MRR ${dimension.meanReciprocalRank.toFixed(4)} required ${(dimension.minimumMeanReciprocalRank ?? 0).toFixed(4)}`;
    lines.push(
      `- ${dimension.passed ? "PASS" : "FAIL"} \`${dimension.dimension}\`: ${percent(dimension.score)} required ${percent(dimension.minimumScore)}; ${dimension.passedCases}/${dimension.cases} cases${rank}`,
    );
  }

  lines.push("", "## Provenance", "");
  for (const source of report.sourceRecords) {
    lines.push(
      `- \`${source.id}\`: ${source.title}; ${source.origin}; owner ${source.owner}; license ${source.license}; evidence \`${source.evidence}\`${source.sourceUrl ? `; source ${source.sourceUrl}` : ""}`,
    );
  }

  lines.push("", "## Cases", "");
  for (const benchmarkCase of report.caseResults) {
    lines.push(
      `### ${benchmarkCase.passed ? "PASS" : "FAIL"}: ${benchmarkCase.id}`,
      "",
      `- Dimension: ${benchmarkCase.dimension}`,
      `- Polarity: ${benchmarkCase.polarity}`,
      `- Source: ${benchmarkCase.source}`,
      `- Expected: ${benchmarkCase.expected}`,
      `- Observed: ${benchmarkCase.observed}`,
      "",
    );
  }

  return lines.join("\n").trimEnd();
}
