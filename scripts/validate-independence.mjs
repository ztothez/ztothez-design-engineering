import assert from "node:assert/strict";
import { lstat, readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

import YAML from "yaml";

import {
  PROJECT_ROOT,
  expectedKnowledgePaths,
  expectedProvenancePaths,
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

async function validateProvenance() {
  const manifest = YAML.parse(
    await readFile(join(PROJECT_ROOT, "knowledge-base", "provenance.yaml"), "utf8"),
  );
  assert.equal(manifest.version, "1.0");
  const sources = new Set(manifest.sources.map((source) => source.id));
  assert.equal(sources.size, manifest.sources.length, "provenance source IDs must be unique");

  const paths = [];
  for (const set of manifest.artifactSets) {
    assert.ok(sources.has(set.source), `unknown provenance source: ${set.source}`);
    assert.equal(set.status, "approved", `${set.id} is not approved`);
    assert.ok(set.transformation?.trim(), `${set.id} lacks transformation history`);
    assert.ok(set.reviewedBy?.trim(), `${set.id} lacks an attributable reviewer`);
    assert.ok(!Number.isNaN(Date.parse(set.reviewedAt)), `${set.id} has an invalid review time`);
    for (const path of set.paths) {
      const stats = await lstat(join(PROJECT_ROOT, path));
      assert.ok(stats.isFile(), `provenance path is not a regular file: ${path}`);
      assert.equal(stats.isSymbolicLink(), false, `provenance path cannot be a symlink: ${path}`);
      paths.push(path);
    }
  }
  assert.equal(new Set(paths).size, paths.length, "provenance artifact paths must be unique");
  assert.deepEqual(paths.sort(), await expectedProvenancePaths());
  for (const path of [
    "knowledge-base/design-intelligence/interface-trust.md",
    "knowledge-base/design-intelligence/information-design.md",
    "knowledge-base/design-intelligence/visual-polish.md",
  ]) {
    assert.ok(paths.includes(path), `V2 module is missing approved provenance: ${path}`);
  }
  return { artifacts: paths.length, sources: sources.size };
}

async function validateDependencies() {
  const inventory = YAML.parse(
    await readFile(join(PROJECT_ROOT, "knowledge-base", "dependencies.yaml"), "utf8"),
  );
  const packageJson = JSON.parse(await readFile(join(PROJECT_ROOT, "package.json"), "utf8"));
  const lock = JSON.parse(await readFile(join(PROJECT_ROOT, inventory.lockfile), "utf8"));
  assert.equal(inventory.version, "1.0");
  assert.equal(inventory.policy.strategicCapabilitiesMustRemainProjectOwned, true);

  const productionLockPackages = Object.entries(lock.packages).filter(
    ([path, metadata]) => path.startsWith("node_modules/") && !metadata.dev,
  );
  for (const [path, metadata] of productionLockPackages) {
    assert.ok(metadata.version, `production lockfile package lacks a version: ${path}`);
    assert.ok(metadata.license, `production lockfile package lacks a license: ${path}`);
    assert.ok(
      inventory.policy.allowedLicenses.includes(metadata.license),
      `production lockfile package has an unapproved license: ${path} (${metadata.license})`,
    );
  }

  const expected = new Map([
    ...Object.entries(packageJson.dependencies ?? {}).map(([name, range]) => [name, { scope: "runtime", range }]),
    ...Object.entries(packageJson.devDependencies ?? {}).map(([name, range]) => [name, { scope: "development", range }]),
  ]);
  assert.equal(inventory.dependencies.length, expected.size, "dependency inventory count mismatch");
  for (const dependency of inventory.dependencies) {
    const declaration = expected.get(dependency.name);
    assert.ok(declaration, `inventory contains undeclared dependency: ${dependency.name}`);
    assert.equal(dependency.scope, declaration.scope, `${dependency.name} scope mismatch`);
    assert.equal(dependency.versionRange, declaration.range, `${dependency.name} range mismatch`);
    const locked = lock.packages[`node_modules/${dependency.name}`];
    assert.ok(locked, `lockfile entry missing: ${dependency.name}`);
    assert.equal(dependency.resolvedVersion, locked.version, `${dependency.name} resolved version mismatch`);
    assert.equal(dependency.license, locked.license, `${dependency.name} license mismatch`);
    assert.ok(inventory.policy.allowedLicenses.includes(dependency.license), `${dependency.name} license is not allowed`);
    assert.equal(dependency.role, "replaceable-infrastructure", `${dependency.name} cannot own a strategic capability`);
    assert.ok(dependency.boundary?.trim(), `${dependency.name} lacks a boundary`);
    assert.ok(dependency.fallback?.trim(), `${dependency.name} lacks a fallback`);
    assert.ok(dependency.replacementTrigger?.trim(), `${dependency.name} lacks a replacement trigger`);
    expected.delete(dependency.name);
  }
  assert.equal(expected.size, 0, `dependencies missing from inventory: ${[...expected.keys()].join(", ")}`);
  return {
    directDependencies: inventory.dependencies.length,
    productionLockPackages: productionLockPackages.length,
  };
}

async function validateReferenceIsolation() {
  const forbidden = [
    ["legacy", "sources"].join("-"),
    ["older", "design", "data"].join("-"),
    ["usability", "uix"].join(""),
    ["external", "reference"].join("-"),
    ["external", "reference"].join("-"),
    ["historical-readiness-source", "ai", "uix", "readiness", "plan"].join("-"),
    ["external-design-source", "cc"].join("."),
    ["knowledge-base", "architecture"].join("/"),
    ["knowledge-base", "figma-and-systems"].join("/"),
    ["knowledge-base", "ux-patterns"].join("/"),
    ["knowledge-base", "usability-evaluation", "sources"].join("/"),
  ];
  const roots = ["src", "cli", "docs", "ci", ".github", "scripts"];
  const activeFiles = [
    join(PROJECT_ROOT, "README.md"),
    join(PROJECT_ROOT, "SKILL.md"),
    join(PROJECT_ROOT, "package.json"),
  ];
  for (const root of roots) {
    activeFiles.push(...(await filesUnder(join(PROJECT_ROOT, root))));
  }
  for (const artifactPath of await expectedProvenancePaths()) {
    activeFiles.push(join(PROJECT_ROOT, artifactPath));
  }

  const inspected = new Set();
  for (const file of activeFiles) {
    const path = portable(relative(PROJECT_ROOT, file));
    if (inspected.has(path)) continue;
    inspected.add(path);
    if (![".cjs", ".css", ".html", ".js", ".json", ".md", ".mjs", ".ts", ".tsx", ".yaml", ".yml"].includes(extname(file))) continue;
    const content = (await readFile(file, "utf8")).toLowerCase();
    for (const fragment of forbidden) {
      assert.equal(content.includes(fragment), false, `active file references prohibited archive authority ${fragment}: ${path}`);
    }
  }
  return { filesInspected: inspected.size };
}

const report = {
  version: "1.0",
  provenance: await validateProvenance(),
  dependencyInventory: await validateDependencies(),
  referenceIsolation: await validateReferenceIsolation(),
  passed: true,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
