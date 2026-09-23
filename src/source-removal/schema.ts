import { z } from "zod";

import { retrievalCategorySchema } from "../retrieval/schema.js";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,80}$/);
const pathSchema = z.string().trim().min(1).max(1_024);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);

export const sourceRemovalQueryClassSchema = z.enum([
  "architecture",
  "figma",
  "product-pattern",
  "usability",
  "visual-polish",
  "provenance",
  "gap",
]);

export const sourceRemovalQueryCaseSchema = z.object({
  id: idSchema,
  queryClass: sourceRemovalQueryClassSchema,
  query: boundedText(512),
  categories: z.array(retrievalCategorySchema).min(1).max(6),
  expected: z.object({
    status: z.enum(["matches", "no-match"]),
    path: pathSchema.optional(),
    maxRank: z.number().int().min(1).max(10).optional(),
  }).strict(),
}).strict().superRefine((entry, context) => {
  if (entry.expected.status === "matches" && !entry.expected.path) {
    context.addIssue({ code: "custom", path: ["expected", "path"], message: "Match cases require an expected path." });
  }
  if (entry.expected.status === "no-match" && entry.expected.path) {
    context.addIssue({ code: "custom", path: ["expected", "path"], message: "No-match cases cannot name an expected path." });
  }
});

export const sourceRemovalQualificationManifestSchema = z.object({
  version: z.literal("1.0"),
  id: idSchema,
  description: boundedText(1_024),
  authority: z.literal("SKILL.md"),
  requirements: z.object({
    admittedPublicKnowledgeOnly: z.literal(true),
    privateSourcesAreFallbacks: z.literal(false),
    documentBoundaryRetainedForRollback: z.literal(true),
    limitationsRemainSeparate: z.literal(true),
  }).strict(),
  expectedArchiveSmoke: z.object({
    isolatedWorkspace: z.literal(true),
    referenceArchivesPresent: z.literal(false),
    requiredStages: z.array(z.enum([
      "publicKnowledgeBoundary",
      "shadowDesignModel",
      "compiledAuthority",
      "build",
      "typecheck",
      "regressionSuite",
      "mcpAndRetrieval",
      "corpus",
      "fixtureQualityGate",
    ])).min(1),
  }).strict(),
  queryCases: z.array(sourceRemovalQueryCaseSchema).min(7).max(80),
}).strict().superRefine((manifest, context) => {
  const ids = new Set<string>();
  const classes = new Set(manifest.queryCases.map((entry) => entry.queryClass));
  for (const [index, entry] of manifest.queryCases.entries()) {
    if (ids.has(entry.id)) {
      context.addIssue({ code: "custom", path: ["queryCases", index, "id"], message: `Duplicate query case: ${entry.id}.` });
    }
    ids.add(entry.id);
  }
  for (const queryClass of sourceRemovalQueryClassSchema.options) {
    if (!classes.has(queryClass)) {
      context.addIssue({ code: "custom", path: ["queryCases"], message: `Missing ${queryClass} query case.` });
    }
  }
});

export const sourceRemovalQueryResultSchema = z.object({
  id: z.string(),
  queryClass: sourceRemovalQueryClassSchema,
  status: z.enum(["pass", "fail"]),
  expected: z.string(),
  observed: z.string(),
  matchedPath: z.string().optional(),
  rank: z.number().int().positive().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  findings: z.array(z.string()),
}).strict();

export const sourceRemovalQualificationReportSchema = z.object({
  version: z.literal("1.0"),
  generatedAt: z.string(),
  manifestPath: z.string(),
  benchmarkId: z.string(),
  authorityPath: z.literal("SKILL.md"),
  admittedFileCount: z.number().int().nonnegative(),
  retrievalFileCount: z.number().int().nonnegative(),
  removedArtifactCount: z.number().int().nonnegative(),
  referenceArchivesPresent: z.literal(false),
  documentBoundaryRetainedForRollback: z.literal(true),
  privateSourcesUsed: z.literal(false),
  queryResults: z.array(sourceRemovalQueryResultSchema),
  limitationCount: z.number().int().nonnegative(),
  limitations: z.array(z.string()),
  passed: z.boolean(),
}).strict();

export type SourceRemovalQualificationManifest = z.infer<typeof sourceRemovalQualificationManifestSchema>;
export type SourceRemovalQueryResult = z.infer<typeof sourceRemovalQueryResultSchema>;
export type SourceRemovalQualificationReport = z.infer<typeof sourceRemovalQualificationReportSchema>;
