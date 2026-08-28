import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import { runCompilePlanCli } from "../cli/compile-plan.js";
import { compileDesignPlan, DESIGN_PLAN_COMPILER_VERSION } from "../src/design-plan/compiler.js";
import { designPlanSchema } from "../src/design-plan/schema.js";
import { loadProductDesignBrief } from "../src/product-brief/loader.js";

const templatePath = join(process.cwd(), "knowledge-base", "design-intelligence", "product-design-brief.template.yaml");

test("design plan compilation is deterministic, traceable, and provisional for planned contracts", async () => {
  const brief = await loadProductDesignBrief(templatePath);
  const options = { briefSourcePath: templatePath, projectRoot: process.cwd() };
  const first = await compileDesignPlan(brief, options);
  const second = await compileDesignPlan(brief, options);

  assert.deepEqual(second, first);
  assert.equal(first.compilerVersion, DESIGN_PLAN_COMPILER_VERSION);
  assert.equal(first.status, "provisional");
  assert.equal(first.planningReady, true);
  assert.equal(first.implementationReady, false);
  assert.deepEqual(first.contracts.map((entry) => entry.validation), ["planned", "planned", "planned", "planned"]);
  assert.equal(first.routes[0]?.status, "confirmed");
  assert.equal(first.components.length, 5);
  assert.equal(first.informationArchitecture.length, 6);
  assert.equal(designPlanSchema.safeParse(first).success, true);
  assert.equal(JSON.stringify(first).includes(process.cwd()), false);

  const traceIds = new Set(first.traces.map((entry) => entry.id));
  for (const decision of first.decisions) {
    assert.ok(decision.traceRefs.length > 0);
    assert.ok(decision.traceRefs.every((reference) => traceIds.has(reference)));
  }
});

test("a draft brief compiles to a blocked plan without invented readiness", async () => {
  const brief = structuredClone(await loadProductDesignBrief(templatePath));
  brief.status = "draft";
  const plan = await compileDesignPlan(brief, { briefSourcePath: templatePath, projectRoot: process.cwd() });
  assert.equal(plan.status, "blocked");
  assert.equal(plan.planningReady, false);
  assert.equal(plan.implementationReady, false);
  assert.ok(plan.blockers.includes("The product design brief is not generation-ready."));
});

test("existing downstream product contracts run through the maintained validator", async () => {
  const brief = structuredClone(await loadProductDesignBrief(templatePath));
  brief.downstreamContracts[0] = {
    kind: "product-task",
    status: "exists",
    path: "knowledge-base/benchmarks/aegisops/product-contract.yaml",
  };
  const plan = await compileDesignPlan(brief, { briefSourcePath: templatePath, projectRoot: process.cwd() });
  assert.equal(plan.contracts[0]?.validation, "validated");
  assert.equal(plan.contracts[0]?.passed, true);
  assert.equal(plan.contracts[0]?.source, "knowledge-base/benchmarks/aegisops/product-contract.yaml");
});

test("all existing downstream contracts must pass before implementation readiness", async () => {
  const brief = structuredClone(await loadProductDesignBrief(templatePath));
  brief.downstreamContracts = [
    { kind: "product-task", status: "exists", path: "knowledge-base/benchmarks/aegisops/product-contract.yaml" },
    { kind: "interface-trust", status: "exists", path: "knowledge-base/design-intelligence/interface-trust.template.yaml" },
    { kind: "information-design", status: "exists", path: "knowledge-base/design-intelligence/information-design.template.yaml" },
    { kind: "design-deliverable", status: "exists", path: "knowledge-base/design-intelligence/design-deliverable.template.yaml" },
  ];
  const plan = await compileDesignPlan(brief, { briefSourcePath: templatePath, projectRoot: process.cwd() });
  assert.deepEqual(plan.contracts.map((entry) => entry.validation), ["validated", "validated", "validated", "validated"]);
  assert.equal(plan.status, "ready");
  assert.equal(plan.implementationReady, true);
});

test("symlink escapes in downstream paths are blocked without exposing absolute paths", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-plan-root-"));
  const outside = await mkdtemp(join(tmpdir(), "ztde-plan-outside-"));
  context.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]));
  await writeFile(join(outside, "contract.yaml"), "version: invalid\n", "utf8");
  await symlink(join(outside, "contract.yaml"), join(root, "escaped.yaml"));

  const brief = structuredClone(await loadProductDesignBrief(templatePath));
  brief.downstreamContracts[0] = { kind: "product-task", status: "exists", path: "escaped.yaml" };
  const plan = await compileDesignPlan(brief, { briefSourcePath: "brief.yaml", projectRoot: root });
  assert.equal(plan.status, "blocked");
  assert.equal(plan.contracts[0]?.validation, "invalid");
  assert.equal(plan.contracts[0]?.source, undefined);
  assert.equal(JSON.stringify(plan).includes(outside), false);
});

test("portable design plan schema publishes readiness and traceability boundaries", async () => {
  const schema = parse(
    await readFile(join(process.cwd(), "knowledge-base", "design-intelligence", "design-plan.schema.yaml"), "utf8"),
  ) as { properties?: Record<string, unknown>; required?: string[] };
  assert.ok(schema.required?.includes("implementationReady"));
  assert.ok(schema.required?.includes("traces"));
  assert.ok(schema.required?.includes("contracts"));
  assert.ok(schema.properties?.verificationObligations);
});

test("compile-plan CLI returns a failing policy exit for a blocked plan", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-plan-cli-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const brief = structuredClone(await loadProductDesignBrief(templatePath));
  brief.status = "draft";
  const briefPath = join(root, "brief.yaml");
  await writeFile(briefPath, stringify(brief), "utf8");

  const originalWrite = process.stdout.write;
  let output = "";
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  try {
    assert.equal(await runCompilePlanCli(["--brief", briefPath, "--project-root", root, "--json"]), 1);
  } finally {
    process.stdout.write = originalWrite;
  }
  assert.equal(JSON.parse(output).status, "blocked");
});
