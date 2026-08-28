import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import { runGenerateReactCli } from "../cli/generate-react.js";
import { auditRepository } from "../src/audit/scanner.js";
import { compileDesignPlan } from "../src/design-plan/compiler.js";
import type { DesignPlan } from "../src/design-plan/schema.js";
import { generateReactTypescriptFixture } from "../src/generation/react-typescript.js";
import { generationManifestSchema } from "../src/generation/schema.js";
import { loadProductDesignBrief } from "../src/product-brief/loader.js";

const briefTemplate = join(process.cwd(), "knowledge-base", "design-intelligence", "product-design-brief.template.yaml");

async function implementationReadyPlan(): Promise<DesignPlan> {
  const brief = structuredClone(await loadProductDesignBrief(briefTemplate));
  brief.downstreamContracts = [
    { kind: "product-task", status: "exists", path: "knowledge-base/benchmarks/aegisops/product-contract.yaml" },
    { kind: "interface-trust", status: "exists", path: "knowledge-base/design-intelligence/interface-trust.template.yaml" },
    { kind: "information-design", status: "exists", path: "knowledge-base/design-intelligence/information-design.template.yaml" },
    { kind: "design-deliverable", status: "exists", path: "knowledge-base/design-intelligence/design-deliverable.template.yaml" },
  ];
  const plan = await compileDesignPlan(brief, { briefSourcePath: briefTemplate, projectRoot: process.cwd() });
  assert.equal(plan.implementationReady, true);
  return plan;
}

async function writeRegistry(path: string, portfolioRoot: string): Promise<void> {
  await writeFile(path, stringify({
    version: "1.0",
    id: "generation-test-registry",
    description: "Synthetic read-only root for generation containment tests.",
    roots: [{ id: "protected", class: "studio-portfolio", path: portfolioRoot }],
    projects: [],
  }), "utf8");
}

test("React TypeScript generation is deterministic, traceable, and architecture-auditable", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-generation-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const generationRoot = join(temporary, "generated");
  const portfolioRoot = join(temporary, "portfolio");
  await Promise.all([mkdir(generationRoot), mkdir(portfolioRoot)]);
  const registry = join(temporary, "registry.yaml");
  await writeRegistry(registry, portfolioRoot);
  const plan = await implementationReadyPlan();

  const first = await generateReactTypescriptFixture(plan, {
    generationRoot,
    outputDirectory: join(generationRoot, "first"),
    portfolioRegistryPath: registry,
  });
  const second = await generateReactTypescriptFixture(plan, {
    generationRoot,
    outputDirectory: join(generationRoot, "second"),
    portfolioRegistryPath: registry,
  });

  assert.deepEqual(first.files, second.files);
  assert.equal(first.target, "first");
  assert.equal(JSON.stringify(first).includes(temporary), false);
  assert.ok(first.files.some((entry) => entry.path === "src/domain/task-state.ts"));
  assert.ok(first.files.some((entry) => entry.path === "src/styles/tokens.css"));

  const output = join(generationRoot, "first");
  const sourceMode = await readFile(join(output, "src/domain/source-mode.ts"), "utf8");
  const taskState = await readFile(join(output, "src/domain/task-state.ts"), "utf8");
  const workspace = await readFile(join(output, "src/components/TaskWorkspace.tsx"), "utf8");
  const sourcePanel = await readFile(join(output, "src/components/SourceBoundaryPanel.tsx"), "utf8");
  const packageManifest = await readFile(join(output, "package.json"), "utf8");
  const manifest = generationManifestSchema.parse(JSON.parse(
    await readFile(join(output, "ztothez-design-generation.json"), "utf8"),
  ));

  for (const mode of ["demo", "imported", "cached", "live"]) assert.match(sourceMode, new RegExp(`\\b${mode}:`));
  assert.match(taskState, /use-demo-fallback/);
  assert.match(taskState, /selectedRecord/);
  assert.match(sourcePanel, /data-ztothez-design-data-mode/);
  assert.match(workspace, /Use disclosed demo fallback/);
  assert.match(workspace, /data-ztothez-design-composition="1\.0"/);
  assert.match(workspace, /data-ztothez-design-priority="context"/);
  assert.match(workspace, /data-ztothez-design-priority="primary-outcome"/);
  assert.match(workspace, /data-ztothez-design-priority="next-action"/);
  assert.match(workspace, /data-ztothez-design-claim-basis="synthetic"/);
  assert.match(sourcePanel, /data-ztothez-design-status-purpose="data-origin"/);
  assert.doesNotMatch(packageManifest, /ui.?ux.pro.max|lovable|external design/i);
  assert.equal(manifest.plan.sourceDigest, plan.sourceBrief.digest);
  assert.equal(manifest.outputMode, "new-independent-fixture");

  const audit = await auditRepository(output);
  assert.equal(audit.summary.errors, 0, JSON.stringify(audit.findings, null, 2));
  assert.equal(audit.summary.warnings, 0, JSON.stringify(audit.findings, null, 2));
});

