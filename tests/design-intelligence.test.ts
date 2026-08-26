import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { parse } from "yaml";

import { loadDesignDeliverable } from "../src/design-intelligence/loader.js";
import { designDeliverableSchema } from "../src/design-intelligence/schema.js";
import { validateDesignDeliverable } from "../src/design-intelligence/validator.js";

const templatePath = join(
  process.cwd(),
  "knowledge-base",
  "design-intelligence",
  "design-deliverable.template.yaml",
);

test("maintained design-deliverable template passes all deterministic checks", async () => {
  const manifest = await loadDesignDeliverable(templatePath);
  const report = validateDesignDeliverable(manifest, templatePath);

  assert.equal(report.passed, true);
  assert.deepEqual(report.summary, { errors: 0, warnings: 0, info: 0 });
  assert.equal(report.coverage.tokens, 7);
  assert.equal(report.coverage.assets, 3);
  assert.ok(report.contrastResults.every((result) => result.passed));
  assert.equal(report.contrastResults.length, 4);
  assert.equal(report.contrastResults.find((result) => result.id === "primary-text-on-surface")?.ratio, 19.22);
});

test("design intelligence validator rejects unresolved systems and provenance", async () => {
  const sourcePath = join(process.cwd(), "tests", "fixtures", "design-deliverable-violations.yaml");
  const manifest = await loadDesignDeliverable(sourcePath);
  const report = validateDesignDeliverable(manifest, sourcePath);
  const rules = new Set(report.findings.map((finding) => finding.ruleId));

  assert.equal(report.passed, false);
  for (const rule of [
    "ZTDE-DI-001",
    "ZTDE-DI-103",
    "ZTDE-DI-202",
    "ZTDE-DI-203",
    "ZTDE-DI-204",
    "ZTDE-DI-301",
    "ZTDE-DI-304",
    "ZTDE-DI-308",
    "ZTDE-DI-401",
    "ZTDE-DI-402",
    "ZTDE-DI-501",
    "ZTDE-DI-502",
    "ZTDE-DI-601",
    "ZTDE-DI-603",
    "ZTDE-DI-604",
  ]) {
    assert.ok(rules.has(rule), `expected ${rule}`);
  }
});

test("design-deliverable schema rejects raw values in semantic tokens", async () => {
  const source = parse(await readFile(templatePath, "utf8")) as Record<string, unknown>;
  const tokenSystem = source.tokenSystem as { tokens: Array<Record<string, unknown>> };
  tokenSystem.tokens[3] = {
    ...tokenSystem.tokens[3],
    value: "#0b0f14",
    reference: undefined,
  };

  const result = designDeliverableSchema.safeParse(source);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error.issues.map((issue) => issue.message).join("\n"), /require a reference/);
  }
});

test("portable schema exposes the versioned design contract", async () => {
  const schemaPath = join(
    process.cwd(),
    "knowledge-base",
    "design-intelligence",
    "design-deliverable.schema.yaml",
  );
  const portableSchema = parse(await readFile(schemaPath, "utf8")) as {
    $schema?: unknown;
    properties?: { version?: { const?: unknown } };
    required?: unknown[];
  };
  assert.equal(portableSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(portableSchema.properties?.version?.const, "1.0");
  assert.ok(portableSchema.required?.includes("accessibility"));
});
