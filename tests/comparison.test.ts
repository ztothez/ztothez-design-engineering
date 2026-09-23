import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { parse } from "yaml";

import { evaluateInterfaceComparison } from "../src/comparison/evaluator.js";
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
