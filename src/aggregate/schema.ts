import { z } from "zod";

import { acceptanceReportSchema } from "../acceptance/schema.js";
import { qualityGateReportSchema } from "../quality-gate/schema.js";

export const parsedQualityGateReportSchema = z.object(qualityGateReportSchema).strict();
export const parsedAcceptanceReportSchema = acceptanceReportSchema.strict();

const acceptanceStatusSchema = z.enum(["pass", "fail", "unverified"]);

export const aggregateReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    contractId: z.string().optional(),
    contractPath: z.string(),
    outputDirectory: z.string(),
    failOn: z.enum(["error", "warning"]),
    requiredProfiles: z.array(z.string()),
    suppliedProfiles: z.array(z.string()),
    profiles: z.array(
      z.object({
        profile: z.string(),
        directory: z.string(),
        qualityReportPath: z.string(),
        acceptanceReportPath: z.string(),
        complete: z.boolean(),
        passed: z.boolean(),
        issues: z.array(z.string()),
      }),
    ),
    criteria: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        severity: z.enum(["blocker", "warning"]),
        status: acceptanceStatusSchema,
        profiles: z.array(
          z.object({
            profile: z.string(),
            status: acceptanceStatusSchema,
            acceptanceReportPath: z.string().optional(),
          }),
        ),
      }),
    ),
    issues: z.array(z.string()),
    summary: z.object({
      profilesRequired: z.number().int().nonnegative(),
      profilesSupplied: z.number().int().nonnegative(),
      profilesPassed: z.number().int().nonnegative(),
      criteriaPassed: z.number().int().nonnegative(),
      criteriaFailed: z.number().int().nonnegative(),
      criteriaUnverified: z.number().int().nonnegative(),
      blockerFailures: z.number().int().nonnegative(),
      blockerUnverified: z.number().int().nonnegative(),
      warningFailures: z.number().int().nonnegative(),
      warningUnverified: z.number().int().nonnegative(),
    }),
    complete: z.boolean(),
    passed: z.boolean(),
  })
  .strict();
