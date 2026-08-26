import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, realpath, stat } from "node:fs/promises";
import {
  delimiter,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { formatAuditReport } from "./audit/report.js";
import { auditRepository } from "./audit/scanner.js";
import { formatAggregateReport } from "./aggregate/report.js";
import { aggregateQualityGates } from "./aggregate/runner.js";
import { aggregateReportSchema } from "./aggregate/schema.js";
import { formatContractValidationReport } from "./contracts/report.js";
import { contractValidationReportSchema } from "./contracts/schema.js";
import { validateProductContract } from "./contracts/validator.js";
import { formatQualityGateReport } from "./quality-gate/report.js";
import { runQualityGate } from "./quality-gate/runner.js";
import { qualityGateReportSchema } from "./quality-gate/schema.js";
import { PRODUCT_ID, VERSION } from "./product.js";
import { formatKnowledgeSearchReport } from "./retrieval/report.js";
import {
  knowledgeSearchInputSchema,
  knowledgeSearchReportSchema,
} from "./retrieval/schema.js";
import {
  buildKnowledgeIndex,
  searchKnowledge,
  type KnowledgeIndex,
} from "./retrieval/search.js";
import { evaluateHeuristicReview } from "./heuristics/evaluator.js";
import { loadHeuristicReview } from "./heuristics/loader.js";
import { formatHeuristicReviewReport } from "./heuristics/report.js";
import { heuristicReviewReportSchema } from "./heuristics/schema.js";
import {
  runtimeJourneySchema,
  runtimeExpectedNetworkSchema,
  runtimeReportSchema,
  runtimeViewportSchema,
} from "./runtime/schema.js";
import { formatRuntimeReport } from "./runtime/report.js";
import { validateRuntimeUrl } from "./runtime/policy.js";
import { verifyUiRuntime } from "./runtime/verifier.js";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MODULE_DIRECTORY = dirname(fileURLToPath(import.meta.url));

type KnowledgeArea = {
  directory: string;
  label: string;
  excludedDirectories?: readonly string[];
};

function findProjectRoot(startDirectory: string): string {
  let currentDirectory = resolve(startDirectory);

  while (true) {
    if (
      existsSync(join(currentDirectory, "package.json")) &&
      existsSync(join(currentDirectory, "knowledge-base"))
    ) {
      return currentDirectory;
    }

    const parentDirectory = dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      throw new Error("Could not locate the ZtotheZ Design Engineering project root");
    }

    currentDirectory = parentDirectory;
  }
}

function resolveProjectRoot(): string {
  const configuredRoot = process.env.ZTOTHEZ_DESIGN_ENGINEERING_ROOT?.trim();
  return findProjectRoot(configuredRoot ? resolve(configuredRoot) : MODULE_DIRECTORY);
}

const PROJECT_ROOT = resolveProjectRoot();
const KNOWLEDGE_BASE_ROOT = join(PROJECT_ROOT, "knowledge-base");
const BENCHMARK_ROOT = join(KNOWLEDGE_BASE_ROOT, "benchmarks");
const RETRIEVAL_SCOPE_PATH = join(KNOWLEDGE_BASE_ROOT, "retrieval-scope.yaml");
let knowledgeIndexPromise: Promise<KnowledgeIndex> | undefined;

function getKnowledgeIndex(): Promise<KnowledgeIndex> {
  knowledgeIndexPromise ??= buildKnowledgeIndex(PROJECT_ROOT, RETRIEVAL_SCOPE_PATH).catch(
    (error: unknown) => {
      knowledgeIndexPromise = undefined;
      throw error;
    },
  );
  return knowledgeIndexPromise;
}

const knowledgeAreas = {
  architecture: {
    directory: join(KNOWLEDGE_BASE_ROOT, "architecture"),
    label: "architecture",
  },
  figmaAndSystems: {
    directory: join(KNOWLEDGE_BASE_ROOT, "figma-and-systems"),
    label: "Figma and design systems",
  },
  uxPatterns: {
    directory: join(KNOWLEDGE_BASE_ROOT, "ux-patterns"),
    label: "dashboard and UX patterns",
  },
  usabilityEvaluation: {
    directory: join(KNOWLEDGE_BASE_ROOT, "usability-evaluation"),
    label: "usability evaluation",
    excludedDirectories: ["sources"],
  },
} satisfies Record<string, KnowledgeArea>;

