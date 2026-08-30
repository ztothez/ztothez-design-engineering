import assert from "node:assert/strict";
import test from "node:test";

import type { PortfolioBenchmarkReport } from "../src/portfolio/runner.js";
import type { ResolvedPortfolioProject } from "../src/portfolio/registry.js";
import {
  evaluateCrossProductTaxonomy,
  validateCrossProjectComparison,
} from "../src/portfolio/taxonomy.js";
import type { MaintainerAnnotation } from "../src/portfolio/taxonomy-schema.js";

const sampleReport: PortfolioBenchmarkReport = {
  version: "1.2.0",
  toolVersion: "2.0.3",
  runId: "run-test-cross-123",
  mode: "cohort",
  registryId: "test-reg",
  registryDigest: "a".repeat(64),
  projectIds: ["proj-alpha", "proj-beta"],
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  projects: [
    {
      projectId: "proj-alpha",
      cohort: "development",
      adapter: "react-vite",
      sourceDigest: "b".repeat(64),
      environmentPolicy: { network: "denied", lifecycleScripts: false, environmentVariables: [] },
      commands: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      stages: [
        { stage: "source-audit", status: "passed", reason: "Audit passed." },
        {
          stage: "browser-journeys",
          status: "failed",
          reason: "Product finding reported.",
          findings: 2,
          findingDetails: [
            { source: "runtime", id: "A11Y-KEYBOARD-FOCUS", severity: "error", message: "Focus trap detected on modal." },
            { source: "architecture", id: "UNCLEAN-CIRCULAR-IMPORT", severity: "warning", message: "Circular import found." },
          ],
          viewports: [{ name: "desktop", width: 1280, height: 800 }],
        },
      ],
      artifacts: [],
      status: "findings",
    },
    {
      projectId: "proj-beta",
      cohort: "development",
      adapter: "nextjs",
      sourceDigest: "c".repeat(64),
      environmentPolicy: { network: "denied", lifecycleScripts: false, environmentVariables: [] },
      commands: [],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      stages: [
        { stage: "source-audit", status: "passed", reason: "Audit passed." },
        {
          stage: "browser-journeys",
          status: "unsupported",
          reason: "No fixture server configured.",
          limitations: 1,
          findingDetails: [
            { source: "runtime", id: "A11Y-KEYBOARD-FOCUS", severity: "error", message: "Missing aria-label on button." },
          ],
        },
      ],
      artifacts: [],
      status: "limitations",
    },
  ],
  summary: { passed: 0, findings: 1, limitations: 1, unsafeConfiguration: 0, sourceMutation: 0 },
  resultFingerprint: "d".repeat(64),
  passed: false,
};

const sampleProjects: ResolvedPortfolioProject[] = [
  {
    canonicalPath: "/home/user/proj-alpha",
    root: { declaration: { id: "studio-clients", class: "studio-clients", path: "/home/user", discoveryDepth: 4, excludes: [] }, canonicalPath: "/home/user" },
    declaration: {
      id: "proj-alpha",
      root: "studio-clients",
      path: "alpha",
      enabled: true,
      ownership: "client-authorized",
      authorizationEvidence: "Contract #1",
      confidentiality: "private-local",
      cohort: "development",
      publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
      product: { domain: "finance", archetype: "operational-dashboard", intendedUsers: ["trader"], primaryTasks: ["view dashboard"] },
      technology: { framework: "react-vite", packageManager: "npm", entrypoint: "src/index.ts" },
      capabilities: [{ stage: "source-audit", status: "supported", reason: "Source available." }],
      execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
      paths: { include: ["**"], exclude: [] },
      source: { revisionPolicy: "capture-current", canonicalizationKey: "alpha" },
    },
  },
  {
    canonicalPath: "/home/user/proj-beta",
    root: { declaration: { id: "studio-personal", class: "studio-personal", path: "/home/user", discoveryDepth: 4, excludes: [] }, canonicalPath: "/home/user" },
    declaration: {
      id: "proj-beta",
      root: "studio-personal",
      path: "beta",
      enabled: true,
      ownership: "first-party",
      confidentiality: "private-local",
      cohort: "development",
      publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
      product: { domain: "healthcare", archetype: "utility", intendedUsers: ["doctor"], primaryTasks: ["lookup patient"] },
      technology: { framework: "nextjs", packageManager: "npm", entrypoint: "src/index.ts" },
      capabilities: [{ stage: "source-audit", status: "supported", reason: "Source available." }],
      execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false, allowedEnvironmentVariables: [], localPorts: [], commands: [] },
      paths: { include: ["**"], exclude: [] },
      source: { revisionPolicy: "capture-current", canonicalizationKey: "beta" },
    },
  },
];

