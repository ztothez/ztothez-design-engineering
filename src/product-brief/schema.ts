import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const text = (maximum: number) => z.string().trim().min(1).max(maximum);
const textList = (maximumItems: number, maximumLength = 512) =>
  z.array(text(maximumLength)).max(maximumItems);

export const evidenceKindSchema = z.enum([
  "user-provided",
  "stakeholder",
  "user-research",
  "product-analytics",
  "support-record",
  "existing-product",
  "technical-source",
  "public-standard",
  "agent-assumption",
]);

const evidenceSourceSchema = z
  .object({
    id: idSchema,
    kind: evidenceKindSchema,
    description: text(1_024),
    location: text(1_024).optional(),
    owner: text(256),
  })
  .strict();

const audienceSchema = z
  .object({
    id: idSchema,
    role: text(256),
    priority: z.enum(["primary", "secondary", "affected"]),
    goals: textList(20),
    contexts: textList(20),
    constraints: textList(20),
    accessibilityNeeds: textList(20),
    expertise: z.enum(["novice", "intermediate", "expert", "mixed", "unknown"]),
    evidenceRefs: z.array(idSchema).min(1).max(50),
  })
  .strict();

const measurableBaselineSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("known"), value: text(256) }).strict(),
  z.object({ status: z.literal("unknown"), reason: text(512) }).strict(),
  z.object({ status: z.literal("not-applicable"), reason: text(512) }).strict(),
]);

const outcomeSchema = z
  .object({
    id: idSchema,
    kind: z.enum(["user", "business", "operational", "risk-reduction"]),
    statement: text(1_024),
    measure: z
      .object({
        signal: text(512),
        baseline: measurableBaselineSchema,
        target: text(512),
      })
      .strict(),
    evidenceRefs: z.array(idSchema).min(1).max(50),
  })
  .strict();

export const dataModeSchema = z.enum([
  "live",
  "demo",
  "hybrid",
  "imported",
  "cached",
  "user-input",
  "local-static",
]);

const dataSourceSchema = z
  .object({
    id: idSchema,
    name: text(256),
    mode: dataModeSchema,
    latency: z.enum(["immediate", "async", "streaming", "unknown"]),
    classification: z.enum(["public", "internal", "confidential", "restricted"]),
    sourceEvidenceRef: idSchema,
    freshness: text(512),
    limitations: textList(20),
    fallback: z
      .object({
        kind: z.enum(["none", "demo", "cache", "import", "manual"]),
        disclosure: text(512),
        preservesOrigin: z.boolean(),
      })
      .strict(),
  })
  .strict();

const taskSchema = z
  .object({
    id: idSchema,
    title: text(256),
    audienceRefs: z.array(idSchema).min(1).max(20),
    outcomeRefs: z.array(idSchema).min(1).max(20),
    dataRefs: z.array(idSchema).max(50),
    trigger: text(512),
    goal: text(1_024),
    frequency: z.enum(["continuous", "daily", "weekly", "monthly", "occasional", "one-time"]),
    criticality: z.enum(["critical", "high", "medium", "low"]),
    consequential: z.boolean(),
    inputs: textList(30),
    successSignal: text(1_024),
    failureImpact: text(1_024),
    recovery: text(1_024),
    evidenceRefs: z.array(idSchema).min(1).max(50),
  })
  .strict();

export const interfaceStateSchema = z.enum([
  "loading",
  "empty",
  "success",
  "error",
  "partial",
  "stale",
  "disconnected",
  "unauthorized",
  "blocked",
  "offline",
]);

const stateSchema = z
  .object({
    state: interfaceStateSchema,
    taskRefs: z.array(idSchema).min(1).max(100),
    behavior: text(1_024),
    recovery: text(1_024),
    disclosure: text(1_024),
  })
  .strict();

const platformSchema = z
  .object({
    id: idSchema,
    kind: z.enum(["responsive-web", "desktop-web", "mobile-web", "native-mobile", "desktop-app"]),
    priority: z.enum(["primary", "secondary"]),
    viewports: z.array(z.number().int().min(240).max(10_000)).max(20),
    inputModes: z.array(z.enum(["keyboard", "pointer", "touch", "assistive-technology"])).min(1),
    constraints: textList(20),
  })
  .strict();

const requirementSchema = z
  .object({
    id: idSchema,
    category: z.enum([
      "functional",
      "usability",
      "accessibility",
      "security",
      "privacy",
      "performance",
      "reliability",
      "maintainability",
      "content",
      "brand",
    ]),
    priority: z.enum(["must", "should", "could", "wont"]),
    statement: text(1_024),
    rationale: text(1_024),
    taskRefs: z.array(idSchema).max(100),
    evidenceRefs: z.array(idSchema).min(1).max(100),
  })
  .strict();

