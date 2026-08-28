import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { parse } from "yaml";

import { loadInterfaceTrustContract } from "../src/interface-trust/loader.js";
import {
  interfaceTrustContractSchema,
  type InterfaceTrustContract,
} from "../src/interface-trust/schema.js";
import { validateInterfaceTrustContract } from "../src/interface-trust/validator.js";

const templatePath = join(
  process.cwd(),
  "knowledge-base",
  "design-intelligence",
  "interface-trust.template.yaml",
);
const schemaPath = join(
  process.cwd(),
  "knowledge-base",
  "design-intelligence",
  "interface-trust.schema.yaml",
);
const violationPath = join(process.cwd(), "tests", "fixtures", "interface-trust-violations.yaml");

type ViolationSuite = {
  version: string;
  base: string;
  cases: Array<{
    id: string;
    scenario: string;
    target: { collection: "states" | "claims" | "records"; id: string };
    changes: Record<string, unknown>;
    remove?: string[];
    expectedRules: string[];
  }>;
};

function merge(target: Record<string, unknown>, changes: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(changes)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      merge(target[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      target[key] = value;
    }
  }
}

function applyCase(contract: InterfaceTrustContract, fixture: ViolationSuite["cases"][number]): void {
  let target: Record<string, unknown> | undefined;
  if (fixture.target.collection === "records") {
    target = contract.records[fixture.target.id as "history" | "export"] as Record<string, unknown>;
  } else {
    target = contract[fixture.target.collection].find((entry) => entry.id === fixture.target.id) as
      | Record<string, unknown>
      | undefined;
  }
  assert.ok(target, fixture.id);
  merge(target, fixture.changes);
  for (const key of fixture.remove ?? []) delete target[key];
}

test("maintained interface trust template covers all required states and claims", async () => {
  const contract = await loadInterfaceTrustContract(templatePath);
  const report = validateInterfaceTrustContract(contract, templatePath);

  assert.equal(report.passed, true, JSON.stringify(report.findings, null, 2));
  assert.deepEqual(report.summary, { errors: 0, warnings: 0, info: 0 });
  assert.deepEqual(report.coverage, {
    sources: 7,
    states: 5,
    claims: 40,
    actions: 1,
    scenarios: { demo: true, live: true, fallback: true, stale: true, disconnected: true },
  });
  assert.ok(report.traceability.every((entry) => entry.traced));
});

test("negative trust fixtures isolate every required scenario and provenance boundary", async () => {
  const suite = parse(await readFile(violationPath, "utf8")) as ViolationSuite;
  assert.equal(suite.version, "1.0");
  assert.deepEqual(new Set(suite.cases.map((entry) => entry.scenario)), new Set([
    "demo",
    "live",
    "fallback",
    "stale",
    "disconnected",
  ]));

  const base = await loadInterfaceTrustContract(join(process.cwd(), suite.base));
  for (const fixture of suite.cases) {
    const contract = structuredClone(base);
    applyCase(contract, fixture);
    const report = validateInterfaceTrustContract(contract, `${violationPath}#${fixture.id}`);
    const rules = new Set(report.findings.map((entry) => entry.ruleId));
    assert.equal(report.passed, false, fixture.id);
    for (const rule of fixture.expectedRules) {
      assert.ok(rules.has(rule), `${fixture.id} expected ${rule}`);
    }
  }
});

test("portable schema publishes the canonical enums and freshness condition", async () => {
  const schema = parse(await readFile(schemaPath, "utf8")) as {
    properties?: { version?: { const?: unknown } };
    $defs?: {
      state?: { properties?: { dataMode?: { enum?: unknown[] }; connection?: { enum?: unknown[] } } };
      freshness?: { allOf?: unknown[] };
    };
  };
  assert.equal(schema.properties?.version?.const, "1.0");
  assert.deepEqual(schema.$defs?.state?.properties?.dataMode?.enum, [
    "demo",
    "live",
    "hybrid",
    "imported",
    "cached",
  ]);
  assert.deepEqual(schema.$defs?.state?.properties?.connection?.enum, [
    "unknown",
    "checking",
    "connected",
    "degraded",
    "disconnected",
  ]);
  assert.equal(schema.$defs?.freshness?.allOf?.length, 1);
});

test("runtime schema rejects current freshness without timestamp and timezone", async () => {
  const contract = structuredClone(await loadInterfaceTrustContract(templatePath)) as unknown as Record<string, unknown>;
  const states = contract.states as Array<Record<string, unknown>>;
  states[0]!.freshness = { status: "current" };
  assert.equal(interfaceTrustContractSchema.safeParse(contract).success, false);
});