const fileInputSchema = {
  file: z
    .string()
    .trim()
    .min(1)
    .max(512)
    .optional()
    .describe(
      "Repository-relative Markdown filename within this knowledge area. Omit to list available files.",
    ),
};

function isPathContained(baseDirectory: string, candidatePath: string): boolean {
  const relation = relative(baseDirectory, candidatePath);
  return (
    relation === "" ||
    (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation))
  );
}

function isExcludedKnowledgePath(
  area: KnowledgeArea,
  baseDirectory: string,
  candidatePath: string,
): boolean {
  const firstSegment = relative(baseDirectory, candidatePath).split(sep)[0] ?? "";
  return area.excludedDirectories?.includes(firstSegment) ?? false;
}

async function listMarkdownFiles(
  area: KnowledgeArea,
  currentDirectory = area.directory,
): Promise<string[]> {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(currentDirectory, entry.name);

    if (entry.isDirectory()) {
      const relativeDirectory = relative(area.directory, entryPath).split(sep);
      if (area.excludedDirectories?.includes(relativeDirectory[0] ?? "")) continue;
      files.push(...(await listMarkdownFiles(area, entryPath)));
      continue;
    }

    if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
      files.push(relative(area.directory, entryPath).split(sep).join("/"));
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

async function readKnowledgeArea(area: KnowledgeArea, requestedFile?: string): Promise<string> {
  const baseDirectory = await realpath(area.directory);

  if (requestedFile === undefined) {
    const files = await listMarkdownFiles({ ...area, directory: baseDirectory });
    const listing = files.length > 0 ? files.map((file) => `- ${file}`).join("\n") : "- No Markdown files found.";

    return `Available files in ${area.label}:\n${listing}`;
  }

  if (requestedFile.includes("\0")) {
    throw new Error("The requested filename contains an invalid null byte");
  }

  if (isAbsolute(requestedFile) || extname(requestedFile).toLowerCase() !== ".md") {
    throw new Error("Provide a relative Markdown filename ending in .md");
  }

  const candidatePath = resolve(baseDirectory, requestedFile);
  if (!isPathContained(baseDirectory, candidatePath)) {
    throw new Error("The requested file is outside the permitted knowledge area");
  }
  if (isExcludedKnowledgePath(area, baseDirectory, candidatePath)) {
    throw new Error("The requested file is excluded from the distributable knowledge area");
  }

  let resolvedFile: string;
  try {
    resolvedFile = await realpath(candidatePath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`Knowledge file not found: ${requestedFile}`);
    }
    throw error;
  }

  if (!isPathContained(baseDirectory, resolvedFile)) {
    throw new Error("The requested file resolves outside the permitted knowledge area");
  }
  if (isExcludedKnowledgePath(area, baseDirectory, resolvedFile)) {
    throw new Error("The requested file resolves inside an excluded knowledge area");
  }

  const fileStats = await stat(resolvedFile);
  if (!fileStats.isFile()) {
    throw new Error("The requested path is not a regular file");
  }

  if (fileStats.size > MAX_FILE_BYTES) {
    throw new Error(`Knowledge file exceeds the ${MAX_FILE_BYTES}-byte read limit`);
  }

  const content = await readFile(resolvedFile, "utf8");
  const sourcePath = relative(PROJECT_ROOT, resolvedFile).split(sep).join("/");
  return `Source: ${sourcePath}\n\n${content}`;
}

