import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  verifyEvidenceReferences,
  verifyQualificationEvidenceSemantics,
  verifyRulePromotionEvidenceSemantics,
} from "../src/portfolio/evidence.js";
import type { PortfolioBenchmarkReport } from "../src/portfolio/runner.js";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

test("evidence integrity accepts contained files with matching checksums", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-evidence-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "report.json"), "verified\n");

  const result = await verifyEvidenceReferences(root, {
    evidence: { path: "report.json", sha256: hash("verified\n") },
  });

  assert.deepEqual(result, { passed: true, checked: 1, failures: [] });
});

test("evidence integrity rejects checksum mismatch and symlink escape", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-evidence-root-"));
  const outside = await mkdtemp(join(tmpdir(), "ztde-evidence-outside-"));
  context.after(async () => {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  });
  await writeFile(join(root, "report.json"), "actual\n");
  await writeFile(join(outside, "private.json"), "private\n");
  await symlink(join(outside, "private.json"), join(root, "escaped.json"));

  const result = await verifyEvidenceReferences(root, {
    references: [
      { path: "report.json", sha256: hash("wrong\n") },
      { path: "escaped.json", sha256: hash("private\n") },
    ],
  });

  assert.equal(result.passed, false);
  assert.ok(result.failures.some((failure) => failure.includes("checksum mismatch")));
  assert.ok(result.failures.some((failure) => failure.includes("outside the evidence root")));
});

test("rule evidence semantics bind holdout status to candidate, run, project, and source digest", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-rule-semantics-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const digest = "a".repeat(64);
  const reportPath = "holdout.json";
  const holdoutEvaluation = {
    version: "1.0.0",
    candidateId: "rule-one",
    projectId: "holdout-one",
    reportCode: "ZTDE-SLOP-003",
    holdoutRunId: "holdout-run",
    sourceDigest: digest,
    ruleExecuted: true,
    applicable: true,
    status: "unaffected",
    findingIds: [],
    regressionGatesPassed: true,
    reason: "The applicable rule executed without a finding or regression.",
  };
  await writeFile(join(root, reportPath), JSON.stringify(holdoutEvaluation));
  const reference = { path: reportPath, sha256: hash(JSON.stringify(holdoutEvaluation)) };
  const fixture = (expected: "accepted" | "detected" | "abstained", source: string, fileName = "Action.tsx") => ({
    version: "1.0.0",
    ruleId: "ZTDE-SLOP-003",
    expected,
    applicable: expected !== "abstained",
    fileName,
    prefix: [source],
    repeat: { line: "", count: 0 },
    suffix: [],
  });
  const fixtureFiles = {
    positive: fixture("accepted", "export const Action = () => <button onClick={() => undefined}>Run</button>;"),
    negative: fixture("detected", "export const Action = () => <button>Run</button>;"),
    abstention: fixture("abstained", "export const Action = () => <button>Test</button>;", "Action.test.tsx"),
  };
  for (const [name, content] of Object.entries(fixtureFiles)) {
    await writeFile(join(root, `${name}.json`), JSON.stringify(content));
  }
  const fixtureReference = (name: keyof typeof fixtureFiles) => ({
    path: `${name}.json`,
    sha256: hash(JSON.stringify(fixtureFiles[name])),
  });
  const promotionGateIds = {
    "v1-v2": "gate-v1-v2",
    retrieval: "gate-retrieval",
    corpus: "gate-corpus",
    mcp: "gate-mcp",
    package: "gate-package",
    independence: "gate-independence",
  } as const;
  const gateReferences = new Map<string, { path: string; sha256: string }>();
  for (const [gate, id] of Object.entries(promotionGateIds)) {
    const stdoutPath = `${id}.stdout.txt`;
    const stderrPath = `${id}.stderr.txt`;
    await writeFile(join(root, stdoutPath), "passed\n");
    await writeFile(join(root, stderrPath), "");
    const report = {
      version: "1.0.0",
      id,
      command: ["node", "fixture.js"],
      startedAt: "2026-08-28T00:00:00.000Z",
      completedAt: "2026-08-28T00:00:01.000Z",
      exitCode: 0,
      passed: true,
      stdout: { path: stdoutPath, sha256: hash("passed\n") },
      stderr: { path: stderrPath, sha256: hash("") },
    };
    const gatePath = `${id}.json`;
    const gateContent = JSON.stringify(report);
    await writeFile(join(root, gatePath), gateContent);
    gateReferences.set(gate, { path: gatePath, sha256: hash(gateContent) });
  }
  const candidate = {
    id: "rule-one",
    title: "Rule one",
    category: "accessibility",
    dimension: "accessibility",
    reportCode: "ZTDE-SLOP-003",
    justification: { type: "standards-backed-safety", rationale: "Safety requirement.", safetyStandard: "WCAG 2.2" },
    authoredIndependently: true,
    positiveFixturePath: "positive.json",
    negativeFixturePath: "negative.json",
    abstentionPath: "abstention.json",
    authoringProjects: ["dev-one"],
  };
  const promotionEvidence = {
    version: "1.0.0",
    fixtures: {
      positive: { ...fixtureReference("positive"), outcome: "accepted" },
      negative: { ...fixtureReference("negative"), outcome: "detected" },
      abstention: { ...fixtureReference("abstention"), outcome: "abstained" },
    },
    existingGates: ["v1-v2", "retrieval", "corpus", "mcp", "package", "independence"].map((id) => ({
      id,
      passed: true,
      evidence: gateReferences.get(id)!,
    })),
    holdoutEvaluations: [{ projectId: "holdout-one", status: "unaffected", evidence: reference }],
    promotedArtifacts: { documentation: reference, test: reference, migrationGuidance: "Apply the rule and rerun verification." },
  };
  const holdoutReport = {
    runId: "holdout-run",
    cohort: "holdout",
    projects: [{ projectId: "holdout-one", sourceDigest: digest }],
  } as PortfolioBenchmarkReport;

  const passed = await verifyRulePromotionEvidenceSemantics(root, candidate, promotionEvidence, holdoutReport);
  assert.equal(passed.passed, true, passed.failures.join("; "));

  holdoutReport.projects[0]!.sourceDigest = "b".repeat(64);
  const failed = await verifyRulePromotionEvidenceSemantics(root, candidate, promotionEvidence, holdoutReport);
  assert.equal(failed.passed, false);
  assert.ok(failed.failures.some((failure) => failure.includes("source digest mismatch")));
});

