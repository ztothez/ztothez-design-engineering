import { createHash } from "node:crypto";

import type { ProductDesignBrief } from "../product-brief/schema.js";
import type { PlanReconciliationReport } from "../design-plan/reconciliation.js";
import type { DesignPlan } from "../design-plan/schema.js";
import { handoffSchema, type Handoff } from "./schema.js";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonical(entry)]));
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export function createHandoff(brief: ProductDesignBrief, plan: DesignPlan, reconciliation: PlanReconciliationReport): Handoff {
  const payload = {
    version: "1.0" as const,
    id: `${plan.id}-handoff`,
    product: brief.product,
    status: plan.status,
    source: { briefId: brief.id, briefFile: plan.sourceBrief.file, briefDigest: plan.sourceBrief.digest, planId: plan.id },
    plan: { planningReady: plan.planningReady, implementationReady: plan.implementationReady, blockers: plan.blockers, limitations: plan.limitations },
    rules: reconciliation.decisionRules.map(({ id, confidence, sourceRef, obligations, requiredStates, floors, proofMethod }) => ({ id, confidence, sourceRef, obligations, requiredStates, floors, proofMethod })),
    stages: reconciliation.stages.map(({ id, status, evidenceTier }) => ({ id, status, evidenceTier })),
    nextActions: plan.status === "blocked" ? [...plan.blockers, "Resolve blocked brief or downstream contract requirements before implementation."] : plan.status === "provisional" ? ["Resolve provisional downstream contracts and collect required evidence before generation."] : ["Run the declared verification obligations before release."],
  };
  return handoffSchema.parse({ ...payload, integrity: { algorithm: "sha256", payloadDigest: digest(payload) } });
}

export function verifyHandoff(handoff: Handoff): boolean {
  const { integrity: _integrity, ...payload } = handoff;
  return digest(payload) === handoff.integrity.payloadDigest;
}

export function formatHandoff(handoff: Handoff): string {
  return [`# ZtotheZ Design Engineering Handoff`, ``, `- Product: ${handoff.product}`, `- Status: ${handoff.status}`, `- Plan: ${handoff.source.planId}`, `- Rules selected: ${handoff.rules.length}`, `- Payload SHA-256: ${handoff.integrity.payloadDigest}`, ``, `## Next Actions`, ...handoff.nextActions.map((entry) => `- ${entry}`)].join("\n");
}
