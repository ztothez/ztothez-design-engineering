import type { KnowledgeQualityReport } from "./schema.js";

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatKnowledgeQualityReport(report: KnowledgeQualityReport): string {
  const lines = [
    "# ZtotheZ Knowledge Quality Evaluation",
    "",
    `- Benchmark: \`${report.benchmarkId}\``,
    `- Authority: \`${report.authorityPath}\``,
    `- Compiled lifecycle: ${report.compiledAuthority.lifecycle}`,
    `- Admitted files: ${report.compiledAuthority.admittedFileCount}`,
    `- Retrieval files: ${report.compiledAuthority.retrievalFileCount}`,
    `- Registered rules: ${report.compiledAuthority.ruleCount}`,
    `- Overall: ${percent(report.overallScore)} required ${percent(report.overallMinimumScore)}`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    "",
    "## Quality Breakdown",
    "",
    `- Source quality: ${report.qualityBreakdown.sourceQuality.toUpperCase()}`,
    `- Retrieval quality: ${report.qualityBreakdown.retrievalQuality.toUpperCase()}`,
    `- Rule quality: ${report.qualityBreakdown.ruleQuality.toUpperCase()}`,
    `- Product outcome: ${report.qualityBreakdown.productOutcome.toUpperCase()}`,
    "",
    "## Dimensions",
    "",
  ];

  for (const dimension of report.dimensions) {
    lines.push(
      `- ${dimension.passed ? "PASS" : "FAIL"} \`${dimension.dimension}\`: ${percent(dimension.score)} required ${percent(dimension.minimumScore)}; ${dimension.passedCases}/${dimension.cases} cases`,
    );
  }

  lines.push("", "## Cases", "");
  for (const benchmarkCase of report.caseResults) {
    lines.push(
      `### ${benchmarkCase.passed ? "PASS" : "FAIL"}: ${benchmarkCase.id}`,
      "",
      `- Kind: ${benchmarkCase.kind}`,
      `- Dimension: ${benchmarkCase.dimension}`,
      `- Expected: ${benchmarkCase.expected}`,
      `- Observed: ${benchmarkCase.observed}`,
    );
    for (const finding of benchmarkCase.findings) lines.push(`- Finding: ${finding}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
