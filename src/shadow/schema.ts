import { z } from "zod";

export const shadowDifferenceSchema = z.object({
  kind: z.enum(["defect", "intentional-improvement", "unsupported-limitation", "unresolved-risk"]),
  subject: z.string().min(1).max(160),
  detail: z.string().min(1).max(600),
}).strict();

export const shadowProductSchema = z.object({
  id: z.string().min(1).max(120),
  cohort: z.enum(["development", "holdout"]),
  parity: z.object({
    briefReadiness: z.boolean(),
    designPlan: z.boolean(),
    retrieval: z.boolean(),
    evidenceClassification: z.boolean(),
    qualityOutcome: z.boolean(),
    packageBoundary: z.boolean(),
  }).strict(),
  differences: z.array(shadowDifferenceSchema),
  passed: z.boolean(),
}).strict();

export const shadowEvaluationSchema = z.object({
  version: z.literal("1.0"),
  evaluationId: z.literal("v6-shadow-qualification"),
  generatedAt: z.string().datetime(),
  lifecycle: z.literal("shadow"),
  authorityBeforeCutover: z.literal("V5"),
  cutoverStatus: z.enum(["approved", "not-approved", "not-authoritative-until-v5-item-8"]),
  ownerApprovalRequired: z.literal(true),
  sourceReports: z.object({
    pilotQualification: z.object({
      path: z.string().min(1),
      digest: z.object({ algorithm: z.literal("sha256"), value: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
    }).strict(),
    pilotEvaluation: z.object({
      path: z.string().min(1),
      digest: z.object({ algorithm: z.literal("sha256"), value: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
    }).strict(),
    holdout: z.object({
      path: z.string().min(1),
      digest: z.object({ algorithm: z.literal("sha256"), value: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
    }).strict(),
  }).strict(),
  products: z.array(shadowProductSchema).min(4),
  criteria: z.object({
    parityAcrossRequiredOutputs: z.boolean(),
    holdoutIsIndependent: z.boolean(),
    differencesClassified: z.boolean(),
    packageBoundaryPreserved: z.boolean(),
    cutoverSeparatelyApproved: z.boolean(),
  }).strict(),
  passed: z.boolean(),
  limitations: z.array(z.string().min(1).max(600)),
}).strict();

export type ShadowEvaluation = z.infer<typeof shadowEvaluationSchema>;
