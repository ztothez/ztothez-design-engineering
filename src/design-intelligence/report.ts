import type { DesignDeliverableReport } from "./schema.js";

export function formatDesignDeliverableReport(report: DesignDeliverableReport): string {
  const lines = [
    "# ZtotheZ Design Intelligence Validation",
    "",
    `- Manifest: \`${report.manifestId}\``,
    `- Product: ${report.product}`,
    `- Source: \`${report.sourcePath}\``,
    `- Deliverables: ${report.deliverables.join(", ")}`,
    `- Coverage: ${report.coverage.tokens} tokens, ${report.coverage.assets} assets, ${report.coverage.icons} icons, ${report.coverage.presentations} presentations, ${report.coverage.slides} slides, ${report.coverage.contrastPairs} contrast pairs, ${report.coverage.typographyRoles} type roles, ${report.coverage.interactionStates} interface states, ${report.coverage.chartContracts} chart contracts`,
    `- Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    `- Visual release readiness: ${report.visualPolish.releaseReady ? "READY" : "NOT READY"}`,
    `- Integrated release readiness: ${report.integration.releaseReady ? "READY" : "NOT READY"}`,
  ];

  if (report.integration.generationReady) {
    lines.push(
      "",
      "## V2 Integration",
      "",
      `- Generation workflow: ready`,
      `- Interface trust: ${report.integration.trustStatus}`,
      `- Information design: ${report.integration.informationStatus}`,
      `- Automated verification: ${report.integration.automatedVerificationReady ? "ready" : "incomplete"}`,
      `- Human review: ${report.integration.humanReviewReady ? "ready" : "incomplete"}`,
    );
  }

  if (report.visualPolish.declared) {
    lines.push(
      "",
      "## Visual Polish Evidence",
      "",
      ...Object.entries(report.visualPolish.requiredViewports).map(([viewport, status]) => `- ${viewport}px: ${status}`),
      `- Rendered evidence: ${report.visualPolish.renderedEvidenceReady ? "ready" : "incomplete"}`,
      `- Human visual review: ${report.visualPolish.humanReviewReady ? "ready" : "incomplete"}`,
    );
  }

  if (report.contrastResults.length > 0) {
    lines.push("", "## Contrast Results", "");
    for (const result of report.contrastResults) {
      lines.push(
        `- \`${result.id}\`: ${result.ratio.toFixed(2)}:1 required ${result.required.toFixed(1)}:1, ${result.passed ? "PASS" : "FAIL"}`,
      );
    }
  }

  if (report.findings.length > 0) {
    lines.push("", "## Findings");
    for (const finding of report.findings) {
      lines.push(
        "",
        `### ${finding.severity.toUpperCase()}: ${finding.ruleId}`,
        "",
        `- Path: \`${finding.path}\``,
        `- Finding: ${finding.message}`,
        `- Remediation: ${finding.remediation}`,
      );
    }
  }

  lines.push("", "## Limitations", "", ...report.limitations.map((entry) => `- ${entry}`));
  return lines.join("\n");
}
