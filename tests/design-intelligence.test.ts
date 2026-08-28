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
const visualViolationPath = join(
  process.cwd(),
  "tests",
  "fixtures",
  "visual-polish-violations.yaml",
);
const integrationViolationPath = join(
  process.cwd(),
  "tests",
  "fixtures",
  "v2-integration-violations.yaml",
);

type VisualCollection =
  | "visualDirection"
  | "ornamentPolicy"
  | "typographyRoles"
  | "grids"
  | "surfaces"
  | "densityViewports"
  | "interactionStates"
  | "tokens"
  | "motionEquivalents"
  | "charts"
  | "captures"
  | "contrastPairs"
  | "humanReview";

type VisualViolationSuite = {
  version: string;
  base: string;
  cases: Array<{
    id: string;
    target: { collection: VisualCollection; id: string };
    changes: Record<string, unknown>;
    expectedRules: string[];
  }>;
};

type IntegrationCollection =
  | "interfaceTrust"
  | "informationHierarchy"
  | "metricContracts"
  | "metrics"
  | "charts"
  | "generationSteps";

type IntegrationViolationSuite = {
  version: string;
  base: string;
  cases: Array<{
    id: string;
    target: { collection: IntegrationCollection; id: string };
    changes: Record<string, unknown>;
    expectedRules: string[];
  }>;
};

function visualTarget(manifest: Record<string, any>, collection: VisualCollection, id: string): Record<string, unknown> | undefined {
  const records: Record<VisualCollection, Array<Record<string, unknown>>> = {
    visualDirection: [manifest.visualDirection],
    ornamentPolicy: [manifest.visualDirection.ornamentPolicy],
    typographyRoles: manifest.typography.roles,
    grids: manifest.composition.grids,
    surfaces: manifest.composition.surfaces,
    densityViewports: manifest.densityProfile.viewportBehavior,
    interactionStates: manifest.interactionStates.states,
    tokens: manifest.tokenSystem.tokens,
    motionEquivalents: manifest.motion.reducedMotion.equivalents,
    charts: manifest.chartContracts,
    captures: manifest.renderedEvidence.captures,
    contrastPairs: manifest.accessibility.contrastPairs,
    humanReview: [manifest.humanVisualReview],
  };
  const keys: Record<VisualCollection, string> = {
    visualDirection: "visual-direction",
    ornamentPolicy: "ornament-policy",
    typographyRoles: "role",
    grids: "viewport",
    surfaces: "role",
    densityViewports: "viewport",
    interactionStates: "state",
    tokens: "name",
    motionEquivalents: "motionRef",
    charts: "id",
    captures: "viewport",
    contrastPairs: "id",
    humanReview: "human-review",
  };
  if (["visualDirection", "ornamentPolicy", "humanReview"].includes(collection)) return records[collection][0];
  return records[collection].find((entry) => String(entry[keys[collection]]) === id);
}

function integrationTarget(
  manifest: Record<string, any>,
  collection: IntegrationCollection,
  id: string,
): Record<string, unknown> | undefined {
  if (collection === "interfaceTrust") return manifest.interfaceTrust;
  if (collection === "informationHierarchy") return manifest.informationHierarchy;
  if (collection === "metricContracts") return manifest.metricContracts;
  if (collection === "metrics") {
    return manifest.metricContracts.metrics.find((entry: Record<string, unknown>) => entry.metricId === id);
  }
  if (collection === "charts") {
    return manifest.chartContracts.find((entry: Record<string, unknown>) => entry.id === id);
  }
  return manifest.generationWorkflow.steps.find((entry: Record<string, unknown>) => entry.stage === id);
}

