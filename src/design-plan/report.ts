import type { DesignPlan } from "./schema.js";

export function formatDesignPlan(plan: DesignPlan): string {
  return [
    "# Compiled Design Plan",
    "",
    `- Product: ${plan.product}`,
    `- Plan: ${plan.id}`,
    `- Status: ${plan.status}`,
    `- Planning ready: ${plan.planningReady ? "yes" : "no"}`,
    `- Implementation ready: ${plan.implementationReady ? "yes" : "no"}`,
    `- Source digest: ${plan.sourceBrief.digest}`,
    `- Compiler: ${plan.compilerVersion}`,
    "",
    "## Contracts",
    ...plan.contracts.map((entry) => `- ${entry.kind}: ${entry.validation} - ${entry.reason}`),
    "",
    "## Routes",
    ...plan.routes.map((entry) => `- ${entry.path}: ${entry.status} - ${entry.purpose}`),
    "",
    "## Implementation Stages",
    ...plan.implementationStages.map((entry) => `${entry.order}. ${entry.name}: ${entry.status}`),
    "",
    "## Blockers And Confirmations",
    ...(plan.blockers.length > 0 ? plan.blockers.map((entry) => `- ${entry}`) : ["- None."]),
    "",
    "Use --json for the complete traceable plan.",
  ].join("\n");
}
