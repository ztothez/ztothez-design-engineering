import type { V4QualificationReport } from "./schema.js";

export function formatV4QualificationReport(report: V4QualificationReport): string {
  return [
    "ZtotheZ Design Engineering V4 Qualification",
    `Result: ${report.passed ? "PASS" : "FAIL"}`,
    `Human evidence: ${report.humanEvidence}`,
    "",
    ...Object.entries(report.criteria).map(([criterion, passed]) =>
      `${criterion}: ${passed ? "PASS" : "FAIL"}`,
    ),
    "",
    "Supported claims:",
    ...(report.supportedClaims.length > 0 ? report.supportedClaims.map((claim) => `- ${claim}`) : ["- none"]),
    "",
    "Limitations:",
    ...report.limitations.map((limitation) => `- ${limitation}`),
  ].join("\n");
}
