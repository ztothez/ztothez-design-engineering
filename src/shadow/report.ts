import type { ShadowEvaluation } from "./schema.js";

const parityLabels: Record<keyof ShadowEvaluation["products"][number]["parity"], string> = {
  briefReadiness: "briefReadiness",
  designPlan: "designPlan",
  retrieval: "retrieval",
  evidenceClassification: "evidenceClassification",
  qualityOutcome: "qualityOutcome",
  packageBoundary: "packageBoundary",
};

function productLines(product: ShadowEvaluation["products"][number]): string[] {
  const unexercised = Object.entries(product.parity)
    .filter(([, passed]) => !passed)
    .map(([field]) => parityLabels[field as keyof typeof parityLabels]);
  const status = product.passed
    ? unexercised.length
      ? "pass (limited: " + unexercised.join(", ") + " not exercised)"
      : "pass"
    : "fail";
  return [
    "- " + product.id + " (" + product.cohort + "): " + status,
    ...Object.entries(product.parity).map(
      ([field, passed]) => "  - " + field + ": " + (passed ? "pass" : "not exercised"),
    ),
    "  - differences: " + (product.differences.length
      ? product.differences.map((difference) => difference.kind).join(", ")
      : "none recorded"),
  ];
}

export function formatShadowEvaluation(report: ShadowEvaluation): string {
  const lines = [
    "# V6 Shadow Evaluation",
    "",
    "- Evaluation ID: " + report.evaluationId,
    "- Generated: " + report.generatedAt,
    "- Status: " + (report.passed ? "PASS" : "FAIL"),
    "- Lifecycle: " + report.lifecycle,
    "- Authority remains: " + report.authorityBeforeCutover,
    "- Cutover: " + report.cutoverStatus,
    "",
    "## Source Reports",
    "",
    ...Object.entries(report.sourceReports).map(
      ([id, source]) => "- " + id + ": `" + source.path + "` (sha256: `" + source.digest.value + "`)",
    ),
    "",
    "## Product Results",
    "",
    ...report.products.flatMap(productLines),
    "",
    "## Criteria",
    "",
    ...Object.entries(report.criteria).map(([key, value]) => "- " + key + ": " + (value ? "pass" : "fail")),
    "",
    "## Limitations",
    "",
    ...report.limitations.map((limitation) => "- " + limitation),
  ];
  return lines.join("\n") + "\n";
}
