import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

import { auditRepository } from "../audit/scanner.js";
import { evaluateHeuristicReview } from "../heuristics/evaluator.js";
import { loadHeuristicReview } from "../heuristics/loader.js";
import { runQualityGate } from "../quality-gate/runner.js";
import { VERSION } from "../product.js";
import {
  PORTFOLIO_STAGES,
  resolvePortfolioAdapter,
  runPortfolioAdapterStage,
} from "./adapters.js";
import type { PortfolioRegistryInspection, ResolvedPortfolioProject } from "./registry.js";
import { startPortfolioFixtureServer, type PortfolioFixtureServer } from "./fixture-server.js";
import { portfolioBenchmarkReportSchema } from "./run-schema.js";
import { captureSourceState, SourceMutationError, withPortfolioSnapshot } from "./snapshot.js";
import {
  enforceArtifactPublicationPolicy,
  redactMachinePathsAndSecrets,
  scanTextForSecretsAndPaths,
  type EvidenceClass,
  type PolicyDecision,
  type VaultArtifactInput,
} from "./vault.js";

export type PortfolioRunStage = {
  stage: string;
  status: "passed" | "failed" | "timed-out" | "unsupported" | "not-applicable";
  reason: string;
  durationMs?: number;
  exitCode?: number | null;
  audit?: { filesScanned: number; errors: number; warnings: number; info: number };
  findings?: number;
  limitations?: number;
  findingDetails?: Array<{ source: string; id: string; severity: string; message: string }>;
  limitationDetails?: string[];
  viewports?: Array<{ name: string; width: number; height: number }>;
  fixture?: { state: "ready" | "stopped"; port: number; route: string; directory: string };
};

export type PortfolioArtifact = {
  path: string;
  kind: "report" | "screenshot" | "download" | "other" | "log";
  bytes: number;
  sha256: string;
  evidenceClass?: EvidenceClass;
  policyDecision?: PolicyDecision;
  sourceDigest?: string;
};

export type PortfolioProjectRun = {
  projectId: string;
  cohort: "development" | "holdout";
  adapter?: string;
  sourceDigest?: string;
  sourceRevision?: string;
  environmentPolicy: { network: string; lifecycleScripts: boolean; environmentVariables: string[] };
  commands: Array<{ stage: string; command: string; arguments: string[]; cwd: string; timeoutMs: number; maxOutputBytes: number; allowDependencyNetwork: boolean }>;
  startedAt: string;
  completedAt: string;
  stages: PortfolioRunStage[];
  artifacts: PortfolioArtifact[];
  status: "passed" | "findings" | "limitations" | "unsafe-configuration" | "source-mutation";
  message?: string;
};

export type PortfolioBenchmarkReport = {
  version: "1.0.0" | "1.1.0" | "1.2.0";
  toolVersion: string;
  runId: string;
  mode: "baseline" | "cohort";
  registryId: string;
  registryDigest: string;
  cohort?: "development" | "holdout";
  projectIds: string[];
  startedAt: string;
  completedAt: string;
  projects: PortfolioProjectRun[];
  summary: { passed: number; findings: number; limitations: number; unsafeConfiguration: number; sourceMutation: number };
  resultFingerprint: string;
  passed: boolean;
};

export type PortfolioRunOptions = {
  runId: string;
  registryPath: string;
  workspaceRoot: string;
  runRoot: string;
  mode: "baseline" | "cohort";
  cohort?: "development" | "holdout";
  projects: ResolvedPortfolioProject[];
};

