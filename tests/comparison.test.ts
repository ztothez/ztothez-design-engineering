import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import { evaluateInterfaceComparison } from "../src/comparison/evaluator.js";
import { assessSoloMaintainerTrack } from "../src/comparison/maintainer.js";
import {
  loadComparisonMethodology,
  loadComparisonReview,
} from "../src/comparison/loader.js";

const methodologyPath = join(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "interface-quality",
  "comparison-methodology.template.yaml",
);
const reviewTemplatePath = join(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "interface-quality",
  "review.template.yaml",
);
const fixtureRoot = join(process.cwd(), "tests", "fixtures", "comparison");
const azureBaselineRoot = join(process.cwd(), "evidence", "interface-quality", "azure-baseline");
const azureV2ReviewRoot = join(process.cwd(), "evidence", "interface-quality", "azure-v2-review");
const azureV2MethodologyPath = join(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "azure-optimizer",
  "v2-human-review-methodology.yaml",
);

async function runNode(argumentsList: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return await new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, argumentsList, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectRun);
    child.on("close", (code) => resolveRun({ code: code ?? 1, stdout, stderr }));
  });
}

function rotate<T>(values: T[], offset: number): T[] {
  return [...values.slice(offset), ...values.slice(0, offset)];
}

test("maintained comparison templates are valid without inventing release evidence", async () => {
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(methodologyPath),
    loadComparisonReview(reviewTemplatePath),
  ]);
  const report = await evaluateInterfaceComparison(
    methodology,
    review,
    methodologyPath,
    reviewTemplatePath,
  );

  assert.equal(report.passed, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.summary.errors, 0);
  assert.ok(report.summary.warnings >= 1);
  assert.equal(report.evidenceLevels.humanExpert, 0);
  assert.equal(report.evidenceLevels.representativeUser, 0);
});

test("attributable multi-level evidence can produce a release-ready comparison", async () => {
  const reviewPath = join(fixtureRoot, "release-review.yaml");
  const minimalMethodologyPath = join(fixtureRoot, "minimal-methodology.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(minimalMethodologyPath),
    loadComparisonReview(reviewPath),
  ]);
  const report = await evaluateInterfaceComparison(
    methodology,
    review,
    minimalMethodologyPath,
    reviewPath,
  );

  assert.equal(report.passed, true);
  assert.equal(report.releaseReady, true);
  assert.deepEqual(report.summary, {
    errors: 0,
    warnings: 0,
    info: 0,
    requiredStages: 3,
    passedRequiredStages: 3,
    claims: 4,
    verifiedClaims: 4,
    sessions: 3,
  });
});

test("Antigravity-style evidence mixing and contradictory pass claims are rejected", async () => {
  const reviewPath = join(fixtureRoot, "antigravity-invalid-review.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(methodologyPath),
    loadComparisonReview(reviewPath),
  ]);
  const report = await evaluateInterfaceComparison(methodology, review, methodologyPath, reviewPath);
  const rules = new Set(report.findings.map((finding) => finding.ruleId));

  assert.equal(report.passed, false);
  assert.equal(report.releaseReady, false);
  for (const rule of [
    "ZTDE-CMP-103",
    "ZTDE-CMP-201",
    "ZTDE-CMP-202",
    "ZTDE-CMP-203",
    "ZTDE-CMP-204",
    "ZTDE-CMP-208",
    "ZTDE-CMP-305",
    "ZTDE-CMP-308",
  ]) {
    assert.ok(rules.has(rule), `expected ${rule}`);
  }
});

