import type { PublicContentReport } from "./schema.js";

export function formatPublicContentReport(report: PublicContentReport): string {
  const lines = [
    "# Public Content Gate",
    "",
    `- Status: ${report.status.toUpperCase()}`,
    `- Policy: ${report.policyId}`,
    `- Scan mode: ${report.scannedMode}`,
    `- Files scanned: ${report.filesScanned}`,
    `- Evidence files: ${report.evidenceFiles}`,
    `- Classified evidence files: ${report.classifiedEvidenceFiles}`,
    `- Findings: ${report.findingCount}`,
  ];

  if (report.findings.length > 0) {
    lines.push("", "## Findings", "");
    for (const finding of report.findings) {
      lines.push(
        `- [${finding.severity.toUpperCase()}] ${finding.ruleId} ${finding.path}: ${finding.message} Remediation: ${finding.remediation}`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
