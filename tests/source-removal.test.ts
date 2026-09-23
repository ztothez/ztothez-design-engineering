import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import YAML from "yaml";

import { qualifySourceRemoval } from "../src/source-removal/evaluator.js";

const manifestPath = "knowledge-base/benchmarks/source-removal/source-removal-qualification.yaml";

test("source-removal qualification proves admitted knowledge covers every V5 query class", async () => {
  const report = await qualifySourceRemoval(manifestPath, process.cwd());
  const classes = new Set(report.queryResults.map((entry) => entry.queryClass));

  assert.equal(report.passed, true);
  assert.equal(report.authorityPath, "SKILL.md");
  assert.equal(report.admittedFileCount, 142);
  assert.equal(report.retrievalFileCount, 25);
  assert.equal(report.removedArtifactCount, 46);
  assert.equal(report.privateSourcesUsed, false);
  assert.equal(report.referenceArchivesPresent, false);
  assert.equal(report.documentBoundaryRetainedForRollback, true);
  assert.equal(report.queryResults.every((entry) => entry.status === "pass"), true);
  for (const required of ["architecture", "figma", "product-pattern", "usability", "visual-polish", "provenance", "gap"]) {
    assert.equal(classes.has(required as never), true, required);
  }
  assert.ok(report.limitations.some((limitation) => limitation.includes("does not activate model cutover")));
});

test("source-removal qualification rejects unsupported manifest locations", async () => {
  await assert.rejects(
    () => qualifySourceRemoval("knowledge-base/benchmarks/corpus/corpus.yaml", process.cwd()),
    /outside the maintained benchmark directory/,
  );
});

test("source-removal qualification catches retrieval drift", async (context) => {
  const runtimeRoot = join(process.cwd(), ".ztothez-design-runtime");
  await mkdir(runtimeRoot, { recursive: true });
  const root = await mkdtemp(join(runtimeRoot, "source-removal-"));
  context.after(() => rm(root, { recursive: true, force: true }));

  const manifest = YAML.parse(await readFile(manifestPath, "utf8"));
  manifest.queryCases[0].expected.path = "knowledge-base/design-intelligence/visual-polish.md";
  await mkdir(join(root, "knowledge-base", "benchmarks", "source-removal"), { recursive: true });
  const fixturePath = join(root, "knowledge-base", "benchmarks", "source-removal", "source-removal-qualification.yaml");
  await writeFile(fixturePath, YAML.stringify(manifest), "utf8");

  const report = await qualifySourceRemoval(fixturePath, process.cwd());
  assert.equal(report.passed, false);
  assert.ok(report.queryResults.some((entry) => entry.status === "fail"));
});

test("source-removal CLI emits machine-readable pass output", () => {
  const result = spawnSync(process.execPath, [join(process.cwd(), "dist", "cli", "qualify-source-removal.js"), "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.passed, true);
  assert.equal(report.privateSourcesUsed, false);
});
