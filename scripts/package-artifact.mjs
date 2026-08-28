import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function npmCommand(args) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    return { command: process.execPath, args: [npmExecPath, ...args] };
  }

  return {
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args,
  };
}

export function runNpm(args, options = {}) {
  const invocation = npmCommand(args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: options.cwd ?? PROJECT_ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_cache: options.cacheDirectory,
    },
    maxBuffer: 16 * 1024 * 1024,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`npm ${args.join(" ")} failed${detail ? `:\n${detail}` : ""}`);
  }

  return result.stdout;
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(relative(PROJECT_ROOT, entryPath).split("\\").join("/"));
    }
  }

  return files;
}

export async function expectedKnowledgePaths() {
  const scope = YAML.parse(
    await readFile(join(PROJECT_ROOT, "knowledge-base", "retrieval-scope.yaml"), "utf8"),
  );
  const scopedKnowledgePaths = Object.values(scope.categories).flatMap(
    (category) => category.files,
  );
  const benchmarkPaths = await listFiles(join(PROJECT_ROOT, "knowledge-base", "benchmarks"));
  return [...new Set([
    "knowledge-base/INDEX.md",
    "knowledge-base/dependencies.yaml",
    "knowledge-base/provenance.yaml",
    "knowledge-base/retrieval-scope.yaml",
    "knowledge-base/design-intelligence/design-deliverable.schema.yaml",
    "knowledge-base/design-intelligence/design-deliverable.template.yaml",
    "knowledge-base/design-intelligence/interface-trust.schema.yaml",
    "knowledge-base/design-intelligence/interface-trust.template.yaml",
    "knowledge-base/design-intelligence/information-design.schema.yaml",
    "knowledge-base/design-intelligence/information-design.template.yaml",
    "knowledge-base/usability-evaluation/heuristic-review.schema.yaml",
    "knowledge-base/usability-evaluation/heuristic-review.template.yaml",
    ...scopedKnowledgePaths,
    ...benchmarkPaths,
  ])].sort();
}

export async function expectedProvenancePaths() {
  return [...new Set([
    "README.md",
    "ROADMAP.md",
    "SKILL.md",
    "V2-ROADMAP.md",
    "V3-ROADMAP.md",
    "docs/installation.md",
    ...(await expectedKnowledgePaths()),
  ])].sort();
}

export async function createPackageArchive(destination) {
  await mkdir(destination, { recursive: true });
  const cacheDirectory = await mkdtemp(join(tmpdir(), "ztothez-design-npm-cache-"));

  try {
    const output = runNpm(
      ["pack", "--ignore-scripts", "--json", "--pack-destination", destination],
      { cacheDirectory },
    );
    const reports = JSON.parse(output);
    assert.equal(reports.length, 1, "npm pack must produce exactly one archive");
    const report = reports[0];
    return {
      archivePath: join(destination, report.filename),
      report,
    };
  } finally {
    await rm(cacheDirectory, { recursive: true, force: true });
  }
}

export async function validatePackageArchive(report) {
  const packageJson = JSON.parse(await readFile(join(PROJECT_ROOT, "package.json"), "utf8"));
  const archivePaths = new Set(report.files.map((file) => file.path));
  const knowledgePaths = await expectedKnowledgePaths();

  const requiredPaths = [
    "LICENSE",
    "README.md",
    "ROADMAP.md",
    "SKILL.md",
    "V2-ROADMAP.md",
    "V3-ROADMAP.md",
    "dist/cli/index.js",
    "dist/src/server.js",
    "docs/installation.md",
    ...knowledgePaths,
  ];

  for (const requiredPath of requiredPaths) {
    assert.ok(archivePaths.has(requiredPath), `package is missing required file: ${requiredPath}`);
  }

  const prohibitedPrefixes = [
    ".github/",
    "ci/",
    "src/",
    "tests/",
    ["knowledge-base", ["legacy", "sources"].join("-"), ""].join("/"),
    ["knowledge-base", "usability-evaluation", "sources", ""].join("/"),
  ];
  const prohibitedPath = report.files.find((file) =>
    prohibitedPrefixes.some((prefix) => file.path.startsWith(prefix)),
  );
  assert.equal(prohibitedPath, undefined, `package contains prohibited file: ${prohibitedPath?.path}`);

  const allowedKnowledgePaths = new Set(knowledgePaths);
  for (const file of report.files) {
    if (file.path.startsWith("knowledge-base/")) {
      assert.ok(
        allowedKnowledgePaths.has(file.path),
        `package contains knowledge outside the approved distribution boundary: ${file.path}`,
      );
    }
  }

  assert.equal(packageJson.name, "@ztothez/design-engineering");
  assert.equal(packageJson.engines?.node, ">=22");
  assert.equal(packageJson.bin?.["ztothez-design"], "dist/cli/index.js");
  assert.equal(packageJson.bin?.["zz-design"], "dist/cli/index.js");
  assert.ok(report.unpackedSize < 4 * 1024 * 1024, "package exceeds the 4 MiB unpacked ceiling");

  return {
    files: report.files.length,
    name: report.name,
    packedBytes: report.size,
    unpackedBytes: report.unpackedSize,
    version: report.version,
  };
}

export async function writeChecksums(paths, destination) {
  const lines = [];
  for (const path of paths) {
    const content = await readFile(path);
    const digest = createHash("sha256").update(content).digest("hex");
    const filename = path.split(/[\\/]/).at(-1);
    lines.push(`${digest}  ${filename}`);
  }
  const checksumPath = join(destination, "SHA256SUMS");
  await writeFile(checksumPath, `${lines.join("\n")}\n`, "utf8");
  return checksumPath;
}
