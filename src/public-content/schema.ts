import { z } from "zod";

export const publicContentPolicySchema = z
  .object({
    version: z.literal("1.0"),
    id: z.string().min(1),
    authority: z.literal("SKILL.md"),
    reviewedBy: z.string().min(1),
    reviewedAt: z.string().datetime({ offset: true }),
    policy: z
      .object({
        scanTrackedFiles: z.boolean(),
        failClosedOnUnclassifiedEvidence: z.boolean(),
        redactFindings: z.boolean(),
      })
      .strict(),
    approvedPublicRoots: z.array(z.string().endsWith("/")).min(1),
    approvedRootFiles: z.array(z.string().min(1)),
    blockedPathPrefixes: z.array(z.string().endsWith("/")),
    evidenceRules: z.array(
      z
        .object({
          id: z.string().min(1),
          pathPrefix: z.string().endsWith("/"),
          privacyClassification: z.string().min(1),
          publicationDecision: z.enum(["approved-public", "private-only", "blocked"]),
          allowedAttribution: z.string().min(1),
          personalDataReviewed: z.boolean(),
        })
        .strict(),
    ),
    consentedAttributionLabels: z.array(z.string().min(1)),
    anonymousLabelPattern: z.string().min(1),
  })
  .strict();

export type PublicContentPolicy = z.infer<typeof publicContentPolicySchema>;

export const publicContentFindingSchema = z
  .object({
    ruleId: z.string(),
    severity: z.enum(["error", "warning", "info"]),
    path: z.string(),
    policy: z.string(),
    message: z.string(),
    remediation: z.string(),
  })
  .strict();

export const publicContentReportSchema = z
  .object({
    version: z.literal("1.0"),
    policyId: z.string(),
    status: z.enum(["pass", "fail"]),
    scannedMode: z.enum(["git-tracked", "filesystem"]),
    filesScanned: z.number().int().nonnegative(),
    evidenceFiles: z.number().int().nonnegative(),
    classifiedEvidenceFiles: z.number().int().nonnegative(),
    findingCount: z.number().int().nonnegative(),
    findings: z.array(publicContentFindingSchema),
  })
  .strict();

export type PublicContentReport = z.infer<typeof publicContentReportSchema>;
