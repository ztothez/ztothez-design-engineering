import { z } from "zod";

export const modelLifecycleSchema = z.enum(["draft", "shadow", "active", "deprecated"]);

export const authorityClassSchema = z.enum([
  "official-requirement",
  "measured-evidence",
  "heuristic",
  "product-specific",
  "project-policy",
]);

export const evidenceClassSchema = z.enum([
  "official-standard",
  "owner-authored",
  "owner-authorized-product-evidence",
  "synthetic-fixture",
  "automated-verification",
  "ai-assisted-expert-review",
  "human-expert-review",
  "representative-user-testing",
  "knowledge-gap",
]);

export const entityCategorySchema = z.enum([
  "product-archetype",
  "user-task",
  "state-recovery-contract",
  "quality-attribute",
  "design-token",
  "component-responsibility",
  "information-priority",
  "interaction-pattern",
  "visual-composition",
  "accessibility-constraint",
  "evidence-class",
  "verification-method",
  "conflict-policy",
  "exception-policy",
  "abstention-policy",
]);

export const relationshipTypeSchema = z.enum([
  "activates",
  "answers",
  "constrains",
  "implemented-by",
  "verified-by",
  "evidenced-by",
  "overrides",
  "requires",
  "allows-exception",
  "abstains-when",
]);

export const modelEntitySchema = z.object({
  id: z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/),
  category: entityCategorySchema,
  name: z.string().min(1).max(160),
  lifecycle: modelLifecycleSchema,
  owner: z.literal("ZtotheZ"),
  authorityClass: authorityClassSchema,
  evidenceClass: evidenceClassSchema,
  scope: z.string().min(1).max(400),
  rationale: z.string().min(1).max(1200),
  sourceRefs: z.array(z.string().min(1)).min(1),
  metrics: z
    .array(
      z.object({
        id: z.string().regex(/^ztde-[a-z0-9-]+$/),
        kind: z.enum(["threshold", "coverage", "traceability", "state", "qualitative"]),
        value: z.string().min(1).max(240),
        authorityClass: authorityClassSchema,
      }).strict(),
    )
    .default([]),
  verificationRefs: z.array(z.string().regex(/^ZTDE-MODEL-VERIFY-[0-9]{3}$/)).default([]),
}).strict();

export const modelRelationshipSchema = z.object({
  id: z.string().regex(/^ZTDE-MODEL-REL-[0-9]{3}$/),
  type: relationshipTypeSchema,
  from: z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/),
  to: z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/),
  rationale: z.string().min(1).max(600),
}).strict();

export const modelConflictSchema = z.object({
  id: z.string().regex(/^ZTDE-MODEL-CONFLICT-[0-9]{3}$/),
  when: z.string().min(1).max(500),
  higherPriorityEntity: z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/),
  lowerPriorityEntity: z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/),
  resolution: z.string().min(1).max(800),
  evidenceRequired: z.array(evidenceClassSchema).min(1),
}).strict();

export const modelDecisionTraceSchema = z.object({
  id: z.string().regex(/^ZTDE-MODEL-TRACE-[0-9]{3}$/),
  taskRef: z.string().regex(/^ZTDE-MODEL-TASK-[0-9]{3}$/),
  orderedEntityRefs: z.array(z.string().regex(/^ZTDE-MODEL-[A-Z0-9]+-[0-9]{3}$/)).min(5),
  requiredVerificationRefs: z.array(z.string().regex(/^ZTDE-MODEL-VERIFY-[0-9]{3}$/)).min(1),
  expectedEvidenceClasses: z.array(evidenceClassSchema).min(1),
}).strict();

export const designEngineeringModelSchema = z.object({
  version: z.literal("1.0"),
  product: z.literal("ZtotheZ Design Engineering"),
  authority: z.literal("SKILL.md"),
  lifecycle: z.literal("shadow"),
  cutoverStatus: z.literal("not-authoritative-until-v5-item-8"),
  policy: z.object({
    markdownRemainsWorkflowAuthorityDuringMigration: z.literal(true),
    privateSourcesAreRuntimeFallbacks: z.literal(false),
    unsupportedRequestsProduceKnowledgeGap: z.literal(true),
    documentOrderCannotResolveContradictions: z.literal(true),
  }).strict(),
  sourceRegistry: z.object({
    admissionManifest: z.literal("governance/knowledge-admission.json"),
    officialStandards: z.array(z.string().regex(/^[a-z0-9][a-z0-9.-]*$/)).min(1),
    projectPolicySources: z.array(z.literal("ztothez-design-engineering-policy")).min(1),
  }).strict(),
  entities: z.array(modelEntitySchema).min(1),
  relationships: z.array(modelRelationshipSchema).min(1),
  conflicts: z.array(modelConflictSchema).min(1),
  decisionTraces: z.array(modelDecisionTraceSchema).min(1),
}).strict();

export type DesignEngineeringModel = z.infer<typeof designEngineeringModelSchema>;
export type ModelValidationReport = {
  version: "1.0";
  status: "pass" | "fail";
  lifecycle: "shadow";
  entityCount: number;
  relationshipCount: number;
  conflictCount: number;
  decisionTraceCount: number;
  categoryCoverage: Record<string, number>;
  findingCount: number;
  findings: Array<{
    ruleId: string;
    severity: "error" | "warning";
    path: string;
    message: string;
    remediation: string;
  }>;
};
