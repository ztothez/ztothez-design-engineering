import type { ProductBriefReport } from "./schema.js";

export function formatProductBriefReport(report: ProductBriefReport): string {
  const lines = [
    "# ZtotheZ Product Design Brief Validation",
    "",
    `- Brief: \`${report.briefId}\``,
    `- Product: ${report.product}`,
    `- Source: \`${report.sourcePath}\``,
    `- Coverage: ${report.coverage.primaryAudiences} primary audiences, ${report.coverage.tasks} tasks, ${report.coverage.dataSources} data sources, ${report.coverage.requirements} requirements, ${report.coverage.acceptanceCriteria} acceptance criteria`,
    `- Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
    `- Contract result: ${report.passed ? "PASS" : "FAIL"}`,
    `- Generation ready: ${report.generationReady ? "YES" : "NO"}`,
  ];

  if (report.findings.length > 0) {
    lines.push("", "## Findings");
    for (const finding of report.findings) {
      lines.push(
        "",
        `### ${finding.severity.toUpperCase()}: ${finding.ruleId}`,
        "",
        `- Path: \`${finding.path}\``,
        `- Finding: ${finding.message}`,
        `- Remediation: ${finding.remediation}`,
      );
    }
  }

  lines.push("", "## Limitations", "", ...report.limitations.map((entry) => `- ${entry}`));
  return lines.join("\n");
}
