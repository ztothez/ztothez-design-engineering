import { realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { auditRepository } from "../audit/scanner.js";
import type { AuditPolicy } from "../audit/types.js";
import { validateProductContract } from "../contracts/validator.js";
import { buildKnowledgeIndex, searchKnowledge } from "../retrieval/search.js";
import { loadCorpusManifest } from "./loader.js";
import type {
  CorpusCase,
  CorpusCaseResult,
  CorpusDimension,
  CorpusDimensionResult,
  CorpusReport,
} from "./schema.js";

const REPORT_VERSION = "1.0.0";

function isContained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

async function resolveCorpusPath(projectRoot: string, requestedPath: string, kind: "file" | "directory"): Promise<string> {
  if (requestedPath.includes("\0") || isAbsolute(requestedPath)) {
    throw new Error(`Corpus ${kind} paths must be repository-relative`);
  }
  const candidate = await realpath(resolve(projectRoot, requestedPath));
  if (!isContained(projectRoot, candidate)) {
    throw new Error(`Corpus ${kind} path resolves outside the project root: ${requestedPath}`);
  }
  const fileStats = await stat(candidate);
  if ((kind === "file" && !fileStats.isFile()) || (kind === "directory" && !fileStats.isDirectory())) {
    throw new Error(`Corpus ${kind} path has the wrong type: ${requestedPath}`);
  }
  return candidate;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function containsAll(observed: Set<string>, expected: string[]): boolean {
  return expected.every((entry) => observed.has(entry));
}

function containsNone(observed: Set<string>, forbidden: string[]): boolean {
  return forbidden.every((entry) => !observed.has(entry));
}

async function evaluateRetrievalCase(
  benchmarkCase: Extract<CorpusCase, { kind: "retrieval" }>,
  index: Awaited<ReturnType<typeof buildKnowledgeIndex>>,
): Promise<CorpusCaseResult> {
  const report = searchKnowledge(index, {
    query: benchmarkCase.query,
    ...(benchmarkCase.categories ? { categories: benchmarkCase.categories } : {}),
    limit: Math.max(benchmarkCase.expected.maxRank ?? 5, 5),
  });
  const expectedPath = benchmarkCase.expected.path;
  const matched = expectedPath
    ? report.results.find((entry) => entry.path === expectedPath)
    : undefined;
  const rank = matched?.rank;
  const passed =
    report.status === benchmarkCase.expected.status &&
    (benchmarkCase.dimension === "abstention" ||
      (rank !== undefined && rank <= (benchmarkCase.expected.maxRank ?? 5)));
  const reciprocalRank = benchmarkCase.dimension === "recommendation-relevance"
    ? rank === undefined ? 0 : 1 / rank
    : undefined;

  return {
    id: benchmarkCase.id,
    kind: benchmarkCase.kind,
    dimension: benchmarkCase.dimension,
    polarity: benchmarkCase.polarity,
    source: benchmarkCase.source,
    passed,
    score: passed ? 1 : 0,
    expected: expectedPath
      ? `${benchmarkCase.expected.status}; ${expectedPath} at rank <= ${benchmarkCase.expected.maxRank ?? 5}`
      : benchmarkCase.expected.status,
    observed: report.status === "no-match"
      ? "no-match"
      : `matches; top path ${report.results[0]?.path ?? "none"}`,
    ...(rank === undefined ? {} : { rank }),
    ...(reciprocalRank === undefined ? {} : { reciprocalRank }),
    ...(matched ? { matchedPath: matched.path } : {}),
    ruleIds: [],
    issueCodes: [],
  };
}

async function evaluateAuditCase(
  benchmarkCase: Extract<CorpusCase, { kind: "audit" }>,
  projectRoot: string,
): Promise<CorpusCaseResult> {
  const target = await resolveCorpusPath(projectRoot, benchmarkCase.target, "directory");
  const report = await auditRepository(target, benchmarkCase.policy as Partial<AuditPolicy> | undefined);
  const ruleIds = sortedUnique(report.findings.map((finding) => finding.ruleId));
  const observed = new Set(ruleIds);
  const required = benchmarkCase.expected.requiredRuleIds;
  const forbidden = benchmarkCase.expected.forbiddenRuleIds;
  const expectedAccept = benchmarkCase.expected.verdict === "accept";
  const verdictMatches = expectedAccept
    ? report.findings.length <= (benchmarkCase.expected.maximumFindings ?? 0)
    : report.findings.length > 0;
  const passed = verdictMatches && containsAll(observed, required) && containsNone(observed, forbidden);

  return {
    id: benchmarkCase.id,
    kind: benchmarkCase.kind,
    dimension: benchmarkCase.dimension,
    polarity: benchmarkCase.polarity,
    source: benchmarkCase.source,
    passed,
    score: passed ? 1 : 0,
    expected: `${benchmarkCase.expected.verdict}; required ${required.join(", ") || "none"}; forbidden ${forbidden.join(", ") || "none"}`,
    observed: `${report.findings.length} findings; ${ruleIds.join(", ") || "no rules"}`,
    ruleIds,
    issueCodes: [],
  };
}

async function evaluateContractCase(
  benchmarkCase: Extract<CorpusCase, { kind: "contract" }>,
  projectRoot: string,
): Promise<CorpusCaseResult> {
  const contract = await resolveCorpusPath(projectRoot, benchmarkCase.contract, "file");
  const report = await validateProductContract(contract, { projectRoot });
  const issueCodes = sortedUnique(report.issues.map((entry) => entry.code));
  const observed = new Set(issueCodes);
  const expectedPass = benchmarkCase.expected.verdict === "accept";
  const passed =
    report.passed === expectedPass &&
    containsAll(observed, benchmarkCase.expected.requiredIssueCodes) &&
    containsNone(observed, benchmarkCase.expected.forbiddenIssueCodes);

  return {
    id: benchmarkCase.id,
    kind: benchmarkCase.kind,
    dimension: benchmarkCase.dimension,
    polarity: benchmarkCase.polarity,
    source: benchmarkCase.source,
    passed,
    score: passed ? 1 : 0,
    expected: `${benchmarkCase.expected.verdict}; required ${benchmarkCase.expected.requiredIssueCodes.join(", ") || "none"}`,
    observed: `${report.passed ? "accept" : "reject"}; ${issueCodes.join(", ") || "no issues"}`,
    ruleIds: [],
    issueCodes,
  };
}

function dimensionResult(
  dimension: CorpusDimension,
  cases: CorpusCaseResult[],
  threshold: { minimumScore: number; minimumMeanReciprocalRank?: number },
): CorpusDimensionResult {
  const relevant = cases.filter((entry) => entry.dimension === dimension);
  const passedCases = relevant.filter((entry) => entry.passed).length;
  const score = passedCases / relevant.length;
  const reciprocalRanks = relevant
    .map((entry) => entry.reciprocalRank)
    .filter((value): value is number => value !== undefined);
  const meanReciprocalRank = reciprocalRanks.length
    ? reciprocalRanks.reduce((sum, value) => sum + value, 0) / reciprocalRanks.length
    : undefined;
  const rankPassed = threshold.minimumMeanReciprocalRank === undefined ||
    (meanReciprocalRank !== undefined && meanReciprocalRank >= threshold.minimumMeanReciprocalRank);

  return {
    dimension,
    cases: relevant.length,
    passedCases,
    failedCases: relevant.length - passedCases,
    score: Number(score.toFixed(4)),
    minimumScore: threshold.minimumScore,
    ...(meanReciprocalRank === undefined
      ? {}
      : { meanReciprocalRank: Number(meanReciprocalRank.toFixed(4)) }),
    ...(threshold.minimumMeanReciprocalRank === undefined
      ? {}
      : { minimumMeanReciprocalRank: threshold.minimumMeanReciprocalRank }),
    passed: score >= threshold.minimumScore && rankPassed,
  };
}

export async function evaluateCorpusBenchmark(manifestPath: string, projectRoot = process.cwd()): Promise<CorpusReport> {
  const resolvedProjectRoot = await realpath(resolve(projectRoot));
  const resolvedManifest = await realpath(resolve(manifestPath));
  if (!isContained(resolvedProjectRoot, resolvedManifest)) {
    throw new Error("Corpus manifest is outside the project root");
  }
  const manifest = await loadCorpusManifest(resolvedManifest);
  for (const source of manifest.sources) {
    await resolveCorpusPath(resolvedProjectRoot, source.evidence, "file");
  }
  const retrievalCases = manifest.cases.some((entry) => entry.kind === "retrieval");
  const index = retrievalCases ? await buildKnowledgeIndex(resolvedProjectRoot) : undefined;
  const caseResults: CorpusCaseResult[] = [];

  for (const benchmarkCase of manifest.cases) {
    if (benchmarkCase.kind === "retrieval") {
      caseResults.push(await evaluateRetrievalCase(benchmarkCase, index!));
    } else if (benchmarkCase.kind === "audit") {
      caseResults.push(await evaluateAuditCase(benchmarkCase, resolvedProjectRoot));
    } else {
      caseResults.push(await evaluateContractCase(benchmarkCase, resolvedProjectRoot));
    }
  }

  const dimensions = (Object.keys(manifest.thresholds.dimensions) as CorpusDimension[])
    .sort()
    .map((dimension) =>
      dimensionResult(dimension, caseResults, manifest.thresholds.dimensions[dimension]!),
    );
  const overallScore = caseResults.reduce((sum, entry) => sum + entry.score, 0) / caseResults.length;

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    manifestPath: resolvedManifest,
    corpusId: manifest.id,
    corpusVersion: manifest.version,
    sources: manifest.sources.length,
    sourceRecords: manifest.sources.map((source) => ({
      id: source.id,
      title: source.title,
      origin: source.origin,
      owner: source.owner,
      license: source.license,
      ...(source.sourceUrl ? { sourceUrl: source.sourceUrl } : {}),
      evidence: source.evidence,
    })),
    positiveCases: manifest.cases.filter((entry) => entry.polarity === "positive").length,
    negativeCases: manifest.cases.filter((entry) => entry.polarity === "negative").length,
    caseResults,
    dimensions,
    overallScore: Number(overallScore.toFixed(4)),
    overallMinimumScore: manifest.thresholds.overallMinimumScore,
    passed: overallScore >= manifest.thresholds.overallMinimumScore && dimensions.every((entry) => entry.passed),
  };
}
