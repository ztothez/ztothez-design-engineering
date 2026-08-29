import { z } from "zod";

import {
  runtimeExpectedNetworkSchema,
  runtimeJourneySchema,
  runtimeViewportSchema,
} from "../runtime/schema.js";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const relativePathSchema = z.string().trim().min(1).max(1_024);

const sourceSchema = z
  .object({
    path: relativePathSchema,
    role: z.string().trim().min(1).max(256),
    authority: z.enum(["primary", "supporting", "historical"]),
  })
  .strict();

const actorSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(128),
    goals: z.array(z.string().trim().min(1).max(512)).min(1),
    responsibilities: z.array(z.string().trim().min(1).max(512)).min(1),
  })
  .strict();

const modeSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(128),
    purpose: z.string().trim().min(1).max(1_024),
    input: z.string().trim().min(1).max(512),
    outputs: z.array(idSchema).min(1),
  })
  .strict();

const stateMachineSchema = z
  .object({
    id: idSchema,
    initial: idSchema,
    states: z
      .array(
        z
          .object({
            id: idSchema,
            category: z.enum(["idle", "loading", "success", "error", "fallback", "terminal"]),
            userVisible: z.boolean(),
            requirement: z.string().trim().min(1).max(1_024),
          })
          .strict(),
      )
      .min(2),
    transitions: z
      .array(
        z
          .object({
            from: idSchema,
            to: idSchema,
            trigger: z.string().trim().min(1).max(256),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

const outputSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(128),
    sourceOfTruth: z.string().trim().min(1).max(512),
    requiredEvidence: z.array(z.string().trim().min(1).max(256)).min(1),
  })
  .strict();

const metricSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(128),
    definition: z.string().trim().min(1).max(1_024),
    sourceOfTruth: z.string().trim().min(1).max(512),
    format: z.enum(["percentage", "duration", "count", "status", "text"]),
    evidenceRequired: z.boolean(),
    range: z
      .object({ min: z.number(), max: z.number() })
      .strict()
      .refine((range) => range.min <= range.max, "Metric range min must not exceed max")
      .optional(),
  })
  .strict();

const acceptanceCriterionSchema = z
  .object({
    id: idSchema,
    title: z.string().trim().min(1).max(160),
    severity: z.enum(["blocker", "warning"]),
    requirement: z.string().trim().min(1).max(2_048),
    evidence: z
      .array(
        z.enum([
          "contract",
          "runtime",
          "screenshot",
          "network",
          "accessibility",
          "export",
          "manual-review",
        ]),
      )
      .min(1),
    appliesToModes: z.array(idSchema).min(1),
  })
  .strict();

const journeyBindingSchema = z
  .object({
    profile: idSchema,
    journey: idSchema,
    actor: idSchema,
    mode: idSchema,
    acceptanceCriteria: z.array(idSchema).min(1),
  })
  .strict();

export const productArchetypeSchema = z.enum([
  "operational-dashboard",
  "ai-workspace",
  "content-site",
  "utility",
  "full-stack-workflow",
]);

export const productQualityDimensionSchema = z.enum([
  "truthful-disclosure",
  "information-design",
  "visual-system",
  "accessibility",
  "responsive-structure",
  "state-integrity",
  "maintainability",
]);

const taskStateSchema = z
  .object({
    stateMachine: idSchema,
    state: idSchema,
    observable: z.string().trim().min(1).max(1_024),
  })
  .strict();

const productTaskSchema = z
  .object({
    id: idSchema,
    primary: z.boolean(),
    actor: idSchema,
    mode: idSchema,
    intent: z.string().trim().min(1).max(1_024),
    start: taskStateSchema,
    success: taskStateSchema.extend({
      evidence: z
        .array(z.enum(["contract", "runtime", "network", "export", "manual-review"]))
        .min(1),
    }),
    recovery: z
      .object({
        required: z.boolean(),
        failure: taskStateSchema,
        observable: z.string().trim().min(1).max(1_024),
      })
      .strict(),
    journey: z
      .object({
        profile: idSchema,
        journey: idSchema,
      })
      .strict()
      .optional(),
    browser: z
      .object({
        route: z.string().regex(/^\/(?!\/)/).max(1_024),
        narrowViewport: z.string().trim().min(1).max(128),
      })
      .strict()
      .optional(),
  })
  .strict();

export const productTaskProfileSchema = z
  .object({
    archetype: productArchetypeSchema,
    interface: z.enum(["browser", "desktop", "source-only"]),
    qualityDimensions: z
      .array(
        z
          .object({
            id: productQualityDimensionSchema,
            status: z.enum(["required", "not-applicable"]),
            reason: z.string().trim().min(1).max(512),
          })
          .strict(),
      )
      .length(productQualityDimensionSchema.options.length),
    tasks: z.array(productTaskSchema).min(1).max(50),
    evidencePolicy: z
      .object({
        missingEvidence: z.literal("unverified"),
        failedBehavior: z.literal("failed"),
        unsupportedCapability: z.literal("limitation"),
      })
      .strict(),
    comparison: z
      .object({
        taskContractId: idSchema,
        crossContractRanking: z.literal(false),
      })
      .strict(),
  })
  .strict()
  .superRefine((profile, context) => {
    const dimensionIds = profile.qualityDimensions.map((dimension) => dimension.id);
    if (new Set(dimensionIds).size !== dimensionIds.length) {
      context.addIssue({
        code: "custom",
        path: ["qualityDimensions"],
        message: "Quality dimensions must be unique.",
      });
    }
    const missingDimensions = productQualityDimensionSchema.options.filter(
      (dimension) => !dimensionIds.includes(dimension),
    );
    if (missingDimensions.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["qualityDimensions"],
        message: `Missing quality dimensions: ${missingDimensions.join(", ")}.`,
      });
    }
    if (!profile.tasks.some((task) => task.primary)) {
      context.addIssue({
        code: "custom",
        path: ["tasks"],
        message: "At least one primary product task is required.",
      });
    }
    if (!profile.tasks.some((task) => task.recovery.required)) {
      context.addIssue({
        code: "custom",
        path: ["tasks"],
        message: "At least one task must require an observable failure or recovery path.",
      });
    }
    for (const [index, task] of profile.tasks.entries()) {
      if (profile.interface === "browser" && (!task.browser || !task.journey)) {
        context.addIssue({
          code: "custom",
          path: ["tasks", index],
          message: "Browser tasks require both browser and journey declarations.",
        });
      }
      if (profile.interface === "source-only" && task.browser) {
        context.addIssue({
          code: "custom",
          path: ["tasks", index, "browser"],
          message: "Source-only tasks cannot claim a browser route or viewport.",
        });
      }
    }
  });

