import type { PilotQualificationReport } from "./schema.js";

export function formatPilotQualificationReport(report: PilotQualificationReport): string {
  const lines = [
    "ZtotheZ V4 Multi-Product Pilot Qualification",
    `Result: ${report.passed ? "PASS" : "FAIL"}`,
    `Products: ${report.products.length}`,
    `Human evidence: ${report.humanEvidence}`,
    "",
  ];
  for (const product of report.products) {
    lines.push(`${product.id}: ${product.passed ? "PASS" : "FAIL"}`);
    lines.push(`  profiles: ${product.profiles.filter((profile) => profile.passed).length}/${product.profiles.length}`);
    lines.push(`  manifest-owned adaptations: ${product.adaptedManifestFiles.length}`);
    lines.push(`  system defects: ${product.systemDefects.length}`);
    lines.push(`  product findings: ${product.productFindings.length}`);
    lines.push(`  verifier limitations: ${product.verifierLimitations.length}`);
  }
  return lines.join("\n");
}
