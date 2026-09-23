import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, lstat, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

import { expectedKnowledgePaths } from "./package-artifact.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MANIFEST = join(PROJECT_ROOT, "governance", "public-knowledge-boundary.json");
const ADMISSION_PATH = join(PROJECT_ROOT, "governance", "knowledge-admission.json");
const REMOVAL_COMMIT = "2d77beb";

const REMOVED_PATHS = [
  "knowledge-base/architecture/ATAM.md",
  "knowledge-base/architecture/DOOS_2 updated.md",
  "knowledge-base/architecture/Evaluation.md",
  "knowledge-base/architecture/Master_Digital_Product_UIX_Architecture_Handbook.md",
  "knowledge-base/architecture/ProductPlatforms.md",
  "knowledge-base/architecture/SDA Components and Interfaces.md",
  "knowledge-base/architecture/SDA1.md",
  "knowledge-base/architecture/SDA10.md",
  "knowledge-base/architecture/SDA11.md",
  "knowledge-base/architecture/SDA12.md",
  "knowledge-base/architecture/SDA2.md",
  "knowledge-base/architecture/SDA3.md",
  "knowledge-base/architecture/SDA4.1.md",
  "knowledge-base/architecture/SDA4.2.md",
  "knowledge-base/architecture/SDA5.md",
  "knowledge-base/architecture/SDA6.md",
  "knowledge-base/architecture/SDA7.md",
  "knowledge-base/architecture/SDA8.md",
  "knowledge-base/architecture/SDA9.md",
  "knowledge-base/architecture/SDA_Architecture.md",
  "knowledge-base/architecture/SDA_Architecture2.md",
  "knowledge-base/architecture/SDA_DP_set1.md",
  "knowledge-base/architecture/SDA_DP_set2.md",
  "knowledge-base/architecture/SDA_DP_set3.md",
  "knowledge-base/architecture/SDA_Packages and Cohesion.md",
  "knowledge-base/architecture/SDA_Packages and Coupling.md",
  "knowledge-base/architecture/SDA_whatisdesign.md",
  "knowledge-base/architecture/Styles1.md",
  "knowledge-base/architecture/Styles2.md",
  "knowledge-base/architecture/Styles3.md",
  "knowledge-base/figma-and-systems/AI_Design_Skill_Research_Handbook.md",
  "knowledge-base/figma-and-systems/ZtotheZ_AI_Product_Design_SKILL.md",
  "knowledge-base/legacy-sources/design-system/ENTERPRISE_READINESS.md",
  "knowledge-base/legacy-sources/design-system/MASTER.md",
  "knowledge-base/legacy-sources/design-system/ai-workspace-patterns/MASTER.md",
  "knowledge-base/legacy-sources/design-system/ai-workspace-patterns/UX-FOUNDATIONS.md",
  "knowledge-base/legacy-sources/design-system/ai-workspace-patterns/pages/agent.md",
  "knowledge-base/legacy-sources/design-system/ai-workspace-patterns/pages/analyze.md",
  "knowledge-base/legacy-sources/design-system/ai-workspace-patterns/pages/landing.md",
  "knowledge-base/legacy-sources/design-system/operational-dashboard-patterns/MASTER.md",
  "knowledge-base/legacy-sources/design-system/operational-dashboard-patterns/pages/document-conversion.md",
  "knowledge-base/legacy-sources/design-system/operational-dashboard-patterns/pages/media-processing.md",
  "knowledge-base/legacy-sources/design-system/operational-dashboard-patterns/pages/period-records.md",
  "knowledge-base/legacy-sources/design-system/operational-dashboard-patterns/pages/pipeline-tracker.md",
  "knowledge-base/legacy-sources/design-system/operational-dashboard-patterns/pages/repayment-tracker.md",
  "knowledge-base/ux-patterns/web-curator-tool-software-architecture-document.md",
];

