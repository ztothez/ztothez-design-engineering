import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const pathText = boundedText(1_024);

export const hierarchyLevelSchema = z.enum([
  "context-provenance",
  "primary-outcome-action",
  "critical-exceptions",
  "health-impact-metrics",
  "prioritized-findings",
  "operational-telemetry",
  "evidence-audit-trail",
  "history-exports",
]);

export const answerQuestionSchema = z.enum([
  "identify-context",
  "identify-priority",
  "explain-impact",
  "inspect-evidence",
  "identify-next-action",
  "verify-success",
]);

const sourceSchema = z
  .object({
    id: idSchema,
    kind: z.enum([
      "runtime",
      "calculation",
      "user-input",
      "configuration",
      "import",
      "cache",
      "fixture",
    ]),
    description: boundedText(512),
    evidence: pathText.optional(),
  })
  .strict();

const freshnessSchema = z
  .object({
    id: idSchema,
    status: z.enum(["current", "stale", "unknown", "not-applicable"]),
    observedAt: z.string().datetime({ offset: true }).optional(),
    timezone: boundedText(128).optional(),
    sourceRef: idSchema,
  })
  .strict()
  .superRefine((freshness, context) => {
    if (["current", "stale"].includes(freshness.status)) {
      if (!freshness.observedAt) {
        context.addIssue({ code: "custom", path: ["observedAt"], message: "Current and stale data require an offset timestamp." });
      }
      if (!freshness.timezone) {
        context.addIssue({ code: "custom", path: ["timezone"], message: "Current and stale data require an explicit timezone." });
      }
    }
  });

const baselineSchema = z
  .object({
    id: idSchema,
    kind: z.enum(["previous-period", "target", "benchmark", "control"]),
    label: boundedText(256),
    sourceRefs: z.array(idSchema).min(1).max(50),
  })
  .strict();

const destinationSchema = z
  .object({
    id: idSchema,
    label: boundedText(256),
    kind: z.enum(["drill-down", "action", "owner", "history", "export", "external"]),
    target: boundedText(1_024),
  })
  .strict();

const contextSchema = z
  .object({
    id: idSchema,
    environment: boundedText(256),
    scope: boundedText(512),
    dataDescription: boundedText(1_024),
    sourceRefs: z.array(idSchema).min(1).max(50),
    freshnessRef: idSchema,
    limitations: z.array(boundedText(512)).max(30),
  })
  .strict();

const labelPolicySchema = z
  .object({
    id: idSchema,
    maxVisibleCharacters: z.number().int().min(20).max(500),
    overflow: z.enum(["wrap", "truncate-with-reveal"]),
    accessibleReveal: z.boolean(),
  })
  .strict();

const valueStateSchema = z
  .object({
    label: boundedText(160),
    behavior: boundedText(512),
  })
  .strict();

const valuePolicySchema = z
  .object({
    id: idSchema,
    states: z
      .object({
        loading: valueStateSchema,
        available: valueStateSchema,
        missing: valueStateSchema,
        partial: valueStateSchema,
        stale: valueStateSchema,
        error: valueStateSchema,
      })
      .strict(),
  })
  .strict();

const evidenceSchema = z
  .object({
    id: idSchema,
    sourceRef: idSchema,
    kind: z.enum(["observation", "log", "configuration", "calculation", "user-report", "document"]),
    description: boundedText(1_024),
    location: pathText,
  })
  .strict();

const metricBaselineSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("available"), reference: idSchema }).strict(),
  z.object({ status: z.enum(["not-applicable", "unknown"]), reason: boundedText(512) }).strict(),
]);

const metricSchema = z
  .object({
    id: idSchema,
    label: boundedText(256),
    definition: boundedText(1_024),
    formula: boundedText(1_024),
    sourceRefs: z.array(idSchema).min(1).max(50),
    contextRef: idSchema,
    scope: boundedText(512),
    period: z
      .object({
        kind: z.enum(["point-in-time", "rolling", "fixed", "lifetime", "not-applicable"]),
        label: boundedText(256),
      })
      .strict(),
    freshnessRef: idSchema,
    baseline: metricBaselineSchema,
    drilldownRef: idSchema,
    limitations: z.array(boundedText(512)).max(30),
    supportedDecision: z
      .object({
        question: boundedText(512),
        action: boundedText(512),
      })
      .strict(),
    labelPolicyRef: idSchema,
    valuePolicyRef: idSchema,
    decorative: z.boolean(),
  })
  .strict();

const findingSchema = z
  .object({
    id: idSchema,
    title: boundedText(256),
    severity: z.enum(["critical", "high", "medium", "low", "info"]),
    affectedEntities: z
      .array(
        z.object({ id: boundedText(256), type: boundedText(128), label: boundedText(256) }).strict(),
      )
      .min(1)
      .max(500),
    observation: boundedText(1_024),
    evidenceRefs: z.array(idSchema).min(1).max(100),
    impact: z
      .object({
        category: z.enum(["operational", "financial", "security", "user", "compliance", "reliability"]),
        statement: boundedText(1_024),
      })
      .strict(),
    confidence: z
      .object({
        level: z.enum(["high", "medium", "low"]),
        basis: boundedText(1_024),
      })
      .strict(),
    remediation: boundedText(1_024),
    destinationRef: idSchema,
    validation: z
      .object({
        method: boundedText(1_024),
        expectedSignal: boundedText(1_024),
        evidenceRefs: z.array(idSchema).min(1).max(100),
      })
      .strict(),
    nonColorCues: z
      .array(z.enum(["color", "text", "icon", "value", "shape", "pattern", "position"]))
      .min(2)
      .max(7),
  })
  .strict();

