import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const portablePathSchema = z.string().min(1).max(1_024).refine(
  (value) =>
    !value.includes("\0") &&
    !value.startsWith("/") &&
    !/^[A-Za-z]:[\\/]/.test(value) &&
    !value.split(/[\\/]/).includes(".."),
  "Evaluation paths must be portable repository-relative paths without traversal.",
);

export const v4EvaluationConfigSchema = z.object({
  version: z.literal("1.0"),
  id: idSchema,
  requiredViewports: z.array(z.object({
    width: z.number().int().min(240).max(3_840),
    height: z.number().int().min(240).max(2_160),
  }).strict()).min(4).max(8),
  calibration: z.object({
    report: portablePathSchema,
    qualitativeSources: z.array(portablePathSchema).min(1).max(20),
  }).strict(),
  ruleFixtures: z.object({
    positive: portablePathSchema,
    negative: portablePathSchema,
    abstention: portablePathSchema,
  }).strict(),
  products: z.array(z.object({
    id: idSchema,
    cohort: z.enum(["development", "holdout"]),
    evidenceDirectory: idSchema,
    baselineContract: portablePathSchema,
    candidateContract: portablePathSchema,
    tasks: z.array(z.object({
      id: idSchema,
      baselineProfiles: z.array(idSchema).min(1).max(10),
      candidateProfile: idSchema,
    }).strict()).min(1).max(20),
  }).strict()).min(3).max(20),
}).strict().superRefine((config, context) => {
  if (new Set(config.products.map((product) => product.id)).size !== config.products.length) {
    context.addIssue({ code: "custom", path: ["products"], message: "Evaluation product IDs must be unique." });
  }
  if (!config.products.some((product) => product.cohort === "holdout")) {
    context.addIssue({ code: "custom", path: ["products"], message: "At least one locked holdout is required." });
  }
});

export type V4EvaluationConfig = z.infer<typeof v4EvaluationConfigSchema>;

const dimensionStatusSchema = z.enum([
  "improved",
  "non-regressed",
  "regressed",
  "unverified",
  "calibration-only",
]);

const stageSchema = z.object({
  passed: z.boolean(),
  evidence: z.array(portablePathSchema),
}).strict();

export const v4EvaluationReportSchema = z.object({
  version: z.literal("1.0"),
  evaluationId: idSchema,
  generatedAt: z.string().datetime(),
  calibration: z.object({
    retained: z.boolean(),
    sessions: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative(),
    releaseReady: z.boolean(),
    disagreementPreserved: z.boolean(),
    evidence: z.array(portablePathSchema).min(1),
    limitation: z.string(),
  }).strict(),
  ruleFixtures: z.object({
    positive: z.boolean(),
    negative: z.boolean(),
    abstention: z.boolean(),
    passed: z.boolean(),
  }).strict(),
  products: z.array(z.object({
    id: idSchema,
    cohort: z.enum(["development", "holdout"]),
    stages: z.object({
      baseline: stageSchema,
      candidate: stageSchema,
      equivalence: stageSchema,
    }).strict(),
    tasks: z.array(z.object({
      id: idSchema,
      sameTask: z.boolean(),
      sameStates: z.boolean(),
      sameRoute: z.boolean(),
      sameViewports: z.boolean(),
      baselineInteraction: z.literal("unverified"),
      candidateInteraction: z.enum(["passed", "failed"]),
    }).strict()),
    dimensions: z.array(z.object({
      id: z.enum([
        "task-completeness",
        "hierarchy",
        "accessibility",
        "responsiveness",
        "truthful-disclosure",
        "maintainability",
        "visual-quality",
      ]),
      status: dimensionStatusSchema,
      rationale: z.string().min(1).max(1_024),
    }).strict()).length(7),
    passed: z.boolean(),
    limitations: z.array(z.string()),
  }).strict()).min(3),
  criteria: z.object({
    equivalentComparisons: z.boolean(),
    deterministicRuleFixtures: z.boolean(),
    developmentEvidencePassing: z.boolean(),
    lockedHoldoutPassing: z.boolean(),
    humanCalibrationRetained: z.boolean(),
    disagreementPreserved: z.boolean(),
    noVanityScore: z.literal(true),
  }).strict(),
  promotedRules: z.array(idSchema),
  withheldRules: z.array(z.object({ id: idSchema, reason: z.string() }).strict()),
  humanEvidence: z.literal("not-generated"),
  passed: z.boolean(),
}).strict();

export type V4EvaluationReport = z.infer<typeof v4EvaluationReportSchema>;