const assumptionSchema = z
  .object({
    id: idSchema,
    statement: text(1_024),
    risk: z.enum(["high", "medium", "low"]),
    status: z.enum(["unresolved", "validated", "rejected"]),
    evidenceRefs: z.array(idSchema).max(100),
    validationMethod: text(1_024),
  })
  .strict();

export const briefVerificationMethodSchema = z.enum([
  "static-analysis",
  "unit-test",
  "integration-test",
  "browser-test",
  "manual-human",
  "human-expert",
  "representative-user",
]);

const acceptanceCriterionSchema = z
  .object({
    id: idSchema,
    statement: text(1_024),
    requirementRefs: z.array(idSchema).min(1).max(100),
    taskRefs: z.array(idSchema).min(1).max(100),
    method: briefVerificationMethodSchema,
    expectedEvidence: text(1_024),
    blocking: z.boolean(),
  })
  .strict();

const downstreamContractSchema = z
  .object({
    kind: z.enum(["product-task", "interface-trust", "information-design", "design-deliverable"]),
    status: z.enum(["planned", "exists", "not-applicable"]),
    path: text(1_024).optional(),
    reason: text(1_024).optional(),
  })
  .strict()
  .superRefine((entry, context) => {
    if (entry.status === "exists" && !entry.path) {
      context.addIssue({ code: "custom", path: ["path"], message: "Existing downstream contracts require a path." });
    }
    if (entry.status === "not-applicable" && !entry.reason) {
      context.addIssue({ code: "custom", path: ["reason"], message: "Not-applicable downstream contracts require a reason." });
    }
  });

export const productDesignBriefSchema = z
  .object({
    version: z.literal("1.0"),
    id: idSchema,
    product: text(256),
    status: z.enum(["draft", "validated"]),
    preparedAt: z.string().datetime({ offset: true }),
    preparedBy: z.object({ type: z.enum(["agent", "human", "mixed"]), name: text(256) }).strict(),
    evidenceSources: z.array(evidenceSourceSchema).min(1).max(500),
    problem: z
      .object({
        statement: text(1_024),
        currentOutcome: text(1_024),
        desiredOutcome: text(1_024),
        evidenceRefs: z.array(idSchema).min(1).max(100),
      })
      .strict(),
    scope: z.object({ included: textList(100).min(1), excluded: textList(100).min(1) }).strict(),
    audiences: z.array(audienceSchema).min(1).max(100),
    outcomes: z.array(outcomeSchema).min(1).max(200),
    dataSources: z.array(dataSourceSchema).min(1).max(500),
    tasks: z.array(taskSchema).min(1).max(500),
    states: z.array(stateSchema).min(1).max(20),
    platforms: z.array(platformSchema).min(1).max(20),
    constraints: textList(100, 1_024),
    requirements: z.array(requirementSchema).min(1).max(1_000),
    assumptions: z.array(assumptionSchema).max(500),
    acceptanceCriteria: z.array(acceptanceCriterionSchema).min(1).max(2_000),
    downstreamContracts: z.array(downstreamContractSchema).length(4),
  })
  .strict();

export const productBriefFindingSchema = z
  .object({
    ruleId: z.string().regex(/^ZTDE-BRIEF-[0-9]{3}$/),
    severity: z.enum(["error", "warning", "info"]),
    path: z.string(),
    message: z.string(),
    remediation: z.string(),
  })
  .strict();

export const productBriefReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    sourcePath: z.string(),
    briefId: z.string(),
    product: z.string(),
    findings: z.array(productBriefFindingSchema),
    coverage: z
      .object({
        evidenceSources: z.number().int().nonnegative(),
        audiences: z.number().int().nonnegative(),
        primaryAudiences: z.number().int().nonnegative(),
        outcomes: z.number().int().nonnegative(),
        tasks: z.number().int().nonnegative(),
        dataSources: z.number().int().nonnegative(),
        states: z.number().int().nonnegative(),
        platforms: z.number().int().nonnegative(),
        requirements: z.number().int().nonnegative(),
        acceptanceCriteria: z.number().int().nonnegative(),
      })
      .strict(),
    summary: z.object({ errors: z.number().int().nonnegative(), warnings: z.number().int().nonnegative(), info: z.number().int().nonnegative() }).strict(),
    passed: z.boolean(),
    generationReady: z.boolean(),
    limitations: z.array(z.string()),
  })
  .strict();

export type ProductDesignBrief = z.infer<typeof productDesignBriefSchema>;
export type ProductBriefFinding = z.infer<typeof productBriefFindingSchema>;
export type ProductBriefReport = z.infer<typeof productBriefReportSchema>;