test("evaluateCrossProductTaxonomy produces 9-dimension breakdown without single vanity score", () => {
  const result = evaluateCrossProductTaxonomy(sampleReport, sampleProjects);

  assert.equal(result.version, "1.0.0");
  assert.equal(result.projectsCount, 2);
  assert.equal(result.projectSummaries.length, 2);

  const alpha = result.projectSummaries.find((p) => p.projectId === "proj-alpha")!;
  assert.equal(alpha.domain, "finance");
  assert.equal(alpha.framework, "react-vite");
  assert.ok(alpha.dimensions["accessibility"]);
  assert.ok(alpha.dimensions["architecture"]);

  // Ensure 9 dimensions are all present in totals
  const dimensionsCount = Object.keys(result.dimensionTotals).length;
  assert.equal(dimensionsCount, 9);
});

test("evaluateCrossProductTaxonomy isolates limitations and abstentions from passes/failures", () => {
  const result = evaluateCrossProductTaxonomy(sampleReport, sampleProjects);
  const beta = result.projectSummaries.find((p) => p.projectId === "proj-beta")!;

  assert.equal(beta.totals.limitations, 1);
  // Limitations must not be counted as passes or findings in totals
  assert.equal(beta.dimensions["product-task"].limitations, 1);
  assert.equal(beta.dimensions["product-task"].passed, 0);
  assert.equal(beta.dimensions["product-task"].findings, 0);
});

test("evaluateCrossProductTaxonomy groups finding recurrence across projects and product domains", () => {
  const result = evaluateCrossProductTaxonomy(sampleReport, sampleProjects);

  const a11yRecurrence = result.recurrenceTaxonomy.find((r) => r.ruleId === "A11Y-KEYBOARD-FOCUS");
  assert.ok(a11yRecurrence);
  assert.equal(a11yRecurrence.totalOccurrences, 2);
  assert.deepEqual(a11yRecurrence.affectedProjects, ["proj-alpha", "proj-beta"]);
  assert.deepEqual(a11yRecurrence.affectedDomains, ["finance", "healthcare"]);
});

test("evaluateCrossProductTaxonomy preserves maintainer false positive annotations without finding deletion", () => {
  const annotations: MaintainerAnnotation[] = [
    {
      ruleId: "A11Y-KEYBOARD-FOCUS",
      projectId: "proj-alpha",
      type: "false-positive",
      rationale: "Modal focus trap is handled by custom trigger ref.",
      reviewedBy: "ZtotheZ Maintainer",
      reviewedAt: new Date().toISOString(),
    },
  ];

  const result = evaluateCrossProductTaxonomy(sampleReport, sampleProjects, annotations);
  assert.equal(result.annotations.supplied, 1);
  assert.equal(result.annotations.confirmedFalsePositives, 1);
  assert.equal(result.annotations.confirmedFalseNegatives, 0);

  // Original finding remains recorded in recurrence taxonomy
  const rec = result.recurrenceTaxonomy.find((r) => r.ruleId === "A11Y-KEYBOARD-FOCUS");
  assert.ok(rec);
  assert.equal(rec.totalOccurrences, 2);
});

test("validateCrossProjectComparison detects viewport, tool version, and mode mismatches", () => {
  const candidateReport: PortfolioBenchmarkReport = {
    ...sampleReport,
    toolVersion: "2.1.0-dev",
  };

  const validation = validateCrossProjectComparison(sampleReport, candidateReport);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((e) => e.includes("Tool version mismatch")));
});
