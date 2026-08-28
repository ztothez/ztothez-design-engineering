import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const tokenNameSchema = z.string().regex(/^[a-z][a-z0-9-]*(?:[.][a-z0-9][a-z0-9-]*)+$/);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const pathText = boundedText(1_024);

export const deliverableKindSchema = z.enum([
  "interface-system",
  "brand-system",
  "figma-library",
  "asset-set",
  "icon-system",
  "presentation",
]);

const requiredViewportSchema = z.union([
  z.literal(375),
  z.literal(768),
  z.literal(1024),
  z.literal(1440),
]);

export const generationStageSchema = z.enum([
  "product-task",
  "truth-data-source-contract",
  "information-architecture",
  "interaction-state-model",
  "visual-direction",
  "token-architecture",
  "implementation",
  "automated-verification",
  "human-visual-review",
]);

const contractStatusSchema = z.enum(["declared", "validated"]);

const productTaskSchema = z
  .object({
    productContractId: idSchema,
    contractPath: pathText,
    primaryUser: boundedText(256),
    task: boundedText(1_024),
    successCriteria: z.array(boundedText(512)).min(1).max(30),
    consequentialActions: z.array(boundedText(512)).max(30),
  })
  .strict();

const interfaceTrustLinkSchema = z
  .object({
    contractId: idSchema,
    contractPath: pathText,
    version: z.literal("1.0"),
    status: contractStatusSchema,
    requiredScenarios: z
      .array(z.enum(["demo", "live", "fallback", "stale", "disconnected"]))
      .length(5),
    reportPath: pathText.optional(),
    evidenceRef: idSchema.optional(),
  })
  .strict();

const informationHierarchyLinkSchema = z
  .object({
    contractId: idSchema,
    contractPath: pathText,
    version: z.literal("1.0"),
    status: contractStatusSchema,
    levels: z
      .array(
        z.enum([
          "context-provenance",
          "primary-outcome-action",
          "critical-exceptions",
          "health-impact-metrics",
          "prioritized-findings",
          "operational-telemetry",
          "evidence-audit-trail",
          "history-exports",
        ]),
      )
      .length(8),
    reportPath: pathText.optional(),
    evidenceRef: idSchema.optional(),
  })
  .strict();

const metricContractsSchema = z
  .object({
    informationContractId: idSchema,
    metrics: z
      .array(
        z
          .object({
            metricId: idSchema,
            decision: boundedText(512),
            hierarchyLevel: z.enum([
              "primary-outcome-action",
              "health-impact-metrics",
              "operational-telemetry",
            ]),
            chartRefs: z.array(idSchema).max(50),
          })
          .strict(),
      )
      .min(1)
      .max(5_000),
  })
  .strict();

const generationWorkflowSchema = z
  .object({
    steps: z
      .array(
        z
          .object({
            stage: generationStageSchema,
            status: z.enum([
              "required",
              "declared",
              "implemented",
              "verified",
              "review-required",
              "review-completed",
            ]),
            artifactRefs: z.array(idSchema).max(100),
          })
          .strict(),
      )
      .length(9),
  })
  .strict();

const visualDirectionSchema = z
  .object({
    domain: boundedText(256),
    intent: boundedText(1_024),
    principles: z.array(boundedText(256)).min(3).max(8),
    avoid: z.array(boundedText(256)).min(3).max(16),
    tokenRefs: z.array(tokenNameSchema).min(4).max(100),
    ornamentPolicy: z
      .object({
        decorativeAgentDiagrams: z.literal(false),
        excessiveGlow: z.literal(false),
        meaninglessGradients: z.literal(false),
        ornamentalStatusElements: z.literal(false),
      })
      .strict(),
    referenceEvidenceRefs: z.array(idSchema).max(50),
  })
  .strict();