test("portable schemas publish the versioned methodology and review contracts", async () => {
  const schemaRoot = join(process.cwd(), "knowledge-base", "benchmarks", "interface-quality");
  const methodologySchema = parse(
    await readFile(join(schemaRoot, "comparison-methodology.schema.yaml"), "utf8"),
  ) as { properties?: { version?: { const?: unknown } }; required?: string[] };
  const reviewSchema = parse(
    await readFile(join(schemaRoot, "review.schema.yaml"), "utf8"),
  ) as { properties?: { version?: { const?: unknown } }; required?: string[]; $defs?: { artifact?: { allOf?: unknown[] } } };
  const methodologyV11Schema = parse(
    await readFile(join(schemaRoot, "comparison-methodology-v1.1.schema.yaml"), "utf8"),
  ) as {
    properties?: {
      version?: { const?: unknown };
      decision?: { required?: string[] };
    };
  };
  const sessionSchema = parse(
    await readFile(join(schemaRoot, "review-session.schema.yaml"), "utf8"),
  ) as { properties?: { version?: { const?: unknown }; status?: { enum?: unknown[] } }; required?: string[] };

  assert.equal(methodologySchema.properties?.version?.const, "1.0");
  assert.ok(methodologySchema.required?.includes("evidencePolicy"));
  assert.equal(reviewSchema.properties?.version?.const, "1.0");
  assert.ok(reviewSchema.required?.includes("claims"));
  assert.equal(reviewSchema.$defs?.artifact?.allOf?.length, 1);
  assert.equal(methodologyV11Schema.properties?.version?.const, "1.1");
  assert.ok(methodologyV11Schema.properties?.decision?.required?.includes("reviewRequirements"));
  assert.ok(methodologyV11Schema.properties?.decision?.required?.includes("benchmark"));
  assert.equal(sessionSchema.properties?.version?.const, "1.0");
  assert.deepEqual(sessionSchema.properties?.status?.enum, ["draft", "complete"]);
  assert.ok(sessionSchema.required?.includes("session"));
});

test("V1.1 requires complete human matrices and passes an equal-or-better benchmark", async () => {
  const reviewPath = join(fixtureRoot, "release-review.yaml");
  const minimalMethodologyPath = join(fixtureRoot, "minimal-methodology.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(minimalMethodologyPath),
    loadComparisonReview(reviewPath),
  ]);
  methodology.version = "1.1";
  methodology.decision.requiredStageCandidates = ["anonymous-a"];
  methodology.decision.reviewRequirements = {
    minimumHumanExpertSessions: 1,
    minimumRepresentativeUserSessions: 1,
    requireCompleteTaskMatrix: true,
    requireCompleteRatingMatrix: true,
    requireIdentityBlinding: true,
    minimumCounterbalancedOrders: 2,
  };
  methodology.decision.benchmark = {
    targetCandidate: "anonymous-a",
    comparatorCandidates: ["anonymous-b"],
    requiredCategoryIds: ["trust"],
    requireTaskMetricNonRegression: true,
  };
  const userSession = review.sessions.find((session) => session.id === "user-session-one")!;
  const expertSession = review.sessions.find((session) => session.id === "expert-review")!;
  expertSession.blinding = { candidateIdentitiesWithheld: true, priorCandidateExposure: false, conflicts: [] };
  userSession.blinding = { candidateIdentitiesWithheld: true, priorCandidateExposure: false, conflicts: [] };
  userSession.taskResults.push({
    task: "identify-origin",
    candidate: "anonymous-b",
    outcome: "completed",
    durationSeconds: 5,
    navigationErrors: 0,
    recoveryAttempts: 0,
    comprehensionCorrect: true,
    confidence: 4,
  });
  userSession.ratings.push(
    { candidate: "anonymous-a", criterion: "origin-clear", score: 3, rationale: "Clear origin." },
    { candidate: "anonymous-b", criterion: "origin-clear", score: 3, rationale: "Clear origin." },
  );

  const report = await evaluateInterfaceComparison(
    methodology,
    review,
    minimalMethodologyPath,
    reviewPath,
  );

  assert.equal(report.passed, true);
  assert.equal(report.releaseReady, true);
  assert.equal(report.humanReview.requirementsMet, true);
  assert.equal(report.benchmarkDecision.passed, true);
  assert.equal(report.candidateResults[0]?.categories[0]?.score, 3);
});

