import assert from "node:assert/strict";
import test from "node:test";

import type { PortfolioRegistryInspection, ResolvedPortfolioProject } from "../src/portfolio/registry.js";
import type { PortfolioBenchmarkReport, PortfolioProjectRun } from "../src/portfolio/runner.js";
import { evaluateRuleCandidate } from "../src/portfolio/promotion.js";
import type { RuleCandidate, RulePromotionEvidence } from "../src/portfolio/promotion-schema.js";

const digest = "a".repeat(64);
const checksum = "b".repeat(64);

function project(
  id: string,
  domain: string,
  cohort: "development" | "holdout",
): ResolvedPortfolioProject {
  return {
    canonicalPath: `/home/user/${id}`,
    root: {
      declaration: { id: "root1", class: "studio-portfolio", path: "/home/user", discoveryDepth: 4, excludes: [] },
      canonicalPath: "/home/user",
    },
    declaration: {
      id,
      root: "root1",
      path: id,
      enabled: true,
      ownership: "first-party",
      confidentiality: "private-local",
      cohort,
      publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
      product: { domain, archetype: "operational-dashboard", intendedUsers: ["analyst"], primaryTasks: ["task"] },
      technology: { framework: "react", packageManager: "npm", entrypoint: "src/index.ts", adapter: "react-vite" },
      capabilities: [{ stage: "source-audit", status: "supported", reason: "Audit" }],
      execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
      paths: { include: ["**"], exclude: [] },
      source: { revisionPolicy: "capture-current", canonicalizationKey: id },
    },
  };
}

const projects = [
  project("dev-p1", "finance", "development"),
  project("dev-p2", "healthcare", "development"),
  project("dev-p3", "logistics", "development"),
  project("holdout-p1", "retail", "holdout"),
];

const inspection: PortfolioRegistryInspection = {
  report: {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    registryId: "root1",
    counts: { roots: 1, projects: 4, enabled: 4, development: 3, holdout: 1, excluded: 0 },
    projects: [],
    issues: [],
    passed: true,
  },
  roots: [],
  projects,
};

function projectRun(
  projectId: string,
  cohort: "development" | "holdout",
  reportCode?: string,
): PortfolioProjectRun {
  return {
    projectId,
    cohort,
    adapter: "react-vite",
    sourceDigest: digest,
    sourceRevision: "fixture",
    environmentPolicy: { network: "denied", lifecycleScripts: false, environmentVariables: [] },
    commands: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:01.000Z",
    stages: [{
      stage: "source-audit",
      status: reportCode ? "failed" : "passed",
      reason: reportCode ? "Candidate finding observed." : "Audit passed.",
      ...(reportCode ? { findingDetails: [{ source: "audit", id: reportCode, severity: "warning", message: "Observed." }] } : {}),
    }],
    artifacts: [],
    status: reportCode ? "findings" : "passed",
  };
}

function cohortReport(
  cohort: "development" | "holdout",
  runs: PortfolioProjectRun[],
): PortfolioBenchmarkReport {
  const findings = runs.filter((run) => run.status === "findings").length;
  return {
    version: "1.2.0",
    toolVersion: "2.0.2",
    runId: `${cohort}-run`,
    mode: "cohort",
    registryId: "root1",
    registryDigest: digest,
    cohort,
    projectIds: runs.map((run) => run.projectId),
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:02.000Z",
    projects: runs,
    summary: { passed: runs.length - findings, findings, limitations: 0, unsafeConfiguration: 0, sourceMutation: 0 },
    resultFingerprint: checksum,
    passed: findings === 0,
  };
}

function candidate(reportCode = "A11Y-LIVE-REGION"): RuleCandidate {
  return {
    id: "rule-cand-001",
    title: "Enforce live regions on dynamic notifications",
    category: "accessibility",
    dimension: "accessibility",
    reportCode,
    justification: { type: "cohort-recurrence", rationale: "Observed in three projects across three domains." },
    authoredIndependently: true,
    positiveFixturePath: "fixtures/live-region/pass.html",
    negativeFixturePath: "fixtures/live-region/fail.html",
    abstentionPath: "fixtures/live-region/abstain.md",
    authoringProjects: ["dev-p1", "dev-p2", "dev-p3"],
  };
}

function evidence(): RulePromotionEvidence {
  const reference = (path: string) => ({ path, sha256: checksum });
  return {
    version: "1.0.0",
    fixtures: {
      positive: { ...reference("fixtures/live-region/pass.html"), outcome: "accepted" },
      negative: { ...reference("fixtures/live-region/fail.html"), outcome: "detected" },
      abstention: { ...reference("fixtures/live-region/abstain.md"), outcome: "abstained" },
    },
    existingGates: (["v1-v2", "retrieval", "corpus", "mcp", "package", "independence"] as const)
      .map((id) => ({ id, passed: true, evidence: reference(`reports/${id}.json`) })),
    holdoutEvaluations: [
      { projectId: "holdout-p1", status: "unaffected", evidence: reference("reports/holdout-p1.json") },
    ],
    promotedArtifacts: {
      documentation: reference("docs/rules/A11Y-LIVE-REGION.md"),
      test: reference("tests/rules/rule-cand-001.test.ts"),
      migrationGuidance: "Enable A11Y-LIVE-REGION and review existing notification surfaces.",
    },
  };
}