const typographySchema = z
  .object({
    minimumBodySizePx: z.number().min(16).max(32),
    maximumLineLengthCharacters: z.number().int().min(45).max(90),
    numericAlignment: z.enum(["tabular", "proportional"]),
    roles: z
      .array(
        z
          .object({
            role: z.enum(["body", "label", "heading", "metadata", "metric", "evidence", "log", "code"]),
            familyToken: tokenNameSchema,
            sizeToken: tokenNameSchema,
            weightToken: tokenNameSchema,
            lineHeightToken: tokenNameSchema,
            colorToken: tokenNameSchema,
            usage: boundedText(512),
          })
          .strict(),
      )
      .length(8),
  })
  .strict();

const compositionSchema = z
  .object({
    contentWidth: z
      .object({
        strategy: z.enum(["fluid", "bounded", "hybrid"]),
        maximumPx: z.number().int().min(320).max(2_560),
      })
      .strict(),
    grids: z
      .array(
        z
          .object({
            viewport: requiredViewportSchema,
            columns: z.number().int().min(1).max(16),
            gutterToken: tokenNameSchema,
            marginToken: tokenNameSchema,
            composition: boundedText(512),
          })
          .strict(),
      )
      .length(4),
    spacingRhythm: z
      .object({
        baseToken: tokenNameSchema,
        allowedStepTokens: z.array(tokenNameSchema).min(4).max(16),
      })
      .strict(),
    alignmentRules: z.array(boundedText(512)).min(2).max(12),
    stableDimensions: z
      .array(
        z
          .object({
            component: idSchema,
            behavior: z.enum(["fixed", "bounded", "aspect-ratio"]),
            tokenRefs: z.array(tokenNameSchema).min(1).max(10),
            rationale: boundedText(512),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    surfaces: z
      .array(
        z
          .object({
            role: z.enum(["canvas", "subtle", "raised", "overlay", "inverse"]),
            tokenRef: tokenNameSchema,
          })
          .strict(),
      )
      .min(3)
      .max(5),
    borders: z
      .array(
        z
          .object({
            role: z.enum(["default", "strong", "focus", "selected"]),
            tokenRef: tokenNameSchema,
          })
          .strict(),
      )
      .length(4),
    elevations: z
      .array(
        z
          .object({
            role: z.enum(["base", "raised", "overlay"]),
            tokenRef: tokenNameSchema,
          })
          .strict(),
      )
      .length(3),
    emphasis: z
      .array(
        z
          .object({
            level: z.enum(["primary", "secondary", "tertiary", "muted"]),
            textToken: tokenNameSchema,
            surfaceToken: tokenNameSchema,
          })
          .strict(),
      )
      .length(4),
    selectedState: z
      .object({
        backgroundToken: tokenNameSchema,
        borderToken: tokenNameSchema,
        indicator: boundedText(256),
        nonColorCue: boundedText(256),
      })
      .strict(),
  })
  .strict();

const densityProfileSchema = z
  .object({
    mode: z.enum(["comfortable", "compact", "dense", "adaptive"]),
    rationale: boundedText(1_024),
    controlHeightToken: tokenNameSchema,
    rowHeightToken: tokenNameSchema,
    compactRowHeightToken: tokenNameSchema,
    spacingTokenRefs: z.array(tokenNameSchema).min(4).max(16),
    maximumPrimaryActions: z.number().int().min(1).max(3),
    viewportBehavior: z
      .array(
        z
          .object({
            viewport: requiredViewportSchema,
            mode: z.enum(["comfortable", "compact", "dense"]),
            visiblePriorities: z.array(boundedText(160)).min(1).max(8),
          })
          .strict(),
      )
      .length(4),
  })
  .strict();

const interactionStateSchema = z
  .object({
    states: z
      .array(
        z
          .object({
            state: z.enum(["loading", "empty", "success", "warning", "error", "partial", "disabled", "selected", "focus"]),
            behavior: boundedText(512),
            tokenRefs: z.array(tokenNameSchema).min(1).max(20),
            textCue: z.boolean(),
            iconCue: z.boolean(),
          })
          .strict(),
      )
      .length(9),
  })
  .strict();

const motionSchema = z
  .object({
    durationTokens: z
      .object({
        instant: tokenNameSchema,
        feedback: tokenNameSchema,
        transition: tokenNameSchema,
        emphasis: tokenNameSchema,
      })
      .strict(),
    motions: z
      .array(
        z
          .object({
            id: idSchema,
            purpose: boundedText(512),
            trigger: boundedText(256),
            property: z.enum(["opacity", "transform", "color", "size", "position", "progress"]),
            durationCategory: z.enum(["instant", "feedback", "transition", "emphasis"]),
            interruptible: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    reducedMotion: z
      .object({
        strategy: z.enum(["remove", "replace", "shorten"]),
        equivalents: z
          .array(
            z
              .object({
                motionRef: idSchema,
                behavior: boundedText(512),
              })
              .strict(),
          )
          .min(1)
          .max(100),
      })
      .strict(),
  })
  .strict();

const chartContractSchema = z
  .object({
    id: idSchema,
    purpose: boundedText(1_024),
    type: z.enum(["bar", "line", "area", "scatter", "distribution", "timeline", "table-first"]),
    metricRefs: z.array(idSchema).min(1).max(50),
    labelStrategy: z.enum(["direct", "axis-and-legend", "table-first"]),
    titleVisible: z.boolean(),
    valuesVisible: z.boolean(),
    legend: z
      .object({
        visible: z.boolean(),
        reason: boundedText(512).optional(),
      })
      .strict(),
    comparison: z.discriminatedUnion("status", [
      z.object({ status: z.literal("available"), context: boundedText(512) }).strict(),
      z.object({ status: z.literal("not-applicable"), reason: boundedText(512) }).strict(),
    ]),
    alternative: z
      .object({
        kind: z.enum(["table", "text"]),
        path: pathText,
      })
      .strict(),
    states: z
      .object({
        loading: boundedText(512),
        empty: boundedText(512),
        partial: boundedText(512),
        error: boundedText(512),
      })
      .strict(),
    tokenRefs: z.array(tokenNameSchema).min(2).max(30),
    nonColorCues: z
      .array(z.enum(["color", "text", "icon", "shape", "pattern", "position", "value", "line-style"]))
      .min(2)
      .max(8),
    decorative: z.literal(false),
  })
  .strict();

const renderedEvidenceSchema = z
  .object({
    fixture: z
      .object({
        id: idSchema,
        sourcePath: pathText,
        route: boundedText(1_024),
      })
      .strict(),
    captures: z
      .array(
        z.discriminatedUnion("status", [
          z
            .object({
              viewport: requiredViewportSchema,
              status: z.literal("planned"),
            })
            .strict(),
          z
            .object({
              viewport: requiredViewportSchema,
              status: z.enum(["captured", "verified"]),
              screenshotPath: pathText,
              runtimeReportPath: pathText,
              sha256: z.string().regex(/^[a-f0-9]{64}$/),
            })
            .strict(),
        ]),
      )
      .length(4),
  })
  .strict();

const humanVisualReviewSchema = z
  .object({
    status: z.enum(["required", "completed"]),
    dimensions: z
      .array(z.enum(["hierarchy", "balance", "scanability", "density", "domain-fit"]))
      .length(5),
    reviewers: z
      .array(
        z
          .object({
            name: boundedText(256),
            role: boundedText(256),
            reviewedAt: z.string().datetime({ offset: true }),
            evidenceRef: idSchema,
          })
          .strict(),
      )
      .max(50),
  })
  .strict();

const tokenSchema = z
  .object({
    name: tokenNameSchema,
    type: z.enum(["color", "dimension", "font-family", "font-weight", "duration", "number", "shadow"]),
    level: z.enum(["primitive", "semantic", "component"]),
    value: z.union([z.string(), z.number()]).optional(),
    reference: tokenNameSchema.optional(),
    description: boundedText(512),
  })
  .strict()
  .superRefine((token, context) => {
    if (token.level === "primitive") {
      if (token.value === undefined) {
        context.addIssue({ code: "custom", path: ["value"], message: "Primitive tokens require a value." });
      }
      if (token.reference !== undefined) {
        context.addIssue({ code: "custom", path: ["reference"], message: "Primitive tokens cannot reference another token." });
      }
    } else {
      if (token.reference === undefined) {
        context.addIssue({ code: "custom", path: ["reference"], message: "Semantic and component tokens require a reference." });
      }
      if (token.value !== undefined) {
        context.addIssue({ code: "custom", path: ["value"], message: "Semantic and component tokens cannot contain raw values." });
      }
    }
    if (
      token.type === "color" &&
      token.value !== undefined &&
      (typeof token.value !== "string" || !/^#[0-9a-f]{6}$/i.test(token.value))
    ) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Color token values must be opaque six-digit hexadecimal colors.",
      });
    }
  });

const tokenModeSchema = z
  .object({
    name: idSchema,
    overrides: z
      .array(
        z
          .object({
            token: tokenNameSchema,
            value: z.union([z.string(), z.number()]).optional(),
            reference: tokenNameSchema.optional(),
          })
          .strict()
          .refine((override) => (override.value === undefined) !== (override.reference === undefined), {
            message: "A mode override requires exactly one of value or reference.",
          }),
      )
      .min(1)
      .max(2_000),
  })
  .strict();

const brandSchema = z
  .object({
    promise: boundedText(512),
    audiences: z.array(boundedText(256)).min(1).max(20),
    attributes: z.array(boundedText(80)).min(2).max(8),
    avoid: z.array(boundedText(160)).min(1).max(12),
    voicePrinciples: z.array(boundedText(256)).min(2).max(12),
    marks: z
      .array(
        z
          .object({
            id: idSchema,
            role: z.enum(["primary", "compact", "monochrome", "symbol", "wordmark"]),
            asset: idSchema,
            clearSpace: boundedText(256),
            minimumSize: boundedText(256),
            allowedBackgrounds: z.array(boundedText(128)).min(1).max(12),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict();

const figmaSchema = z
  .object({
    pages: z
      .array(
        z
          .object({
            name: boundedText(128),
            role: z.enum([
              "cover",
              "foundations",
              "components",
              "patterns",
              "templates",
              "sandbox",
              "archive",
            ]),
            purpose: boundedText(512),
          })
          .strict(),
      )
      .min(2)
      .max(50),
    collections: z
      .array(
        z
          .object({
            name: boundedText(128),
            modes: z.array(idSchema).min(1).max(20),
            tokens: z.array(tokenNameSchema).min(1).max(5_000),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    components: z
      .array(
        z
          .object({
            name: boundedText(160),
            purpose: boundedText(512),
            interactive: z.boolean(),
            properties: z
              .array(
                z
                  .object({
                    name: boundedText(128),
                    type: z.enum(["boolean", "instance-swap", "text", "variant", "slot"]),
                  })
                  .strict(),
              )
              .max(40),
            states: z.array(idSchema).min(1).max(30),
            documented: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(1_000),
  })
  .strict();

const assetSchema = z
  .object({
    id: idSchema,
    kind: z.enum([
      "logo",
      "icon",
      "illustration",
      "photo",
      "texture",
      "chart",
      "screenshot",
      "video",
      "audio",
      "font",
    ]),
    path: pathText,
    source: z
      .object({
        origin: z.enum([
          "original",
          "user-provided",
          "generated",
          "commissioned",
          "licensed",
          "open-source",
          "public-domain",
        ]),
        creator: boundedText(256),
        sourceUrl: z.string().url().optional(),
      })
      .strict(),
    rights: z
      .object({
        status: z.enum(["approved", "pending", "rejected", "unknown"]),
        basis: z.enum([
          "owned",
          "contract",
          "terms-of-service",
          "spdx-license",
          "public-domain",
          "permission",
        ]),
        spdxExpression: boundedText(256).optional(),
        evidence: pathText.optional(),
        attribution: boundedText(1_024).optional(),
        restrictions: z.array(boundedText(512)).max(30).default([]),
        reviewedBy: boundedText(256).optional(),
        reviewedAt: z.string().datetime({ offset: true }).optional(),
      })
      .strict(),
    generation: z
      .object({
        provider: boundedText(256),
        model: boundedText(256),
        promptRecord: pathText,
        humanContributions: z.array(boundedText(512)).min(1).max(30),
        references: z
          .array(
            z
              .object({
                source: boundedText(1_024),
                rightsStatus: z.enum(["approved", "pending", "rejected", "unknown"]),
                evidence: pathText.optional(),
              })
              .strict(),
          )
          .max(50),
      })
      .strict()
      .optional(),
    alternative: z
      .object({
        kind: z.enum([
          "decorative",
          "short-text",
          "long-description",
          "data-table",
          "caption",
          "transcript",
        ]),
        content: boundedText(4_096).optional(),
      })
      .strict(),
  })
  .strict();

const iconSystemSchema = z
  .object({
    name: boundedText(160),
    grid: z.number().int().min(8).max(128),
    sizes: z.array(z.number().int().min(8).max(512)).min(1).max(20),
    stroke: z
      .object({
        style: z.enum(["outline", "filled", "duotone", "mixed"]),
        weight: z.number().positive().max(16),
        linecap: z.enum(["round", "square", "butt"]),
        linejoin: z.enum(["round", "bevel", "miter"]),
      })
      .strict(),
    icons: z
      .array(
        z
          .object({
            id: idSchema,
            name: boundedText(128),
            meaning: boundedText(512),
            asset: idSchema,
            decorative: z.boolean(),
            accessibleName: boundedText(256).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(2_000),
  })
  .strict();

const presentationSchema = z
  .object({
    id: idSchema,
    purpose: boundedText(512),
    audience: boundedText(256),
    aspectRatio: z.enum(["16:9", "4:3", "1:1", "a4-landscape", "a4-portrait"]),
    masterLayouts: z.array(idSchema).min(2).max(40),
    slides: z
      .array(
        z
          .object({
            id: idSchema,
            title: boundedText(256),
            purpose: boundedText(512),
            layout: idSchema,
            readingOrder: z.array(boundedText(128)).min(1).max(50),
            assets: z.array(idSchema).max(50),
            speakerNotes: boundedText(4_096).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(500),
  })
  .strict();

const accessibilitySchema = z
  .object({
    contrastPairs: z
      .array(
        z
          .object({
            id: idSchema,
            foreground: tokenNameSchema,
            background: tokenNameSchema,
            usage: z.enum(["normal-text", "large-text", "non-text"]),
            mode: idSchema.optional(),
            fontSizePx: z.number().positive().max(1_000).optional(),
            fontWeight: z.number().int().min(100).max(1_000).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(2_000),
    nonColorCues: z
      .array(
        z
          .object({
            meaning: boundedText(256),
            cues: z
              .array(z.enum(["color", "text", "icon", "shape", "pattern", "position", "value", "underline"]))
              .min(2)
              .max(8),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();

export const designDeliverableSchema = z
  .object({
    version: z.enum(["1.0", "2.0"]),
    id: idSchema,
    product: boundedText(256),
    preparedAt: z.string().datetime({ offset: true }),
    preparedBy: z
      .object({
        type: z.enum(["agent", "human", "mixed"]),
        name: boundedText(256),
      })
      .strict(),
    scope: z
      .object({
        deliverables: z.array(deliverableKindSchema).min(1).max(6),
        audience: boundedText(512),
        channels: z.array(z.enum(["web", "mobile", "desktop", "presentation", "print", "social"])).min(1).max(6),
      })
      .strict(),
    tokenSystem: z
      .object({
        tokens: z.array(tokenSchema).min(1).max(10_000),
        modes: z.array(tokenModeSchema).max(50).default([]),
      })
      .strict(),
    productTask: productTaskSchema.optional(),
    interfaceTrust: interfaceTrustLinkSchema.optional(),
    informationHierarchy: informationHierarchyLinkSchema.optional(),
    metricContracts: metricContractsSchema.optional(),
    generationWorkflow: generationWorkflowSchema.optional(),
    visualDirection: visualDirectionSchema.optional(),
    typography: typographySchema.optional(),
    composition: compositionSchema.optional(),
    densityProfile: densityProfileSchema.optional(),
    interactionStates: interactionStateSchema.optional(),
    motion: motionSchema.optional(),
    chartContracts: z.array(chartContractSchema).max(500).optional(),
    renderedEvidence: renderedEvidenceSchema.optional(),
    humanVisualReview: humanVisualReviewSchema.optional(),
    brand: brandSchema.optional(),
    figma: figmaSchema.optional(),
    assets: z.array(assetSchema).default([]),
    iconSystem: iconSystemSchema.optional(),
    presentations: z.array(presentationSchema).default([]),
    accessibility: accessibilitySchema,
    evidence: z
      .array(
        z
          .object({
            id: idSchema,
            kind: z.enum(["source", "review", "contrast", "export", "license", "runtime"]),
            path: pathText,
            detail: boundedText(1_024),
          })
          .strict(),
      )
      .min(1)
      .max(1_000),
  })
  .strict();

export const designIntelligenceFindingSchema = z
  .object({
    ruleId: z.string().regex(/^ZTDE-DI-[0-9]{3}$/),
    severity: z.enum(["error", "warning", "info"]),
    path: z.string(),
    message: z.string(),
    remediation: z.string(),
  })
  .strict();

export const designDeliverableReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    sourcePath: z.string(),
    manifestId: z.string(),
    product: z.string(),
    deliverables: z.array(deliverableKindSchema),
    findings: z.array(designIntelligenceFindingSchema),
    contrastResults: z.array(
      z
        .object({
          id: z.string(),
          ratio: z.number(),
          required: z.number(),
          passed: z.boolean(),
        })
        .strict(),
    ),
    coverage: z
      .object({
        tokens: z.number().int().nonnegative(),
        assets: z.number().int().nonnegative(),
        icons: z.number().int().nonnegative(),
        presentations: z.number().int().nonnegative(),
        slides: z.number().int().nonnegative(),
        contrastPairs: z.number().int().nonnegative(),
        typographyRoles: z.number().int().nonnegative(),
        interactionStates: z.number().int().nonnegative(),
        chartContracts: z.number().int().nonnegative(),
        renderedViewports: z.number().int().nonnegative(),
        metricContracts: z.number().int().nonnegative(),
        generationStages: z.number().int().nonnegative(),
      })
      .strict(),
    integration: z
      .object({
        generationReady: z.boolean(),
        trustStatus: z.enum(["missing", "declared", "validated"]),
        informationStatus: z.enum(["missing", "declared", "validated"]),
        contractsValidated: z.boolean(),
        automatedVerificationReady: z.boolean(),
        humanReviewReady: z.boolean(),
        releaseReady: z.boolean(),
        stages: z.record(generationStageSchema, z.enum([
          "missing",
          "required",
          "declared",
          "implemented",
          "verified",
          "review-required",
          "review-completed",
        ])),
      })
      .strict(),
    visualPolish: z
      .object({
        declared: z.boolean(),
        requiredViewports: z.record(z.enum(["375", "768", "1024", "1440"]), z.enum(["missing", "planned", "captured", "verified"])),
        renderedEvidenceReady: z.boolean(),
        humanReviewReady: z.boolean(),
        releaseReady: z.boolean(),
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

export type DesignDeliverable = z.infer<typeof designDeliverableSchema>;
export type DesignIntelligenceFinding = z.infer<typeof designIntelligenceFindingSchema>;
export type DesignDeliverableReport = z.infer<typeof designDeliverableReportSchema>;
