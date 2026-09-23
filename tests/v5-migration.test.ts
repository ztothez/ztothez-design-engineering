import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { buildV5MigrationReport } from "../src/v5-migration/evaluator.js";
import { loadV5MigrationReport } from "../src/v5-migration/loader.js";
import { formatV5MigrationReport, formatV5ReleaseNotesDraft } from "../src/v5-migration/report.js";
import { parseNodeTestSummary } from "../src/v5-migration/test-summary.js";

test("V5 migration report qualifies local source removal while public actions remain locked", async () => {
  const admission = JSON.parse(await readFile("governance/knowledge-admission.json", "utf8")) as {
    records: Array<{ path: string }>;
  };
  const report = await buildV5MigrationReport({
    packageFiles: admission.records.map((record) => record.path),
    publicFiles: ["README.md"],
  });

  assert.equal(report.passed, true);
  assert.equal(report.version, "2.0");
  assert.equal(report.status, "local-qualified");
  assert.equal(report.counts.admitted, 142);
  assert.equal(report.counts.removed, 46);
  assert.equal(report.counts.privatelyArchived, 46);
  assert.ok(report.counts.rewritten > 0);
  assert.equal(report.counts.blocked, 0);
  assert.equal(report.knowledgeIdentity.packageKnowledgeMatchesAdmission, true);
  assert.equal(report.localEvidence.sourceRemovalQualified, true);
  assert.deepEqual(report.fileSetDifference.packageOnly, admission.records.map((record) => record.path).sort());
  assert.deepEqual(report.fileSetDifference.publicOnly, ["README.md"]);
  assert.ok(report.artifacts.rewritten.every((artifact) => artifact.derivedFrom.path.length > 0));
  assert.ok(report.artifacts.rewritten.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.derivedFrom.digest.value)));
  assert.ok(report.artifacts.rewritten.every((artifact) => artifact.preChangeDigest.value === "not-present-before-rewrite"));
  assert.deepEqual([...new Set(Object.values(report.ownerReview.publicActions))], ["not-authorized"]);
});

test("V5 migration report blocks when package knowledge identity drifts", async () => {
  const report = await buildV5MigrationReport({ packageFiles: [] });

  assert.equal(report.passed, false);
  assert.equal(report.status, "blocked");
  assert.equal(report.knowledgeIdentity.packageKnowledgeMatchesAdmission, false);
  assert.equal(report.claims.length, 0);
});

test("V5 migration Markdown and release notes avoid public release authorization", async () => {
  const admission = JSON.parse(await readFile("governance/knowledge-admission.json", "utf8")) as {
    records: Array<{ path: string }>;
  };
  const report = await buildV5MigrationReport({
    packageFiles: admission.records.map((record) => record.path),
    releaseNotesDraftPath: ".ztothez-design-runtime/v5-migration/release-notes-draft.md",
  });
  const markdown = formatV5MigrationReport(report);
  const releaseNotes = formatV5ReleaseNotesDraft(report);

  assert.match(markdown, /git-push: not-authorized/);
  assert.match(markdown, /npm-publish: not-authorized/);
  assert.match(markdown, /# V6 Migration Qualification Report/);
  assert.match(markdown, /V5 remains authoritative/);
  assert.match(markdown, /Prior artifact SHA-256/);
  assert.match(markdown, /Derived from/);
  assert.match(releaseNotes, /does not authorize/);
  assert.equal(report.releaseNotes.prohibitedComparativeInputsNamed, false);
});

test("migration test summary parser records TAP counts without hardcoding", () => {
  const output = [
    "# tests 240",
    "# suites 0",
    "# pass 235",
    "# fail 2",
    "# cancelled 0",
    "# skipped 3",
  ].join("\n");
  assert.deepEqual(parseNodeTestSummary(output), { passed: 235, failed: 2, skipped: 3 });
  assert.equal(parseNodeTestSummary("tests passed"), "count-unavailable");
});

test("migration report records actual prior digests supplied by the capture boundary", async () => {
  const initial = await buildV5MigrationReport();
  const prior = Object.fromEntries(initial.artifacts.rewritten.map((artifact) => [artifact.path, "a".repeat(64)]));
  const report = await buildV5MigrationReport({ preChangeDigests: prior });
  assert.ok(report.artifacts.rewritten.every((artifact) => artifact.preChangeDigest.value === "a".repeat(64)));
  assert.ok(report.artifacts.rewritten.every(
    (artifact) => artifact.preChangeDigest.value !== artifact.derivedFrom.digest.value,
  ));
});

test("migration loader accepts legacy version 1.0 reports", async () => {
  const root = await mkdtemp(join("/tmp", "ztde-v5-loader-"));
  try {
    const current = await buildV5MigrationReport();
    const legacy = {
      ...current,
      version: "1.0",
      artifacts: {
        ...current.artifacts,
        rewritten: current.artifacts.rewritten.map(({ derivedFrom, ...artifact }) => ({
          ...artifact,
          preChangeDigest: derivedFrom.digest,
        })),
      },
      localEvidence: {
        ...current.localEvidence,
        commandEvidence: Object.fromEntries(Object.entries(current.localEvidence.commandEvidence).map(
          ([id, { testCounts, ...evidence }]) => [id, evidence],
        )),
      },
    };
    delete (legacy as Partial<typeof legacy>).fileSetDifference;
    await writeFile(join(root, "legacy.json"), JSON.stringify(legacy), "utf8");
    const loaded = await loadV5MigrationReport("legacy.json", root);
    assert.equal(loaded.version, "1.0");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
