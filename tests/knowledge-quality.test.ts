import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import YAML from "yaml";

import { evaluateKnowledgeQuality } from "../src/knowledge-quality/evaluator.js";
import { loadKnowledgeQualityManifest } from "../src/knowledge-quality/loader.js";

const manifestPath = "knowledge-base/benchmarks/knowledge-quality/knowledge-quality.yaml";

test("maintained knowledge-quality benchmark passes every V5 dimension", async () => {
  const report = await evaluateKnowledgeQuality(manifestPath, process.cwd());

  assert.equal(report.passed, true);
  assert.equal(report.authorityPath, "SKILL.md");
  assert.equal(report.compiledAuthority.lifecycle, "shadow");
  assert.equal(report.compiledAuthority.admittedFileCount, 142);
  assert.equal(report.compiledAuthority.retrievalFileCount, 25);
  assert.ok(report.compiledAuthority.ruleCount >= 248);
  assert.equal(report.qualityBreakdown.sourceQuality, "pass");
  assert.equal(report.qualityBreakdown.retrievalQuality, "pass");
  assert.equal(report.qualityBreakdown.ruleQuality, "pass");
  assert.equal(report.qualityBreakdown.productOutcome, "pass");
  assert.equal(report.caseResults.length, 6);
  assert.ok(report.caseResults.every((entry) => entry.passed));
});

test("knowledge-quality loader rejects traversal outside the repository", async () => {
  await assert.rejects(
    () => loadKnowledgeQualityManifest("../outside.yaml", process.cwd()),
    /escapes|resolves outside/,
  );
});

test("knowledge-quality evaluation catches rule provenance and conflict drift", async () => {
  const runtimeRoot = join(process.cwd(), ".ztothez-design-runtime");
  await mkdir(runtimeRoot, { recursive: true });
  const root = await mkdtemp(join(runtimeRoot, "knowledge-quality-"));
  try {
    await mkdir(join(root, "knowledge-base", "benchmarks", "knowledge-quality"), { recursive: true });
    const manifest = YAML.parse(await readFile(manifestPath, "utf8"));
    manifest.cases = [
      {
        id: "missing-rule",
        kind: "rule-provenance",
        dimension: "rule-quality",
        source: "compiled-authority",
        rationale: "Negative fixture proves missing registered rules fail.",
        ruleIds: ["ZTDE-NOTREAL-999"],
        expected: {
          categories: ["accessibility"],
          modelLinks: ["ZTDE-MODEL-A11Y-001"],
          requireSourceIds: true,
          forbidPrivateFallback: true,
        },
      },
      {
        id: "bad-conflict",
        kind: "conflict",
        dimension: "rule-quality",
        source: "v5-roadmap",
        rationale: "Negative fixture proves wrong precedence fails.",
        conflictId: "ZTDE-MODEL-CONFLICT-001",
        expected: {
          higherPriorityEntity: "ZTDE-MODEL-VISUAL-001",
          lowerPriorityEntity: "ZTDE-MODEL-A11Y-001",
          resolutionIncludes: ["not-present"],
          evidenceClasses: ["representative-user-testing"],
        },
      },
      {
        id: "retrieve-gap",
        kind: "retrieval",
        dimension: "retrieval-quality",
        source: "v5-roadmap",
        rationale: "Keep non-rule dimensions present so schema remains valid.",
        query: "private archived raw source exact paragraph unavailable zxqv",
        categories: ["architecture"],
        expected: { status: "no-match" },
      },
      {
        id: "source-pass",
        kind: "supersession",
        dimension: "source-quality",
        source: "public-boundary",
        rationale: "Keep source dimension present so schema remains valid.",
        removedArtifactIndex: 0,
        expected: {
          replacementPaths: ["knowledge-base/maintained/architecture/MASTER.md"],
          removedFromCurrentTree: true,
          removedFromRetrieval: true,
          removedFromPackage: true,
          removedFromAdmission: true,
        },
      },
      {
        id: "product-pass",
        kind: "model-parity",
        dimension: "product-outcome",
        source: "compiled-authority",
        rationale: "Keep product dimension present so schema remains valid.",
        traceId: "ZTDE-MODEL-TRACE-001",
        expected: {
          orderedEntities: [
            "ZTDE-MODEL-ARCHETYPE-001",
            "ZTDE-MODEL-TASK-001",
            "ZTDE-MODEL-STATE-001",
            "ZTDE-MODEL-INFO-001",
            "ZTDE-MODEL-COMPONENT-001",
          ],
          verificationRefs: ["ZTDE-MODEL-VERIFY-001"],
          retrievalPaths: ["knowledge-base/design-intelligence/information-design.md"],
        },
      },
    ];
    const fixturePath = join(root, "knowledge-base", "benchmarks", "knowledge-quality", "knowledge-quality.yaml");
    await writeFile(fixturePath, YAML.stringify(manifest), "utf8");

    const report = await evaluateKnowledgeQuality(fixturePath, process.cwd());
    assert.equal(report.passed, false);
    assert.equal(report.qualityBreakdown.ruleQuality, "fail");
    assert.ok(report.caseResults.some((entry) => entry.id === "missing-rule" && !entry.passed));
    assert.ok(report.caseResults.some((entry) => entry.id === "bad-conflict" && !entry.passed));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("knowledge-quality CLI emits machine-readable pass output", () => {
  const result = spawnSync(process.execPath, [join(process.cwd(), "dist", "cli", "evaluate-knowledge-quality.js"), "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.passed, true);
  assert.equal(report.qualityBreakdown.ruleQuality, "pass");
});