async function resolveBenchmarkContract(requestedFile: string): Promise<string> {
  if (requestedFile.includes("\0") || isAbsolute(requestedFile)) {
    throw new Error("Provide a repository-relative benchmark contract path");
  }
  if (!/\.ya?ml$/i.test(requestedFile)) {
    throw new Error("Benchmark contracts must end in .yaml or .yml");
  }
  const benchmarkRoot = await realpath(BENCHMARK_ROOT);
  const candidate = resolve(benchmarkRoot, requestedFile);
  if (!isPathContained(benchmarkRoot, candidate)) {
    throw new Error("The requested contract is outside the benchmark directory");
  }
  const resolvedFile = await realpath(candidate);
  if (!isPathContained(benchmarkRoot, resolvedFile)) {
    throw new Error("The requested contract resolves outside the benchmark directory");
  }
  const fileStats = await stat(resolvedFile);
  if (!fileStats.isFile() || fileStats.size > MAX_FILE_BYTES) {
    throw new Error("The requested contract is unavailable or exceeds the file-size limit");
  }
  return resolvedFile;
}

async function resolveBenchmarkAttestations(requestedFile: string): Promise<string> {
  if (requestedFile.includes("\0") || isAbsolute(requestedFile)) {
    throw new Error("Provide a repository-relative benchmark attestation path");
  }
  if (!/\.(?:json|ya?ml)$/i.test(requestedFile)) {
    throw new Error("Attestations must end in .json, .yaml, or .yml");
  }
  const benchmarkRoot = await realpath(BENCHMARK_ROOT);
  const candidate = resolve(benchmarkRoot, requestedFile);
  if (!isPathContained(benchmarkRoot, candidate)) {
    throw new Error("The requested attestations are outside the benchmark directory");
  }
  const resolvedFile = await realpath(candidate);
  if (!isPathContained(benchmarkRoot, resolvedFile)) {
    throw new Error("The requested attestations resolve outside the benchmark directory");
  }
  const fileStats = await stat(resolvedFile);
  if (!fileStats.isFile() || fileStats.size > MAX_FILE_BYTES) {
    throw new Error("The requested attestations are unavailable or exceed the file-size limit");
  }
  return resolvedFile;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unknown file-reading error occurred";
}

async function configuredAuditRoots(): Promise<string[]> {
  const configuredRoots = process.env.ZTOTHEZ_DESIGN_AUDIT_ROOTS?.split(delimiter)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const roots = configuredRoots?.length ? configuredRoots : [PROJECT_ROOT];
  const resolvedRoots: string[] = [];

  for (const root of roots) {
    const resolvedRoot = await realpath(resolve(root));
    const rootStats = await stat(resolvedRoot);
    if (!rootStats.isDirectory()) {
      throw new Error(`Configured audit root is not a directory: ${root}`);
    }
    resolvedRoots.push(resolvedRoot);
  }

  return resolvedRoots;
}

async function resolveAllowedAuditTarget(requestedTarget: string): Promise<string> {
  if (requestedTarget.includes("\0")) {
    throw new Error("The audit target contains an invalid null byte");
  }

  const roots = await configuredAuditRoots();
  const candidates = isAbsolute(requestedTarget)
    ? [requestedTarget]
    : roots.map((root) => resolve(root, requestedTarget));

  for (const candidate of candidates) {
    let resolvedCandidate: string;
    try {
      resolvedCandidate = await realpath(candidate);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    if (roots.some((root) => isPathContained(root, resolvedCandidate))) {
      const candidateStats = await stat(resolvedCandidate);
      if (!candidateStats.isDirectory()) {
        throw new Error("Audit target must be a directory");
      }
      return resolvedCandidate;
    }
  }

  throw new Error(
    "Audit target is unavailable or outside ZTOTHEZ_DESIGN_AUDIT_ROOTS. Configure explicit allowed roots before scanning external repositories.",
  );
}

async function configuredHeuristicReviewRoots(): Promise<string[]> {
  const configuredRoots = process.env.ZTOTHEZ_DESIGN_HEURISTIC_REVIEW_ROOTS?.split(delimiter)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const roots = configuredRoots?.length ? configuredRoots : [PROJECT_ROOT];
  const resolvedRoots: string[] = [];
  for (const root of roots) {
    const resolvedRoot = await realpath(resolve(root));
    if (!(await stat(resolvedRoot)).isDirectory()) {
      throw new Error(`Configured heuristic review root is not a directory: ${root}`);
    }
    resolvedRoots.push(resolvedRoot);
  }
  return resolvedRoots;
}

async function resolveAllowedHeuristicReview(requestedFile: string): Promise<string> {
  if (requestedFile.includes("\0")) {
    throw new Error("The heuristic review path contains an invalid null byte");
  }
  if (!/\.(?:json|ya?ml)$/i.test(requestedFile)) {
    throw new Error("Heuristic reviews must end in .json, .yaml, or .yml");
  }

  const roots = await configuredHeuristicReviewRoots();
  const candidates = isAbsolute(requestedFile)
    ? [requestedFile]
    : roots.map((root) => resolve(root, requestedFile));

  for (const candidate of candidates) {
    let resolvedCandidate: string;
    try {
      resolvedCandidate = await realpath(candidate);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
      throw error;
    }
    if (!roots.some((root) => isPathContained(root, resolvedCandidate))) continue;
    const fileStats = await stat(resolvedCandidate);
    if (!fileStats.isFile()) throw new Error("Heuristic review path must be a regular file");
    if (fileStats.size > MAX_FILE_BYTES) {
      throw new Error(`Heuristic review exceeds the ${MAX_FILE_BYTES}-byte read limit`);
    }
    return resolvedCandidate;
  }

  throw new Error(
    "Heuristic review is unavailable or outside ZTOTHEZ_DESIGN_HEURISTIC_REVIEW_ROOTS. Configure explicit allowed roots before reading external review artifacts.",
  );
}

function isAllowedRuntimeUrl(value: string): boolean {
  const url = validateRuntimeUrl(value);
  const configuredOrigins = process.env.ZTOTHEZ_DESIGN_RUNTIME_ORIGINS?.split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => validateRuntimeUrl(entry).origin);

  if (configuredOrigins?.length) {
    return configuredOrigins.includes(url.origin);
  }

  return ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(url.hostname);
}

