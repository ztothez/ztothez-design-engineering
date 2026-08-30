import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { v4EvaluationReportSchema } from "../evaluation/schema.js";
import { pilotQualificationReportSchema } from "../pilots/schema.js";
import {
  v4CommandEvidenceSchema,
  v4QualificationEvidenceSchema,
  v4QualificationReportSchema,
  type V4QualificationEvidence,
  type V4QualificationReport,
} from "./schema.js";

function contained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

async function readReference(root: string, reference: { path: string; sha256: string }): Promise<string> {
  const path = await realpath(resolve(root, reference.path));
  if (!contained(root, path)) throw new Error(`Qualification evidence escapes the project root: ${reference.path}`);
  if (!(await stat(path)).isFile()) throw new Error(`Qualification evidence is not a regular file: ${reference.path}`);
  const content = await readFile(path);
  const digest = createHash("sha256").update(content).digest("hex");
  if (digest !== reference.sha256) throw new Error(`Qualification evidence digest mismatch: ${reference.path}`);
  return content.toString("utf8");
}

async function verifyCommand(root: string, reference: { path: string; sha256: string }): Promise<boolean> {
  const report = v4CommandEvidenceSchema.parse(JSON.parse(await readReference(root, reference)));
  await readReference(root, report.stdout);
  await readReference(root, report.stderr);
  return report.passed;
}

function includesEvery(source: string, required: string[]): boolean {
  return required.every((value) => source.includes(value));
}

export async function loadV4QualificationEvidence(path: string): Promise<V4QualificationEvidence> {
  return v4QualificationEvidenceSchema.parse(JSON.parse(await readFile(path, "utf8")));
}

export async function evaluateV4Qualification(options: {
  evidence: V4QualificationEvidence;
  projectRoot: string;
}): Promise<V4QualificationReport> {
  const projectRoot = await realpath(resolve(options.projectRoot));
  const releaseGateEntries = await Promise.all(Object.entries(options.evidence.releaseGates).map(
    async ([id, reference]) => [id, await verifyCommand(projectRoot, reference)] as const,
  ));
  const releaseGates = Object.fromEntries(releaseGateEntries) as Record<
    keyof V4QualificationEvidence["releaseGates"],
    boolean
  >;
  const pilotReport = pilotQualificationReportSchema.parse(JSON.parse(
    await readReference(projectRoot, options.evidence.productEvidence.pilotQualification),
  ));
  const holdoutReport = v4EvaluationReportSchema.parse(JSON.parse(
    await readReference(projectRoot, options.evidence.productEvidence.holdoutEvaluation),
  ));
  const readme = await readReference(projectRoot, options.evidence.documentation.readme);
  const installation = await readReference(projectRoot, options.evidence.documentation.installation);
  const workflow = await readReference(projectRoot, options.evidence.documentation.workflow);

  const documentationComplete = includesEvery(readme, [
    "qualify-pilots",
    "evaluate-v4",
    "MCP",
  ]) && includesEvery(installation, [
    "## Migration",
    "## Troubleshooting",
    "## Codex",
    "## Claude Code",
    "## Cursor",
    "## Windsurf And Cascade",
    "## Antigravity",
    "## GitHub Copilot",
    "## Kiro",
    "## Qoder",
    "## Lovable",
  ]);
  const ciCoverage = includesEvery(workflow, [
    "Validate product design brief",
    "Compile deterministic design plan",
    "Build and statically verify V4 delivery pilots",
    "Run V4 bounded repair gate",
    "Run regression suite",
    "Qualify V4 multi-product delivery pilots",
    "Evaluate V4 before-and-after and locked holdout",
    "Validate packed installation",
    "Verify offline release",
    "Certify operation without reference archives",
  ]);
  const releaseGatesPassing = Object.values(releaseGates).every(Boolean);
  const criteria = {
    evidenceIntegrity: true,
    priorItemsPassing: pilotReport.passed && holdoutReport.passed,
    ciCoverage,
    cliMcpInstallationMigrationTroubleshooting: documentationComplete,
    packageAndOfflineRelease: releaseGatesPassing,
    cleanRoomIndependence: releaseGates.independence && releaseGates.archiveRemoval,
    privateEvidenceExcluded:
      releaseGates.packageCheck &&
      releaseGates.packageSmoke &&
      releaseGates.independence &&
      releaseGates.offlineRelease &&
      releaseGates.archiveRemoval,
    humanEvidenceBoundaryPreserved:
      pilotReport.humanEvidence === "not-generated" &&
      holdoutReport.humanEvidence === "not-generated" &&
      holdoutReport.calibration.retained &&
      !holdoutReport.calibration.releaseReady,
  };
  const failureReasons = Object.entries(criteria)
    .filter(([, passed]) => !passed)
    .map(([criterion]) => `V4 qualification criterion failed: ${criterion}.`);
  const supportedClaims = failureReasons.length === 0 ? [
    "Three repository-owned product fixtures passed traceable brief, plan, implementation, and browser verification stages.",
    "Equivalent task-bound interaction evidence passed development products and the locked Azure Optimizer holdout.",
    "The npm package, installed MCP process, offline runtime, and clean-room independence checks passed.",
    "Private product evidence remained outside distribution, and existing human findings were retained as calibration without being regenerated.",
  ] : [];
  return v4QualificationReportSchema.parse({
    version: "1.0",
    qualifiedAt: new Date().toISOString(),
    criteria,
    supportedClaims,
    limitations: [
      "V4 qualification does not establish representative-user validation or universal design quality.",
      "Private V3 portfolio qualification remains a separate, ignored local evidence set and is not embedded in this V4 report or distribution.",
      "The V2 human comparison remains calibration evidence and is not an external V4 release approval.",
    ],
    humanEvidence: "retained-calibration-only",
    failureReasons,
    passed: failureReasons.length === 0,
  });
}