function parseArguments(argv) {
  let mode = "check";
  let manifestPath = DEFAULT_MANIFEST;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") mode = "check";
    else if (argument === "--write") mode = "write";
    else if (argument === "--manifest") {
      const value = argv[index + 1];
      if (!value) throw new Error("--manifest requires a path");
      manifestPath = isAbsolute(value) ? value : resolve(PROJECT_ROOT, value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (mode === "write" && manifestPath !== DEFAULT_MANIFEST) {
    throw new Error("--write may update only the canonical public knowledge boundary manifest");
  }

  return { mode, manifestPath };
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

function gitOutput(args) {
  return execFileSync("git", args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

function commitExists(commit) {
  if (!isGitWorkingTree()) return false;
  try {
    gitOutput(["cat-file", "-e", `${commit}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

async function contentSha256FromGit(commitish, path) {
  const content = execFileSync("git", ["show", `${commitish}:${path}`], {
    cwd: PROJECT_ROOT,
    maxBuffer: 16 * 1024 * 1024,
  });
  return createHash("sha256").update(content).digest("hex");
}

function stableRemovedId(path) {
  return `ztde-removed-${createHash("sha256").update(path).digest("hex").slice(0, 16)}`;
}

async function pathExists(path) {
  try {
    await access(join(PROJECT_ROOT, path));
    return true;
  } catch {
    return false;
  }
}

function removedCategory(path) {
  if (path.startsWith("knowledge-base/architecture/")) return "raw-architecture-source";
  if (path.startsWith("knowledge-base/figma-and-systems/")) return "superseded-figma-research";
  if (path.startsWith("knowledge-base/legacy-sources/")) return "legacy-source-tree";
  if (path.startsWith("knowledge-base/ux-patterns/")) return "superseded-ux-reference";
  throw new Error(`Removed path has no category: ${path}`);
}

function maintainedReplacementPaths(category) {
  if (category === "raw-architecture-source") {
    return [
      "knowledge-base/maintained/architecture/MASTER.md",
      "knowledge-base/maintained/architecture/component-boundaries.md",
      "knowledge-base/maintained/architecture/product-platforms.md",
      "knowledge-base/maintained/architecture/quality-attributes-and-evaluation.md",
    ];
  }
  if (category === "superseded-figma-research") {
    return [
      "knowledge-base/design-intelligence/figma-production.md",
      "knowledge-base/design-intelligence/design-plan.md",
      "knowledge-base/design-intelligence/design-deliverable.schema.yaml",
    ];
  }
  if (category === "legacy-source-tree") {
    return [
      "knowledge-base/maintained/product-patterns/ai-workspaces.md",
      "knowledge-base/maintained/product-patterns/operational-dashboards.md",
    ];
  }
  return [
    "knowledge-base/usability-evaluation/HEURISTIC_EVALUATION.md",
    "knowledge-base/design-intelligence/information-design.md",
  ];
}

async function buildBoundaryManifest() {
  const admission = JSON.parse(await readFile(ADMISSION_PATH, "utf8"));
  const admittedPaths = admission.records.map((record) => record.path).sort();
  const packageKnowledgePaths = (await expectedKnowledgePaths())
    .filter((path) => path.startsWith("knowledge-base/"))
    .sort();
  const retainedDigests = new Map();
  try {
    const retained = JSON.parse(await readFile(DEFAULT_MANIFEST, "utf8"));
    for (const record of retained.removedArtifacts ?? []) {
      if (typeof record.previousPath === "string" && record.preRemovalContentDigest?.value) {
        retainedDigests.set(record.previousPath, record.preRemovalContentDigest.value);
      }
    }
  } catch {
    // The first canonical write in a Git checkout can compute the retained hashes from history.
  }

  const canReadRemovalHistory = commitExists(REMOVAL_COMMIT) && commitExists(`${REMOVAL_COMMIT}^`);
  const removedArtifacts = [];
  for (const path of REMOVED_PATHS) {
    const category = removedCategory(path);
    removedArtifacts.push({
      id: stableRemovedId(path),
      previousPath: path,
      category,
      preRemovalContentDigest: {
        algorithm: "sha256",
        value: canReadRemovalHistory
          ? await contentSha256FromGit(`${REMOVAL_COMMIT}^`, path)
          : retainedDigests.get(path) ?? "unavailable-in-archive-install",
      },
      disposition: "remove-from-public-tree",
      publicDistributionDecision: "prohibited",
      packageDecision: "prohibited",
      retrievalDecision: "prohibited",
      admissionDecision: "not-admitted",
      privateArchiveStatus: "owner-confirmed-private-backup-outside-repository",
      maintainedReplacementPaths: maintainedReplacementPaths(category),
      ownerReviewedBy: "ZtotheZ",
      ownerReviewedAt: "2026-08-31T00:00:00+03:00",
      removalEvidence: {
        currentTreeAbsent: true,
        removalCommit: REMOVAL_COMMIT,
        historicalGitObjectDecision: "separate-owner-approval-required",
        tagAndReleaseDecision: "separate-owner-approval-required",
      },
    });
  }

  return {
    version: "1.0",
    authority: "SKILL.md",
    scope: "public-repository-knowledge-boundary",
    policy: {
      publicKnowledgeMustEqualAdmissionManifest: true,
      removedSourcesCannotBeRuntimeFallbacks: true,
      privateArchiveLocationsAreNotPublished: true,
      historyRewriteRequiresSeparateApproval: true,
      tagsAndReleasesRequireSeparateApproval: true,
    },
    currentBoundary: {
      admittedManifest: "governance/knowledge-admission.json",
      admittedFileCount: admittedPaths.length,
      packageKnowledgeFileCount: packageKnowledgePaths.length,
      retrievalAuthority: "knowledge-base/retrieval-scope.yaml",
    },
    removedArtifacts,
  };
}

function assertRelativeKnowledgePath(path, label) {
  assert.equal(isAbsolute(path), false, `${label} must be repository-relative: ${path}`);
  assert.equal(path.startsWith("knowledge-base/"), true, `${label} must stay inside knowledge-base: ${path}`);
  assert.equal(path.includes(".."), false, `${label} cannot contain traversal: ${path}`);
}

function assertValidDigest(record) {
  assert.equal(record.preRemovalContentDigest.algorithm, "sha256", `${record.previousPath} digest algorithm mismatch`);
  assert.ok(
    /^[a-f0-9]{64}$/.test(record.preRemovalContentDigest.value) ||
      record.preRemovalContentDigest.value === "unavailable-in-archive-install",
    `${record.previousPath} has invalid pre-removal digest`,
  );
}

async function validateBoundaryManifest(manifest) {
  assert.equal(manifest.version, "1.0");
  assert.equal(manifest.authority, "SKILL.md");
  assert.equal(manifest.scope, "public-repository-knowledge-boundary");
  assert.equal(manifest.policy.publicKnowledgeMustEqualAdmissionManifest, true);
  assert.equal(manifest.policy.removedSourcesCannotBeRuntimeFallbacks, true);
  assert.equal(manifest.policy.privateArchiveLocationsAreNotPublished, true);
  assert.equal(manifest.policy.historyRewriteRequiresSeparateApproval, true);
  assert.equal(manifest.policy.tagsAndReleasesRequireSeparateApproval, true);

  const admission = JSON.parse(await readFile(join(PROJECT_ROOT, manifest.currentBoundary.admittedManifest), "utf8"));
  const admittedPaths = admission.records.map((record) => record.path).sort();
  const packageKnowledgePaths = (await expectedKnowledgePaths())
    .filter((path) => path.startsWith("knowledge-base/"))
    .sort();
  assert.deepEqual(packageKnowledgePaths, admittedPaths, "Public knowledge package boundary must equal admission manifest");
  assert.equal(manifest.currentBoundary.admittedFileCount, admittedPaths.length);
  assert.equal(manifest.currentBoundary.packageKnowledgeFileCount, packageKnowledgePaths.length);

  const admittedSet = new Set(admittedPaths);
  const retrievalScope = YAML.parse(
    await readFile(join(PROJECT_ROOT, "knowledge-base", "retrieval-scope.yaml"), "utf8"),
  );
  const retrievalSet = new Set(
    Object.values(retrievalScope.categories)
      .flatMap((category) => category.files)
      .filter((path) => path.startsWith("knowledge-base/")),
  );

  assert.equal(manifest.removedArtifacts.length, 46, "Exactly 46 baseline out-of-boundary files must be dispositioned");
  assert.equal(new Set(manifest.removedArtifacts.map((record) => record.id)).size, 46);
  assert.deepEqual(
    manifest.removedArtifacts.map((record) => record.previousPath).sort(),
    [...REMOVED_PATHS].sort(),
    "Removed artifact manifest must match the baseline removal set",
  );

  const hasRemovalHistory = commitExists(REMOVAL_COMMIT) && commitExists(`${REMOVAL_COMMIT}^`);
  const currentTracked = isGitWorkingTree()
    ? new Set(gitOutput(["ls-files", "--", "knowledge-base"]).trim().split("\n").filter(Boolean))
    : new Set(packageKnowledgePaths);
  assert.deepEqual([...currentTracked].sort(), admittedPaths, "Tracked knowledge files must equal admitted files");

  for (const record of manifest.removedArtifacts) {
    assert.equal(record.id, stableRemovedId(record.previousPath), `${record.previousPath} has unstable removal ID`);
    assertRelativeKnowledgePath(record.previousPath, `${record.id} previous path`);
    assertValidDigest(record);
    assert.equal(removedCategory(record.previousPath), record.category, `${record.previousPath} category mismatch`);
    assert.equal(record.disposition, "remove-from-public-tree", `${record.previousPath} disposition mismatch`);
    assert.equal(record.publicDistributionDecision, "prohibited", `${record.previousPath} public decision mismatch`);
    assert.equal(record.packageDecision, "prohibited", `${record.previousPath} package decision mismatch`);
    assert.equal(record.retrievalDecision, "prohibited", `${record.previousPath} retrieval decision mismatch`);
    assert.equal(record.admissionDecision, "not-admitted", `${record.previousPath} admission decision mismatch`);
    assert.equal(
      record.privateArchiveStatus,
      "owner-confirmed-private-backup-outside-repository",
      `${record.previousPath} private archive status mismatch`,
    );
    assert.equal(record.ownerReviewedBy, "ZtotheZ", `${record.previousPath} owner reviewer mismatch`);
    assert.equal(Number.isNaN(Date.parse(record.ownerReviewedAt)), false, `${record.previousPath} review time invalid`);
    assert.equal(record.removalEvidence.currentTreeAbsent, true, `${record.previousPath} must be absent from current tree`);
    assert.equal(record.removalEvidence.removalCommit, REMOVAL_COMMIT, `${record.previousPath} removal commit mismatch`);
    assert.equal(
      record.removalEvidence.historicalGitObjectDecision,
      "separate-owner-approval-required",
      `${record.previousPath} history decision mismatch`,
    );
    assert.equal(
      record.removalEvidence.tagAndReleaseDecision,
      "separate-owner-approval-required",
      `${record.previousPath} release decision mismatch`,
    );

    assert.equal(await pathExists(record.previousPath), false, `${record.previousPath} exists in current filesystem`);
    assert.equal(currentTracked.has(record.previousPath), false, `${record.previousPath} is still tracked`);
    assert.equal(admittedSet.has(record.previousPath), false, `${record.previousPath} is still admitted`);
    assert.equal(packageKnowledgePaths.includes(record.previousPath), false, `${record.previousPath} is still packaged`);
    assert.equal(retrievalSet.has(record.previousPath), false, `${record.previousPath} is still retrievable`);

    for (const replacementPath of record.maintainedReplacementPaths) {
      assertRelativeKnowledgePath(replacementPath, `${record.previousPath} maintained replacement`);
      assert.ok(admittedSet.has(replacementPath), `${record.previousPath} replacement is not admitted: ${replacementPath}`);
      const stats = await lstat(join(PROJECT_ROOT, replacementPath));
      assert.equal(stats.isFile(), true, `${record.previousPath} replacement is not a file: ${replacementPath}`);
      assert.equal(stats.isSymbolicLink(), false, `${record.previousPath} replacement cannot be a symlink: ${replacementPath}`);
    }

    if (hasRemovalHistory) {
      const status = gitOutput(["diff-tree", "--no-commit-id", "--name-status", "-r", REMOVAL_COMMIT, "--", record.previousPath]).trim();
      assert.equal(status, `D\t${record.previousPath}`, `${record.previousPath} was not deleted by ${REMOVAL_COMMIT}`);
      assert.equal(
        record.preRemovalContentDigest.value,
        await contentSha256FromGit(`${REMOVAL_COMMIT}^`, record.previousPath),
        `${record.previousPath} pre-removal digest drift`,
      );
    }
  }
}

const { mode, manifestPath } = parseArguments(process.argv.slice(2));
const manifest = await buildBoundaryManifest();
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (mode === "write") {
  await writeFile(DEFAULT_MANIFEST, serialized, "utf8");
} else {
  const retained = await readFile(manifestPath, "utf8");
  assert.equal(retained, serialized, "Public knowledge boundary manifest is stale; run node scripts/knowledge-boundary.mjs --write");
}

await validateBoundaryManifest(JSON.parse(serialized));

process.stdout.write(`${JSON.stringify({
  version: manifest.version,
  scope: manifest.scope,
  admittedFileCount: manifest.currentBoundary.admittedFileCount,
  removedArtifactCount: manifest.removedArtifacts.length,
  boundarySha256: createHash("sha256").update(serialized).digest("hex"),
  passed: true,
}, null, 2)}\n`);
