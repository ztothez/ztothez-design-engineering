import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

import { expectedKnowledgePaths } from "./package-artifact.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MANIFEST = join(PROJECT_ROOT, "governance", "knowledge-admission.json");
const INVENTORY_PATH = join(PROJECT_ROOT, "governance", "public-knowledge-inventory.json");
const PROVENANCE_PATH = join(PROJECT_ROOT, "knowledge-base", "provenance.yaml");

const AI_REVIEWER_PATTERN = /\b(?:ai|agent|assistant|bot|claude|codex|cursor|windsurf|lovable|antigravity|copilot|kiro|qoder)\b/i;
const UNKNOWN_PATTERN = /\b(?:unknown|todo|tbd|unclear|unspecified|unverified|assume|assumed)\b/i;

function parseArguments(argv) {
  let mode = "check";
  let manifestPath = DEFAULT_MANIFEST;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") mode = "check";
    else if (argument === "--write") mode = "write";
    else if (argument === "--validate-only") mode = "validate-only";
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
    throw new Error("--write may update only the canonical knowledge admission manifest");
  }

  return { mode, manifestPath };
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function stableId(path) {
  return `ztde-kb-${createHash("sha256").update(path).digest("hex").slice(0, 16)}`;
}

function portablePath(path) {
  return path.split("\\").join("/");
}

function assertRelativeRepositoryPath(path, label) {
  assert.equal(isAbsolute(path), false, `${label} must be repository-relative: ${path}`);
  assert.equal(path.includes(".."), false, `${label} cannot contain traversal: ${path}`);
  assert.match(path, /^[A-Za-z0-9._/-]+$/, `${label} contains unsupported characters: ${path}`);
}

function assertKnownText(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim(), `${label} is required`);
  assert.equal(UNKNOWN_PATTERN.test(value), false, `${label} cannot be unknown or provisional`);
}

function reviewedByRole(reviewer) {
  return reviewer === "ZtotheZ" ? "owner-maintainer" : "human-maintainer";
}

function authorizationStatus(sourceOrigin) {
  if (sourceOrigin === "original") return "not-applicable-project-authored";
  if (sourceOrigin === "user-owned") return "owner-authorized";
  throw new Error(`Unsupported source origin: ${sourceOrigin}`);
}

function evidenceForSource(source) {
  if (source.evidence?.startsWith("knowledge-base/")) {
    return {
      kind: "public-source-summary",
      location: source.evidence,
    };
  }

  return {
    kind: "repository-history",
    location: "git-history-and-maintained-source-files",
  };
}

function sourceByPath(provenance) {
  const sources = new Map(provenance.sources.map((source) => [source.id, source]));
  const result = new Map();

  for (const artifactSet of provenance.artifactSets) {
    const source = sources.get(artifactSet.source);
    assert.ok(source, `Unknown provenance source: ${artifactSet.source}`);
    assert.equal(artifactSet.status, "approved", `Unapproved artifact set cannot be admitted: ${artifactSet.id}`);

    for (const path of artifactSet.paths.filter((path) => path.startsWith("knowledge-base/"))) {
      assert.equal(result.has(path), false, `Duplicate admission source path: ${path}`);
      result.set(path, { artifactSet, source });
    }
  }

  return result;
}

async function assertEvidenceLocation(record) {
  if (record.sourceIdentity.evidence.kind !== "public-source-summary") return;
  const location = record.sourceIdentity.evidence.location;
  assertRelativeRepositoryPath(location, `${record.path} evidence location`);
  const resolved = resolve(PROJECT_ROOT, location);
  assert.ok(
    resolved.startsWith(PROJECT_ROOT),
    `${record.path} evidence location escapes the repository`,
  );
  const stats = await lstat(resolved);
  assert.equal(stats.isFile(), true, `${record.path} evidence location is not a file`);
  assert.equal(stats.isSymbolicLink(), false, `${record.path} evidence location cannot be a symlink`);
}

