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
    `- Task model: ${report.taskModel.status}${report.taskModel.archetype ? ` (${report.taskModel.archetype})` : ""}`,
    `- Product tasks: ${report.taskModel.primaryTasks} primary, ${report.taskModel.recoveryTasks} recovery, ${report.taskModel.narrowViewportTasks} narrow-viewport`,
  ];

  if (report.journeyPath) lines.splice(3, 0, `- Journeys: \`${report.journeyPath}\``);
  lines.push("");

  if (report.issues.length === 0) {
    lines.push("No contract validation issues were detected.");
  } else {
    lines.push("## Issues", "");
    for (const entry of report.issues) {
      lines.push(`- **${entry.code}** at \`${entry.path}\`: ${entry.message}`);
    }
  }
  if (report.limitations.length > 0) {
    lines.push("", "## Limitations", "", ...report.limitations.map((entry) => `- ${entry}`));
  }
  return lines.join("\n");
}
