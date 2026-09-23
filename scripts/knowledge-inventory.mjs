import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

import { expectedKnowledgePaths } from "./package-artifact.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_INVENTORY = join(PROJECT_ROOT, "governance", "public-knowledge-inventory.json");
const PRIVATE_RESEARCH_ROOT = ["Data", "For", "V5"].join("");

function parseArguments(argv) {
  let mode = "check";
  let inventoryPath = DEFAULT_INVENTORY;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") mode = "check";
    else if (argument === "--write") mode = "write";
    else if (argument === "--inventory") {
      const value = argv[index + 1];
      if (!value) throw new Error("--inventory requires a path");
      inventoryPath = isAbsolute(value) ? value : resolve(PROJECT_ROOT, value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (mode === "write" && inventoryPath !== DEFAULT_INVENTORY) {
    throw new Error("--write may update only the canonical public knowledge inventory");
  }
  return { mode, inventoryPath };
}

function isGitWorkingTree() {
  try {
    return execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() === "true";
  } catch {
    return false;
  }
}

async function filesUnder(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else files.push(relative(PROJECT_ROOT, path).split("\\").join("/"));
  }
  return files.sort();
}

async function boundaryFiles(path) {
  if (!isGitWorkingTree()) return filesUnder(join(PROJECT_ROOT, path));
  const output = execFileSync("git", ["ls-files", "-z", "--", path], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  return output.split("\0").filter(Boolean).sort();
}

function purposeFor(path) {
  if ([
    "knowledge-base/INDEX.md",
    "knowledge-base/dependencies.yaml",
    "knowledge-base/provenance.yaml",
    "knowledge-base/retrieval-scope.yaml",
  ].includes(path)) return "knowledge-governance";
  if (path.startsWith("knowledge-base/maintained/architecture/")) return "architecture-guidance";
  if (path.startsWith("knowledge-base/maintained/product-patterns/")) return "product-pattern-guidance";
  if (path.startsWith("knowledge-base/design-intelligence/")) return "design-intelligence";
  if (path.startsWith("knowledge-base/usability-evaluation/")) return "usability-evaluation";
  if (path.startsWith("knowledge-base/benchmarks/")) return "product-benchmark";
  throw new Error(`Knowledge purpose is not classified: ${path}`);
}

function transformationStatus(sourceId) {
  if (sourceId === "ztothez-maintained") return "independently-authored";
  if (sourceId === "ztothez-corpus") return "synthetic-benchmark";
  if (sourceId.endsWith("-owner-evidence")) return "owner-evidence-normalized";
  throw new Error(`Knowledge source has no transformation classification: ${sourceId}`);
}

function generationStatus(path) {
  return path.endsWith("/design-plan.json") || path.endsWith("/evidence/example-runtime-report.json")
    ? "deterministic-generated"
    : "maintained-authored";
}

function personalDataStatus(path) {
  return path.endsWith("/attestations.yaml") || path.endsWith("/human-review.md")
    ? "owner-attribution"
    : "none-declared";
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function buildInventory() {
  assert.deepEqual(
    await boundaryFiles(PRIVATE_RESEARCH_ROOT),
    [],
    "Private V5 research must remain outside Git",
  );

  const tracked = await boundaryFiles("knowledge-base");
  assert.ok(tracked.length > 0, "No tracked knowledge files found");
  assert.equal(new Set(tracked).size, tracked.length, "Tracked knowledge paths must be unique");

  const packaged = (await expectedKnowledgePaths())
    .filter((path) => path.startsWith("knowledge-base/"))
    .sort();
  assert.deepEqual(packaged, tracked, "Tracked and packaged knowledge boundaries must match exactly");

  const retrievalScope = YAML.parse(
    await readFile(join(PROJECT_ROOT, "knowledge-base", "retrieval-scope.yaml"), "utf8"),
  );
  const retrieved = new Set(
    Object.values(retrievalScope.categories)
      .flatMap((category) => category.files)
      .filter((path) => path.startsWith("knowledge-base/")),
  );
  for (const path of retrieved) {
    assert.ok(tracked.includes(path), `Retrieval scope contains untracked knowledge: ${path}`);
  }

  const provenance = YAML.parse(
    await readFile(join(PROJECT_ROOT, "knowledge-base", "provenance.yaml"), "utf8"),
  );
  const sources = new Map(provenance.sources.map((source) => [source.id, source]));
  const provenanceByPath = new Map();
  for (const artifactSet of provenance.artifactSets) {
    const source = sources.get(artifactSet.source);
    assert.ok(source, `Unknown provenance source: ${artifactSet.source}`);
    assert.equal(artifactSet.status, "approved", `Unapproved provenance set: ${artifactSet.id}`);
    for (const path of artifactSet.paths.filter((path) => path.startsWith("knowledge-base/"))) {
      assert.equal(provenanceByPath.has(path), false, `Duplicate provenance path: ${path}`);
      provenanceByPath.set(path, { artifactSet, source });
    }
  }
  assert.deepEqual([...provenanceByPath.keys()].sort(), tracked, "Provenance must cover tracked knowledge exactly");

  const entries = [];
  for (const path of tracked) {
    const absolutePath = join(PROJECT_ROOT, path);
    const stats = await lstat(absolutePath);
    assert.equal(stats.isFile(), true, `Knowledge path is not a regular file: ${path}`);
    assert.equal(stats.isSymbolicLink(), false, `Knowledge path cannot be a symlink: ${path}`);
    const { artifactSet, source } = provenanceByPath.get(path);
    assert.ok(source.owner?.trim(), `Knowledge source owner is missing: ${path}`);
    assert.ok(source.license?.trim(), `Knowledge source license or permission is missing: ${path}`);
    assert.ok(source.reuse?.trim(), `Knowledge source reuse basis is missing: ${path}`);
    assert.ok(artifactSet.transformation?.trim(), `Transformation record is missing: ${path}`);
    assert.ok(artifactSet.reviewedBy?.trim(), `Reviewer is missing: ${path}`);
    assert.equal(Number.isNaN(Date.parse(artifactSet.reviewedAt)), false, `Review date is invalid: ${path}`);

    entries.push({
      id: `ztde-kb-${createHash("sha256").update(path).digest("hex").slice(0, 16)}`,
      path,
      sha256: await sha256(absolutePath),
      purpose: purposeFor(path),
      retrievalStatus: retrieved.has(path) ? "included" : "excluded",
      packageStatus: "included",
      publicStatus: "admitted",
      provenanceRecord: artifactSet.id,
      sourceRecord: source.id,
      sourceOrigin: source.origin,
      declaredOwner: source.owner,
      licenseOrPermissionBasis: source.license,
      reuseBasis: source.reuse,
      transformationStatus: transformationStatus(source.id),
      transformation: artifactSet.transformation,
      reviewedBy: artifactSet.reviewedBy,
      reviewedAt: artifactSet.reviewedAt,
      classification: {
        duplicate: false,
        superseded: false,
        generation: generationStatus(path),
        personalData: personalDataStatus(path),
        externalSource: false,
      },
      disposition: "admit",
    });
  }

  return {
    version: "1.0",
    authority: "SKILL.md",
    boundary: "git-tracked-knowledge-base",
    trackedFileCount: entries.length,
    packageFileCount: packaged.length,
    retrievalFileCount: retrieved.size,
    entries,
  };
}

const { mode, inventoryPath } = parseArguments(process.argv.slice(2));
const inventory = await buildInventory();
const serialized = `${JSON.stringify(inventory, null, 2)}\n`;

if (mode === "write") {
  await writeFile(DEFAULT_INVENTORY, serialized, "utf8");
} else {
  const retained = await readFile(inventoryPath, "utf8");
  assert.equal(retained, serialized, "Public knowledge inventory is stale; run node scripts/knowledge-inventory.mjs --write");
}

process.stdout.write(`${JSON.stringify({
  version: inventory.version,
  trackedFileCount: inventory.trackedFileCount,
  packageFileCount: inventory.packageFileCount,
  retrievalFileCount: inventory.retrievalFileCount,
  inventorySha256: createHash("sha256").update(serialized).digest("hex"),
  passed: true,
}, null, 2)}\n`);