function hash(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function contained(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

async function artifactManifest(
  root: string,
  project?: ResolvedPortfolioProject,
  sourceDigest?: string,
): Promise<{ artifacts: PortfolioArtifact[]; scanError?: string }> {
  const rawArtifacts: VaultArtifactInput[] = [];
  let scanError: string | undefined;

  const walk = async (directory: string): Promise<void> => {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
      throw error;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.isFile()) {
        const body = await readFile(path);
        const relativePath = relative(root, path).split(sep).join("/");
        const extension = entry.name.toLowerCase();
        const isText = /[.](?:json|md|ya?ml|txt|log)$/i.test(extension);

        if (isText) {
          const content = body.toString("utf8");
          const scan = scanTextForSecretsAndPaths(content, {
            allowSourceRoot: project?.canonicalPath,
          });
          if (!scan.passed) {
            scanError = `Secret or prohibited absolute path leakage detected: ${scan.violations.map((v) => `${v.pattern} (${v.snippet})`).join("; ")}`;
          }
        }

        const kind = /[.]png$/i.test(extension)
          ? "screenshot"
          : /[.](?:log|txt)$/i.test(extension)
            ? "log"
            : /download|export/i.test(extension)
              ? "download"
              : /[.](?:json|md|ya?ml)$/i.test(extension)
                ? "report"
                : "other";

        rawArtifacts.push({
          path: relativePath,
          kind,
          bytes: body.byteLength,
          sha256: hash(body),
        });
      }
    }
  };

  await walk(root);

  if (project) {
    const { retainedArtifacts, purgedArtifacts } = enforceArtifactPublicationPolicy(
      rawArtifacts,
      project.declaration,
      sourceDigest,
    );

    for (const purged of purgedArtifacts) {
      const path = join(root, purged.path.split("/").join(sep));
      try {
        await unlink(path);
      } catch {
        // ignore unlink failure
      }
    }

    return { artifacts: retainedArtifacts as PortfolioArtifact[], scanError };
  }

  return { artifacts: rawArtifacts as PortfolioArtifact[], scanError };
}

function snapshotPath(snapshotRoot: string, path: string): string {
  const candidate = resolve(snapshotRoot, path);
  if (!contained(snapshotRoot, candidate)) throw new Error("Verification path escapes the snapshot.");
  return candidate;
}

function privateMessage(error: unknown, project: ResolvedPortfolioProject, workspaceRoot: string): string {
  const message = error instanceof Error ? error.message : String(error);
  return redactMachinePathsAndSecrets(message, {
    sourceRoot: project.canonicalPath,
    workspaceRoot,
  });
}

function validateRunId(runId: string): void {
  if (!/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(runId)) throw new Error("Run ID is invalid.");
}

function projectStatus(stages: PortfolioRunStage[]): PortfolioProjectRun["status"] {
  if (stages.some((stage) => ["failed", "timed-out"].includes(stage.status))) return "findings";
  if (stages.some((stage) => ["unsupported", "not-applicable"].includes(stage.status))) return "limitations";
  return "passed";
}

