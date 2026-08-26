import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const tokenNameSchema = z.string().regex(/^[a-z][a-z0-9-]*(?:[.][a-z0-9][a-z0-9-]*)+$/);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const pathText = boundedText(1_024);

export const deliverableKindSchema = z.enum([
  "brand-system",
  "figma-library",
  "asset-set",
  "icon-system",
  "presentation",
]);

const tokenSchema = z
  .object({
    name: tokenNameSchema,
    type: z.enum(["color", "dimension", "font-family", "font-weight", "duration", "number"]),
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
    scope: z
      .object({
        deliverables: z.array(deliverableKindSchema).min(1).max(5),
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
