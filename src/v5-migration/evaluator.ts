import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";

import { qualifySourceRemoval } from "../source-removal/evaluator.js";
import {
  v5MigrationReportV2Schema,
  type V5MigrationCommandEvidence,
  type V5MigrationReport,
} from "./schema.js";

type AdmissionManifest = {
  records: Array<{
    id: string;
    path: string;
    contentDigest: { value: string };
    sourceIdentity: { sourceOrigin: string };
    transformation: { status: string; method: string };
    decisions: { retrieval: string; package: string; disposition: string };
  }>;
};

type Inventory = {
  trackedFileCount: number;
  packageFileCount: number;
  entries: Array<{ path: string; disposition: string; sha256: string }>;
};

type Boundary = {
  removedArtifacts: Array<{
    id: string;
    previousPath: string;
    category: string;
    preRemovalContentDigest: { value: string };
    disposition: string;
    privateArchiveStatus: string;
    maintainedReplacementPaths: string[];
    removalEvidence: { currentTreeAbsent: boolean };
  }>;
};

type CompiledAuthority = {
  integrity: { payloadSha256: string };
  knowledge: {
    admittedFileCount: number;
    retrievalFileCount: number;
  };
  ruleRegistry: { ruleCount: number };
};

export type BuildV5MigrationReportOptions = {
  projectRoot?: string;
  commandEvidence?: Record<string, V5MigrationCommandEvidence>;
  packageFiles?: string[];
  publicFiles?: string[];
  preChangeDigests?: Record<string, string | "not-present-before-rewrite">;
  releaseNotesDraftPath?: string;
};

function portable(path: string): string {
  return path.split(sep).join("/");
}

async function readJson<T>(root: string, path: string): Promise<T> {
  return JSON.parse(await readFile(join(root, path), "utf8")) as T;
}

async function fileDigest(root: string, path: string): Promise<string> {
  return createHash("sha256").update(await readFile(join(root, path))).digest("hex");
}

function commandPassed(commandEvidence: Record<string, V5MigrationCommandEvidence>, id: string): boolean | undefined {
  return commandEvidence[id]?.passed;
}

function allCommandsPassed(commandEvidence: Record<string, V5MigrationCommandEvidence>): boolean {
  const entries = Object.values(commandEvidence);
  return entries.length === 0 ? true : entries.every((entry) => entry.passed);
}

