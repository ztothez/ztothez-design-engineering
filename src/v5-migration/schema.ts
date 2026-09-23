import { z } from "zod";

const legacyDigestSchema = z.object({
  algorithm: z.literal("sha256"),
  value: z.string().regex(/^[a-f0-9]{64}$|^absent$|^not-recorded-current-admission-baseline$/),
}).strict();

export const v5MigrationDigestSchema = z.object({
  algorithm: z.literal("sha256"),
  value: z.string().regex(/^[a-f0-9]{64}$|^absent$|^not-recorded-current-admission-baseline$|^not-present-before-rewrite$/),
}).strict();

const sourceDigestSchema = z.object({
  algorithm: z.literal("sha256"),
  value: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

const artifactPathSchema = z.string().min(1).max(1_024);

export const v5MigrationTestCountsSchema = z.union([
  z.object({
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  }).strict(),
  z.literal("count-unavailable"),
]);

const legacyCommandEvidenceSchema = z.object({
  command: z.array(z.string()).min(1),
  exitCode: z.number().int(),
  passed: z.boolean(),
  stdout: z.object({ path: artifactPathSchema, sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict().optional(),
  stderr: z.object({ path: artifactPathSchema, sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict().optional(),
}).strict();

export const v5MigrationCommandEvidenceSchema = legacyCommandEvidenceSchema.extend({
  testCounts: v5MigrationTestCountsSchema.optional(),
}).strict();

const releaseActionSchema = z.enum([
  "git-commit",
  "git-push",
  "history-rewrite",
  "tag-update",
  "npm-publish",
  "github-release",
  "website-deploy",
]);

const legacyArtifactSchema = z.object({
  id: z.string().min(1),
  path: artifactPathSchema,
  category: z.string().min(1),
  disposition: z.string().min(1),
  preChangeDigest: legacyDigestSchema,
  postChangeDigest: legacyDigestSchema,
  evidence: z.array(z.string()).min(1),
  notes: z.string().min(1),
}).strict();

export const v5MigrationArtifactSchema = z.object({
  id: z.string().min(1),
  path: artifactPathSchema,
  category: z.string().min(1),
  disposition: z.string().min(1),
  preChangeDigest: v5MigrationDigestSchema,
  postChangeDigest: v5MigrationDigestSchema,
  evidence: z.array(z.string()).min(1),
  notes: z.string().min(1),
}).strict();

export const v5MigrationRewrittenArtifactSchema = v5MigrationArtifactSchema.extend({
  derivedFrom: z.object({
    path: artifactPathSchema,
    digest: sourceDigestSchema,
  }).strict(),
}).strict();

const countsSchema = z.object({
  admitted: z.number().int().nonnegative(),
  removed: z.number().int().nonnegative(),
  privatelyArchived: z.number().int().nonnegative(),
  rewritten: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
  packageFiles: z.number().int().nonnegative().optional(),
  publicFiles: z.number().int().nonnegative().optional(),
}).strict();

const knowledgeIdentitySchema = z.object({
  admissionDigest: z.string().regex(/^[a-f0-9]{64}$/),
  inventoryDigest: z.string().regex(/^[a-f0-9]{64}$/),
  boundaryDigest: z.string().regex(/^[a-f0-9]{64}$/),
  compiledAuthorityDigest: z.string().regex(/^[a-f0-9]{64}$/),
  admittedFileCount: z.number().int().nonnegative(),
  retrievalFileCount: z.number().int().nonnegative(),
  ruleCount: z.number().int().nonnegative(),
  packageKnowledgeMatchesAdmission: z.boolean().optional(),
}).strict();

const ownerReviewSchema = z.object({
  requiredBeforePublicAction: z.array(z.string()).min(1),
  publicActions: z.record(releaseActionSchema, z.literal("not-authorized")),
}).strict();

const releaseNotesSchema = z.object({
  draftPath: artifactPathSchema.optional(),
  prohibitedComparativeInputsNamed: z.literal(false),
  summary: z.string().min(1),
}).strict();

const legacyLocalEvidenceSchema = z.object({
  commandEvidence: z.record(z.string(), legacyCommandEvidenceSchema),
  sourceRemovalQualified: z.boolean(),
  publicContentPassed: z.boolean().optional(),
  knowledgeQualityPassed: z.boolean().optional(),
  packageSmokePassed: z.boolean().optional(),
  archiveRemovalPassed: z.boolean().optional(),
}).strict();

const localEvidenceSchema = z.object({
  commandEvidence: z.record(z.string(), v5MigrationCommandEvidenceSchema),
  sourceRemovalQualified: z.boolean(),
  publicContentPassed: z.boolean().optional(),
  knowledgeQualityPassed: z.boolean().optional(),
  packageSmokePassed: z.boolean().optional(),
  archiveRemovalPassed: z.boolean().optional(),
}).strict();

export const v5MigrationReportV1Schema = z.object({
  version: z.literal("1.0"),
  generatedAt: z.string(),
  authorityPath: z.literal("SKILL.md"),
  status: z.enum(["local-qualified", "blocked"]),
  packageVersion: z.string().min(1),
  counts: countsSchema,
  knowledgeIdentity: knowledgeIdentitySchema,
  artifacts: z.object({
    removed: z.array(legacyArtifactSchema),
    privatelyArchived: z.array(legacyArtifactSchema),
    rewritten: z.array(legacyArtifactSchema),
    admitted: z.array(legacyArtifactSchema),
    blocked: z.array(legacyArtifactSchema),
  }).strict(),
  localEvidence: legacyLocalEvidenceSchema,
  ownerReview: ownerReviewSchema,
  releaseNotes: releaseNotesSchema,
  limitations: z.array(z.string()).min(1),
  claims: z.array(z.string()),
  passed: z.boolean(),
}).strict();

export const v5MigrationReportV2Schema = z.object({
  version: z.literal("2.0"),
  generatedAt: z.string().datetime(),
  authorityPath: z.literal("SKILL.md"),
  status: z.enum(["local-qualified", "blocked"]),
  packageVersion: z.string().min(1),
  counts: countsSchema,
  fileSetDifference: z.object({
    publicOnly: z.array(artifactPathSchema),
    packageOnly: z.array(artifactPathSchema),
  }).strict(),
  knowledgeIdentity: knowledgeIdentitySchema,
  artifacts: z.object({
    removed: z.array(v5MigrationArtifactSchema),
    privatelyArchived: z.array(v5MigrationArtifactSchema),
    rewritten: z.array(v5MigrationRewrittenArtifactSchema),
    admitted: z.array(v5MigrationArtifactSchema),
    blocked: z.array(v5MigrationArtifactSchema),
  }).strict(),
  localEvidence: localEvidenceSchema,
  ownerReview: ownerReviewSchema,
  releaseNotes: releaseNotesSchema,
  limitations: z.array(z.string()).min(1),
  claims: z.array(z.string()),
  passed: z.boolean(),
}).strict();

export const v5MigrationReportSchema = z.discriminatedUnion("version", [
  v5MigrationReportV1Schema,
  v5MigrationReportV2Schema,
]);

export type V5MigrationCommandEvidence = z.infer<typeof v5MigrationCommandEvidenceSchema>;
export type V5MigrationReportV1 = z.infer<typeof v5MigrationReportV1Schema>;
export type V5MigrationReport = z.infer<typeof v5MigrationReportV2Schema>;
export type AnyV5MigrationReport = z.infer<typeof v5MigrationReportSchema>;
