import { z } from "zod";
import { portfolioRootClassSchema } from "./schema.js";

export const evaluationDimensionSchema = z.enum([
  "product-task",
  "interface-trust",
  "information-design",
  "visual-polish",
  "accessibility",
  "responsive",
  "architecture",
  "runtime-reliability",
  "audit-precision",
]);

export type EvaluationDimension = z.infer<typeof evaluationDimensionSchema>;

export const dimensionMetricsSchema = z.object({
  eligible: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  findings: z.number().int().nonnegative(),
  limitations: z.number().int().nonnegative(),
  abstentions: z.number().int().nonnegative(),
});

export type DimensionMetrics = z.infer<typeof dimensionMetricsSchema>;

export const recurrenceItemSchema = z.object({
  ruleId: z.string(),
  category: z.string(),
  dimension: evaluationDimensionSchema,
  affectedProjects: z.array(z.string()),
  affectedDomains: z.array(z.string()),
  totalOccurrences: z.number().int().positive(),
  sampleMessages: z.array(z.string()).max(10),
});

export type RecurrenceItem = z.infer<typeof recurrenceItemSchema>;

export const maintainerAnnotationSchema = z.object({
  findingId: z.string().optional(),
  ruleId: z.string(),
  projectId: z.string(),
  type: z.enum(["false-positive", "false-negative"]),
  rationale: z.string().min(1),
  reviewedBy: z.string().min(1),
  reviewedAt: z.string(),
});

export type MaintainerAnnotation = z.infer<typeof maintainerAnnotationSchema>;

export const projectDimensionSummarySchema = z.object({
  projectId: z.string(),
  domain: z.string(),
  archetype: z.string(),
  framework: z.string(),
  dimensions: z.record(evaluationDimensionSchema, dimensionMetricsSchema),
  totals: dimensionMetricsSchema,
});

export type ProjectDimensionSummary = z.infer<typeof projectDimensionSummarySchema>;

export const stackCoverageSchema = z.object({
  framework: z.string(),
  archetype: z.string(),
  projectsCount: z.number().int().nonnegative(),
  dimensionsCovered: z.array(evaluationDimensionSchema),
});

export type StackCoverage = z.infer<typeof stackCoverageSchema>;

export const crossProjectComparisonValidationSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
});

export type CrossProjectComparisonValidation = z.infer<typeof crossProjectComparisonValidationSchema>;

export const crossProductReportSchema = z.object({
  version: z.literal("1.0.0"),
  toolVersion: z.string(),
  runId: z.string(),
  evaluatedAt: z.string(),
  projectsCount: z.number().int().nonnegative(),
  projectSummaries: z.array(projectDimensionSummarySchema),
  dimensionTotals: z.record(evaluationDimensionSchema, dimensionMetricsSchema),
  recurrenceTaxonomy: z.array(recurrenceItemSchema),
  stackCoverage: z.array(stackCoverageSchema),
  annotations: z.object({
    supplied: z.number().int().nonnegative(),
    confirmedFalsePositives: z.number().int().nonnegative(),
    confirmedFalseNegatives: z.number().int().nonnegative(),
    records: z.array(maintainerAnnotationSchema),
  }),
  passed: z.boolean(),
});

export type CrossProductReport = z.infer<typeof crossProductReportSchema>;
