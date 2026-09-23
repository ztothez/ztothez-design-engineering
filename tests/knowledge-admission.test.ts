import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

type AdmissionRecord = {
  id: string;
  path: string;
  contentDigest: {
    algorithm: "sha256";
    value: string;
  };
  sourceIdentity: {
    sourceOrigin: "original" | "user-owned";
    officialStandards: string[];
  };
  decisions: {
    publicDistribution: "approved";
    package: "approved";
    retrieval: "included" | "excluded";
    disposition: "admit";
  };
  review: {
    reviewedBy: string;
    reviewerRole: "owner-maintainer" | "human-maintainer";
    legalReviewStatus: "not-a-legal-opinion-owner-reviewed";
    humanAuthorizationStatus: "not-applicable-project-authored" | "owner-authorized";
    aiAgentCanComplete: false;
  };
};

type AdmissionManifest = {
  version: string;
  authority: string;
  scope: string;
  officialStandards: Array<{ id: string; canonicalUrl: string; reuseTerms: string }>;
  records: AdmissionRecord[];
};

function runAdmission(argumentsList: string[]) {
  return spawnSync(process.execPath, ["scripts/knowledge-admission.mjs", ...argumentsList], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

async function writeTemporaryManifest(manifest: AdmissionManifest) {
  const directory = await mkdtemp(join(tmpdir(), "ztde-knowledge-admission-"));
  const path = join(directory, "knowledge-admission.json");
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return path;
}

test("knowledge admission manifest is deterministic and admits the public knowledge boundary", async () => {
  const result = runAdmission(["--check"]);
  assert.equal(result.status, 0, result.stderr);

  const report = JSON.parse(result.stdout) as {
    admittedFileCount: number;
    officialStandardCount: number;
    passed: boolean;
  };
  const manifest = JSON.parse(
    await readFile("governance/knowledge-admission.json", "utf8"),
  ) as AdmissionManifest;
  const inventory = JSON.parse(
    await readFile("governance/public-knowledge-inventory.json", "utf8"),
  ) as { entries: Array<{ path: string; retrievalStatus: "included" | "excluded" }> };

  assert.equal(report.passed, true);
  assert.equal(manifest.version, "1.0");
  assert.equal(manifest.authority, "SKILL.md");
  assert.equal(manifest.scope, "public-knowledge-base");
  assert.equal(manifest.records.length, inventory.entries.length);
  assert.equal(report.admittedFileCount, inventory.entries.length);
  assert.equal(report.officialStandardCount, manifest.officialStandards.length);
  assert.equal(new Set(manifest.records.map((record) => record.id)).size, manifest.records.length);

  const retrievalByPath = new Map(inventory.entries.map((entry) => [entry.path, entry.retrievalStatus]));
  for (const record of manifest.records) {
    assert.equal(record.decisions.publicDistribution, "approved");
    assert.equal(record.decisions.package, "approved");
    assert.equal(record.decisions.disposition, "admit");
    assert.equal(record.decisions.retrieval, retrievalByPath.get(record.path));
    assert.equal(record.review.aiAgentCanComplete, false);
    assert.equal(record.review.legalReviewStatus, "not-a-legal-opinion-owner-reviewed");
    assert.equal(
      record.review.humanAuthorizationStatus,
      record.sourceIdentity.sourceOrigin === "user-owned"
        ? "owner-authorized"
        : "not-applicable-project-authored",
    );
    assert.equal(record.contentDigest.value, createHash("sha256").update(await readFile(record.path)).digest("hex"));
  }

  assert.ok(manifest.officialStandards.some((standard) => standard.id === "wcag-2.2"));
});

test("knowledge admission check rejects stale retained records", async () => {
  const manifest = JSON.parse(
    await readFile("governance/knowledge-admission.json", "utf8"),
  ) as AdmissionManifest;
  const firstRecord = manifest.records[0];
  assert.ok(firstRecord);
  firstRecord.contentDigest.value = "0".repeat(64);

  const manifestPath = await writeTemporaryManifest(manifest);
  const result = runAdmission(["--check", "--manifest", manifestPath]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Knowledge admission manifest is stale/);
});

test("knowledge admission validation rejects AI-completed review authority", async () => {
  const manifest = JSON.parse(
    await readFile("governance/knowledge-admission.json", "utf8"),
  ) as AdmissionManifest;
  const firstRecord = manifest.records[0];
  assert.ok(firstRecord);
  firstRecord.review.reviewedBy = "Codex AI Agent";

  const manifestPath = await writeTemporaryManifest(manifest);
  const result = runAdmission(["--validate-only", "--manifest", manifestPath]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /review cannot be completed by an AI agent/);
});