function runtimeOutputName(reportName?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const suffix = reportName
    ?.toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return suffix ? `${timestamp}-${suffix}` : timestamp;
}

async function createRuntimeOutputDirectory(reportName?: string): Promise<string> {
  const root = resolve(
    process.env.ZTOTHEZ_DESIGN_RUNTIME_OUTPUT_ROOT?.trim() || join(PROJECT_ROOT, ".ztothez-design-runtime"),
  );
  await mkdir(root, { recursive: true });
  const resolvedRoot = await realpath(root);
  const outputDirectory = join(resolvedRoot, runtimeOutputName(reportName));
  await mkdir(outputDirectory, { recursive: false });
  return outputDirectory;
}

async function createQualityGateOutputDirectory(reportName?: string): Promise<string> {
  const root = await qualityGateOutputRoot();
  const outputDirectory = join(root, runtimeOutputName(reportName));
  await mkdir(outputDirectory, { recursive: false });
  return outputDirectory;
}

async function qualityGateOutputRoot(): Promise<string> {
  const root = resolve(
    process.env.ZTOTHEZ_DESIGN_QUALITY_GATE_OUTPUT_ROOT?.trim() || join(PROJECT_ROOT, ".ztothez-design-quality-gate"),
  );
  await mkdir(root, { recursive: true });
  return realpath(root);
}

async function resolveQualityGateReportDirectory(name: string): Promise<string> {
  if (!/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(name)) {
    throw new Error("Report directory names may contain only letters, numbers, dots, underscores, and hyphens");
  }
  const root = await qualityGateOutputRoot();
  const directory = await realpath(join(root, name));
  if (!isPathContained(root, directory) || !(await stat(directory)).isDirectory()) {
    throw new Error(`Quality gate report directory is unavailable: ${name}`);
  }
  return directory;
}

function registerKnowledgeTool(
  name: string,
  description: string,
  area: KnowledgeArea,
): void {
  server.registerTool(
    name,
    {
      title: name,
      description,
      inputSchema: fileInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ file }) => {
      try {
        const text = await readKnowledgeArea(area, file);
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        const message = errorMessage(error);
        console.error(`[${name}] ${message}`);
        return {
          isError: true,
          content: [{ type: "text" as const, text: message }],
        };
      }
    },
  );
}

export const server = new McpServer({
  name: PRODUCT_ID,
  version: VERSION,
});

