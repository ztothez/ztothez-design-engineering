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

const benchmarkDirectory = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "azure-optimizer",
);
const contractPath = join(benchmarkDirectory, "product-contract.yaml");
const journeyPath = join(benchmarkDirectory, "journeys.json");
const v2JourneyPath = join(benchmarkDirectory, "v2-journeys.json");
const v4CalibrationReportPath = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "interface-quality",
  "evidence",
  "v4-calibration-report.json",
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
  const historical = JSON.parse(await readFile(journeyPath, "utf8")) as {
    version: string;
    profiles: Array<{ journeys: Array<{ interaction?: unknown }> }>;
  };
  assert.equal(historical.version, "1.0");
  assert.ok(historical.profiles.every((profile) => profile.journeys.every((journey) => !journey.interaction)));
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

test("Azure locked holdout qualifies disconnected recovery without changing its historical suite", async () => {
  const report = await validateProductContract(
    join(benchmarkDirectory, "interaction-product-contract.yaml"),
    { projectRoot: process.cwd() },
  );
  assert.equal(report.passed, true, JSON.stringify(report.issues, null, 2));
  assert.equal(report.taskModel.status, "ready");
  assert.equal(report.taskModel.primaryTasks, 1);
  assert.equal(report.taskModel.recoveryTasks, 1);

  const selection = await loadRuntimeJourneySelection(
    join(benchmarkDirectory, "interaction-journeys.json"),
    "holdout-interaction-qualification",
  );
  assert.deepEqual(
    selection.journeys[0]?.steps.filter((step) => step.action === "checkpoint").map((step) => step.checkpoint),
    ["start", "disconnected", "failure", "preserved-state", "success"],
  );
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

test("Azure V4 public calibration summary preserves retained evidence boundaries", async () => {
  const report = z.object({
    version: z.literal("1.0"),
    methodologyPath: z.literal("knowledge-base/benchmarks/azure-optimizer/v2-human-review-methodology.yaml"),
    reviewPath: z.literal("local-only-retained-review"),
    passed: z.boolean(),
    releaseReady: z.boolean(),
    findings: z.array(z.object({
      severity: z.enum(["info", "warning", "error"]),
      message: z.string(),
    })),
    summary: z.object({
      errors: z.number(),
      warnings: z.number(),
      requiredStages: z.number(),
      passedRequiredStages: z.number(),
      verifiedClaims: z.number(),
    }),
    stageResults: z.array(z.object({
      id: z.string(),
      required: z.boolean(),
      status: z.enum(["pass", "partial", "fail", "unverified"]),
    })),
    evidenceLevels: z.object({
      automated: z.number(),
      aiAssistedExpert: z.number(),
      humanExpert: z.number(),
      representativeUser: z.number(),
    }),
    humanReview: z.object({
      requirementsMet: z.boolean(),
      humanExpertSessions: z.number(),
      representativeUserSessions: z.number(),
    }),
    candidateResults: z.array(z.object({
      candidate: z.string(),
      categories: z.array(z.object({
        category: z.string(),
        score: z.number(),
        samples: z.number(),
      })),
    })),
    benchmarkDecision: z.object({
      configured: z.boolean(),
      passed: z.boolean(),
    }),
  }).parse(JSON.parse(await readFile(v4CalibrationReportPath, "utf8")));

  assert.equal(report.passed, true);
  assert.equal(report.releaseReady, false);
  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.verifiedClaims, 4);
  assert.equal(report.humanReview.requirementsMet, false);
  assert.equal(report.evidenceLevels.humanExpert, 1);
  assert.ok(report.stageResults.some((stage) => stage.id === "human-review" && stage.status === "partial"));
  assert.ok(report.findings.some((finding) => finding.severity === "warning"));
});
