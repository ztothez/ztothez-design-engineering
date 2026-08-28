import type { InformationDesignReport } from "./schema.js";

export function formatInformationDesignReport(report: InformationDesignReport): string {
  const coveredQuestions = Object.entries(report.coverage.answerFlow)
    .filter(([, covered]) => covered)
    .map(([question]) => question)
    .join(", ");
  const lines = [
    "# ZtotheZ Information Design Validation",
    "",
    `- Contract: \`${report.contractId}\``,
    `- Product: ${report.product}`,
    `- Source: \`${report.sourcePath}\``,
    `- Coverage: ${report.coverage.contexts} contexts, ${report.coverage.metrics} metrics, ${report.coverage.findings} findings, ${report.coverage.charts} charts, ${report.coverage.collections} collections`,
    `- Hierarchy levels: ${report.coverage.hierarchyLevels}/8`,
    `- Answer flow: ${coveredQuestions || "none"}`,
    `- Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
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