const baseProductContractFields = {
    id: idSchema,
    name: z.string().trim().min(1).max(160),
    status: z.enum(["draft", "benchmark", "production"]),
    purpose: z.string().trim().min(1).max(2_048),
    authority: z
      .object({
        behavior: z.string().trim().min(1).max(512),
        visual: z.string().trim().min(1).max(512),
        precedence: z.array(sourceSchema).min(1),
      })
      .strict(),
    actors: z.array(actorSchema).min(1),
    modes: z.array(modeSchema).min(1),
    stateMachines: z.array(stateMachineSchema).min(1),
    outputs: z.array(outputSchema).min(1),
    metrics: z.array(metricSchema).min(1),
    constraints: z
      .object({
        outOfScope: z.array(z.string().trim().min(1).max(512)).min(1),
        prohibitedClaims: z.array(z.string().trim().min(1).max(512)).min(1),
        mockData: z
          .object({
            allowedEnvironments: z.array(z.enum(["development", "test", "demo"])).min(1),
            mustBeLabeled: z.boolean(),
            prohibitedInProduction: z.boolean(),
            fallbackDisclosure: z.string().trim().min(1).max(1_024),
          })
          .strict(),
      })
      .strict(),
    acceptanceCriteria: z.array(acceptanceCriterionSchema).min(1),
    verification: z
      .object({
        journeyFile: relativePathSchema,
        viewports: z.array(runtimeViewportSchema).min(1).max(8),
        bindings: z.array(journeyBindingSchema).min(1),
      })
      .strict(),
};

