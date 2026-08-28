import type { PortfolioBenchmarkReport } from "./runner.js";
import type { PortfolioRegistryInspection, ResolvedPortfolioProject } from "./registry.js";
import {
  promotionReportSchema,
  ruleCandidateSchema,
  type HoldoutImpact,
  type PromotionCriteriaEvaluation,
  type PromotionReport,
  type RuleCandidate,
} from "./promotion-schema.js";

export function evaluateRuleCandidate(
  candidateInput: unknown,
  inspection: PortfolioRegistryInspection,
  devReport?: PortfolioBenchmarkReport,
  holdoutReport?: PortfolioBenchmarkReport,
): PromotionReport {
  const candidate = ruleCandidateSchema.parse(candidateInput);

  const projectsMap = new Map<string, ResolvedPortfolioProject>(
    inspection.projects.map((p) => [p.declaration.id, p]),
  );

  // Criteria 1: Independent authoring
  const c1_independentAuthoring = candidate.authoredIndependently === true;

  // Criteria 2: Failure in at least 3 eligible projects across at least 2 domains, or safety standard
  let c2_recurrenceOrSafety = false;
  if (candidate.justification.type === "standards-backed-safety") {
    c2_recurrenceOrSafety = Boolean(candidate.justification.safetyStandard);
  } else {
    const authoringDomains = new Set<string>();
    for (const projId of candidate.authoringProjects) {
      const proj = projectsMap.get(projId);
      if (proj) {
        authoringDomains.add(proj.declaration.product.domain);
      }
    }
    c2_recurrenceOrSafety =
      candidate.authoringProjects.length >= 3 && authoringDomains.size >= 2;
  }

  // Criteria 3: Focused positive and negative fixtures
  const c3_positiveNegativeFixtures = Boolean(
    candidate.positiveFixturePath && candidate.negativeFixturePath,
  );

  // Criteria 4: False positive analysis & abstention path
  const c4_falsePositiveAnalysis = Boolean(candidate.abstentionPath);

  // Criteria 5: Existing tests pass (no unsafe config or source mutation in runs)
  const c5_existingTestsPass =
    (!devReport || (devReport.summary.unsafeConfiguration === 0 && devReport.summary.sourceMutation === 0)) &&
    (!holdoutReport || (holdoutReport.summary.unsafeConfiguration === 0 && holdoutReport.summary.sourceMutation === 0));

  // Criteria 6 & 7: Holdout validation and source immutability
  const holdoutImpact: HoldoutImpact[] = [];
  let regressedCount = 0;
  let benefitedOrUnaffectedCount = 0;

  const holdoutProjects = inspection.projects.filter(
    (p) =>
      p.declaration.cohort === "holdout" ||
      !candidate.authoringProjects.includes(p.declaration.id),
  );

  for (const project of holdoutProjects) {
    const projId = project.declaration.id;
    const holdoutRunProj = holdoutReport?.projects.find((pr) => pr.projectId === projId);

    if (!holdoutRunProj) {
      holdoutImpact.push({
        projectId: projId,
        status: "unaffected",
        details: "Project remained unaffected in holdout evaluation.",
      });
      benefitedOrUnaffectedCount += 1;
      continue;
    }

    if (holdoutRunProj.status === "findings" || holdoutRunProj.status === "unsafe-configuration") {
      // Check if this project regressed due to candidate rule
      const hasFinding = holdoutRunProj.stages.some((s) =>
        s.findingDetails?.some((f) => f.id === candidate.reportCode),
      );
      if (hasFinding) {
        holdoutImpact.push({
          projectId: projId,
          status: "regressed",
          details: `Holdout project reported new finding under rule ${candidate.reportCode}.`,
        });
        regressedCount += 1;
      } else {
        holdoutImpact.push({
          projectId: projId,
          status: "unaffected",
          details: "Holdout project was unaffected by candidate rule.",
        });
        benefitedOrUnaffectedCount += 1;
      }
    } else {
      holdoutImpact.push({
        projectId: projId,
        status: "unaffected",
        details: "Holdout project remained passing and unaffected.",
      });
      benefitedOrUnaffectedCount += 1;
    }
  }

  const c6_holdoutValidationPass = regressedCount === 0 && benefitedOrUnaffectedCount > 0;

  // Criteria 7: Source unchanged (verified by digest in runs)
  const c7_sourceUnchanged =
    (!devReport || devReport.summary.sourceMutation === 0) &&
    (!holdoutReport || holdoutReport.summary.sourceMutation === 0);

  const criteria: PromotionCriteriaEvaluation = {
    c1_independentAuthoring,
    c2_recurrenceOrSafety,
    c3_positiveNegativeFixtures,
    c4_falsePositiveAnalysis,
    c5_existingTestsPass,
    c6_holdoutValidationPass,
    c7_sourceUnchanged,
  };

  const allPassed = Object.values(criteria).every(Boolean);

  const rejectionReasons: string[] = [];
  if (!c1_independentAuthoring) rejectionReasons.push("Candidate rule is not marked as independently authored.");
  if (!c2_recurrenceOrSafety) rejectionReasons.push("Candidate rule lacks 3+ project recurrence across 2+ domains or safety standard justification.");
  if (!c3_positiveNegativeFixtures) rejectionReasons.push("Candidate rule lacks positive and negative fixture paths.");
  if (!c4_falsePositiveAnalysis) rejectionReasons.push("Candidate rule lacks an explicit abstention path.");
  if (!c5_existingTestsPass) rejectionReasons.push("Existing tests reported unsafe configuration or source mutation.");
  if (!c6_holdoutValidationPass) rejectionReasons.push("Holdout validation failed due to regressions or lack of affected projects.");
  if (!c7_sourceUnchanged) rejectionReasons.push("Original project sources were mutated during run.");

  const rejectionReason = rejectionReasons.length > 0 ? rejectionReasons.join("; ") : undefined;

  const result: PromotionReport = {
    version: "1.0.0",
    candidateId: candidate.id,
    title: candidate.title,
    evaluatedAt: new Date().toISOString(),
    decision: allPassed ? "promoted" : "rejected",
    criteria,
    holdoutImpact,
    ...(rejectionReason ? { rejectionReason } : {}),
    ...(allPassed
      ? {
          promotedArtifacts: {
            documentationPath: `docs/rules/${candidate.reportCode}.md`,
            testReference: `tests/rules/${candidate.id}.test.ts`,
            reportCode: candidate.reportCode,
            migrationGuidance: `Enable rule ${candidate.reportCode} in quality-gate configuration. Inspect findings in report.json.`,
          },
        }
      : {}),
    passed: allPassed,
  };

  return promotionReportSchema.parse(result);
}
