import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";

import { z } from "zod";

import type { AuditFinding } from "../audit/types.js";
import { inspectProductContract } from "../contracts/validator.js";
import { isContained, portablePath } from "../portfolio/files.js";
import { runQualityGate } from "../quality-gate/runner.js";
import type { QualityGateFailOn, QualityGateReport } from "../quality-gate/types.js";
import { runtimeReportSchema } from "../runtime/schema.js";
import type { RuntimeFinding, RuntimeReport } from "../runtime/types.js";
import { formatRepairReport } from "./report.js";
import {
  repairEvidenceSnapshotSchema,
  repairReportSchema,
  type ExactReplacement,
  type RepairAttemptResult,
  type RepairEvidenceSnapshot,
  type RepairFindingReference,
  type RepairReport,
  type RepairRequest,
} from "./schema.js";
import { authorizeRepairTarget, requireLoopbackUrl } from "./policy.js";

const architectureReportSchema = z
  .object({
    findings: z.array(
      z
        .object({
          ruleId: z.string(),
          severity: z.enum(["error", "warning", "info"]),
          confidence: z.enum(["high", "medium", "low"]),
          file: z.string(),
          line: z.number().int().positive().optional(),
          column: z.number().int().positive().optional(),
          message: z.string(),
          evidence: z.array(z.string()),
          remediation: z.string(),
        })
        .strict(),
    ),
  })
  .passthrough();

const ignoredSnapshotDirectories = new Set([
  ".git",
  ".ztothez-design-quality-gate",
  ".ztothez-design-runtime",
  "dist",
  "node_modules",
]);

type ProjectSnapshot = Map<string, { digest: string; content: Buffer }>;

type GateEvidence = {
  qualityGate: QualityGateReport;
  architectureFindings: AuditFinding[];
  runtime: RuntimeReport;
  snapshot: RepairEvidenceSnapshot;
};

const TARGET_PLAN_HEADER = "x-ztothez-design-plan";

export type RepairRunnerOptions = {
  request: RepairRequest;
  generationRoot: string;
  targetDirectory: string;
  portfolioRegistryPath: string;
  contractPath: string;
  projectRoot: string;
  url: string;
  profile: string;
  outputDirectory: string;
  failOn?: QualityGateFailOn;
  settleMs?: number;
  chromiumPath?: string;
};

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableFingerprint(value: object): string {
  return sha256(JSON.stringify(value));
}

function architectureFingerprint(finding: AuditFinding): string {
  return stableFingerprint({
    source: "architecture",
    checkId: finding.ruleId,
    file: finding.file,
    line: finding.line ?? null,
    message: finding.message,
  });
}

function runtimeFingerprint(finding: RuntimeFinding): string {
  return stableFingerprint({
    source: "runtime",
    checkId: finding.checkId,
    viewport: finding.viewport ?? null,
    journey: finding.journey ?? null,
    selector: finding.selector ?? null,
    message: finding.message,
  });
}

function findingMatches(
  reference: RepairFindingReference,
  finding: AuditFinding | RuntimeFinding,
): boolean {
  if (reference.source === "architecture") {
    const architecture = finding as AuditFinding;
    return (
      architecture.ruleId === reference.checkId &&
      architecture.file === reference.file &&
      (!reference.messageIncludes || architecture.message.includes(reference.messageIncludes))
    );
  }
  const runtime = finding as RuntimeFinding;
  return (
    runtime.checkId === reference.checkId &&
    (!reference.messageIncludes || runtime.message.includes(reference.messageIncludes)) &&
    (!reference.viewport || runtime.viewport === reference.viewport) &&
    (!reference.journey || runtime.journey === reference.journey) &&
    (!reference.selector || runtime.selector === reference.selector)
  );
}

function resolveFindingFingerprints(
  references: RepairFindingReference[],
  architectureFindings: AuditFinding[],
  runtimeFindings: RuntimeFinding[],
  requireEveryFinding: boolean,
): Map<string, string> {
  const resolved = new Map<string, string>();
  for (const reference of references) {
    const source = reference.source === "architecture" ? architectureFindings : runtimeFindings;
    const matches = source.filter((finding) => findingMatches(reference, finding));
    if (matches.length > 1) {
      throw new Error(`Repair finding ${reference.id} is ambiguous in fresh verification evidence`);
    }
    if (matches.length === 0) {
      if (requireEveryFinding) {
        throw new Error(`Repair finding ${reference.id} is absent from fresh verification evidence`);
      }
      continue;
    }
    const match = matches[0]!;
    resolved.set(
      reference.id,
      reference.source === "architecture"
        ? architectureFingerprint(match as AuditFinding)
        : runtimeFingerprint(match as RuntimeFinding),
    );
  }
  return resolved;
}

