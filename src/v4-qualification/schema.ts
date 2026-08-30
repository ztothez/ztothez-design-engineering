import { z } from "zod";

const checksumSchema = z.string().regex(/^[a-f0-9]{64}$/);
const portablePathSchema = z.string().trim().min(1).max(1_024).refine(
  (value) =>
    !value.includes("\0") &&
    !value.startsWith("/") &&
    !/^[A-Za-z]:[\\/]/.test(value) &&
    !value.split(/[\\/]/).includes(".."),
  "Qualification paths must be portable repository-relative paths without traversal.",
);

export const v4EvidenceReferenceSchema = z.object({
  path: portablePathSchema,
  sha256: checksumSchema,
}).strict();

export const v4CommandEvidenceSchema = z.object({
  version: z.literal("1.0"),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  command: z.array(z.string().min(1).max(1_024)).min(1).max(32),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  exitCode: z.number().int(),
  passed: z.boolean(),
  stdout: v4EvidenceReferenceSchema,
  stderr: v4EvidenceReferenceSchema,
}).strict().superRefine((report, context) => {
  if (report.passed !== (report.exitCode === 0)) {
    context.addIssue({ code: "custom", message: "Command evidence pass must match exit code zero." });
  }
});

export const v4QualificationEvidenceSchema = z.object({
  version: z.literal("1.0"),
  productEvidence: z.object({
    pilotQualification: v4EvidenceReferenceSchema,
    holdoutEvaluation: v4EvidenceReferenceSchema,
  }).strict(),
  releaseGates: z.object({
    build: v4EvidenceReferenceSchema,
    typecheck: v4EvidenceReferenceSchema,
    tests: v4EvidenceReferenceSchema,
    packageCheck: v4EvidenceReferenceSchema,
    packageSmoke: v4EvidenceReferenceSchema,
    independence: v4EvidenceReferenceSchema,
    offlineRelease: v4EvidenceReferenceSchema,
    archiveRemoval: v4EvidenceReferenceSchema,
  }).strict(),
  documentation: z.object({
    readme: v4EvidenceReferenceSchema,
    installation: v4EvidenceReferenceSchema,
    workflow: v4EvidenceReferenceSchema,
  }).strict(),
}).strict();

export type V4QualificationEvidence = z.infer<typeof v4QualificationEvidenceSchema>;

export const v4QualificationReportSchema = z.object({
  version: z.literal("1.0"),
  qualifiedAt: z.string().datetime(),
  criteria: z.object({
    evidenceIntegrity: z.boolean(),
    priorItemsPassing: z.boolean(),
    ciCoverage: z.boolean(),
    cliMcpInstallationMigrationTroubleshooting: z.boolean(),
    packageAndOfflineRelease: z.boolean(),
    cleanRoomIndependence: z.boolean(),
    privateEvidenceExcluded: z.boolean(),
    humanEvidenceBoundaryPreserved: z.boolean(),
  }).strict(),
  supportedClaims: z.array(z.string()),
  limitations: z.array(z.string()),
  humanEvidence: z.literal("retained-calibration-only"),
  failureReasons: z.array(z.string()),
  passed: z.boolean(),
}).strict();

export type V4QualificationReport = z.infer<typeof v4QualificationReportSchema>;
