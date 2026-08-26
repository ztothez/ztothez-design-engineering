import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

import { parse } from "yaml";

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
  "scenestart",
);
const contractPath = join(benchmarkDirectory, "product-contract.yaml");
const journeyPath = join(benchmarkDirectory, "journeys.json");

test("SceneStart benchmark product contract is internally consistent", async () => {
  const report = await validateProductContract(contractPath, {
    projectRoot: process.cwd(),
  });
  assert.equal(report.passed, true, JSON.stringify(report.issues, null, 2));
  assert.deepEqual(report.counts, {
    actors: 3,
    modes: 4,
    acceptanceCriteria: 10,
    journeyProfiles: 4,
    journeys: 4,
  });
});

test("SceneStart profiles preserve product-specific journey evidence", async () => {
  const studio = await loadRuntimeJourneys(journeyPath, "studio-export");
  assert.equal(studio[0]?.name, "compose-save-export");
  assert.equal(
    studio[0]?.steps.filter((step) => step.action === "expectDownload").length,
    2,
  );

  const workshop = await loadRuntimeJourneys(journeyPath, "guided-workshop");
  assert.ok(
    workshop[0]?.steps.some(
      (step) => step.action === "expectValue" && step.value === "NOVA",
    ),
  );

  const learning = await loadRuntimeJourneys(journeyPath, "learning-persistence");
  assert.equal(
    learning[0]?.steps.filter((step) => step.action === "navigate").length,
    3,
  );

  const release = await loadRuntimeJourneySelection(journeyPath, "release-provenance");
  assert.equal(release.journeys[0]?.name, "document-asset-and-readme");
  assert.ok(
    release.journeys[0]?.steps.some(
      (step) => step.action === "expectDownload" && step.filenameIncludes === "readme.txt",
    ),
  );
});

test("SceneStart authority remains clean-room and repository-contained", async () => {
  const contract = parse(await readFile(contractPath, "utf8")) as ProductContract;
  assert.ok(
    contract.authority.precedence.every(
      (source) =>
        !source.path.startsWith("/") &&
        !source.path.toLowerCase().includes("external-design-reference") &&
        !source.path.toLowerCase().includes("external-ux-reference"),
    ),
  );
  assert.ok(
    contract.acceptanceCriteria.some(
      (criterion) =>
        criterion.id === "local-first-boundary" &&
        criterion.severity === "blocker" &&
        criterion.evidence.includes("manual-review"),
    ),
  );
});
