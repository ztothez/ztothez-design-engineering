import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import {
  PORTFOLIO_STAGES,
  resolvePortfolioAdapter,
  runPortfolioAdapterStage,
} from "../src/portfolio/adapters.js";
import { inspectPortfolioRegistry, projectById } from "../src/portfolio/registry.js";
import { portfolioRegistrySchema, type BenchmarkStage, type PortfolioAdapterId } from "../src/portfolio/schema.js";
import { withPortfolioSnapshot } from "../src/portfolio/snapshot.js";

type ProjectFixture = {
  id: string;
  adapter: PortfolioAdapterId;
  packageManager: "npm" | "none" | "other";
  stage: BenchmarkStage;
  command?: { command: string; arguments: string[]; timeoutMs?: number };
};

const fixtureProjects: ProjectFixture[] = [
  {
    id: "react-fixture",
    adapter: "react-vite",
    packageManager: "npm",
    stage: "production-build",
    command: { command: "node", arguments: ["tools/pass.mjs", "react-vite"] },
  },
  {
    id: "next-fixture",
    adapter: "nextjs",
    packageManager: "npm",
    stage: "typecheck",
    command: { command: "node", arguments: ["tools/pass.mjs", "nextjs"] },
  },
  {
    id: "angular-fixture",
    adapter: "angular",
    packageManager: "npm",
    stage: "lint",
    command: { command: "node", arguments: ["tools/pass.mjs", "angular"] },
  },
  {
    id: "fullstack-fixture",
    adapter: "node-python-fullstack",
    packageManager: "other",
    stage: "unit-test",
    command: { command: "python3", arguments: ["tools/pass.py", "fullstack"] },
  },
  {
    id: "python-source-fixture",
    adapter: "python-source",
    packageManager: "none",
    stage: "source-audit",
  },
];

async function adapterFixture(projects = fixtureProjects) {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-adapters-"));
  const root = join(temporary, "portfolio");
  const workspace = join(temporary, "workspaces");
  await mkdir(root, { recursive: true });

  for (const project of projects) {
    const projectRoot = join(root, project.id);
    await mkdir(join(projectRoot, "tools"), { recursive: true });
    await writeFile(join(projectRoot, "package.json"), `${JSON.stringify({ name: project.id })}\n`);
    await writeFile(
      join(projectRoot, "tools", "pass.mjs"),
      "process.stdout.write(`out:${process.argv[2]}`); process.stderr.write(`err:${process.argv[2]}`);\n",
    );
    await writeFile(
      join(projectRoot, "tools", "pass.py"),
      "import sys\nsys.stdout.write('out:' + sys.argv[1])\nsys.stderr.write('err:' + sys.argv[1])\n",
    );
    await writeFile(join(projectRoot, "tools", "hang.mjs"), "setInterval(() => {}, 1000);\n");
  }

  const registryPath = join(temporary, "registry.yaml");
  await writeFile(
    registryPath,
    stringify({
      version: "1.0",
      id: "adapter-fixtures",
      description: "Synthetic stack adapter fixtures.",
      roots: [{ id: "portfolio", class: "studio-portfolio", path: root }],
      projects: projects.map((project) => ({
        id: project.id,
        root: "portfolio",
        path: project.id,
        enabled: true,
        ownership: "first-party",
        confidentiality: "private-local",
        cohort: "development",
        publication: {
          sourceExcerpts: false,
          screenshots: false,
          machineReports: false,
          aggregateMetrics: true,
        },
        product: {
          domain: "Synthetic adapter test",
          archetype: project.adapter === "node-python-fullstack" ? "full-stack-workflow" : "utility",
          intendedUsers: ["Test operator"],
          primaryTasks: ["Execute an isolated adapter stage"],
        },
        technology: {
          framework: project.adapter,
          packageManager: project.packageManager,
          entrypoint: "package.json",
          adapter: project.adapter,
        },
        capabilities: [
          { stage: "source-audit", status: "supported", reason: "Approved source is available." },
          ...(project.stage === "source-audit"
            ? []
            : [{ stage: project.stage, status: "supported", reason: "Synthetic stage is declared." }]),
        ],
        execution: {
          fixtureMode: "disconnected",
          networkPolicy: "denied",
          lifecycleScripts: false,
          allowedEnvironmentVariables: [],
          localPorts: [],
          commands: project.command
            ? [
                {
                  stage: project.stage,
                  command: project.command.command,
                  arguments: project.command.arguments,
                  timeoutMs: project.command.timeoutMs ?? 5_000,
                },
              ]
            : [],
        },
        paths: { include: ["**"], exclude: [] },
        source: { revisionPolicy: "capture-current", canonicalizationKey: project.id },
      })),
    }),
  );
  const inspection = await inspectPortfolioRegistry(registryPath);
  assert.equal(inspection.report.passed, true, JSON.stringify(inspection.report.issues));
  return { temporary, workspace, inspection };
}

