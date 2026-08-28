import { z } from "zod";

import type {
  ComparisonMethodology,
  ComparisonReport,
  ComparisonReview,
  ComparisonReviewSession,
} from "./schema.js";

const scoreSchema = z
  .object({
    candidate: z.string(),
    score: z.number().min(0).max(4).nullable(),
  })
  .strict();

const categoryAssessmentSchema = z
  .object({
    category: z.string(),
    targetScore: z.number().min(0).max(4).nullable(),
    minimumScore: z.number().min(0).max(4),
    comparatorScores: z.array(scoreSchema),
    passed: z.boolean(),
  })
  .strict();

const maintainerFindingSchema = z
  .object({
    ruleId: z.string(),
    severity: z.enum(["blocker", "warning", "info"]),
    message: z.string(),
  })
  .strict();

export const maintainerAssessmentSchema = z
  .object({
    version: z.literal("1.0.0"),
    track: z.literal("solo-maintainer"),
    generatedAt: z.string(),
    methodologyId: z.string(),
    reviewId: z.string(),
    targetCandidate: z.string(),
    engineeringReady: z.boolean(),
    externalReleaseReady: z.boolean(),
    externalValidationPending: z.boolean(),
    claimScope: z.literal("engineering-continuation-only"),
    maintainerSessions: z
      .object({
        supplied: z.number().int().nonnegative(),
        eligible: z.number().int().nonnegative(),
        sessionIds: z.array(z.string()),
      })
      .strict(),
    targetStages: z.array(
      z
        .object({
          id: z.string(),
          status: z.string(),
          passed: z.boolean(),
        })
        .strict(),
    ),
    categories: z.array(categoryAssessmentSchema),
    findings: z.array(maintainerFindingSchema),
    limitations: z.array(z.string()),
  })
  .strict();

export type MaintainerAssessment = z.infer<typeof maintainerAssessmentSchema>;

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function isDisclosedMaintainerSession(session: ComparisonReviewSession): boolean {
  return session.level === "human-expert"
    && session.origin === "reviewer-supplied"
    && Boolean(session.contributor)
    && Boolean(session.recordedAt)
    && Boolean(session.blinding)
    && (
      session.blinding!.priorCandidateExposure
      || !session.blinding!.candidateIdentitiesWithheld
      || session.blinding!.conflicts.length > 0
    );
}

function hasCompleteExpertMatrix(
  session: ComparisonReviewSession,
  methodology: ComparisonMethodology,
): boolean {
  const expertCriteria = methodology.rubric.categories.flatMap((category) =>
    category.criteria
      .filter((criterion) => criterion.evidenceLevel === "human-expert")
      .map((criterion) => criterion.id),
  );
  const actual = new Set(session.ratings.map((rating) => `${rating.candidate}:${rating.criterion}`));
  return methodology.candidates.every((candidate) =>
    expertCriteria.every((criterion) => actual.has(`${candidate.id}:${criterion}`)),
  );
}

function scoreCategory(
  sessions: ComparisonReviewSession[],
  methodology: ComparisonMethodology,
  categoryId: string,
  candidateId: string,
): number | null {
  const category = methodology.rubric.categories.find((entry) => entry.id === categoryId);
  if (!category) return null;
  const expertCriteria = new Set(
    category.criteria
      .filter((criterion) => criterion.evidenceLevel === "human-expert")
      .map((criterion) => criterion.id),
  );
  return mean(
    sessions.flatMap((session) =>
      session.ratings
        .filter((rating) => rating.candidate === candidateId && expertCriteria.has(rating.criterion))
        .map((rating) => rating.score),
    ),
  );
}