function validReports(reportCode = "A11Y-LIVE-REGION") {
  return {
    development: cohortReport("development", [
      projectRun("dev-p1", "development", reportCode),
      projectRun("dev-p2", "development", reportCode),
      projectRun("dev-p3", "development", reportCode),
    ]),
    holdout: cohortReport("holdout", [projectRun("holdout-p1", "holdout")]),
  };
}

test("complete recurrence, fixture, gate, holdout, and source evidence promotes a rule", () => {
  const reports = validReports();
  const report = evaluateRuleCandidate(candidate(), inspection, reports.development, reports.holdout, evidence(), true);

  assert.equal(report.version, "1.1.0");
  assert.equal(report.decision, "promoted");
  assert.equal(report.passed, true);
  assert.equal(report.evaluationComplete, true);
  assert.deepEqual(report.failureReasons, []);
  assert.equal(Object.values(report.criteria).every(Boolean), true);
  assert.equal(report.promotedArtifacts?.documentationPath, "docs/rules/A11Y-LIVE-REGION.md");
});

test("missing structured evidence rejects instead of inferring fixture and gate passes", () => {
  const reports = validReports();
  const report = evaluateRuleCandidate(candidate(), inspection, reports.development, reports.holdout);

  assert.equal(report.passed, false);
  assert.equal(report.criteria.c3_positiveNegativeFixtures, false);
  assert.equal(report.criteria.c4_falsePositiveAnalysis, false);
  assert.equal(report.criteria.c5_existingTestsPass, false);
});

test("missing holdout report remains unverified and blocks promotion", () => {
  const reports = validReports();
  const report = evaluateRuleCandidate(candidate(), inspection, reports.development, undefined, evidence(), true);

  assert.equal(report.criteria.c6_holdoutValidationPass, false);
  assert.equal(report.criteria.c7_sourceUnchanged, false);
  assert.equal(report.holdoutImpact[0]?.status, "unverified");
});

test("recurrence requires retained findings for every declared authoring project", () => {
  const reports = validReports();
  reports.development.projects[2] = projectRun("dev-p3", "development");
  const report = evaluateRuleCandidate(candidate(), inspection, reports.development, reports.holdout, evidence(), true);

  assert.equal(report.criteria.c2_recurrenceOrSafety, false);
  assert.equal(report.passed, false);
});

test("a failing required gate blocks promotion", () => {
  const reports = validReports();
  const gateEvidence = evidence();
  gateEvidence.existingGates[2]!.passed = false;
  const report = evaluateRuleCandidate(candidate(), inspection, reports.development, reports.holdout, gateEvidence, true);

  assert.equal(report.criteria.c5_existingTestsPass, false);
  assert.equal(report.passed, false);
});

test("a candidate finding in the holdout cohort is retained as a regression", () => {
  const reports = validReports();
  reports.holdout = cohortReport("holdout", [projectRun("holdout-p1", "holdout", "A11Y-LIVE-REGION")]);
  const holdoutEvidence = evidence();
  holdoutEvidence.holdoutEvaluations[0]!.status = "regressed";
  const report = evaluateRuleCandidate(candidate(), inspection, reports.development, reports.holdout, holdoutEvidence, true);

  assert.equal(report.criteria.c6_holdoutValidationPass, false);
  assert.equal(report.holdoutImpact[0]?.status, "regressed");
  assert.equal(report.passed, false);
});

test("all holdouts abstaining cannot establish candidate benefit or non-regression", () => {
  const reports = validReports();
  const holdoutEvidence = evidence();
  holdoutEvidence.holdoutEvaluations[0]!.status = "abstained";
  const report = evaluateRuleCandidate(candidate(), inspection, reports.development, reports.holdout, holdoutEvidence, true);

  assert.equal(report.evaluationComplete, true);
  assert.equal(report.criteria.c6_holdoutValidationPass, false);
  assert.equal(report.passed, false);
});

test("development and holdout reports from different registry revisions cannot be combined", () => {
  const reports = validReports();
  reports.holdout.registryDigest = "c".repeat(64);
  const report = evaluateRuleCandidate(candidate(), inspection, reports.development, reports.holdout, evidence(), true);

  assert.equal(report.evaluationComplete, false);
  assert.equal(report.criteria.c6_holdoutValidationPass, false);
  assert.equal(report.criteria.c7_sourceUnchanged, false);
});
