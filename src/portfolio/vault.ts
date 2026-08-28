import { readdir, readFile, rm, stat, unlink } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { z } from "zod";

import type { PortfolioProject } from "./schema.js";

export const evidenceClassSchema = z.enum([
  "private-raw",
  "redacted-report",
  "approved-screenshot",
  "public-synthetic",
  "aggregate-metrics",
]);

export const policyDecisionSchema = z.enum([
  "retained-by-policy",
  "redacted-machine-path",
  "screenshot-opt-in-approved",
  "screenshot-disabled-by-policy",
  "public-synthetic",
]);

export type EvidenceClass = z.infer<typeof evidenceClassSchema>;
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;

export type ScanResult = {
  passed: boolean;
  violations: Array<{
    type: "secret" | "prohibited-absolute-path";
    pattern: string;
    snippet: string;
  }>;
};

export type VaultArtifactInput = {
  path: string;
  kind: "report" | "screenshot" | "download" | "other" | "log";
  bytes: number;
  sha256: string;
  evidenceClass?: EvidenceClass;
  policyDecision?: PolicyDecision;
  sourceDigest?: string;
};

const SECRET_PATTERNS = [
  { name: "AWS Access Key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "AWS Secret Key", regex: /(?:aws_secret_access_key|aws_secret_key)\s*[:=]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi },
  { name: "Bearer Token", regex: /\bBearer\s+[A-Za-z0-9._~+/-]+=*\b/gi },
  { name: "Private Key Header", regex: /-----BEGIN\s+(?:[A-Z\s]+)?PRIVATE\s+KEY-----/g },
  { name: "Generic API Key Assignment", regex: /(?:api[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token)\s*[:=]\s*['"]([A-Za-z0-9._~+/-]{16,})['"]/gi },
  { name: "Password Assignment", regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]([^'"]{6,})['"]/gi },
];

const PROHIBITED_PATH_PATTERNS = [
  { name: "Unix Home Directory", regex: /\/(?:home|Users)\/[A-Za-z0-9_-]+\/[^\s"':;()<>]+/g },
  { name: "Windows User Directory", regex: /[A-Za-z]:\\Users\\[A-Za-z0-9_-]+\\[^\s"':;()<>]+/g },
];

export function scanTextForSecretsAndPaths(
  content: string,
  options: { allowWorkspaceRoot?: string; allowSourceRoot?: string } = {},
): ScanResult {
  const violations: ScanResult["violations"] = [];

  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(content)) !== null) {
      const snippet = match[0].slice(0, 60);
      violations.push({
        type: "secret",
        pattern: pattern.name,
        snippet,
      });
    }
  }

  for (const pattern of PROHIBITED_PATH_PATTERNS) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(content)) !== null) {
      const pathMatch = match[0];
      if (
        options.allowWorkspaceRoot &&
        (pathMatch === options.allowWorkspaceRoot || pathMatch.startsWith(`${options.allowWorkspaceRoot}/`))
      ) {
        continue;
      }
      if (
        options.allowSourceRoot &&
        (pathMatch === options.allowSourceRoot || pathMatch.startsWith(`${options.allowSourceRoot}/`))
      ) {
        continue;
      }
      violations.push({
        type: "prohibited-absolute-path",
        pattern: pattern.name,
        snippet: pathMatch.slice(0, 80),
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export function redactMachinePathsAndSecrets(
  content: string,
  context: {
    workspaceRoot?: string;
    sourceRoot?: string;
    allowedEnvironmentVariables?: string[];
  } = {},
): string {
  let redacted = content;

  if (context.sourceRoot) {
    const canonical = resolve(context.sourceRoot);
    redacted = redacted.replaceAll(canonical, "[source]");
  }

  if (context.workspaceRoot) {
    const canonical = resolve(context.workspaceRoot);
    redacted = redacted.replaceAll(canonical, "[workspace]");
  }

  redacted = redacted.replace(/\/(?:home|Users)\/[A-Za-z0-9_-]+/g, "[home]");
  redacted = redacted.replace(/[A-Za-z]:\\Users\\[A-Za-z0-9_-]+/g, "[home]");

  redacted = redacted.replace(/([?&](?:token|key|secret|auth|password|access_token)=)[^&\s]+/gi, "$1[redacted]");

  for (const pattern of SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    redacted = redacted.replace(pattern.regex, "[REDACTED_SECRET]");
  }

  return redacted;
}

export function enforceArtifactPublicationPolicy(
  artifacts: VaultArtifactInput[],
  project: PortfolioProject,
  sourceDigest?: string,
): {
  retainedArtifacts: VaultArtifactInput[];
  purgedArtifacts: VaultArtifactInput[];
} {
  const retainedArtifacts: VaultArtifactInput[] = [];
  const purgedArtifacts: VaultArtifactInput[] = [];

  const screenshotAllowed =
    project.publication.screenshots &&
    project.confidentiality !== "restricted" &&
    project.ownership !== "unknown";

  for (const artifact of artifacts) {
    const isScreenshot = artifact.kind === "screenshot" || /[.]png$/i.test(artifact.path);

    if (isScreenshot) {
      if (screenshotAllowed) {
        retainedArtifacts.push({
          ...artifact,
          evidenceClass: "approved-screenshot",
          policyDecision: "screenshot-opt-in-approved",
          sourceDigest: sourceDigest ?? artifact.sourceDigest,
        });
      } else {
        purgedArtifacts.push({
          ...artifact,
          evidenceClass: "private-raw",
          policyDecision: "screenshot-disabled-by-policy",
          sourceDigest: sourceDigest ?? artifact.sourceDigest,
        });
      }
    } else {
      const isReport = artifact.kind === "report" || /[.](?:json|md|ya?ml)$/i.test(artifact.path);
      const evidenceClass: EvidenceClass = isReport
        ? "redacted-report"
        : artifact.kind === "log"
          ? "private-raw"
          : "private-raw";
      const policyDecision: PolicyDecision = "retained-by-policy";

      retainedArtifacts.push({
        ...artifact,
        evidenceClass,
        policyDecision,
        sourceDigest: sourceDigest ?? artifact.sourceDigest,
      });
    }
  }

  return { retainedArtifacts, purgedArtifacts };
}

export async function deleteProjectEvidence(
  runRoot: string,
  runId: string,
  projectId?: string,
): Promise<{ deletedFiles: number; runId: string; projectId?: string }> {
  const targetDir = projectId
    ? join(resolve(runRoot), runId, projectId)
    : join(resolve(runRoot), runId);

  let deletedFiles = 0;

  const removeEntries = async (directory: string): Promise<void> => {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      if (entry.name === "report.json" && !projectId) {
        continue;
      }
      if (entry.isDirectory()) {
        await removeEntries(fullPath);
        try {
          await rm(fullPath, { recursive: true, force: true });
        } catch {
          // Ignore removal errors for non-empty dirs
        }
      } else if (entry.isFile()) {
        await unlink(fullPath);
        deletedFiles += 1;
      }
    }
  };

  await removeEntries(targetDir);

  if (projectId) {
    try {
      await rm(targetDir, { recursive: true, force: true });
    } catch {
      // Ignore if dir cannot be removed
    }
  }

  return { deletedFiles, runId, projectId };
}
