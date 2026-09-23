import { z } from "zod";

import { retrievalCategorySchema } from "../retrieval/schema.js";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}$/);
const ruleIdSchema = z.string().regex(/^ZTDE-[A-Z0-9-]+-[0-9]{3}$/);
const modelIdSchema = z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/);
const pathSchema = z.string().trim().min(1).max(1_024);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);

export const knowledgeQualityDimensionSchema = z.enum([
  "source-quality",
  "retrieval-quality",
  "rule-quality",
  "product-outcome",
]);

const caseBase = {
  id: idSchema,
  dimension: knowledgeQualityDimensionSchema,
  source: idSchema,
  rationale: boundedText(1_024),
};

const retrievalCaseSchema = z.object({
  ...caseBase,
  kind: z.literal("retrieval"),
  query: boundedText(512),
  categories: z.array(retrievalCategorySchema).min(1).max(6).optional(),
  expected: z.object({
    status: z.enum(["matches", "no-match"]),
    path: pathSchema.optional(),
    maxRank: z.number().int().min(1).max(10).optional(),
  }).strict(),
}).strict().superRefine((entry, context) => {
  if (entry.dimension !== "retrieval-quality") {
    context.addIssue({ code: "custom", path: ["dimension"], message: "Retrieval cases must use retrieval-quality." });
  }
  if (entry.expected.status === "matches" && !entry.expected.path) {
    context.addIssue({ code: "custom", path: ["expected", "path"], message: "Match cases require an expected path." });
  }
  if (entry.expected.status === "no-match" && entry.expected.path) {
    context.addIssue({ code: "custom", path: ["expected", "path"], message: "No-match cases cannot name an expected path." });
  }
});

const ruleProvenanceCaseSchema = z.object({
  ...caseBase,
  kind: z.literal("rule-provenance"),
  ruleIds: z.array(ruleIdSchema).min(1).max(40),
  expected: z.object({
    categories: z.array(z.string().min(1).max(120)).min(1).max(20).optional(),
    modelLinks: z.array(modelIdSchema).min(1).max(20).optional(),
    requireSourceIds: z.boolean().default(true),
    forbidPrivateFallback: z.boolean().default(true),
  }).strict(),
}).strict().superRefine((entry, context) => {
  if (entry.dimension !== "rule-quality") {
    context.addIssue({ code: "custom", path: ["dimension"], message: "Rule provenance cases must use rule-quality." });
  }
});

const conflictCaseSchema = z.object({
  ...caseBase,
  kind: z.literal("conflict"),
  conflictId: z.string().regex(/^ZTDE-MODEL-CONFLICT-[0-9]{3}$/),
  expected: z.object({
    higherPriorityEntity: modelIdSchema,
    lowerPriorityEntity: modelIdSchema,
    resolutionIncludes: z.array(boundedText(160)).min(1).max(8),
    evidenceClasses: z.array(z.string().min(1).max(80)).min(1).max(10),
  }).strict(),
}).strict().superRefine((entry, context) => {
  if (entry.dimension !== "rule-quality") {
    context.addIssue({ code: "custom", path: ["dimension"], message: "Conflict cases must use rule-quality." });
  }
});

const supersessionCaseSchema = z.object({
  ...caseBase,
  kind: z.literal("supersession"),
  removedArtifactIndex: z.number().int().nonnegative(),
  expected: z.object({
    replacementPaths: z.array(pathSchema).min(1).max(20),
    removedFromCurrentTree: z.boolean(),
    removedFromRetrieval: z.boolean(),
    removedFromPackage: z.boolean(),
    removedFromAdmission: z.boolean(),
  }).strict(),
}).strict().superRefine((entry, context) => {
  if (entry.dimension !== "source-quality") {
    context.addIssue({ code: "custom", path: ["dimension"], message: "Supersession cases must use source-quality." });
  }
});

const modelParityCaseSchema = z.object({
  ...caseBase,
  kind: z.literal("model-parity"),
  traceId: z.string().regex(/^ZTDE-MODEL-TRACE-[0-9]{3}$/),
  expected: z.object({
    orderedEntities: z.array(modelIdSchema).min(5).max(40),
    verificationRefs: z.array(z.string().regex(/^ZTDE-MODEL-VERIFY-[0-9]{3}$/)).min(1).max(10),
    retrievalPaths: z.array(pathSchema).min(1).max(20),
  }).strict(),
}).strict().superRefine((entry, context) => {
  if (entry.dimension !== "product-outcome") {
    context.addIssue({ code: "custom", path: ["dimension"], message: "Model parity cases must use product-outcome." });
  }
});

