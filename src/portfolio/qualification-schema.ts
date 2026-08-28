import { z } from "zod";

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

export const v3QualificationReportSchema = z.object({
  version: z.literal("1.0.0"),
  qualifiedAt: z.string(),
  targets: v3QualificationTargetSchema,
  ciFixtures: ciFixtureCategorySchema,
  disallowedClaimsExcluded: z.boolean(),
  supportedClaims: z.array(z.string()),
  disallowedClaimsDetected: z.array(z.string()),
  passed: z.boolean(),
});

export type V3QualificationReport = z.infer<typeof v3QualificationReportSchema>;
