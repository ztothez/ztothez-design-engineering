import { z } from "zod";
import { evaluationDimensionSchema } from "./taxonomy-schema.js";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const boundedText = (max: number) => z.string().trim().min(1).max(max);

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
  version: z.literal("1.0.0"),
  candidateId: z.string(),
  title: z.string(),
  evaluatedAt: z.string(),
  decision: z.enum(["promoted", "rejected"]),
  criteria: promotionCriteriaEvaluationSchema,
  holdoutImpact: z.array(holdoutImpactSchema),
  rejectionReason: z.string().optional(),
  promotedArtifacts: promotedArtifactsSchema.optional(),
  passed: z.boolean(),
});

export type PromotionReport = z.infer<typeof promotionReportSchema>;