server.registerTool(
  "search_design_knowledge",
  {
    title: "Search approved design knowledge",
    description:
      "Runs deterministic BM25 retrieval over the explicit approved knowledge scope. Returns ranked source paths, section excerpts, confidence, and an explicit no-match result. SKILL.md is marked authoritative, and legacy archives or local raw research are never indexed.",
    inputSchema: knowledgeSearchInputSchema.shape,
    outputSchema: knowledgeSearchReportSchema.shape,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (input) => {
    try {
      const index = await getKnowledgeIndex();
      const report = searchKnowledge(index, input);
      return {
        content: [{ type: "text" as const, text: formatKnowledgeSearchReport(report) }],
        structuredContent: report,
      };
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[search_design_knowledge] ${message}`);
      return {
        isError: true,
        content: [{ type: "text" as const, text: message }],
      };
    }
  },
);

registerKnowledgeTool(
  "get_architecture_spec",
  "List or read Markdown architecture specifications, evaluations, styles, patterns, and package-design references.",
  knowledgeAreas.architecture,
);

server.registerTool(
  "validate_product_contract",
  {
    title: "Validate product contract",
    description:
      "Validates a benchmark product-contract YAML file, its source files, journey profiles, state transitions, and cross-references before design or implementation work begins.",
    inputSchema: {
      contract: z
        .string()
        .trim()
        .min(1)
        .max(512)
        .describe("Path relative to knowledge-base/benchmarks, such as aegisops/product-contract.yaml"),
    },
    outputSchema: contractValidationReportSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ contract }) => {
    try {
      const contractPath = await resolveBenchmarkContract(contract);
      const report = await validateProductContract(contractPath, { projectRoot: PROJECT_ROOT });
      return {
        content: [{ type: "text" as const, text: formatContractValidationReport(report) }],
        structuredContent: report,
        ...(report.passed ? {} : { isError: true }),
      };
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[validate_product_contract] ${message}`);
      return {
        isError: true,
        content: [{ type: "text" as const, text: message }],
      };
    }
  },
);

registerKnowledgeTool(
  "get_figma_system_rules",
  "List or read Markdown guidance for Figma, visual design, product design, and design systems.",
  knowledgeAreas.figmaAndSystems,
);

registerKnowledgeTool(
  "get_dashboard_pattern",
  "List or read Markdown UX research and dashboard-pattern references.",
  knowledgeAreas.uxPatterns,
);

registerKnowledgeTool(
  "get_usability_evaluation",
  "List or read maintained heuristic-evaluation guidance and converted usability-method references.",
  knowledgeAreas.usabilityEvaluation,
);

