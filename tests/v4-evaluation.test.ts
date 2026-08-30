import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  evaluateV4BeforeAfter,
  loadV4EvaluationConfig,
} from "../src/evaluation/evaluator.js";

const configPath = resolve(process.cwd(), "knowledge-base/benchmarks/v4-evaluation.yaml");
const journeyByProfile: Record<string, string> = {
  "demo-success": "single-technique-success",
  "offline-recovery": "recover-from-api-failure",
  "interaction-qualification": "generate-recover-and-export",
  "guided-workshop": "complete-guided-production",
  "studio-export": "compose-save-export",
  "workshop-interaction-qualification": "recover-storage-and-complete-workshop",
  "studio-interaction-qualification": "recover-import-and-export-production",
  "ztothez-analysis": "run-ztothez-analysis",
  "holdout-interaction-qualification": "recover-disconnected-analysis",
};

function runtimeReport(profile: string) {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1024, height: 768 },
    { name: "wide", width: 1440, height: 1000 },
  ];
  return {
    version: "1.0.0",
    url: "http://127.0.0.1:4173",
    generatedAt: "2026-08-30T12:00:00.000Z",
    browser: "chromium",
    outputDirectory: profile,
    viewports,
    screenshots: viewports.map((viewport) => ({
      name: `${profile}-${viewport.name}`,
      path: `${profile}-${viewport.name}.png`,
      width: viewport.width,
      height: viewport.height,
      fullPage: true,
      sha256: "a".repeat(64),
      dynamicSelectors: [],
    })),
    screenshotRegression: { status: "not-configured", compared: 0, mismatches: [] },
    journeys: [{
      name: journeyByProfile[profile] ?? `${profile}-journey`,
      passed: true,
      stepsCompleted: 1,
      totalSteps: 1,
    }],
    expectedNetwork: [],
    findings: [],
    summary: { errors: 0, warnings: 0, info: 0 },
    passed: true,
    evidenceBoundary: {
      verifierLimitations: ["Representative-user comprehension requires separate evidence."],
      humanReviewRequired: ["No human review was generated."],
    },
  };
}

async function createEvidenceRoot() {
  const root = await mkdtemp(join(tmpdir(), "ztde-v4-evaluation-"));
  const config = await loadV4EvaluationConfig(configPath);
  for (const product of config.products) {
    const profiles = new Set(product.tasks.flatMap((task) => [...task.baselineProfiles, task.candidateProfile]));
    for (const profile of profiles) {
      const directory = join(root, product.evidenceDirectory, profile);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, "runtime-report.json"), `${JSON.stringify(runtimeReport(profile), null, 2)}\n`);
    }
  }
  return { root, config };
}

test("V4 evaluation promotes only a rule proven by development and locked holdout evidence", async (context) => {
  const { root, config } = await createEvidenceRoot();
  context.after(() => rm(root, { recursive: true, force: true }));

  const report = await evaluateV4BeforeAfter({ config, projectRoot: process.cwd(), evidenceRoot: root });
  assert.equal(report.passed, true, JSON.stringify(report, null, 2));
  assert.equal(report.criteria.lockedHoldoutPassing, true);
  assert.equal(report.criteria.noVanityScore, true);
  assert.deepEqual(report.promotedRules, ["task-bound-interaction-evidence"]);
  assert.equal(report.humanEvidence, "not-generated");
  assert.equal(report.calibration.releaseReady, false);
  assert.equal(report.calibration.disagreementPreserved, true);
  assert.ok(report.products.every((product) =>
    product.dimensions.find((dimension) => dimension.id === "visual-quality")?.status === "calibration-only",
  ));
  assert.ok(report.withheldRules.some((rule) => rule.id === "storage-failure-control"));
});

test("V4 evaluation fails closed and promotes nothing when locked holdout evidence is missing", async (context) => {
  const { root, config } = await createEvidenceRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await rm(join(root, "azure-optimizer", "holdout-interaction-qualification", "runtime-report.json"));

  const report = await evaluateV4BeforeAfter({ config, projectRoot: process.cwd(), evidenceRoot: root });
  assert.equal(report.passed, false);
  assert.equal(report.criteria.lockedHoldoutPassing, false);
  assert.deepEqual(report.promotedRules, []);
});

test("V4 evaluation requires the contract-bound journey in candidate evidence", async (context) => {
  const { root, config } = await createEvidenceRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  const reportPath = join(root, "azure-optimizer", "holdout-interaction-qualification", "runtime-report.json");
  await writeFile(reportPath, `${JSON.stringify(runtimeReport("unrelated-profile"), null, 2)}\n`);

  const report = await evaluateV4BeforeAfter({ config, projectRoot: process.cwd(), evidenceRoot: root });
  assert.equal(report.passed, false);
  assert.equal(report.criteria.lockedHoldoutPassing, false);
});

test("V4 evaluation configuration rejects traversal fixture paths", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-v4-evaluation-config-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(configPath, "utf8"));
  const invalidPath = join(root, "invalid.yaml");
  await writeFile(invalidPath, source.replace(
    "knowledge-base/benchmarks/v4-rule-fixtures/task-bound-interaction-positive.json",
    "../protected-source.json",
  ));
  await assert.rejects(loadV4EvaluationConfig(invalidPath), /repository-relative paths without traversal/);
});
