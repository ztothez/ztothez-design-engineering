import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { evaluateAcceptance } from "../src/acceptance/evaluator.js";
import type { AcceptanceAttestationFile } from "../src/acceptance/types.js";
import { inspectProductContract } from "../src/contracts/validator.js";
import type { RuntimeReport } from "../src/runtime/types.js";

const contractPath = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "aegisops",
  "product-contract.yaml",
);

function runtimeReport(profileJourney: string): RuntimeReport {
  return {
    version: "test",
    url: "http://127.0.0.1:3000/",
    generatedAt: new Date(0).toISOString(),
    browser: "Chromium test",
    outputDirectory: "/tmp/ztothez-design-acceptance-test",
    viewports: [
      { name: "mobile-375", width: 375, height: 812 },
      { name: "tablet-768", width: 768, height: 1024 },
      { name: "desktop-1024", width: 1024, height: 768 },
      { name: "wide-1440", width: 1440, height: 900 },
    ],
    screenshots: [
      { name: "mobile-375", path: "/tmp/mobile.png", width: 375, height: 812, fullPage: true },
      { name: "tablet-768", path: "/tmp/tablet.png", width: 768, height: 1024, fullPage: true },
      { name: "desktop-1024", path: "/tmp/desktop.png", width: 1024, height: 768, fullPage: true },
      { name: "wide-1440", path: "/tmp/wide.png", width: 1440, height: 900, fullPage: true },
    ],
    journeys: [
      {
        name: profileJourney,
        passed: true,
        stepsCompleted: 4,
        totalSteps: 4,
        evidence: [],
      },
    ],
    expectedNetwork: [],
    findings: [],
    summary: { errors: 0, warnings: 0, info: 0 },
    passed: true,
  };
}

test("acceptance evaluator passes and fails responsive criteria from runtime evidence", async () => {
  const inspection = await inspectProductContract(contractPath, { projectRoot: process.cwd() });
  assert.ok(inspection.contract && inspection.suite);
  const cleanRuntime = runtimeReport("overview-integrity");
  const passing = evaluateAcceptance({
    contract: inspection.contract,
    suite: inspection.suite,
    profile: "responsive-overview",
    contractReport: inspection.report,
    runtimeReport: cleanRuntime,
  });
  assert.equal(passing.passed, true);
  assert.equal(passing.criteria.length, 2);
  assert.ok(passing.criteria.every((criterion) => criterion.status === "pass"));

  const failing = evaluateAcceptance({
    contract: inspection.contract,
    suite: inspection.suite,
    profile: "responsive-overview",
    contractReport: inspection.report,
    runtimeReport: {
      ...cleanRuntime,
      findings: [
        {
          checkId: "ZTDE-RUNTIME-004",
          severity: "error",
          message: "Visible content is clipped.",
          evidence: ["right edge exceeds container"],
          viewport: "mobile-375",
        },
      ],
      summary: { errors: 1, warnings: 0, info: 0 },
      passed: false,
    },
  });
  assert.equal(failing.passed, false);
  assert.equal(
    failing.criteria.find((criterion) => criterion.id === "responsive-integrity")?.status,
    "fail",
  );
  assert.equal(
    failing.criteria.find((criterion) => criterion.id === "accessible-operation")?.status,
    "pass",
  );

  const inaccessible = evaluateAcceptance({
    contract: inspection.contract,
    suite: inspection.suite,
    profile: "responsive-overview",
    contractReport: inspection.report,
    runtimeReport: {
      ...cleanRuntime,
      findings: [
        {
          checkId: "ZTDE-RUNTIME-011",
          severity: "error",
          message: "Rendered text does not meet the minimum contrast ratio.",
          evidence: ["Measured 2.5:1; required 4.5:1."],
          viewport: "mobile-375",
        },
      ],
      summary: { errors: 1, warnings: 0, info: 0 },
      passed: false,
    },
  });
  assert.equal(inaccessible.passed, false);
  assert.equal(
    inaccessible.criteria.find((criterion) => criterion.id === "accessible-operation")?.status,
    "fail",
  );
  assert.equal(
    inaccessible.criteria.find((criterion) => criterion.id === "responsive-integrity")?.status,
    "pass",
  );
});

test("manual, network, and export criteria remain unverified until evidence exists", async () => {
  const inspection = await inspectProductContract(contractPath, { projectRoot: process.cwd() });
  assert.ok(inspection.contract && inspection.suite);
  const runtime = runtimeReport("single-technique-success");
  const unverified = evaluateAcceptance({
    contract: inspection.contract,
    suite: inspection.suite,
    profile: "demo-success",
    contractReport: inspection.report,
    runtimeReport: runtime,
  });
  assert.equal(unverified.passed, false);
  assert.ok(unverified.summary.blockerUnverified > 0);

  runtime.journeys[0]!.evidence = [
    { kind: "response", step: 3, description: "POST /run returned 200" },
    { kind: "download", step: 8, description: "Downloaded validation_T1059.001.json", path: "/tmp/report.json" },
  ];
  const attestations: AcceptanceAttestationFile = {
    version: "1.0",
    contract: "aegisops",
    attestations: [
      {
        criterion: "evidence-backed-results",
        status: "pass",
        reviewer: "Test reviewer",
        reviewedAt: "2026-08-25T12:00:00.000Z",
        notes: "Outputs trace to the selected scenario and observable list.",
        evidence: ["review://results"],
      },
      {
        criterion: "evidence-backed-metrics",
        status: "pass",
        reviewer: "Test reviewer",
        reviewedAt: "2026-08-25T12:00:00.000Z",
        notes: "Coverage and safety values trace to structured validator output.",
        evidence: ["review://metrics"],
      },
      {
        criterion: "authorized-scope",
        status: "pass",
        reviewer: "Test reviewer",
        reviewedAt: "2026-08-25T12:00:00.000Z",
        notes: "Generated content remains within known ATT&CK defensive scope.",
        evidence: ["review://scope"],
      },
    ],
  };
  const verified = evaluateAcceptance({
    contract: inspection.contract,
    suite: inspection.suite,
    profile: "demo-success",
    contractReport: inspection.report,
    runtimeReport: runtime,
    attestations,
  });
  assert.equal(verified.passed, true, JSON.stringify(verified.criteria, null, 2));
  assert.equal(verified.summary.unverified, 0);
});
