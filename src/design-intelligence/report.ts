import type { DesignDeliverableReport } from "./schema.js";

export function formatDesignDeliverableReport(report: DesignDeliverableReport): string {
  const lines = [
    "# ZtotheZ Design Intelligence Validation",
    "",
    `- Manifest: \`${report.manifestId}\``,
    `- Product: ${report.product}`,
    `- Source: \`${report.sourcePath}\``,
    `- Deliverables: ${report.deliverables.join(", ")}`,
    `- Coverage: ${report.coverage.tokens} tokens, ${report.coverage.assets} assets, ${report.coverage.icons} icons, ${report.coverage.presentations} presentations, ${report.coverage.slides} slides, ${report.coverage.contrastPairs} contrast pairs`,
    `- Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
  ];

  if (report.contrastResults.length > 0) {
    lines.push("", "## Contrast Results", "");
    for (const result of report.contrastResults) {
      lines.push(
        `- \`${result.id}\`: ${result.ratio.toFixed(2)}:1 required ${result.required.toFixed(1)}:1, ${result.passed ? "PASS" : "FAIL"}`,
      );
    }
  }

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
