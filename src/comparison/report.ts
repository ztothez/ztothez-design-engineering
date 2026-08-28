import type { ComparisonReport } from "./schema.js";

export function formatComparisonReport(report: ComparisonReport): string {
  const lines = [
    "# ZtotheZ Design Engineering Interface Comparison",
    "",
    `- Methodology: \`${report.methodologyId}\``,
    `- Review: \`${report.reviewId}\``,
    `- Validation: ${report.passed ? "PASS" : "FAIL"}`,
    `- Release ready: ${report.releaseReady ? "YES" : "NO"}`,
    `- Required stages: ${report.summary.passedRequiredStages}/${report.summary.requiredStages} passed`,
    `- Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
    `- Claims: ${report.summary.verifiedClaims}/${report.summary.claims} verified`,
    `- Human-expert sessions: ${report.humanReview.completeHumanExpertSessions}/${report.humanReview.minimumHumanExpertSessions} required complete (${report.humanReview.humanExpertSessions} supplied)`,
    `- Representative-user sessions: ${report.humanReview.completeRepresentativeUserSessions}/${report.humanReview.minimumRepresentativeUserSessions} required complete (${report.humanReview.representativeUserSessions} supplied)`,
    `- Counterbalanced orders: ${report.humanReview.distinctCandidateOrders}/${report.humanReview.minimumCounterbalancedOrders} required`,
    `- Blinded reviewer sessions: ${report.humanReview.blindedReviewerSessions}`,
    `- Target benchmark: ${report.benchmarkDecision.configured ? (report.benchmarkDecision.passed ? "PASS" : "INCOMPLETE OR FAIL") : "not configured"}`,
    "",
    "Evidence levels remain distinct. Validation does not convert AI inspection into human-expert or representative-user evidence.",
  ];

  if (report.stageResults.length > 0) {
    lines.push("", "## Required Stages", "");
    for (const stage of report.stageResults) {
      lines.push(
        `- \`${stage.candidate}:${stage.id}\`: ${stage.status}${stage.required ? " (required)" : ""}`,
      );
    }
  }

  if (report.candidateResults.length > 0) {
    lines.push("", "## Candidate Results", "");
    for (const candidate of report.candidateResults) {
      const categories = candidate.categories
        .map((category) => `${category.category}=${category.score === null ? "missing" : category.score.toFixed(2)} (${category.samples})`)
        .join(", ");
      lines.push(
        `- \`${candidate.candidate}\`: ${categories}; completion=${candidate.tasks.completionRate === null ? "missing" : candidate.tasks.completionRate.toFixed(2)}, comprehension=${candidate.tasks.comprehensionAccuracy === null ? "missing" : candidate.tasks.comprehensionAccuracy.toFixed(2)}, confidence=${candidate.tasks.meanConfidence === null ? "missing" : candidate.tasks.meanConfidence.toFixed(2)}, duration=${candidate.tasks.meanDurationSeconds === null ? "missing" : `${candidate.tasks.meanDurationSeconds.toFixed(2)}s`}`,
      );
    }
  }

  if (report.benchmarkDecision.issues.length > 0) {
    lines.push("", "## Benchmark Decision Gaps", "");
    for (const issue of report.benchmarkDecision.issues) lines.push(`- ${issue}`);
  }

  if (report.findings.length > 0) {
    lines.push("", "## Findings");
    for (const finding of report.findings) {
      lines.push(
        "",
        `### ${finding.severity.toUpperCase()} ${finding.ruleId}`,
        "",
        `- Path: \`${finding.path}\``,
        `- Problem: ${finding.message}`,
        `- Remediation: ${finding.remediation}`,
      );
    }
  }

  return lines.join("\n");
}
