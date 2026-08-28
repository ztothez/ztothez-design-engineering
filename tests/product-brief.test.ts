import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { parse } from "yaml";

import { loadProductDesignBrief } from "../src/product-brief/loader.js";
import {
  productDesignBriefSchema,
  type ProductDesignBrief,
} from "../src/product-brief/schema.js";
import { validateProductDesignBrief } from "../src/product-brief/validator.js";

const templatePath = join(process.cwd(), "knowledge-base", "design-intelligence", "product-design-brief.template.yaml");
const schemaPath = join(process.cwd(), "knowledge-base", "design-intelligence", "product-design-brief.schema.yaml");
const violationPath = join(process.cwd(), "tests", "fixtures", "product-design-brief-violations.yaml");

type Collection = "evidenceSources" | "tasks" | "dataSources" | "states" | "assumptions" | "acceptanceCriteria" | "platforms";
type ViolationSuite = {
  version: string;
  base: string;
  cases: Array<{
    id: string;
    target: { collection: Collection; id: string };
    changes?: Record<string, unknown>;
    remove?: boolean;
    expectedRules: string[];
  }>;
};

function merge(target: Record<string, unknown>, changes: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(changes)) {
    if (value && typeof value === "object" && !Array.isArray(value) && target[key] && typeof target[key] === "object" && !Array.isArray(target[key])) {
      merge(target[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      target[key] = value;
    }
  }
}

function recordId(collection: Collection, record: Record<string, unknown>): unknown {
  return collection === "states" ? record.state : record.id;
}

function applyCase(brief: ProductDesignBrief, fixture: ViolationSuite["cases"][number]): void {
  const collection = brief[fixture.target.collection] as Array<Record<string, unknown>>;
  const index = collection.findIndex((entry) => recordId(fixture.target.collection, entry) === fixture.target.id);
  assert.notEqual(index, -1, fixture.id);
  if (fixture.remove) {
    collection.splice(index, 1);
  } else {
    merge(collection[index]!, fixture.changes ?? {});
  }
}

test("maintained product design brief is generation-ready", async () => {
  const brief = await loadProductDesignBrief(templatePath);
  const report = validateProductDesignBrief(brief, templatePath);

  assert.equal(report.passed, true, JSON.stringify(report.findings, null, 2));
  assert.equal(report.generationReady, true);
  assert.deepEqual(report.summary, { errors: 0, warnings: 0, info: 0 });
  assert.deepEqual(report.coverage, {
    evidenceSources: 2,
    audiences: 1,
    primaryAudiences: 1,
    outcomes: 2,
    tasks: 1,
    dataSources: 1,
    states: 7,
    platforms: 1,
    requirements: 4,
    acceptanceCriteria: 4,
  });
  assert.equal(report.sourcePath, "product-design-brief.template.yaml");
});

test("product brief mutations block unsupported generation", async () => {
  const suite = parse(await readFile(violationPath, "utf8")) as ViolationSuite;
  assert.equal(suite.version, "1.0");
  const base = await loadProductDesignBrief(join(process.cwd(), suite.base));

  for (const fixture of suite.cases) {
    const brief = structuredClone(base);
    applyCase(brief, fixture);
    const report = validateProductDesignBrief(brief, `${violationPath}#${fixture.id}`);
    const rules = new Set(report.findings.map((entry) => entry.ruleId));
    assert.equal(report.generationReady, false, fixture.id);
    for (const rule of fixture.expectedRules) {
      assert.ok(rules.has(rule), `${fixture.id} expected ${rule}`);
    }
  }
});

test("draft briefs pass semantic checks but cannot authorize generation", async () => {
  const brief = structuredClone(await loadProductDesignBrief(templatePath));
  brief.status = "draft";
  const report = validateProductDesignBrief(brief, templatePath);
  assert.equal(report.passed, true);
  assert.equal(report.generationReady, false);
  assert.ok(report.findings.some((entry) => entry.ruleId === "ZTDE-BRIEF-902"));
});

test("portable brief schema publishes data, state, and evidence boundaries", async () => {
  const schema = parse(await readFile(schemaPath, "utf8")) as {
    properties?: { version?: { const?: unknown }; status?: { enum?: unknown[] } };
    $defs?: {
      evidenceSource?: { properties?: { kind?: { enum?: unknown[] } } };
      dataSource?: { properties?: { mode?: { enum?: unknown[] } } };
      acceptanceCriterion?: { properties?: { method?: { enum?: unknown[] } } };
    };
  };
  assert.equal(schema.properties?.version?.const, "1.0");
  assert.deepEqual(schema.properties?.status?.enum, ["draft", "validated"]);
  assert.ok(schema.$defs?.evidenceSource?.properties?.kind?.enum?.includes("agent-assumption"));
  assert.deepEqual(schema.$defs?.dataSource?.properties?.mode?.enum, ["live", "demo", "hybrid", "imported", "cached", "user-input", "local-static"]);
  assert.ok(schema.$defs?.acceptanceCriterion?.properties?.method?.enum?.includes("representative-user"));
});

test("runtime schema rejects an existing downstream contract without a path", async () => {
  const brief = structuredClone(await loadProductDesignBrief(templatePath)) as unknown as Record<string, unknown>;
  const downstream = brief.downstreamContracts as Array<Record<string, unknown>>;
  downstream[0] = { kind: "product-task", status: "exists" };
  assert.equal(productDesignBriefSchema.safeParse(brief).success, false);
});
