import type { V4EvaluationReport } from "./schema.js";

export function formatV4EvaluationReport(report: V4EvaluationReport): string {
  const lines = [
    "ZtotheZ V4 Before-And-After And Holdout Evaluation",
    `Result: ${report.passed ? "PASS" : "FAIL"}`,
    `Human evidence: ${report.humanEvidence}`,
    `Calibration sessions retained: ${report.calibration.sessions}`,
    `Calibration warnings retained: ${report.calibration.warnings}`,
    "",
  ];
  for (const product of report.products) {
    lines.push(`${product.id} (${product.cohort}): ${product.passed ? "PASS" : "FAIL"}`);
    for (const dimension of product.dimensions) lines.push(`  ${dimension.id}: ${dimension.status}`);
  }
  lines.push("", `Promoted rules: ${report.promotedRules.join(", ") || "none"}`);
  return lines.join("\n");
}
