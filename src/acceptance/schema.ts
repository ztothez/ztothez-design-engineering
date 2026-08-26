import { z } from "zod";

const acceptanceStatusSchema = z.enum(["pass", "fail", "unverified"]);

export const acceptanceAttestationFileSchema = z
  .object({
    version: z.literal("1.0"),
    contract: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
    attestations: z.array(
      z
        .object({
          criterion: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
          status: z.enum(["pass", "fail"]),
          reviewer: z.string().trim().min(1).max(256),
          reviewedAt: z.string().datetime({ offset: true }),
          notes: z.string().trim().min(1).max(2_048),
          evidence: z.array(z.string().trim().min(1).max(1_024)).min(1),
        })
        .strict(),
    ),
  })
  .strict();

const acceptanceEvidenceResultSchema = z.object({
  type: z.enum([
    "contract",
    "runtime",
    "screenshot",
    "network",
    "accessibility",
    "export",
    "manual-review",
  ]),
  status: acceptanceStatusSchema,
  message: z.string(),
  evidence: z.array(z.string()),
});

export const acceptanceReportSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  contractId: z.string(),
  profile: z.string(),
  criteria: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.enum(["blocker", "warning"]),
      status: acceptanceStatusSchema,
      journeys: z.array(z.string()),
      evidence: z.array(acceptanceEvidenceResultSchema),
    }),
  ),
  summary: z.object({
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    unverified: z.number().int().nonnegative(),
    blockerFailures: z.number().int().nonnegative(),
    blockerUnverified: z.number().int().nonnegative(),
    warningFailures: z.number().int().nonnegative(),
    warningUnverified: z.number().int().nonnegative(),
  }),
  passed: z.boolean(),
});
