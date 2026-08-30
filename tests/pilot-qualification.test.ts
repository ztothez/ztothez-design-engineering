import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import {
  evaluatePilotQualification,
  loadPilotQualificationConfig,
} from "../src/pilots/qualification.js";

const configPath = resolve(process.cwd(), "knowledge-base/benchmarks/delivery-pilots.yaml");

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
    journeys: [{ name: `${profile}-journey`, passed: true, stepsCompleted: 1, totalSteps: 1 }],
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
  const root = await mkdtemp(join(tmpdir(), "ztde-v4-pilots-"));
  const config = await loadPilotQualificationConfig(configPath);
  for (const product of config.products) {
    for (const profile of [...product.profiles, ...(product.interactionProfiles ?? [])]) {
      const directory = join(root, product.evidenceDirectory, profile);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, "runtime-report.json"), `${JSON.stringify(runtimeReport(profile), null, 2)}\n`);
    }
  }
  return { root, config };
}

test("V4 pilot qualification requires three traceable contained product workflows", async (context) => {
  const { root, config } = await createEvidenceRoot();
  context.after(() => rm(root, { recursive: true, force: true }));

  const report = await evaluatePilotQualification({ config, projectRoot: process.cwd(), evidenceRoot: root });
  assert.equal(report.passed, true, JSON.stringify(report, null, 2));
  assert.equal(report.products.length, 3);
  assert.equal(report.criteria.threeProductDomains, true);
  assert.equal(report.criteria.humanEvidenceNotGenerated, true);
  assert.equal(report.humanEvidence, "not-generated");
  assert.ok(report.products.every((product) => product.sourcePolicyRestrictions.length === 1));
  assert.ok(report.products.every((product) => product.verifierLimitations.length === product.profiles.length));
});

test("V4 pilot qualification fails closed when browser evidence is missing", async (context) => {
  const { root, config } = await createEvidenceRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await rm(join(root, "scenestart", "studio-export", "runtime-report.json"));

  const report = await evaluatePilotQualification({ config, projectRoot: process.cwd(), evidenceRoot: root });
  assert.equal(report.passed, false);
  assert.equal(report.criteria.browserProfilesPassing, false);
  const sceneStart = report.products.find((product) => product.id === "scenestart");
  assert.ok(sceneStart?.systemDefects.some((finding) => finding.includes("browser report unavailable")));
  assert.equal(report.supportedClaims.length, 0);
});

test("pilot configuration rejects traversal paths", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-v4-pilot-config-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(configPath, "utf8"));
  const invalidPath = join(root, "invalid.yaml");
  await writeFile(invalidPath, source.replace("tests/fixtures/pilots/aegisops-fixture", "../protected-source"));
  await assert.rejects(loadPilotQualificationConfig(invalidPath), /repository-relative paths without traversal/);
});