async function snapshotProject(root: string): Promise<ProjectSnapshot> {
  const snapshot: ProjectSnapshot = new Map();
  let bytes = 0;

  async function walk(directory: string): Promise<void> {
    const entries = (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    for (const entry of entries) {
      if (entry.isDirectory() && ignoredSnapshotDirectories.has(entry.name)) continue;
      const absolute = join(directory, entry.name);
      const path = portablePath(relative(root, absolute));
      if (entry.isSymbolicLink()) throw new Error(`Repair target contains unsupported symbolic link ${path}`);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const content = await readFile(absolute);
      bytes += content.byteLength;
      if (snapshot.size >= 5_000 || bytes > 50 * 1024 * 1024) {
        throw new Error("Repair target exceeds the 5000-file or 50 MiB snapshot boundary");
      }
      snapshot.set(path, { digest: sha256(content), content });
    }
  }

  await walk(root);
  return snapshot;
}

function unrelatedFilesPreserved(
  before: ProjectSnapshot,
  after: ProjectSnapshot,
  operationFiles: Set<string>,
): boolean {
  const beforePaths = [...before.keys()].filter((path) => !operationFiles.has(path)).sort();
  const afterPaths = [...after.keys()].filter((path) => !operationFiles.has(path)).sort();
  if (JSON.stringify(beforePaths) !== JSON.stringify(afterPaths)) return false;
  return beforePaths.every((path) => before.get(path)?.digest === after.get(path)?.digest);
}

async function restoreOperationFiles(
  targetDirectory: string,
  originalSnapshot: ProjectSnapshot,
  operationFiles: Set<string>,
): Promise<void> {
  for (const path of [...operationFiles].sort()) {
    const original = originalSnapshot.get(path);
    if (!original) throw new Error(`Cannot restore missing original file ${path}`);
    await writeFile(join(targetDirectory, path), original.content);
  }
}

async function applyAttempt(
  targetDirectory: string,
  operations: ExactReplacement[],
): Promise<string[]> {
  const prepared = new Map<string, string>();
  const seenFiles = new Set<string>();
  for (const operation of operations) {
    if (seenFiles.has(operation.file)) {
      throw new Error(`Attempt contains multiple operations for ${operation.file}`);
    }
    seenFiles.add(operation.file);
    const absolute = resolve(targetDirectory, operation.file);
    if (!isContained(targetDirectory, absolute)) {
      throw new Error(`Repair operation ${operation.id} escapes the target`);
    }
    const fileStats = await lstat(absolute);
    if (fileStats.isSymbolicLink() || !fileStats.isFile()) {
      throw new Error(`Repair operation ${operation.id} requires a regular non-symbolic file`);
    }
    const canonical = await realpath(absolute);
    if (!isContained(targetDirectory, canonical)) {
      throw new Error(`Repair operation ${operation.id} resolves outside the target`);
    }
    const content = await readFile(canonical, "utf8");
    if (sha256(content) !== operation.expectedFileDigest) {
      throw new Error(`Repair operation ${operation.id} file digest precondition failed`);
    }
    const occurrences = content.split(operation.before).length - 1;
    if (occurrences !== operation.expectedOccurrences) {
      throw new Error(
        `Repair operation ${operation.id} expected ${operation.expectedOccurrences} exact matches but found ${occurrences}`,
      );
    }
    prepared.set(canonical, content.split(operation.before).join(operation.after));
  }

  const originals = new Map<string, string>();
  try {
    for (const [path, content] of prepared) {
      originals.set(path, await readFile(path, "utf8"));
      await writeFile(path, content, "utf8");
    }
  } catch (error) {
    for (const [path, content] of originals) await writeFile(path, content, "utf8");
    throw error;
  }
  return operations.map((operation) => operation.file).sort();
}

async function fileDigest(path: string): Promise<string> {
  return sha256(await readFile(path));
}

async function verifyRuntimeTarget(url: string, expectedPlanId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    throw new Error("Repair runtime target identity request failed");
  }
  await response.body?.cancel();
  if (!response.ok) {
    throw new Error(`Repair runtime target returned HTTP ${response.status}`);
  }
  if (response.headers.get(TARGET_PLAN_HEADER) !== expectedPlanId) {
    throw new Error("Repair runtime target does not match the generation manifest plan");
  }
}