test("three frontend adapters and one full-stack adapter execute only declared commands in snapshots", async () => {
  const context = await adapterFixture();
  try {
    for (const fixture of fixtureProjects.slice(0, 4)) {
      const project = projectById(context.inspection, fixture.id);
      const report = resolvePortfolioAdapter(project);
      assert.equal(report.passed, true);
      assert.equal(report.capabilities.length, PORTFOLIO_STAGES.length);
      assert.equal(
        report.capabilities.find((capability) => capability.stage === fixture.stage)?.effectiveStatus,
        "supported",
      );
      const execution = await withPortfolioSnapshot(project, context.workspace, (snapshot) =>
        runPortfolioAdapterStage(snapshot, fixture.stage),
      );
      assert.equal(execution.result.status, "passed");
      assert.equal(execution.result.process?.stdout, `out:${fixture.command!.arguments[1]}`);
      assert.equal(execution.result.process?.stderr, `err:${fixture.command!.arguments[1]}`);
      assert.equal(execution.result.process?.sourceUnchanged, true);
      assert.equal(execution.summary.sourceUnchanged, true);
    }
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("source-only adapter provides audit evidence and makes browser limitations explicit", async () => {
  const context = await adapterFixture();
  try {
    const project = projectById(context.inspection, "python-source-fixture");
    const report = resolvePortfolioAdapter(project);
    assert.equal(report.capabilities.find((entry) => entry.stage === "source-audit")?.effectiveStatus, "supported");
    assert.equal(report.capabilities.find((entry) => entry.stage === "browser-journeys")?.effectiveStatus, "not-applicable");
    const execution = await withPortfolioSnapshot(project, context.workspace, (snapshot) =>
      runPortfolioAdapterStage(snapshot, "source-audit"),
    );
    assert.equal(execution.result.status, "passed");
    assert.equal(execution.result.process, undefined);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("missing and unsafe commands become limitations or policy failures instead of passes", async () => {
  const missingCommand: ProjectFixture = {
    id: "missing-command",
    adapter: "react-vite",
    packageManager: "npm",
    stage: "typecheck",
  };
  const unsafeCommand: ProjectFixture = {
    id: "unsafe-command",
    adapter: "react-vite",
    packageManager: "npm",
    stage: "typecheck",
    command: { command: "node", arguments: ["-e", "process.exit(0)"] },
  };
  const traversalCommand: ProjectFixture = {
    id: "traversal-command",
    adapter: "react-vite",
    packageManager: "npm",
    stage: "typecheck",
    command: { command: "node", arguments: ["../escape.mjs"] },
  };
  const context = await adapterFixture([missingCommand, unsafeCommand, traversalCommand]);
  try {
    const missing = resolvePortfolioAdapter(projectById(context.inspection, missingCommand.id));
    assert.equal(missing.passed, true);
    assert.equal(missing.capabilities.find((entry) => entry.stage === "typecheck")?.effectiveStatus, "unsupported");
    assert.ok(missing.issues.some((entry) => entry.code === "PORTFOLIO-ADAPTER-COMMAND-MISSING"));

    const unsafe = resolvePortfolioAdapter(projectById(context.inspection, unsafeCommand.id));
    assert.equal(unsafe.passed, false);
    assert.ok(unsafe.issues.some((entry) => entry.code === "PORTFOLIO-ADAPTER-SCRIPT"));

    const traversal = resolvePortfolioAdapter(projectById(context.inspection, traversalCommand.id));
    assert.equal(traversal.passed, false);
    assert.ok(traversal.issues.some((entry) => entry.code === "PORTFOLIO-ADAPTER-SCRIPT"));
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("python module execution is limited to pytest with relative unit-test targets", async () => {
  const safePytest: ProjectFixture = {
    id: "safe-pytest",
    adapter: "node-python-fullstack",
    packageManager: "other",
    stage: "unit-test",
    command: { command: "python3", arguments: ["-m", "pytest", "-q", "tests"] },
  };
  const unsafeModule: ProjectFixture = {
    id: "unsafe-python-module",
    adapter: "node-python-fullstack",
    packageManager: "other",
    stage: "unit-test",
    command: { command: "python3", arguments: ["-m", "http.server"] },
  };
  const traversalTarget: ProjectFixture = {
    id: "pytest-traversal",
    adapter: "node-python-fullstack",
    packageManager: "other",
    stage: "unit-test",
    command: { command: "python3", arguments: ["-m", "pytest", "../tests"] },
  };
  const missingTarget: ProjectFixture = {
    id: "pytest-missing-target",
    adapter: "node-python-fullstack",
    packageManager: "other",
    stage: "unit-test",
    command: { command: "python3", arguments: ["-m", "pytest", "-q"] },
  };
  const context = await adapterFixture([safePytest, unsafeModule, traversalTarget, missingTarget]);
  try {
    assert.equal(resolvePortfolioAdapter(projectById(context.inspection, safePytest.id)).passed, true);
    assert.equal(resolvePortfolioAdapter(projectById(context.inspection, unsafeModule.id)).passed, false);
    assert.equal(resolvePortfolioAdapter(projectById(context.inspection, traversalTarget.id)).passed, false);
    assert.equal(resolvePortfolioAdapter(projectById(context.inspection, missingTarget.id)).passed, false);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("adapter timeout terminates the process and preserves diagnostic separation and source state", async () => {
  const timeoutProject: ProjectFixture = {
    id: "timeout-command",
    adapter: "nextjs",
    packageManager: "npm",
    stage: "unit-test",
    command: { command: "node", arguments: ["tools/hang.mjs"], timeoutMs: 150 },
  };
  const context = await adapterFixture([timeoutProject]);
  try {
    const project = projectById(context.inspection, timeoutProject.id);
    const execution = await withPortfolioSnapshot(project, context.workspace, (snapshot) =>
      runPortfolioAdapterStage(snapshot, "unit-test"),
    );
    assert.equal(execution.result.status, "timed-out");
    assert.equal(execution.result.process?.timedOut, true);
    assert.equal(execution.result.process?.sourceUnchanged, true);
    assert.equal(execution.summary.sourceUnchanged, true);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("runtime and portable adapter contracts expose the command containment fields", async () => {
  const project = {
    version: "1.0",
    id: "adapter-traversal",
    description: "Traversal rejection fixture.",
    roots: [{ id: "portfolio", class: "studio-portfolio", path: "/tmp" }],
    projects: [
      {
        id: "escape",
        root: "portfolio",
        path: "escape",
        enabled: true,
        ownership: "first-party",
        confidentiality: "private-local",
        cohort: "development",
        publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
        product: { domain: "Test", archetype: "utility", intendedUsers: ["Tester"], primaryTasks: ["Test"] },
        technology: { framework: "React", packageManager: "npm", entrypoint: "package.json", adapter: "react-vite" },
        capabilities: [{ stage: "typecheck", status: "supported", reason: "Declared." }],
        execution: {
          fixtureMode: "disconnected",
          networkPolicy: "denied",
          lifecycleScripts: false,
          commands: [{ stage: "typecheck", command: "node", arguments: ["tools/check.mjs"], cwd: "../escape" }],
        },
        paths: { include: ["**"] },
        source: { revisionPolicy: "capture-current", canonicalizationKey: "escape" },
      },
    ],
  };
  assert.equal(portfolioRegistrySchema.safeParse(project).success, false);

  const portable = parse(
    await readFile(
      resolve("knowledge-base", "benchmarks", "portfolio-corpus", "registry.schema.yaml"),
      "utf8",
    ),
  ) as Record<string, unknown>;
  const definitions = portable.$defs as Record<string, unknown>;
  assert.ok(definitions.adapterCommand);
  assert.match(JSON.stringify(definitions.adapterCommand), /allowDependencyNetwork/);
});
