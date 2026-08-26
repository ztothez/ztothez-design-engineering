import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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

  assert.equal(runNode([cliPath, "--version"]).trim(), installedPackage.version);
  assert.match(runNode([cliPath, "--help"]), /ztothez-design-engineering/);

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

    const result = await client.callTool({
      name: "search_design_knowledge",
      arguments: {
        query: "semantic design tokens component states",
        categories: ["skill", "figma-and-systems"],
        limit: 3,
      },
    });
    const structured = result.structuredContent;
    assert.equal(result.isError, undefined);
    assert.equal(structured?.status, "matches");
    assert.equal(structured?.authorityPath, "SKILL.md");
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
