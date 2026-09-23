import { z } from "zod";

import { authorityClassSchema, evidenceClassSchema } from "../model/schema.js";
import { retrievalCategorySchema } from "../retrieval/schema.js";

export const COMPILED_AUTHORITY_VERSION = "1.0";
export const AUTHORITY_COMPILER_VERSION = "1.0.0";

export const ruleRegistryEntrySchema = z.object({
  id: z.string().regex(/^ZTDE-[A-Z0-9-]+-[0-9]{3}$/),
  owner: z.literal("ZtotheZ"),
  category: z.string().min(1).max(120),
  authorityClass: authorityClassSchema,
  evidenceClass: evidenceClassSchema,
  rationale: z.string().min(1).max(800),
  implementationLocations: z.array(z.string().min(1).max(240)).min(1),
  modelLinks: z.array(z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/)).min(1),
  sourceIds: z.array(z.string().min(1).max(160)).min(1),
}).strict();

export const ruleRegistrySchema = z.object({
  version: z.literal(COMPILED_AUTHORITY_VERSION),
  compilerVersion: z.literal(AUTHORITY_COMPILER_VERSION),
  authority: z.literal("SKILL.md"),
  generatedAt: z.literal("deterministic-build"),
  policy: z.object({
    generatedFromCurrentPublicBoundary: z.literal(true),
    projectPolicyIsNotExternalLaw: z.literal(true),
    privateSourcesAreNotRuntimeFallbacks: z.literal(true),
  }).strict(),
  rules: z.array(ruleRegistryEntrySchema).min(1),
}).strict();

const compiledSourceSchema = z.object({
  id: z.string().min(1).max(160),
  path: z.string().min(1).max(512),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sourceRecord: z.string().min(1).max(160),
  evidenceClass: evidenceClassSchema,
  retrieval: z.enum(["included", "excluded"]),
  package: z.literal("approved"),
}).strict();

const compiledRetrievalDocumentSchema = z.object({
  path: z.string().min(1).max(512),
  category: retrievalCategorySchema,
  sourceId: z.string().min(1).max(160),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  authority: z.enum(["authoritative", "approved"]),
}).strict();

export const compiledAuthoritySchema = z.object({
  version: z.literal(COMPILED_AUTHORITY_VERSION),
  compilerVersion: z.literal(AUTHORITY_COMPILER_VERSION),
  product: z.literal("ZtotheZ Design Engineering"),
  authority: z.literal("SKILL.md"),
  lifecycle: z.literal("shadow"),
  cutoverStatus: z.literal("not-authoritative-until-v5-item-8"),
  buildMetadata: z.object({
    generatedAt: z.literal("deterministic-build"),
    generatedBy: z.literal("ztothez-design compile-authority"),
    privateSourcesIncluded: z.literal(false),
  }).strict(),
  policy: z.object({
    markdownRemainsWorkflowAuthorityDuringMigration: z.literal(true),
    supportingFilesCannotOverrideSkill: z.literal(true),
    privateSourcesAreRuntimeFallbacks: z.literal(false),
    noMatchProducesKnowledgeGap: z.literal(true),
    projectPolicyIsNotExternalLaw: z.literal(true),
  }).strict(),
  integrity: z.object({
    admissionSha256: z.string().regex(/^[a-f0-9]{64}$/),
    modelSha256: z.string().regex(/^[a-f0-9]{64}$/),
    retrievalScopeSha256: z.string().regex(/^[a-f0-9]{64}$/),
    ruleRegistrySha256: z.string().regex(/^[a-f0-9]{64}$/),
    payloadSha256: z.string().regex(/^[a-f0-9]{64}$/),
  }).strict(),
  knowledge: z.object({
    admittedFileCount: z.number().int().nonnegative(),
    retrievalFileCount: z.number().int().nonnegative(),
    sources: z.array(compiledSourceSchema),
    retrievalDocuments: z.array(compiledRetrievalDocumentSchema),
    exactReadDocuments: z.array(compiledRetrievalDocumentSchema),
  }).strict(),
  model: z.object({
    entityCount: z.number().int().nonnegative(),
    relationshipCount: z.number().int().nonnegative(),
    conflictCount: z.number().int().nonnegative(),
    decisionTraceCount: z.number().int().nonnegative(),
    entityIds: z.array(z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/)),
  }).strict(),
  ruleRegistry: z.object({
    ruleCount: z.number().int().positive(),
    ruleIds: z.array(z.string().regex(/^ZTDE-[A-Z0-9-]+-[0-9]{3}$/)),
    sourcePaths: z.array(z.string().min(1).max(240)),
  }).strict(),
}).strict();

export type RuleRegistry = z.infer<typeof ruleRegistrySchema>;
export type RuleRegistryEntry = z.infer<typeof ruleRegistryEntrySchema>;
export type CompiledAuthority = z.infer<typeof compiledAuthoritySchema>;

export type AuthorityCompilationReport = {
  version: "1.0";
  status: "pass" | "fail";
  compilerVersion: "1.0.0";
  authorityPath: "SKILL.md";
  lifecycle: "shadow";
  admittedFileCount: number;
  retrievalFileCount: number;
  exactReadFileCount: number;
  modelEntityCount: number;
  ruleCount: number;
  payloadSha256: string;
  findingCount: number;
  findings: Array<{
    ruleId: string;
    severity: "error";
    path: string;
    message: string;
    remediation: string;
  }>;
};
