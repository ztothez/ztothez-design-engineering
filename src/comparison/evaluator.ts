import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import type {
  ComparisonEvidenceLevel,
  ComparisonFinding,
  ComparisonMethodology,
  ComparisonReport,
  ComparisonReview,
} from "./schema.js";

const REPORT_VERSION = "1.1.0";

function contained(base: string, candidate: string): boolean {
  const relation = relative(base, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

function addFinding(
  findings: ComparisonFinding[],
  ruleId: string,
  severity: ComparisonFinding["severity"],
  path: string,
  message: string,
  remediation: string,
): void {
  findings.push({ ruleId, severity, path, message, remediation });
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function countEvidenceLevels(review: ComparisonReview): Record<ComparisonEvidenceLevel, number> {
  const counts: Record<ComparisonEvidenceLevel, number> = {
    automated: 0,
    "ai-assisted-expert": 0,
    "human-expert": 0,
    "representative-user": 0,
  };
  for (const claim of review.claims) counts[claim.evidenceType] += 1;
  for (const session of review.sessions) counts[session.level] += 1;
  return counts;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export async function evaluateInterfaceComparison(
  methodology: ComparisonMethodology,
  review: ComparisonReview,
  methodologyPath: string,
  reviewPath: string,
): Promise<ComparisonReport> {
  const findings: ComparisonFinding[] = [];
  const candidateIds = new Set(methodology.candidates.map((entry) => entry.id));
  const viewportDefinitions = new Map(methodology.viewports.map((entry) => [entry.id, entry]));
  const stateIds = new Set(methodology.states.map((entry) => entry.id));
  const taskIds = new Set(methodology.tasks.map((entry) => entry.id));
  const criterionIds = new Set(
    methodology.rubric.categories.flatMap((category) =>
      category.criteria.map((criterion) => criterion.id),
    ),
  );
  const criterionDefinitions = new Map(
    methodology.rubric.categories.flatMap((category) =>
      category.criteria.map((criterion) => [criterion.id, criterion] as const),
    ),
  );
  const criteriaByLevel = {
    "human-expert": methodology.rubric.categories.flatMap((category) =>
      category.criteria.filter((criterion) => criterion.evidenceLevel === "human-expert"),
    ),
    "representative-user": methodology.rubric.categories.flatMap((category) =>
      category.criteria.filter((criterion) => criterion.evidenceLevel === "representative-user"),
    ),
  };
  const stageDefinitions = new Map(methodology.stages.map((stage) => [stage.id, stage]));
  const artifacts = new Map(review.artifacts.map((artifact) => [artifact.id, artifact]));
  const sessions = new Map(review.sessions.map((session) => [session.id, session]));

  if (review.methodologyId !== methodology.id) {
    addFinding(
      findings,
      "ZTDE-CMP-001",
      "error",
      "methodologyId",
      `Review references ${review.methodologyId}, but the loaded methodology is ${methodology.id}.`,
      "Load the matching methodology or correct the review reference.",
    );
  }

  const duplicateGroups: Array<[string, string[]]> = [
    ["candidates", review.candidates],
    ["artifacts", review.artifacts.map((entry) => entry.id)],
    ["stages", review.stages.map((entry) => `${entry.candidate}:${entry.id}`)],
    ["sessions", review.sessions.map((entry) => entry.id)],
    ["claims", review.claims.map((entry) => entry.id)],
  ];
  for (const [path, values] of duplicateGroups) {
    for (const duplicate of duplicateValues(values)) {
      addFinding(
        findings,
        "ZTDE-CMP-002",
        "error",
        path,
        `Duplicate identifier: ${duplicate}.`,
        "Give every record a stable unique identifier.",
      );
    }
  }

  for (const [index, candidate] of review.candidates.entries()) {
    if (!candidateIds.has(candidate)) {
      addFinding(
        findings,
        "ZTDE-CMP-003",
        "error",
        `candidates[${index}]`,
        `Unknown candidate: ${candidate}.`,
        "Use only anonymized candidates declared by the methodology.",
      );
    }
  }
  for (const candidate of candidateIds) {
    if (!review.candidates.includes(candidate)) {
      addFinding(
        findings,
        "ZTDE-CMP-004",
        "error",
        "candidates",
        `Methodology candidate ${candidate} is missing from the review.`,
        "Evaluate every declared candidate under the same method.",
      );
    }
  }

  const reviewDirectory = dirname(resolve(reviewPath));
  const retainedArtifacts = new Set<string>();
  for (const [index, artifact] of review.artifacts.entries()) {
    const definition = stageDefinitions.get(artifact.stage);
    const validSubject = artifact.candidate === "comparison" || candidateIds.has(artifact.candidate);
    if (!validSubject) {
      addFinding(findings, "ZTDE-CMP-003", "error", `artifacts[${index}].candidate`, `Artifact ${artifact.id} references unknown candidate ${artifact.candidate}.`, "Use a candidate declared by the methodology or comparison for shared evidence.");
    }
    if (!definition) {
      addFinding(findings, "ZTDE-CMP-101", "error", `artifacts[${index}].stage`, `Artifact ${artifact.id} references unknown stage ${artifact.stage}.`, "Use a stage declared by the methodology.");
    } else if ((definition.scope === "comparison") !== (artifact.candidate === "comparison")) {
      addFinding(findings, "ZTDE-CMP-104", "error", `artifacts[${index}].candidate`, `Artifact ${artifact.id} subject ${artifact.candidate} conflicts with ${definition.scope} stage ${definition.id}.`, "Use comparison only for shared stages and an anonymized candidate for candidate-scoped stages.");
    }
    if (artifact.capture) {
      const viewport = viewportDefinitions.get(artifact.capture.viewport);
      if (!viewport) {
        addFinding(findings, "ZTDE-CMP-311", "error", `artifacts[${index}].capture.viewport`, `Screenshot ${artifact.id} references unknown viewport ${artifact.capture.viewport}.`, "Use a viewport declared by the methodology.");
      } else if (viewport.width !== artifact.capture.width || viewport.height !== artifact.capture.height) {
        addFinding(findings, "ZTDE-CMP-312", "error", `artifacts[${index}].capture`, `Screenshot ${artifact.id} dimensions ${artifact.capture.width}x${artifact.capture.height} do not match ${viewport.id} at ${viewport.width}x${viewport.height}.`, "Record the actual declared viewport dimensions or recapture the image.");
      }
      if (!stateIds.has(artifact.capture.state)) {
        addFinding(findings, "ZTDE-CMP-311", "error", `artifacts[${index}].capture.state`, `Screenshot ${artifact.id} references unknown state ${artifact.capture.state}.`, "Use a state declared by the methodology.");
      }
    }
    if (!artifact.retained) continue;
    if (isAbsolute(artifact.path)) {
      addFinding(
        findings,
        "ZTDE-CMP-301",
        "error",
        `artifacts[${index}].path`,
        `Retained artifact ${artifact.id} uses an absolute path.`,
        "Store evidence with the review and use a relative path.",
      );
      continue;
    }
    const artifactPath = resolve(reviewDirectory, artifact.path);
    if (!contained(reviewDirectory, artifactPath)) {
      addFinding(
        findings,
        "ZTDE-CMP-301",
        "error",
        `artifacts[${index}].path`,
        `Artifact ${artifact.id} resolves outside the review directory.`,
        "Keep comparison evidence within the review evidence directory.",
      );
      continue;
    }
    try {
      const content = await readFile(artifactPath);
      const digest = createHash("sha256").update(content).digest("hex");
      if (digest !== artifact.sha256) {
        addFinding(
          findings,
          "ZTDE-CMP-313",
          "error",
          `artifacts[${index}].sha256`,
          `Artifact ${artifact.id} checksum does not match the retained file.`,
          "Recalculate the checksum from the retained artifact or restore the recorded evidence.",
        );
      } else {
        retainedArtifacts.add(artifact.id);
      }
    } catch {
      addFinding(
        findings,
        "ZTDE-CMP-302",
        "error",
        `artifacts[${index}].path`,
        `Retained artifact ${artifact.id} does not exist at ${artifact.path}.`,
        "Retain the referenced artifact before treating a claim as evidenced.",
      );
    }
  }

  const expectedStages = methodology.stages.flatMap((stage) =>
    stage.scope === "candidate"
      ? methodology.candidates.map((candidate) => ({ stage, candidate: candidate.id }))
      : [{ stage, candidate: "comparison" }],
  );
  const stageResults = expectedStages.map(({ stage, candidate }) => {
    const result = review.stages.find(
      (entry) => entry.id === stage.id && entry.candidate === candidate,
    );
    const requiredCandidates = methodology.decision.requiredStageCandidates;
    const required = stage.required && (
      stage.scope === "comparison"
      || !requiredCandidates
      || requiredCandidates.includes(candidate)
    );
    return { id: stage.id, candidate, required, status: result?.status ?? "missing" };
  });
  for (const [index, stage] of review.stages.entries()) {
    const definition = stageDefinitions.get(stage.id);
    if (!definition) {
      addFinding(
        findings,
        "ZTDE-CMP-101",
        "error",
        `stages[${index}].id`,
        `Unknown comparison stage: ${stage.id}.`,
        "Use a stage declared by the methodology.",
      );
    } else if ((definition.scope === "comparison") !== (stage.candidate === "comparison")) {
      addFinding(findings, "ZTDE-CMP-104", "error", `stages[${index}].candidate`, `Stage ${stage.id} subject ${stage.candidate} conflicts with its ${definition.scope} scope.`, "Use comparison for shared stages and an anonymized candidate for candidate-scoped stages.");
    } else if (stage.candidate !== "comparison" && !candidateIds.has(stage.candidate)) {
      addFinding(findings, "ZTDE-CMP-003", "error", `stages[${index}].candidate`, `Stage ${stage.id} references unknown candidate ${stage.candidate}.`, "Use a candidate declared by the methodology.");
    }
    for (const reference of stage.evidenceRefs) {
      if (!artifacts.has(reference)) {
        addFinding(
          findings,
          "ZTDE-CMP-303",
          "error",
          `stages[${index}].evidenceRefs`,
          `Stage ${stage.id} references missing artifact ${reference}.`,
          "Add the artifact record or correct the evidence reference.",
        );
      }
    }
    if (stage.status === "pass" && !stage.evidenceRefs.some((id) => retainedArtifacts.has(id))) {
      addFinding(
        findings,
        "ZTDE-CMP-304",
        "error",
        `stages[${index}]`,
        `Passing stage ${stage.id} has no retained evidence artifact.`,
        "Retain machine-readable or reviewer-supplied evidence for the passing stage.",
      );
    }
    if (
      stage.status === "pass" &&
      definition &&
      !stage.evidenceRefs.some((id) => {
        const artifact = artifacts.get(id);
        return artifact &&
          retainedArtifacts.has(id) &&
          artifact.candidate === stage.candidate &&
          artifact.stage === stage.id &&
          definition.evidenceKinds.includes(artifact.kind);
      })
    ) {
      addFinding(
        findings,
        "ZTDE-CMP-305",
        "error",
        `stages[${index}].evidenceRefs`,
        `Passing stage ${stage.id} lacks a retained artifact of an accepted kind: ${definition.evidenceKinds.join(", ")}.`,
        "Attach retained evidence whose type matches the methodology stage contract.",
      );
    }
  }
  for (const stage of stageResults.filter((entry) => entry.required && entry.status !== "pass")) {
    addFinding(
      findings,
      "ZTDE-CMP-102",
      "warning",
      `stages.${stage.candidate}.${stage.id}`,
      `Required stage ${stage.id} for ${stage.candidate} is ${stage.status}.`,
      "Complete and evidence the required stage before a release decision.",
    );
  }

  const completeSessions = new Map<string, boolean>();
  for (const [index, session] of review.sessions.entries()) {
    const humanLevel = session.level === "human-expert" || session.level === "representative-user";
    if (humanLevel && session.origin !== "reviewer-supplied") {
      addFinding(
        findings,
        "ZTDE-CMP-201",
        "error",
        `sessions[${index}].origin`,
        `${session.level} evidence is marked ${session.origin}.`,
        "Remove the claim or record evidence supplied by the actual reviewer or participant.",
      );
    }
    if (humanLevel && (!session.contributor || !session.recordedAt)) {
      addFinding(
        findings,
        "ZTDE-CMP-202",
        "error",
        `sessions[${index}]`,
        `${session.level} evidence lacks contributor or recordedAt metadata.`,
        "Record attributable reviewer-supplied identity and timestamp metadata.",
      );
    }
    if (session.level === "representative-user" && !session.participantId) {
      addFinding(
        findings,
        "ZTDE-CMP-203",
        "error",
        `sessions[${index}].participantId`,
        "Representative-user evidence lacks a pseudonymous participant identifier.",
        "Record a stable pseudonymous participant identifier without exposing unnecessary personal data.",
      );
    }
    if (session.level === "representative-user" && session.taskResults.length === 0) {
      addFinding(
        findings,
        "ZTDE-CMP-204",
        "error",
        `sessions[${index}].taskResults`,
        "Representative-user evidence contains no task results.",
        "Record observed task outcomes instead of substituting source-code inspection.",
      );
    }
    const orderSet = new Set(session.candidateOrder);
    if (orderSet.size !== candidateIds.size || [...candidateIds].some((id) => !orderSet.has(id))) {
      addFinding(
        findings,
        "ZTDE-CMP-205",
        "error",
        `sessions[${index}].candidateOrder`,
        `Session ${session.id} does not contain every candidate exactly once.`,
        "Record the complete randomized or counterbalanced candidate order.",
      );
    }
    const duplicateTaskResults = duplicateValues(
      session.taskResults.map((result) => `${result.candidate}:${result.task}`),
    );
    for (const duplicate of duplicateTaskResults) {
      addFinding(
        findings,
        "ZTDE-CMP-209",
        "error",
        `sessions[${index}].taskResults`,
        `Session ${session.id} contains duplicate task result ${duplicate}.`,
        "Record one task result per candidate and task within a session.",
      );
    }
    const duplicateRatings = duplicateValues(
      session.ratings.map((rating) => `${rating.candidate}:${rating.criterion}`),
    );
    for (const duplicate of duplicateRatings) {
      addFinding(
        findings,
        "ZTDE-CMP-210",
        "error",
        `sessions[${index}].ratings`,
        `Session ${session.id} contains duplicate rating ${duplicate}.`,
        "Record one rating per candidate and criterion within a session.",
      );
    }
    for (const [resultIndex, result] of session.taskResults.entries()) {
      if (!taskIds.has(result.task)) {
        addFinding(findings, "ZTDE-CMP-206", "error", `sessions[${index}].taskResults[${resultIndex}].task`, `Unknown task: ${result.task}.`, "Use a task declared by the methodology.");
      }
      if (!candidateIds.has(result.candidate)) {
        addFinding(findings, "ZTDE-CMP-206", "error", `sessions[${index}].taskResults[${resultIndex}].candidate`, `Unknown candidate: ${result.candidate}.`, "Use a candidate declared by the methodology.");
      }
    }
    for (const [ratingIndex, rating] of session.ratings.entries()) {
      if (!criterionIds.has(rating.criterion)) {
        addFinding(findings, "ZTDE-CMP-207", "error", `sessions[${index}].ratings[${ratingIndex}].criterion`, `Unknown rubric criterion: ${rating.criterion}.`, "Use a criterion declared by the methodology.");
      }
      if (!candidateIds.has(rating.candidate)) {
        addFinding(findings, "ZTDE-CMP-207", "error", `sessions[${index}].ratings[${ratingIndex}].candidate`, `Unknown candidate: ${rating.candidate}.`, "Use a candidate declared by the methodology.");
      }
      const criterion = criterionDefinitions.get(rating.criterion);
      if (
        humanLevel
        && criterion
        && criterion.evidenceLevel !== session.level
      ) {
        addFinding(
          findings,
          "ZTDE-CMP-211",
          "error",
          `sessions[${index}].ratings[${ratingIndex}].criterion`,
          `Criterion ${rating.criterion} requires ${criterion.evidenceLevel} evidence, not ${session.level}.`,
          "Record the rating in a session at the criterion's declared evidence level.",
        );
      }
    }

    const requirements = methodology.decision.reviewRequirements;
    let complete = true;
    if (requirements && humanLevel && session.origin === "reviewer-supplied") {
      if (
        requirements.requireIdentityBlinding
        && (
          !session.blinding?.candidateIdentitiesWithheld
          || session.blinding.priorCandidateExposure
        )
      ) {
        complete = false;
        addFinding(
          findings,
          "ZTDE-CMP-407",
          "warning",
          `sessions[${index}].blinding`,
          `Session ${session.id} does not establish withheld candidate identities without prior candidate exposure.`,
          "Use a genuinely blinded reviewer or retain the session as disclosed non-blind evidence outside the required anonymous count.",
        );
      }
      const expectedRatings = criteriaByLevel[session.level as "human-expert" | "representative-user"]
        .flatMap((criterion) => [...candidateIds].map((candidate) => `${candidate}:${criterion.id}`));
      const actualRatings = new Set(
        session.ratings.map((rating) => `${rating.candidate}:${rating.criterion}`),
      );
      if (
        requirements.requireCompleteRatingMatrix
        && expectedRatings.some((entry) => !actualRatings.has(entry))
      ) {
        complete = false;
        addFinding(
          findings,
          "ZTDE-CMP-402",
          "warning",
          `sessions[${index}].ratings`,
          `Session ${session.id} does not cover every ${session.level} criterion for every candidate.`,
          "Complete the candidate-by-criterion rating matrix without inferring omitted ratings.",
        );
      }
      if (session.level === "representative-user" && requirements.requireCompleteTaskMatrix) {
        const expectedTasks = methodology.tasks.flatMap((task) =>
          [...candidateIds].map((candidate) => `${candidate}:${task.id}`),
        );
        const actualTasks = new Set(
          session.taskResults.map((result) => `${result.candidate}:${result.task}`),
        );
        if (expectedTasks.some((entry) => !actualTasks.has(entry))) {
          complete = false;
          addFinding(
            findings,
            "ZTDE-CMP-403",
            "warning",
            `sessions[${index}].taskResults`,
            `Session ${session.id} does not cover every task for every candidate.`,
            "Complete the candidate-by-task observation matrix and retain not-run outcomes explicitly.",
          );
        }
      }
    }
    completeSessions.set(session.id, complete);
  }

  const reviewerSessions = review.sessions.filter(
    (session) => session.origin === "reviewer-supplied"
      && (session.level === "human-expert" || session.level === "representative-user"),
  );
  const humanExpertSessions = reviewerSessions.filter((session) => session.level === "human-expert");
  const representativeUserSessions = reviewerSessions.filter(
    (session) => session.level === "representative-user",
  );
  const completeHumanExpertSessions = humanExpertSessions.filter(
    (session) => completeSessions.get(session.id),
  );
  const completeRepresentativeUserSessions = representativeUserSessions.filter(
    (session) => completeSessions.get(session.id),
  );
  const distinctCandidateOrders = new Set(
    reviewerSessions.map((session) => session.candidateOrder.join(",")),
  ).size;
  const blindedReviewerSessions = reviewerSessions.filter(
    (session) => session.blinding?.candidateIdentitiesWithheld
      && !session.blinding.priorCandidateExposure,
  ).length;
  const reviewRequirements = methodology.decision.reviewRequirements;
  let humanRequirementsMet = true;
  if (reviewRequirements) {
    if (completeHumanExpertSessions.length < reviewRequirements.minimumHumanExpertSessions) {
      humanRequirementsMet = false;
      addFinding(
        findings,
        "ZTDE-CMP-404",
        "warning",
        "sessions",
        `Complete human-expert sessions ${completeHumanExpertSessions.length}/${reviewRequirements.minimumHumanExpertSessions}.`,
        "Collect the configured number of complete, attributable human-expert sessions.",
      );
    }
    if (
      completeRepresentativeUserSessions.length
      < reviewRequirements.minimumRepresentativeUserSessions
    ) {
      humanRequirementsMet = false;
      addFinding(
        findings,
        "ZTDE-CMP-404",
        "warning",
        "sessions",
        `Complete representative-user sessions ${completeRepresentativeUserSessions.length}/${reviewRequirements.minimumRepresentativeUserSessions}.`,
        "Collect the configured number of complete, attributable representative-user sessions.",
      );
    }
    if (distinctCandidateOrders < reviewRequirements.minimumCounterbalancedOrders) {
      humanRequirementsMet = false;
      addFinding(
        findings,
        "ZTDE-CMP-406",
        "warning",
        "sessions.candidateOrder",
        `Distinct candidate orders ${distinctCandidateOrders}/${reviewRequirements.minimumCounterbalancedOrders}.`,
        "Assign enough counterbalanced orders to reduce first-position and sequence bias.",
      );
    }
    if (
      completeHumanExpertSessions.length !== humanExpertSessions.length
      || completeRepresentativeUserSessions.length !== representativeUserSessions.length
    ) {
      humanRequirementsMet = false;
    }
  }

  const candidateResults = methodology.candidates.map(({ id: candidate }) => {
    const categories = methodology.rubric.categories.map((category) => {
      const criterionIdsForCategory = new Set(category.criteria.map((criterion) => criterion.id));
      const scores = reviewerSessions.flatMap((session) =>
        session.ratings
          .filter(
            (rating) => rating.candidate === candidate
              && criterionIdsForCategory.has(rating.criterion),
          )
          .map((rating) => rating.score),
      );
      return { category: category.id, score: mean(scores), samples: scores.length };
    });
    const taskResults = representativeUserSessions.flatMap((session) =>
      session.taskResults.filter((result) => result.candidate === candidate),
    );
    const comprehension = taskResults
      .filter((result) => result.comprehensionCorrect !== undefined)
      .map((result) => result.comprehensionCorrect ? 1 : 0);
    return {
      candidate,
      categories,
      tasks: {
        samples: taskResults.length,
        completionRate: taskResults.length === 0
          ? null
          : taskResults.filter((result) => result.outcome === "completed").length / taskResults.length,
        comprehensionAccuracy: mean(comprehension),
        meanDurationSeconds: mean(
          taskResults.flatMap((result) => result.durationSeconds === undefined ? [] : [result.durationSeconds]),
        ),
        meanConfidence: mean(
          taskResults.flatMap((result) => result.confidence === undefined ? [] : [result.confidence]),
        ),
      },
    };
  });

  const benchmark = methodology.decision.benchmark;
  const benchmarkIssues: string[] = [];
  if (benchmark) {
    const target = candidateResults.find((result) => result.candidate === benchmark.targetCandidate);
    for (const comparatorId of benchmark.comparatorCandidates) {
      const comparator = candidateResults.find((result) => result.candidate === comparatorId);
      for (const categoryId of benchmark.requiredCategoryIds) {
        const targetScore = target?.categories.find((entry) => entry.category === categoryId)?.score;
        const comparatorScore = comparator?.categories.find((entry) => entry.category === categoryId)?.score;
        if (targetScore === null || targetScore === undefined) {
          benchmarkIssues.push(`${benchmark.targetCandidate}:${categoryId} has no attributable score.`);
        } else if (targetScore < methodology.decision.minimumCategoryScore) {
          benchmarkIssues.push(`${benchmark.targetCandidate}:${categoryId} score ${targetScore.toFixed(2)} is below ${methodology.decision.minimumCategoryScore.toFixed(2)}.`);
        }
        if (comparatorScore === null || comparatorScore === undefined) {
          benchmarkIssues.push(`${comparatorId}:${categoryId} has no attributable score.`);
        } else if (targetScore !== null && targetScore !== undefined && targetScore < comparatorScore) {
          benchmarkIssues.push(`${benchmark.targetCandidate}:${categoryId} score ${targetScore.toFixed(2)} is below ${comparatorId} at ${comparatorScore.toFixed(2)}.`);
        }
      }
      if (benchmark.requireTaskMetricNonRegression && target && comparator) {
        const metricChecks: Array<[string, number | null, number | null, "higher" | "lower"]> = [
          ["completion rate", target.tasks.completionRate, comparator.tasks.completionRate, "higher"],
          ["comprehension accuracy", target.tasks.comprehensionAccuracy, comparator.tasks.comprehensionAccuracy, "higher"],
          ["mean confidence", target.tasks.meanConfidence, comparator.tasks.meanConfidence, "higher"],
          ["mean duration", target.tasks.meanDurationSeconds, comparator.tasks.meanDurationSeconds, "lower"],
        ];
        for (const [label, targetValue, comparatorValue, direction] of metricChecks) {
          if (targetValue === null || comparatorValue === null) {
            benchmarkIssues.push(`${label} lacks representative-user evidence for ${benchmark.targetCandidate} or ${comparatorId}.`);
          } else if (
            (direction === "higher" && targetValue < comparatorValue)
            || (direction === "lower" && targetValue > comparatorValue)
          ) {
            benchmarkIssues.push(`${benchmark.targetCandidate} ${label} ${targetValue.toFixed(2)} regresses against ${comparatorId} at ${comparatorValue.toFixed(2)}.`);
          }
        }
      }
    }
    if (benchmarkIssues.length > 0) {
      addFinding(
        findings,
        "ZTDE-CMP-405",
        "warning",
        "decision.benchmark",
        `Benchmark decision is incomplete or failing: ${benchmarkIssues.join(" ")}`,
        "Collect complete attributable evidence and resolve every target-versus-comparator regression.",
      );
    }
  }

  for (const [index, claim] of review.claims.entries()) {
    if (claim.candidate !== "comparison" && !candidateIds.has(claim.candidate)) {
      addFinding(findings, "ZTDE-CMP-003", "error", `claims[${index}].candidate`, `Claim ${claim.id} references unknown candidate ${claim.candidate}.`, "Use a candidate declared by the methodology or comparison for shared claims.");
    }
    for (const reference of claim.evidenceRefs) {
      if (!artifacts.has(reference)) {
        addFinding(findings, "ZTDE-CMP-303", "error", `claims[${index}].evidenceRefs`, `Claim ${claim.id} references missing artifact ${reference}.`, "Add the artifact record or correct the evidence reference.");
      }
    }
    for (const reference of claim.sessionRefs) {
      if (!sessions.has(reference)) {
        addFinding(findings, "ZTDE-CMP-310", "error", `claims[${index}].sessionRefs`, `Claim ${claim.id} references missing session ${reference}.`, "Add the session or correct the evidence reference.");
      }
    }
    if (claim.status === "verified" && !claim.evidenceRefs.some((id) => retainedArtifacts.has(id)) && claim.sessionRefs.length === 0) {
      addFinding(findings, "ZTDE-CMP-306", "error", `claims[${index}]`, `Verified claim ${claim.id} has no retained artifact or attributable session.`, "Retain evidence or downgrade the claim to partial or unverified.");
    }
    if (claim.candidate !== "comparison") {
      const mismatched = claim.evidenceRefs
        .map((id) => artifacts.get(id))
        .some((artifact) => artifact && artifact.candidate !== claim.candidate);
      if (mismatched) {
        addFinding(findings, "ZTDE-CMP-314", "error", `claims[${index}].evidenceRefs`, `Claim ${claim.id} cites evidence from a different candidate.`, "Reference only evidence belonging to the claimed candidate, or classify the claim as comparison-wide.");
      }
    }
    if ((claim.status === "partial" || claim.status === "unverified" || claim.status === "contradicted") && claim.limitations.length === 0) {
      addFinding(findings, "ZTDE-CMP-307", "error", `claims[${index}].limitations`, `Claim ${claim.id} is ${claim.status} without a limitation record.`, "Explain the evidence gap, contradiction, or bounded scope.");
    }
    if (claim.evidenceType === "human-expert" || claim.evidenceType === "representative-user") {
      const matching = claim.sessionRefs
        .map((id) => sessions.get(id))
        .some((session) => session?.level === claim.evidenceType && session.origin === "reviewer-supplied");
      if (!matching) {
        addFinding(findings, "ZTDE-CMP-208", "error", `claims[${index}].sessionRefs`, `${claim.evidenceType} claim ${claim.id} lacks a matching reviewer-supplied session.`, "Reference attributable evidence from the declared evidence level.");
      }
    }
    if (claim.kind === "overall-result" && claim.outcome === "pass") {
      const incomplete = stageResults.filter(
        (stage) =>
          stage.required &&
          stage.status !== "pass" &&
          (claim.candidate === "comparison" || stage.candidate === claim.candidate),
      );
      if (incomplete.length > 0) {
        addFinding(findings, "ZTDE-CMP-103", "error", `claims[${index}]`, `Overall-pass claim ${claim.id} conflicts with required stages: ${incomplete.map((stage) => `${stage.candidate}:${stage.id}=${stage.status}`).join(", ")}.`, "Downgrade the overall claim or complete every required stage.");
      }
    }
    if (claim.kind === "accessibility-conformance" && claim.status === "verified") {
      const evidence = claim.evidenceRefs.map((id) => artifacts.get(id)).filter((entry) => entry !== undefined);
      const matching = evidence.some((artifact) => artifact.accessibility && claim.accessibility && (claim.candidate === "comparison" || artifact.candidate === claim.candidate) && artifact.accessibility.level === claim.accessibility.level && artifact.accessibility.coverage === claim.accessibility.coverage);
      if (!claim.accessibility || !matching) {
        addFinding(findings, "ZTDE-CMP-308", "error", `claims[${index}].accessibility`, `Accessibility claim ${claim.id} exceeds or does not match its structured evidence scope.`, "Match the claimed WCAG level and coverage to retained evidence, or narrow the claim.");
      }
    }
    if (claim.status === "contradicted" && methodology.decision.prohibitContradictedClaims) {
      addFinding(findings, "ZTDE-CMP-309", "warning", `claims[${index}].status`, `Claim ${claim.id} is contradicted.`, "Resolve the contradiction before release.");
    }
  }

  const evidenceLevels = countEvidenceLevels(review);
  for (const level of methodology.decision.requiredEvidenceLevels) {
    if (evidenceLevels[level] === 0) {
      addFinding(findings, "ZTDE-CMP-401", "warning", "evidenceLevels", `Required evidence level ${level} is absent.`, "Collect and retain the required evidence without substituting another evidence class.");
    }
  }

  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  const requiredStages = stageResults.filter((stage) => stage.required);
  const passedRequiredStages = requiredStages.filter((stage) => stage.status === "pass").length;
  const requiredEvidencePresent = methodology.decision.requiredEvidenceLevels.every(
    (level) => evidenceLevels[level] > 0,
  );
  const passed = errors === 0;
  const releaseReady =
    passed &&
    (!methodology.decision.requireAllStagesPass || passedRequiredStages === requiredStages.length) &&
    requiredEvidencePresent &&
    humanRequirementsMet &&
    (!benchmark || benchmarkIssues.length === 0) &&
    (!methodology.decision.prohibitContradictedClaims || !review.claims.some((claim) => claim.status === "contradicted"));

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    methodologyPath: resolve(methodologyPath),
    reviewPath: resolve(reviewPath),
    methodologyId: methodology.id,
    reviewId: review.id,
    passed,
    releaseReady,
    findings,
    summary: {
      errors,
      warnings,
      info: findings.filter((finding) => finding.severity === "info").length,
      requiredStages: requiredStages.length,
      passedRequiredStages,
      claims: review.claims.length,
      verifiedClaims: review.claims.filter((claim) => claim.status === "verified").length,
      sessions: review.sessions.length,
    },
    stageResults,
    evidenceLevels: {
      automated: evidenceLevels.automated,
      aiAssistedExpert: evidenceLevels["ai-assisted-expert"],
      humanExpert: evidenceLevels["human-expert"],
      representativeUser: evidenceLevels["representative-user"],
    },
    humanReview: {
      requirementsConfigured: Boolean(reviewRequirements),
      humanExpertSessions: humanExpertSessions.length,
      representativeUserSessions: representativeUserSessions.length,
      completeHumanExpertSessions: completeHumanExpertSessions.length,
      completeRepresentativeUserSessions: completeRepresentativeUserSessions.length,
      distinctCandidateOrders,
      blindedReviewerSessions,
      minimumHumanExpertSessions: reviewRequirements?.minimumHumanExpertSessions ?? 0,
      minimumRepresentativeUserSessions: reviewRequirements?.minimumRepresentativeUserSessions ?? 0,
      minimumCounterbalancedOrders: reviewRequirements?.minimumCounterbalancedOrders ?? 0,
      requirementsMet: humanRequirementsMet,
    },
    candidateResults,
    benchmarkDecision: {
      configured: Boolean(benchmark),
      targetCandidate: benchmark?.targetCandidate ?? null,
      comparatorCandidates: benchmark?.comparatorCandidates ?? [],
      passed: !benchmark || benchmarkIssues.length === 0,
      issues: benchmarkIssues,
    },
  };
}
