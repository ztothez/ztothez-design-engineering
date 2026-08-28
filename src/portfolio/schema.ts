import { z } from "zod";

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const relativePatternSchema = boundedText(1_024).refine(
  (value) =>
    !value.includes("\0") &&
    !value.startsWith("/") &&
    !/^[A-Za-z]:[\\/]/.test(value) &&
    !value.split(/[\\/]/).includes(".."),
  "Paths and patterns must remain relative and cannot contain parent traversal.",
);

const loopbackRouteSchema = boundedText(2_048).refine(
  (value) => value.startsWith("/") && !value.includes("\0") && !value.startsWith("//"),
  "Loopback routes must start with one slash and cannot contain null bytes.",
);

export const portfolioRootClassSchema = z.enum([
  "studio-clients",
  "studio-fullstack",
  "studio-personal",
  "studio-portfolio",
  "ai",
  "apps",
]);

export const benchmarkStageSchema = z.enum([
  "source-audit",
  "typecheck",
  "lint",
  "unit-test",
  "production-build",
  "local-fixture-server",
  "browser-journeys",
  "export-verification",
]);

export const portfolioAdapterIdSchema = z.enum([
  "react-vite",
  "nextjs",
  "angular",
  "static-web",
  "node-python-fullstack",
  "python-source",
]);

const publicationSchema = z
  .object({
    sourceExcerpts: z.boolean(),
    screenshots: z.boolean(),
    machineReports: z.boolean(),
    aggregateMetrics: z.boolean(),
  })
  .strict();

const capabilitySchema = z
  .object({
    stage: benchmarkStageSchema,
    status: z.enum(["supported", "unsupported", "not-applicable"]),
    reason: boundedText(512),
  })
  .strict();

const adapterCommandSchema = z
  .object({
    stage: benchmarkStageSchema,
    command: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$/),
    arguments: z
      .array(boundedText(512).refine((value) => !value.includes("\0"), "Arguments cannot contain null bytes."))
      .max(50)
      .default([]),
    cwd: relativePatternSchema.default("."),
    timeoutMs: z.number().int().min(100).max(30 * 60_000).default(120_000),
    maxOutputBytes: z.number().int().min(1_024).max(32 * 1024 * 1024).default(2 * 1024 * 1024),
    allowDependencyNetwork: z.boolean().default(false),
  })
  .strict();

const rootSchema = z
  .object({
    id: idSchema,
    class: portfolioRootClassSchema,
    path: boundedText(4_096),
    discoveryDepth: z.number().int().min(1).max(12).default(4),
    excludes: z.array(relativePatternSchema).max(100).default([]),
  })
  .strict();

