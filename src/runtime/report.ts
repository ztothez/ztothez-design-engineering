import type { RuntimeFinding, RuntimeReport } from "./types.js";

function findingContext(finding: RuntimeFinding): string {
  const context = [finding.viewport, finding.journey && `journey:${finding.journey}`].filter(
    Boolean,
  );
  return context.length > 0 ? ` (${context.join(", ")})` : "";
}

export function formatRuntimeReport(report: RuntimeReport): string {
  const lines = [
    "# ZtotheZ Design Engineering Runtime Verification",
    "",
    `- URL: \`${report.url}\``,
    `- Browser: ${report.browser}`,
    `- Result: ${report.passed ? "PASS" : "FAIL"}`,
    `- Findings: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info`,
    `- Screenshots: ${report.screenshots.length}`,
    `- Journeys: ${report.journeys.filter((journey) => journey.passed).length}/${report.journeys.length} passed`,
    `- Expected network policies: ${report.expectedNetwork.filter((policy) => policy.satisfied).length}/${report.expectedNetwork.length} satisfied`,
    `- Evidence directory: \`${report.outputDirectory}\``,
  ];

  if (report.expectedNetwork.length > 0) {
    lines.push("", "## Expected Network Evidence");
    for (const policy of report.expectedNetwork) {
      lines.push(
        "",
        `### ${policy.satisfied ? "PASS" : "FAIL"} ${policy.id}`,
        "",
        `${policy.method} URL containing \`${policy.urlIncludes}\`${policy.status ? ` with status ${policy.status}` : " with a request failure"}: ${policy.occurrences} occurrence(s).`,
        ...policy.evidence.map((entry) => `- ${entry}`),
      );
    }
  }

  if (report.findings.length === 0) {
    lines.push("", "No runtime findings were detected by the configured checks.");
    return lines.join("\n");
  }

  lines.push("", "## Findings");
  for (const finding of report.findings) {
    lines.push(
      "",
      `### ${finding.severity.toUpperCase()} ${finding.checkId}${findingContext(finding)}`,
      "",
      finding.message,
      ...(finding.selector ? ["", `Selector: \`${finding.selector}\``] : []),
      "",
      ...finding.evidence.map((evidence) => `- ${evidence}`),
    );
  }

  return lines.join("\n");
}
