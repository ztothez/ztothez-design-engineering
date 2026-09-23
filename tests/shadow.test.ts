import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { evaluateShadowCutover } from "../src/shadow/evaluator.js";
import { formatShadowEvaluation } from "../src/shadow/report.js";

test("shadow evaluation qualifies parity while preserving V5 authority", async () => {
  const root = await mkdtemp(join("/tmp", "ztde-shadow-"));
  try {
    await mkdir(join(root, "runtime"), { recursive: true });
    const products = ["aegisops", "scenestart", "azure-optimizer"].map((id) => ({ id, passed: true }));
    await writeFile(join(root, "runtime", "qualification.json"), JSON.stringify({ products }), "utf8");
    await writeFile(join(root, "runtime", "evaluation.json"), JSON.stringify({ products }), "utf8");
    await writeFile(join(root, "holdout.json"), JSON.stringify({
      projects: [{ projectId: "independent-product", cohort: "holdout", status: "limitations" }],
    }), "utf8");

    const report = await evaluateShadowCutover({
      runtimeRoot: join(root, "runtime"),
      pilotQualification: "qualification.json",
      pilotEvaluation: "evaluation.json",
      holdoutRoot: root,
      holdout: "holdout.json",
    });
    assert.equal(report.passed, true);
    assert.equal(report.evaluationId, "v6-shadow-qualification");
    assert.ok(!Number.isNaN(Date.parse(report.generatedAt)));
    assert.equal(report.authorityBeforeCutover, "V5");
    assert.equal(report.cutoverStatus, "not-approved");
    assert.equal(report.criteria.cutoverSeparatelyApproved, false);
    assert.equal(report.products.length, 4);
    const qualificationBytes = await readFile(join(root, "runtime", "qualification.json"));
    assert.equal(
      report.sourceReports.pilotQualification.digest.value,
      createHash("sha256").update(qualificationBytes).digest("hex"),
    );
    const markdown = formatShadowEvaluation(report);
    assert.match(markdown, /independent-product \(holdout\): pass \(limited: briefReadiness, designPlan not exercised\)/);
    assert.match(markdown, /briefReadiness: not exercised/);
    assert.match(markdown, /designPlan: not exercised/);

    const originalEvaluationDigest = report.sourceReports.pilotEvaluation.digest.value;
    await writeFile(join(root, "runtime", "evaluation.json"), JSON.stringify({ products }, null, 2) + "\n", "utf8");
    const changed = await evaluateShadowCutover({
      runtimeRoot: join(root, "runtime"),
      pilotQualification: "qualification.json",
      pilotEvaluation: "evaluation.json",
      holdoutRoot: root,
      holdout: "holdout.json",
    });
    assert.notEqual(changed.sourceReports.pilotEvaluation.digest.value, originalEvaluationDigest);
    assert.equal(
      changed.sourceReports.pilotQualification.digest.value,
      report.sourceReports.pilotQualification.digest.value,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("shadow evaluation rejects report traversal", async () => {
  await assert.rejects(
    () => evaluateShadowCutover({
      runtimeRoot: "/tmp",
      pilotQualification: "../outside.json",
      pilotEvaluation: "evaluation.json",
      holdout: "holdout.json",
    }),
    /escapes the allowed runtime root/,
  );
});
