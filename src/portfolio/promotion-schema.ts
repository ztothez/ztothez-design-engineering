import { z } from "zod";
import { evaluationDimensionSchema } from "./taxonomy-schema.js";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const boundedText = (max: number) => z.string().trim().min(1).max(max);
const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const portablePathSchema = boundedText(1_024).refine(
  (value) => !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes(".."),
  "Evidence paths must be portable repository-relative paths without traversal.",
);

export const promotionEvidenceReferenceSchema = z.object({
  path: portablePathSchema,
  sha256: checksumSchema,
});

export const rulePromotionEvidenceSchema = z.object({
  version: z.literal("1.0.0"),
  fixtures: z.object({
    positive: promotionEvidenceReferenceSchema.extend({ outcome: z.literal("accepted") }),
    negative: promotionEvidenceReferenceSchema.extend({ outcome: z.literal("detected") }),
    abstention: promotionEvidenceReferenceSchema.extend({ outcome: z.literal("abstained") }),
  }),
  existingGates: z.array(z.object({
    id: z.enum(["v1-v2", "retrieval", "corpus", "mcp", "package", "independence"]),
    passed: z.boolean(),
    evidence: promotionEvidenceReferenceSchema,
  })).length(6).superRefine((gates, context) => {
    const ids = new Set(gates.map((gate) => gate.id));
    if (ids.size !== gates.length) {
      context.addIssue({ code: "custom", message: "Existing gate evidence IDs must be unique." });
    }
  }),
  holdoutEvaluations: z.array(z.object({
    projectId: idSchema,
    status: z.enum(["benefited", "unaffected", "regressed", "abstained"]),
    evidence: promotionEvidenceReferenceSchema,
  })).min(1).superRefine((evaluations, context) => {
    const ids = new Set(evaluations.map((evaluation) => evaluation.projectId));
    if (ids.size !== evaluations.length) {
      context.addIssue({ code: "custom", message: "Holdout evaluation project IDs must be unique." });
    }
  }),
  promotedArtifacts: z.object({
    documentation: promotionEvidenceReferenceSchema,
    test: promotionEvidenceReferenceSchema,
    migrationGuidance: boundedText(2_048),
  }),
});

export type RulePromotionEvidence = z.infer<typeof rulePromotionEvidenceSchema>;

export const ruleHoldoutEvaluationReportSchema = z.object({
  version: z.literal("1.0.0"),
  candidateId: idSchema,
  projectId: idSchema,
  reportCode: z.string().regex(/^[A-Z0-9_-]{3,64}$/),
  holdoutRunId: boundedText(128),
  sourceDigest: checksumSchema,
  ruleExecuted: z.boolean(),
  applicable: z.boolean(),
  status: z.enum(["benefited", "unaffected", "regressed", "abstained"]),
  findingIds: z.array(z.string().regex(/^[A-Z0-9_-]{3,64}$/)).max(1_000),
  regressionGatesPassed: z.boolean(),
  reason: boundedText(2_048),
}).superRefine((report, context) => {
  const detected = report.findingIds.includes(report.reportCode);
  if (report.status === "benefited" && (!report.ruleExecuted || !report.applicable || !detected || !report.regressionGatesPassed)) {
    context.addIssue({ code: "custom", message: "Benefited holdouts require an applicable executed rule detection with passing regression gates." });
  }
  if (report.status === "unaffected" && (!report.ruleExecuted || !report.applicable || detected || !report.regressionGatesPassed)) {
    context.addIssue({ code: "custom", message: "Unaffected holdouts require an applicable executed rule, no candidate finding, and passing regression gates." });
  }
  if (report.status === "abstained" && report.ruleExecuted && report.applicable) {
    context.addIssue({ code: "custom", message: "Abstention requires an inapplicable rule or a rule that could not execute." });
  }
  if (report.status === "regressed" && report.regressionGatesPassed) {
    context.addIssue({ code: "custom", message: "Regressed holdouts require failed regression gates." });
  }
});

