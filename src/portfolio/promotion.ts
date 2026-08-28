import type { PortfolioBenchmarkReport, PortfolioProjectRun } from "./runner.js";
import type { PortfolioRegistryInspection, ResolvedPortfolioProject } from "./registry.js";
import {
  promotionReportSchema,
  ruleCandidateSchema,
  rulePromotionEvidenceSchema,
  type HoldoutImpact,
  type PromotionCriteriaEvaluation,
  type PromotionReport,
  type RulePromotionEvidence,
} from "./promotion-schema.js";

const REQUIRED_GATE_IDS: ReadonlySet<string> = new Set([
  "v1-v2",
  "retrieval",
  "corpus",
  "mcp",
  "package",
  "independence",
]);

function exactProjectCoverage(
  report: PortfolioBenchmarkReport | undefined,
  cohort: "development" | "holdout",
  expectedIds: string[],
): boolean {
  if (!report || report.mode !== "cohort" || report.cohort !== cohort) return false;
  const expected = [...expectedIds].sort();
  const declared = [...report.projectIds].sort();
  const retained = report.projects.map((project) => project.projectId).sort();
  return expected.length === declared.length &&
    expected.every((id, index) => id === declared[index]) &&
    expected.every((id, index) => id === retained[index]);
}

function hasRuleFinding(project: PortfolioProjectRun | undefined, reportCode: string): boolean {
  return project?.stages.some((stage) =>
    stage.findingDetails?.some((finding) => finding.id === reportCode),
  ) ?? false;
}

function reportsPreserveSources(...reports: Array<PortfolioBenchmarkReport | undefined>): boolean {
  if (reports.some((report) => !report)) return false;
  return reports.every((report) =>
    report!.summary.sourceMutation === 0 &&
    report!.projects.every((project) => Boolean(project.sourceDigest) && project.status !== "source-mutation"),
  );
}

function fixturesMatch(
  candidate: ReturnType<typeof ruleCandidateSchema.parse>,
  evidence?: RulePromotionEvidence,
): boolean {
  return Boolean(
    evidence &&
    evidence.fixtures.positive.path === candidate.positiveFixturePath &&
    evidence.fixtures.negative.path === candidate.negativeFixturePath &&
    evidence.fixtures.abstention.path === candidate.abstentionPath,
  );
}

