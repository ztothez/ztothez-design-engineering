import type { ContractValidationReport } from "./schema.js";

export function formatContractValidationReport(report: ContractValidationReport): string {
  const lines = [
    "# ZtotheZ Design Engineering Product Contract Validation",
    "",
    `- Contract: \`${report.contractPath}\``,
    `- Contract ID: \`${report.contractId ?? "unavailable"}\``,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    `- Actors: ${report.counts.actors}`,
    `- Modes: ${report.counts.modes}`,
    `- Acceptance criteria: ${report.counts.acceptanceCriteria}`,
    `- Journey profiles: ${report.counts.journeyProfiles}`,
    `- Journeys: ${report.counts.journeys}`,
  ];

  if (report.journeyPath) lines.splice(3, 0, `- Journeys: \`${report.journeyPath}\``);
  lines.push("");

  if (report.issues.length === 0) {
    lines.push("No contract validation issues were detected.");
    return lines.join("\n");
  }

  lines.push("## Issues", "");
  for (const entry of report.issues) {
    lines.push(`- **${entry.code}** at \`${entry.path}\`: ${entry.message}`);
  }
  return lines.join("\n");
}
