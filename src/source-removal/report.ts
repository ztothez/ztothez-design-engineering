import type { SourceRemovalQualificationReport } from "./schema.js";

export function formatSourceRemovalQualificationReport(report: SourceRemovalQualificationReport): string {
  const lines = [
    "# Source-Removal Qualification",
    "",
    `- Status: ${report.passed ? "PASS" : "FAIL"}`,
    `- Benchmark: ${report.benchmarkId}`,
    `- Authority: ${report.authorityPath}`,
    `- Admitted files: ${report.admittedFileCount}`,
    `- Retrieval files: ${report.retrievalFileCount}`,
    `- Removed artifacts: ${report.removedArtifactCount}`,
    `- Private sources used: ${report.privateSourcesUsed ? "yes" : "no"}`,
    `- Reference archives present: ${report.referenceArchivesPresent ? "yes" : "no"}`,
    `- Rollback boundary retained: ${report.documentBoundaryRetainedForRollback ? "yes" : "no"}`,
    "",
    "## Query Coverage",
    "",
    ...report.queryResults.map((entry) => [
      `### ${entry.id}`,
      "",
      `- Class: ${entry.queryClass}`,
      `- Status: ${entry.status.toUpperCase()}`,
      `- Expected: ${entry.expected}`,
      `- Observed: ${entry.observed}`,
      ...(entry.matchedPath ? [`- Match: ${entry.matchedPath}`, `- Confidence: ${entry.confidence}`] : []),
      ...(entry.findings.length > 0 ? ["- Findings:", ...entry.findings.map((finding) => `  - ${finding}`)] : []),
      "",
    ].join("\n")),
    "## Limitations",
    "",
    ...report.limitations.map((limitation) => `- ${limitation}`),
  ];
  return lines.join("\n");
}