test("maintained design-deliverable template passes all deterministic checks", async () => {
  const manifest = await loadDesignDeliverable(templatePath);
  const report = validateDesignDeliverable(manifest, templatePath);

  assert.equal(report.passed, true);
  assert.deepEqual(report.summary, { errors: 0, warnings: 0, info: 0 });
  assert.equal(report.coverage.tokens, 92);
  assert.equal(report.coverage.assets, 3);
  assert.ok(report.contrastResults.every((result) => result.passed));
  assert.equal(report.contrastResults.length, 8);
  assert.equal(report.contrastResults.find((result) => result.id === "primary-text-on-surface")?.ratio, 19.22);
  assert.equal(report.coverage.typographyRoles, 8);
  assert.equal(report.coverage.interactionStates, 9);
  assert.equal(report.coverage.chartContracts, 1);
  assert.equal(report.coverage.renderedViewports, 4);
  assert.equal(report.coverage.metricContracts, 3);
  assert.equal(report.coverage.generationStages, 9);
  assert.equal(report.integration.generationReady, true);
  assert.equal(report.integration.trustStatus, "declared");
  assert.equal(report.integration.informationStatus, "declared");
  assert.equal(report.integration.contractsValidated, false);
  assert.equal(report.integration.automatedVerificationReady, false);
  assert.equal(report.integration.humanReviewReady, false);
  assert.equal(report.integration.releaseReady, false);
  assert.deepEqual(report.visualPolish.requiredViewports, {
    "375": "planned",
    "768": "planned",
    "1024": "planned",
    "1440": "planned",
  });
  assert.equal(report.visualPolish.renderedEvidenceReady, false);
  assert.equal(report.visualPolish.humanReviewReady, false);
  assert.equal(report.visualPolish.releaseReady, false);
});

test("V2 integration mutations reject broken contracts, evidence, and generation order", async () => {
  const suite = parse(await readFile(integrationViolationPath, "utf8")) as IntegrationViolationSuite;
  assert.equal(suite.version, "1.0");
  const base = await loadDesignDeliverable(join(process.cwd(), suite.base));

  for (const fixture of suite.cases) {
    const manifest = structuredClone(base) as unknown as Record<string, any>;
    const target = integrationTarget(manifest, fixture.target.collection, fixture.target.id);
    assert.ok(target, fixture.id);
    Object.assign(target, fixture.changes);
    const report = validateDesignDeliverable(manifest as never, `${integrationViolationPath}#${fixture.id}`);
    const rules = new Set(report.findings.map((finding) => finding.ruleId));
    assert.equal(report.passed, false, fixture.id);
    for (const rule of fixture.expectedRules) {
      assert.ok(rules.has(rule), `${fixture.id} expected ${rule}`);
    }
  }
});

test("visual-polish mutations isolate composition, state, chart, evidence, and review rules", async () => {
  const suite = parse(await readFile(visualViolationPath, "utf8")) as VisualViolationSuite;
  assert.equal(suite.version, "1.0");
  const base = await loadDesignDeliverable(join(process.cwd(), suite.base));

  for (const fixture of suite.cases) {
    const manifest = structuredClone(base) as unknown as Record<string, any>;
    const target = visualTarget(manifest, fixture.target.collection, fixture.target.id);
    assert.ok(target, fixture.id);
    Object.assign(target, fixture.changes);
    const report = validateDesignDeliverable(manifest as never, `${visualViolationPath}#${fixture.id}`);
    const rules = new Set(report.findings.map((finding) => finding.ruleId));
    assert.equal(report.passed, false, fixture.id);
    for (const rule of fixture.expectedRules) {
      assert.ok(rules.has(rule), `${fixture.id} expected ${rule}`);
    }
  }
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
    properties?: { version?: { enum?: unknown[] } };
    required?: unknown[];
    allOf?: unknown[];
    $defs?: {
      productTask?: unknown;
      interfaceTrust?: unknown;
      informationHierarchy?: unknown;
      metricContracts?: unknown;
      generationWorkflow?: unknown;
      typography?: unknown;
      renderedEvidence?: unknown;
      humanVisualReview?: unknown;
    };
  };
  assert.equal(portableSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.deepEqual(portableSchema.properties?.version?.enum, ["1.0", "2.0", "2.1"]);
  assert.ok(portableSchema.required?.includes("accessibility"));
  assert.equal(portableSchema.allOf?.length, 1);
  assert.ok(portableSchema.$defs?.productTask);
  assert.ok(portableSchema.$defs?.interfaceTrust);
  assert.ok(portableSchema.$defs?.informationHierarchy);
  assert.ok(portableSchema.$defs?.metricContracts);
  assert.ok(portableSchema.$defs?.generationWorkflow);
  assert.ok(portableSchema.$defs?.typography);
  assert.ok(portableSchema.$defs?.renderedEvidence);
  assert.ok(portableSchema.$defs?.humanVisualReview);
});
