import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

import { evaluateV4Qualification } from "../src/v4-qualification/evaluator.js";
import type { V4QualificationEvidence } from "../src/v4-qualification/schema.js";

const dimensionIds = [
  "task-completeness",
  "hierarchy",
  "accessibility",
  "responsiveness",
  "truthful-disclosure",
  "maintainability",
  "visual-quality",
] as const;

async function reference(root: string, path: string) {
  return {
    path: relative(root, path).split("\\").join("/"),
    sha256: createHash("sha256").update(await readFile(path)).digest("hex"),
  };
}

function pilotProduct(id: string) {
  const stage = { passed: true, evidence: [`evidence/${id}.json`] };
  return {
    id,
    domain: `${id}-domain`,
    sourcePolicy: "repository-owned-fixture" as const,
    stages: { brief: stage, plan: stage, implementation: stage, verification: stage, interaction: stage },
    profiles: [{ id: "qualified-profile", passed: true, journeys: 1, screenshots: 4 }],
    manifestOwnedFiles: 5,
    adaptedManifestFiles: [],
    systemDefects: [],
    productFindings: [],
    verifierLimitations: ["Human comprehension is separately evidenced."],
    sourcePolicyRestrictions: ["Protected sources are read-only."],
    passed: true,
  };
}

function evaluationProduct(id: string, cohort: "development" | "holdout") {
  const stage = { passed: true, evidence: [`evidence/${id}.json`] };
  return {
    id,
    cohort,
    stages: { baseline: stage, candidate: stage, equivalence: stage },
    tasks: [{
      id: "qualified-task",
      sameTask: true,
      sameStates: true,
      sameRoute: true,
      sameViewports: true,
      baselineInteraction: "unverified" as const,
      candidateInteraction: "passed" as const,
    }],
    dimensions: dimensionIds.map((dimension) => ({
      id: dimension,
      status: dimension === "visual-quality" ? "calibration-only" as const : "non-regressed" as const,
      rationale: "Synthetic qualification fixture.",
    })),
    passed: true,
    limitations: [],
  };
}

