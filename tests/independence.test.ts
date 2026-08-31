import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import YAML from "yaml";

test("distribution metadata excludes reference paths and classifies dependencies", async () => {
  const scope = YAML.parse(await readFile("knowledge-base/retrieval-scope.yaml", "utf8"));
  const provenance = YAML.parse(await readFile("knowledge-base/provenance.yaml", "utf8"));
  const dependencies = YAML.parse(await readFile("knowledge-base/dependencies.yaml", "utf8"));
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  const scopedPaths = Object.values(scope.categories).flatMap(
    (category) => (category as { files: string[] }).files,
  );
  const approvedRetrievalRoots = [
    "knowledge-base/maintained/",
    "knowledge-base/design-intelligence/",
    "knowledge-base/usability-evaluation/",
  ];

  assert.equal(
    scopedPaths.every(
      (path) => path === "SKILL.md" || approvedRetrievalRoots.some((root) => path.startsWith(root)),
    ),
    true,
  );
  assert.equal(provenance.policy.coverage, "exact-distribution");
  assert.ok(provenance.artifactSets.every((set: { status: string }) => set.status === "approved"));
  assert.equal(
    dependencies.dependencies.length,
    Object.keys(packageJson.dependencies).length + Object.keys(packageJson.devDependencies).length,
  );
  assert.ok(
    dependencies.dependencies.every(
      (dependency: { role: string; boundary?: string; fallback?: string }) =>
        dependency.role === "replaceable-infrastructure" &&
        Boolean(dependency.boundary) &&
        Boolean(dependency.fallback),
    ),
  );
});