test("V1.1 blocks incomplete, duplicate, and regressing human evidence", async () => {
  const reviewPath = join(fixtureRoot, "release-review.yaml");
  const minimalMethodologyPath = join(fixtureRoot, "minimal-methodology.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(minimalMethodologyPath),
    loadComparisonReview(reviewPath),
  ]);
  methodology.version = "1.1";
  methodology.decision.reviewRequirements = {
    minimumHumanExpertSessions: 2,
    minimumRepresentativeUserSessions: 2,
    requireCompleteTaskMatrix: true,
    requireCompleteRatingMatrix: true,
    requireIdentityBlinding: true,
    minimumCounterbalancedOrders: 3,
  };
  methodology.decision.benchmark = {
    targetCandidate: "anonymous-a",
    comparatorCandidates: ["anonymous-b"],
    requiredCategoryIds: ["trust"],
    requireTaskMetricNonRegression: true,
  };
  const userSession = review.sessions.find((session) => session.id === "user-session-one")!;
  const expertSession = review.sessions.find((session) => session.id === "expert-review")!;
  expertSession.ratings.push({
    candidate: "anonymous-a",
    criterion: "origin-clear",
    score: 4,
    rationale: "Wrong evidence level fixture.",
  });
  userSession.taskResults.push({ ...userSession.taskResults[0]! });
  userSession.ratings.push(
    { candidate: "anonymous-a", criterion: "origin-clear", score: 3, rationale: "Usable." },
    { candidate: "anonymous-b", criterion: "origin-clear", score: 4, rationale: "Stronger." },
  );

  const report = await evaluateInterfaceComparison(
    methodology,
    review,
    minimalMethodologyPath,
    reviewPath,
  );
  const rules = new Set(report.findings.map((finding) => finding.ruleId));

  assert.equal(report.passed, false);
  assert.equal(report.releaseReady, false);
  assert.equal(report.humanReview.requirementsMet, false);
  assert.equal(report.benchmarkDecision.passed, false);
  for (const rule of ["ZTDE-CMP-209", "ZTDE-CMP-211", "ZTDE-CMP-403", "ZTDE-CMP-404", "ZTDE-CMP-406", "ZTDE-CMP-407", "ZTDE-CMP-405"]) {
    assert.ok(rules.has(rule), `expected ${rule}`);
  }
});

test("retained Azure baseline covers four candidates without claiming release readiness", async () => {
  const reviewPath = join(azureBaselineRoot, "review.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(methodologyPath),
    loadComparisonReview(reviewPath),
  ]);
  const report = await evaluateInterfaceComparison(methodology, review, methodologyPath, reviewPath);

  assert.equal(report.passed, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.requiredStages, 21);
  assert.equal(report.stageResults.filter((entry) => entry.id === "build").length, 4);
  assert.equal(report.evidenceLevels.humanExpert, 0);
  assert.equal(report.evidenceLevels.representativeUser, 0);
});

test("missing candidate-stage evidence prevents a comparison release decision", async () => {
  const reviewPath = join(azureBaselineRoot, "review.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(methodologyPath),
    loadComparisonReview(reviewPath),
  ]);
  review.stages = review.stages.filter(
    (entry) => !(entry.id === "build" && entry.candidate === "anonymous-d"),
  );
  const report = await evaluateInterfaceComparison(methodology, review, methodologyPath, reviewPath);

  assert.equal(report.releaseReady, false);
  assert.ok(
    report.findings.some(
      (entry) => entry.ruleId === "ZTDE-CMP-102" && entry.path === "stages.anonymous-d.build",
    ),
  );
});

test("retained comparison artifacts reject checksum tampering", async () => {
  const reviewPath = join(azureBaselineRoot, "review.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(methodologyPath),
    loadComparisonReview(reviewPath),
  ]);
  review.artifacts[0]!.sha256 = "0".repeat(64);
  const report = await evaluateInterfaceComparison(methodology, review, methodologyPath, reviewPath);

  assert.equal(report.passed, false);
  assert.ok(report.findings.some((entry) => entry.ruleId === "ZTDE-CMP-313"));
});

test("reviewer packet filenames and instructions do not disclose candidate identities", async () => {
  const packetRoot = join(azureBaselineRoot, "reviewer-packet");
  const entries = await readdir(packetRoot, { recursive: true, withFileTypes: true });
  const prohibited = /lovable|ui[- ]?ux|pro[- ]?max|ztothez/i;
  for (const entry of entries) {
    assert.doesNotMatch(entry.name, prohibited);
    if (!entry.isFile() || !/\.(md|ya?ml)$/i.test(entry.name)) continue;
    const path = join(entry.parentPath, entry.name);
    assert.doesNotMatch(await readFile(path, "utf8"), prohibited);
  }
});

