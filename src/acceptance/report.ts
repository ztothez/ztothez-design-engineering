import type { AcceptanceReport } from "./types.js";

export function formatAcceptanceReport(report: AcceptanceReport): string {
  const lines = [
    "# ZtotheZ Design Engineering Acceptance Evidence",
    "",
    `- Contract: \`${report.contractId}\``,
    `- Profile: \`${report.profile}\``,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    `- Criteria: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.unverified} unverified`,
  ];
  for (const criterion of report.criteria) {
    lines.push(
      "",
      `## ${criterion.status.toUpperCase()} ${criterion.id}`,
      "",
      `${criterion.title} (${criterion.severity}).`,
      `Journeys: ${criterion.journeys.join(", ") || "none"}.`,
    );
    for (const evidence of criterion.evidence) {
      lines.push(
        "",
        `- **${evidence.type}: ${evidence.status.toUpperCase()}** - ${evidence.message}`,
        ...evidence.evidence.map((entry) => `  - ${entry}`),
      );
    }
  }
  return lines.join("\n");
}
