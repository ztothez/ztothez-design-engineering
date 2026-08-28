import type { PortfolioBenchmarkReport, PortfolioProjectRun } from "./runner.js";
import type { ResolvedPortfolioProject } from "./registry.js";
import {
  crossProductReportSchema,
  evaluationDimensionSchema,
  type CrossProductReport,
  type CrossProjectComparisonValidation,
  type DimensionMetrics,
  type EvaluationDimension,
  type MaintainerAnnotation,
  type ProjectDimensionSummary,
  type RecurrenceItem,
  type StackCoverage,
} from "./taxonomy-schema.js";

const ALL_DIMENSIONS: EvaluationDimension[] = [
  "product-task",
  "interface-trust",
  "information-design",
  "visual-polish",
  "accessibility",
  "responsive",
  "architecture",
  "runtime-reliability",
  "audit-precision",
];

function emptyMetrics(): DimensionMetrics {
  return { eligible: 0, passed: 0, findings: 0, limitations: 0, abstentions: 0 };
}

function mapStageToDimension(stage: string): EvaluationDimension {
  switch (stage) {
    case "source-audit":
      return "architecture";
    case "typecheck":
    case "lint":
      return "audit-precision";
    case "unit-test":
    case "production-build":
      return "runtime-reliability";
    case "local-fixture-server":
      return "runtime-reliability";
    case "browser-journeys":
      return "product-task";
    case "export-verification":
      return "runtime-reliability";
    case "heuristic-review":
      return "interface-trust";
    default:
      return "audit-precision";
  }
}

function mapFindingSourceToDimension(source: string, ruleId: string): EvaluationDimension {
  const lower = (source + " " + ruleId).toLowerCase();
  if (lower.includes("accessibility") || lower.includes("a11y") || lower.includes("wcag")) return "accessibility";
  if (lower.includes("trust") || lower.includes("provenance") || lower.includes("attestation")) return "interface-trust";
  if (lower.includes("information") || lower.includes("hierarchy")) return "information-design";
  if (lower.includes("visual") || lower.includes("polish") || lower.includes("css")) return "visual-polish";
  if (lower.includes("responsive") || lower.includes("viewport") || lower.includes("reflow")) return "responsive";
  if (lower.includes("architecture") || lower.includes("import") || lower.includes("coupling")) return "architecture";
  if (lower.includes("runtime") || lower.includes("journey") || lower.includes("task")) return "product-task";
  return "audit-precision";
}

