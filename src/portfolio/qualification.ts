import type { PortfolioBenchmarkReport, PortfolioProjectRun } from "./runner.js";
import type { PortfolioRegistryInspection } from "./registry.js";
import {
  qualificationEvidenceSchema,
  v3QualificationReportSchema,
  type CiFixtureCategoryStatus,
  type QualificationEvidence,
  type V3QualificationReport,
  type V3QualificationTargets,
} from "./qualification-schema.js";

const PROHIBITED_CLAIM_PATTERNS = [
  /independent\s+human\s+validation/i,
  /representative[- ]user\s+validation/i,
  /universal\s+design\s+quality/i,
  /superiority\s+over\s+(?:every|all)\s+external\s+tools?/i,
];

function exactCohortCoverage(
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

function passedStage(project: PortfolioProjectRun, stage: string): boolean {
  return project.stages.some((result) => result.stage === stage && result.status === "passed");
}

function benchmarkPathCoverage(projects: PortfolioProjectRun[]) {
  return {
    sourceOnly: projects.some((project) =>
      project.adapter === "python-source" && passedStage(project, "source-audit"),
    ),
    browserOnly: projects.some((project) =>
      ["react-vite", "nextjs", "angular", "static-web"].includes(project.adapter ?? "") &&
      passedStage(project, "browser-journeys"),
    ),
    fullStack: projects.some((project) =>
      project.adapter === "node-python-fullstack" &&
      passedStage(project, "source-audit") &&
      ["typecheck", "lint", "unit-test", "production-build", "browser-journeys", "export-verification"]
        .some((stage) => passedStage(project, stage)),
    ),
  };
}

function allReleaseGatesPass(evidence?: QualificationEvidence): boolean {
  return Boolean(evidence && Object.values(evidence.releaseGates).every((gate) => gate.passed));
}

export function evaluateV3Qualification(
  inspection: PortfolioRegistryInspection,
  devReport?: PortfolioBenchmarkReport,
  holdoutReport?: PortfolioBenchmarkReport,
  evidenceInput?: unknown,
  evidenceIntegrityPassed = false,
  customClaims: string[] = [],
): V3QualificationReport {
  const evidenceResult = qualificationEvidenceSchema.safeParse(evidenceInput);
  const evidence = evidenceResult.success ? evidenceResult.data : undefined;
  const enabledProjects = inspection.projects.filter((project) => project.declaration.enabled);
  const developmentIds = enabledProjects
    .filter((project) => project.declaration.cohort === "development")
    .map((project) => project.declaration.id);
  const holdoutIds = enabledProjects
    .filter((project) => project.declaration.cohort === "holdout")
    .map((project) => project.declaration.id);

  const developmentCoverage = exactCohortCoverage(devReport, "development", developmentIds);
  const holdoutCoverage = exactCohortCoverage(holdoutReport, "holdout", holdoutIds);
  const reportsShareRegistry = Boolean(
    devReport && holdoutReport &&
    devReport.registryId === holdoutReport.registryId &&
    devReport.registryDigest === holdoutReport.registryDigest &&
    (!inspection.report.registryId || devReport.registryId === inspection.report.registryId),
  );
  const cohortReportsComplete = developmentCoverage && holdoutCoverage && reportsShareRegistry;
  const retainedProjects = cohortReportsComplete
    ? [...devReport!.projects, ...holdoutReport!.projects]
    : [];

  const domains = new Set(enabledProjects.map((project) => project.declaration.product.domain));
  const stacks = new Set(enabledProjects.map((project) => project.declaration.technology.framework));
  const archetypes = new Set(enabledProjects.map((project) => project.declaration.product.archetype));
  const observedPathTypes = benchmarkPathCoverage(retainedProjects);
  const pathTypes = {
    sourceOnly: observedPathTypes.sourceOnly,
    browserOnly: observedPathTypes.browserOnly || Boolean(
      evidenceIntegrityPassed && evidence?.benchmarkPaths.browserOnly.passed,
    ),
    fullStack: observedPathTypes.fullStack || Boolean(
      evidenceIntegrityPassed && evidence?.benchmarkPaths.fullStack.passed,
    ),
  };
  const sourceMutationViolations =
    (devReport?.summary.sourceMutation ?? 0) + (holdoutReport?.summary.sourceMutation ?? 0);
  const privateLeakageViolations = evidenceIntegrityPassed && evidence?.privateLeakageScan.passed ? 0 : 1;
  const existingGatesPassing = evidenceIntegrityPassed && inspection.report.passed && allReleaseGatesPass(evidence);

  const targets: V3QualificationTargets = {
    eligibleProjectsCount: enabledProjects.length,
    productDomainsCount: domains.size,
    frontendStacksCount: stacks.size,
    interfaceArchetypesCount: archetypes.size,
    lockedHoldoutProjectsCount: holdoutIds.length,
    pathTypes,
    sourceMutationViolations,
    privateLeakageViolations,
    existingGatesPassing,
  };

  const ciFixtures: CiFixtureCategoryStatus = {
    registryViolations: evidence?.ciFixtures.registryViolations.passed ?? false,
    snapshotViolations: evidence?.ciFixtures.snapshotViolations.passed ?? false,
    adapterCases: evidence?.ciFixtures.adapterCases.passed ?? false,
    comparisonSafety: evidence?.ciFixtures.comparisonSafety.passed ?? false,
    privacyBoundaries: evidence?.ciFixtures.privacyBoundaries.passed ?? false,
    rulePromotionPaths: evidence?.ciFixtures.rulePromotionPaths.passed ?? false,
  };

  const allClaims = [...(evidence?.claims ?? []), ...customClaims];
  const disallowedClaimsDetected = allClaims.filter((claim) =>
    PROHIBITED_CLAIM_PATTERNS.some((pattern) => pattern.test(claim)),
  );
  const disallowedClaimsExcluded = disallowedClaimsDetected.length === 0;

  const sourceRootsUnchanged = cohortReportsComplete &&
    sourceMutationViolations === 0 &&
    retainedProjects.every((project) => Boolean(project.sourceDigest) && project.status !== "source-mutation");
  const privateDistributionClean = Boolean(
    evidenceIntegrityPassed &&
    evidence?.privateLeakageScan.passed &&
    evidence.releaseGates.packageCheck.passed &&
    evidence.releaseGates.packageSmoke.passed &&
    evidence.releaseGates.independence.passed &&
    evidence.releaseGates.offlineRelease.passed &&
    evidence.releaseGates.archiveRemoval.passed,
  );
  const promotionIds = new Set(evidence?.promotionReports.map((report) => report.candidateId) ?? []);
  const rulePromotionEvidence = Boolean(
    evidenceIntegrityPassed && evidence &&
    evidence.promotionReports.length >= 3 &&
    promotionIds.size === evidence.promotionReports.length &&
    evidence.promotionReports.every((report) => report.evaluationComplete),
  );

  const criteria = {
    evidenceIntegrity: evidenceIntegrityPassed,
    eligibleProjects: targets.eligibleProjectsCount >= 12,
    productDomains: targets.productDomainsCount >= 5,
    frontendStacks: targets.frontendStacksCount >= 3,
    interfaceArchetypes: targets.interfaceArchetypesCount >= 4,
    lockedHoldouts: targets.lockedHoldoutProjectsCount >= 3,
    benchmarkPaths: pathTypes.sourceOnly && pathTypes.browserOnly && pathTypes.fullStack,
    cohortReportsComplete,
    sourceRootsUnchanged,
    privateDistributionClean,
    existingGates: existingGatesPassing,
    ciFixtures: Object.values(ciFixtures).every(Boolean),
    rulePromotionEvidence,
    claimBoundary: disallowedClaimsExcluded,
  };

  const supportedClaims: string[] = [];
  if (sourceRootsUnchanged) {
    supportedClaims.push("The benchmark runner operated non-destructively on the declared corpus.");
  }
  if (
    criteria.eligibleProjects &&
    criteria.productDomains &&
    criteria.frontendStacks &&
    criteria.interfaceArchetypes &&
    criteria.benchmarkPaths
  ) {
    supportedClaims.push("The quality system produced evidence across the declared stacks and domains.");
  }
  if (rulePromotionEvidence && holdoutCoverage) {
    supportedClaims.push("Rule candidates completed their declared fixture and locked holdout evaluations.");
  }
  if (privateDistributionClean) {
    supportedClaims.push("Private source and evidence were excluded from distribution.");
  }

  const failureReasons = Object.entries(criteria)
    .filter(([, passed]) => !passed)
    .map(([criterion]) => `V3 qualification criterion failed: ${criterion}.`);
  if (!evidenceResult.success) {
    failureReasons.unshift("V3 qualification evidence is missing or invalid.");
  }

  const result: V3QualificationReport = {
    version: "1.1.0",
    qualifiedAt: new Date().toISOString(),
    targets,
    ciFixtures,
    disallowedClaimsExcluded,
    supportedClaims,
    disallowedClaimsDetected,
    criteria,
    failureReasons,
    passed: failureReasons.length === 0,
  };

  return v3QualificationReportSchema.parse(result);
}
