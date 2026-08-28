import assert from "node:assert/strict";
import test from "node:test";

import type { PortfolioRegistryInspection, ResolvedPortfolioProject } from "../src/portfolio/registry.js";
import type { PortfolioBenchmarkReport } from "../src/portfolio/runner.js";
import { evaluateRuleCandidate } from "../src/portfolio/promotion.js";
import type { RuleCandidate } from "../src/portfolio/promotion-schema.js";

const mockInspection: PortfolioRegistryInspection = {
  report: {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    counts: { roots: 1, projects: 4, enabled: 4, development: 2, holdout: 2, excluded: 0 },
    projects: [],
    issues: [],
    passed: true,
  },
  roots: [],
  projects: [
    {
      canonicalPath: "/home/user/dev-p1",
      root: { declaration: { id: "root1", class: "studio-portfolio", path: "/home/user", discoveryDepth: 4, excludes: [] }, canonicalPath: "/home/user" },
      declaration: {
        id: "dev-p1", root: "root1", path: "dev-p1", enabled: true, ownership: "first-party",
        confidentiality: "private-local", cohort: "development", publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
        product: { domain: "finance", archetype: "operational-dashboard", intendedUsers: ["analyst"], primaryTasks: ["task 1"] },
        technology: { framework: "react", packageManager: "npm", entrypoint: "src/index.ts" },
        capabilities: [{ stage: "source-audit", status: "supported", reason: "Audit" }],
        execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
        paths: { include: ["**"], exclude: [] }, source: { revisionPolicy: "capture-current", canonicalizationKey: "dev-p1" },
      },
    },
    {
      canonicalPath: "/home/user/dev-p2",
      root: { declaration: { id: "root1", class: "studio-portfolio", path: "/home/user", discoveryDepth: 4, excludes: [] }, canonicalPath: "/home/user" },
      declaration: {
        id: "dev-p2", root: "root1", path: "dev-p2", enabled: true, ownership: "first-party",
        confidentiality: "private-local", cohort: "development", publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
        product: { domain: "healthcare", archetype: "utility", intendedUsers: ["doctor"], primaryTasks: ["task 2"] },
        technology: { framework: "nextjs", packageManager: "npm", entrypoint: "src/index.ts" },
        capabilities: [{ stage: "source-audit", status: "supported", reason: "Audit" }],
        execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
        paths: { include: ["**"], exclude: [] }, source: { revisionPolicy: "capture-current", canonicalizationKey: "dev-p2" },
      },
    },
    {
      canonicalPath: "/home/user/dev-p3",
      root: { declaration: { id: "root1", class: "studio-portfolio", path: "/home/user", discoveryDepth: 4, excludes: [] }, canonicalPath: "/home/user" },
      declaration: {
        id: "dev-p3", root: "root1", path: "dev-p3", enabled: true, ownership: "first-party",
        confidentiality: "private-local", cohort: "development", publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
        product: { domain: "logistics", archetype: "content-site", intendedUsers: ["driver"], primaryTasks: ["task 3"] },
        technology: { framework: "static-web", packageManager: "none", entrypoint: "index.html" },
        capabilities: [{ stage: "source-audit", status: "supported", reason: "Audit" }],
        execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
        paths: { include: ["**"], exclude: [] }, source: { revisionPolicy: "capture-current", canonicalizationKey: "dev-p3" },
      },
    },
    {
      canonicalPath: "/home/user/holdout-p1",
      root: { declaration: { id: "root1", class: "studio-portfolio", path: "/home/user", discoveryDepth: 4, excludes: [] }, canonicalPath: "/home/user" },
      declaration: {
        id: "holdout-p1", root: "root1", path: "holdout-p1", enabled: true, ownership: "first-party",
        confidentiality: "private-local", cohort: "holdout", publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
        product: { domain: "retail", archetype: "utility", intendedUsers: ["shopper"], primaryTasks: ["task 4"] },
        technology: { framework: "angular", packageManager: "npm", entrypoint: "src/index.ts" },
        capabilities: [{ stage: "source-audit", status: "supported", reason: "Audit" }],
        execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
        paths: { include: ["**"], exclude: [] }, source: { revisionPolicy: "capture-current", canonicalizationKey: "holdout-p1" },
      },
    },
  ],
};

const devReport: PortfolioBenchmarkReport = {
  version: "1.2.0",
  toolVersion: "2.0.0",
  runId: "dev-run-1",
  mode: "cohort",
  registryId: "root1",
  registryDigest: "a".repeat(64),
  projectIds: ["dev-p1", "dev-p2", "dev-p3"],
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  projects: [],
  summary: { passed: 3, findings: 0, limitations: 0, unsafeConfiguration: 0, sourceMutation: 0 },
  resultFingerprint: "b".repeat(64),
  passed: true,
};

const holdoutReport: PortfolioBenchmarkReport = {
  version: "1.2.0",
  toolVersion: "2.0.0",
  runId: "holdout-run-1",
  mode: "cohort",
  registryId: "root1",
  registryDigest: "a".repeat(64),
  projectIds: ["holdout-p1"],
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  projects: [],
  summary: { passed: 1, findings: 0, limitations: 0, unsafeConfiguration: 0, sourceMutation: 0 },
  resultFingerprint: "c".repeat(64),
  passed: true,
};

