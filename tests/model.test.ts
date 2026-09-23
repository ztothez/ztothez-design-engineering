import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { designEngineeringModelSchema, type DesignEngineeringModel } from "../src/model/schema.js";
import { validateDesignEngineeringModel } from "../src/model/validator.js";

function cloneModel(model: DesignEngineeringModel): DesignEngineeringModel {
  return JSON.parse(JSON.stringify(model)) as DesignEngineeringModel;
}

function runModelValidation(argumentsList: string[]) {
  return spawnSync(process.execPath, ["dist/cli/validate-model.js", ...argumentsList], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

async function loadModel(): Promise<DesignEngineeringModel> {
  return designEngineeringModelSchema.parse(
    JSON.parse(await readFile("model/ztothez-design-engineering-model.json", "utf8")),
  );
}

test("shadow design engineering model covers every V5 Item 4 category", async () => {
  const model = await loadModel();
  const report = await validateDesignEngineeringModel(model);

  assert.equal(report.status, "pass");
  assert.equal(report.lifecycle, "shadow");
  assert.equal(report.findingCount, 0);
  assert.equal(model.cutoverStatus, "not-authoritative-until-v5-item-8");
  assert.equal(model.policy.markdownRemainsWorkflowAuthorityDuringMigration, true);
  assert.equal(model.policy.privateSourcesAreRuntimeFallbacks, false);
  assert.equal(model.policy.unsupportedRequestsProduceKnowledgeGap, true);
  assert.equal(model.policy.documentOrderCannotResolveContradictions, true);

  for (const category of [
    "product-archetype",
    "user-task",
    "state-recovery-contract",
    "quality-attribute",
    "design-token",
    "component-responsibility",
    "information-priority",
    "interaction-pattern",
    "visual-composition",
    "accessibility-constraint",
    "evidence-class",
    "verification-method",
    "conflict-policy",
    "exception-policy",
    "abstention-policy",
  ]) {
    assert.ok(report.categoryCoverage[category], `${category} is missing`);
  }
});

test("shadow model traces product decisions through state, information, component, token, verification, and evidence", async () => {
  const model = await loadModel();
  const entities = new Map(model.entities.map((entity) => [entity.id, entity]));

  for (const trace of model.decisionTraces) {
    const categories = new Set(trace.orderedEntityRefs.map((id) => entities.get(id)?.category));
    const requiredCategories = [
      "state-recovery-contract",
      "information-priority",
      "component-responsibility",
      "design-token",
      "verification-method",
      "evidence-class",
    ] as const;
    for (const required of requiredCategories) {
      assert.ok(categories.has(required), `${trace.id} lacks ${required}`);
    }
    assert.ok(trace.expectedEvidenceClasses.includes("automated-verification"));
  }
});

test("model validator rejects active lifecycle before V5 cutover", async () => {
  const model = cloneModel(await loadModel());
  const entity = model.entities[0];
  assert.ok(entity);
  entity.lifecycle = "active";

  const report = await validateDesignEngineeringModel(model);

  assert.equal(report.status, "fail");
  assert.ok(report.findings.some((finding) => finding.ruleId === "ZTDE-MODEL-201"));
});

test("model validator rejects private, removed, or unknown source references", async () => {
  const model = cloneModel(await loadModel());
  const entity = model.entities[0];
  assert.ok(entity);
  entity.sourceRefs = ["private:local-research"];

  const report = await validateDesignEngineeringModel(model);

  assert.equal(report.status, "fail");
  assert.ok(report.findings.some((finding) => finding.ruleId === "ZTDE-MODEL-303"));
  assert.ok(report.findings.some((finding) => finding.ruleId === "ZTDE-MODEL-304"));
});

test("model validator rejects incomplete decision traces", async () => {
  const model = cloneModel(await loadModel());
  const trace = model.decisionTraces[0];
  assert.ok(trace);
  trace.orderedEntityRefs = trace.orderedEntityRefs.filter((id) => id !== "ZTDE-MODEL-TOKEN-001");

  const report = await validateDesignEngineeringModel(model);

  assert.equal(report.status, "fail");
  assert.ok(report.findings.some((finding) => finding.ruleId === "ZTDE-MODEL-603"));
});

test("validate-model CLI returns machine-readable shadow status", async () => {
  spawnSync("npm", ["run", "build", "--silent"], { cwd: process.cwd(), encoding: "utf8" });
  const result = runModelValidation(["--json"]);

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout) as { status: string; entityCount: number; findingCount: number };
  assert.equal(report.status, "pass");
  assert.equal(report.entityCount, 20);
  assert.equal(report.findingCount, 0);
});