export async function buildV5MigrationReport(
  options: BuildV5MigrationReportOptions = {},
): Promise<V5MigrationReport> {
  const root = await realpath(resolve(options.projectRoot ?? process.cwd()));
  const [admission, inventory, boundary, compiled] = await Promise.all([
    readJson<AdmissionManifest>(root, "governance/knowledge-admission.json"),
    readJson<Inventory>(root, "governance/public-knowledge-inventory.json"),
    readJson<Boundary>(root, "governance/public-knowledge-boundary.json"),
    readJson<CompiledAuthority>(root, "model/compiled-authority.json"),
  ]);
  const packageJson = await readJson<{ version: string }>(root, "package.json");
  const sourceRemoval = await qualifySourceRemoval(undefined, root);

  const admissionDigest = await fileDigest(root, "governance/knowledge-admission.json");
  const inventoryDigest = await fileDigest(root, "governance/public-knowledge-inventory.json");
  const boundaryDigest = await fileDigest(root, "governance/public-knowledge-boundary.json");
  const compiledAuthorityDigest = await fileDigest(root, "model/compiled-authority.json");

  const admittedPaths = admission.records.map((record) => record.path).sort();
  const packageKnowledgeFiles = options.packageFiles
    ?.filter((path) => path.startsWith("knowledge-base/"))
    .sort();
  const packageKnowledgeMatchesAdmission = packageKnowledgeFiles
    ? JSON.stringify(packageKnowledgeFiles) === JSON.stringify(admittedPaths)
    : undefined;

  const removed = boundary.removedArtifacts.map((artifact) => ({
    id: artifact.id,
    path: artifact.previousPath,
    category: artifact.category,
    disposition: artifact.disposition,
    preChangeDigest: { algorithm: "sha256" as const, value: artifact.preRemovalContentDigest.value },
    postChangeDigest: { algorithm: "sha256" as const, value: "absent" },
    evidence: [
      "governance/public-knowledge-boundary.json",
      ...artifact.maintainedReplacementPaths,
    ],
    notes: artifact.removalEvidence.currentTreeAbsent
      ? "Removed from the current public tree; historical Git objects and public releases require separate owner approval."
      : "Removal is not verified.",
  }));

  const privateArchived = removed
    .filter((artifact) => {
      const source = boundary.removedArtifacts.find((entry) => entry.id === artifact.id);
      return source?.privateArchiveStatus === "owner-confirmed-private-backup-outside-repository";
    })
    .map((artifact) => ({
      ...artifact,
      disposition: "private-archive-outside-public-repository",
      evidence: ["governance/public-knowledge-boundary.json"],
      notes: "Owner confirmed a private backup outside Git, npm package output, release assets, CI artifacts, and MCP retrieval.",
    }));

  const removedByReplacement = new Map<string, Array<{ path: string; digest: string }>>();
  for (const artifact of boundary.removedArtifacts) {
    for (const replacement of artifact.maintainedReplacementPaths) {
      const sources = removedByReplacement.get(replacement) ?? [];
      sources.push({
        path: artifact.previousPath,
        digest: artifact.preRemovalContentDigest.value,
      });
      removedByReplacement.set(replacement, sources);
    }
  }

  const admitted = admission.records.map((record) => ({
    id: record.id,
    path: record.path,
    category: record.sourceIdentity.sourceOrigin,
    disposition: record.decisions.disposition,
    preChangeDigest: { algorithm: "sha256" as const, value: "not-recorded-current-admission-baseline" },
    postChangeDigest: { algorithm: "sha256" as const, value: record.contentDigest.value },
    evidence: ["governance/knowledge-admission.json", "governance/public-knowledge-inventory.json"],
    notes: `${record.transformation.status}; package=${record.decisions.package}; retrieval=${record.decisions.retrieval}.`,
  }));

  const rewritten = admission.records
    .filter((record) => removedByReplacement.has(record.path))
    .map((record) => {
      const derivedFrom = removedByReplacement.get(record.path)?.find(
        (source) => /^[a-f0-9]{64}$/.test(source.digest),
      );
      if (!derivedFrom) {
        throw new Error(`Rewritten artifact has no valid source provenance: ${record.path}`);
      }
      return {
        id: record.id,
        path: record.path,
        category: "maintained-replacement",
        disposition: "rewritten-maintained-artifact",
        preChangeDigest: {
          algorithm: "sha256" as const,
          value: options.preChangeDigests?.[record.path] ?? "not-present-before-rewrite",
        },
        derivedFrom: {
          path: derivedFrom.path,
          digest: { algorithm: "sha256" as const, value: derivedFrom.digest },
        },
        postChangeDigest: { algorithm: "sha256" as const, value: record.contentDigest.value },
        evidence: ["governance/public-knowledge-boundary.json", "governance/knowledge-admission.json", record.path],
        notes: record.transformation.method,
      };
    });

  const blocked = inventory.entries
    .filter((entry) => entry.disposition === "blocked")
    .map((entry) => ({
      id: `blocked-${entry.sha256.slice(0, 16)}`,
      path: entry.path,
      category: "blocked-public-knowledge",
      disposition: "blocked",
      preChangeDigest: { algorithm: "sha256" as const, value: "not-recorded-current-admission-baseline" },
      postChangeDigest: { algorithm: "sha256" as const, value: entry.sha256 },
      evidence: ["governance/public-knowledge-inventory.json"],
      notes: "Blocked by inventory disposition.",
    }));

  const commandEvidence = options.commandEvidence ?? {};
  const publicActions = {
    "git-commit": "not-authorized",
    "git-push": "not-authorized",
    "history-rewrite": "not-authorized",
    "tag-update": "not-authorized",
    "npm-publish": "not-authorized",
    "github-release": "not-authorized",
    "website-deploy": "not-authorized",
  } as const;

  const criteria = [
    admission.records.length === inventory.trackedFileCount,
    admission.records.length === compiled.knowledge.admittedFileCount,
    boundary.removedArtifacts.length === 46,
    removed.every((artifact) => artifact.postChangeDigest.value === "absent"),
    privateArchived.length === removed.length,
    blocked.length === 0,
    sourceRemoval.passed,
    packageKnowledgeMatchesAdmission !== false,
    allCommandsPassed(commandEvidence),
  ];

  const passed = criteria.every(Boolean);
  const claims = passed ? [
    "V6 is locally qualified in shadow against the admitted public knowledge boundary while V5 remains authoritative.",
    "The current system operates without removed source artifacts or private-source fallbacks.",
    "Public actions remain unapproved until the owner separately authorizes each action.",
  ] : [];

  const packageSet = new Set(options.packageFiles ?? []);
  const publicSet = new Set(options.publicFiles ?? []);
  const fileSetDifference = {
    publicOnly: [...publicSet].filter((path) => !packageSet.has(path)).sort(),
    packageOnly: [...packageSet].filter((path) => !publicSet.has(path)).sort(),
  };

  return v5MigrationReportV2Schema.parse({
    version: "2.0",
    generatedAt: new Date().toISOString(),
    authorityPath: "SKILL.md",
    status: passed ? "local-qualified" : "blocked",
    packageVersion: packageJson.version,
    counts: {
      admitted: admitted.length,
      removed: removed.length,
      privatelyArchived: privateArchived.length,
      rewritten: rewritten.length,
      blocked: blocked.length,
      ...(options.packageFiles ? { packageFiles: options.packageFiles.length } : {}),
      ...(options.publicFiles ? { publicFiles: options.publicFiles.length } : {}),
    },
    fileSetDifference,
    knowledgeIdentity: {
      admissionDigest,
      inventoryDigest,
      boundaryDigest,
      compiledAuthorityDigest,
      admittedFileCount: compiled.knowledge.admittedFileCount,
      retrievalFileCount: compiled.knowledge.retrievalFileCount,
      ruleCount: compiled.ruleRegistry.ruleCount,
      ...(packageKnowledgeMatchesAdmission !== undefined ? { packageKnowledgeMatchesAdmission } : {}),
    },
    artifacts: { removed, privatelyArchived: privateArchived, rewritten, admitted, blocked },
    localEvidence: {
      commandEvidence,
      sourceRemovalQualified: sourceRemoval.passed,
      publicContentPassed: commandPassed(commandEvidence, "public-content"),
      knowledgeQualityPassed: commandPassed(commandEvidence, "knowledge-quality"),
      packageSmokePassed: commandPassed(commandEvidence, "package-smoke"),
      archiveRemovalPassed: commandPassed(commandEvidence, "archive-removal"),
    },
    ownerReview: {
      requiredBeforePublicAction: [
        "Review the full Git diff and staged deletion list.",
        "Review the public knowledge inventory, admission manifest, boundary manifest, compiled authority, package manifest, and generated migration report.",
        "Approve or reject each public action separately.",
      ],
      publicActions,
    },
    releaseNotes: {
      ...(options.releaseNotesDraftPath ? { draftPath: portable(relative(root, resolve(root, options.releaseNotesDraftPath))) } : {}),
      prohibitedComparativeInputsNamed: false,
      summary: "V6 adds a shadow design-engineering workflow, deterministic evidence generation, and qualification checks while V5 remains the active authority.",
    },
    limitations: [
      "This is a local engineering qualification, not legal advice or legal clearance.",
      "Git history rewrite, tag movement, npm publication, GitHub release, and website deployment remain separate owner decisions.",
      "V6 remains in shadow mode and V5 remains authoritative until the owner explicitly approves a controlled cutover.",
    ],
    claims,
    passed,
  });
}
