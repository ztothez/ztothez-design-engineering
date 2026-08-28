import { createHash } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";

import { auditRepository } from "../audit/scanner.js";
import {
  promotionReportSchema,
  ruleCandidateSchema,
  ruleFixtureSpecSchema,
  ruleHoldoutEvaluationReportSchema,
  rulePromotionEvidenceSchema,
} from "./promotion-schema.js";
import {
  qualificationCommandEvidenceReportSchema,
  qualificationEvidenceSchema,
} from "./qualification-schema.js";
import type { PortfolioBenchmarkReport } from "./runner.js";

export type EvidenceIntegrityResult = {
  passed: boolean;
  checked: number;
  failures: string[];
};

type EvidenceReference = { path: string; sha256: string };

const PROMOTION_GATE_REPORT_IDS = {
  "v1-v2": "gate-v1-v2",
  retrieval: "gate-retrieval",
  corpus: "gate-corpus",
  mcp: "gate-mcp",
  package: "gate-package",
  independence: "gate-independence",
} as const;

function collectReferences(value: unknown, references: EvidenceReference[]): void {
  if (Array.isArray(value)) {
    for (const entry of value) collectReferences(entry, references);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (typeof record.path === "string" && typeof record.sha256 === "string") {
    references.push({ path: record.path, sha256: record.sha256 });
  }
  for (const nested of Object.values(record)) collectReferences(nested, references);
}

function contained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (relation !== ".." && !relation.startsWith(`..${sep}`));
}

async function readContainedJson(rootPath: string, path: string): Promise<unknown> {
  const root = await realpath(rootPath);
  const lexicalPath = resolve(root, path);
  if (!contained(root, lexicalPath)) throw new Error("path escapes the evidence root");
  const canonicalPath = await realpath(lexicalPath);
  if (!contained(root, canonicalPath)) throw new Error("file resolves outside the evidence root");
  const file = await stat(canonicalPath);
  if (!file.isFile()) throw new Error("evidence reference is not a regular file");
  return JSON.parse(await readFile(canonicalPath, "utf8"));
}

export async function verifyEvidenceReferences(rootPath: string, input: unknown): Promise<EvidenceIntegrityResult> {
  const root = await realpath(rootPath);
  const references: EvidenceReference[] = [];
  collectReferences(input, references);
  const unique = new Map(references.map((reference) => [`${reference.path}:${reference.sha256}`, reference]));
  const failures: string[] = [];

  for (const reference of unique.values()) {
    const lexicalPath = resolve(root, reference.path);
    if (!contained(root, lexicalPath)) {
      failures.push(`${reference.path}: path escapes the evidence root`);
      continue;
    }
    const canonicalPath = await realpath(lexicalPath).catch(() => undefined);
    if (!canonicalPath || !contained(root, canonicalPath)) {
      failures.push(`${reference.path}: file is missing or resolves outside the evidence root`);
      continue;
    }
    const file = await stat(canonicalPath).catch(() => undefined);
    if (!file?.isFile()) {
      failures.push(`${reference.path}: evidence reference is not a regular file`);
      continue;
    }
    const actual = createHash("sha256").update(await readFile(canonicalPath)).digest("hex");
    if (actual !== reference.sha256) failures.push(`${reference.path}: checksum mismatch`);
  }

  if (unique.size === 0) failures.push("No checksummed evidence references were supplied.");
  return { passed: failures.length === 0, checked: unique.size, failures };
}

