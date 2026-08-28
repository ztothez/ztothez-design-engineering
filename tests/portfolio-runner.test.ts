import assert from "node:assert/strict";
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { stringify } from "yaml";

import { inspectPortfolioRegistry } from "../src/portfolio/registry.js";
import {
  portfolioRunExitCode,
  readPortfolioBenchmarkReport,
  runPortfolioBenchmark,
  verifyPortfolioRunSources,
} from "../src/portfolio/runner.js";

async function fixture() {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-runner-"));
  const root = join(temporary, "portfolio");
  const workspace = join(temporary, "workspaces");
  const runs = join(temporary, "runs");
  const declarations = [
    { id: "react-app", adapter: "react-vite", manager: "npm", command: "tools/pass.mjs" },
    { id: "python-tool", adapter: "python-source", manager: "none" },
    { id: "failed-app", adapter: "nextjs", manager: "npm", command: "tools/fail.mjs" },
    { id: "unsafe-app", adapter: "angular", manager: "npm", command: "-e" },
  ];
  for (const entry of declarations) {
    const directory = join(root, entry.id);
    await mkdir(join(directory, "tools"), { recursive: true });
    await writeFile(join(directory, "package.json"), `${JSON.stringify({ name: entry.id })}\n`);
    await writeFile(join(directory, "tools", "pass.mjs"), "process.stdout.write('pass');\n");
    await writeFile(join(directory, "tools", "fail.mjs"), "process.stderr.write('failed'); process.exit(1);\n");
  }
  const registryPath = join(temporary, "registry.yaml");
  await writeFile(
    registryPath,
    stringify({
      version: "1.0",
      id: "runner-fixture",
      description: "Mixed-stack runner fixture.",
      roots: [{ id: "portfolio", class: "studio-portfolio", path: root }],
      projects: declarations.map((entry) => ({
        id: entry.id,
        root: "portfolio",
        path: entry.id,
        enabled: true,
        ownership: "first-party",
        confidentiality: "private-local",
        cohort: "development",
        publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
        product: { domain: "Test", archetype: "utility", intendedUsers: ["Tester"], primaryTasks: ["Run fixture"] },
        technology: { framework: entry.adapter, packageManager: entry.manager, entrypoint: "package.json", adapter: entry.adapter },
        capabilities: [
          { stage: "source-audit", status: "supported", reason: "Source is available." },
          ...(entry.command ? [{ stage: "production-build", status: "supported", reason: "Build is declared." }] : []),
        ],
        execution: {
          fixtureMode: "disconnected",
          networkPolicy: "denied",
          lifecycleScripts: false,
          commands: entry.command
            ? [{ stage: "production-build", command: "node", arguments: [entry.command], timeoutMs: 5000 }]
            : [],
        },
        paths: { include: ["**"] },
        source: { revisionPolicy: "capture-current", canonicalizationKey: entry.id },
      })),
    }),
  );
  const inspection = await inspectPortfolioRegistry(registryPath);
  assert.equal(inspection.report.passed, true, JSON.stringify(inspection.report.issues));
  return { temporary, registryPath, workspace, runs, inspection };
}

