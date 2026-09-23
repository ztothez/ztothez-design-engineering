import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { parse } from "yaml";

import { loadCompiledAuthority } from "../authority/loader.js";
import type { CompiledAuthority } from "../authority/schema.js";
import { buildKnowledgeIndex, searchKnowledge } from "../retrieval/search.js";
import {
  sourceRemovalQualificationManifestSchema,
  sourceRemovalQualificationReportSchema,
  type SourceRemovalQualificationManifest,
  type SourceRemovalQualificationReport,
  type SourceRemovalQueryResult,
} from "./schema.js";

const REPORT_VERSION = "1.0";
const DEFAULT_MANIFEST = "knowledge-base/benchmarks/source-removal/source-removal-qualification.yaml";
const SOURCE_REMOVAL_ROOT = "knowledge-base/benchmarks/source-removal";

type BoundaryManifest = {
  removedArtifacts: Array<{
    previousPath: string;
    packageDecision: string;
    retrievalDecision: string;
    admissionDecision: string;
    removalEvidence: { currentTreeAbsent: boolean };
  }>;
};

function portable(path: string): string {
  return path.split(sep).join("/");
}

function isContained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

async function loadManifest(manifestPath: string, projectRoot: string): Promise<SourceRemovalQualificationManifest> {
  if (manifestPath.includes("\0")) throw new Error("Source-removal manifest path contains an invalid null byte");
  const resolved = isAbsolute(manifestPath) ? resolve(manifestPath) : resolve(projectRoot, manifestPath);
  const allowedRoot = resolve(projectRoot, SOURCE_REMOVAL_ROOT);
  const permittedRoot = isAbsolute(manifestPath) ? projectRoot : allowedRoot;
  if (!isContained(permittedRoot, resolved)) {
    throw new Error("Source-removal manifest is outside the maintained benchmark directory");
  }
  const real = await realpath(resolved);
  if (!isContained(permittedRoot, real)) {
    throw new Error("Source-removal manifest resolves outside the maintained benchmark directory");
  }
  const stats = await stat(real);
  if (!stats.isFile()) throw new Error("Source-removal manifest is not a regular file");
  return sourceRemovalQualificationManifestSchema.parse(parse(await readFile(real, "utf8")));
}

function evaluateQueryCase(
  benchmarkCase: SourceRemovalQualificationManifest["queryCases"][number],
  index: Awaited<ReturnType<typeof buildKnowledgeIndex>>,
  compiled: CompiledAuthority,
): SourceRemovalQueryResult {
  const report = searchKnowledge(index, {
    query: benchmarkCase.query,
    categories: benchmarkCase.categories,
    limit: Math.max(benchmarkCase.expected.maxRank ?? 5, 5),
  });
  const expectedPath = benchmarkCase.expected.path;
  const matched = expectedPath ? report.results.find((entry) => entry.path === expectedPath) : undefined;
  const findings: string[] = [];

  if (report.status !== benchmarkCase.expected.status) {
    findings.push(`expected ${benchmarkCase.expected.status}, received ${report.status}`);
  }
  if (benchmarkCase.expected.status === "matches") {
    if (!matched) {
      findings.push(`expected path was not returned`);
    } else if (matched.rank > (benchmarkCase.expected.maxRank ?? 5)) {
      findings.push(`expected rank <= ${benchmarkCase.expected.maxRank ?? 5}, received ${matched.rank}`);
    }
    if (expectedPath && !compiled.knowledge.retrievalDocuments.some((entry) => entry.path === expectedPath)) {
      findings.push("expected path is not in compiled retrieval scope");
    }
  } else if (report.results.length > 0) {
    findings.push("gap case returned unexpected approved matches");
  }

  return {
    id: benchmarkCase.id,
    queryClass: benchmarkCase.queryClass,
    status: findings.length === 0 ? "pass" : "fail",
    expected: expectedPath
      ? `${benchmarkCase.expected.status}: ${expectedPath}`
      : benchmarkCase.expected.status,
    observed: report.status === "no-match" ? "no-match" : `matches: ${report.results[0]?.path ?? "none"}`,
    ...(matched ? { matchedPath: matched.path, rank: matched.rank, confidence: matched.confidence } : {}),
    findings,
  };
}

function boundaryPassed(boundary: BoundaryManifest): boolean {
  return boundary.removedArtifacts.every((entry) => (
    entry.packageDecision === "prohibited" &&
    entry.retrievalDecision === "prohibited" &&
    entry.admissionDecision === "not-admitted" &&
    entry.removalEvidence.currentTreeAbsent
  ));
}

export async function qualifySourceRemoval(
  manifestPath = DEFAULT_MANIFEST,
  projectRoot = process.cwd(),
): Promise<SourceRemovalQualificationReport> {
  const root = await realpath(resolve(projectRoot));
  const manifest = await loadManifest(manifestPath, root);
  const compiled = await loadCompiledAuthority("model/compiled-authority.json", root);
  const boundary = JSON.parse(
    await readFile(join(root, "governance", "public-knowledge-boundary.json"), "utf8"),
  ) as BoundaryManifest;
  const index = await buildKnowledgeIndex(root, join(root, "knowledge-base", "retrieval-scope.yaml"), compiled);
  const queryResults = manifest.queryCases.map((entry) => evaluateQueryCase(entry, index, compiled));
  const limitations = [
    "This report qualifies the admitted public knowledge boundary; it does not activate model cutover.",
    "Browser and offline package behavior are established by archive-removal smoke and package smoke gates.",
    "Explicit no-match results identify knowledge gaps and are not counted as substituted source evidence.",
  ];

  const passed = (
    manifest.requirements.admittedPublicKnowledgeOnly &&
    !manifest.requirements.privateSourcesAreFallbacks &&
    manifest.requirements.documentBoundaryRetainedForRollback &&
    manifest.requirements.limitationsRemainSeparate &&
    !manifest.expectedArchiveSmoke.referenceArchivesPresent &&
    boundaryPassed(boundary) &&
    queryResults.every((entry) => entry.status === "pass")
  );

  return sourceRemovalQualificationReportSchema.parse({
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    manifestPath: portable(relative(root, resolve(root, manifestPath))),
    benchmarkId: manifest.id,
    authorityPath: "SKILL.md",
    admittedFileCount: compiled.knowledge.admittedFileCount,
    retrievalFileCount: compiled.knowledge.retrievalFileCount,
    removedArtifactCount: boundary.removedArtifacts.length,
    referenceArchivesPresent: false,
    documentBoundaryRetainedForRollback: true,
    privateSourcesUsed: false,
    queryResults,
    limitationCount: limitations.length,
    limitations,
    passed,
  });
}
