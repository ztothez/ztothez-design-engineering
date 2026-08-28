import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

import { parse } from "yaml";
import { z } from "zod";

import {
  loadRuntimeJourneySelection,
  loadRuntimeJourneys,
} from "../src/contracts/journeys.js";
import type { ProductContract } from "../src/contracts/schema.js";
import { validateProductContract } from "../src/contracts/validator.js";
import {
  runtimeReportSchema,
  runtimeScreenshotBaselineSchema,
} from "../src/runtime/schema.js";

const benchmarkDirectory = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "azure-optimizer",
);
const contractPath = join(benchmarkDirectory, "product-contract.yaml");
const journeyPath = join(benchmarkDirectory, "journeys.json");
const v2JourneyPath = join(benchmarkDirectory, "v2-journeys.json");
const v2EvidenceDirectory = resolve(
  process.cwd(),
  "evidence",
  "interface-quality",
  "azure-v2",
);

test("Azure Optimizer comparison contract is internally consistent", async () => {
  const report = await validateProductContract(contractPath, { projectRoot: process.cwd() });
  assert.equal(report.passed, true, JSON.stringify(report.issues, null, 2));
  assert.deepEqual(report.counts, {
    actors: 1,
    modes: 3,
    acceptanceCriteria: 6,
    journeyProfiles: 5,
    journeys: 5,
  });
});

test("Azure candidates use isolated journey profiles under one task contract", async () => {
  const profiles = [
    "overview-baseline",
    "original-analysis",
    "lovable-analysis",
    "uiux-analysis",
    "ztothez-analysis",
  ];
  for (const profile of profiles) {
    const journeys = await loadRuntimeJourneys(journeyPath, profile);
    assert.equal(journeys.length, 1, profile);
    assert.ok(journeys[0]!.steps.length >= 2, profile);
  }

  const contract = parse(await readFile(contractPath, "utf8")) as ProductContract;
  assert.ok(contract.authority.precedence.every((entry) => !entry.path.startsWith("/")));
  assert.ok(contract.constraints.prohibitedClaims.some((claim) => claim.includes("Human approval")));
});

test("Azure V2 state matrix retains the required product journeys and failure policy", async () => {
  const selection = await loadRuntimeJourneySelection(v2JourneyPath, "azure-v2-state-matrix");

  assert.equal(selection.journeys.length, 9);
  assert.deepEqual(
    selection.journeys.map((journey) => journey.name),
    [
      "demo-success",
      "live-connected",
      "slow-analysis",
      "backend-failure-fallback",
      "disconnected-recovery",
      "partial-result",
      "stale-result",
      "finding-detail-history",
      "export-provenance",
    ],
  );
  assert.deepEqual(selection.expectedNetwork, [
    {
      id: "disclosed-fallback-failure",
      method: "POST",
      urlIncludes: "/api/analyze?scenario=fallback",
      status: 503,
      minOccurrences: 1,
      maxOccurrences: 1,
    },
  ]);
});

test("Azure V2 retained evidence is complete and machine-valid", async () => {
  const baseline = runtimeScreenshotBaselineSchema.parse(
    JSON.parse(await readFile(join(v2EvidenceDirectory, "screenshot-baseline.json"), "utf8")),
  );
  const report = z.object(runtimeReportSchema).parse(
    JSON.parse(await readFile(join(v2EvidenceDirectory, "final", "runtime-report.json"), "utf8")),
  );

  assert.equal(baseline.screenshots.length, 40);
  assert.ok(
    baseline.screenshots.every(
      (screenshot) => screenshot.dynamicSelectors.length === 1
        && screenshot.dynamicSelectors[0] === ".dynamic-value",
    ),
  );
  assert.equal(report.passed, true);
  assert.equal(report.journeys.length, 9);
  assert.ok(report.journeys.every((journey) => journey.passed));
  assert.equal(report.screenshots.length, 40);
  assert.equal(report.screenshotRegression.status, "matched");
  assert.equal(report.screenshotRegression.compared, 40);
  assert.deepEqual(report.screenshotRegression.mismatches, []);
  assert.deepEqual(report.findings, []);
  assert.ok(report.expectedNetwork.every((policy) => policy.satisfied));
});
