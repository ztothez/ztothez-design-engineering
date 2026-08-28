import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import {
  PRODUCT_ARCHETYPES,
  assessTaskContractComparability,
  validateArchetypeActivation,
  type ProductArchetype,
} from "../src/contracts/archetypes.js";
import {
  productQualityDimensionSchema,
  productTaskProfileSchema,
  productContractSchema,
} from "../src/contracts/schema.js";
import { inspectProductContract, validateProductContract } from "../src/contracts/validator.js";

const benchmarkRoot = resolve("knowledge-base", "benchmarks");
const portfolioContractRoot = join(benchmarkRoot, "portfolio-corpus");

function syntheticProfile(archetype: ProductArchetype) {
  const definition = PRODUCT_ARCHETYPES[archetype];
  const interfaceType = [...definition.supportedInterfaces][0]!;
  const browser = interfaceType === "browser";
  return {
    archetype,
    interface: interfaceType,
    qualityDimensions: productQualityDimensionSchema.options.map((id) => ({
      id,
      status: definition.requiredDimensions.has(id) || (interfaceType === "browser" && id === "responsive-structure")
        ? "required"
        : "not-applicable",
      reason: definition.requiredDimensions.has(id) || (interfaceType === "browser" && id === "responsive-structure")
        ? `${id} is required by the synthetic archetype profile.`
        : `${id} does not apply to this synthetic profile.`,
    })),
    tasks: [
      {
        id: "complete-primary-task",
        primary: true,
        actor: "operator",
        mode: "primary-mode",
        intent: "Complete the primary product task.",
        start: { stateMachine: "workflow", state: "idle", observable: "The task is ready." },
        success: {
          stateMachine: "workflow",
          state: "complete",
          observable: "The expected result is visible.",
          evidence: ["contract", "runtime"],
        },
        recovery: {
          required: true,
          failure: { stateMachine: "workflow", state: "error", observable: "Failure is visible." },
          observable: "The operator can retry without losing valid input.",
        },
        ...(browser
          ? {
              journey: { profile: "primary", journey: "complete-primary-task" },
              browser: { route: "/task", narrowViewport: "mobile" },
            }
          : {}),
      },
    ],
    evidencePolicy: {
      missingEvidence: "unverified",
      failedBehavior: "failed",
      unsupportedCapability: "limitation",
    },
    comparison: { taskContractId: `${archetype}-task`, crossContractRanking: false },
  };
}