export const knowledgeQualityCaseSchema = z.discriminatedUnion("kind", [
  retrievalCaseSchema,
  ruleProvenanceCaseSchema,
  conflictCaseSchema,
  supersessionCaseSchema,
  modelParityCaseSchema,
]);

export const knowledgeQualityManifestSchema = z.object({
  version: z.literal("1.0"),
  id: idSchema,
  description: boundedText(1_024),
  thresholds: z.object({
    overallMinimumScore: z.number().min(0).max(1),
    dimensions: z.record(knowledgeQualityDimensionSchema, z.object({
      minimumScore: z.number().min(0).max(1),
    }).strict()),
  }).strict(),
  sources: z.array(z.object({
    id: idSchema,
    title: boundedText(256),
    evidence: pathSchema,
    owner: z.literal("ZtotheZ"),
    status: z.enum(["owner-authored", "admitted-public", "compiled-authority"]),
  }).strict()).min(1).max(50),
  cases: z.array(knowledgeQualityCaseSchema).min(5).max(500),
}).strict().superRefine((manifest, context) => {
  const sourceIds = new Set(manifest.sources.map((source) => source.id));
  const dimensions = new Set(manifest.cases.map((entry) => entry.dimension));
  const caseIds = new Set<string>();

  for (const [index, entry] of manifest.cases.entries()) {
    if (!sourceIds.has(entry.source)) {
      context.addIssue({ code: "custom", path: ["cases", index, "source"], message: `Unknown source: ${entry.source}.` });
    }
    if (caseIds.has(entry.id)) {
      context.addIssue({ code: "custom", path: ["cases", index, "id"], message: `Duplicate case: ${entry.id}.` });
    }
    caseIds.add(entry.id);
  }

  for (const dimension of knowledgeQualityDimensionSchema.options) {
    if (!manifest.thresholds.dimensions[dimension]) {
      context.addIssue({ code: "custom", path: ["thresholds", "dimensions"], message: `Missing threshold for ${dimension}.` });
    }
    if (!dimensions.has(dimension)) {
      context.addIssue({ code: "custom", path: ["cases"], message: `Missing ${dimension} case.` });
    }
  }
});

export const knowledgeQualityCaseResultSchema = z.object({
  id: z.string(),
  kind: z.enum(["retrieval", "rule-provenance", "conflict", "supersession", "model-parity"]),
  dimension: knowledgeQualityDimensionSchema,
  source: z.string(),
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  expected: z.string(),
  observed: z.string(),
  findings: z.array(z.string()).default([]),
}).strict();

export const knowledgeQualityDimensionResultSchema = z.object({
  dimension: knowledgeQualityDimensionSchema,
  cases: z.number().int().positive(),
  passedCases: z.number().int().nonnegative(),
  failedCases: z.number().int().nonnegative(),
  score: z.number().min(0).max(1),
  minimumScore: z.number().min(0).max(1),
  passed: z.boolean(),
}).strict();

export const knowledgeQualityReportSchema = z.object({
  version: z.literal("1.0"),
  generatedAt: z.string(),
  manifestPath: z.string(),
  benchmarkId: z.string(),
  authorityPath: z.literal("SKILL.md"),
  compiledAuthority: z.object({
    lifecycle: z.literal("shadow"),
    admittedFileCount: z.number().int().nonnegative(),
    retrievalFileCount: z.number().int().nonnegative(),
    ruleCount: z.number().int().positive(),
    payloadSha256: z.string(),
  }).strict(),
  sources: z.number().int().positive(),
  caseResults: z.array(knowledgeQualityCaseResultSchema),
  dimensions: z.array(knowledgeQualityDimensionResultSchema),
  qualityBreakdown: z.object({
    sourceQuality: z.enum(["pass", "fail"]),
    retrievalQuality: z.enum(["pass", "fail"]),
    ruleQuality: z.enum(["pass", "fail"]),
    productOutcome: z.enum(["pass", "fail"]),
  }).strict(),
  overallScore: z.number().min(0).max(1),
  overallMinimumScore: z.number().min(0).max(1),
  passed: z.boolean(),
}).strict();

export type KnowledgeQualityManifest = z.infer<typeof knowledgeQualityManifestSchema>;
export type KnowledgeQualityCase = z.infer<typeof knowledgeQualityCaseSchema>;
export type KnowledgeQualityReport = z.infer<typeof knowledgeQualityReportSchema>;
export type KnowledgeQualityCaseResult = z.infer<typeof knowledgeQualityCaseResultSchema>;
export type KnowledgeQualityDimension = z.infer<typeof knowledgeQualityDimensionSchema>;