export async function verifyRulePromotionEvidenceSemantics(
  rootPath: string,
  candidateInput: unknown,
  evidenceInput: unknown,
  holdoutReport?: PortfolioBenchmarkReport,
): Promise<EvidenceIntegrityResult> {
  const candidateResult = ruleCandidateSchema.safeParse(candidateInput);
  const evidenceResult = rulePromotionEvidenceSchema.safeParse(evidenceInput);
  const failures: string[] = [];
  if (!candidateResult.success) failures.push("Candidate rule is invalid.");
  if (!evidenceResult.success) failures.push("Rule-promotion evidence is invalid.");
  if (!holdoutReport || holdoutReport.cohort !== "holdout") failures.push("A holdout cohort report is required.");
  if (!candidateResult.success || !evidenceResult.success || !holdoutReport || holdoutReport.cohort !== "holdout") {
    return { passed: false, checked: 0, failures };
  }

  const fixtureEntries = [
    evidenceResult.data.fixtures.positive,
    evidenceResult.data.fixtures.negative,
    evidenceResult.data.fixtures.abstention,
  ];
  for (const fixtureReference of fixtureEntries) {
    const temporary = await mkdtemp(join(tmpdir(), "ztde-rule-fixture-"));
    try {
      const fixture = ruleFixtureSpecSchema.parse(
        await readContainedJson(rootPath, fixtureReference.path),
      );
      if (fixture.ruleId !== candidateResult.data.reportCode) {
        failures.push(`${fixtureReference.path}: fixture rule ID mismatch`);
        continue;
      }
      if (fixture.expected !== fixtureReference.outcome) {
        failures.push(`${fixtureReference.path}: fixture outcome mismatch`);
        continue;
      }
      const source = [...fixture.prefix, ...Array(fixture.repeat.count).fill(fixture.repeat.line), ...fixture.suffix].join("\n");
      await writeFile(join(temporary, fixture.fileName), `${source}\n`);
      const audit = await auditRepository(temporary, {
        requiredPackageScripts: [],
        requiredPackageScriptGroups: [],
      });
      const detected = audit.findings.some((finding) => finding.ruleId === candidateResult.data.reportCode);
      if (fixture.expected === "detected" && !detected) failures.push(`${fixtureReference.path}: candidate rule was not detected`);
      if (fixture.expected !== "detected" && detected) failures.push(`${fixtureReference.path}: candidate rule produced an unexpected finding`);
    } catch (error) {
      failures.push(`${fixtureReference.path}: invalid executable fixture (${error instanceof Error ? error.message : String(error)})`);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }

  for (const gate of evidenceResult.data.existingGates) {
    try {
      const report = qualificationCommandEvidenceReportSchema.parse(
        await readContainedJson(rootPath, gate.evidence.path),
      );
      if (report.id !== PROMOTION_GATE_REPORT_IDS[gate.id]) {
        failures.push(`${gate.evidence.path}: promotion gate evidence ID mismatch`);
      }
      if (report.passed !== gate.passed) {
        failures.push(`${gate.evidence.path}: promotion gate pass mismatch`);
      }
      const logs = await verifyEvidenceReferences(rootPath, { stdout: report.stdout, stderr: report.stderr });
      failures.push(...logs.failures.map((failure) => `${gate.evidence.path}: ${failure}`));
    } catch (error) {
      failures.push(`${gate.evidence.path}: invalid promotion gate report (${error instanceof Error ? error.message : String(error)})`);
    }
  }

  for (const evaluation of evidenceResult.data.holdoutEvaluations) {
    try {
      const parsed = ruleHoldoutEvaluationReportSchema.parse(
        await readContainedJson(rootPath, evaluation.evidence.path),
      );
      const retained = holdoutReport.projects.find((project) => project.projectId === evaluation.projectId);
      if (parsed.candidateId !== candidateResult.data.id) failures.push(`${evaluation.evidence.path}: candidate ID mismatch`);
      if (parsed.projectId !== evaluation.projectId) failures.push(`${evaluation.evidence.path}: project ID mismatch`);
      if (parsed.reportCode !== candidateResult.data.reportCode) failures.push(`${evaluation.evidence.path}: report code mismatch`);
      if (parsed.holdoutRunId !== holdoutReport.runId) failures.push(`${evaluation.evidence.path}: holdout run ID mismatch`);
      if (parsed.status !== evaluation.status) failures.push(`${evaluation.evidence.path}: holdout status mismatch`);
      if (!retained?.sourceDigest || parsed.sourceDigest !== retained.sourceDigest) {
        failures.push(`${evaluation.evidence.path}: source digest mismatch`);
      }
    } catch (error) {
      failures.push(`${evaluation.evidence.path}: invalid holdout evaluation report (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  return {
    passed: failures.length === 0,
    checked: evidenceResult.data.holdoutEvaluations.length + fixtureEntries.length + evidenceResult.data.existingGates.length,
    failures,
  };
}

export async function verifyQualificationEvidenceSemantics(
  rootPath: string,
  evidenceInput: unknown,
): Promise<EvidenceIntegrityResult> {
  const evidenceResult = qualificationEvidenceSchema.safeParse(evidenceInput);
  if (!evidenceResult.success) {
    return { passed: false, checked: 0, failures: ["V3 qualification evidence is invalid."] };
  }
  const failures: string[] = [];
  const commandChecks = [
    ["ci-registry-violations", evidenceResult.data.ciFixtures.registryViolations],
    ["ci-snapshot-violations", evidenceResult.data.ciFixtures.snapshotViolations],
    ["ci-adapter-cases", evidenceResult.data.ciFixtures.adapterCases],
    ["ci-comparison-safety", evidenceResult.data.ciFixtures.comparisonSafety],
    ["ci-privacy-boundaries", evidenceResult.data.ciFixtures.privacyBoundaries],
    ["ci-rule-promotion-paths", evidenceResult.data.ciFixtures.rulePromotionPaths],
    ["release-build", evidenceResult.data.releaseGates.build],
    ["release-typecheck", evidenceResult.data.releaseGates.typecheck],
    ["release-tests", evidenceResult.data.releaseGates.tests],
    ["release-package-check", evidenceResult.data.releaseGates.packageCheck],
    ["release-package-smoke", evidenceResult.data.releaseGates.packageSmoke],
    ["release-independence", evidenceResult.data.releaseGates.independence],
    ["release-corpus", evidenceResult.data.releaseGates.corpus],
    ["release-offline", evidenceResult.data.releaseGates.offlineRelease],
    ["release-archive-removal", evidenceResult.data.releaseGates.archiveRemoval],
    ["benchmark-browser-only", evidenceResult.data.benchmarkPaths.browserOnly],
    ["benchmark-full-stack", evidenceResult.data.benchmarkPaths.fullStack],
    ["private-leakage-scan", evidenceResult.data.privateLeakageScan],
  ] as const;
  for (const [expectedId, check] of commandChecks) {
    try {
      const report = qualificationCommandEvidenceReportSchema.parse(
        await readContainedJson(rootPath, check.evidence.path),
      );
      if (report.id !== expectedId) failures.push(`${check.evidence.path}: command evidence ID mismatch`);
      if (report.passed !== check.passed) failures.push(`${check.evidence.path}: command pass mismatch`);
      const logs = await verifyEvidenceReferences(rootPath, { stdout: report.stdout, stderr: report.stderr });
      failures.push(...logs.failures.map((failure) => `${check.evidence.path}: ${failure}`));
    } catch (error) {
      failures.push(`${check.evidence.path}: invalid command evidence report (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  for (const reference of evidenceResult.data.promotionReports) {
    try {
      const report = promotionReportSchema.parse(await readContainedJson(rootPath, reference.evidence.path));
      if (report.candidateId !== reference.candidateId) failures.push(`${reference.evidence.path}: candidate ID mismatch`);
      if (report.decision !== reference.decision) failures.push(`${reference.evidence.path}: promotion decision mismatch`);
      if (report.evaluationComplete !== reference.evaluationComplete) failures.push(`${reference.evidence.path}: evaluation-complete mismatch`);
      if (!report.evaluationComplete) failures.push(`${reference.evidence.path}: candidate evaluation is incomplete`);
    } catch (error) {
      failures.push(`${reference.evidence.path}: invalid promotion report (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  return {
    passed: failures.length === 0,
    checked: evidenceResult.data.promotionReports.length + commandChecks.length,
    failures,
  };
}