async function captureGateEvidence(
  label: string,
  outputRoot: string,
  options: RepairRunnerOptions,
  targetDirectory: string,
  url: string,
  targetPlanId: string,
): Promise<GateEvidence> {
  const gateDirectory = join(outputRoot, label);
  await verifyRuntimeTarget(url, targetPlanId);
  const qualityGate = await runQualityGate({
    contractPath: options.contractPath,
    projectRoot: options.projectRoot,
    repository: targetDirectory,
    outputDirectory: gateDirectory,
    url,
    profile: options.profile,
    failOn: options.failOn ?? "warning",
    ...(options.settleMs === undefined ? {} : { settleMs: options.settleMs }),
    ...(options.chromiumPath ? { chromiumPath: options.chromiumPath } : {}),
  });
  const qualityGatePath = join(gateDirectory, "quality-gate.json");
  const architecturePath = join(gateDirectory, "architecture-report.json");
  const runtimePath = join(gateDirectory, "runtime", "runtime-report.json");
  const architecture = architectureReportSchema.parse(
    JSON.parse(await readFile(architecturePath, "utf8")),
  );
  const runtime = z.object(runtimeReportSchema).parse(
    JSON.parse(await readFile(runtimePath, "utf8")),
  ) as RuntimeReport;
  for (const screenshot of runtime.screenshots) {
    const screenshotPath = await realpath(screenshot.path);
    if (!isContained(gateDirectory, screenshotPath)) {
      throw new Error(`Runtime screenshot ${screenshot.name} resolves outside repair evidence`);
    }
    if (await fileDigest(screenshotPath) !== screenshot.sha256) {
      throw new Error(`Runtime screenshot ${screenshot.name} checksum does not match its report`);
    }
  }
  const allFingerprints = [
    ...architecture.findings.map((finding) => architectureFingerprint(finding)),
    ...runtime.findings.map((finding) => runtimeFingerprint(finding)),
  ].sort();
  const snapshot = repairEvidenceSnapshotSchema.parse({
    label,
    qualityGateReport: portablePath(relative(outputRoot, qualityGatePath)),
    qualityGateDigest: await fileDigest(qualityGatePath),
    runtimeReport: portablePath(relative(outputRoot, runtimePath)),
    runtimeDigest: await fileDigest(runtimePath),
    targetPlanId,
    route: runtime.url,
    profile: options.profile,
    qualityGateVersion: qualityGate.version,
    runtimeVersion: runtime.version,
    browser: runtime.browser,
    viewports: runtime.viewports.map(({ name, width, height }) => ({ name, width, height })),
    journeys: runtime.journeys.map((journey) => journey.name),
    screenshots: runtime.screenshots.map(({ name, width, height, sha256: screenshotDigest }) => ({
      name,
      width,
      height,
      sha256: screenshotDigest,
    })),
    findingFingerprints: allFingerprints,
    passed: qualityGate.passed,
  });
  return {
    qualityGate,
    architectureFindings: architecture.findings,
    runtime,
    snapshot,
  };
}

function equivalentEvidenceIdentity(
  before: RepairEvidenceSnapshot,
  after: RepairEvidenceSnapshot,
): boolean {
  return (
    before.route === after.route &&
    before.profile === after.profile &&
    before.qualityGateVersion === after.qualityGateVersion &&
    before.runtimeVersion === after.runtimeVersion &&
    before.targetPlanId === after.targetPlanId &&
    before.browser === after.browser &&
    JSON.stringify(before.viewports) === JSON.stringify(after.viewports) &&
    JSON.stringify(before.journeys) === JSON.stringify(after.journeys) &&
    JSON.stringify(before.screenshots.map(({ name, width, height }) => ({ name, width, height }))) ===
      JSON.stringify(after.screenshots.map(({ name, width, height }) => ({ name, width, height })))
  );
}

