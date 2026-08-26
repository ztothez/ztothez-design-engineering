import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import {
  loadRuntimeJourneySelection,
  loadRuntimeJourneys,
} from "../src/contracts/journeys.js";
import { validateProductContract } from "../src/contracts/validator.js";

const benchmarkDirectory = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "aegisops",
);

test("AegisOPS benchmark product contract is internally consistent", async () => {
  const report = await validateProductContract(join(benchmarkDirectory, "product-contract.yaml"), {
    projectRoot: process.cwd(),
  });
  assert.equal(report.passed, true, JSON.stringify(report.issues, null, 2));
  assert.deepEqual(report.counts, {
    actors: 2,
    modes: 4,
    acceptanceCriteria: 9,
    journeyProfiles: 3,
    journeys: 3,
  });
});

test("AegisOPS journey profiles load as runtime journeys", async () => {
  const journeyFile = join(benchmarkDirectory, "journeys.json");
  const offline = await loadRuntimeJourneys(journeyFile, "offline-recovery");
  assert.equal(offline.length, 1);
  assert.equal(offline[0]?.name, "preserve-and-retry");
  assert.ok(offline[0]?.steps.some((step) => step.action === "expectValue"));
  const selection = await loadRuntimeJourneySelection(journeyFile, "offline-recovery");
  assert.deepEqual(
    selection.expectedNetwork.map((policy) => policy.id),
    ["health-unavailable", "pipeline-run-unavailable"],
  );
  await assert.rejects(
    () => loadRuntimeJourneys(journeyFile),
    /--profile is required/,
  );
  await assert.rejects(
    () => loadRuntimeJourneys(journeyFile, "missing-profile"),
    /Unknown journey profile/,
  );
});

test("product contract validator rejects missing files and broken references", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "ztothez-design-contract-test-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const contract = parse(
    await readFile(join(benchmarkDirectory, "product-contract.yaml"), "utf8"),
  ) as Record<string, any>;
  const journeys = await readFile(join(benchmarkDirectory, "journeys.json"), "utf8");
  contract.authority.precedence = [
    { path: "missing-source.md", role: "Missing fixture", authority: "primary" },
  ];
  contract.verification.journeyFile = "journeys.json";
  contract.verification.bindings[0].actor = "unknown-actor";
  contract.stateMachines[0].transitions[0].to = "unknown-state";
  await writeFile(join(directory, "product-contract.yaml"), stringify(contract), "utf8");
  await writeFile(join(directory, "journeys.json"), journeys, "utf8");

  const report = await validateProductContract(join(directory, "product-contract.yaml"), {
    projectRoot: directory,
  });
  assert.equal(report.passed, false);
  assert.ok(report.issues.some((entry) => entry.code === "CONTRACT-MISSING-SOURCE"));
  assert.ok(
    report.issues.some(
      (entry) => entry.code === "CONTRACT-UNKNOWN-REFERENCE" && entry.path.endsWith(".actor"),
    ),
  );
  assert.ok(
    report.issues.some(
      (entry) => entry.code === "CONTRACT-UNKNOWN-REFERENCE" && entry.path.endsWith(".to"),
    ),
  );
});
