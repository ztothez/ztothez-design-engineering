import type { PortfolioAdapterReport, PortfolioAdapterStageResult } from "./adapters.js";

export function formatPortfolioAdapterReport(report: PortfolioAdapterReport): string {
  const lines = [
    "# Portfolio Capabilities",
    "",
    `- Project: \`${report.projectId}\``,
    `- Adapter: ${report.adapter ? `\`${report.adapter.id}\` (${report.adapter.title})` : "not declared"}`,
    `- Policy result: ${report.passed ? "PASS" : "FAIL"}`,
    "",
    "## Capabilities",
    "",
  ];
  for (const capability of report.capabilities) {
    lines.push(
      `- \`${capability.stage}\`: ${capability.effectiveStatus}; ${capability.reason} Execution: ${capability.execution}.`,
    );
  }
  lines.push("", "## Issues", "");
  if (report.issues.length === 0) lines.push("- None");
  for (const issue of report.issues) {
    lines.push(`- ${issue.severity.toUpperCase()} \`${issue.code}\` at \`${issue.path}\`: ${issue.message}`);
  }
  return lines.join("\n").trimEnd();
}

export function formatPortfolioAdapterStageResult(result: PortfolioAdapterStageResult): string {
  const lines = [
    "# Portfolio Stage",
    "",
    `- Project: \`${result.projectId}\``,
    `- Adapter: ${result.adapterId ? `\`${result.adapterId}\`` : "not declared"}`,
    `- Stage: \`${result.stage}\``,
    `- Status: ${result.status}`,
    `- Reason: ${result.reason}`,
  ];
  if (result.process) {
    lines.push(
      `- Exit code: ${result.process.exitCode ?? "none"}`,
      `- Timed out: ${result.process.timedOut ? "yes" : "no"}`,
      `- Source unchanged: ${result.process.sourceUnchanged ? "yes" : "no"}`,
      "",
      "## Standard Output",
      "",
      "```text",
      result.process.stdout.trimEnd(),
      "```",
      "",
      "## Standard Error",
      "",
      "```text",
      result.process.stderr.trimEnd(),
      "```",
    );
  }
  return lines.join("\n").trimEnd();
}
