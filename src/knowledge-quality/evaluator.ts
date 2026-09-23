import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { loadCompiledAuthority } from "../authority/loader.js";
import { ruleRegistrySchema, type CompiledAuthority, type RuleRegistry } from "../authority/schema.js";
import { loadDesignEngineeringModel } from "../model/loader.js";
import { buildKnowledgeIndex, searchKnowledge } from "../retrieval/search.js";
import { loadKnowledgeQualityManifest } from "./loader.js";
import type {
  KnowledgeQualityCase,
  KnowledgeQualityCaseResult,
  KnowledgeQualityDimension,
  KnowledgeQualityReport,
} from "./schema.js";

const REPORT_VERSION = "1.0";

type BoundaryManifest = {
  removedArtifacts: Array<{
    previousPath: string;
    packageDecision: string;
    retrievalDecision: string;
    admissionDecision: string;
    maintainedReplacementPaths: string[];
    removalEvidence: { currentTreeAbsent: boolean };
  }>;
};

function isContained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

async function assertRepositoryFile(projectRoot: string, path: string): Promise<void> {
  if (path.includes("\0") || isAbsolute(path)) throw new Error(`Knowledge-quality path must be repository-relative: ${path}`);
  const resolved = resolve(projectRoot, path);
  if (!isContained(projectRoot, resolved)) throw new Error(`Knowledge-quality path escapes the project root: ${path}`);
  const real = await realpath(resolved);
  if (!isContained(projectRoot, real)) throw new Error(`Knowledge-quality path resolves outside the project root: ${path}`);
  const stats = await stat(real);
  if (!stats.isFile()) throw new Error(`Knowledge-quality path is not a regular file: ${path}`);
}

function textIncludesAll(value: string, expected: string[]): boolean {
  const lower = value.toLowerCase();
  return expected.every((entry) => lower.includes(entry.toLowerCase()));
}

async function loadRetainedAuthorityBundle(projectRoot: string): Promise<{
  authority: CompiledAuthority;
  registry: RuleRegistry;
}> {
  const authority = await loadCompiledAuthority("model/compiled-authority.json", projectRoot);
  const registryRaw = await readFile(join(projectRoot, "governance", "rule-registry.json"), "utf8");
  const registrySha256 = createHash("sha256").update(registryRaw).digest("hex");
  if (registrySha256 !== authority.integrity.ruleRegistrySha256) {
    throw new Error("Knowledge-quality retained rule registry digest does not match compiled authority");
  }
  return {
    authority,
    registry: ruleRegistrySchema.parse(JSON.parse(registryRaw)),
  };
}

function result(
  benchmarkCase: KnowledgeQualityCase,
  passed: boolean,
  expected: string,
  observed: string,
  findings: string[] = [],
): KnowledgeQualityCaseResult {
  return {
    id: benchmarkCase.id,
    kind: benchmarkCase.kind,
    dimension: benchmarkCase.dimension,
    source: benchmarkCase.source,
    passed,
    score: passed ? 1 : 0,
    expected,
    observed,
    findings,
  };
}

function dimensionResult(
  dimension: KnowledgeQualityDimension,
  cases: KnowledgeQualityCaseResult[],
  threshold: { minimumScore: number },
): KnowledgeQualityReport["dimensions"][number] {
  const relevant = cases.filter((entry) => entry.dimension === dimension);
  const passedCases = relevant.filter((entry) => entry.passed).length;
  const score = Number((passedCases / relevant.length).toFixed(4));
  return {
    dimension,
    cases: relevant.length,
    passedCases,
    failedCases: relevant.length - passedCases,
    score,
    minimumScore: threshold.minimumScore,
    passed: score >= threshold.minimumScore,
  };
}

async function evaluateRetrievalCase(
  benchmarkCase: Extract<KnowledgeQualityCase, { kind: "retrieval" }>,
  index: Awaited<ReturnType<typeof buildKnowledgeIndex>>,
): Promise<KnowledgeQualityCaseResult> {
  const report = searchKnowledge(index, {
    query: benchmarkCase.query,
    ...(benchmarkCase.categories ? { categories: benchmarkCase.categories } : {}),
    limit: Math.max(benchmarkCase.expected.maxRank ?? 5, 5),
  });
  const matched = benchmarkCase.expected.path
    ? report.results.find((entry) => entry.path === benchmarkCase.expected.path)
    : undefined;
  const passed = report.status === benchmarkCase.expected.status &&
    (benchmarkCase.expected.status === "no-match" || (matched && matched.rank <= (benchmarkCase.expected.maxRank ?? 5)));
  return result(
    benchmarkCase,
    Boolean(passed),
    benchmarkCase.expected.path
      ? `${benchmarkCase.expected.status}; ${benchmarkCase.expected.path} within rank ${benchmarkCase.expected.maxRank ?? 5}`
      : benchmarkCase.expected.status,
    report.status === "no-match" ? "no-match" : `matches; top ${report.results[0]?.path ?? "none"}`,
    passed ? [] : [`retrieval returned ${report.status}`],
  );
}

