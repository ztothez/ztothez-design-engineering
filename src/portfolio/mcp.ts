import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { resolvePortfolioAdapter } from "./adapters.js";
import { inspectPortfolioRegistry } from "./registry.js";
import { readPortfolioBenchmarkReport } from "./runner.js";

import { evaluateCrossProductTaxonomy } from "./taxonomy.js";
import { evaluateRuleCandidate } from "./promotion.js";
import { evaluateV3Qualification } from "./qualification.js";

function requireEnabled(): void {
  if (process.env.ZTOTHEZ_DESIGN_PORTFOLIO_MCP !== "enabled") {
    throw new Error("Local portfolio MCP access is disabled. Set ZTOTHEZ_DESIGN_PORTFOLIO_MCP=enabled explicitly.");
  }
}

function configuredPath(variable: string): string {
  const value = process.env[variable]?.trim();
  if (!value) throw new Error(`${variable} must be configured for local portfolio MCP access.`);
  return resolve(value);
}

export async function listPortfolioProjectsForMcp() {
  requireEnabled();
  const inspection = await inspectPortfolioRegistry(configuredPath("ZTOTHEZ_DESIGN_PORTFOLIO_REGISTRY"));
  if (!inspection.report.passed) throw new Error("The configured local portfolio registry is invalid.");
  return {
    version: "1.0.0",
    registryId: inspection.registry!.id,
    projects: inspection.projects
      .filter((project) => project.declaration.enabled)
      .map((project) => {
        const adapter = resolvePortfolioAdapter(project);
        return {
          id: project.declaration.id,
          cohort: project.declaration.cohort as "development" | "holdout",
          archetype: project.declaration.product.archetype,
          adapter: adapter.adapter?.id,
          capabilities: adapter.capabilities.map((capability) => ({
            stage: capability.stage,
            status: capability.effectiveStatus,
          })),
        };
      })
      .sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export async function readPortfolioReportForMcp(runId: string, projectId?: string) {
  requireEnabled();
  const report = await readPortfolioBenchmarkReport(
    configuredPath("ZTOTHEZ_DESIGN_PORTFOLIO_REPORT_ROOT"),
    runId,
  );
  const selected = projectId
    ? report.projects.filter((project) => project.projectId === projectId)
    : report.projects;
  if (projectId && selected.length === 0) throw new Error("The requested project is not present in this run.");
  return {
    version: "1.0.0",
    runId: report.runId,
    mode: report.mode,
    cohort: report.cohort,
    registryId: report.registryId,
    toolVersion: report.toolVersion,
    startedAt: report.startedAt,
    completedAt: report.completedAt,
    resultFingerprint: report.resultFingerprint,
    passed: report.passed,
    summary: report.summary,
    projects: selected.map((project) => ({
      projectId: project.projectId,
      cohort: project.cohort,
      adapter: project.adapter,
      sourceDigest: project.sourceDigest,
      sourceRevision: project.sourceRevision,
      status: project.status,
      stages: project.stages,
      artifacts: project.artifacts,
    })),
  };
}

export async function getCrossProductEvaluationForMcp(runId: string) {
  requireEnabled();
  const report = await readPortfolioBenchmarkReport(
    configuredPath("ZTOTHEZ_DESIGN_PORTFOLIO_REPORT_ROOT"),
    runId,
  );
  const inspection = await inspectPortfolioRegistry(
    configuredPath("ZTOTHEZ_DESIGN_PORTFOLIO_REGISTRY"),
  );
  return evaluateCrossProductTaxonomy(report, inspection.projects);
}

export async function evaluateRulePromotionForMcp(candidatePath: string, devRunId?: string, holdoutRunId?: string) {
  requireEnabled();
  const candidateInput = JSON.parse(await readFile(resolve(candidatePath), "utf8"));
  const inspection = await inspectPortfolioRegistry(
    configuredPath("ZTOTHEZ_DESIGN_PORTFOLIO_REGISTRY"),
  );
  const reportRoot = configuredPath("ZTOTHEZ_DESIGN_PORTFOLIO_REPORT_ROOT");
  const devReport = devRunId ? await readPortfolioBenchmarkReport(reportRoot, devRunId) : undefined;
  const holdoutReport = holdoutRunId ? await readPortfolioBenchmarkReport(reportRoot, holdoutRunId) : undefined;
  return evaluateRuleCandidate(candidateInput, inspection, devReport, holdoutReport);
}

export async function evaluateV3QualificationForMcp(devRunId?: string, holdoutRunId?: string) {
  requireEnabled();
  const inspection = await inspectPortfolioRegistry(
    configuredPath("ZTOTHEZ_DESIGN_PORTFOLIO_REGISTRY"),
  );
  const reportRoot = configuredPath("ZTOTHEZ_DESIGN_PORTFOLIO_REPORT_ROOT");
  const devReport = devRunId ? await readPortfolioBenchmarkReport(reportRoot, devRunId) : undefined;
  const holdoutReport = holdoutRunId ? await readPortfolioBenchmarkReport(reportRoot, holdoutRunId) : undefined;
  return evaluateV3Qualification(inspection, devReport, holdoutReport);
}
