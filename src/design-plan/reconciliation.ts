import { z } from "zod";

import type { ProductDesignBrief } from "../product-brief/schema.js";
import type { DesignPlan } from "./schema.js";

const stageStatusSchema = z.enum(["pass", "provisional", "blocked"]);
const evidenceTierSchema = z.enum(["declared", "measured", "human-review-required"]);

export const decisionRuleMatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  confidence: z.number().min(0).max(1),
  selectingSignals: z.array(z.string()).min(1),
  obligations: z.array(z.string()).min(1),
  requiredStates: z.array(z.string()).min(1),
  floors: z.array(z.object({ label: z.string(), threshold: z.string() }).strict()).min(1),
  antiPattern: z.string(),
  proofMethod: z.string(),
  sourceRef: z.string(),
}).strict();

export const decisionRuleRetrievalReportSchema = z.object({
  version: z.literal("1.0"),
  status: z.enum(["matches", "no-match"]),
  source: z.object({ briefId: z.string() }).strict(),
  results: z.array(decisionRuleMatchSchema),
  noMatch: z.boolean(),
  limitations: z.array(z.string()).min(1),
}).strict();

export const planReconciliationReportSchema = z.object({
  version: z.literal("1.0"),
  status: stageStatusSchema,
  source: z.object({ briefId: z.string(), planId: z.string(), briefFile: z.string() }).strict(),
  stages: z.array(z.object({
    id: z.string(),
    status: stageStatusSchema,
    evidenceTier: evidenceTierSchema,
    requirementRefs: z.array(z.string()),
    note: z.string(),
  }).strict()).length(7),
  decisionRules: z.array(decisionRuleMatchSchema),
  noMatch: z.boolean(),
  limitations: z.array(z.string()).min(1),
}).strict();

export type PlanReconciliationReport = z.infer<typeof planReconciliationReportSchema>;

type DecisionRule = {
  id: string;
  name: string;
  signals: Array<{ label: string; test: RegExp }>;
  obligations: string[];
  requiredStates: string[];
  floors: Array<{ label: string; threshold: string }>;
  antiPattern: string;
  proofMethod: string;
  sourceRef: string;
};

// These are root-owned decision rules, deliberately smaller and typed differently
// from the prototype catalogue. They express obligations, not visual styles.
const DECISION_RULES: readonly DecisionRule[] = [
  {
    id: "ZTDE-DECISION-001",
    name: "Evidence before consequential action",
    signals: [
      { label: "the task has a consequential action", test: /approve|delete|deploy|publish|send|pay|escalat/i },
      { label: "the task requires evidence or review", test: /evidence|review|inspect|audit|diagnos/i },
    ],
    obligations: ["Expose the evidence source and freshness before the committing action.", "Require explicit confirmation when the action has external effect."],
    requiredStates: ["success", "error", "blocked"],
    floors: [{ label: "Evidence source attribution", threshold: "source and freshness visible before action" }],
    antiPattern: "A committing control is available before the information needed to justify it.",
    proofMethod: "Recorded task path showing evidence, consequence, confirmation, and recovery.",
    sourceRef: "SKILL.md#evidence-and-traceability",
  },
  {
    id: "ZTDE-DECISION-002",
    name: "Declared degraded data",
    signals: [
      { label: "the task includes stale, offline, partial, or unreachable data", test: /stale|offline|partial|unreachable|timeout|degrad/i },
      { label: "the task depends on a data source or telemetry", test: /source|telemetry|feed|sync|api|data/i },
    ],
    obligations: ["Distinguish missing data from zero values.", "Show source coverage and freshness on the affected surface.", "Provide recovery for the failed source without discarding entered work."],
    requiredStates: ["partial", "stale", "offline", "error"],
    floors: [{ label: "Degraded-data disclosure", threshold: "origin, coverage, and age are visible without hover" }],
    antiPattern: "A silent zero or permanent spinner makes incomplete data look authoritative.",
    proofMethod: "Rendered recovery evidence plus a task assertion that the actor identified the data as incomplete.",
    sourceRef: "SKILL.md#interface-trust-and-recovery",
  },
  {
    id: "ZTDE-DECISION-003",
    name: "Semantic token and state contract",
    signals: [
      { label: "the brief names tokens, theming, or a design system", test: /token|theme|design system|palette|typography/i },
      { label: "the brief declares a lifecycle or transition concern", test: /multiple|transition|flow|wizard|lifecycle/i },
    ],
    obligations: ["Resolve component values through semantic roles.", "Enumerate state behaviour and recovery before implementation.", "Keep non-colour cues and reduced-motion equivalents where applicable."],
    requiredStates: ["empty", "loading", "success", "error"],
    floors: [{ label: "Raw design values in components", threshold: "0 unapproved literals" }, { label: "Declared state coverage", threshold: "100% of contract states" }],
    antiPattern: "A component-local visual value or an unimplemented state silently becomes the default.",
    proofMethod: "Static token scan and state coverage report tied to the compiled plan.",
    sourceRef: "SKILL.md#design-tokens-and-state-contracts",
  },
];

