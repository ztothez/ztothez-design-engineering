import type { GenerationReport } from "./schema.js";

export function formatGenerationReport(report: GenerationReport): string {
  return [
    "# React And TypeScript Generation Report",
    "",
    `- Product: ${report.product}`,
    `- Plan: ${report.planId}`,
    `- Adapter: ${report.adapter} ${report.adapterVersion}`,
    `- Status: ${report.status}`,
    `- Target: ${report.target}`,
    `- Files: ${report.files.length}`,
    "",
    "## Capabilities",
    ...report.capabilities.map((entry) => `- ${entry}`),
    "",
    "## Limitations",
    ...report.limitations.map((entry) => `- ${entry}`),
    "",
    `Manifest: ${report.manifest}`,
  ].join("\n");
}
