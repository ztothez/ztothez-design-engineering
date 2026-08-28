import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { lstat, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { createPackageArchive, runNpm, validatePackageArchive } from "./package-artifact.mjs";

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, [result.stdout, result.stderr].filter(Boolean).join("\n"));
  return result.stdout;
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "ztothez-design-package-smoke-"));
const archiveDirectory = join(temporaryDirectory, "archive");
const installDirectory = join(temporaryDirectory, "install");
const cacheDirectory = join(temporaryDirectory, "npm-cache");

try {
  const { archivePath, report } = await createPackageArchive(archiveDirectory);
  const packageSummary = await validatePackageArchive(report);
  runNpm(
    [
      "install",
      "--prefix",
      installDirectory,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      archivePath,
    ],
    { cacheDirectory },
  );

  const installedRoot = join(
    installDirectory,
    "node_modules",
    "@ztothez",
    "design-engineering",
  );
  const installedPackage = JSON.parse(
    await readFile(join(installedRoot, "package.json"), "utf8"),
  );
  const cliPath = join(installedRoot, installedPackage.bin["zz-design"]);

  for (const prohibitedPath of [
    ".ztothez-design-local",
    ".ztothez-design-benchmarks",
    join("knowledge-base", "architecture"),
    join("knowledge-base", "figma-and-systems"),
    join("knowledge-base", ["legacy", "sources"].join("-")),
    join("knowledge-base", "ux-patterns"),
    join("knowledge-base", "usability-evaluation", "sources"),
  ]) {
    await assert.rejects(lstat(join(installedRoot, prohibitedPath)), { code: "ENOENT" });
  }

  assert.equal(runNode([cliPath, "--version"]).trim(), installedPackage.version);
  assert.match(runNode([cliPath, "--help"]), /ztothez-design-engineering/);
  assert.match(runNode([cliPath, "portfolio", "--help"]), /portfolio snapshot --project ID/);
  const briefCli = JSON.parse(
    runNode([
      cliPath,
      "validate-brief",
      "--brief",
      join(installedRoot, "knowledge-base", "design-intelligence", "product-design-brief.template.yaml"),
      "--json",
    ]),
  );
  assert.equal(briefCli.generationReady, true);

  const client = new Client({ name: "packed-install-smoke", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath],
    cwd: temporaryDirectory,
    stderr: "pipe",
  });
  let serverDiagnostics = "";
  transport.stderr?.on("data", (chunk) => {
    serverDiagnostics += chunk.toString();
  });

  try {
    await client.connect(transport);
    assert.deepEqual(client.getServerVersion(), {
      name: "ztothez-design-engineering",
      version: installedPackage.version,
    });
    const tools = await client.listTools();
    assert.ok(tools.tools.some((tool) => tool.name === "search_design_knowledge"));
    assert.ok(tools.tools.some((tool) => tool.name === "evaluate_corpus_benchmark"));
    assert.ok(tools.tools.some((tool) => tool.name === "evaluate_interface_comparison"));
    assert.ok(tools.tools.some((tool) => tool.name === "validate_interface_trust"));
    assert.ok(tools.tools.some((tool) => tool.name === "validate_information_design"));
    assert.ok(tools.tools.some((tool) => tool.name === "validate_product_design_brief"));

    const architecture = await client.callTool({
      name: "get_architecture_spec",
      arguments: {},
    });
    const architectureText = architecture.content.find((entry) => entry.type === "text");
    assert.equal(architecture.isError, undefined);
    assert.match(architectureText?.text ?? "", /component-boundaries[.]md/);

    const dashboards = await client.callTool({
      name: "get_dashboard_pattern",
      arguments: {},
    });
    const dashboardsText = dashboards.content.find((entry) => entry.type === "text");
    assert.equal(dashboards.isError, undefined);
    assert.match(dashboardsText?.text ?? "", /operational-dashboards[.]md/);

    for (const [file, heading] of [
      ["interface-trust.md", /Interface Trust And Data Provenance/],
      ["information-design.md", /Operational Information Design/],
      ["product-design-brief.md", /Product Design Brief Contract/],
      ["visual-polish.md", /Visual Polish System/],
    ]) {
      const exactRead = await client.callTool({
        name: "get_design_intelligence",
        arguments: { file },
      });
      const exactReadText = exactRead.content.find((entry) => entry.type === "text");
      assert.equal(exactRead.isError, undefined);
      assert.match(exactReadText?.text ?? "", heading);
    }

    const designManifest = await client.callTool({
      name: "validate_design_deliverable",
      arguments: {
        manifestFile: "knowledge-base/design-intelligence/design-deliverable.template.yaml",
      },
    });
    assert.equal(designManifest.isError, undefined);
    assert.equal(designManifest.structuredContent?.passed, true);
    assert.equal(designManifest.structuredContent?.coverage?.typographyRoles, 8);
    assert.equal(designManifest.structuredContent?.coverage?.metricContracts, 3);
    assert.equal(designManifest.structuredContent?.coverage?.generationStages, 9);
    assert.equal(designManifest.structuredContent?.integration?.generationReady, true);
    assert.equal(designManifest.structuredContent?.integration?.trustStatus, "declared");
    assert.equal(designManifest.structuredContent?.integration?.informationStatus, "declared");
    assert.equal(designManifest.structuredContent?.integration?.contractsValidated, false);
    assert.equal(designManifest.structuredContent?.integration?.automatedVerificationReady, false);
    assert.equal(designManifest.structuredContent?.integration?.humanReviewReady, false);
    assert.equal(designManifest.structuredContent?.integration?.releaseReady, false);
    assert.equal(designManifest.structuredContent?.visualPolish?.releaseReady, false);

    const result = await client.callTool({
      name: "search_design_knowledge",
      arguments: {
        query: "semantic design tokens component states",
        categories: ["skill", "design-intelligence"],
        limit: 3,
      },
    });
    const structured = result.structuredContent;
    assert.equal(result.isError, undefined);
    assert.equal(structured?.status, "matches");
    assert.equal(structured?.authorityPath, "SKILL.md");

    const corpus = await client.callTool({
      name: "evaluate_corpus_benchmark",
      arguments: {},
    });
    assert.equal(corpus.isError, undefined);
    assert.equal(corpus.structuredContent?.passed, true);
    assert.equal(corpus.structuredContent?.overallScore, 1);

    const comparison = await client.callTool({
      name: "evaluate_interface_comparison",
      arguments: {
        methodologyFile:
          "knowledge-base/benchmarks/interface-quality/comparison-methodology.template.yaml",
        reviewFile: "knowledge-base/benchmarks/interface-quality/review.template.yaml",
      },
    });
    assert.equal(comparison.isError, undefined);
    assert.equal(comparison.structuredContent?.passed, true);
    assert.equal(comparison.structuredContent?.releaseReady, false);

    const trust = await client.callTool({
      name: "validate_interface_trust",
      arguments: {
        contractFile: "knowledge-base/design-intelligence/interface-trust.template.yaml",
      },
    });
    assert.equal(trust.isError, undefined);
    assert.equal(trust.structuredContent?.passed, true);
    assert.equal(trust.structuredContent?.coverage?.states, 5);

    const information = await client.callTool({
      name: "validate_information_design",
      arguments: {
        contractFile: "knowledge-base/design-intelligence/information-design.template.yaml",
      },
    });
    assert.equal(information.isError, undefined);
    assert.equal(information.structuredContent?.passed, true);
    assert.equal(information.structuredContent?.coverage?.hierarchyLevels, 8);

    const brief = await client.callTool({
      name: "validate_product_design_brief",
      arguments: {
        briefFile: "knowledge-base/design-intelligence/product-design-brief.template.yaml",
      },
    });
    assert.equal(brief.isError, undefined);
    assert.equal(brief.structuredContent?.passed, true);
    assert.equal(brief.structuredContent?.generationReady, true);
    assert.equal(brief.structuredContent?.coverage?.tasks, 1);
  } catch (error) {
    const detail = serverDiagnostics.trim();
    throw new Error(
      `Installed MCP smoke failed${detail ? `:\n${detail}` : ""}`,
      { cause: error },
    );
  } finally {
    await client.close();
  }

  process.stdout.write(
    `${JSON.stringify({ ...packageSummary, installedMcpSmoke: "passed" }, null, 2)}\n`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
