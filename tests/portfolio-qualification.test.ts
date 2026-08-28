import assert from "node:assert/strict";
import test from "node:test";

import type { PortfolioRegistryInspection, ResolvedPortfolioProject } from "../src/portfolio/registry.js";
import type { PortfolioBenchmarkReport, PortfolioProjectRun } from "../src/portfolio/runner.js";
import { evaluateV3Qualification } from "../src/portfolio/qualification.js";
import type { QualificationEvidence } from "../src/portfolio/qualification-schema.js";
import type { PortfolioAdapterId } from "../src/portfolio/schema.js";

const digest = "a".repeat(64);
const checksum = "b".repeat(64);

function makeProject(
  id: string,
  domain: string,
  framework: string,
  adapter: PortfolioAdapterId,
  archetype: "operational-dashboard" | "ai-workspace" | "content-site" | "utility" | "full-stack-workflow" | "other",
  cohort: "development" | "holdout" = "development",
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
      product: { domain, archetype, intendedUsers: ["user"], primaryTasks: ["task"] },
      technology: { framework, packageManager: "npm", entrypoint: "src/index.ts", adapter },
      capabilities: [{ stage: "source-audit", status: "supported", reason: "Audit" }],
      execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
      paths: { include: ["**"], exclude: [] },
      source: { revisionPolicy: "capture-current", canonicalizationKey: id },
    },
  };
}

const projects: ResolvedPortfolioProject[] = [
  makeProject("p1", "finance", "React", "react-vite", "operational-dashboard"),
  makeProject("p2", "finance", "Node and Python", "node-python-fullstack", "full-stack-workflow"),
  makeProject("p3", "healthcare", "Python", "python-source", "utility"),
  makeProject("p4", "healthcare", "React", "react-vite", "ai-workspace"),
  makeProject("p5", "logistics", "Next.js", "nextjs", "full-stack-workflow"),
  makeProject("p6", "logistics", "Angular", "angular", "utility"),
  makeProject("p7", "retail", "Static web", "static-web", "content-site"),
  makeProject("p8", "retail", "React", "react-vite", "operational-dashboard"),
  makeProject("p9", "education", "Next.js", "nextjs", "ai-workspace"),
  makeProject("p10", "education", "Static web", "static-web", "utility", "holdout"),
  makeProject("p11", "media", "React", "react-vite", "content-site", "holdout"),
  makeProject("p12", "media", "Node and Python", "node-python-fullstack", "full-stack-workflow", "holdout"),
];

function inspectionFor(selected: ResolvedPortfolioProject[]): PortfolioRegistryInspection {
  const development = selected.filter((project) => project.declaration.cohort === "development").length;
  const holdout = selected.length - development;
  return {
    report: {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      registryId: "root1",
      counts: { roots: 1, projects: selected.length, enabled: selected.length, development, holdout, excluded: 0 },
      projects: [],
      issues: [],
      passed: true,
    },
    roots: [],
    projects: selected,
  };
}

function runFor(project: ResolvedPortfolioProject): PortfolioProjectRun {
  const adapter = project.declaration.technology.adapter!;
  const stages: PortfolioProjectRun["stages"] = [{ stage: "source-audit", status: "passed", reason: "Audit passed." }];
  if (["react-vite", "nextjs", "angular", "static-web"].includes(adapter)) {
    stages.push({ stage: "browser-journeys", status: "passed", reason: "Journey passed." });
  }
  if (adapter === "node-python-fullstack") {
    stages.push({ stage: "production-build", status: "passed", reason: "Build passed." });
  }
  return {
    projectId: project.declaration.id,
    cohort: project.declaration.cohort as "development" | "holdout",
    adapter,
    sourceDigest: digest,
    sourceRevision: "fixture",
    environmentPolicy: { network: "denied", lifecycleScripts: false, environmentVariables: [] },
    commands: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:01.000Z",
    stages,
    artifacts: [],
    status: "passed",
  };
}

function cohortReport(
  selected: ResolvedPortfolioProject[],
  cohort: "development" | "holdout",
): PortfolioBenchmarkReport {
  const runs = selected.filter((project) => project.declaration.cohort === cohort).map(runFor);
  return {
    version: "1.2.0",
    toolVersion: "2.0.0",
    runId: `${cohort}-run`,
    mode: "cohort",
    registryId: "root1",
    registryDigest: digest,
    cohort,
    projectIds: runs.map((run) => run.projectId),
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:00:02.000Z",
    projects: runs,
    summary: { passed: runs.length, findings: 0, limitations: 0, unsafeConfiguration: 0, sourceMutation: 0 },
    resultFingerprint: checksum,
    passed: true,
  };
}

function evidence(): QualificationEvidence {
  const check = (path: string) => ({ passed: true, evidence: { path, sha256: checksum } });
  return {
    version: "1.0.0",
    ciFixtures: {
      registryViolations: check("reports/ci-registry.json"),
      snapshotViolations: check("reports/ci-snapshot.json"),
      adapterCases: check("reports/ci-adapters.json"),
      comparisonSafety: check("reports/ci-comparison.json"),
      privacyBoundaries: check("reports/ci-privacy.json"),
      rulePromotionPaths: check("reports/ci-promotion.json"),
    },
    releaseGates: {
      build: check("reports/build.json"),
      typecheck: check("reports/typecheck.json"),
      tests: check("reports/tests.json"),
      packageCheck: check("reports/package-check.json"),
      packageSmoke: check("reports/package-smoke.json"),
      independence: check("reports/independence.json"),
      corpus: check("reports/corpus.json"),
      offlineRelease: check("reports/offline-release.json"),
      archiveRemoval: check("reports/archive-removal.json"),
    },
    benchmarkPaths: {
      browserOnly: check("reports/browser-only.json"),
      fullStack: check("reports/full-stack.json"),
    },
    promotionReports: ["rule-1", "rule-2", "rule-3"].map((candidateId, index) => ({
      candidateId,
      decision: index === 2 ? "rejected" as const : "promoted" as const,
      evaluationComplete: true,
      evidence: { path: `reports/${candidateId}.json`, sha256: checksum },
    })),
    privateLeakageScan: check("reports/private-leakage.json"),
    claims: [],
  };
}