async function createFixture(failedGate?: keyof V4QualificationEvidence["releaseGates"]) {
  const root = await mkdtemp(join(tmpdir(), "ztde-v4-qualification-"));
  const evidenceDirectory = join(root, "evidence");
  await mkdir(evidenceDirectory, { recursive: true });

  const pilotPath = join(evidenceDirectory, "pilot.json");
  await writeFile(pilotPath, `${JSON.stringify({
    version: "1.0",
    qualificationId: "qualification-fixture",
    generatedAt: "2026-08-30T12:00:00.000Z",
    products: [pilotProduct("aegisops"), pilotProduct("scenestart"), pilotProduct("azure-optimizer")],
    criteria: {
      threeProductDomains: true,
      briefsReady: true,
      plansReadyAndTraceable: true,
      implementationsContained: true,
      browserProfilesPassing: true,
      declaredInteractionContractsPassing: true,
      evidenceClassified: true,
      humanEvidenceNotGenerated: true,
    },
    supportedClaims: ["Synthetic pilot evidence passed."],
    humanEvidence: "not-generated",
    passed: true,
  }, null, 2)}\n`);

  const evaluationPath = join(evidenceDirectory, "evaluation.json");
  await writeFile(evaluationPath, `${JSON.stringify({
    version: "1.0",
    evaluationId: "evaluation-fixture",
    generatedAt: "2026-08-30T12:00:00.000Z",
    calibration: {
      retained: true,
      sessions: 2,
      warnings: 7,
      releaseReady: false,
      disagreementPreserved: true,
      evidence: ["evidence/calibration.json"],
      limitation: "Calibration only.",
    },
    ruleFixtures: { positive: true, negative: true, abstention: true, passed: true },
    products: [
      evaluationProduct("aegisops", "development"),
      evaluationProduct("scenestart", "development"),
      evaluationProduct("azure-optimizer", "holdout"),
    ],
    criteria: {
      equivalentComparisons: true,
      deterministicRuleFixtures: true,
      developmentEvidencePassing: true,
      lockedHoldoutPassing: true,
      humanCalibrationRetained: true,
      disagreementPreserved: true,
      noVanityScore: true,
    },
    promotedRules: ["task-bound-interaction-evidence"],
    withheldRules: [{ id: "storage-failure-control", reason: "Not applicable to holdout." }],
    humanEvidence: "not-generated",
    passed: true,
  }, null, 2)}\n`);

  const gateNames = [
    "build",
    "typecheck",
    "tests",
    "packageCheck",
    "packageSmoke",
    "independence",
    "offlineRelease",
    "archiveRemoval",
  ] as const;
  const releaseGates = {} as V4QualificationEvidence["releaseGates"];
  let tamperPath = "";
  for (const name of gateNames) {
    const stdoutPath = join(evidenceDirectory, `${name}.stdout.txt`);
    const stderrPath = join(evidenceDirectory, `${name}.stderr.txt`);
    await Promise.all([writeFile(stdoutPath, "passed\n"), writeFile(stderrPath, "")]);
    const passed = name !== failedGate;
    const commandPath = join(evidenceDirectory, `${name}.json`);
    await writeFile(commandPath, `${JSON.stringify({
      version: "1.0",
      id: name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      command: ["npm", "run", name],
      startedAt: "2026-08-30T12:00:00.000Z",
      completedAt: "2026-08-30T12:00:01.000Z",
      exitCode: passed ? 0 : 1,
      passed,
      stdout: await reference(root, stdoutPath),
      stderr: await reference(root, stderrPath),
    }, null, 2)}\n`);
    releaseGates[name] = await reference(root, commandPath);
    if (name === "tests") tamperPath = stdoutPath;
  }

  const readmePath = join(root, "README.md");
  const installationPath = join(root, "installation.md");
  const workflowPath = join(root, "quality.yml");
  await writeFile(readmePath, "MCP qualify-pilots evaluate-v4\n");
  await writeFile(installationPath, [
    "## Migration", "## Troubleshooting", "## Codex", "## Claude Code", "## Cursor",
    "## Windsurf And Cascade", "## Antigravity", "## GitHub Copilot", "## Kiro", "## Qoder",
    "## Lovable",
  ].join("\n"));
  await writeFile(workflowPath, [
    "Validate product design brief", "Compile deterministic design plan",
    "Build and statically verify V4 delivery pilots", "Run V4 bounded repair gate",
    "Run regression suite", "Qualify V4 multi-product delivery pilots",
    "Evaluate V4 before-and-after and locked holdout", "Validate packed installation",
    "Verify offline release", "Certify operation without reference archives",
  ].join("\n"));

  const evidence: V4QualificationEvidence = {
    version: "1.0",
    productEvidence: {
      pilotQualification: await reference(root, pilotPath),
      holdoutEvaluation: await reference(root, evaluationPath),
    },
    releaseGates,
    documentation: {
      readme: await reference(root, readmePath),
      installation: await reference(root, installationPath),
      workflow: await reference(root, workflowPath),
    },
  };
  return { root, evidence, tamperPath };
}

test("V4 qualification accepts complete integrity-bound release evidence", async (context) => {
  const { root, evidence } = await createFixture();
  context.after(() => rm(root, { recursive: true, force: true }));
  const report = await evaluateV4Qualification({ evidence, projectRoot: root });
  assert.equal(report.passed, true, JSON.stringify(report, null, 2));
  assert.equal(report.humanEvidence, "retained-calibration-only");
  assert.equal(report.supportedClaims.length, 4);
  assert.ok(report.limitations.some((limitation) =>
    limitation.includes("Private V3 portfolio qualification remains a separate, ignored local evidence set")
  ));
  assert.equal(report.limitations.some((limitation) => limitation.includes("cannot be claimed")), false);
});

test("V4 qualification rejects tampered command logs", async (context) => {
  const { root, evidence, tamperPath } = await createFixture();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(tamperPath, "tampered\n");
  await assert.rejects(
    evaluateV4Qualification({ evidence, projectRoot: root }),
    /digest mismatch/,
  );
});

test("V4 qualification withholds release claims when a package gate fails", async (context) => {
  const { root, evidence } = await createFixture("packageSmoke");
  context.after(() => rm(root, { recursive: true, force: true }));
  const report = await evaluateV4Qualification({ evidence, projectRoot: root });
  assert.equal(report.passed, false);
  assert.equal(report.criteria.packageAndOfflineRelease, false);
  assert.equal(report.criteria.privateEvidenceExcluded, false);
  assert.deepEqual(report.supportedClaims, []);
});
