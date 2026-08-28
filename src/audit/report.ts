import type { AuditFinding, AuditReport } from "./types.js";

function findingLocation(finding: AuditFinding): string {
  const location = finding.line
    ? `${finding.file}:${finding.line}${finding.column ? `:${finding.column}` : ""}`
    : finding.file;
  return `\`${location}\``;
}

export function formatAuditReport(report: AuditReport): string {
  const lines = [
    "# ZtotheZ Design Engineering Repository Architecture Audit",
    "",
    `- Target: \`${report.target}\``,
    `- Files scanned: ${report.filesScanned}`,
    `- Bytes scanned: ${report.bytesScanned}`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    `- Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
  ];

  if (report.skippedFiles.length > 0) {
    lines.push(`- Skipped files: ${report.skippedFiles.length}`);
  }

  if (report.findings.length === 0) {
    lines.push("", "No architecture findings were detected by the configured static rules.");
  } else {
    lines.push("", "## Findings");
    for (const finding of report.findings) {
      lines.push(
        "",
        `### ${finding.severity.toUpperCase()} ${finding.ruleId} at ${findingLocation(finding)}`,
        "",
        finding.message,
        "",
        `Confidence: ${finding.confidence}.`,
        "",
        ...finding.evidence.map((evidence) => `- Evidence: ${evidence}`),
        `- Remediation: ${finding.remediation}`,
      );
    }
  }

  lines.push(
    "",
    "## Evidence Boundary",
    "",
    "### Verifier Limitations",
    "",
    ...report.evidenceBoundary.verifierLimitations.map((entry) => `- ${entry}`),
    "",
    "### Human Review Required",
    "",
    ...report.evidenceBoundary.humanReviewRequired.map((entry) => `- ${entry}`),
  );

  return lines.join("\n");
}