const legacyProductContractSchema = z
  .object({ version: z.literal("1.0"), ...baseProductContractFields })
  .strict();

const benchmarkProductContractSchema = z
  .object({
    version: z.literal("1.1"),
    ...baseProductContractFields,
    benchmark: productTaskProfileSchema,
  })
  .strict();

const interactionProductContractSchema = z
  .object({
    version: z.literal("1.2"),
    ...baseProductContractFields,
    benchmark: productTaskProfileSchema,
  })
  .strict();

export const productContractSchema = z.discriminatedUnion("version", [
  legacyProductContractSchema,
  benchmarkProductContractSchema,
  interactionProductContractSchema,
]);

export const journeyProfileSchema = z
  .object({
    id: idSchema,
    name: z.string().trim().min(1).max(160),
    environment: z.array(z.string().trim().min(1).max(512)).min(1),
    expectedNetwork: z.array(runtimeExpectedNetworkSchema).max(20).optional(),
    journeys: z.array(runtimeJourneySchema.extend({ id: idSchema })).min(1),
  })
  .strict()
  .superRefine((profile, context) => {
    const ids = profile.expectedNetwork?.map((policy) => policy.id) ?? [];
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", path: ["expectedNetwork"], message: "Policy IDs must be unique" });
    }
  });

export const journeySuiteSchema = z
  .discriminatedUnion("version", [
    z
      .object({
        version: z.literal("1.0"),
        contract: idSchema,
        profiles: z.array(journeyProfileSchema).min(1),
      })
      .strict(),
    z
      .object({
        version: z.literal("1.1"),
        contract: idSchema,
        profiles: z.array(journeyProfileSchema).min(1),
      })
      .strict()
      .superRefine((suite, context) => {
        for (const [profileIndex, profile] of suite.profiles.entries()) {
          for (const [journeyIndex, journey] of profile.journeys.entries()) {
            if (!journey.interaction) {
              context.addIssue({
                code: "custom",
                path: ["profiles", profileIndex, "journeys", journeyIndex, "interaction"],
                message: "V1.1 journey suites require interaction coverage for every journey",
              });
            }
          }
        }
      }),
  ]);

export const contractIssueSchema = z
  .object({
    code: z.string(),
    path: z.string(),
    message: z.string(),
  })
  .strict();

export const contractValidationReportSchema = {
  version: z.string(),
  contractPath: z.string(),
  journeyPath: z.string().optional(),
  generatedAt: z.string(),
  contractId: z.string().optional(),
  counts: z.object({
    actors: z.number().int().nonnegative(),
    modes: z.number().int().nonnegative(),
    acceptanceCriteria: z.number().int().nonnegative(),
    journeyProfiles: z.number().int().nonnegative(),
    journeys: z.number().int().nonnegative(),
  }),
  taskModel: z.object({
    status: z.enum(["ready", "legacy", "invalid"]),
    archetype: productArchetypeSchema.optional(),
    primaryTasks: z.number().int().nonnegative(),
    recoveryTasks: z.number().int().nonnegative(),
    narrowViewportTasks: z.number().int().nonnegative(),
    evidencePolicy: z.object({
      missingEvidence: z.literal("unverified"),
      failedBehavior: z.literal("failed"),
      unsupportedCapability: z.literal("limitation"),
    }),
  }),
  limitations: z.array(z.string()),
  issues: z.array(contractIssueSchema),
  passed: z.boolean(),
};

export type ProductContract = z.infer<typeof productContractSchema>;
export type ProductTaskProfile = z.infer<typeof productTaskProfileSchema>;
export type JourneySuite = z.infer<typeof journeySuiteSchema>;
export type ContractIssue = z.infer<typeof contractIssueSchema>;
export type ContractValidationReport = z.infer<z.ZodObject<typeof contractValidationReportSchema>>;
