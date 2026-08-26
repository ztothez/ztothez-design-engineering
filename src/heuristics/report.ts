import { stringify } from "yaml";

import type { HeuristicAcceptanceCandidate, HeuristicReviewReport } from "./schema.js";

export function formatAcceptanceCandidates(
  candidates: HeuristicAcceptanceCandidate[],
): string {
  return stringify({
    acceptanceCriteria: candidates.map(({ sourceFinding: _sourceFinding, ...criterion }) =>
      criterion,
    ),
  }).trimEnd();
}

export function formatHeuristicReviewReport(report: HeuristicReviewReport): string {
  const lines = [
    "# ZtotheZ Design Engineering Heuristic Review",
    "",
    `- Review: \`${report.reviewId}\``,
    `- Product: ${report.product}`,
    `- Source: \`${report.sourcePath}\``,
    `- Findings: ${report.summary.total} total, ${report.summary.open} open, ${report.summary.resolved} resolved, ${report.summary.acceptedRisk} accepted risk`,
    `- Major and catastrophic findings: ${report.summary.severity3} severity 3, ${report.summary.severity4} severity 4`,
    `- Acceptance candidates: ${report.summary.acceptanceCandidates}`,
    `- Result: ${report.requiresAcceptanceWork ? "ACCEPTANCE WORK REQUIRED" : "NO OPEN SEVERITY 3-4 FINDINGS"}`,
    "",
    "Evidence levels remain distinct. This report is expert-review input, not a human acceptance attestation or representative-user usability-test result.",
  ];

  if (report.findings.length > 0) lines.push("", "## Findings");
  for (const finding of report.findings) {
    lines.push(
      "",
      `### Severity ${finding.severity}: ${finding.title}`,
      "",
      `- ID: \`${finding.id}\``,
      `- Task: \`${finding.task}\``,
      `- Heuristic: ${finding.heuristic.name} (\`${finding.heuristic.id}\`)`,
      `- Status: ${finding.status}`,
      `- Confidence: ${finding.confidence}`,
      `- Location: ${finding.location}`,
      `- Observation: ${finding.observation}`,
      `- Impact: ${finding.impact}`,
      `- Remediation: ${finding.remediation}`,
      `- Validation: ${finding.validation.method}: ${finding.validation.procedure}`,
      ...finding.evidence.map(
        (entry) => `- Evidence (${entry.level}): ${entry.source}: ${entry.detail}`,
      ),
    );
  }

  if (report.acceptanceCandidates.length > 0) {
    lines.push(
      "",
      "## Acceptance-Criterion Candidates",
      "",
      "Review and merge these proposals into the applicable product contract. They are not attestations and are not applied automatically.",
      "",
      "```yaml",
      formatAcceptanceCandidates(report.acceptanceCandidates),
      "```",
      "",
      ...report.acceptanceCandidates.map(
        (candidate) => `- \`${candidate.id}\` originates from finding \`${candidate.sourceFinding}\`.`,
      ),
    );
  }

  return lines.join("\n");
}
