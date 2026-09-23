import type { AuthorityCompilationReport } from "./schema.js";

export function formatAuthorityCompilationReport(report: AuthorityCompilationReport): string {
  const lines = [
    "# Compiled Authority Report",
    "",
    `- Result: ${report.status === "pass" ? "PASS" : "FAIL"}`,
    `- Compiler: ${report.compilerVersion}`,
    `- Authority: ${report.authorityPath}`,
    `- Lifecycle: ${report.lifecycle}`,
    `- Admitted files: ${report.admittedFileCount}`,
    `- Retrieval files: ${report.retrievalFileCount}`,
    `- Exact-read files: ${report.exactReadFileCount}`,
    `- Model entities: ${report.modelEntityCount}`,
    `- Registered rules: ${report.ruleCount}`,
    `- Payload SHA-256: ${report.payloadSha256}`,
    "",
  ];

  if (report.findings.length === 0) {
    lines.push("No compiler findings.");
  } else {
    lines.push("## Findings", "");
    for (const finding of report.findings) {
      lines.push(
        `- ${finding.ruleId} ${finding.path}: ${finding.message} Remediation: ${finding.remediation}`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