test("qualification semantics validate referenced promotion report claims", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-qualification-semantics-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const promotion = {
    version: "1.1.0",
    candidateId: "rule-one",
    title: "Rule one",
    evaluatedAt: "2026-08-28T00:00:00.000Z",
    decision: "rejected",
    criteria: {
      c1_independentAuthoring: true,
      c2_recurrenceOrSafety: true,
      c3_positiveNegativeFixtures: true,
      c4_falsePositiveAnalysis: true,
      c5_existingTestsPass: false,
      c6_holdoutValidationPass: true,
      c7_sourceUnchanged: true,
    },
    holdoutImpact: [{ projectId: "holdout-one", status: "unaffected", details: "Verified." }],
    evaluationComplete: true,
    rejectionReason: "A required existing gate failed.",
    failureReasons: ["A required existing gate failed."],
    passed: false,
  };
  const content = JSON.stringify(promotion);
  await writeFile(join(root, "promotion.json"), content);
  const commandEvidence = async (id: string) => {
    const stdoutPath = `${id}.stdout.txt`;
    const stderrPath = `${id}.stderr.txt`;
    await writeFile(join(root, stdoutPath), `${id}: passed\n`);
    await writeFile(join(root, stderrPath), "");
    const report = {
      version: "1.0.0",
      id,
      command: ["node", "fixture.js"],
      startedAt: "2026-08-28T00:00:00.000Z",
      completedAt: "2026-08-28T00:00:01.000Z",
      exitCode: 0,
      passed: true,
      stdout: { path: stdoutPath, sha256: hash(`${id}: passed\n`) },
      stderr: { path: stderrPath, sha256: hash("") },
    };
    const reportContent = JSON.stringify(report);
    const path = `${id}.json`;
    await writeFile(join(root, path), reportContent);
    return { passed: true, evidence: { path, sha256: hash(reportContent) } };
  };
  const qualification = {
    version: "1.0.0",
    ciFixtures: {
      registryViolations: await commandEvidence("ci-registry-violations"),
      snapshotViolations: await commandEvidence("ci-snapshot-violations"),
      adapterCases: await commandEvidence("ci-adapter-cases"),
      comparisonSafety: await commandEvidence("ci-comparison-safety"),
      privacyBoundaries: await commandEvidence("ci-privacy-boundaries"),
      rulePromotionPaths: await commandEvidence("ci-rule-promotion-paths"),
    },
    releaseGates: {
      build: await commandEvidence("release-build"),
      typecheck: await commandEvidence("release-typecheck"),
      tests: await commandEvidence("release-tests"),
      packageCheck: await commandEvidence("release-package-check"),
      packageSmoke: await commandEvidence("release-package-smoke"),
      independence: await commandEvidence("release-independence"),
      corpus: await commandEvidence("release-corpus"),
      offlineRelease: await commandEvidence("release-offline"),
      archiveRemoval: await commandEvidence("release-archive-removal"),
    },
    benchmarkPaths: {
      browserOnly: await commandEvidence("benchmark-browser-only"),
      fullStack: await commandEvidence("benchmark-full-stack"),
    },
    promotionReports: [{
      candidateId: "rule-one", decision: "rejected", evaluationComplete: true,
      evidence: { path: "promotion.json", sha256: hash(content) },
    }],
    privateLeakageScan: await commandEvidence("private-leakage-scan"),
    claims: [],
  };

  assert.equal((await verifyQualificationEvidenceSemantics(root, qualification)).passed, true);
  qualification.promotionReports[0]!.decision = "promoted";
  const failed = await verifyQualificationEvidenceSemantics(root, qualification);
  assert.equal(failed.passed, false);
  assert.ok(failed.failures.some((failure) => failure.includes("promotion decision mismatch")));
});
