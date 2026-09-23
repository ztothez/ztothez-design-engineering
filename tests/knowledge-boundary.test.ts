import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import YAML from "yaml";

type BoundaryManifest = {
  version: string;
  authority: string;
  scope: string;
  currentBoundary: {
    admittedFileCount: number;
    packageKnowledgeFileCount: number;
  };
  removedArtifacts: Array<{
    id: string;
    previousPath: string;
    preRemovalContentDigest: {
      algorithm: "sha256";
      value: string;
    };
    disposition: "remove-from-public-tree";
    publicDistributionDecision: "prohibited";
    packageDecision: "prohibited";
    retrievalDecision: "prohibited";
    admissionDecision: "not-admitted";
    privateArchiveStatus: "owner-confirmed-private-backup-outside-repository";
    maintainedReplacementPaths: string[];
    removalEvidence: {
      currentTreeAbsent: true;
      historicalGitObjectDecision: "separate-owner-approval-required";
      tagAndReleaseDecision: "separate-owner-approval-required";
    };
  }>;
};

function runBoundary(argumentsList: string[]) {
  return spawnSync(process.execPath, ["scripts/knowledge-boundary.mjs", ...argumentsList], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

async function writeTemporaryManifest(manifest: BoundaryManifest) {
  const directory = await mkdtemp(join(tmpdir(), "ztde-knowledge-boundary-"));
  const path = join(directory, "public-knowledge-boundary.json");
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return path;
}

test("public knowledge boundary admits only the retained public knowledge set", async () => {
  const result = runBoundary(["--check"]);
  assert.equal(result.status, 0, result.stderr);

  const report = JSON.parse(result.stdout) as {
    admittedFileCount: number;
    removedArtifactCount: number;
    passed: boolean;
  };
  const manifest = JSON.parse(
    await readFile("governance/public-knowledge-boundary.json", "utf8"),
  ) as BoundaryManifest;
  const admission = JSON.parse(
    await readFile("governance/knowledge-admission.json", "utf8"),
  ) as { records: Array<{ path: string }> };

  assert.equal(report.passed, true);
  assert.equal(report.admittedFileCount, 142);
  assert.equal(report.removedArtifactCount, 46);
  assert.equal(manifest.version, "1.0");
  assert.equal(manifest.authority, "SKILL.md");
  assert.equal(manifest.scope, "public-repository-knowledge-boundary");
  assert.equal(manifest.currentBoundary.admittedFileCount, admission.records.length);
  assert.equal(manifest.currentBoundary.packageKnowledgeFileCount, admission.records.length);
  assert.equal(manifest.removedArtifacts.length, 46);
  assert.equal(new Set(manifest.removedArtifacts.map((record) => record.id)).size, 46);
});

test("removed baseline artifacts are not admitted, retrievable, packaged, or present", async () => {
  const manifest = JSON.parse(
    await readFile("governance/public-knowledge-boundary.json", "utf8"),
  ) as BoundaryManifest;
  const admission = JSON.parse(
    await readFile("governance/knowledge-admission.json", "utf8"),
  ) as { records: Array<{ path: string }> };
  const retrievalScope = YAML.parse(
    await readFile("knowledge-base/retrieval-scope.yaml", "utf8"),
  ) as { categories: Record<string, { files: string[] }> };
  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as { files: string[] };

  const admitted = new Set(admission.records.map((record) => record.path));
  const retrieved = new Set(Object.values(retrievalScope.categories).flatMap((category) => category.files));

  for (const record of manifest.removedArtifacts) {
    assert.equal(record.disposition, "remove-from-public-tree");
    assert.equal(record.publicDistributionDecision, "prohibited");
    assert.equal(record.packageDecision, "prohibited");
    assert.equal(record.retrievalDecision, "prohibited");
    assert.equal(record.admissionDecision, "not-admitted");
    assert.equal(record.privateArchiveStatus, "owner-confirmed-private-backup-outside-repository");
    assert.equal(record.removalEvidence.currentTreeAbsent, true);
    assert.equal(record.removalEvidence.historicalGitObjectDecision, "separate-owner-approval-required");
    assert.equal(record.removalEvidence.tagAndReleaseDecision, "separate-owner-approval-required");
    assert.equal(admitted.has(record.previousPath), false, `${record.previousPath} is admitted`);
    assert.equal(retrieved.has(record.previousPath), false, `${record.previousPath} is retrievable`);
    assert.equal(packageJson.files.includes(record.previousPath), false, `${record.previousPath} is explicitly packaged`);
    await assert.rejects(access(record.previousPath), { code: "ENOENT" });

    for (const replacementPath of record.maintainedReplacementPaths) {
      assert.ok(admitted.has(replacementPath), `${replacementPath} is not admitted`);
    }
  }
});

test("public knowledge boundary check rejects retained disposition drift", async () => {
  const manifest = JSON.parse(
    await readFile("governance/public-knowledge-boundary.json", "utf8"),
  ) as BoundaryManifest;
  const firstRecord = manifest.removedArtifacts[0];
  assert.ok(firstRecord);
  firstRecord.preRemovalContentDigest.value = createHash("sha256").update("tampered").digest("hex");

  const manifestPath = await writeTemporaryManifest(manifest);
  const result = runBoundary(["--check", "--manifest", manifestPath]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Public knowledge boundary manifest is stale/);
});
