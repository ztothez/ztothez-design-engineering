import { z } from "zod";

const qualityGateStageSchema = z.object({
  status: z.enum(["pass", "fail", "skipped"]),
  errors: z.number().int().nonnegative(),
  warnings: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
  evidence: z.array(z.string()),
  message: z.string().optional(),
});

export const qualityGateReportSchema = {
  version: z.string(),
  generatedAt: z.string(),
  outputDirectory: z.string(),
  contractPath: z.string(),
  repository: z.string(),
  url: z.string().optional(),
  profile: z.string().optional(),
  failOn: z.enum(["error", "warning"]),
  stages: z.object({
    contract: qualityGateStageSchema,
    architecture: qualityGateStageSchema,
    runtime: qualityGateStageSchema,
    acceptance: qualityGateStageSchema,
  }),
  summary: z.object({
    errors: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative(),
    info: z.number().int().nonnegative(),
  }),
  complete: z.boolean(),
  passed: z.boolean(),
};