async function buildAdmissionManifest() {
  const inventory = JSON.parse(await readFile(INVENTORY_PATH, "utf8"));
  const provenance = YAML.parse(await readFile(PROVENANCE_PATH, "utf8"));
  const expectedPaths = (await expectedKnowledgePaths())
    .filter((path) => path.startsWith("knowledge-base/"))
    .sort();
  const inventoryByPath = new Map(inventory.entries.map((entry) => [entry.path, entry]));
  const provenanceByPath = sourceByPath(provenance);

  assert.deepEqual(
    [...inventoryByPath.keys()].sort(),
    expectedPaths,
    "Knowledge admission requires inventory and package boundary to match exactly",
  );
  assert.deepEqual(
    [...provenanceByPath.keys()].sort(),
    expectedPaths,
    "Knowledge admission requires provenance and package boundary to match exactly",
  );

  const records = [];
  for (const path of expectedPaths) {
    const inventoryEntry = inventoryByPath.get(path);
    const provenanceEntry = provenanceByPath.get(path);
    assert.ok(inventoryEntry, `Missing inventory entry: ${path}`);
    assert.ok(provenanceEntry, `Missing provenance entry: ${path}`);

    const { artifactSet, source } = provenanceEntry;
    const sourceEvidence = evidenceForSource(source);
    const sourceOrigin = source.origin;
    const reviewRole = reviewedByRole(artifactSet.reviewedBy);

    records.push({
      id: stableId(path),
      path,
      contentDigest: {
        algorithm: "sha256",
        value: await sha256(join(PROJECT_ROOT, path)),
      },
      sourceIdentity: {
        sourceRecord: source.id,
        sourceOrigin,
        declaredOwner: source.owner,
        evidence: sourceEvidence,
        authorizationBoundary: source.reuse,
        officialStandards:
          path.includes("accessibility") || path.includes("usability") || path.includes("heuristic")
            ? ["wcag-2.2"]
            : [],
      },
      licensing: {
        licenseOrPermissionBasis: source.license,
        reuseBasis: source.reuse,
        broadProjectLicenseRelicense: false,
      },
      transformation: {
        status: inventoryEntry.transformationStatus,
        method: artifactSet.transformation,
      },
      decisions: {
        publicDistribution: "approved",
        package: "approved",
        retrieval: inventoryEntry.retrievalStatus,
        disposition: inventoryEntry.disposition,
      },
      review: {
        reviewedBy: artifactSet.reviewedBy,
        reviewerRole: reviewRole,
        reviewedAt: artifactSet.reviewedAt,
        legalReviewStatus: "not-a-legal-opinion-owner-reviewed",
        humanAuthorizationStatus: authorizationStatus(sourceOrigin),
        aiAgentCanComplete: false,
      },
    });
  }

  return {
    version: "1.0",
    authority: "SKILL.md",
    scope: "public-knowledge-base",
    policy: {
      failClosedOnUnknownOrConflictingRecords: true,
      aiAgentsCannotCompleteLegalReviewOrHumanAuthorization: true,
      broadProjectLicenseDoesNotRelicenseThirdPartyInputs: true,
      privateResearchIsNeverRuntimeFallback: true,
    },
    officialStandards: [
      {
        id: "wcag-2.2",
        authorityName: "World Wide Web Consortium Accessibility Guidelines Working Group",
        canonicalUrl: "https://www.w3.org/TR/WCAG22/",
        status: "W3C Recommendation",
        verifiedAt: "2026-08-31T00:00:00+03:00",
        reuseTerms:
          "Cited as an external official standard. The specification is not redistributed as source text; W3C copyright, document use, trademark, liability, and patent-policy terms remain external authority.",
      },
    ],
    records,
  };
}