const chartSchema = z
  .object({
    id: idSchema,
    title: boundedText(256),
    purpose: boundedText(1_024),
    metricRefs: z.array(idSchema).min(1).max(50),
    supportedDecision: boundedText(1_024),
    destinationRef: idSchema,
    decorative: z.boolean(),
    labeling: z
      .object({
        titleVisible: z.boolean(),
        valuesVisible: z.boolean(),
        legendVisible: z.boolean(),
        legendReason: boundedText(512).optional(),
      })
      .strict(),
    alternative: z
      .object({
        kind: z.enum(["table", "text"]),
        destinationRef: idSchema,
      })
      .strict(),
    valuePolicyRef: idSchema,
  })
  .strict();

const collectionSchema = z
  .object({
    id: idSchema,
    label: boundedText(256),
    entity: boundedText(256),
    estimatedMaximumItems: z.number().int().nonnegative().max(10_000_000),
    strategy: z.enum(["pagination", "virtualization", "grouping", "bounded"]),
    search: z.boolean(),
    filter: z.boolean(),
    sort: z.boolean(),
    emptyState: boundedText(512),
    partialState: boundedText(512),
    staleState: boundedText(512),
    labelPolicyRef: idSchema,
  })
  .strict();

const hierarchyEntrySchema = z
  .object({
    level: hierarchyLevelSchema,
    order: z.number().int().min(1).max(8),
    contextRefs: z.array(idSchema).max(50),
    metricRefs: z.array(idSchema).max(100),
    findingRefs: z.array(idSchema).max(100),
    chartRefs: z.array(idSchema).max(100),
    destinationRefs: z.array(idSchema).max(100),
  })
  .strict();

const taskSchema = z
  .object({
    id: idSchema,
    question: answerQuestionSchema,
    prompt: boundedText(1_024),
    contextRefs: z.array(idSchema).max(50),
    metricRefs: z.array(idSchema).max(100),
    findingRefs: z.array(idSchema).max(100),
    destinationRefs: z.array(idSchema).max(100),
    expectedAnswer: boundedText(1_024),
    nonColorRequired: z.literal(true),
  })
  .strict();

export const informationDesignContractSchema = z
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
    sources: z.array(sourceSchema).min(1).max(500),
    freshness: z.array(freshnessSchema).min(1).max(500),
    baselines: z.array(baselineSchema).max(500),
    destinations: z.array(destinationSchema).min(1).max(500),
    contexts: z.array(contextSchema).min(1).max(500),
    labelPolicies: z.array(labelPolicySchema).min(1).max(100),
    valuePolicies: z.array(valuePolicySchema).min(1).max(100),
    evidence: z.array(evidenceSchema).min(1).max(5_000),
    metrics: z.array(metricSchema).min(1).max(5_000),
    findings: z.array(findingSchema).min(1).max(5_000),
    charts: z.array(chartSchema).max(1_000),
    collections: z.array(collectionSchema).max(1_000),
    hierarchy: z.array(hierarchyEntrySchema).length(8),
    tasks: z.array(taskSchema).min(6).max(500),
  })
  .strict();

export const informationDesignFindingSchema = z
  .object({
    ruleId: z.string().regex(/^ZTDE-INFO-[0-9]{3}$/),
    severity: z.enum(["error", "warning", "info"]),
    path: z.string(),
    message: z.string(),
    remediation: z.string(),
  })
  .strict();

export const informationDesignReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    sourcePath: z.string(),
    contractId: z.string(),
    product: z.string(),
    findings: z.array(informationDesignFindingSchema),
    coverage: z
      .object({
        sources: z.number().int().nonnegative(),
        contexts: z.number().int().nonnegative(),
        metrics: z.number().int().nonnegative(),
        findings: z.number().int().nonnegative(),
        charts: z.number().int().nonnegative(),
        collections: z.number().int().nonnegative(),
        hierarchyLevels: z.number().int().nonnegative(),
        answerFlow: z.record(answerQuestionSchema, z.boolean()),
      })
      .strict(),
    summary: z
      .object({
        errors: z.number().int().nonnegative(),
        warnings: z.number().int().nonnegative(),
        info: z.number().int().nonnegative(),
      })
      .strict(),
    passed: z.boolean(),
    limitations: z.array(z.string()),
  })
  .strict();

export type InformationDesignContract = z.infer<typeof informationDesignContractSchema>;
export type InformationDesignFinding = z.infer<typeof informationDesignFindingSchema>;
export type InformationDesignReport = z.infer<typeof informationDesignReportSchema>;
