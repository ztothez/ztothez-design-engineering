import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const repairRelativePathSchema = z
  .string()
  .min(1)
  .max(1_024)
  .refine(
    (value) =>
      !value.includes("\0") &&
      !value.startsWith("/") &&
      !/^[A-Za-z]:[\\/]/.test(value) &&
      !value.split(/[\\/]/).includes(".."),
    "Repair paths must remain relative and cannot contain parent traversal.",
  );

export const repairFindingReferenceSchema = z
  .object({
    id: idSchema,
    source: z.enum(["architecture", "runtime"]),
    checkId: z.string().min(1).max(128),
    file: repairRelativePathSchema.optional(),
    messageIncludes: z.string().min(1).max(512).optional(),
    viewport: z.string().min(1).max(128).optional(),
    journey: z.string().min(1).max(128).optional(),
    selector: z.string().min(1).max(1_024).optional(),
    acceptanceCriterion: idSchema,
    expectedEvidence: z
      .array(
        z.enum([
          "contract-validation",
          "static-audit",
          "browser-runtime",
          "responsive-screenshots",
        ]),
      )
      .min(1)
      .max(4),
  })
  .strict()
  .superRefine((finding, context) => {
    if (finding.source === "architecture" && !finding.file) {
      context.addIssue({
        code: "custom",
        path: ["file"],
        message: "Architecture findings require a repository-relative file.",
      });
    }
    if (new Set(finding.expectedEvidence).size !== finding.expectedEvidence.length) {
      context.addIssue({
        code: "custom",
        path: ["expectedEvidence"],
        message: "Expected evidence entries must be unique.",
      });
    }
  });

export const exactReplacementSchema = z
  .object({
    id: idSchema,
    findingRef: idSchema,
    kind: z.literal("replace-exact"),
    file: repairRelativePathSchema,
    expectedFileDigest: digestSchema,
    before: z.string().min(1).max(100_000),
    after: z.string().max(100_000),
    expectedOccurrences: z.number().int().min(1).max(20),
  })
  .strict()
  .refine((operation) => operation.before !== operation.after, {
    message: "A repair replacement must change the matched text.",
    path: ["after"],
  });

export const repairAttemptSchema = z
  .object({
    id: idSchema,
    operations: z.array(exactReplacementSchema).min(1).max(20),
  })
  .strict();

export const repairRequestSchema = z
  .object({
    version: z.literal("1.0"),
    id: idSchema,
    target: z
      .object({
        adapter: z.literal("react-typescript-vite"),
        manifest: repairRelativePathSchema,
      })
      .strict(),
    findings: z.array(repairFindingReferenceSchema).min(1).max(20),
    attempts: z.array(repairAttemptSchema).min(1).max(3),
    stopping: z
      .object({
        maxAttempts: z.number().int().min(1).max(3),
        resolved: z.literal("all-referenced-findings-absent-and-quality-gate-passed"),
        repeatedFinding: z.literal("stop-unresolved-and-restore"),
        preconditionFailure: z.literal("stop-without-write"),
        verificationFailure: z.literal("stop-unresolved-and-restore"),
      })
      .strict(),
  })
  .strict()
  .superRefine((request, context) => {
    const findingIds = request.findings.map((finding) => finding.id);
    if (new Set(findingIds).size !== findingIds.length) {
      context.addIssue({ code: "custom", path: ["findings"], message: "Finding IDs must be unique." });
    }
    const attemptIds = request.attempts.map((attempt) => attempt.id);
    if (new Set(attemptIds).size !== attemptIds.length) {
      context.addIssue({ code: "custom", path: ["attempts"], message: "Attempt IDs must be unique." });
    }
    if (request.stopping.maxAttempts !== request.attempts.length) {
      context.addIssue({
        code: "custom",
        path: ["stopping", "maxAttempts"],
        message: "maxAttempts must equal the number of declared attempts.",
      });
    }
    const operationIds = request.attempts.flatMap((attempt) =>
      attempt.operations.map((operation) => operation.id),
    );
    if (new Set(operationIds).size !== operationIds.length) {
      context.addIssue({ code: "custom", path: ["attempts"], message: "Operation IDs must be unique." });
    }
    for (const [attemptIndex, attempt] of request.attempts.entries()) {
      for (const [operationIndex, operation] of attempt.operations.entries()) {
        if (!findingIds.includes(operation.findingRef)) {
          context.addIssue({
            code: "custom",
            path: ["attempts", attemptIndex, "operations", operationIndex, "findingRef"],
            message: `Unknown finding reference ${operation.findingRef}.`,
          });
        }
      }
    }
  });

export const repairScreenshotEvidenceSchema = z
  .object({
    name: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    sha256: digestSchema,
  })
  .strict();

export const repairEvidenceSnapshotSchema = z
  .object({
    label: z.string().min(1).max(128),
    qualityGateReport: repairRelativePathSchema,
    qualityGateDigest: digestSchema,
    runtimeReport: repairRelativePathSchema,
    runtimeDigest: digestSchema,
    targetPlanId: z.string().min(1).max(256),
    route: z.string().min(1).max(4_096),
    profile: idSchema,
    qualityGateVersion: z.string().min(1).max(64),
    runtimeVersion: z.string().min(1).max(64),
    browser: z.string().min(1).max(256),
    viewports: z.array(
      z
        .object({
          name: z.string().min(1).max(128),
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        })
        .strict(),
    ),
    journeys: z.array(z.string().min(1).max(128)),
    screenshots: z.array(repairScreenshotEvidenceSchema),
    findingFingerprints: z.array(digestSchema),
    passed: z.boolean(),
  })
  .strict();

export const repairAttemptResultSchema = z
  .object({
    id: idSchema,
    status: z.enum(["resolved", "unresolved", "not-run"]),
    operationIds: z.array(idSchema),
    changedFiles: z.array(repairRelativePathSchema),
    evidence: repairEvidenceSnapshotSchema.optional(),
    message: z.string().min(1).max(2_048),
  })
  .strict();

export const repairReportSchema = z
  .object({
    version: z.literal("1.0"),
    requestId: idSchema,
    adapter: z.literal("react-typescript-vite"),
    adapterVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    status: z.enum(["repaired", "unresolved", "rejected"]),
    reason: z.enum([
      "quality-gate-passed",
      "repeated-finding",
      "attempt-limit",
      "precondition-failed",
      "verification-failed",
    ]),
    target: z.string().min(1).max(256),
    generatedAt: z.string().datetime({ offset: true }),
    before: repairEvidenceSnapshotSchema.optional(),
    attempts: z.array(repairAttemptResultSchema).max(3),
    resolvedFindingIds: z.array(idSchema),
    unresolvedFindingIds: z.array(idSchema),
    targetRestored: z.boolean(),
    unrelatedFilesPreserved: z.boolean(),
    humanEvidence: z.literal("not-generated"),
    evidenceBoundary: z
      .object({
        verifierLimitations: z.array(z.string().min(1)),
        humanReviewRequired: z.array(z.string().min(1)),
      })
      .strict(),
  })
  .strict();

export type RepairFindingReference = z.infer<typeof repairFindingReferenceSchema>;
export type ExactReplacement = z.infer<typeof exactReplacementSchema>;
export type RepairRequest = z.infer<typeof repairRequestSchema>;
export type RepairEvidenceSnapshot = z.infer<typeof repairEvidenceSnapshotSchema>;
export type RepairAttemptResult = z.infer<typeof repairAttemptResultSchema>;
export type RepairReport = z.infer<typeof repairReportSchema>;