async function validateAdmissionManifest(manifest) {
  assert.equal(manifest.version, "1.0");
  assert.equal(manifest.authority, "SKILL.md");
  assert.equal(manifest.scope, "public-knowledge-base");
  assert.equal(manifest.policy.failClosedOnUnknownOrConflictingRecords, true);
  assert.equal(manifest.policy.aiAgentsCannotCompleteLegalReviewOrHumanAuthorization, true);
  assert.equal(manifest.policy.broadProjectLicenseDoesNotRelicenseThirdPartyInputs, true);
  assert.equal(manifest.policy.privateResearchIsNeverRuntimeFallback, true);

  const expectedPaths = (await expectedKnowledgePaths())
    .filter((path) => path.startsWith("knowledge-base/"))
    .sort();
  assert.deepEqual(
    manifest.records.map((record) => record.path).sort(),
    expectedPaths,
    "Admission manifest must cover the public knowledge/package boundary exactly",
  );
  assert.equal(new Set(manifest.records.map((record) => record.id)).size, manifest.records.length);
  assert.equal(new Set(manifest.records.map((record) => record.path)).size, manifest.records.length);

  const standards = new Map(manifest.officialStandards.map((standard) => [standard.id, standard]));
  for (const standard of manifest.officialStandards) {
    assertKnownText(standard.id, `${standard.id} standard ID`);
    assertKnownText(standard.authorityName, `${standard.id} authority`);
    assert.match(standard.canonicalUrl, /^https:\/\//, `${standard.id} canonical URL must be HTTPS`);
    assertKnownText(standard.status, `${standard.id} status`);
    assert.equal(Number.isNaN(Date.parse(standard.verifiedAt)), false, `${standard.id} verifiedAt is invalid`);
    assertKnownText(standard.reuseTerms, `${standard.id} reuse terms`);
  }

  for (const record of manifest.records) {
    assertRelativeRepositoryPath(record.path, `${record.id} path`);
    assert.equal(record.path.startsWith("knowledge-base/"), true, `${record.id} must stay inside knowledge-base`);
    assert.equal(record.id, stableId(record.path), `${record.path} has unstable admission ID`);
    assert.equal(record.contentDigest.algorithm, "sha256", `${record.path} digest algorithm mismatch`);
    assert.match(record.contentDigest.value, /^[a-f0-9]{64}$/, `${record.path} digest must be SHA-256`);
    assert.equal(
      record.contentDigest.value,
      await sha256(join(PROJECT_ROOT, record.path)),
      `${record.path} content digest drift`,
    );

    assertKnownText(record.sourceIdentity.sourceRecord, `${record.path} source record`);
    assert.ok(["original", "user-owned"].includes(record.sourceIdentity.sourceOrigin), `${record.path} source origin is unsupported`);
    assertKnownText(record.sourceIdentity.declaredOwner, `${record.path} declared owner`);
    assertKnownText(record.sourceIdentity.authorizationBoundary, `${record.path} authorization boundary`);
    assertKnownText(record.licensing.licenseOrPermissionBasis, `${record.path} license or permission`);
    assertKnownText(record.licensing.reuseBasis, `${record.path} reuse basis`);
    assert.equal(record.licensing.broadProjectLicenseRelicense, false, `${record.path} cannot rely on broad relicensing`);

    assert.ok(["public-source-summary", "repository-history"].includes(record.sourceIdentity.evidence.kind), `${record.path} evidence kind is unsupported`);
    assertKnownText(record.sourceIdentity.evidence.location, `${record.path} evidence location`);
    await assertEvidenceLocation(record);
    for (const standardId of record.sourceIdentity.officialStandards) {
      assert.ok(standards.has(standardId), `${record.path} references unknown official standard: ${standardId}`);
    }

    assertKnownText(record.transformation.status, `${record.path} transformation status`);
    assertKnownText(record.transformation.method, `${record.path} transformation method`);
    assert.equal(record.decisions.publicDistribution, "approved", `${record.path} is not approved for public distribution`);
    assert.equal(record.decisions.package, "approved", `${record.path} is not approved for package inclusion`);
    assert.ok(["included", "excluded"].includes(record.decisions.retrieval), `${record.path} retrieval decision is invalid`);
    assert.equal(record.decisions.disposition, "admit", `${record.path} disposition is not admitted`);

    assertKnownText(record.review.reviewedBy, `${record.path} reviewer`);
    assert.equal(AI_REVIEWER_PATTERN.test(record.review.reviewedBy), false, `${record.path} review cannot be completed by an AI agent`);
    assert.ok(["owner-maintainer", "human-maintainer"].includes(record.review.reviewerRole), `${record.path} reviewer role is invalid`);
    assert.equal(Number.isNaN(Date.parse(record.review.reviewedAt)), false, `${record.path} review timestamp is invalid`);
    assert.equal(record.review.legalReviewStatus, "not-a-legal-opinion-owner-reviewed", `${record.path} cannot claim legal review`);
    assert.equal(record.review.aiAgentCanComplete, false, `${record.path} AI agent authorization flag must be false`);
    assert.equal(
      record.review.humanAuthorizationStatus,
      authorizationStatus(record.sourceIdentity.sourceOrigin),
      `${record.path} human authorization status does not match source origin`,
    );
  }
}

const { mode, manifestPath } = parseArguments(process.argv.slice(2));
const manifest = await buildAdmissionManifest();
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (mode === "write") {
  await writeFile(DEFAULT_MANIFEST, serialized, "utf8");
} else if (mode === "validate-only") {
  const retained = await readFile(manifestPath, "utf8");
  await validateAdmissionManifest(JSON.parse(retained));
} else {
  const retained = await readFile(manifestPath, "utf8");
  assert.equal(retained, serialized, "Knowledge admission manifest is stale; run node scripts/knowledge-admission.mjs --write");
  await validateAdmissionManifest(JSON.parse(retained));
}

process.stdout.write(`${JSON.stringify({
  version: manifest.version,
  scope: manifest.scope,
  admittedFileCount: manifest.records.length,
  officialStandardCount: manifest.officialStandards.length,
  admissionSha256: createHash("sha256").update(serialized).digest("hex"),
  passed: true,
}, null, 2)}\n`);