test("all five archetype profiles produce schema-valid task contracts", async () => {
  const portableProfiles = parse(
    await readFile(join(portfolioContractRoot, "archetype-profiles.yaml"), "utf8"),
  ) as { profiles: Array<{ id: ProductArchetype; interfaces: string[]; requiredDimensions: string[] }> };
  assert.deepEqual(
    portableProfiles.profiles.map((entry) => entry.id).sort(),
    Object.keys(PRODUCT_ARCHETYPES).sort(),
  );
  for (const entry of portableProfiles.profiles) {
    const definition = PRODUCT_ARCHETYPES[entry.id];
    assert.deepEqual([...definition.supportedInterfaces].sort(), [...entry.interfaces].sort());
    assert.deepEqual([...definition.requiredDimensions].sort(), [...entry.requiredDimensions].sort());
    const profile = productTaskProfileSchema.parse(syntheticProfile(entry.id));
    assert.deepEqual(validateArchetypeActivation(profile), []);

    const negative = structuredClone(profile);
    const requiredDimension = [...definition.requiredDimensions][0]!;
    negative.qualityDimensions.find((dimension) => dimension.id === requiredDimension)!.status = "not-applicable";
    assert.ok(
      validateArchetypeActivation(negative).some(
        (issue) => issue.code === "CONTRACT-ARCHETYPE-DIMENSION",
      ),
    );
  }

  const portableSchema = parse(
    await readFile(join(portfolioContractRoot, "product-task-profile.schema.yaml"), "utf8"),
  ) as Record<string, unknown>;
  assert.equal(portableSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(portableSchema.$id, "https://ztothez.dev/schemas/product-task-profile-1.1.schema.json");
});

test("task profile schema rejects missing primary, recovery, and browser declarations", () => {
  const missingPrimary = syntheticProfile("operational-dashboard");
  missingPrimary.tasks[0]!.primary = false;
  assert.equal(productTaskProfileSchema.safeParse(missingPrimary).success, false);

  const missingRecovery = syntheticProfile("ai-workspace");
  missingRecovery.tasks[0]!.recovery.required = false;
  assert.equal(productTaskProfileSchema.safeParse(missingRecovery).success, false);

  const missingBrowser = syntheticProfile("content-site");
  delete (missingBrowser.tasks[0] as Record<string, unknown>).browser;
  assert.equal(productTaskProfileSchema.safeParse(missingBrowser).success, false);

  const sourceWithBrowser = syntheticProfile("utility");
  sourceWithBrowser.interface = "source-only";
  (sourceWithBrowser.tasks[0] as Record<string, unknown>).browser = {
    route: "/invalid",
    narrowViewport: "mobile",
  };
  assert.equal(productTaskProfileSchema.safeParse(sourceWithBrowser).success, false);
});

test("maintained real benchmarks expose ready task, recovery, and narrow-viewport models", async () => {
  for (const name of ["aegisops", "azure-optimizer", "scenestart"]) {
    const report = await validateProductContract(join(benchmarkRoot, name, "product-contract.yaml"), {
      projectRoot: process.cwd(),
    });
    assert.equal(report.passed, true, JSON.stringify(report.issues));
    assert.equal(report.taskModel.status, "ready");
    assert.ok(report.taskModel.primaryTasks >= 1);
    assert.ok(report.taskModel.recoveryTasks >= 1);
    assert.ok(report.taskModel.narrowViewportTasks >= 1);
    assert.deepEqual(report.taskModel.evidencePolicy, {
      missingEvidence: "unverified",
      failedBehavior: "failed",
      unsupportedCapability: "limitation",
    });
  }
});

test("validator rejects inapplicable archetype dimensions, bad task states, and wide task paths", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-product-task-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const source = parse(
    await readFile(join(benchmarkRoot, "aegisops", "product-contract.yaml"), "utf8"),
  ) as Record<string, any>;
  source.authority.precedence = [
    { path: "journeys.json", role: "Synthetic retained journey evidence.", authority: "primary" },
  ];
  source.benchmark.qualityDimensions.find((entry: any) => entry.id === "accessibility").status = "not-applicable";
  source.benchmark.tasks[0].success.state = "idle";
  source.benchmark.tasks[0].recovery.failure.state = "success";
  source.benchmark.tasks[0].browser.narrowViewport = "wide-1440";
  await writeFile(join(temporary, "product-contract.yaml"), stringify(source), "utf8");
  await writeFile(
    join(temporary, "journeys.json"),
    await readFile(join(benchmarkRoot, "aegisops", "journeys.json"), "utf8"),
    "utf8",
  );
  const report = await validateProductContract(join(temporary, "product-contract.yaml"), {
    projectRoot: temporary,
  });
  assert.equal(report.passed, false);
  assert.equal(report.taskModel.status, "invalid");
  assert.ok(report.issues.some((entry) => entry.code === "CONTRACT-ARCHETYPE-DIMENSION"));
  assert.ok(report.issues.some((entry) => entry.code === "CONTRACT-TASK-STATE"));
  assert.ok(report.issues.some((entry) => entry.code === "CONTRACT-NARROW-VIEWPORT"));
});

test("comparison requires the same archetype and materially identical primary task contract", async () => {
  const aegisInspection = await inspectProductContract(
    join(benchmarkRoot, "aegisops", "product-contract.yaml"),
    { projectRoot: process.cwd() },
  );
  const azureInspection = await inspectProductContract(
    join(benchmarkRoot, "azure-optimizer", "product-contract.yaml"),
    { projectRoot: process.cwd() },
  );
  assert.ok(aegisInspection.contract && azureInspection.contract);
  assert.equal(
    assessTaskContractComparability(aegisInspection.contract, structuredClone(aegisInspection.contract)).comparable,
    true,
  );
  const unrelated = assessTaskContractComparability(aegisInspection.contract, azureInspection.contract);
  assert.equal(unrelated.comparable, false);
  assert.ok(unrelated.reasons.some((reason) => /task-contract identifiers/.test(reason)));

  const parsed = productContractSchema.parse(structuredClone(aegisInspection.contract));
  assert.equal(parsed.version, "1.1");
});