async function runProject(
  project: ResolvedPortfolioProject,
  workspaceRoot: string,
  artifactRoot: string,
): Promise<PortfolioProjectRun> {
  const startedAt = new Date().toISOString();
  const declaration = project.declaration;
  const base = {
    projectId: declaration.id,
    cohort: declaration.cohort as "development" | "holdout",
    environmentPolicy: {
      network: declaration.execution.networkPolicy,
      lifecycleScripts: declaration.execution.lifecycleScripts,
      environmentVariables: [...declaration.execution.allowedEnvironmentVariables].sort(),
    },
    commands: declaration.execution.commands.map((command) => ({
      stage: command.stage,
      command: command.command,
      arguments: [...command.arguments],
      cwd: command.cwd,
      timeoutMs: command.timeoutMs,
      maxOutputBytes: command.maxOutputBytes,
      allowDependencyNetwork: command.allowDependencyNetwork,
    })),
    startedAt,
    artifacts: [] as PortfolioArtifact[],
  };
  let retainedSource: Awaited<ReturnType<typeof captureSourceState>>;
  try {
    retainedSource = await captureSourceState(project);
  } catch (error) {
    return {
      ...base,
      completedAt: new Date().toISOString(),
      stages: [],
      status: "unsafe-configuration",
      message: privateMessage(error, project, workspaceRoot),
    };
  }
  try {
    const execution = await withPortfolioSnapshot(project, workspaceRoot, async (snapshot) => {
      const adapter = resolvePortfolioAdapter(project);
      if (!adapter.passed) throw new Error(adapter.issues.map((entry) => `${entry.code}: ${entry.message}`).join("; "));
      const stages: PortfolioRunStage[] = [];
      let fixture: PortfolioFixtureServer | undefined;
      try {
      for (const stage of PORTFOLIO_STAGES) {
        if (stage === "source-audit") {
          const capability = adapter.capabilities.find((entry) => entry.stage === stage)!;
          if (capability.effectiveStatus !== "supported") {
            stages.push({ stage, status: capability.effectiveStatus, reason: capability.reason });
            continue;
          }
          const audit = await auditRepository(snapshot.snapshotRoot, {
            requiredPackageScripts: [],
            requiredPackageScriptGroups: [],
          });
          stages.push({
            stage,
            status: audit.passed ? "passed" : "failed",
            reason: audit.passed ? "Static source audit passed." : "Static source audit reported error findings.",
            findings: audit.findings.length,
            findingDetails: audit.findings.map((finding) => ({
              source: "source-audit",
              id: finding.ruleId,
              severity: finding.severity,
              message: finding.message,
            })),
            limitations: audit.evidenceBoundary.verifierLimitations.length,
            limitationDetails: audit.evidenceBoundary.verifierLimitations,
            audit: {
              filesScanned: audit.filesScanned,
              errors: audit.summary.errors,
              warnings: audit.summary.warnings,
              info: audit.summary.info,
            },
          });
          continue;
        }
        if (stage === "local-fixture-server" && project.declaration.verification) {
          const capability = adapter.capabilities.find((entry) => entry.stage === stage)!;
          if (capability.effectiveStatus !== "supported") {
            stages.push({ stage, status: capability.effectiveStatus, reason: capability.reason });
            continue;
          }
          try {
            fixture = await startPortfolioFixtureServer(snapshot);
          } catch (error) {
            stages.push({
              stage,
              status: "unsupported",
              reason: "The declared local fixture could not reach readiness.",
              limitations: 1,
              limitationDetails: [privateMessage(error, project, workspaceRoot)],
            });
            continue;
          }
          stages.push({
            stage,
            status: "passed",
            reason: "The declared static fixture is ready on an approved loopback port.",
            fixture: { state: "ready", port: fixture.port, route: project.declaration.verification.route, directory: fixture.directory },
          });
          continue;
        }
        if (stage === "browser-journeys" && project.declaration.verification) {
          if (!fixture) {
            stages.push({ stage, status: "unsupported", reason: "Browser verification requires a ready fixture server." });
            continue;
          }
          const verification = project.declaration.verification;
          const outputDirectory = join(artifactRoot, "quality-gate");
          let report;
          try {
          report = await runQualityGate({
            contractPath: snapshotPath(snapshot.snapshotRoot, verification.contractPath),
            projectRoot: snapshot.snapshotRoot,
            repository: snapshot.snapshotRoot,
            outputDirectory,
            url: fixture.url,
            profile: verification.profile,
            settleMs: verification.settleMs,
            ...(verification.attestationsPath
              ? { attestationsPath: snapshotPath(snapshot.snapshotRoot, verification.attestationsPath) }
              : {}),
          });
          } catch (error) {
            stages.push({
              stage,
              status: "unsupported",
              reason: "Browser quality-gate verification could not complete.",
              limitations: 1,
              limitationDetails: [privateMessage(error, project, workspaceRoot)],
            });
            continue;
          }
          const runtimeJson = await readFile(join(outputDirectory, "runtime", "runtime-report.json"), "utf8").catch(() => undefined);
          const runtime = runtimeJson ? JSON.parse(runtimeJson) as { viewports?: Array<{ name: string; width: number; height: number }>; findings?: Array<{ checkId: string; severity: string; message: string }> } : undefined;
          const architectureJson = await readFile(join(outputDirectory, "architecture-report.json"), "utf8").catch(() => undefined);
          const architecture = architectureJson ? JSON.parse(architectureJson) as { findings?: Array<{ ruleId: string; severity: string; message: string }> } : undefined;
          const limitations = report.evidenceBoundary.verifierLimitations.length;
          const findingDetails = [
            ...(architecture?.findings ?? []).map((finding) => ({ source: "architecture", id: finding.ruleId, severity: finding.severity, message: finding.message })),
            ...(runtime?.findings ?? []).map((finding) => ({ source: "runtime", id: finding.checkId, severity: finding.severity, message: finding.message })),
          ];
          stages.push({
            stage,
            status: report.passed ? "passed" : report.complete ? "failed" : "unsupported",
            reason: report.passed
              ? "Product contract, runtime journeys, accessibility checks, and acceptance criteria passed."
              : report.complete
                ? "The consolidated quality gate reported product findings."
                : "The consolidated quality gate could not collect complete evidence.",
            findings: report.summary.errors + report.summary.warnings,
            limitations,
            findingDetails,
            limitationDetails: report.evidenceBoundary.verifierLimitations,
            ...(runtime?.viewports ? { viewports: runtime.viewports } : {}),
          });
          continue;
        }
        const result = await runPortfolioAdapterStage(snapshot, stage);
        stages.push({
          stage,
          status: result.status,
          reason: result.reason,
          ...(result.process
            ? { durationMs: result.process.durationMs, exitCode: result.process.exitCode }
            : {}),
        });
      }
      if (project.declaration.verification?.heuristicReviewPath) {
        const reviewPath = snapshotPath(snapshot.snapshotRoot, project.declaration.verification.heuristicReviewPath);
        const review = evaluateHeuristicReview(await loadHeuristicReview(reviewPath), reviewPath);
        await mkdir(artifactRoot, { recursive: true });
        await writeFile(join(artifactRoot, "heuristic-report.json"), `${JSON.stringify(review, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
        stages.push({
          stage: "heuristic-review",
          status: review.requiresAcceptanceWork ? "failed" : "passed",
          reason: review.requiresAcceptanceWork
            ? `${review.acceptanceCandidates.length} unresolved severity 3-4 findings require acceptance work.`
            : "The declared structured heuristic review has no unresolved severity 3-4 findings.",
          findings: review.summary.open,
        });
      }
      } finally {
        if (fixture) {
          await fixture.close();
          const stage = stages.find((entry) => entry.stage === "local-fixture-server");
          if (stage?.fixture) stage.fixture.state = "stopped";
        }
      }
      const processed = await artifactManifest(artifactRoot, project, snapshot.sourceState.digest);
      return {
        adapter: adapter.adapter?.id,
        sourceDigest: snapshot.sourceState.digest,
        sourceRevision: snapshot.sourceState.git?.head ?? "unversioned",
        stages,
        artifacts: processed.artifacts,
        scanError: processed.scanError,
      };
    });
    const status = execution.result.scanError
      ? "unsafe-configuration"
      : projectStatus(execution.result.stages);
    const message = execution.result.scanError ?? undefined;

    return {
      ...base,
      ...(execution.result.adapter ? { adapter: execution.result.adapter } : {}),
      sourceDigest: execution.result.sourceDigest,
      sourceRevision: execution.result.sourceRevision,
      stages: execution.result.stages,
      artifacts: execution.result.artifacts,
      status,
      ...(message ? { message } : {}),
      completedAt: new Date().toISOString(),
    };
  } catch (error) {
    const mutation = error instanceof SourceMutationError;
    const processed = await artifactManifest(artifactRoot, project, retainedSource.digest);
    return {
      ...base,
      sourceDigest: retainedSource.digest,
      sourceRevision: retainedSource.git?.head ?? "unversioned",
      stages: [],
      artifacts: processed.artifacts,
      status: mutation ? "source-mutation" : "unsafe-configuration",
      message: privateMessage(error, project, workspaceRoot),
      completedAt: new Date().toISOString(),
    };
  }
}

function summarize(projects: PortfolioProjectRun[]): PortfolioBenchmarkReport["summary"] {
  return {
    passed: projects.filter((entry) => entry.status === "passed").length,
    findings: projects.filter((entry) => entry.status === "findings").length,
    limitations: projects.filter((entry) => entry.status === "limitations").length,
    unsafeConfiguration: projects.filter((entry) => entry.status === "unsafe-configuration").length,
    sourceMutation: projects.filter((entry) => entry.status === "source-mutation").length,
  };
}

export async function runPortfolioBenchmark(
  inspection: PortfolioRegistryInspection,
  options: PortfolioRunOptions,
): Promise<{ report: PortfolioBenchmarkReport; path: string }> {
  validateRunId(options.runId);
  if (!inspection.registry || !inspection.report.passed) throw new Error("Portfolio registry must pass before benchmarking.");
  const registryDigest = hash(await readFile(resolve(options.registryPath), "utf8"));
  const directory = join(resolve(options.runRoot), options.runId);
  await mkdir(resolve(options.runRoot), { recursive: true });
  await mkdir(directory, { recursive: false });
  const startedAt = new Date().toISOString();
  const projects: PortfolioProjectRun[] = [];
  for (const project of [...options.projects].sort((left, right) => left.declaration.id.localeCompare(right.declaration.id))) {
    projects.push(await runProject(project, options.workspaceRoot, join(directory, project.declaration.id)));
  }
  const summary = summarize(projects);
  const normalizedProjects = projects.map(({ startedAt: _startedAt, completedAt: _completedAt, ...project }) => ({
    ...project,
    stages: project.stages.map(({ durationMs: _durationMs, ...stage }) => stage),
  }));
  const normalized = { registryDigest, mode: options.mode, cohort: options.cohort, projects: normalizedProjects };
  const report: PortfolioBenchmarkReport = {
    version: "1.2.0",
    toolVersion: VERSION,
    runId: options.runId,
    mode: options.mode,
    registryId: inspection.registry.id,
    registryDigest,
    ...(options.cohort ? { cohort: options.cohort } : {}),
    projectIds: projects.map((entry) => entry.projectId),
    startedAt,
    completedAt: new Date().toISOString(),
    projects,
    summary,
    resultFingerprint: hash(JSON.stringify(normalized)),
    passed: summary.findings === 0 && summary.unsafeConfiguration === 0 && summary.sourceMutation === 0,
  };
  const path = join(directory, "report.json");
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  return { report, path };
}

export async function readPortfolioBenchmarkReport(runRoot: string, runId: string): Promise<PortfolioBenchmarkReport> {
  validateRunId(runId);
  return portfolioBenchmarkReportSchema.parse(
    JSON.parse(await readFile(join(resolve(runRoot), runId, "report.json"), "utf8")),
  ) as PortfolioBenchmarkReport;
}

export async function verifyPortfolioRunSources(
  inspection: PortfolioRegistryInspection,
  runRoot: string,
  runId: string,
): Promise<{ runId: string; unchanged: boolean; projects: Array<{ projectId: string; unchanged: boolean; expected?: string; actual?: string }> }> {
  const report = await readPortfolioBenchmarkReport(runRoot, runId);
  const projects = [];
  for (const retained of report.projects) {
    const project = inspection.projects.find((entry) => entry.declaration.id === retained.projectId);
    if (!project || !retained.sourceDigest) {
      projects.push({ projectId: retained.projectId, unchanged: false, expected: retained.sourceDigest });
      continue;
    }
    const current = await captureSourceState(project);
    projects.push({ projectId: retained.projectId, unchanged: current.digest === retained.sourceDigest, expected: retained.sourceDigest, actual: current.digest });
  }
  return { runId, unchanged: projects.every((entry) => entry.unchanged), projects };
}

export function portfolioRunExitCode(report: PortfolioBenchmarkReport): 0 | 1 | 2 | 3 | 4 {
  if (report.summary.sourceMutation > 0) return 4;
  if (report.summary.unsafeConfiguration > 0) return 3;
  if (report.summary.findings > 0) return 1;
  if (report.summary.limitations > 0) return 2;
  return 0;
}
