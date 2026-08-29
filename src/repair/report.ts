import type { RepairReport } from "./schema.js";

export function formatRepairReport(report: RepairReport): string {
  return [
    "# Bounded Repair Report",
    "",
    `- Request: ${report.requestId}`,
    `- Target: ${report.target}`,
    `- Adapter: ${report.adapter} ${report.adapterVersion}`,
    `- Status: ${report.status}`,
    `- Reason: ${report.reason}`,
    `- Target restored: ${report.targetRestored ? "yes" : "no"}`,
    `- Unrelated files preserved: ${report.unrelatedFilesPreserved ? "yes" : "no"}`,
    `- Human evidence: ${report.humanEvidence}`,
    "",
    "## Finding Resolution",
    `- Resolved: ${report.resolvedFindingIds.length > 0 ? report.resolvedFindingIds.join(", ") : "none"}`,
    `- Unresolved: ${report.unresolvedFindingIds.length > 0 ? report.unresolvedFindingIds.join(", ") : "none"}`,
    "",
    "## Attempts",
    ...report.attempts.flatMap((attempt) => [
      `### ${attempt.id}`,
      `- Status: ${attempt.status}`,
      `- Operations: ${attempt.operationIds.length > 0 ? attempt.operationIds.join(", ") : "none"}`,
      `- Changed files: ${attempt.changedFiles.length > 0 ? attempt.changedFiles.join(", ") : "none"}`,
      `- Result: ${attempt.message}`,
    ]),
    "",
    "## Evidence Boundary",
    ...report.evidenceBoundary.verifierLimitations.map((entry) => `- Limitation: ${entry}`),
    ...report.evidenceBoundary.humanReviewRequired.map((entry) => `- Human review: ${entry}`),
  ].join("\n");
}
