import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

import YAML from "yaml";

import { expectedKnowledgePaths, PROJECT_ROOT } from "./package-artifact.mjs";
import { digestTree } from "./offline-release.mjs";

const portable = (path) => path.split("\\").join("/");

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const destination = join(PROJECT_ROOT, ".ztothez-design-release");
const manifest = JSON.parse(await readFile(join(destination, "OFFLINE-MANIFEST.json"), "utf8"));
const checksumLines = (await readFile(join(destination, "SHA256SUMS"), "utf8"))
  .trim()
  .split(/\r?\n/);
for (const line of checksumLines) {
  const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
  assert.ok(match, `invalid checksum line: ${line}`);
  const digest = createHash("sha256")
    .update(await readFile(join(destination, match[2])))
    .digest("hex");
  assert.equal(digest, match[1], `checksum mismatch: ${match[2]}`);
}

const runtimeRoot = join(destination, manifest.runtimeDirectory);
assert.deepEqual(await digestTree(runtimeRoot), manifest.runtimeIntegrity);
const index = JSON.parse(await readFile(join(destination, manifest.retrievalIndex), "utf8"));
assert.equal(index.authorityPath, "SKILL.md");
const scope = YAML.parse(
  await readFile(join(PROJECT_ROOT, "knowledge-base", "retrieval-scope.yaml"), "utf8"),
);
assert.deepEqual(
  index.documents.map((document) => document.path).sort(),
  Object.values(scope.categories).flatMap((category) => category.files).sort(),
);

const requiredV2Modules = [
  "knowledge-base/design-intelligence/interface-trust.md",
  "knowledge-base/design-intelligence/information-design.md",
  "knowledge-base/design-intelligence/visual-polish.md",
  "knowledge-base/design-intelligence/interaction-recovery-verification.md",
];
for (const path of requiredV2Modules) {
  assert.ok(index.documents.some((document) => document.path === path), `V2 document missing from offline index: ${path}`);
  assert.ok(index.chunks.some((chunk) => chunk.path === path), `V2 document has no offline retrieval chunks: ${path}`);
}

for (const path of [
  "knowledge-base/design-intelligence/design-deliverable.schema.yaml",
  "knowledge-base/design-intelligence/interface-trust.schema.yaml",
  "knowledge-base/design-intelligence/information-design.schema.yaml",
]) {
  assert.ok(manifest.schemas.includes(path), `V2 schema missing from offline manifest: ${path}`);
}

const runtimeKnowledgeRoot = join(runtimeRoot, "knowledge-base");
const runtimeKnowledge = (await filesUnder(runtimeKnowledgeRoot))
  .map((path) => `knowledge-base/${portable(relative(runtimeKnowledgeRoot, path))}`)
  .sort();
assert.deepEqual(
  runtimeKnowledge,
  (await expectedKnowledgePaths()).filter((path) => path.startsWith("knowledge-base/")),
  "offline runtime knowledge must exactly match the approved distribution boundary",
);

const cliPath = join(destination, manifest.entrypoint);
const result = spawnSync(process.execPath, [cliPath, "--version"], {
  cwd: destination,
  encoding: "utf8",
  env: { PATH: process.env.PATH ?? "" },
});
if (result.error) throw result.error;
assert.equal(result.status, 0, result.stderr || result.stdout);
assert.equal(result.stdout.trim(), manifest.packageVersion);

process.stdout.write(`${JSON.stringify({
  version: manifest.version,
  checksums: checksumLines.length,
  knowledgeDocuments: index.documents.length,
  knowledgeChunks: index.chunks.length,
  runtimeFiles: manifest.runtimeIntegrity.files,
  offlineLaunch: "passed",
  approvedKnowledgeBoundary: "exact match",
  passed: true,
}, null, 2)}\n`);
