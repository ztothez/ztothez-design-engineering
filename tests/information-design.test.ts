import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import { parse } from "yaml";

import { loadInformationDesignContract } from "../src/information-design/loader.js";
import {
  informationDesignContractSchema,
  type InformationDesignContract,
} from "../src/information-design/schema.js";
import { validateInformationDesignContract } from "../src/information-design/validator.js";

const templatePath = join(
  process.cwd(),
  "knowledge-base",
  "design-intelligence",
  "information-design.template.yaml",
);
const schemaPath = join(
  process.cwd(),
  "knowledge-base",
  "design-intelligence",
  "information-design.schema.yaml",
);
const violationPath = join(process.cwd(), "tests", "fixtures", "information-design-violations.yaml");

type MutableCollection =
  | "metrics"
  | "findings"
  | "charts"
  | "collections"
  | "hierarchy"
  | "tasks"
  | "labelPolicies"
  | "valuePolicies";

type ViolationSuite = {
  version: string;
  base: string;
  cases: Array<{
    id: string;
    target: { collection: MutableCollection; id: string };
    changes: Record<string, unknown>;
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

function applyCase(contract: InformationDesignContract, fixture: ViolationSuite["cases"][number]): void {
  const collection = contract[fixture.target.collection] as Array<Record<string, unknown>>;
  const target = fixture.target.collection === "hierarchy"
    ? collection.find((entry) => entry.level === fixture.target.id)
    : collection.find((entry) => entry.id === fixture.target.id);
  assert.ok(target, fixture.id);
  merge(target, fixture.changes);
}

test("maintained information-design template covers hierarchy and complete answer flow", async () => {
  const contract = await loadInformationDesignContract(templatePath);
  const report = validateInformationDesignContract(contract, templatePath);

  assert.equal(report.passed, true, JSON.stringify(report.findings, null, 2));
  assert.deepEqual(report.summary, { errors: 0, warnings: 0, info: 0 });
  assert.deepEqual(report.coverage, {
    sources: 3,
    contexts: 1,
    metrics: 3,
    findings: 2,
    charts: 1,
    collections: 1,
    hierarchyLevels: 8,
    answerFlow: {
      "identify-context": true,
      "identify-priority": true,
      "explain-impact": true,
      "inspect-evidence": true,
      "identify-next-action": true,
      "verify-success": true,
    },
  });
});

test("negative information fixtures isolate decision and presentation boundaries", async () => {
  const suite = parse(await readFile(violationPath, "utf8")) as ViolationSuite;
  assert.equal(suite.version, "1.0");
  const base = await loadInformationDesignContract(join(process.cwd(), suite.base));

  for (const fixture of suite.cases) {
    const contract = structuredClone(base);
    applyCase(contract, fixture);
    const report = validateInformationDesignContract(contract, `${violationPath}#${fixture.id}`);
    const rules = new Set(report.findings.map((entry) => entry.ruleId));
    assert.equal(report.passed, false, fixture.id);
    for (const rule of fixture.expectedRules) {
      assert.ok(rules.has(rule), `${fixture.id} expected ${rule}`);
    }
  }
});

test("portable information schema publishes canonical hierarchy and answer questions", async () => {
  const schema = parse(await readFile(schemaPath, "utf8")) as {
    properties?: { version?: { const?: unknown } };
    $defs?: {
      hierarchy?: { properties?: { level?: { enum?: unknown[] } } };
      task?: { properties?: { question?: { enum?: unknown[] } } };
    };
  };
  assert.equal(schema.properties?.version?.const, "1.0");
  assert.deepEqual(schema.$defs?.hierarchy?.properties?.level?.enum, [
    "context-provenance",
    "primary-outcome-action",
    "critical-exceptions",
    "health-impact-metrics",
    "prioritized-findings",
    "operational-telemetry",
    "evidence-audit-trail",
    "history-exports",
  ]);
  assert.deepEqual(schema.$defs?.task?.properties?.question?.enum, [
    "identify-context",
    "identify-priority",
    "explain-impact",
    "inspect-evidence",
    "identify-next-action",
    "verify-success",
  ]);
});

test("runtime schema rejects stale freshness without timestamp and timezone", async () => {
  const contract = structuredClone(await loadInformationDesignContract(templatePath)) as unknown as Record<string, unknown>;
  const freshness = contract.freshness as Array<Record<string, unknown>>;
  freshness[0] = { id: "estate-current", status: "stale", sourceRef: "estate-api" };
  assert.equal(informationDesignContractSchema.safeParse(contract).success, false);
});