export function evaluateCrossProductTaxonomy(
  report: PortfolioBenchmarkReport,
  projects: ResolvedPortfolioProject[] = [],
  annotations: MaintainerAnnotation[] = [],
): CrossProductReport {
  const projectMap = new Map(projects.map((p) => [p.declaration.id, p]));
  const projectSummaries: ProjectDimensionSummary[] = [];

  const dimensionTotals: Record<EvaluationDimension, DimensionMetrics> = {
    "product-task": emptyMetrics(),
    "interface-trust": emptyMetrics(),
    "information-design": emptyMetrics(),
    "visual-polish": emptyMetrics(),
    accessibility: emptyMetrics(),
    responsive: emptyMetrics(),
    architecture: emptyMetrics(),
    "runtime-reliability": emptyMetrics(),
    "audit-precision": emptyMetrics(),
  };

  const recurrenceMap = new Map<
    string,
    {
      ruleId: string;
      category: string;
      dimension: EvaluationDimension;
      affectedProjects: Set<string>;
      affectedDomains: Set<string>;
      totalOccurrences: number;
      sampleMessages: Set<string>;
    }
  >();

  for (const projectRun of report.projects) {
    const resolved = projectMap.get(projectRun.projectId);
    const domain = resolved?.declaration.product.domain ?? "unknown";
    const archetype = resolved?.declaration.product.archetype ?? "utility";
    const framework = resolved?.declaration.technology.framework ?? projectRun.adapter ?? "unknown";

    const dimensions: Record<EvaluationDimension, DimensionMetrics> = {
      "product-task": emptyMetrics(),
      "interface-trust": emptyMetrics(),
      "information-design": emptyMetrics(),
      "visual-polish": emptyMetrics(),
      accessibility: emptyMetrics(),
      responsive: emptyMetrics(),
      architecture: emptyMetrics(),
      "runtime-reliability": emptyMetrics(),
      "audit-precision": emptyMetrics(),
    };

    for (const stage of projectRun.stages) {
      const dim = mapStageToDimension(stage.stage);
      dimensions[dim].eligible += 1;

      if (stage.status === "passed") {
        dimensions[dim].passed += 1;
      } else if (stage.status === "failed" || stage.status === "timed-out") {
        dimensions[dim].findings += (stage.findings ?? 1);
      } else if (stage.status === "unsupported") {
        dimensions[dim].limitations += 1;
      } else if (stage.status === "not-applicable") {
        dimensions[dim].abstentions += 1;
      }

      if (stage.findingDetails) {
        for (const finding of stage.findingDetails) {
          const findingDim = mapFindingSourceToDimension(finding.source, finding.id);
          const key = `${finding.source}:${finding.id}`;
          let rec = recurrenceMap.get(key);
          if (!rec) {
            rec = {
              ruleId: finding.id,
              category: finding.source,
              dimension: findingDim,
              affectedProjects: new Set(),
              affectedDomains: new Set(),
              totalOccurrences: 0,
              sampleMessages: new Set(),
            };
            recurrenceMap.set(key, rec);
          }
          rec.affectedProjects.add(projectRun.projectId);
          rec.affectedDomains.add(domain);
          rec.totalOccurrences += 1;
          if (rec.sampleMessages.size < 5) {
            rec.sampleMessages.add(finding.message);
          }
        }
      }
    }

    // Accumulate project totals
    const totals = emptyMetrics();
    for (const dim of ALL_DIMENSIONS) {
      totals.eligible += dimensions[dim].eligible;
      totals.passed += dimensions[dim].passed;
      totals.findings += dimensions[dim].findings;
      totals.limitations += dimensions[dim].limitations;
      totals.abstentions += dimensions[dim].abstentions;

      dimensionTotals[dim].eligible += dimensions[dim].eligible;
      dimensionTotals[dim].passed += dimensions[dim].passed;
      dimensionTotals[dim].findings += dimensions[dim].findings;
      dimensionTotals[dim].limitations += dimensions[dim].limitations;
      dimensionTotals[dim].abstentions += dimensions[dim].abstentions;
    }

    projectSummaries.push({
      projectId: projectRun.projectId,
      domain,
      archetype,
      framework,
      dimensions,
      totals,
    });
  }

  // Recurrence taxonomy
  const recurrenceTaxonomy: RecurrenceItem[] = Array.from(recurrenceMap.values())
    .map((rec) => ({
      ruleId: rec.ruleId,
      category: rec.category,
      dimension: rec.dimension,
      affectedProjects: Array.from(rec.affectedProjects).sort(),
      affectedDomains: Array.from(rec.affectedDomains).sort(),
      totalOccurrences: rec.totalOccurrences,
      sampleMessages: Array.from(rec.sampleMessages),
    }))
    .sort((a, b) => b.totalOccurrences - a.totalOccurrences);

  // Stack coverage
  const stackMap = new Map<string, { framework: string; archetype: string; projectsCount: number; dims: Set<EvaluationDimension> }>();
  for (const summary of projectSummaries) {
    const key = `${summary.framework}:${summary.archetype}`;
    let stack = stackMap.get(key);
    if (!stack) {
      stack = { framework: summary.framework, archetype: summary.archetype, projectsCount: 0, dims: new Set() };
      stackMap.set(key, stack);
    }
    stack.projectsCount += 1;
    for (const dim of ALL_DIMENSIONS) {
      if (summary.dimensions[dim].eligible > 0) stack.dims.add(dim);
    }
  }

  const stackCoverage: StackCoverage[] = Array.from(stackMap.values()).map((s) => ({
    framework: s.framework,
    archetype: s.archetype,
    projectsCount: s.projectsCount,
    dimensionsCovered: Array.from(s.dims).sort(),
  }));

  // Annotations
  const confirmedFalsePositives = annotations.filter((a) => a.type === "false-positive").length;
  const confirmedFalseNegatives = annotations.filter((a) => a.type === "false-negative").length;

  const result: CrossProductReport = {
    version: "1.0.0",
    toolVersion: report.toolVersion,
    runId: report.runId,
    evaluatedAt: new Date().toISOString(),
    projectsCount: report.projects.length,
    projectSummaries,
    dimensionTotals,
    recurrenceTaxonomy,
    stackCoverage,
    annotations: {
      supplied: annotations.length,
      confirmedFalsePositives,
      confirmedFalseNegatives,
      records: annotations,
    },
    passed: report.passed,
  };

  return crossProductReportSchema.parse(result);
}

export function validateCrossProjectComparison(
  baseReport: PortfolioBenchmarkReport,
  candidateReport: PortfolioBenchmarkReport,
): CrossProjectComparisonValidation {
  const errors: string[] = [];

  if (baseReport.toolVersion !== candidateReport.toolVersion) {
    errors.push(`Tool version mismatch: base uses ${baseReport.toolVersion}, candidate uses ${candidateReport.toolVersion}.`);
  }

  if (baseReport.mode !== candidateReport.mode) {
    errors.push(`Mode mismatch: base uses ${baseReport.mode}, candidate uses ${candidateReport.mode}.`);
  }

  if (baseReport.projects.length !== candidateReport.projects.length) {
    errors.push(`Project count mismatch: base has ${baseReport.projects.length}, candidate has ${candidateReport.projects.length}.`);
  }

  const baseProjects = new Map(baseReport.projects.map((p) => [p.projectId, p]));
  for (const candProj of candidateReport.projects) {
    const baseProj = baseProjects.get(candProj.projectId);
    if (!baseProj) {
      errors.push(`Project missing from baseline: ${candProj.projectId}.`);
      continue;
    }

    const baseViewports = baseProj.stages.flatMap((s) => s.viewports ?? []);
    const candViewports = candProj.stages.flatMap((s) => s.viewports ?? []);
    if (JSON.stringify(baseViewports) !== JSON.stringify(candViewports)) {
      errors.push(`Viewport configuration mismatch for project ${candProj.projectId}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
