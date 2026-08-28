import { z } from "zod";

export const runtimeViewportSchema = z.object({
  name: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/i),
  width: z.number().int().min(240).max(3_840),
  height: z.number().int().min(240).max(2_160),
});

export const journeyStepSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("navigate"), value: z.string().min(1).max(4_096) }),
  z.object({ action: z.literal("click"), selector: z.string().min(1).max(1_024) }),
  z.object({
    action: z.literal("fill"),
    selector: z.string().min(1).max(1_024),
    value: z.string().max(100_000),
  }),
  z.object({
    action: z.literal("press"),
    selector: z.string().min(1).max(1_024).optional(),
    value: z.string().min(1).max(128),
  }),
  z.object({ action: z.literal("waitFor"), selector: z.string().min(1).max(1_024) }),
  z.object({ action: z.literal("expectVisible"), selector: z.string().min(1).max(1_024) }),
  z.object({
    action: z.literal("expectValue"),
    selector: z.string().min(1).max(1_024),
    value: z.string().max(100_000),
  }),
  z.object({
    action: z.literal("expectAttribute"),
    selector: z.string().min(1).max(1_024),
    name: z.string().regex(/^[a-zA-Z_:][a-zA-Z0-9:_.-]{0,127}$/),
    value: z.string().max(100_000),
  }),
  z.object({
    action: z.literal("expectJson"),
    selector: z.string().min(1).max(1_024),
    path: z.string().regex(/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*$/),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  }),
  z.object({
    action: z.literal("expectDownload"),
    selector: z.string().min(1).max(1_024),
    filenameIncludes: z.string().min(1).max(256).optional(),
  }),
  z.object({
    action: z.literal("expectResponse"),
    selector: z.string().min(1).max(1_024),
    urlIncludes: z.string().min(1).max(2_048),
    status: z.number().int().min(100).max(599),
    method: z.string().regex(/^[A-Z]+$/).optional(),
  }),
  z.object({
    action: z.literal("expectText"),
    selector: z.string().min(1).max(1_024),
    value: z.string().max(100_000),
  }),
]);

export const runtimeJourneySchema = z.object({
  name: z.string().min(1).max(128),
  steps: z.array(journeyStepSchema).max(50),
});

export const runtimeExpectedNetworkSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
    method: z.string().regex(/^[A-Z]+$/),
    urlIncludes: z.string().min(1).max(2_048),
    status: z.number().int().min(400).max(599).optional(),
    allowRequestFailure: z.boolean().optional(),
    minOccurrences: z.number().int().min(1).max(100),
    maxOccurrences: z.number().int().min(1).max(100).optional(),
  })
  .strict()
  .superRefine((policy, context) => {
    if (policy.status === undefined && !policy.allowRequestFailure) {
      context.addIssue({
        code: "custom",
        message: "Expected network policy requires status or allowRequestFailure=true",
      });
    }
    if (policy.maxOccurrences !== undefined && policy.maxOccurrences < policy.minOccurrences) {
      context.addIssue({
        code: "custom",
        message: "maxOccurrences must be greater than or equal to minOccurrences",
      });
    }
  });

export const runtimeFindingSchema = z.object({
  checkId: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  evidence: z.array(z.string()),
  viewport: z.string().optional(),
  journey: z.string().optional(),
  selector: z.string().optional(),
});

export const runtimeScreenshotSchema = z.object({
  name: z.string(),
  path: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fullPage: z.boolean(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  dynamicSelectors: z.array(z.string()),
});

export const runtimeScreenshotBaselineSchema = z
  .object({
    version: z.literal("1.0"),
    screenshots: z.array(
      z.object({
        name: z.string().min(1).max(256),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        dynamicSelectors: z.array(z.string().min(1).max(1_024)).max(20),
      }).strict(),
    ).max(1_000),
  })
  .strict();

export const runtimeJourneyResultSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  stepsCompleted: z.number().int().nonnegative(),
  totalSteps: z.number().int().nonnegative(),
  screenshot: z.string().optional(),
  evidence: z
    .array(
      z.object({
        kind: z.enum(["download", "response", "json", "attribute"]),
        step: z.number().int().positive(),
        description: z.string(),
        path: z.string().optional(),
      }),
    )
    .optional(),
});

export const runtimeReportSchema = {
  version: z.string(),
  url: z.string(),
  generatedAt: z.string(),
  browser: z.string(),
  outputDirectory: z.string(),
  viewports: z.array(runtimeViewportSchema),
  screenshots: z.array(runtimeScreenshotSchema),
  screenshotRegression: z.object({
    status: z.enum(["not-configured", "created", "matched", "mismatched"]),
    baselinePath: z.string().optional(),
    compared: z.number().int().nonnegative(),
    mismatches: z.array(z.string()),
  }),
  journeys: z.array(runtimeJourneyResultSchema),
  expectedNetwork: z.array(
    runtimeExpectedNetworkSchema.and(
      z.object({
        occurrences: z.number().int().nonnegative(),
        evidence: z.array(z.string()),
        satisfied: z.boolean(),
      }),
    ),
  ),
  findings: z.array(runtimeFindingSchema),
  summary: z.object({
    errors: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative(),
    info: z.number().int().nonnegative(),
  }),
  passed: z.boolean(),
  evidenceBoundary: z.object({
    verifierLimitations: z.array(z.string()),
    humanReviewRequired: z.array(z.string()),
  }),
};