test("qualification passes only with complete targets, runs, CI evidence, and release evidence", () => {
  const inspection = inspectionFor(projects);
  const report = evaluateV3Qualification(
    inspection,
    cohortReport(projects, "development"),
    cohortReport(projects, "holdout"),
    evidence(),
    true,
  );

  assert.equal(report.version, "1.1.0");
  assert.equal(report.passed, true);
  assert.equal(Object.values(report.criteria).every(Boolean), true);
  assert.equal(report.targets.eligibleProjectsCount, 12);
  assert.equal(report.targets.productDomainsCount, 6);
  assert.equal(report.targets.frontendStacksCount >= 3, true);
  assert.equal(report.targets.interfaceArchetypesCount, 5);
  assert.equal(report.targets.lockedHoldoutProjectsCount, 3);
  assert.deepEqual(report.targets.pathTypes, { sourceOnly: true, browserOnly: true, fullStack: true });
  assert.equal(report.supportedClaims.length, 4);
});

test("numeric qualification thresholds are enforced instead of merely reported", () => {
  const selected = [projects[0]!, projects[1]!, projects[2]!, projects[9]!];
  const report = evaluateV3Qualification(
    inspectionFor(selected),
    cohortReport(selected, "development"),
    cohortReport(selected, "holdout"),
    evidence(),
    true,
  );

  assert.equal(report.criteria.eligibleProjects, false);
  assert.equal(report.criteria.productDomains, false);
  assert.equal(report.criteria.lockedHoldouts, false);
  assert.equal(report.passed, false);
});

test("missing qualification evidence fails all evidence-backed gates", () => {
  const report = evaluateV3Qualification(
    inspectionFor(projects),
    cohortReport(projects, "development"),
    cohortReport(projects, "holdout"),
  );

  assert.equal(report.criteria.ciFixtures, false);
  assert.equal(report.criteria.existingGates, false);
  assert.equal(report.criteria.privateDistributionClean, false);
  assert.equal(report.criteria.rulePromotionEvidence, false);
  assert.ok(report.failureReasons.includes("V3 qualification evidence is missing or invalid."));
});

test("missing cohort reports cannot establish paths, immutability, or cross-product claims", () => {
  const report = evaluateV3Qualification(inspectionFor(projects), undefined, undefined, evidence(), true);

  assert.equal(report.criteria.cohortReportsComplete, false);
  assert.equal(report.criteria.benchmarkPaths, false);
  assert.equal(report.criteria.sourceRootsUnchanged, false);
  assert.equal(report.supportedClaims.includes("The benchmark runner operated non-destructively on the declared corpus."), false);
});

test("source mutation and private leakage evidence block qualification", () => {
  const development = cohortReport(projects, "development");
  development.summary.sourceMutation = 1;
  development.summary.passed -= 1;
  development.projects[0]!.status = "source-mutation";
  const gateEvidence = evidence();
  gateEvidence.privateLeakageScan.passed = false;
  const report = evaluateV3Qualification(
    inspectionFor(projects),
    development,
    cohortReport(projects, "holdout"),
    gateEvidence,
    true,
  );

  assert.equal(report.criteria.sourceRootsUnchanged, false);
  assert.equal(report.criteria.privateDistributionClean, false);
  assert.equal(report.passed, false);
});

test("a failed CI fixture category blocks qualification", () => {
  const gateEvidence = evidence();
  gateEvidence.ciFixtures.comparisonSafety.passed = false;
  const report = evaluateV3Qualification(
    inspectionFor(projects),
    cohortReport(projects, "development"),
    cohortReport(projects, "holdout"),
    gateEvidence,
    true,
  );

  assert.equal(report.ciFixtures.comparisonSafety, false);
  assert.equal(report.criteria.ciFixtures, false);
  assert.equal(report.passed, false);
});

test("disallowed claims are detected and never promoted to supported claims", () => {
  const gateEvidence = evidence();
  gateEvidence.claims = [
    "Claims independent human validation and representative user validation across all apps.",
    "Guarantees universal design quality.",
  ];
  const report = evaluateV3Qualification(
    inspectionFor(projects),
    cohortReport(projects, "development"),
    cohortReport(projects, "holdout"),
    gateEvidence,
    true,
  );

  assert.equal(report.criteria.claimBoundary, false);
  assert.equal(report.disallowedClaimsDetected.length, 2);
  assert.equal(report.passed, false);
});

test("qualification rejects cohort reports from different registry revisions", () => {
  const fixture = inspectionFor(projects);
  const development = cohortReport(projects, "development");
  const holdout = cohortReport(projects, "holdout");
  holdout.registryDigest = "c".repeat(64);
  const report = evaluateV3Qualification(
    fixture,
    development,
    holdout,
    evidence(),
    true,
  );

  assert.equal(report.criteria.cohortReportsComplete, false);
  assert.equal(report.criteria.sourceRootsUnchanged, false);
  assert.equal(report.passed, false);
});