async function writeReport(outputDirectory: string, report: RepairReport): Promise<void> {
  await writeFile(join(outputDirectory, "repair-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(join(outputDirectory, "repair-report.md"), `${formatRepairReport(report)}\n`, "utf8");
}

export async function runBoundedRepair(options: RepairRunnerOptions): Promise<RepairReport> {
  const request = options.request;
  const url = requireLoopbackUrl(options.url);
  const target = await authorizeRepairTarget({
    generationRoot: options.generationRoot,
    targetDirectory: options.targetDirectory,
    portfolioRegistryPath: options.portfolioRegistryPath,
    manifestPath: request.target.manifest,
  });
  if (target.manifest.adapter !== request.target.adapter) {
    throw new Error("Repair request adapter does not match the generation manifest");
  }

  const requestedOutput = resolve(options.outputDirectory);
  const outputParent = await realpath(dirname(requestedOutput));
  if (!(await stat(outputParent)).isDirectory()) throw new Error("Repair evidence parent must be a directory");
  const outputDirectory = resolve(outputParent, basename(requestedOutput));
  if (isContained(target.targetDirectory, outputDirectory) || isContained(outputDirectory, target.targetDirectory)) {
    throw new Error("Repair evidence output must remain outside the repair target");
  }
  try {
    await lstat(outputDirectory);
    throw new Error("Repair evidence output must not already exist");
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  await mkdir(outputDirectory);

  const contractInspection = await inspectProductContract(resolve(options.contractPath), {
    projectRoot: resolve(options.projectRoot),
  });
  if (!contractInspection.report.passed || !contractInspection.contract || !contractInspection.suite) {
    throw new Error("Repair requires a valid product contract and journey suite");
  }
  const binding = contractInspection.contract.verification.bindings.find(
    (candidate) => candidate.profile === options.profile,
  );
  if (!binding) throw new Error(`Repair profile ${options.profile} is not bound by the product contract`);
  for (const finding of request.findings) {
    if (!binding.acceptanceCriteria.includes(finding.acceptanceCriterion)) {
      throw new Error(
        `Repair finding ${finding.id} acceptance criterion is not bound to profile ${options.profile}`,
      );
    }
    const requiredEvidence: RepairFindingReference["expectedEvidence"] = [
      "contract-validation",
      "static-audit",
      "browser-runtime",
      "responsive-screenshots",
    ];
    if (requiredEvidence.some((entry) => !finding.expectedEvidence.includes(entry))) {
      throw new Error(`Repair finding ${finding.id} must expect the complete closed-loop evidence set`);
    }
  }

  const manifestFiles = new Set(target.manifest.files.map((file) => file.path));
  const operationFiles = new Set(
    request.attempts.flatMap((attempt) => attempt.operations.map((operation) => operation.file)),
  );
  const referencedByOperations = new Set(
    request.attempts.flatMap((attempt) => attempt.operations.map((operation) => operation.findingRef)),
  );
  for (const finding of request.findings) {
    if (!referencedByOperations.has(finding.id)) {
      throw new Error(`Repair finding ${finding.id} has no bounded operation`);
    }
  }
  for (const file of operationFiles) {
    if (!manifestFiles.has(file)) throw new Error(`Repair file ${file} is not owned by the generation manifest`);
  }

  const originalSnapshot = await snapshotProject(target.targetDirectory);
  const before = await captureGateEvidence(
    "before",
    outputDirectory,
    options,
    target.targetDirectory,
    url,
    target.manifest.plan.id,
  );
  const initialFingerprints = resolveFindingFingerprints(
    request.findings,
    before.architectureFindings,
    before.runtime.findings,
    true,
  );

  const attemptResults: RepairAttemptResult[] = [];
  let resolvedIds: string[] = [];
  let unresolvedIds = request.findings.map((finding) => finding.id);
  let status: RepairReport["status"] = "unresolved";
  let reason: RepairReport["reason"] = "attempt-limit";
  let targetRestored = false;
  let wroteFiles = false;

  for (const [index, attempt] of request.attempts.entries()) {
    let changedFiles: string[] = [];
    try {
      changedFiles = await applyAttempt(target.targetDirectory, attempt.operations);
      wroteFiles = true;
    } catch (error) {
      reason = "precondition-failed";
      status = "rejected";
      attemptResults.push({
        id: attempt.id,
        status: "unresolved",
        operationIds: attempt.operations.map((operation) => operation.id),
        changedFiles: [],
        message: error instanceof Error ? error.message : String(error),
      });
      break;
    }

    let evidence: GateEvidence;
    try {
      evidence = await captureGateEvidence(
        `attempt-${String(index + 1).padStart(2, "0")}`,
        outputDirectory,
        options,
        target.targetDirectory,
        url,
        target.manifest.plan.id,
      );
    } catch (error) {
      reason = "verification-failed";
      attemptResults.push({
        id: attempt.id,
        status: "unresolved",
        operationIds: attempt.operations.map((operation) => operation.id),
        changedFiles,
        message: "Verification failed after the bounded edit; inspect retained partial gate evidence.",
      });
      break;
    }
    if (!equivalentEvidenceIdentity(before.snapshot, evidence.snapshot)) {
      reason = "verification-failed";
      attemptResults.push({
        id: attempt.id,
        status: "unresolved",
        operationIds: attempt.operations.map((operation) => operation.id),
        changedFiles,
        evidence: evidence.snapshot,
        message: "Before and after route, profile, journey, viewport, browser, or tool identity differs.",
      });
      break;
    }
    const currentFingerprints = resolveFindingFingerprints(
      request.findings,
      evidence.architectureFindings,
      evidence.runtime.findings,
      false,
    );
    resolvedIds = request.findings
      .filter((finding) => !currentFingerprints.has(finding.id))
      .map((finding) => finding.id);
    unresolvedIds = request.findings
      .filter((finding) => currentFingerprints.has(finding.id))
      .map((finding) => finding.id);
    const attemptFindingIds = new Set(attempt.operations.map((operation) => operation.findingRef));
    const repeated = unresolvedIds.some(
      (id) => attemptFindingIds.has(id) && currentFingerprints.get(id) === initialFingerprints.get(id),
    );
    if (repeated) {
      reason = "repeated-finding";
      attemptResults.push({
        id: attempt.id,
        status: "unresolved",
        operationIds: attempt.operations.map((operation) => operation.id),
        changedFiles,
        evidence: evidence.snapshot,
        message: "The targeted finding fingerprint repeated after remediation; no further rewrite was attempted.",
      });
      break;
    }
    if (unresolvedIds.length === 0 && evidence.qualityGate.passed) {
      status = "repaired";
      reason = "quality-gate-passed";
      attemptResults.push({
        id: attempt.id,
        status: "resolved",
        operationIds: attempt.operations.map((operation) => operation.id),
        changedFiles,
        evidence: evidence.snapshot,
        message: "All referenced findings are absent and the complete quality gate passed.",
      });
      break;
    }
    attemptResults.push({
      id: attempt.id,
      status: "unresolved",
      operationIds: attempt.operations.map((operation) => operation.id),
      changedFiles,
      evidence: evidence.snapshot,
      message: "This attempt resolved its bounded finding but the declared repair set remains incomplete.",
    });
  }

  for (const attempt of request.attempts.slice(attemptResults.length)) {
    attemptResults.push({
      id: attempt.id,
      status: "not-run",
      operationIds: attempt.operations.map((operation) => operation.id),
      changedFiles: [],
      message: "Not run because an earlier stopping condition ended the repair loop.",
    });
  }

  if (status !== "repaired") {
    if (wroteFiles) {
      await restoreOperationFiles(target.targetDirectory, originalSnapshot, operationFiles);
      targetRestored = true;
    }
    resolvedIds = [];
    unresolvedIds = request.findings.map((finding) => finding.id);
  }
  const finalSnapshot = await snapshotProject(target.targetDirectory);
  const preserved = unrelatedFilesPreserved(originalSnapshot, finalSnapshot, operationFiles);
  if (!preserved) {
    if (status === "repaired") {
      await restoreOperationFiles(target.targetDirectory, originalSnapshot, operationFiles);
      targetRestored = true;
    }
    status = "unresolved";
    reason = "verification-failed";
  }
  if (targetRestored) {
    const restoredSnapshot = await snapshotProject(target.targetDirectory);
    const restored = [...originalSnapshot.entries()].every(
      ([path, entry]) => restoredSnapshot.get(path)?.digest === entry.digest,
    );
    if (!restored || restoredSnapshot.size !== originalSnapshot.size) {
      throw new Error("Repair rollback failed to restore the original target snapshot");
    }
  }

  const report = repairReportSchema.parse({
    version: "1.0",
    requestId: request.id,
    adapter: target.manifest.adapter,
    adapterVersion: target.manifest.adapterVersion,
    status,
    reason,
    target: target.portableTarget,
    generatedAt: new Date().toISOString(),
    before: before.snapshot,
    attempts: attemptResults,
    resolvedFindingIds: resolvedIds,
    unresolvedFindingIds: unresolvedIds,
    targetRestored,
    unrelatedFilesPreserved: preserved,
    humanEvidence: "not-generated",
    evidenceBoundary: {
      verifierLimitations: [
        "Exact replacements and automated reruns prove only the declared finding and executable gate scope; they do not prove broader product quality or absence of regressions outside the measured routes and states.",
        "A passing repair does not update the original generation manifest and does not authorize release.",
      ],
      humanReviewRequired: [
        "Automated repair evidence never replaces attributable expert or representative-user evidence required by the product contract.",
      ],
    },
  });
  await writeReport(outputDirectory, report);
  return report;
}