function evaluateRuleProvenanceCase(
  benchmarkCase: Extract<KnowledgeQualityCase, { kind: "rule-provenance" }>,
  registry: RuleRegistry,
): KnowledgeQualityCaseResult {
  const findings: string[] = [];
  const observedModelLinks = new Set<string>();
  for (const ruleId of benchmarkCase.ruleIds) {
    const rule = registry.rules.find((entry) => entry.id === ruleId);
    if (!rule) {
      findings.push(`${ruleId} is missing from the rule registry`);
      continue;
    }
    for (const modelLink of rule.modelLinks) observedModelLinks.add(modelLink);
    if (benchmarkCase.expected.categories && !benchmarkCase.expected.categories.includes(rule.category)) {
      findings.push(`${ruleId} category ${rule.category} is not expected`);
    }
    if (benchmarkCase.expected.requireSourceIds && rule.sourceIds.length === 0) {
      findings.push(`${ruleId} has no source IDs`);
    }
    if (benchmarkCase.expected.forbidPrivateFallback && rule.sourceIds.some((source) => source.toLowerCase().includes("private"))) {
      findings.push(`${ruleId} uses private fallback source identity`);
    }
  }
  for (const modelLink of benchmarkCase.expected.modelLinks ?? []) {
    if (!observedModelLinks.has(modelLink)) findings.push(`inspected rule set does not link ${modelLink}`);
  }
  return result(
    benchmarkCase,
    findings.length === 0,
    `rules ${benchmarkCase.ruleIds.join(", ")} have expected provenance and model links`,
    `${benchmarkCase.ruleIds.length} rules inspected`,
    findings,
  );
}

async function evaluateConflictCase(
  benchmarkCase: Extract<KnowledgeQualityCase, { kind: "conflict" }>,
  projectRoot: string,
): Promise<KnowledgeQualityCaseResult> {
  const model = await loadDesignEngineeringModel(undefined, projectRoot);
  const conflict = model.conflicts.find((entry) => entry.id === benchmarkCase.conflictId);
  const findings: string[] = [];
  if (!conflict) {
    findings.push(`${benchmarkCase.conflictId} is missing`);
  } else {
    if (conflict.higherPriorityEntity !== benchmarkCase.expected.higherPriorityEntity) findings.push("higher-priority entity mismatch");
    if (conflict.lowerPriorityEntity !== benchmarkCase.expected.lowerPriorityEntity) findings.push("lower-priority entity mismatch");
    if (!textIncludesAll(conflict.resolution, benchmarkCase.expected.resolutionIncludes)) findings.push("resolution text does not contain required terms");
    for (const evidenceClass of benchmarkCase.expected.evidenceClasses) {
      if (!conflict.evidenceRequired.includes(evidenceClass as never)) findings.push(`missing evidence class ${evidenceClass}`);
    }
  }
  return result(
    benchmarkCase,
    findings.length === 0,
    `${benchmarkCase.expected.higherPriorityEntity} overrides ${benchmarkCase.expected.lowerPriorityEntity}`,
    conflict ? `${conflict.higherPriorityEntity} overrides ${conflict.lowerPriorityEntity}` : "missing conflict",
    findings,
  );
}

async function evaluateSupersessionCase(
  benchmarkCase: Extract<KnowledgeQualityCase, { kind: "supersession" }>,
  projectRoot: string,
  compiled: CompiledAuthority,
): Promise<KnowledgeQualityCaseResult> {
  const boundary = JSON.parse(await readFile(join(projectRoot, "governance", "public-knowledge-boundary.json"), "utf8")) as BoundaryManifest;
  const removed = boundary.removedArtifacts[benchmarkCase.removedArtifactIndex];
  const admittedPaths = new Set(compiled.knowledge.sources.map((entry) => entry.path));
  const retrievalPaths = new Set(compiled.knowledge.retrievalDocuments.map((entry) => entry.path));
  const findings: string[] = [];
  if (!removed) {
    findings.push("removed artifact record is missing");
  } else {
    if (removed.removalEvidence.currentTreeAbsent !== benchmarkCase.expected.removedFromCurrentTree) findings.push("current-tree absence mismatch");
    if ((removed.retrievalDecision === "prohibited") !== benchmarkCase.expected.removedFromRetrieval) findings.push("retrieval decision mismatch");
    if ((removed.packageDecision === "prohibited") !== benchmarkCase.expected.removedFromPackage) findings.push("package decision mismatch");
    if ((removed.admissionDecision === "not-admitted") !== benchmarkCase.expected.removedFromAdmission) findings.push("admission decision mismatch");
    for (const replacementPath of benchmarkCase.expected.replacementPaths) {
      if (!removed.maintainedReplacementPaths.includes(replacementPath)) findings.push(`replacement not recorded: ${replacementPath}`);
      if (!admittedPaths.has(replacementPath)) findings.push(`replacement is not admitted: ${replacementPath}`);
    }
  }
  if (removed) {
    if (admittedPaths.has(removed.previousPath)) findings.push("removed path is still admitted");
    if (retrievalPaths.has(removed.previousPath)) findings.push("removed path is still retrievable");
  }
  return result(
    benchmarkCase,
    findings.length === 0,
    `removed artifact ${benchmarkCase.removedArtifactIndex} removed with admitted replacements`,
    removed ? `removed artifact ${benchmarkCase.removedArtifactIndex} superseded by ${removed.maintainedReplacementPaths.length} paths` : "missing removal record",
    findings,
  );
}