test("Azure V2 packet is anonymous, complete, and honestly not release-ready", async () => {
  const reviewPath = join(azureV2ReviewRoot, "review.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(azureV2MethodologyPath),
    loadComparisonReview(reviewPath),
  ]);
  const report = await evaluateInterfaceComparison(
    methodology,
    review,
    azureV2MethodologyPath,
    reviewPath,
  );

  assert.equal(methodology.version, "1.1");
  assert.equal(review.candidates.length, 5);
  assert.equal(review.artifacts.length, 51);
  assert.equal(report.passed, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.summary.passedRequiredStages, 5);
  assert.equal(report.summary.requiredStages, 6);
  assert.equal(report.humanReview.humanExpertSessions, 0);
  assert.equal(report.humanReview.representativeUserSessions, 0);
  assert.equal(report.benchmarkDecision.passed, false);

  const packetRoot = join(azureV2ReviewRoot, "reviewer-packet");
  const entries = await readdir(packetRoot, { recursive: true, withFileTypes: true });
  const prohibited = /lovable|ui[- ]?ux|pro[- ]?max|ztothez/i;
  for (const entry of entries) {
    assert.doesNotMatch(entry.name, prohibited);
    if (!entry.isFile() || !/\.(md|ya?ml)$/i.test(entry.name)) continue;
    assert.doesNotMatch(await readFile(join(entry.parentPath, entry.name), "utf8"), prohibited);
  }

  const expertTemplate = parse(
    await readFile(join(packetRoot, "human-expert-session.template.yaml"), "utf8"),
  ) as { status: string; session: { ratings: unknown[] } };
  const userTemplate = parse(
    await readFile(join(packetRoot, "representative-user-session.template.yaml"), "utf8"),
  ) as { status: string; session: { taskResults: unknown[]; ratings: unknown[] } };
  assert.equal(expertTemplate.status, "draft");
  assert.equal(expertTemplate.session.ratings.length, 20);
  assert.equal(userTemplate.status, "draft");
  assert.equal(userTemplate.session.taskResults.length, 25);
  assert.equal(userTemplate.session.ratings.length, 10);
});

test("comparison compiler hashes complete reviewer sessions and reaches V1.1 thresholds", async () => {
  const packetRoot = join(azureV2ReviewRoot, "reviewer-packet");
  const temporarySessions = await mkdtemp(join(azureV2ReviewRoot, ".compile-test-"));
  const output = join(azureV2ReviewRoot, "compiled-test.yaml");
  const reportPath = join(azureV2ReviewRoot, "compiled-test.report.json");
  const candidates = ["anonymous-a", "anonymous-b", "anonymous-c", "anonymous-d", "anonymous-e"];

  try {
    const expertTemplate = parse(
      await readFile(join(packetRoot, "human-expert-session.template.yaml"), "utf8"),
    ) as any;
    const userTemplate = parse(
      await readFile(join(packetRoot, "representative-user-session.template.yaml"), "utf8"),
    ) as any;
    for (let index = 0; index < 3; index += 1) {
      const envelope = structuredClone(expertTemplate);
      envelope.status = "complete";
      envelope.session.id = `synthetic-expert-${index + 1}`;
      envelope.session.contributor = `Synthetic fixture expert ${index + 1}`;
      envelope.session.recordedAt = `2026-08-26T18:0${index}:00Z`;
      envelope.session.candidateOrder = rotate(candidates, index);
      envelope.session.blinding = { candidateIdentitiesWithheld: true, priorCandidateExposure: false, conflicts: [] };
      envelope.session.ratings = envelope.session.ratings.map((rating: any) => ({
        ...rating,
        score: rating.candidate === "anonymous-e" ? 4 : rating.candidate === "anonymous-b" ? 3 : 2,
        rationale: "Synthetic fixture evidence for compiler regression testing only.",
      }));
      await writeFile(join(temporarySessions, `expert-${index + 1}.yaml`), stringify(envelope), "utf8");
    }
    for (let index = 0; index < 5; index += 1) {
      const envelope = structuredClone(userTemplate);
      envelope.status = "complete";
      envelope.session.id = `synthetic-user-${index + 1}`;
      envelope.session.contributor = `Synthetic fixture facilitator ${index + 1}`;
      envelope.session.participantId = `synthetic-participant-${index + 1}`;
      envelope.session.recordedAt = `2026-08-26T18:1${index}:00Z`;
      envelope.session.candidateOrder = rotate(candidates, index);
      envelope.session.blinding = { candidateIdentitiesWithheld: true, priorCandidateExposure: false, conflicts: [] };
      envelope.session.taskResults = envelope.session.taskResults.map((result: any) => ({
        ...result,
        outcome: "completed",
        durationSeconds: result.candidate === "anonymous-e" ? 4 : result.candidate === "anonymous-b" ? 5 : 6,
        comprehensionCorrect: true,
        confidence: result.candidate === "anonymous-e" ? 5 : result.candidate === "anonymous-b" ? 4 : 3,
        notes: "Synthetic fixture task result for compiler regression testing only.",
      }));
      envelope.session.ratings = envelope.session.ratings.map((rating: any) => ({
        ...rating,
        score: rating.candidate === "anonymous-e" ? 4 : rating.candidate === "anonymous-b" ? 3 : 2,
        rationale: "Synthetic fixture evidence for compiler regression testing only.",
      }));
      await writeFile(join(temporarySessions, `user-${index + 1}.yaml`), stringify(envelope), "utf8");
    }

    const result = await runNode([
      join(process.cwd(), "dist", "cli", "compile-comparison-review.js"),
      "--methodology", azureV2MethodologyPath,
      "--base-review", join(azureV2ReviewRoot, "review.yaml"),
      "--sessions", temporarySessions,
      "--output", output,
      "--report", reportPath,
      "--require-release-ready",
    ]);
    assert.equal(result.code, 0, result.stderr || result.stdout);
    const report = JSON.parse(await readFile(reportPath, "utf8")) as {
      releaseReady: boolean;
      humanReview: { requirementsMet: boolean };
      benchmarkDecision: { passed: boolean };
      summary: { passedRequiredStages: number; requiredStages: number };
    };
    assert.equal(report.releaseReady, true);
    assert.equal(report.humanReview.requirementsMet, true);
    assert.equal(report.benchmarkDecision.passed, true);
    assert.equal(report.summary.passedRequiredStages, report.summary.requiredStages);
  } finally {
    await Promise.all([
      rm(temporarySessions, { recursive: true, force: true }),
      rm(output, { force: true }),
      rm(reportPath, { force: true }),
    ]);
  }
});