test("candidate rule meeting all 7 criteria promotes successfully with migration guidance", () => {
  const candidate: RuleCandidate = {
    id: "rule-cand-001",
    title: "Enforce ARIA Live Regions on Dynamic Notifications",
    category: "accessibility",
    dimension: "accessibility",
    reportCode: "A11Y-LIVE-REGION",
    justification: {
      type: "cohort-recurrence",
      rationale: "Discovered across finance, healthcare, and logistics dev projects.",
    },
    authoredIndependently: true,
    positiveFixturePath: "fixtures/a11y-live-region/pass.html",
    negativeFixturePath: "fixtures/a11y-live-region/fail.html",
    abstentionPath: "fixtures/a11y-live-region/abstain.md",
    authoringProjects: ["dev-p1", "dev-p2", "dev-p3"],
  };

  const report = evaluateRuleCandidate(candidate, mockInspection, devReport, holdoutReport);

  assert.equal(report.version, "1.0.0");
  assert.equal(report.candidateId, "rule-cand-001");
  assert.equal(report.decision, "promoted");
  assert.equal(report.passed, true);
  assert.equal(report.criteria.c1_independentAuthoring, true);
  assert.equal(report.criteria.c2_recurrenceOrSafety, true);
  assert.equal(report.criteria.c3_positiveNegativeFixtures, true);
  assert.equal(report.criteria.c4_falsePositiveAnalysis, true);
  assert.equal(report.criteria.c5_existingTestsPass, true);
  assert.equal(report.criteria.c6_holdoutValidationPass, true);
  assert.equal(report.criteria.c7_sourceUnchanged, true);

  assert.ok(report.promotedArtifacts);
  assert.equal(report.promotedArtifacts?.reportCode, "A11Y-LIVE-REGION");
  assert.ok(report.promotedArtifacts?.migrationGuidance);
});

test("candidate rule justified by standards-backed safety promotes successfully", () => {
  const candidate: RuleCandidate = {
    id: "rule-cand-002",
    title: "Prohibit Plaintext Secret Logging",
    category: "security",
    dimension: "interface-trust",
    reportCode: "TRUST-SECRET-LOG",
    justification: {
      type: "standards-backed-safety",
      rationale: "Mandated by NIST SP 800-53 security requirements.",
      safetyStandard: "NIST SP 800-53 IA-2",
    },
    authoredIndependently: true,
    positiveFixturePath: "fixtures/secret-log/pass.ts",
    negativeFixturePath: "fixtures/secret-log/fail.ts",
    abstentionPath: "fixtures/secret-log/abstain.md",
    authoringProjects: ["dev-p1"],
  };

  const report = evaluateRuleCandidate(candidate, mockInspection, devReport, holdoutReport);

  assert.equal(report.decision, "promoted");
  assert.equal(report.passed, true);
  assert.equal(report.criteria.c2_recurrenceOrSafety, true);
});

test("candidate rule lacking recurrence and safety standard is rejected with preserved reason", () => {
  const candidate: RuleCandidate = {
    id: "rule-cand-003",
    title: "Custom Unsubstantiated Layout Rule",
    category: "visual-polish",
    dimension: "visual-polish",
    reportCode: "VISUAL-CUSTOM-MARGIN",
    justification: {
      type: "cohort-recurrence",
      rationale: "Only found in one single project.",
    },
    authoredIndependently: true,
    positiveFixturePath: "fixtures/visual/pass.css",
    negativeFixturePath: "fixtures/visual/fail.css",
    abstentionPath: "fixtures/visual/abstain.md",
    authoringProjects: ["dev-p1"],
  };

  const report = evaluateRuleCandidate(candidate, mockInspection, devReport, holdoutReport);

  assert.equal(report.decision, "rejected");
  assert.equal(report.passed, false);
  assert.equal(report.criteria.c2_recurrenceOrSafety, false);
  assert.ok(report.rejectionReason?.includes("lacks 3+ project recurrence"));
  assert.equal(report.promotedArtifacts, undefined);
});

test("candidate rule causing regression on holdout project is rejected", () => {
  const candidate: RuleCandidate = {
    id: "rule-cand-004",
    title: "Overly Strict Font Family Enforcement",
    category: "visual-polish",
    dimension: "visual-polish",
    reportCode: "VISUAL-FONT-STRICT",
    justification: {
      type: "cohort-recurrence",
      rationale: "Tested in dev cohort.",
    },
    authoredIndependently: true,
    positiveFixturePath: "fixtures/font/pass.css",
    negativeFixturePath: "fixtures/font/fail.css",
    abstentionPath: "fixtures/font/abstain.md",
    authoringProjects: ["dev-p1", "dev-p2", "dev-p3"],
  };

  const regressedHoldoutReport: PortfolioBenchmarkReport = {
    ...holdoutReport,
    projects: [
      {
        projectId: "holdout-p1",
        cohort: "holdout",
        environmentPolicy: { network: "denied", lifecycleScripts: false, environmentVariables: [] },
        commands: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        stages: [
          {
            stage: "browser-journeys",
            status: "failed",
            reason: "Font check failed.",
            findingDetails: [
              { source: "visual", id: "VISUAL-FONT-STRICT", severity: "error", message: "Font family mismatch." },
            ],
          },
        ],
        artifacts: [],
        status: "findings",
      },
    ],
  };

  const report = evaluateRuleCandidate(candidate, mockInspection, devReport, regressedHoldoutReport);

  assert.equal(report.decision, "rejected");
  assert.equal(report.criteria.c6_holdoutValidationPass, false);
  assert.equal(report.holdoutImpact.find((h) => h.projectId === "holdout-p1")?.status, "regressed");
});