async function evaluateModelParityCase(
  benchmarkCase: Extract<KnowledgeQualityCase, { kind: "model-parity" }>,
  projectRoot: string,
  compiled: CompiledAuthority,
): Promise<KnowledgeQualityCaseResult> {
  const model = await loadDesignEngineeringModel(undefined, projectRoot);
  const trace = model.decisionTraces.find((entry) => entry.id === benchmarkCase.traceId);
  const retrievable = new Set([
    ...compiled.knowledge.sources.map((entry) => entry.path),
    ...compiled.knowledge.retrievalDocuments.map((entry) => entry.path),
    ...compiled.knowledge.exactReadDocuments.map((entry) => entry.path),
  ]);
  const findings: string[] = [];
  if (!trace) {
    findings.push(`${benchmarkCase.traceId} is missing`);
  } else {
    for (const entity of benchmarkCase.expected.orderedEntities) {
      if (!trace.orderedEntityRefs.includes(entity)) findings.push(`trace omits ${entity}`);
    }
    for (const verificationRef of benchmarkCase.expected.verificationRefs) {
      if (!trace.requiredVerificationRefs.includes(verificationRef)) findings.push(`trace omits verifier ${verificationRef}`);
    }
  }
  for (const path of benchmarkCase.expected.retrievalPaths) {
    if (!retrievable.has(path)) findings.push(`compiled authority cannot read or retrieve ${path}`);
  }
  return result(
    benchmarkCase,
    findings.length === 0,
    `${benchmarkCase.traceId} preserves production task decisions and supporting documents`,
    trace ? `${trace.orderedEntityRefs.length} entities and ${trace.requiredVerificationRefs.length} verifiers` : "missing trace",
    findings,
  );
}

export async function evaluateKnowledgeQuality(
  manifestPath = "knowledge-base/benchmarks/knowledge-quality/knowledge-quality.yaml",
  projectRoot = process.cwd(),
): Promise<KnowledgeQualityReport> {
  const root = await realpath(resolve(projectRoot));
  const manifest = await loadKnowledgeQualityManifest(manifestPath, root);
  for (const source of manifest.sources) await assertRepositoryFile(root, source.evidence);

  const compiled = await loadRetainedAuthorityBundle(root);
  const index = manifest.cases.some((entry) => entry.kind === "retrieval")
    ? await buildKnowledgeIndex(root, join(root, "knowledge-base", "retrieval-scope.yaml"), compiled.authority)
    : undefined;
  const caseResults: KnowledgeQualityCaseResult[] = [];

  for (const benchmarkCase of manifest.cases) {
    if (benchmarkCase.kind === "retrieval") {
      caseResults.push(await evaluateRetrievalCase(benchmarkCase, index!));
    } else if (benchmarkCase.kind === "rule-provenance") {
      caseResults.push(evaluateRuleProvenanceCase(benchmarkCase, compiled.registry));
    } else if (benchmarkCase.kind === "conflict") {
      caseResults.push(await evaluateConflictCase(benchmarkCase, root));
    } else if (benchmarkCase.kind === "supersession") {
      caseResults.push(await evaluateSupersessionCase(benchmarkCase, root, compiled.authority));
    } else {
      caseResults.push(await evaluateModelParityCase(benchmarkCase, root, compiled.authority));
    }
  }

  const dimensions = (Object.keys(manifest.thresholds.dimensions) as KnowledgeQualityDimension[])
    .sort()
    .map((dimension) => dimensionResult(dimension, caseResults, manifest.thresholds.dimensions[dimension]!));
  const breakdown = Object.fromEntries(
    dimensions.map((entry) => [
      entry.dimension.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      entry.passed ? "pass" : "fail",
    ]),
  ) as KnowledgeQualityReport["qualityBreakdown"];
  const overallScore = Number((caseResults.reduce((sum, entry) => sum + entry.score, 0) / caseResults.length).toFixed(4));

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    manifestPath: relative(root, resolve(root, manifestPath)).split(sep).join("/"),
    benchmarkId: manifest.id,
    authorityPath: "SKILL.md",
    compiledAuthority: {
      lifecycle: compiled.authority.lifecycle,
      admittedFileCount: compiled.authority.knowledge.admittedFileCount,
      retrievalFileCount: compiled.authority.knowledge.retrievalFileCount,
      ruleCount: compiled.authority.ruleRegistry.ruleCount,
      payloadSha256: compiled.authority.integrity.payloadSha256,
    },
    sources: manifest.sources.length,
    caseResults,
    dimensions,
    qualityBreakdown: breakdown,
    overallScore,
    overallMinimumScore: manifest.thresholds.overallMinimumScore,
    passed: overallScore >= manifest.thresholds.overallMinimumScore && dimensions.every((entry) => entry.passed),
  };
}
