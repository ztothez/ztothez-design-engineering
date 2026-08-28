import { z } from "zod";

const stageSchema = z.object({
  stage: z.string().min(1),
  status: z.enum(["passed", "failed", "timed-out", "unsupported", "not-applicable"]),
  reason: z.string(),
  durationMs: z.number().nonnegative().optional(),
  exitCode: z.number().int().nullable().optional(),
  audit: z.object({ filesScanned: z.number().int().nonnegative(), errors: z.number().int().nonnegative(), warnings: z.number().int().nonnegative(), info: z.number().int().nonnegative() }).optional(),
  findings: z.number().int().nonnegative().optional(),
  limitations: z.number().int().nonnegative().optional(),
  findingDetails: z.array(z.object({ source: z.string(), id: z.string(), severity: z.string(), message: z.string() })).optional(),
  limitationDetails: z.array(z.string()).optional(),
  viewports: z.array(z.object({ name: z.string(), width: z.number().int().positive(), height: z.number().int().positive() })).optional(),
  fixture: z.object({ state: z.enum(["ready", "stopped"]), port: z.number().int().positive(), route: z.string(), directory: z.string() }).optional(),
});

const artifactSchema = z.object({
  path: z.string().min(1),
  kind: z.enum(["report", "screenshot", "download", "other", "log"]),
  bytes: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  evidenceClass: z.enum([
    "private-raw",
    "redacted-report",
    "approved-screenshot",
    "public-synthetic",
    "aggregate-metrics",
  ]).optional(),
  policyDecision: z.enum([
    "retained-by-policy",
    "redacted-machine-path",
    "screenshot-opt-in-approved",
    "screenshot-disabled-by-policy",
    "public-synthetic",
  ]).optional(),
  sourceDigest: z.string().optional(),
});

const summarySchema = z.object({
  passed: z.number().int().nonnegative(),
  findings: z.number().int().nonnegative(),
  limitations: z.number().int().nonnegative(),
  unsafeConfiguration: z.number().int().nonnegative(),
  sourceMutation: z.number().int().nonnegative(),
});

export const portfolioBenchmarkReportSchema = z.object({
  version: z.enum(["1.0.0", "1.1.0", "1.2.0"]),
  toolVersion: z.string(),
  runId: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/i),
  mode: z.enum(["baseline", "cohort"]),
  registryId: z.string(),
  registryDigest: z.string(),
  cohort: z.enum(["development", "holdout"]).optional(),
  projectIds: z.array(z.string()),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  projects: z.array(z.object({
    projectId: z.string(),
    cohort: z.enum(["development", "holdout"]),
    adapter: z.string().optional(),
    sourceDigest: z.string().optional(),
    sourceRevision: z.string().optional(),
    environmentPolicy: z.object({ network: z.string(), lifecycleScripts: z.boolean(), environmentVariables: z.array(z.string()) }),
    commands: z.array(z.object({ stage: z.string(), command: z.string(), arguments: z.array(z.string()), cwd: z.string(), timeoutMs: z.number().int().positive().default(120_000), maxOutputBytes: z.number().int().positive().default(2 * 1024 * 1024), allowDependencyNetwork: z.boolean().default(false) })),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
    stages: z.array(stageSchema),
    artifacts: z.array(artifactSchema),
    status: z.enum(["passed", "findings", "limitations", "unsafe-configuration", "source-mutation"]),
    message: z.string().optional(),
  })),
  summary: summarySchema,
  resultFingerprint: z.string(),
  passed: z.boolean(),
}).superRefine((report, context) => {
  if (report.projectIds.length !== report.projects.length || report.projectIds.some((id, index) => id !== report.projects[index]?.projectId)) {
    context.addIssue({ code: "custom", path: ["projectIds"], message: "Project IDs must match ordered project reports." });
  }
  if (Object.values(report.summary).reduce((sum, count) => sum + count, 0) !== report.projects.length) {
    context.addIssue({ code: "custom", path: ["summary"], message: "Summary counts must equal project count." });
  }
});
