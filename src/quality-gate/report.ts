import type { QualityGateReport, QualityGateStage } from "./types.js";

function stageRow(name: string, stage: QualityGateStage): string {
  return `| ${name} | ${stage.status.toUpperCase()} | ${stage.errors} | ${stage.warnings} | ${stage.info} |`;
}

export function formatQualityGateReport(report: QualityGateReport): string {
  const result = report.passed
    ? "PASS"
    : report.summary.errors > 0 || report.complete
      ? "FAIL"
      : "INCOMPLETE";
  const lines = [
    "# ZtotheZ Design Engineering Quality Gate",
    "",
    `- Result: ${result}`,
    `- Contract: \`${report.contractPath}\``,
    `- Repository: \`${report.repository}\``,
    ...(report.url ? [`- Runtime URL: \`${report.url}\``] : []),
    ...(report.profile ? [`- Journey profile: \`${report.profile}\``] : []),
    `- Failure policy: ${report.failOn}`,
    `- Evidence directory: \`${report.outputDirectory}\``,
    "",
    "| Stage | Status | Errors | Warnings | Info |",
    "|---|---:|---:|---:|---:|",
    stageRow("Product contract", report.stages.contract),
    stageRow("Architecture", report.stages.architecture),
    stageRow("Runtime", report.stages.runtime),
    stageRow("Acceptance", report.stages.acceptance),
    "",
    `Total: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info.`,
  ];

  const messages = Object.entries(report.stages)
    .filter(([, stage]) => stage.message)
    .map(([name, stage]) => `- **${name}:** ${stage.message}`);
  if (messages.length > 0) lines.push("", "## Stage Notes", "", ...messages);

  lines.push("", "## Evidence");
  for (const [name, stage] of Object.entries(report.stages)) {
    lines.push("", `### ${name[0]!.toUpperCase()}${name.slice(1)}`);
    if (stage.evidence.length === 0) lines.push("", "No evidence file was produced.");
    else lines.push("", ...stage.evidence.map((path) => `- \`${path}\``));
  }
  lines.push(
    "",
    "## Evidence Boundary",
    "",
    "### Verifier Limitations",
    "",
    ...report.evidenceBoundary.verifierLimitations.map((entry) => `- ${entry}`),
    "",
    "### Human Review Required",
    "",
    ...report.evidenceBoundary.humanReviewRequired.map((entry) => `- ${entry}`),
  );
  return lines.join("\n");
}