export function assessSoloMaintainerTrack(
  methodology: ComparisonMethodology,
  review: ComparisonReview,
  comparisonReport: ComparisonReport,
): MaintainerAssessment {
  const findings: MaintainerAssessment["findings"] = [];
  const benchmark = methodology.decision.benchmark;
  const targetCandidate = benchmark?.targetCandidate
    ?? methodology.decision.requiredStageCandidates?.[0]
    ?? methodology.candidates[0]!.id;
  const comparatorCandidates = benchmark?.comparatorCandidates ?? [];
  const requiredCategories = benchmark?.requiredCategoryIds
    ?? methodology.rubric.categories.map((category) => category.id);

  const suppliedMaintainerSessions = review.sessions.filter(isDisclosedMaintainerSession);
  const eligibleMaintainerSessions = suppliedMaintainerSessions.filter((session) =>
    hasCompleteExpertMatrix(session, methodology),
  );

  if (suppliedMaintainerSessions.length === 0) {
    findings.push({
      ruleId: "ZTDE-MNT-001",
      severity: "blocker",
      message: "No attributed human-expert session explicitly discloses maintainer exposure or conflicts.",
    });
  } else if (eligibleMaintainerSessions.length === 0) {
    findings.push({
      ruleId: "ZTDE-MNT-002",
      severity: "blocker",
      message: "The disclosed maintainer review does not score every human-expert criterion for every candidate.",
    });
  }

  if (!comparisonReport.passed) {
    findings.push({
      ruleId: "ZTDE-MNT-003",
      severity: "blocker",
      message: "The underlying comparison contains integrity errors.",
    });
  }

  const targetStages = comparisonReport.stageResults
    .filter((stage) => stage.candidate === targetCandidate && stage.required)
    .map((stage) => ({ id: stage.id, status: stage.status, passed: stage.status === "pass" }));
  if (targetStages.length === 0 || targetStages.some((stage) => !stage.passed)) {
    findings.push({
      ruleId: "ZTDE-MNT-004",
      severity: "blocker",
      message: "One or more required automated target stages are missing or not passing.",
    });
  }

  const categories = requiredCategories.map((category) => {
    const targetScore = scoreCategory(
      eligibleMaintainerSessions,
      methodology,
      category,
      targetCandidate,
    );
    const comparatorScores = comparatorCandidates.map((candidate) => ({
      candidate,
      score: scoreCategory(eligibleMaintainerSessions, methodology, category, candidate),
    }));
    const passed = targetScore !== null
      && targetScore >= methodology.decision.minimumCategoryScore
      && comparatorScores.every((entry) => entry.score !== null && targetScore >= entry.score);
    if (!passed) {
      findings.push({
        ruleId: "ZTDE-MNT-005",
        severity: "blocker",
        message: `Maintainer-scored category ${category} is missing, below the configured floor, or below a comparator.`,
      });
    }
    return {
      category,
      targetScore,
      minimumScore: methodology.decision.minimumCategoryScore,
      comparatorScores,
      passed,
    };
  });

  if (!comparisonReport.releaseReady) {
    findings.push({
      ruleId: "ZTDE-MNT-101",
      severity: "warning",
      message: "Independent human-expert and representative-user validation remains incomplete.",
    });
  }
  findings.push({
    ruleId: "ZTDE-MNT-102",
    severity: "info",
    message: "Maintainer evidence may authorize continued engineering but cannot establish independent preference, representative-user comprehension, or external release approval.",
  });

  const engineeringReady = findings.every((finding) => finding.severity !== "blocker");
  return maintainerAssessmentSchema.parse({
    version: "1.0.0",
    track: "solo-maintainer",
    generatedAt: new Date().toISOString(),
    methodologyId: methodology.id,
    reviewId: review.id,
    targetCandidate,
    engineeringReady,
    externalReleaseReady: comparisonReport.releaseReady,
    externalValidationPending: !comparisonReport.releaseReady,
    claimScope: "engineering-continuation-only",
    maintainerSessions: {
      supplied: suppliedMaintainerSessions.length,
      eligible: eligibleMaintainerSessions.length,
      sessionIds: eligibleMaintainerSessions.map((session) => session.id),
    },
    targetStages,
    categories,
    findings,
    limitations: [
      "The maintainer knows candidate identities and has prior exposure to the target implementation.",
      "This track contains no representative-user task evidence.",
      "Engineering readiness is not external release readiness and must not be described as independent validation.",
    ],
  });
}

export function formatMaintainerAssessment(assessment: MaintainerAssessment): string {
  const lines = [
    "# Solo-Maintainer Assessment",
    "",
    `- Engineering ready: ${assessment.engineeringReady ? "YES" : "NO"}`,
    `- External release ready: ${assessment.externalReleaseReady ? "YES" : "NO"}`,
    `- External validation pending: ${assessment.externalValidationPending ? "YES" : "NO"}`,
    `- Claim scope: \`${assessment.claimScope}\``,
    `- Eligible maintainer sessions: ${assessment.maintainerSessions.eligible}`,
    "",
    "## Category Checks",
    "",
    ...assessment.categories.map((category) => {
      const comparators = category.comparatorScores
        .map((entry) => `${entry.candidate}=${entry.score === null ? "missing" : entry.score.toFixed(2)}`)
        .join(", ");
      return `- \`${category.category}\`: target=${category.targetScore === null ? "missing" : category.targetScore.toFixed(2)}, minimum=${category.minimumScore.toFixed(2)}, comparators=${comparators || "none"}, ${category.passed ? "PASS" : "BLOCK"}`;
    }),
    "",
    "## Evidence Boundary",
    "",
    ...assessment.limitations.map((limitation) => `- ${limitation}`),
  ];
  return lines.join("\n");
}
