import type { PortfolioInventoryReport } from "./registry.js";
import type { PortfolioRegistryReport } from "./schema.js";

export function formatPortfolioRegistryReport(report: PortfolioRegistryReport): string {
  const lines = [
    "# Portfolio Registry",
    "",
    `- Registry: ${report.registryId ?? "unavailable"}`,
    `- Roots: ${report.counts.roots}`,
    `- Projects: ${report.counts.projects}; ${report.counts.enabled} enabled`,
    `- Cohorts: ${report.counts.development} development, ${report.counts.holdout} holdout, ${report.counts.excluded} excluded`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    "",
    "## Projects",
    "",
  ];
  if (report.projects.length === 0) lines.push("- None");
  for (const project of report.projects) {
    lines.push(
      `- \`${project.id}\`: ${project.enabled ? "enabled" : "disabled"}; ${project.cohort}; ${project.ownership}; ${project.confidentiality}; ${project.resolved ? "resolved" : "unresolved"}`,
    );
  }
  lines.push("", "## Issues", "");
  if (report.issues.length === 0) lines.push("- None");
  for (const entry of report.issues) {
    lines.push(`- ${entry.severity.toUpperCase()} \`${entry.code}\` at \`${entry.path}\`: ${entry.message}`);
  }
  return lines.join("\n").trimEnd();
}

export function formatPortfolioInventoryReport(report: PortfolioInventoryReport): string {
  const lines = [
    "# Portfolio Inventory",
    "",
    `- Registry: ${report.registryId ?? "unavailable"}`,
    `- Candidates: ${report.candidates.length}`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    "",
  ];
  for (const candidate of report.candidates) {
    lines.push(
      `- \`${candidate.root}:${candidate.path}\`: ${candidate.markers.join(", ")}${candidate.registeredProject ? `; registered as \`${candidate.registeredProject}\`` : "; unregistered"}`,
    );
  }
  if (report.issues.length > 0) {
    lines.push("", "## Issues", "");
    for (const entry of report.issues) {
      lines.push(`- ${entry.severity.toUpperCase()} \`${entry.code}\` at \`${entry.path}\`: ${entry.message}`);
    }
  }
  return lines.join("\n").trimEnd();
}