export type RuleHoldoutEvaluationReport = z.infer<typeof ruleHoldoutEvaluationReportSchema>;

export const ruleFixtureSpecSchema = z.object({
  version: z.literal("1.0.0"),
  ruleId: z.string().regex(/^[A-Z0-9_-]{3,64}$/),
  expected: z.enum(["accepted", "detected", "abstained"]),
  applicable: z.boolean(),
  fileName: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}\.(?:css|js|jsx|mjs|ts|tsx)$/),
  prefix: z.array(z.string().max(2_048)).max(100),
  repeat: z.object({ line: z.string().max(2_048), count: z.number().int().min(0).max(1_000) }),
  suffix: z.array(z.string().max(2_048)).max(100),
}).superRefine((fixture, context) => {
  if (fixture.expected === "abstained" && fixture.applicable) {
    context.addIssue({ code: "custom", message: "Abstention fixtures must be explicitly inapplicable." });
  }
  if (fixture.expected !== "abstained" && !fixture.applicable) {
    context.addIssue({ code: "custom", message: "Accepted and detected fixtures must be applicable." });
  }
});

export type RuleFixtureSpec = z.infer<typeof ruleFixtureSpecSchema>;

export const ruleCandidateJustificationSchema = z.object({
  type: z.enum(["cohort-recurrence", "standards-backed-safety"]),
  rationale: boundedText(2_048),
  safetyStandard: boundedText(512).optional(),
});

export const ruleCandidateSchema = z.object({
  id: idSchema,
  title: boundedText(256),
  category: boundedText(128),
  dimension: evaluationDimensionSchema,
  reportCode: z.string().regex(/^[A-Z0-9_-]{3,64}$/),
  justification: ruleCandidateJustificationSchema,
  authoredIndependently: z.boolean(),
  positiveFixturePath: boundedText(1_024),
  negativeFixturePath: boundedText(1_024),
  abstentionPath: boundedText(1_024),
  authoringProjects: z.array(idSchema).min(1).max(50),
});

export type RuleCandidate = z.infer<typeof ruleCandidateSchema>;

export const holdoutImpactStatusSchema = z.enum([
  "benefited",
  "unaffected",
  "regressed",
  "abstained",
  "unverified",
]);

export type HoldoutImpactStatus = z.infer<typeof holdoutImpactStatusSchema>;

export const holdoutImpactSchema = z.object({
  projectId: z.string(),
  status: holdoutImpactStatusSchema,
  details: z.string(),
});

export type HoldoutImpact = z.infer<typeof holdoutImpactSchema>;

export const promotionCriteriaEvaluationSchema = z.object({
  c1_independentAuthoring: z.boolean(),
  c2_recurrenceOrSafety: z.boolean(),
  c3_positiveNegativeFixtures: z.boolean(),
  c4_falsePositiveAnalysis: z.boolean(),
  c5_existingTestsPass: z.boolean(),
  c6_holdoutValidationPass: z.boolean(),
  c7_sourceUnchanged: z.boolean(),
});

export type PromotionCriteriaEvaluation = z.infer<typeof promotionCriteriaEvaluationSchema>;

export const promotedArtifactsSchema = z.object({
  documentationPath: z.string(),
  testReference: z.string(),
  reportCode: z.string(),
  migrationGuidance: z.string(),
});

export type PromotedArtifacts = z.infer<typeof promotedArtifactsSchema>;

export const promotionReportSchema = z.object({
  version: z.literal("1.1.0"),
  candidateId: z.string(),
  title: z.string(),
  evaluatedAt: z.string(),
  decision: z.enum(["promoted", "rejected"]),
  criteria: promotionCriteriaEvaluationSchema,
  holdoutImpact: z.array(holdoutImpactSchema),
  evaluationComplete: z.boolean(),
  rejectionReason: z.string().optional(),
  promotedArtifacts: promotedArtifactsSchema.optional(),
  failureReasons: z.array(z.string()),
  passed: z.boolean(),
});

export type PromotionReport = z.infer<typeof promotionReportSchema>;
