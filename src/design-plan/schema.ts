import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,127}$/);
const text = z.string().trim().min(1).max(2_048);
const traceRefs = z.array(idSchema).min(1).max(100);
const decisionStatusSchema = z.enum(["confirmed", "provisional", "blocked"]);

export const designPlanTraceSchema = z
  .object({
    id: idSchema,
    kind: z.enum(["brief", "standard", "assumption"]),
    reference: text,
    description: text,
  })
  .strict();

const tracedDecisionSchema = z
  .object({
    id: idSchema,
    status: decisionStatusSchema,
    statement: text,
    rationale: text,
    traceRefs,
  })
  .strict();

export const downstreamContractResultSchema = z
  .object({
    kind: z.enum(["product-task", "interface-trust", "information-design", "design-deliverable"]),
    declaration: z.enum(["planned", "exists", "not-applicable"]),
    validation: z.enum(["planned", "validated", "invalid", "not-applicable"]),
    source: z.string().max(1_024).optional(),
    passed: z.boolean(),
    findings: z.number().int().nonnegative(),
    reason: text,
    traceRefs,
  })
  .strict();

export const designPlanSchema = z
  .object({
    version: z.literal("1.0"),
    compilerVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    id: idSchema,
    product: text,
    sourceBrief: z
      .object({
        id: idSchema,
        version: z.literal("1.0"),
        file: text,
        digest: z.string().regex(/^[a-f0-9]{64}$/),
        generationReady: z.boolean(),
      })
      .strict(),
    status: z.enum(["blocked", "provisional", "ready"]),
    planningReady: z.boolean(),
    implementationReady: z.boolean(),
    traces: z.array(designPlanTraceSchema).min(1).max(10_000),
    decisions: z.array(tracedDecisionSchema).min(1).max(10_000),
    informationArchitecture: z.array(
      z.object({ id: idSchema, order: z.number().int().min(1), label: text, purpose: text, contentRefs: z.array(text).min(1), traceRefs }).strict(),
    ).min(1),
    routes: z.array(
      z.object({ id: idSchema, path: z.string().regex(/^\/[a-z0-9/-]*$/), taskRef: idSchema, status: decisionStatusSchema, purpose: text, traceRefs }).strict(),
    ).min(1),
    components: z.array(
      z.object({ id: idSchema, taskRef: idSchema, boundary: text, responsibility: text, ownsState: z.array(z.string()).max(20), inputs: z.array(text).max(30), outputs: z.array(text).max(30), traceRefs }).strict(),
    ).min(1),
    stateOwnership: z.array(
      z.object({ state: z.string(), taskRefs: z.array(idSchema).min(1), ownerComponentRef: idSchema, behavior: text, recovery: text, disclosure: text, traceRefs }).strict(),
    ).min(1),
    contracts: z.array(downstreamContractResultSchema).length(4),
    tokenRequirements: z.array(
      z.object({ id: idSchema, category: z.enum(["color", "typography", "spacing", "shape", "motion", "data-visualization"]), roles: z.array(text).min(1), rule: text, traceRefs }).strict(),
    ).min(1),
    responsiveBehavior: z.array(
      z.object({ platformRef: idSchema, viewports: z.array(z.number().int().min(240)).min(1), inputModes: z.array(z.string()).min(1), rules: z.array(text).min(1), traceRefs }).strict(),
    ).min(1),
    assets: z
      .object({
        status: decisionStatusSchema,
        requirements: z.array(z.object({ id: idSchema, purpose: text, rightsRequired: z.boolean(), alternativesRequired: z.boolean(), traceRefs }).strict()),
        rule: text,
        traceRefs,
      })
      .strict(),
    implementationStages: z.array(
      z.object({ id: idSchema, order: z.number().int().min(1), name: text, exitCondition: text, status: decisionStatusSchema, traceRefs }).strict(),
    ).min(1),
    verificationObligations: z.array(
      z.object({ id: idSchema, acceptanceCriterionRef: idSchema, taskRefs: z.array(idSchema).min(1), method: z.string(), blocking: z.boolean(), expectedEvidence: text, traceRefs }).strict(),
    ).min(1),
    blockers: z.array(text),
    limitations: z.array(text).min(1),
  })
  .strict();

export type DesignPlan = z.infer<typeof designPlanSchema>;
export type DesignPlanTrace = z.infer<typeof designPlanTraceSchema>;
export type DownstreamContractResult = z.infer<typeof downstreamContractResultSchema>;