server.registerTool(
  "evaluate_heuristic_review",
  {
    title: "Evaluate heuristic review",
    description:
      "Validates a reviewer-provided heuristic-review YAML or JSON artifact, preserves automated, AI-assisted expert, human expert, and representative-user evidence as distinct levels, and derives unapplied acceptance-criterion candidates from open severity 3-4 findings. It never creates human attestations or modifies product contracts.",
    inputSchema: {
      reviewFile: z
        .string()
        .trim()
        .min(1)
        .max(4_096)
        .describe(
          "Absolute path or configured-root-relative review file. External roots must be listed in ZTOTHEZ_DESIGN_HEURISTIC_REVIEW_ROOTS.",
        ),
    },
    outputSchema: heuristicReviewReportSchema.shape,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ reviewFile }) => {
    try {
      const resolvedFile = await resolveAllowedHeuristicReview(reviewFile);
      const review = await loadHeuristicReview(resolvedFile);
      const report = evaluateHeuristicReview(review, resolvedFile);
      return {
        content: [{ type: "text" as const, text: formatHeuristicReviewReport(report) }],
        structuredContent: report,
      };
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[evaluate_heuristic_review] ${message}`);
      return {
        isError: true,
        content: [{ type: "text" as const, text: message }],
      };
    }
  },
);

const auditFindingSchema = z.object({
  ruleId: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  confidence: z.enum(["high", "medium", "low"]),
  file: z.string(),
  line: z.number().int().positive().optional(),
  column: z.number().int().positive().optional(),
  message: z.string(),
  evidence: z.array(z.string()),
  remediation: z.string(),
});

const auditReportSchema = {
  version: z.string(),
  target: z.string(),
  generatedAt: z.string(),
  filesScanned: z.number().int().nonnegative(),
  bytesScanned: z.number().int().nonnegative(),
  skippedFiles: z.array(z.object({ file: z.string(), reason: z.string() })),
  findings: z.array(auditFindingSchema),
  summary: z.object({
    errors: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative(),
    info: z.number().int().nonnegative(),
  }),
  passed: z.boolean(),
};

server.registerTool(
  "audit_repository_architecture",
  {
    title: "Audit repository architecture",
    description:
      "Read-only static audit for UI source architecture, mock production paths, placeholder interactions, raw design values, network state handling, accessibility names, and repository verification scripts. This does not prove runtime or visual correctness.",
    inputSchema: {
      targetDirectory: z
        .string()
        .trim()
        .min(1)
        .max(4096)
        .describe(
          "Absolute path or configured-root-relative repository directory. External roots must be listed in ZTOTHEZ_DESIGN_AUDIT_ROOTS.",
        ),
      componentLineWarning: z.number().int().min(100).max(2_000).optional(),
      mixedResponsibilitiesMinLines: z.number().int().min(50).max(2_000).optional(),
    },
    outputSchema: auditReportSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ targetDirectory, componentLineWarning, mixedResponsibilitiesMinLines }) => {
    try {
      const target = await resolveAllowedAuditTarget(targetDirectory);
      const report = await auditRepository(target, {
        ...(componentLineWarning === undefined ? {} : { componentLineWarning }),
        ...(mixedResponsibilitiesMinLines === undefined
          ? {}
          : { mixedResponsibilitiesMinLines }),
      });
      return {
        content: [{ type: "text" as const, text: formatAuditReport(report) }],
        structuredContent: report,
      };
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[audit_repository_architecture] ${message}`);
      return {
        isError: true,
        content: [{ type: "text" as const, text: message }],
      };
    }
  },
);

