import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { aggregateQualityGates } from "../src/aggregate/runner.js";
import type { AcceptanceStatus } from "../src/acceptance/types.js";
import { inspectProductContract } from "../src/contracts/validator.js";

const contractPath = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "aegisops",
  "product-contract.yaml",
);

test("release aggregation requires every profile and every bound criterion", async (context) => {
  const inspection = await inspectProductContract(contractPath, { projectRoot: process.cwd() });
  assert.ok(inspection.contract);
  const root = await mkdtemp(join(tmpdir(), "ztothez-design-aggregate-test-"));
  context.after(() => rm(root, { recursive: true, force: true }));

  async function writeProfile(
    profile: string,
    overrides: Record<string, AcceptanceStatus> = {},
  ): Promise<string> {
    const directory = join(root, profile);
    await mkdir(directory, { recursive: true });
    const criterionIds = new Set(
      inspection.contract!.verification.bindings
        .filter((binding) => binding.profile === profile)
        .flatMap((binding) => binding.acceptanceCriteria),
    );
    const criteria = inspection.contract!.acceptanceCriteria
      .filter((criterion) => criterionIds.has(criterion.id))
      .map((criterion) => ({
        id: criterion.id,
        title: criterion.title,
        severity: criterion.severity,
        status: overrides[criterion.id] ?? "pass",
        journeys: ["fixture"],
        evidence: [],
      }));
    const failed = criteria.filter((criterion) => criterion.status === "fail").length;
    const unverified = criteria.filter((criterion) => criterion.status === "unverified").length;
    const acceptancePassed = failed === 0 && unverified === 0;
    const acceptance = {
      version: "test",
      generatedAt: new Date(0).toISOString(),
      contractId: inspection.contract!.id,
      profile,
      criteria,
      summary: {
        passed: criteria.length - failed - unverified,
        failed,
        unverified,
        blockerFailures: criteria.filter(
          (criterion) => criterion.severity === "blocker" && criterion.status === "fail",
        ).length,
        blockerUnverified: criteria.filter(
          (criterion) => criterion.severity === "blocker" && criterion.status === "unverified",
        ).length,
        warningFailures: 0,
        warningUnverified: 0,
      },
      passed: acceptancePassed,
    };
    const stage = { status: "pass", errors: 0, warnings: 0, info: 0, evidence: [] };
    const quality = {
      version: "test",
      generatedAt: new Date(0).toISOString(),
      outputDirectory: directory,
      contractPath,
      repository: "/tmp/repository",
      url: "http://127.0.0.1:3000",
      profile,
      failOn: "error",
      stages: {
        contract: stage,
        architecture: stage,
        runtime: stage,
        acceptance: acceptancePassed
          ? stage
          : { ...stage, status: "fail", errors: 1 },
      },
      summary: { errors: acceptancePassed ? 0 : 1, warnings: 0, info: 0 },
      complete: true,
      passed: acceptancePassed,
    };
    await writeFile(join(directory, "quality-gate.json"), JSON.stringify(quality), "utf8");
    await writeFile(join(directory, "acceptance-report.json"), JSON.stringify(acceptance), "utf8");
    return directory;
  }

  const demo = await writeProfile("demo-success");
  const offline = await writeProfile("offline-recovery");
  const responsive = await writeProfile("responsive-overview");
  const passing = await aggregateQualityGates({
    contractPath,
    projectRoot: process.cwd(),
    reportDirectories: [demo, offline, responsive],
    outputDirectory: join(root, "passing-release"),
  });
  assert.equal(passing.complete, true, JSON.stringify(passing.issues, null, 2));
  assert.equal(passing.passed, true);
  assert.equal(passing.summary.profilesPassed, 3);
  assert.equal(passing.summary.criteriaUnverified, 0);
  await stat(join(passing.outputDirectory, "aggregate-report.json"));
  await stat(join(passing.outputDirectory, "aggregate-report.md"));

  const missing = await aggregateQualityGates({
    contractPath,
    projectRoot: process.cwd(),
    reportDirectories: [demo, responsive],
    outputDirectory: join(root, "missing-release"),
  });
  assert.equal(missing.complete, false);
  assert.equal(missing.passed, false);
  assert.ok(missing.issues.some((issue) => issue.includes("offline-recovery")));

  const duplicate = await aggregateQualityGates({
    contractPath,
    projectRoot: process.cwd(),
    reportDirectories: [demo, offline, offline, responsive],
    outputDirectory: join(root, "duplicate-release"),
  });
  assert.equal(duplicate.complete, false);
  assert.ok(duplicate.issues.some((issue) => issue.includes("Duplicate profile reports")));

  await writeProfile("offline-recovery", { "offline-recovery": "fail" });
  const failing = await aggregateQualityGates({
    contractPath,
    projectRoot: process.cwd(),
    reportDirectories: [demo, offline, responsive],
    outputDirectory: join(root, "failing-release"),
  });
  assert.equal(failing.complete, true);
  assert.equal(failing.passed, false);
  assert.equal(
    failing.criteria.find((criterion) => criterion.id === "offline-recovery")?.status,
    "fail",
  );
});
