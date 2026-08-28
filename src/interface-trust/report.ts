import type { InterfaceTrustReport } from "./schema.js";

export function formatInterfaceTrustReport(report: InterfaceTrustReport): string {
  const coveredScenarios = Object.entries(report.coverage.scenarios)
    .filter(([, covered]) => covered)
    .map(([scenario]) => scenario)
    .join(", ");
  const lines = [
    "# ZtotheZ Interface Trust Validation",
    "",
    `- Contract: \`${report.contractId}\``,
    `- Product: ${report.product}`,
    `- Source: \`${report.sourcePath}\``,
    `- Coverage: ${report.coverage.sources} sources, ${report.coverage.states} states, ${report.coverage.claims} claims, ${report.coverage.actions} actions`,
    `- Scenarios: ${coveredScenarios || "none"}`,
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