const projectSchema = z
  .object({
    id: idSchema,
    root: idSchema,
    path: relativePatternSchema,
    enabled: z.boolean(),
    ownership: z.enum([
      "first-party",
      "client-authorized",
      "third-party-reference",
      "unknown",
    ]),
    authorizationEvidence: boundedText(1_024).optional(),
    confidentiality: z.enum(["public", "private-local", "restricted"]),
    cohort: z.enum(["development", "holdout", "excluded"]),
    publication: publicationSchema,
    product: z
      .object({
        domain: boundedText(128),
        archetype: z.enum([
          "operational-dashboard",
          "ai-workspace",
          "content-site",
          "utility",
          "full-stack-workflow",
          "other",
        ]),
        intendedUsers: z.array(boundedText(256)).min(1).max(20),
        primaryTasks: z.array(boundedText(512)).min(1).max(20),
      })
      .strict(),
    technology: z
      .object({
        framework: boundedText(128),
        packageManager: z.enum(["npm", "pnpm", "yarn", "bun", "pip", "poetry", "none", "other"]),
        entrypoint: relativePatternSchema,
        adapter: portfolioAdapterIdSchema.optional(),
      })
      .strict(),
    capabilities: z.array(capabilitySchema).min(1).max(benchmarkStageSchema.options.length),
    execution: z
      .object({
        fixtureMode: z.enum(["local-fixture", "disconnected", "not-applicable"]),
        networkPolicy: z.enum(["denied", "dependency-install-only"]),
        lifecycleScripts: z.boolean(),
        allowedEnvironmentVariables: z
          .array(z.string().regex(/^[A-Z][A-Z0-9_]{0,127}$/))
          .max(50)
          .default([]),
        localPorts: z.array(z.number().int().min(1).max(65_535)).max(20).default([]),
        commands: z.array(adapterCommandSchema).max(benchmarkStageSchema.options.length).default([]),
      })
      .strict(),
    verification: z
      .object({
        serveDirectory: relativePatternSchema,
        port: z.number().int().min(1).max(65_535),
        route: loopbackRouteSchema.default("/"),
        readinessPath: loopbackRouteSchema.default("/"),
        contractPath: relativePatternSchema,
        profile: idSchema,
        attestationsPath: relativePatternSchema.optional(),
        heuristicReviewPath: relativePatternSchema.optional(),
        settleMs: z.number().int().min(0).max(30_000).default(500),
      })
      .strict()
      .optional(),
    paths: z
      .object({
        include: z.array(relativePatternSchema).min(1).max(100),
        exclude: z.array(relativePatternSchema).max(200).default([]),
      })
      .strict(),
    source: z
      .object({
        revisionPolicy: z.enum(["capture-current", "require-clean"]),
        canonicalizationKey: idSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((project, context) => {
    const stageNames = project.capabilities.map((capability) => capability.stage);
    if (new Set(stageNames).size !== stageNames.length) {
      context.addIssue({
        code: "custom",
        path: ["capabilities"],
        message: "Capability stages must be unique within a project.",
      });
    }
    if (project.enabled && project.cohort === "excluded") {
      context.addIssue({
        code: "custom",
        path: ["cohort"],
        message: "Enabled projects must belong to the development or holdout cohort.",
      });
    }
    if (!project.enabled && project.cohort !== "excluded") {
      context.addIssue({
        code: "custom",
        path: ["cohort"],
        message: "Disabled projects must use the excluded cohort.",
      });
    }
    if (project.ownership === "client-authorized" && !project.authorizationEvidence) {
      context.addIssue({
        code: "custom",
        path: ["authorizationEvidence"],
        message: "Client-authorized projects require an authorization evidence note.",
      });
    }
    const commandStages = project.execution.commands.map((command) => command.stage);
    if (new Set(commandStages).size !== commandStages.length) {
      context.addIssue({
        code: "custom",
        path: ["execution", "commands"],
        message: "Adapter command stages must be unique within a project.",
      });
    }
    if (
      project.confidentiality === "restricted" &&
      Object.values(project.publication).some(Boolean)
    ) {
      context.addIssue({
        code: "custom",
        path: ["publication"],
        message: "Restricted projects cannot publish source, screenshots, reports, or aggregate metrics.",
      });
    }
    if (project.verification) {
      if (project.execution.fixtureMode !== "local-fixture") {
        context.addIssue({
          code: "custom",
          path: ["execution", "fixtureMode"],
          message: "Built-in browser verification requires local-fixture mode.",
        });
      }
      if (!project.execution.localPorts.includes(project.verification.port)) {
        context.addIssue({
          code: "custom",
          path: ["verification", "port"],
          message: "The verification port must be declared in execution.localPorts.",
        });
      }
      for (const stage of ["local-fixture-server", "browser-journeys"] as const) {
        if (project.capabilities.find((entry) => entry.stage === stage)?.status !== "supported") {
          context.addIssue({
            code: "custom",
            path: ["capabilities"],
            message: `Built-in verification requires supported ${stage} capability.`,
          });
        }
      }
    }
  });

export const portfolioRegistrySchema = z
  .object({
    version: z.literal("1.0"),
    id: idSchema,
    description: boundedText(1_024),
    roots: z.array(rootSchema).min(1).max(20),
    projects: z.array(projectSchema).max(500),
  })
  .strict()
  .superRefine((registry, context) => {
    const duplicateValues = (values: string[]) => {
      const seen = new Set<string>();
      const duplicates = new Set<string>();
      for (const value of values) {
        if (seen.has(value)) duplicates.add(value);
        seen.add(value);
      }
      return duplicates;
    };

    for (const duplicate of duplicateValues(registry.roots.map((root) => root.id))) {
      context.addIssue({ code: "custom", path: ["roots"], message: `Duplicate root ID: ${duplicate}.` });
    }
    for (const duplicate of duplicateValues(registry.roots.map((root) => root.class))) {
      context.addIssue({ code: "custom", path: ["roots"], message: `Duplicate root class: ${duplicate}.` });
    }
    for (const duplicate of duplicateValues(registry.projects.map((project) => project.id))) {
      context.addIssue({ code: "custom", path: ["projects"], message: `Duplicate project ID: ${duplicate}.` });
    }
    for (const duplicate of duplicateValues(registry.projects.map((project) => project.source.canonicalizationKey))) {
      context.addIssue({
        code: "custom",
        path: ["projects"],
        message: `Duplicate canonicalization key: ${duplicate}.`,
      });
    }

    const rootIds = new Set(registry.roots.map((root) => root.id));
    for (const [index, project] of registry.projects.entries()) {
      if (!rootIds.has(project.root)) {
        context.addIssue({
          code: "custom",
          path: ["projects", index, "root"],
          message: `Unknown root: ${project.root}.`,
        });
      }
    }
  });

export const portfolioIssueSchema = z
  .object({
    code: z.string(),
    severity: z.enum(["error", "warning"]),
    path: z.string(),
    message: z.string(),
  })
  .strict();

export const portfolioRegistryReportSchema = z
  .object({
    version: z.string(),
    generatedAt: z.string(),
    registryId: z.string().optional(),
    counts: z
      .object({
        roots: z.number().int().nonnegative(),
        projects: z.number().int().nonnegative(),
        enabled: z.number().int().nonnegative(),
        development: z.number().int().nonnegative(),
        holdout: z.number().int().nonnegative(),
        excluded: z.number().int().nonnegative(),
      })
      .strict(),
    projects: z.array(
      z
        .object({
          id: z.string(),
          root: z.string(),
          rootClass: portfolioRootClassSchema.optional(),
          enabled: z.boolean(),
          cohort: z.enum(["development", "holdout", "excluded"]),
          ownership: z.enum([
            "first-party",
            "client-authorized",
            "third-party-reference",
            "unknown",
          ]),
          confidentiality: z.enum(["public", "private-local", "restricted"]),
          resolved: z.boolean(),
        })
        .strict(),
    ),
    issues: z.array(portfolioIssueSchema),
    passed: z.boolean(),
  })
  .strict();

export type PortfolioRegistry = z.infer<typeof portfolioRegistrySchema>;
export type PortfolioRoot = PortfolioRegistry["roots"][number];
export type PortfolioProject = PortfolioRegistry["projects"][number];
export type PortfolioAdapterId = z.infer<typeof portfolioAdapterIdSchema>;
export type BenchmarkStage = z.infer<typeof benchmarkStageSchema>;
export type PortfolioIssue = z.infer<typeof portfolioIssueSchema>;
export type PortfolioRegistryReport = z.infer<typeof portfolioRegistryReportSchema>;