test("disclosed maintainer review authorizes engineering without claiming external release", async () => {
  const completedReviewPath = join(azureV2ReviewRoot, "review.completed.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(azureV2MethodologyPath),
    loadComparisonReview(completedReviewPath),
  ]);
  const comparisonReport = await evaluateInterfaceComparison(
    methodology,
    review,
    azureV2MethodologyPath,
    completedReviewPath,
  );
  const assessment = assessSoloMaintainerTrack(methodology, review, comparisonReport);

  assert.equal(assessment.engineeringReady, true);
  assert.equal(assessment.externalReleaseReady, false);
  assert.equal(assessment.externalValidationPending, true);
  assert.equal(assessment.claimScope, "engineering-continuation-only");
  assert.deepEqual(assessment.maintainerSessions.sessionIds, ["ztothez-self-review-01"]);
  assert.ok(assessment.categories.every((category) => category.passed));
});

test("maintainer track blocks incomplete ratings and failed target stages", async () => {
  const completedReviewPath = join(azureV2ReviewRoot, "review.completed.yaml");
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(azureV2MethodologyPath),
    loadComparisonReview(completedReviewPath),
  ]);
  const comparisonReport = await evaluateInterfaceComparison(
    methodology,
    review,
    azureV2MethodologyPath,
    completedReviewPath,
  );

  const incompleteReview = structuredClone(review);
  const maintainer = incompleteReview.sessions.find((session) => session.id === "ztothez-self-review-01");
  assert.ok(maintainer);
  maintainer.ratings = maintainer.ratings.slice(1);
  const incomplete = assessSoloMaintainerTrack(methodology, incompleteReview, comparisonReport);
  assert.equal(incomplete.engineeringReady, false);
  assert.ok(incomplete.findings.some((finding) => finding.ruleId === "ZTDE-MNT-002"));

  const failedReport = structuredClone(comparisonReport);
  const targetStage = failedReport.stageResults.find(
    (stage) => stage.candidate === "anonymous-e" && stage.id === "browser-verification",
  );
  assert.ok(targetStage);
  targetStage.status = "fail";
  const failed = assessSoloMaintainerTrack(methodology, review, failedReport);
  assert.equal(failed.engineeringReady, false);
  assert.ok(failed.findings.some((finding) => finding.ruleId === "ZTDE-MNT-004"));
});