function briefCorpus(brief: ProductDesignBrief): string {
  return [
    brief.problem.statement,
    ...brief.constraints,
    ...brief.tasks.flatMap((task) => [task.title, task.goal, task.successSignal, task.failureImpact, ...task.inputs, task.recovery]),
    ...brief.requirements.map((requirement) => requirement.statement),
    ...brief.states.flatMap((state) => [state.state, state.behavior, state.recovery, state.disclosure]),
  ].join(" ");
}

function statusFor(plan: DesignPlan, stageId: string): "pass" | "provisional" | "blocked" {
  if (plan.status === "blocked") return "blocked";
  const stage = plan.implementationStages.find((candidate) => candidate.id === stageId);
  if (stage?.status === "blocked") return "blocked";
  if (stage?.status === "provisional" || plan.status === "provisional") return "provisional";
  return "pass";
}

export function retrieveDecisionRules(brief: ProductDesignBrief, limit = 6): z.infer<typeof decisionRuleMatchSchema>[] {
  const corpus = briefCorpus(brief);
  return DECISION_RULES.flatMap((rule) => {
    const selectingSignals = rule.signals.filter((signal) => signal.test.test(corpus));
    if (selectingSignals.length === 0) return [];
    return [{
      id: rule.id,
      name: rule.name,
      confidence: Math.round((selectingSignals.length / rule.signals.length) * 100) / 100,
      selectingSignals: selectingSignals.map((signal) => signal.label),
      obligations: rule.obligations,
      requiredStates: rule.requiredStates,
      floors: rule.floors,
      antiPattern: rule.antiPattern,
      proofMethod: rule.proofMethod,
      sourceRef: rule.sourceRef,
    }];
  })
    .sort((left, right) => right.confidence - left.confidence || left.id.localeCompare(right.id))
    .slice(0, limit)
    .map((rule) => decisionRuleMatchSchema.parse(rule));
}

export function retrieveDecisionRuleReport(brief: ProductDesignBrief): z.infer<typeof decisionRuleRetrievalReportSchema> {
  const results = retrieveDecisionRules(brief);
  return decisionRuleRetrievalReportSchema.parse({
    version: "1.0",
    status: results.length > 0 ? "matches" : "no-match",
    source: { briefId: brief.id },
    results,
    noMatch: results.length === 0,
    limitations: [
      "Results come only from the root-owned decision-rule set; this tool does not search private or unapproved corpora.",
      "Confidence measures matching signal coverage and is not a probability of usability success.",
      "Rules are provisional guidance until the compiled plan and rendered evidence satisfy their obligations.",
    ],
  });
}

export function reconcileDesignPlan(brief: ProductDesignBrief, plan: DesignPlan): PlanReconciliationReport {
  const decisionRules = retrieveDecisionRules(brief);

  const stageDefinitions = [
    ["intake", "Brief and downstream contract readiness is the entry gate.", ["sourceBrief"]],
    ["model", "Tasks, audiences, information architecture, and state ownership are explicit.", ["informationArchitecture", "stateOwnership"]],
    ["direction", "Token requirements and selected decision obligations are traceable.", ["tokenRequirements"]],
    ["compose", "Routes, component boundaries, and responsive behaviour are declared.", ["routes", "components", "responsiveBehavior"]],
    ["evaluate", "Verification obligations exist for the declared acceptance criteria.", ["verificationObligations"]],
    ["gate", "Blockers and limitations remain visible instead of being promoted to readiness.", ["blockers", "limitations"]],
    ["handoff", "The plan status determines whether implementation may proceed.", ["implementationStages", "contracts"]],
  ] as const;
  const stages = stageDefinitions.map(([id, note, requirementRefs]) => ({
    id,
    status: statusFor(plan, id),
    evidenceTier: id === "evaluate" || id === "gate" ? "measured" as const : "declared" as const,
    requirementRefs: [...requirementRefs],
    note,
  }));
  const status = stages.some((stage) => stage.status === "blocked") ? "blocked" : stages.some((stage) => stage.status === "provisional") ? "provisional" : "pass";
  return planReconciliationReportSchema.parse({
    version: "1.0",
    status,
    source: { briefId: brief.id, planId: plan.id, briefFile: plan.sourceBrief.file },
    stages,
    decisionRules,
    noMatch: decisionRules.length === 0,
    limitations: [
      "Decision rules express obligations and proof methods; they do not prove rendered accessibility or task performance.",
      "Confidence indicates signal coverage only and is not a probability of usability success.",
      "Human or representative-user evidence remains separate and cannot be generated by this reconciliation.",
    ],
  });
}

export function formatPlanReconciliation(report: PlanReconciliationReport): string {
  const lines = [`Plan reconciliation: ${report.status}`, `Brief: ${report.source.briefId}`, "", "Stages:"];
  for (const stage of report.stages) lines.push(`- ${stage.id}: ${stage.status} (${stage.evidenceTier})`);
  lines.push("", `Decision rules: ${report.decisionRules.length}`);
  for (const rule of report.decisionRules) lines.push(`- ${rule.id} ${rule.name}: confidence ${rule.confidence}`);
  if (report.noMatch) lines.push("- No decision rule matched the brief; treat this as a knowledge gap.");
  lines.push("", "Limitations:", ...report.limitations.map((entry) => `- ${entry}`));
  return lines.join("\n");
}
