import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { parse } from "yaml";

import { evaluateCorpusBenchmark } from "../src/corpus/evaluator.js";
import { loadCorpusManifest } from "../src/corpus/loader.js";
import { formatCorpusReport } from "../src/corpus/report.js";
import { corpusManifestSchema } from "../src/corpus/schema.js";

const manifestPath = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "corpus",
  "corpus.yaml",
);

test("maintained corpus passes every dimension and preserves scoring evidence", async () => {
  const report = await evaluateCorpusBenchmark(manifestPath, process.cwd());

  assert.equal(report.passed, true);
  assert.equal(report.sources, 4);
  assert.equal(report.sourceRecords.length, 4);
  assert.equal(
    report.sourceRecords.find((source) => source.id === "w3c-wcag-22")?.license,
    "W3C Document License 2015",
  );
  assert.equal(report.caseResults.length, 13);
  assert.equal(report.positiveCases, 8);
  assert.equal(report.negativeCases, 5);
  assert.equal(report.overallScore, 1);
  assert.equal(report.dimensions.length, 5);
  assert.ok(report.dimensions.every((dimension) => dimension.passed));
  assert.equal(
    report.dimensions.find((dimension) => dimension.dimension === "recommendation-relevance")
      ?.meanReciprocalRank,
    0.875,
  );
  assert.deepEqual(
    report.caseResults.find((entry) => entry.id === "architecture-mixed-monolith")?.ruleIds,
    ["ZTDE-ARCH-001", "ZTDE-ARCH-002", "ZTDE-DESIGN-001"],
  );
  assert.equal(
    report.caseResults.find((entry) => entry.id === "abstain-unrelated-domain")?.observed,
    "no-match",
  );
  assert.match(formatCorpusReport(report), /Result: PASS/);
});

test("corpus schema enforces provenance references and all five dimensions", async () => {
  const manifest = await loadCorpusManifest(manifestPath);
  const invalid = structuredClone(manifest);
  invalid.cases[0]!.source = "missing-source";
  invalid.cases = invalid.cases.filter((entry) => entry.dimension !== "abstention");

  const result = corpusManifestSchema.safeParse(invalid);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((issue) => issue.message.includes("Unknown provenance source")));
    assert.ok(result.error.issues.some((issue) => issue.message.includes("abstention")));
  }
});

test("portable corpus schema declares the versioned case contract", async () => {
  const schema = parse(
    await readFile(
      resolve(process.cwd(), "knowledge-base", "benchmarks", "corpus", "corpus.schema.yaml"),
      "utf8",
    ),
  ) as Record<string, unknown>;

  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.$id, "https://ztothez.dev/schemas/corpus-benchmark-1.0.schema.json");
  assert.ok(schema.$defs && typeof schema.$defs === "object");
});

test("corpus evaluator rejects manifests outside the project boundary", async () => {
  await assert.rejects(
    () => evaluateCorpusBenchmark("/tmp/outside-corpus.yaml", process.cwd()),
    /outside the project root|ENOENT/,
  );
});
