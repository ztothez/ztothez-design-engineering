import type { AggregateReport } from "./types.js";

export function formatAggregateReport(report: AggregateReport): string {
  const result = report.passed ? "PASS" : report.complete ? "FAIL" : "INCOMPLETE";
  const lines = [
    "# ZtotheZ Design Engineering Release Quality Gate",
    "",
    `- Result: ${result}`,
    `- Contract: \`${report.contractPath}\``,
    `- Failure policy: ${report.failOn}`,
    `- Profiles: ${report.summary.profilesPassed}/${report.summary.profilesRequired} passed`,
    `- Criteria: ${report.summary.criteriaPassed} passed, ${report.summary.criteriaFailed} failed, ${report.summary.criteriaUnverified} unverified`,
    `- Evidence directory: \`${report.outputDirectory}\``,
    "",
    "## Profile Gates",
    "",
    "| Profile | Complete | Result | Evidence |",
    "|---|---:|---:|---|",
    ...report.requiredProfiles.map((profile) => {
      const result = report.profiles.find((entry) => entry.profile === profile);
      return `| ${profile} | ${result?.complete ? "yes" : "no"} | ${result?.passed ? "PASS" : "FAIL"} | ${result ? `\`${result.directory}\`` : "missing"} |`;
    }),
    "",
    "## Acceptance Criteria",
    "",
    "| Criterion | Severity | Result | Required Profiles |",
    "|---|---:|---:|---|",
    ...report.criteria.map(
      (criterion) =>
        `| ${criterion.title} | ${criterion.severity} | ${criterion.status.toUpperCase()} | ${criterion.profiles.map((entry) => `${entry.profile}: ${entry.status}`).join("; ")} |`,
    ),
  ];

  if (report.issues.length > 0) {
    lines.push("", "## Integration Issues", "", ...report.issues.map((issue) => `- ${issue}`));
  }
  return lines.join("\n");
}
