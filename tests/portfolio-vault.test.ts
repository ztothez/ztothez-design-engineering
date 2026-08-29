import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

import {
  deleteProjectEvidence,
  enforceArtifactPublicationPolicy,
  redactMachinePathsAndSecrets,
  scanTextForSecretsAndPaths,
  type VaultArtifactInput,
} from "../src/portfolio/vault.js";
import { portfolioBenchmarkReportSchema } from "../src/portfolio/run-schema.js";
import type { PortfolioProject } from "../src/portfolio/schema.js";

test("scanTextForSecretsAndPaths detects AWS keys, Bearer tokens, private keys, and absolute machine paths", () => {
  const secretText = "aws_access_key_id = AKIAIOSFODNN7EXAMPLE\naws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
  const scanSecrets = scanTextForSecretsAndPaths(secretText);
  assert.equal(scanSecrets.passed, false);
  assert.ok(scanSecrets.violations.some((v) => v.type === "secret" && v.pattern === "AWS Access Key"));

  const bearerText = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.secret";
  const scanBearer = scanTextForSecretsAndPaths(bearerText);
  assert.equal(scanBearer.passed, false);
  assert.ok(scanBearer.violations.some((v) => v.type === "secret" && v.pattern === "Bearer Token"));

  const pathText = "Error logged at /home/ztothez/Studio/experiments/UIX-Design-Skill/src/index.ts:12";
  const scanPath = scanTextForSecretsAndPaths(pathText);
  assert.equal(scanPath.passed, false);
  assert.ok(scanPath.violations.some((v) => v.type === "prohibited-absolute-path"));

  const cleanText = "All operations completed successfully with 0 findings.";
  const scanClean = scanTextForSecretsAndPaths(cleanText);
  assert.equal(scanClean.passed, true);
  assert.equal(scanClean.violations.length, 0);
});

test("redactMachinePathsAndSecrets replaces machine paths, home dirs, and secrets", () => {
  const rawText = "Failed at /home/ztothez/projects/secret-app with token http://localhost:3000/?token=abc123secret and AWS key AKIAIOSFODNN7EXAMPLE";
  const redacted = redactMachinePathsAndSecrets(rawText, {
    sourceRoot: "/home/ztothez/projects/secret-app",
    workspaceRoot: "/home/ztothez/projects",
  });

  assert.ok(!redacted.includes("/home/ztothez"));
  assert.ok(!redacted.includes("AKIAIOSFODNN7EXAMPLE"));
  assert.ok(redacted.includes("[source]"));
  assert.ok(redacted.includes("http://localhost:3000/?token=[redacted]"));
});

test("enforceArtifactPublicationPolicy enforces screenshot opt-in and binds provenance metadata", () => {
  const dummyProject: PortfolioProject = {
    id: "test-client-project",
    root: "studio-clients",
    path: "test-client",
    enabled: true,
    ownership: "client-authorized",
    authorizationEvidence: "Signed contract #123",
    confidentiality: "private-local",
    cohort: "development",
    publication: {
      sourceExcerpts: false,
      screenshots: false,
      machineReports: true,
      aggregateMetrics: true,
    },
    product: {
      domain: "finance",
      archetype: "operational-dashboard",
      intendedUsers: ["analyst"],
      primaryTasks: ["view summary"],
    },
    technology: {
      framework: "react",
      packageManager: "npm",
      entrypoint: "src/index.ts",
    },
    capabilities: [
      { stage: "source-audit", status: "supported", reason: "Static TypeScript source." },
    ],
    execution: {
      fixtureMode: "disconnected",
      networkPolicy: "denied",
      lifecycleScripts: false,
      allowedEnvironmentVariables: [],
      localPorts: [],
      commands: [],
    },
    paths: {
      include: ["src/**"],
      exclude: [],
    },
    source: {
      revisionPolicy: "capture-current",
      canonicalizationKey: "test-client",
    },
  };

  const artifacts: VaultArtifactInput[] = [
    { path: "report.json", kind: "report", bytes: 120, sha256: "a".repeat(64) },
    { path: "screenshot.png", kind: "screenshot", bytes: 4500, sha256: "b".repeat(64) },
  ];

  const { retainedArtifacts, purgedArtifacts } = enforceArtifactPublicationPolicy(
    artifacts,
    dummyProject,
    "digest123",
  );

  assert.equal(retainedArtifacts.length, 1);
  const retained = retainedArtifacts[0]!;
  assert.equal(retained.path, "report.json");
  assert.equal(retained.evidenceClass, "redacted-report");
  assert.equal(retained.policyDecision, "retained-by-policy");
  assert.equal(retained.sourceDigest, "digest123");

  assert.equal(purgedArtifacts.length, 1);
  const purged = purgedArtifacts[0]!;
  assert.equal(purged.path, "screenshot.png");
  assert.equal(purged.policyDecision, "screenshot-disabled-by-policy");
});

test("deleteProjectEvidence removes local project artifacts while preserving report structure", async () => {
  const runRoot = await mkdir(join(tmpdir(), `test-vault-run-${Date.now()}`), { recursive: true }).then(() => join(tmpdir(), `test-vault-run-${Date.now()}`));
  const runId = "run-test-123";
  const projectDir = join(runRoot, runId, "proj-a");

  await mkdir(projectDir, { recursive: true });
  await writeFile(join(projectDir, "raw-log.txt"), "private raw log", "utf8");
  await writeFile(join(projectDir, "screenshot.png"), "image data", "utf8");

  const reportPath = join(runRoot, runId, "report.json");
  const validReport = {
    version: "1.2.0",
    toolVersion: "2.0.2",
    runId,
    mode: "cohort",
    registryId: "reg-1",
    registryDigest: "d".repeat(64),
    projectIds: ["proj-a"],
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    projects: [
      {
        projectId: "proj-a",
        cohort: "development",
        environmentPolicy: { network: "denied", lifecycleScripts: false, environmentVariables: [] },
        commands: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        stages: [],
        artifacts: [],
        status: "passed",
      },
    ],
    summary: { passed: 1, findings: 0, limitations: 0, unsafeConfiguration: 0, sourceMutation: 0 },
    resultFingerprint: "f".repeat(64),
    passed: true,
  };
  await writeFile(reportPath, JSON.stringify(validReport, null, 2), "utf8");

  const deletion = await deleteProjectEvidence(runRoot, runId, "proj-a");
  assert.ok(deletion.deletedFiles >= 2);

  const reportContent = await readFile(reportPath, "utf8");
  const parsedReport = portfolioBenchmarkReportSchema.parse(JSON.parse(reportContent));
  assert.equal(parsedReport.passed, true);

  await rm(runRoot, { recursive: true, force: true }).catch(() => {});
});
