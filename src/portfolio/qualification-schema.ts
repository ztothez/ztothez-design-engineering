import { z } from "zod";

const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const portablePathSchema = z.string().trim().min(1).max(1_024).refine(
  (value) => !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes(".."),
  "Evidence paths must be portable repository-relative paths without traversal.",
);

export const qualificationEvidenceReferenceSchema = z.object({
  path: portablePathSchema,
  sha256: checksumSchema,
});

export const qualificationCheckEvidenceSchema = z.object({
  passed: z.boolean(),
  evidence: qualificationEvidenceReferenceSchema,
});

export const qualificationCommandEvidenceReportSchema = z.object({
  version: z.literal("1.0.0"),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  command: z.array(z.string().min(1).max(1_024)).min(1).max(32),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  exitCode: z.number().int(),
  passed: z.boolean(),
  stdout: qualificationEvidenceReferenceSchema,
  stderr: qualificationEvidenceReferenceSchema,
}).superRefine((report, context) => {
  if (report.passed !== (report.exitCode === 0)) {
    context.addIssue({ code: "custom", message: "Command evidence pass must match exit code zero." });
  }
});

export const v3QualificationTargetSchema = z.object({
  eligibleProjectsCount: z.number().int().nonnegative(),
  productDomainsCount: z.number().int().nonnegative(),
  frontendStacksCount: z.number().int().nonnegative(),
  interfaceArchetypesCount: z.number().int().nonnegative(),
  lockedHoldoutProjectsCount: z.number().int().nonnegative(),
  pathTypes: z.object({
    sourceOnly: z.boolean(),
    browserOnly: z.boolean(),
    fullStack: z.boolean(),
  }),
  sourceMutationViolations: z.number().int().nonnegative(),
  privateLeakageViolations: z.number().int().nonnegative(),
  existingGatesPassing: z.boolean(),
});

export type V3QualificationTargets = z.infer<typeof v3QualificationTargetSchema>;

export const ciFixtureCategorySchema = z.object({
  registryViolations: z.boolean(),
  snapshotViolations: z.boolean(),
  adapterCases: z.boolean(),
  comparisonSafety: z.boolean(),
  privacyBoundaries: z.boolean(),
  rulePromotionPaths: z.boolean(),
});

export type CiFixtureCategoryStatus = z.infer<typeof ciFixtureCategorySchema>;

export const qualificationEvidenceSchema = z.object({
  version: z.literal("1.0.0"),
  ciFixtures: z.object({
    registryViolations: qualificationCheckEvidenceSchema,
    snapshotViolations: qualificationCheckEvidenceSchema,
    adapterCases: qualificationCheckEvidenceSchema,
    comparisonSafety: qualificationCheckEvidenceSchema,
    privacyBoundaries: qualificationCheckEvidenceSchema,
    rulePromotionPaths: qualificationCheckEvidenceSchema,
  }),
  releaseGates: z.object({
    build: qualificationCheckEvidenceSchema,
    typecheck: qualificationCheckEvidenceSchema,
    tests: qualificationCheckEvidenceSchema,
    packageCheck: qualificationCheckEvidenceSchema,
    packageSmoke: qualificationCheckEvidenceSchema,
    independence: qualificationCheckEvidenceSchema,
    corpus: qualificationCheckEvidenceSchema,
    offlineRelease: qualificationCheckEvidenceSchema,
    archiveRemoval: qualificationCheckEvidenceSchema,
  }),
  benchmarkPaths: z.object({
    browserOnly: qualificationCheckEvidenceSchema,
    fullStack: qualificationCheckEvidenceSchema,
  }),
  promotionReports: z.array(z.object({
    candidateId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
    decision: z.enum(["promoted", "rejected"]),
    evaluationComplete: z.boolean(),
    evidence: qualificationEvidenceReferenceSchema,
  })),
  privateLeakageScan: qualificationCheckEvidenceSchema,
  claims: z.array(z.string().trim().min(1).max(2_048)).default([]),
});

export type QualificationEvidence = z.infer<typeof qualificationEvidenceSchema>;

export const v3QualificationCriteriaSchema = z.object({
  evidenceIntegrity: z.boolean(),
  eligibleProjects: z.boolean(),
  productDomains: z.boolean(),
  frontendStacks: z.boolean(),
  interfaceArchetypes: z.boolean(),
  lockedHoldouts: z.boolean(),
  benchmarkPaths: z.boolean(),
  cohortReportsComplete: z.boolean(),
  sourceRootsUnchanged: z.boolean(),
  privateDistributionClean: z.boolean(),
  existingGates: z.boolean(),
  ciFixtures: z.boolean(),
  rulePromotionEvidence: z.boolean(),
  claimBoundary: z.boolean(),
});

export const v3QualificationReportSchema = z.object({
  version: z.literal("1.1.0"),
  qualifiedAt: z.string(),
  targets: v3QualificationTargetSchema,
  ciFixtures: ciFixtureCategorySchema,
  disallowedClaimsExcluded: z.boolean(),
  supportedClaims: z.array(z.string()),
  disallowedClaimsDetected: z.array(z.string()),
  criteria: v3QualificationCriteriaSchema,
  failureReasons: z.array(z.string()),
  passed: z.boolean(),
});

export type V3QualificationReport = z.infer<typeof v3QualificationReportSchema>;
