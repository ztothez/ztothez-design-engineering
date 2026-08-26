import { z } from "zod";

import { retrievalCategorySchema } from "../retrieval/schema.js";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const pathSchema = z.string().trim().min(1).max(1_024);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);

export const corpusDimensionSchema = z.enum([
  "recommendation-relevance",
  "abstention",
  "architectural-integrity",
  "task-completeness",
  "anti-slop-rejection",
]);

const provenanceSourceSchema = z
  .object({
    id: idSchema,
    title: boundedText(256),
    origin: z.enum(["user-owned", "licensed-standard"]),
    owner: boundedText(256),
    license: boundedText(128),
    sourceUrl: z.string().url().optional(),
    evidence: pathSchema,
    redistribution: boundedText(512),
  })
  .strict()
  .superRefine((source, context) => {
    if (source.origin === "licensed-standard" && !source.sourceUrl) {
      context.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "Licensed standards require an authoritative source URL.",
      });
    }
  });

const caseBase = {
  id: idSchema,
  polarity: z.enum(["positive", "negative"]),
  source: idSchema,
  derivation: boundedText(1_024),
};

const retrievalCaseSchema = z
  .object({
    ...caseBase,
    kind: z.literal("retrieval"),
    dimension: z.enum(["recommendation-relevance", "abstention"]),
    query: boundedText(512),
    categories: z.array(retrievalCategorySchema).min(1).max(6).optional(),
    expected: z
      .object({
        status: z.enum(["matches", "no-match"]),
        path: pathSchema.optional(),
        maxRank: z.number().int().min(1).max(20).optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((benchmarkCase, context) => {
    if (benchmarkCase.dimension === "recommendation-relevance") {
      if (benchmarkCase.expected.status !== "matches" || !benchmarkCase.expected.path) {
        context.addIssue({
          code: "custom",
          path: ["expected"],
          message: "Recommendation cases require matches status and an expected path.",
        });
      }
    }
    if (benchmarkCase.dimension === "abstention" && benchmarkCase.expected.status !== "no-match") {
      context.addIssue({
        code: "custom",
        path: ["expected", "status"],
        message: "Abstention cases must expect no-match.",
      });
    }
    if (benchmarkCase.dimension === "recommendation-relevance" && benchmarkCase.polarity !== "positive") {
      context.addIssue({ code: "custom", path: ["polarity"], message: "Recommendation cases must be positive." });
    }
    if (benchmarkCase.dimension === "abstention" && benchmarkCase.polarity !== "negative") {
      context.addIssue({ code: "custom", path: ["polarity"], message: "Abstention cases must be negative." });
    }
  });

const auditCaseSchema = z
  .object({
    ...caseBase,
    kind: z.literal("audit"),
    dimension: z.enum(["architectural-integrity", "anti-slop-rejection"]),
    target: pathSchema,
    policy: z
      .object({
        componentLineWarning: z.number().int().min(10).max(10_000).optional(),
        mixedResponsibilitiesMinLines: z.number().int().min(10).max(10_000).optional(),
        rawColorWarningCount: z.number().int().min(1).max(100).optional(),
      })
      .strict()
      .optional(),
    expected: z
      .object({
        verdict: z.enum(["accept", "reject"]),
        requiredRuleIds: z.array(boundedText(64)).max(30).default([]),
        forbiddenRuleIds: z.array(boundedText(64)).max(30).default([]),
        maximumFindings: z.number().int().nonnegative().optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((benchmarkCase, context) => {
    const expectedPolarity = benchmarkCase.expected.verdict === "accept" ? "positive" : "negative";
    if (benchmarkCase.polarity !== expectedPolarity) {
      context.addIssue({
        code: "custom",
        path: ["polarity"],
        message: `${benchmarkCase.expected.verdict} audit cases must be ${expectedPolarity}.`,
      });
    }
  });

const contractCaseSchema = z
  .object({
    ...caseBase,
    kind: z.literal("contract"),
    dimension: z.literal("task-completeness"),
    contract: pathSchema,
    expected: z
      .object({
        verdict: z.enum(["accept", "reject"]),
        requiredIssueCodes: z.array(boundedText(64)).max(30).default([]),
        forbiddenIssueCodes: z.array(boundedText(64)).max(30).default([]),
      })
      .strict(),
  })
  .strict()
  .superRefine((benchmarkCase, context) => {
    const expectedPolarity = benchmarkCase.expected.verdict === "accept" ? "positive" : "negative";
    if (benchmarkCase.polarity !== expectedPolarity) {
      context.addIssue({
        code: "custom",
        path: ["polarity"],
        message: `${benchmarkCase.expected.verdict} contract cases must be ${expectedPolarity}.`,
      });
    }
  });

export const corpusCaseSchema = z.discriminatedUnion("kind", [
  retrievalCaseSchema,
  auditCaseSchema,
  contractCaseSchema,
]);

const dimensionThresholdSchema = z
  .object({
    minimumScore: z.number().min(0).max(1),
    minimumMeanReciprocalRank: z.number().min(0).max(1).optional(),
  })
  .strict();

export const corpusManifestSchema = z
  .object({
    version: z.literal("1.0"),
    id: idSchema,
    description: boundedText(1_024),
    thresholds: z
      .object({
        overallMinimumScore: z.number().min(0).max(1),
        dimensions: z.record(corpusDimensionSchema, dimensionThresholdSchema),
      })
      .strict(),
    sources: z.array(provenanceSourceSchema).min(1).max(100),
    cases: z.array(corpusCaseSchema).min(5).max(1_000),
  })
  .strict()
  .superRefine((manifest, context) => {
    const duplicateIds = (values: string[]) => {
      const seen = new Set<string>();
      return values.filter((value) => (seen.has(value) ? true : (seen.add(value), false)));
    };
    for (const duplicate of new Set(duplicateIds(manifest.sources.map((source) => source.id)))) {
      context.addIssue({ code: "custom", path: ["sources"], message: `Duplicate source: ${duplicate}.` });
    }
    for (const duplicate of new Set(duplicateIds(manifest.cases.map((entry) => entry.id)))) {
      context.addIssue({ code: "custom", path: ["cases"], message: `Duplicate case: ${duplicate}.` });
    }

    const sources = new Set(manifest.sources.map((source) => source.id));
    const dimensions = new Set(manifest.cases.map((entry) => entry.dimension));
    for (const [index, benchmarkCase] of manifest.cases.entries()) {
      if (!sources.has(benchmarkCase.source)) {
        context.addIssue({
          code: "custom",
          path: ["cases", index, "source"],
          message: `Unknown provenance source: ${benchmarkCase.source}.`,
        });
      }
    }
    for (const dimension of corpusDimensionSchema.options) {
      if (!dimensions.has(dimension)) {
        context.addIssue({
          code: "custom",
          path: ["cases"],
          message: `Corpus requires at least one ${dimension} case.`,
        });
      }
      if (!manifest.thresholds.dimensions[dimension]) {
        context.addIssue({
          code: "custom",
          path: ["thresholds", "dimensions"],
          message: `Missing threshold for ${dimension}.`,
        });
      }
    }
    if (!manifest.cases.some((entry) => entry.polarity === "positive")) {
      context.addIssue({ code: "custom", path: ["cases"], message: "Corpus requires positive cases." });
    }
    if (!manifest.cases.some((entry) => entry.polarity === "negative")) {
      context.addIssue({ code: "custom", path: ["cases"], message: "Corpus requires negative cases." });
    }
  });

export const corpusCaseResultSchema = z
  .object({
    id: z.string(),
    kind: z.enum(["retrieval", "audit", "contract"]),
    dimension: corpusDimensionSchema,
    polarity: z.enum(["positive", "negative"]),
    source: z.string(),
    passed: z.boolean(),
    score: z.number().min(0).max(1),
    expected: z.string(),
    observed: z.string(),
    rank: z.number().int().positive().optional(),
    reciprocalRank: z.number().min(0).max(1).optional(),
    matchedPath: z.string().optional(),
    ruleIds: z.array(z.string()).default([]),
    issueCodes: z.array(z.string()).default([]),
  })
  .strict();

export const corpusDimensionResultSchema = z
  .object({
    dimension: corpusDimensionSchema,
    cases: z.number().int().positive(),
    passedCases: z.number().int().nonnegative(),
    failedCases: z.number().int().nonnegative(),
    score: z.number().min(0).max(1),
    minimumScore: z.number().min(0).max(1),
    meanReciprocalRank: z.number().min(0).max(1).optional(),
    minimumMeanReciprocalRank: z.number().min(0).max(1).optional(),
    passed: z.boolean(),
  })
  .strict();

export const corpusReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    manifestPath: z.string(),
    corpusId: z.string(),
    corpusVersion: z.string(),
    sources: z.number().int().positive(),
    sourceRecords: z.array(
      z
        .object({
          id: z.string(),
          title: z.string(),
          origin: z.enum(["user-owned", "licensed-standard"]),
          owner: z.string(),
          license: z.string(),
          sourceUrl: z.string().optional(),
          evidence: z.string(),
        })
        .strict(),
    ),
    positiveCases: z.number().int().nonnegative(),
    negativeCases: z.number().int().nonnegative(),
    caseResults: z.array(corpusCaseResultSchema),
    dimensions: z.array(corpusDimensionResultSchema),
    overallScore: z.number().min(0).max(1),
    overallMinimumScore: z.number().min(0).max(1),
    passed: z.boolean(),
  })
  .strict();

export type CorpusManifest = z.infer<typeof corpusManifestSchema>;
export type CorpusCase = z.infer<typeof corpusCaseSchema>;
export type CorpusCaseResult = z.infer<typeof corpusCaseResultSchema>;
export type CorpusDimension = z.infer<typeof corpusDimensionSchema>;
export type CorpusDimensionResult = z.infer<typeof corpusDimensionResultSchema>;
export type CorpusReport = z.infer<typeof corpusReportSchema>;