server.registerTool(
  "verify_ui_runtime",
  {
    title: "Verify UI runtime",
    description:
      "Launches headless Chromium against an already-running UI, captures base and post-journey responsive screenshots, and checks overflow, clipping, collisions, contrast, touch targets, focus visibility and occlusion, keyboard traps and ordering, 200% reflow and text resizing, reduced motion, media, console and network failures, plus optional declarative product journeys. Completed journey state is rechecked at every configured viewport. It does not start applications or execute repository commands.",
    inputSchema: {
      url: z.string().trim().min(1).max(4_096),
      reportName: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/i).optional(),
      viewports: z.array(runtimeViewportSchema).min(1).max(8).optional(),
      journeys: z.array(runtimeJourneySchema).max(10).optional(),
      expectedNetwork: z.array(runtimeExpectedNetworkSchema).max(20).optional(),
      settleMs: z.number().int().min(0).max(30_000).optional(),
    },
    outputSchema: runtimeReportSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ url, reportName, viewports, journeys, expectedNetwork, settleMs }) => {
    try {
      if (!isAllowedRuntimeUrl(url)) {
        throw new Error(
          "Runtime URL is not allowed. Loopback origins are enabled by default; configure exact external origins with ZTOTHEZ_DESIGN_RUNTIME_ORIGINS.",
        );
      }
      const outputDirectory = await createRuntimeOutputDirectory(reportName);
      const report = await verifyUiRuntime({
        url,
        outputDirectory,
        ...(viewports ? { viewports } : {}),
        ...(journeys ? { journeys } : {}),
        ...(expectedNetwork ? { expectedNetwork } : {}),
        ...(settleMs === undefined ? {} : { settleMs }),
      });
      return {
        content: [{ type: "text" as const, text: formatRuntimeReport(report) }],
        structuredContent: report,
      };
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[verify_ui_runtime] ${message}`);
      return {
        isError: true,
        content: [{ type: "text" as const, text: message }],
      };
    }
  },
);

server.registerTool(
  "run_design_quality_gate",
  {
    title: "Run ZtotheZ Design Engineering quality gate",
    description:
      "Runs product-contract validation, static architecture auditing, and a selected browser journey profile against an already-running UI, then writes one consolidated pass/fail evidence report. It does not start applications or execute repository commands.",
    inputSchema: {
      contract: z
        .string()
        .trim()
        .min(1)
        .max(512)
        .describe("Path relative to knowledge-base/benchmarks, such as aegisops/product-contract.yaml"),
      targetDirectory: z
        .string()
        .trim()
        .min(1)
        .max(4_096)
        .describe("Repository path allowed by ZTOTHEZ_DESIGN_AUDIT_ROOTS"),
      url: z.string().trim().min(1).max(4_096),
      profile: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
      reportName: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/i).optional(),
      failOn: z.enum(["error", "warning"]).optional(),
      settleMs: z.number().int().min(0).max(30_000).optional(),
      attestations: z
        .string()
        .trim()
        .min(1)
        .max(512)
        .optional()
        .describe("Optional path relative to knowledge-base/benchmarks"),
    },
    outputSchema: qualityGateReportSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ contract, targetDirectory, url, profile, reportName, failOn, settleMs, attestations }) => {
    try {
      if (!isAllowedRuntimeUrl(url)) {
        throw new Error(
          "Runtime URL is not allowed. Loopback origins are enabled by default; configure exact external origins with ZTOTHEZ_DESIGN_RUNTIME_ORIGINS.",
        );
      }
      const contractPath = await resolveBenchmarkContract(contract);
      const repository = await resolveAllowedAuditTarget(targetDirectory);
      const attestationsPath = attestations
        ? await resolveBenchmarkAttestations(attestations)
        : undefined;
      const outputDirectory = await createQualityGateOutputDirectory(reportName);
      const report = await runQualityGate({
        contractPath,
        projectRoot: PROJECT_ROOT,
        repository,
        outputDirectory,
        url,
        profile,
        ...(failOn ? { failOn } : {}),
        ...(settleMs === undefined ? {} : { settleMs }),
        ...(attestationsPath ? { attestationsPath } : {}),
      });
      return {
        content: [{ type: "text" as const, text: formatQualityGateReport(report) }],
        structuredContent: report,
      };
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[run_design_quality_gate] ${message}`);
      return {
        isError: true,
        content: [{ type: "text" as const, text: message }],
      };
    }
  },
);

server.registerTool(
  "aggregate_design_quality_gates",
  {
    title: "Aggregate ZtotheZ Design Engineering quality gates",
    description:
      "Combines previously generated profile quality-gate and acceptance reports into one contract-derived release decision. Every required profile must be present exactly once, complete, and evaluated with the same failure policy.",
    inputSchema: {
      contract: z
        .string()
        .trim()
        .min(1)
        .max(512)
        .describe("Path relative to knowledge-base/benchmarks, such as aegisops/product-contract.yaml"),
      reportDirectories: z
        .array(z.string().regex(/^[a-z0-9][a-z0-9._-]{0,127}$/i))
        .min(1)
        .max(20)
        .describe("Directory names within ZTOTHEZ_DESIGN_QUALITY_GATE_OUTPUT_ROOT"),
      reportName: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/i).optional(),
      failOn: z.enum(["error", "warning"]).optional(),
    },
    outputSchema: aggregateReportSchema.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async ({ contract, reportDirectories, reportName, failOn }) => {
    try {
      const contractPath = await resolveBenchmarkContract(contract);
      const directories = await Promise.all(
        reportDirectories.map((name) => resolveQualityGateReportDirectory(name)),
      );
      const outputDirectory = await createQualityGateOutputDirectory(
        reportName ? `${reportName}-release` : "release",
      );
      const report = await aggregateQualityGates({
        contractPath,
        projectRoot: PROJECT_ROOT,
        reportDirectories: directories,
        outputDirectory,
        ...(failOn ? { failOn } : {}),
      });
      return {
        content: [{ type: "text" as const, text: formatAggregateReport(report) }],
        structuredContent: report,
      };
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[aggregate_design_quality_gates] ${message}`);
      return {
        isError: true,
        content: [{ type: "text" as const, text: message }],
      };
    }
  },
);
