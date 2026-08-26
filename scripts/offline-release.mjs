import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import {
  PROJECT_ROOT,
  expectedKnowledgePaths,
  runNpm,
  writeChecksums,
} from "./package-artifact.mjs";

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

export async function digestTree(directory) {
  const hash = createHash("sha256");
  const files = (await filesUnder(directory)).sort();
  for (const file of files) {
    hash.update(portable(relative(directory, file)));
    hash.update("\0");
    hash.update(await readFile(file));
    hash.update("\0");
  }
  return { files: files.length, sha256: hash.digest("hex") };
}

async function copyPath(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

async function copyPackedRuntime(report, runtimeRoot) {
  for (const file of report.files) {
    await copyPath(join(PROJECT_ROOT, file.path), join(runtimeRoot, file.path));
  }
}

async function copyProductionDependencies(runtimeRoot) {
  const dependencyPaths = runNpm(["ls", "--omit=dev", "--all", "--parseable"])
    .split(/\r?\n/)
    .map((path) => path.trim())
    .filter((path) => path && path !== PROJECT_ROOT);
  const copied = new Set();
  for (const source of dependencyPaths) {
    const path = portable(relative(PROJECT_ROOT, source));
    assert.ok(path.startsWith("node_modules/"), `unexpected production dependency path: ${path}`);
    if ([...copied].some((parent) => path.startsWith(`${parent}/`))) continue;
    await copyPath(source, join(runtimeRoot, path));
    copied.add(path);
  }
  return copied.size;
}

async function writeKnowledgeIndex(destination) {
  const modulePath = join(PROJECT_ROOT, "dist", "src", "retrieval", "search.js");
  const { buildKnowledgeIndex } = await import(pathToFileURL(modulePath).href);
  const index = await buildKnowledgeIndex(PROJECT_ROOT);
  const serialized = {
    version: index.version,
    authorityPath: index.authorityPath,
    documents: index.documents,
    chunks: index.chunks.map((chunk) => ({
      id: chunk.id,
      path: chunk.path,
      category: chunk.category,
      authority: chunk.authority,
      title: chunk.title,
      section: chunk.section,
      text: chunk.text,
      length: chunk.length,
    })),
  };
  const indexPath = join(destination, "knowledge-index.json");
  await writeFile(indexPath, `${JSON.stringify(serialized, null, 2)}\n`, "utf8");
  return { indexPath, documents: serialized.documents.length, chunks: serialized.chunks.length };
}

export async function createOfflineRelease(destination, archivePath, report) {
  const runtimeRoot = join(destination, "offline-runtime");
  await mkdir(runtimeRoot, { recursive: true });
  await copyPackedRuntime(report, runtimeRoot);
  const productionPackages = await copyProductionDependencies(runtimeRoot);
  const knowledgeIndex = await writeKnowledgeIndex(destination);
  const runtimeIntegrity = await digestTree(runtimeRoot);
  const packageJson = JSON.parse(await readFile(join(PROJECT_ROOT, "package.json"), "utf8"));
  const manifest = {
    version: "1.0",
    product: "ZtotheZ Design Engineering System",
    package: packageJson.name,
    packageVersion: packageJson.version,
    packageArchive: archivePath.split(/[\\/]/).at(-1),
    runtimeDirectory: "offline-runtime",
    entrypoint: "offline-runtime/dist/cli/index.js",
    launch: "node offline-runtime/dist/cli/index.js",
    authority: "offline-runtime/SKILL.md",
    retrievalIndex: "knowledge-index.json",
    schemas: (await expectedKnowledgePaths()).filter((path) => path.includes(".schema.")),
    productionPackages,
    runtimeIntegrity,
    networkRequiredAfterExtraction: false,
  };
  const manifestPath = join(destination, "OFFLINE-MANIFEST.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const checksumPath = await writeChecksums(
    [archivePath, knowledgeIndex.indexPath, manifestPath],
    destination,
  );
  return {
    checksumPath,
    knowledgeDocuments: knowledgeIndex.documents,
    knowledgeChunks: knowledgeIndex.chunks,
    manifestPath,
    productionPackages,
    runtimeFiles: runtimeIntegrity.files,
    runtimeRoot,
  };
}