test("generation rejects provisional plans without creating output", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-generation-provisional-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const generationRoot = join(temporary, "generated");
  const portfolioRoot = join(temporary, "portfolio");
  await Promise.all([mkdir(generationRoot), mkdir(portfolioRoot)]);
  const registry = join(temporary, "registry.yaml");
  await writeRegistry(registry, portfolioRoot);
  const brief = await loadProductDesignBrief(briefTemplate);
  const plan = await compileDesignPlan(brief, { briefSourcePath: briefTemplate, projectRoot: process.cwd() });
  const output = join(generationRoot, "rejected");

  await assert.rejects(
    generateReactTypescriptFixture(plan, { generationRoot, outputDirectory: output, portfolioRegistryPath: registry }),
    /implementationReady/,
  );
  await assert.rejects(readFile(join(output, "package.json")), { code: "ENOENT" });
});

test("generation rejects non-empty, symlinked, and portfolio-overlapping targets", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-generation-policy-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const generationRoot = join(temporary, "generated");
  const portfolioRoot = join(temporary, "portfolio");
  const outside = join(temporary, "outside");
  await Promise.all([mkdir(generationRoot), mkdir(portfolioRoot), mkdir(outside)]);
  const registry = join(temporary, "registry.yaml");
  await writeRegistry(registry, portfolioRoot);
  const plan = await implementationReadyPlan();

  const existing = join(generationRoot, "existing");
  await mkdir(existing);
  await writeFile(join(existing, "owned.txt"), "preserve\n", "utf8");
  await assert.rejects(
    generateReactTypescriptFixture(plan, { generationRoot, outputDirectory: existing, portfolioRegistryPath: registry }),
    /must not already exist/,
  );
  assert.equal(await readFile(join(existing, "owned.txt"), "utf8"), "preserve\n");

  await assert.rejects(
    generateReactTypescriptFixture(plan, {
      generationRoot,
      outputDirectory: join(outside, "escaped-lexically"),
      portfolioRegistryPath: registry,
    }),
    /must be a child/,
  );

  await symlink(outside, join(generationRoot, "escaped"), "dir");
  await assert.rejects(
    generateReactTypescriptFixture(plan, {
      generationRoot,
      outputDirectory: join(generationRoot, "escaped", "app"),
      portfolioRegistryPath: registry,
    }),
    /symbolic link/,
  );

  await assert.rejects(
    generateReactTypescriptFixture(plan, {
      generationRoot: portfolioRoot,
      outputDirectory: join(portfolioRoot, "app"),
      portfolioRegistryPath: registry,
    }),
    /overlaps read-only portfolio root protected/,
  );
});

test("generate-react CLI writes a portable report and generated fixture", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-generation-cli-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const generationRoot = join(temporary, "generated");
  const portfolioRoot = join(temporary, "portfolio");
  await Promise.all([mkdir(generationRoot), mkdir(portfolioRoot)]);
  const registry = join(temporary, "registry.yaml");
  await writeRegistry(registry, portfolioRoot);
  const planPath = join(temporary, "plan.json");
  await writeFile(planPath, JSON.stringify(await implementationReadyPlan()), "utf8");

  const originalWrite = process.stdout.write;
  let output = "";
  process.stdout.write = ((chunk: string | Uint8Array) => {
    output += chunk.toString();
    return true;
  }) as typeof process.stdout.write;
  try {
    assert.equal(await runGenerateReactCli([
      "--plan", planPath,
      "--generation-root", generationRoot,
      "--output", join(generationRoot, "cli-fixture"),
      "--portfolio-registry", registry,
      "--json",
    ]), 0);
  } finally {
    process.stdout.write = originalWrite;
  }
  const report = JSON.parse(output) as { status: string; target: string };
  assert.deepEqual(report, { ...report, status: "generated", target: "cli-fixture" });
  assert.match(await readFile(join(generationRoot, "cli-fixture", "README.md"), "utf8"), /Generation is not release evidence/);
});

test("portable generation manifest schema preserves adapter, traceability, and file checksums", async () => {
  const schema = parse(await readFile(
    join(process.cwd(), "knowledge-base", "design-intelligence", "generation-adapter.schema.yaml"),
    "utf8",
  )) as {
    $schema?: string;
    properties?: Record<string, { const?: string }>;
    required?: string[];
  };
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties?.adapter?.const, "react-typescript-vite");
  assert.equal(schema.properties?.outputMode?.const, "new-independent-fixture");
  assert.ok(schema.required?.includes("plan"));
  assert.ok(schema.required?.includes("files"));
  assert.ok(schema.required?.includes("limitations"));
});