test("mixed-stack cohort retains every result and normalizes repeat fingerprints", async () => {
  const context = await fixture();
  try {
    const execute = (runId: string) =>
      runPortfolioBenchmark(context.inspection, {
        runId,
        registryPath: context.registryPath,
        workspaceRoot: context.workspace,
        runRoot: context.runs,
        mode: "cohort",
        cohort: "development",
        projects: context.inspection.projects,
      });
    const first = await execute("first");
    const second = await execute("second");
    assert.equal(first.report.projects.length, 4);
    assert.equal(first.report.summary.findings, 1);
    assert.equal(first.report.summary.unsafeConfiguration, 1);
    assert.equal(first.report.summary.limitations, 2);
    assert.equal(first.report.resultFingerprint, second.report.resultFingerprint);
    assert.equal(portfolioRunExitCode(first.report), 3);
    assert.deepEqual(first.report.projectIds, [...first.report.projectIds].sort());
    assert.equal((await readPortfolioBenchmarkReport(context.runs, "first")).runId, "first");
    assert.equal((await verifyPortfolioRunSources(context.inspection, context.runs, "first")).unchanged, true);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("portfolio exit codes distinguish findings, limitations, unsafe configuration, and mutation", () => {
  const report = (summary: any) => ({ summary }) as any;
  const empty = { passed: 0, findings: 0, limitations: 0, unsafeConfiguration: 0, sourceMutation: 0 };
  assert.equal(portfolioRunExitCode(report(empty)), 0);
  assert.equal(portfolioRunExitCode(report({ ...empty, findings: 1 })), 1);
  assert.equal(portfolioRunExitCode(report({ ...empty, limitations: 1 })), 2);
  assert.equal(portfolioRunExitCode(report({ ...empty, unsafeConfiguration: 1 })), 3);
  assert.equal(portfolioRunExitCode(report({ ...empty, sourceMutation: 1 })), 4);
});

test("portfolio runner owns the static fixture lifecycle and retains checksummed browser evidence", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-browser-runner-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const root = join(temporary, "root");
  const project = join(root, "browser-product");
  const contract = join(project, "knowledge-base", "benchmarks", "aegisops");
  await mkdir(join(project, "public"), { recursive: true });
  await mkdir(contract, { recursive: true });
  await writeFile(join(project, "package.json"), "{}\n");
  await copyFile("ci/fixtures/responsive-overview.html", join(project, "public", "index.html"));
  for (const file of ["product-contract.yaml", "journeys.json", "SOURCE-EVIDENCE.md", "MANIFEST.md", "acceptance-criteria.md"]) {
    await copyFile(join("knowledge-base", "benchmarks", "aegisops", file), join(contract, file));
  }
  await copyFile("SKILL.md", join(project, "SKILL.md"));
  const port = 44_000 + Math.floor(Math.random() * 1_000);
  const registryPath = join(temporary, "registry.yaml");
  await writeFile(registryPath, stringify({
    version: "1.0", id: "browser-runner", description: "Browser runner fixture.",
    roots: [{ id: "root", class: "studio-portfolio", path: root }],
    projects: [{
      id: "browser-product", root: "root", path: "browser-product", enabled: true,
      ownership: "first-party", confidentiality: "public", cohort: "development",
      publication: { sourceExcerpts: false, screenshots: true, machineReports: false, aggregateMetrics: true },
      product: { domain: "Security operations", archetype: "operational-dashboard", intendedUsers: ["Analyst"], primaryTasks: ["Review readiness"] },
      technology: { framework: "Static", packageManager: "none", entrypoint: "public/index.html", adapter: "static-web" },
      capabilities: [
        { stage: "source-audit", status: "supported", reason: "Source is available." },
        { stage: "local-fixture-server", status: "supported", reason: "A static fixture is declared." },
        { stage: "browser-journeys", status: "supported", reason: "A product journey is declared." },
      ],
      execution: { fixtureMode: "local-fixture", networkPolicy: "denied", lifecycleScripts: false, localPorts: [port] },
      verification: { serveDirectory: "public", port, route: "/", readinessPath: "/", contractPath: "knowledge-base/benchmarks/aegisops/product-contract.yaml", profile: "responsive-overview", settleMs: 20 },
      paths: { include: ["**"] }, source: { revisionPolicy: "capture-current", canonicalizationKey: "browser-product" },
    }],
  }));
  const inspection = await inspectPortfolioRegistry(registryPath);
  assert.equal(inspection.report.passed, true, JSON.stringify(inspection.report.issues));
  const execution = await runPortfolioBenchmark(inspection, {
    runId: "browser", registryPath, workspaceRoot: join(temporary, "workspaces"), runRoot: join(temporary, "runs"),
    mode: "baseline", projects: inspection.projects,
  });
  const result = execution.report.projects[0]!;
  const browser = result.stages.find((stage) => stage.stage === "browser-journeys");
  const fixtureStage = result.stages.find((stage) => stage.stage === "local-fixture-server");
  assert.equal(fixtureStage?.fixture?.state, "stopped", JSON.stringify(result, null, 2));
  assert.ok(browser?.viewports?.some((viewport) => viewport.width === 375));
  assert.ok(result.artifacts.some((artifact) => artifact.kind === "screenshot" && artifact.sha256.length === 64));
  assert.ok(result.artifacts.some((artifact) => artifact.path.endsWith("quality-gate.json")));
  assert.equal((await verifyPortfolioRunSources(inspection, join(temporary, "runs"), "browser")).unchanged, true);
  assert.doesNotMatch(await readFile(execution.path, "utf8"), new RegExp(temporary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
