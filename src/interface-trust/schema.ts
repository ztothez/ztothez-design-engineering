import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const pathText = boundedText(1_024);

export const dataModeSchema = z.enum(["demo", "live", "hybrid", "imported", "cached"]);
export const connectionSchema = z.enum([
  "unknown",
  "checking",
  "connected",
  "degraded",
  "disconnected",
]);
export const resultOriginSchema = z.enum(["live", "simulated", "imported", "cached"]);
export const trustScenarioSchema = z.enum([
  "demo",
  "live",
  "fallback",
  "stale",
  "disconnected",
]);

export const trustSourceKindSchema = z.enum([
  "runtime-probe",
  "authenticated-api",
  "runtime-processing",
  "user-input",
  "import-record",
  "cache-record",
  "demo-fixture",
  "local-simulation",
  "configuration",
]);

export const trustClaimKindSchema = z.enum([
  "data-mode",
  "connection-status",
  "result-origin",
  "freshness",
  "environment",
  "scope",
  "processing-boundary",
  "limitation",
  "interface-availability",
  "backend-availability",
]);

export const trustLocationSchema = z.enum([
  "shell",
  "before-action",
  "loading",
  "result",
  "error",
  "history",
  "export",
]);

const trustSourceSchema = z
  .object({
    id: idSchema,
    kind: trustSourceKindSchema,
    authority: z.enum(["runtime", "user", "fixture", "cache", "configuration"]),
    description: boundedText(512),
    evidence: pathText.optional(),
    checkedAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

const freshnessSchema = z
  .object({
    status: z.enum(["current", "stale", "unknown", "not-applicable"]),
    observedAt: z.string().datetime({ offset: true }).optional(),
    timezone: boundedText(128).optional(),
  })
  .strict()
  .superRefine((freshness, context) => {
    const timestampRequired = freshness.status === "current" || freshness.status === "stale";
    if (timestampRequired && !freshness.observedAt) {
      context.addIssue({
        code: "custom",
        path: ["observedAt"],
        message: "Current and stale freshness states require an offset timestamp.",
      });
    }
    if (timestampRequired && !freshness.timezone) {
      context.addIssue({
        code: "custom",
        path: ["timezone"],
        message: "Current and stale freshness states require an explicit timezone.",
      });
    }
  });

const trustStateSchema = z
  .object({
    id: idSchema,
    scenario: trustScenarioSchema,
    dataMode: dataModeSchema,
    connection: connectionSchema,
    result: z
      .object({
        availability: z.enum(["none", "pending", "available", "partial", "failed"]),
        origin: resultOriginSchema.optional(),
      })
      .strict(),
    freshness: freshnessSchema,
    environment: boundedText(256),
    scope: boundedText(512),
    limitations: z.array(boundedText(512)).max(30),
    sourceRefs: z.array(idSchema).min(1).max(50),
    recoveryAction: boundedText(512).optional(),
  })
  .strict()
  .superRefine((state, context) => {
    const resultRequiresOrigin = state.result.availability === "available" || state.result.availability === "partial";
    if (resultRequiresOrigin && !state.result.origin) {
      context.addIssue({
        code: "custom",
        path: ["result", "origin"],
        message: "Available and partial results require an explicit origin.",
      });
    }
    if (!resultRequiresOrigin && state.result.origin) {
      context.addIssue({
        code: "custom",
        path: ["result", "origin"],
        message: "Only available or partial results may declare an origin.",
      });
    }
  });

const trustClaimSchema = z
  .object({
    id: idSchema,
    state: idSchema,
    kind: trustClaimKindSchema,
    text: boundedText(1_024),
    classification: z.enum(["verified", "demonstration", "unknown"]),
    sourceRefs: z.array(idSchema).max(50),
    locations: z.array(trustLocationSchema).min(1).max(7),
    visibility: z.enum(["persistent", "contextual"]),
  })
  .strict();

const trustActionSchema = z
  .object({
    id: idSchema,
    label: boundedText(160),
    outcome: boundedText(512),
    consequential: z.boolean(),
    stateRefs: z.array(idSchema).min(1).max(50),
    disclosureClaimRefs: z.array(idSchema).max(200),
  })
  .strict();

const provenanceFieldSchema = z.enum([
  "data-mode",
  "connection",
  "result-origin",
  "freshness",
  "environment",
  "scope",
  "limitations",
]);

const provenanceRecordSchema = z
  .object({
    enabled: z.boolean(),
    fields: z.array(provenanceFieldSchema).max(7),
    stateRefs: z.array(idSchema).max(50),
    disclosureClaimRefs: z.array(idSchema).max(500),
  })
  .strict();

export const interfaceTrustContractSchema = z
  .object({
    version: z.literal("1.0"),
    id: idSchema,
    product: boundedText(256),
    preparedAt: z.string().datetime({ offset: true }),
    preparedBy: z
      .object({
        type: z.enum(["agent", "human", "mixed"]),
        name: boundedText(256),
      })
      .strict(),
    sources: z.array(trustSourceSchema).min(1).max(500),
    states: z.array(trustStateSchema).min(5).max(500),
    claims: z.array(trustClaimSchema).min(1).max(5_000),
    actions: z.array(trustActionSchema).max(500),
    records: z
      .object({
        history: provenanceRecordSchema,
        export: provenanceRecordSchema,
      })
      .strict(),
    security: z
      .object({
        allowsEmbeddedCredentials: z.literal(false),
        credentialSources: z
          .array(z.enum(["environment", "secret-manager", "oauth", "user-runtime", "none"]))
          .min(1)
          .max(5),
      })
      .strict(),
  })
  .strict();

export const interfaceTrustFindingSchema = z
  .object({
    ruleId: z.string().regex(/^ZTDE-TRUST-[0-9]{3}$/),
    severity: z.enum(["error", "warning", "info"]),
    path: z.string(),
    message: z.string(),
    remediation: z.string(),
  })
  .strict();

export const interfaceTrustReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    sourcePath: z.string(),
    contractId: z.string(),
    product: z.string(),
    findings: z.array(interfaceTrustFindingSchema),
    coverage: z.object({
      sources: z.number().int().nonnegative(),
      states: z.number().int().nonnegative(),
      claims: z.number().int().nonnegative(),
      actions: z.number().int().nonnegative(),
      scenarios: z.record(trustScenarioSchema, z.boolean()),
    }),
    traceability: z.array(
      z
        .object({
          claim: z.string(),
          state: z.string(),
          classification: z.enum(["verified", "demonstration", "unknown"]),
          sourceRefs: z.array(z.string()),
          traced: z.boolean(),
        })
        .strict(),
    ),
    summary: z.object({
      errors: z.number().int().nonnegative(),
      warnings: z.number().int().nonnegative(),
      info: z.number().int().nonnegative(),
    }),
    passed: z.boolean(),
    limitations: z.array(z.string()),
  })
  .strict();

export type InterfaceTrustContract = z.infer<typeof interfaceTrustContractSchema>;
export type InterfaceTrustFinding = z.infer<typeof interfaceTrustFindingSchema>;
export type InterfaceTrustReport = z.infer<typeof interfaceTrustReportSchema>;
