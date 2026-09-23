import type { ModelValidationReport } from "./schema.js";

export function formatModelValidationReport(report: ModelValidationReport): string {
  const lines = [
    "# ZtotheZ Design Engineering Model Validation",
    "",
    `- Status: ${report.status.toUpperCase()}`,
    `- Lifecycle: ${report.lifecycle}`,
    `- Entities: ${report.entityCount}`,
    `- Relationships: ${report.relationshipCount}`,
    `- Conflicts: ${report.conflictCount}`,
    `- Decision traces: ${report.decisionTraceCount}`,
    `- Findings: ${report.findingCount}`,
    "",
    "## Category Coverage",
    "",
    ...Object.entries(report.categoryCoverage).map(([category, count]) => `- ${category}: ${count}`),
  ];

  if (report.findings.length > 0) {
    lines.push("", "## Findings", "");
    for (const finding of report.findings) {
      lines.push(
        `- ${finding.severity.toUpperCase()} ${finding.ruleId} at ${finding.path}: ${finding.message}`,
        `  Remediation: ${finding.remediation}`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
