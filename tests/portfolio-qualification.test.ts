import assert from "node:assert/strict";
import test from "node:test";

import type { PortfolioRegistryInspection, ResolvedPortfolioProject } from "../src/portfolio/registry.js";
import type { PortfolioBenchmarkReport } from "../src/portfolio/runner.js";
import { evaluateV3Qualification } from "../src/portfolio/qualification.js";

const makeProject = (
  id: string,
  domain: string,
  framework: string,
  archetype: "operational-dashboard" | "ai-workspace" | "content-site" | "utility" | "full-stack-workflow" | "other",
  cohort: "development" | "holdout" = "development",
): ResolvedPortfolioProject => ({
  canonicalPath: `/home/user/${id}`,
  root: { declaration: { id: "root1", class: "studio-portfolio", path: "/home/user", discoveryDepth: 4, excludes: [] }, canonicalPath: "/home/user" },
  declaration: {
    id, root: "root1", path: id, enabled: true, ownership: "first-party",
    confidentiality: "private-local", cohort, publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
    product: { domain, archetype, intendedUsers: ["user"], primaryTasks: ["task"] },
    technology: { framework, packageManager: "npm", entrypoint: "src/index.ts" },
    capabilities: [{ stage: "source-audit", status: "supported", reason: "Audit" }],
    execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
    paths: { include: ["**"], exclude: [] }, source: { revisionPolicy: "capture-current", canonicalizationKey: id },
  },
});

const mockQualificationProjects: ResolvedPortfolioProject[] = [
  makeProject("p1", "finance", "react-vite", "operational-dashboard", "development"),
  makeProject("p2", "finance", "nextjs", "utility", "development"),
  makeProject("p3", "healthcare", "static-web", "content-site", "development"),
  makeProject("p4", "healthcare", "react-vite", "operational-dashboard", "development"),
  makeProject("p5", "logistics", "remix", "full-stack-workflow", "development"),
  makeProject("p6", "logistics", "nextjs", "utility", "development"),
  makeProject("p7", "retail", "static-web", "content-site", "development"),
  makeProject("p8", "retail", "react-vite", "operational-dashboard", "development"),
  makeProject("p9", "education", "sveltekit", "full-stack-workflow", "development"),
  makeProject("p10", "education", "holdout-stack", "utility", "holdout"),
  makeProject("p11", "media", "holdout-stack", "content-site", "holdout"),
  makeProject("p12", "media", "holdout-stack", "full-stack-workflow", "holdout"),
];

const mockInspection: PortfolioRegistryInspection = {
  report: {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    counts: { roots: 1, projects: 12, enabled: 12, development: 9, holdout: 3, excluded: 0 },
    projects: [],
    issues: [],
    passed: true,
  },
  roots: [],
  projects: mockQualificationProjects,
};

const cleanDevReport: PortfolioBenchmarkReport = {
  version: "1.2.0",
  toolVersion: "2.0.0",
  runId: "clean-dev-run",
  mode: "cohort",
  registryId: "root1",
  registryDigest: "a".repeat(64),
  projectIds: mockQualificationProjects.map((p) => p.declaration.id),
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  projects: [],
  summary: { passed: 12, findings: 0, limitations: 0, unsafeConfiguration: 0, sourceMutation: 0 },
  resultFingerprint: "b".repeat(64),
  passed: true,
};

test("evaluateV3Qualification passes when all targets, CI fixtures, and claim boundaries are met", () => {
  const report = evaluateV3Qualification(mockInspection, cleanDevReport, cleanDevReport);

  assert.equal(report.version, "1.0.0");
  assert.equal(report.passed, true);
  assert.equal(report.targets.eligibleProjectsCount, 12);
  assert.equal(report.targets.productDomainsCount, 6);
  assert.equal(report.targets.frontendStacksCount, 6);
  assert.equal(report.targets.interfaceArchetypesCount, 4);
  assert.equal(report.targets.lockedHoldoutProjectsCount, 3);
  assert.equal(report.targets.pathTypes.sourceOnly, true);
  assert.equal(report.targets.pathTypes.browserOnly, true);
  assert.equal(report.targets.pathTypes.fullStack, true);
  assert.equal(report.targets.sourceMutationViolations, 0);
  assert.equal(report.targets.privateLeakageViolations, 0);
  assert.equal(report.disallowedClaimsExcluded, true);
  assert.equal(report.supportedClaims.length, 4);
  assert.equal(report.disallowedClaimsDetected.length, 0);
});

test("evaluateV3Qualification fails if source root mutations or private leakage violations occur", () => {
  const mutatedReport: PortfolioBenchmarkReport = {
    ...cleanDevReport,
    summary: { passed: 10, findings: 1, limitations: 0, unsafeConfiguration: 0, sourceMutation: 1 },
  };

  const report = evaluateV3Qualification(mockInspection, mutatedReport, cleanDevReport);

  assert.equal(report.passed, false);
  assert.equal(report.targets.sourceMutationViolations, 1);
});

test("evaluateV3Qualification detects and rejects disallowed claims", () => {
  const customClaims = [
    "The benchmark runner operated non-destructively on the declared corpus.",
    "Claims independent human validation and representative user validation across all apps.",
    "Guarantees universal design quality.",
  ];

  const report = evaluateV3Qualification(
    mockInspection,
    cleanDevReport,
    cleanDevReport,
    undefined,
    customClaims,
  );

  assert.equal(report.passed, false);
  assert.equal(report.disallowedClaimsExcluded, false);
  assert.equal(report.disallowedClaimsDetected.length, 2);
  assert.ok(report.disallowedClaimsDetected.some((c) => c.includes("independent human validation")));
  assert.ok(report.disallowedClaimsDetected.some((c) => c.includes("universal design quality")));
});

test("evaluateV3Qualification verifies all 6 synthetic CI fixture categories", () => {
  const partialCiFixtures = {
    registryViolations: true,
    snapshotViolations: true,
    adapterCases: true,
    comparisonSafety: false, // failing category
    privacyBoundaries: true,
    rulePromotionPaths: true,
  };

  const report = evaluateV3Qualification(
    mockInspection,
    cleanDevReport,
    cleanDevReport,
    partialCiFixtures,
  );

  assert.equal(report.passed, false);
  assert.equal(report.ciFixtures.comparisonSafety, false);
});
