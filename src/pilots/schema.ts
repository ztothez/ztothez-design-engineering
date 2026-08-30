import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const portablePathSchema = z.string().min(1).max(1_024).refine(
  (value) =>
    !value.includes("\0") &&
    !value.startsWith("/") &&
    !/^[A-Za-z]:[\\/]/.test(value) &&
    !value.split(/[\\/]/).includes(".."),
  "Pilot paths must be portable repository-relative paths without traversal.",
);

export const pilotQualificationConfigSchema = z.object({
  version: z.literal("1.0"),
  id: idSchema,
  requiredViewports: z.array(z.object({
    width: z.number().int().min(240).max(3_840),
    height: z.number().int().min(240).max(2_160),
  }).strict()).min(4).max(8),
  products: z.array(z.object({
    id: idSchema,
    domain: idSchema,
    brief: portablePathSchema,
    plan: portablePathSchema,
    fixture: portablePathSchema,
    sourcePolicy: z.literal("repository-owned-fixture"),
    evidenceDirectory: idSchema,
    profiles: z.array(idSchema).min(1).max(20),
    interactionContract: portablePathSchema.optional(),
    interactionProfiles: z.array(idSchema).min(1).max(20).optional(),
  }).strict()).min(3).max(20),
}).strict().superRefine((config, context) => {
  if (new Set(config.products.map((product) => product.id)).size !== config.products.length) {
    context.addIssue({ code: "custom", path: ["products"], message: "Pilot product IDs must be unique." });
  }
  for (const [index, product] of config.products.entries()) {
    if (new Set(product.profiles).size !== product.profiles.length) {
      context.addIssue({ code: "custom", path: ["products", index, "profiles"], message: "Pilot profile IDs must be unique." });
    }
    if (Boolean(product.interactionContract) !== Boolean(product.interactionProfiles)) {
      context.addIssue({ code: "custom", path: ["products", index], message: "Interaction contract and profiles must be declared together." });
    }
    const allProfiles = [...product.profiles, ...(product.interactionProfiles ?? [])];
    if (new Set(allProfiles).size !== allProfiles.length) {
      context.addIssue({ code: "custom", path: ["products", index], message: "Historical and interaction profile IDs must not overlap." });
    }
  }
});

export type PilotQualificationConfig = z.infer<typeof pilotQualificationConfigSchema>;

const pilotStageSchema = z.object({
  passed: z.boolean(),
  evidence: z.array(portablePathSchema),
}).strict();

export const pilotProductResultSchema = z.object({
  id: idSchema,
  domain: idSchema,
  sourcePolicy: z.literal("repository-owned-fixture"),
  stages: z.object({
    brief: pilotStageSchema,
    plan: pilotStageSchema,
    implementation: pilotStageSchema,
    verification: pilotStageSchema,
    interaction: pilotStageSchema.optional(),
  }).strict(),
  profiles: z.array(z.object({
    id: idSchema,
    passed: z.boolean(),
    journeys: z.number().int().nonnegative(),
    screenshots: z.number().int().nonnegative(),
  }).strict()),
  manifestOwnedFiles: z.number().int().nonnegative(),
  adaptedManifestFiles: z.array(portablePathSchema),
  systemDefects: z.array(z.string()),
  productFindings: z.array(z.string()),
  verifierLimitations: z.array(z.string()),
  sourcePolicyRestrictions: z.array(z.string()),
  passed: z.boolean(),
}).strict();

export const pilotQualificationReportSchema = z.object({
  version: z.literal("1.0"),
  qualificationId: idSchema,
  generatedAt: z.string().datetime(),
  products: z.array(pilotProductResultSchema).min(3),
  criteria: z.object({
    threeProductDomains: z.boolean(),
    briefsReady: z.boolean(),
    plansReadyAndTraceable: z.boolean(),
    implementationsContained: z.boolean(),
    browserProfilesPassing: z.boolean(),
    declaredInteractionContractsPassing: z.boolean(),
    evidenceClassified: z.boolean(),
    humanEvidenceNotGenerated: z.literal(true),
  }).strict(),
  supportedClaims: z.array(z.string()),
  humanEvidence: z.literal("not-generated"),
  passed: z.boolean(),
}).strict();

export type PilotQualificationReport = z.infer<typeof pilotQualificationReportSchema>;