export function evaluateRuleCandidate(
  candidateInput: unknown,
  inspection: PortfolioRegistryInspection,
  devReport?: PortfolioBenchmarkReport,
  holdoutReport?: PortfolioBenchmarkReport,
  evidenceInput?: unknown,
  evidenceIntegrityPassed = false,
): PromotionReport {
  const candidate = ruleCandidateSchema.parse(candidateInput);
  const evidenceResult = rulePromotionEvidenceSchema.safeParse(evidenceInput);
  const evidence = evidenceResult.success ? evidenceResult.data : undefined;

  const enabledProjects = inspection.projects.filter((project) => project.declaration.enabled);
  const projectsMap = new Map<string, ResolvedPortfolioProject>(
    enabledProjects.map((project) => [project.declaration.id, project]),
  );
  const developmentIds = enabledProjects
    .filter((project) => project.declaration.cohort === "development")
    .map((project) => project.declaration.id);
  const holdoutProjects = enabledProjects.filter((project) => project.declaration.cohort === "holdout");
  const holdoutIds = holdoutProjects.map((project) => project.declaration.id);

  const developmentCoverage = exactProjectCoverage(devReport, "development", developmentIds);
  const holdoutCoverage = exactProjectCoverage(holdoutReport, "holdout", holdoutIds);
  const reportsShareRegistry = Boolean(
    devReport && holdoutReport &&
    devReport.registryId === holdoutReport.registryId &&
    devReport.registryDigest === holdoutReport.registryDigest &&
    (!inspection.report.registryId || devReport.registryId === inspection.report.registryId),
  );

  const c1_independentAuthoring = candidate.authoredIndependently === true;

  const eligibleAuthoringProjects = candidate.authoringProjects
    .map((projectId) => projectsMap.get(projectId))
    .filter((project): project is ResolvedPortfolioProject =>
      Boolean(project && project.declaration.cohort === "development"),
    );
  const authoringDomains = new Set(
    eligibleAuthoringProjects.map((project) => project.declaration.product.domain),
  );
  const recurrenceFindingsPresent = candidate.authoringProjects.every((projectId) =>
    hasRuleFinding(devReport?.projects.find((project) => project.projectId === projectId), candidate.reportCode),
  );
  const c2_recurrenceOrSafety = candidate.justification.type === "standards-backed-safety"
    ? Boolean(candidate.justification.safetyStandard)
    : candidate.authoringProjects.length >= 3 &&
      eligibleAuthoringProjects.length === candidate.authoringProjects.length &&
      authoringDomains.size >= 2 &&
      developmentCoverage &&
      recurrenceFindingsPresent;

  const c3_positiveNegativeFixtures = evidenceIntegrityPassed && fixturesMatch(candidate, evidence);
  const c4_falsePositiveAnalysis = Boolean(
    evidenceIntegrityPassed && evidence && evidence.fixtures.abstention.path === candidate.abstentionPath,
  );

  const suppliedGateIds: ReadonlySet<string> = new Set(
    evidence?.existingGates.map((gate) => gate.id) ?? [],
  );
  const c5_existingTestsPass = Boolean(
    evidenceIntegrityPassed && evidence &&
    REQUIRED_GATE_IDS.size === suppliedGateIds.size &&
    [...REQUIRED_GATE_IDS].every((id) => suppliedGateIds.has(id)) &&
    evidence.existingGates.every((gate) => gate.passed),
  );

  const suppliedHoldoutIds = new Set(evidence?.holdoutEvaluations.map((evaluation) => evaluation.projectId) ?? []);
  const exactHoldoutEvidence = Boolean(
    evidenceIntegrityPassed && evidence &&
    suppliedHoldoutIds.size === holdoutIds.length &&
    holdoutIds.every((id) => suppliedHoldoutIds.has(id)),
  );
  const holdoutImpact: HoldoutImpact[] = holdoutProjects.map((project) => {
    const retained = holdoutReport?.projects.find(
      (projectRun) => projectRun.projectId === project.declaration.id,
    );
    const evaluation = evidence?.holdoutEvaluations.find(
      (candidateEvaluation) => candidateEvaluation.projectId === project.declaration.id,
    );
    if (!holdoutCoverage || !retained || !exactHoldoutEvidence || !evaluation) {
      return {
        projectId: project.declaration.id,
        status: "unverified",
        details: "No complete holdout-run evidence was retained for this project.",
      };
    }
    if (["unsafe-configuration", "source-mutation"].includes(retained.status)) {
      return {
        projectId: project.declaration.id,
        status: "unverified",
        details: "Unsafe configuration or source mutation invalidated the holdout result.",
      };
    }
    return {
      projectId: project.declaration.id,
      status: evaluation.status,
      details: `Checksummed candidate-specific holdout evidence records ${evaluation.status}.`,
    };
  });

  const c6_holdoutValidationPass = holdoutProjects.length > 0 &&
    holdoutCoverage && reportsShareRegistry &&
    exactHoldoutEvidence &&
    holdoutImpact.some((impact) => ["benefited", "unaffected"].includes(impact.status)) &&
    holdoutImpact.every((impact) => !["regressed", "unverified"].includes(impact.status));
  const c7_sourceUnchanged = developmentCoverage &&
    holdoutCoverage && reportsShareRegistry &&
    reportsPreserveSources(devReport, holdoutReport);

  const criteria: PromotionCriteriaEvaluation = {
    c1_independentAuthoring,
    c2_recurrenceOrSafety,
    c3_positiveNegativeFixtures,
    c4_falsePositiveAnalysis,
    c5_existingTestsPass,
    c6_holdoutValidationPass,
    c7_sourceUnchanged,
  };

  const failureReasons: string[] = [];
  if (!c1_independentAuthoring) failureReasons.push("Candidate rule is not marked as independently authored.");
  if (!c2_recurrenceOrSafety) failureReasons.push("Recurrence or standards-backed safety evidence is incomplete.");
  if (!c3_positiveNegativeFixtures) failureReasons.push("Verified positive and negative fixture evidence is missing or mismatched.");
  if (!c4_falsePositiveAnalysis) failureReasons.push("Verified abstention evidence is missing or mismatched.");
  if (!c5_existingTestsPass) failureReasons.push("Required V1, V2, retrieval, corpus, MCP, package, and independence gate evidence is incomplete or failing.");
  if (!c6_holdoutValidationPass) failureReasons.push("Holdout coverage is incomplete, unverified, or regressed.");
  if (!c7_sourceUnchanged) failureReasons.push("Complete development and holdout source-immutability evidence is missing or failing.");

  const evaluationComplete = Boolean(
    evidenceResult.success && evidenceIntegrityPassed && developmentCoverage && holdoutCoverage &&
    reportsShareRegistry &&
    exactHoldoutEvidence && c7_sourceUnchanged,
  );
  const allPassed = failureReasons.length === 0;
  const result: PromotionReport = {
    version: "1.1.0",
    candidateId: candidate.id,
    title: candidate.title,
    evaluatedAt: new Date().toISOString(),
    decision: allPassed ? "promoted" : "rejected",
    criteria,
    holdoutImpact,
    evaluationComplete,
    ...(failureReasons.length > 0 ? { rejectionReason: failureReasons.join("; ") } : {}),
    ...(allPassed && evidence
      ? {
          promotedArtifacts: {
            documentationPath: evidence.promotedArtifacts.documentation.path,
            testReference: evidence.promotedArtifacts.test.path,
            reportCode: candidate.reportCode,
            migrationGuidance: evidence.promotedArtifacts.migrationGuidance,
          },
        }
      : {}),
    failureReasons,
    passed: allPassed,
  };

  return promotionReportSchema.parse(result);
}
