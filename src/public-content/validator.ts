import { spawnSync } from "node:child_process";
import { readFile, readdir, lstat } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

import { publicContentPolicySchema, publicContentReportSchema, type PublicContentPolicy, type PublicContentReport } from "./schema.js";

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const EXCLUDED_FALLBACK_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist-test",
  ".ztothez-design-runtime",
  ".ztothez-design-local",
  ".ztothez-design-release",
  ".ztothez-design-source-removal",
]);

type Finding = PublicContentReport["findings"][number];

function portable(path: string): string {
  return path.split("\\").join("/");
}

function addFinding(
  findings: Finding[],
  ruleId: string,
  path: string,
  policy: string,
  message: string,
  remediation: string,
): void {
  findings.push({ ruleId, severity: "error", path, policy, message, remediation });
}

async function readPolicy(root: string, policyPath?: string): Promise<PublicContentPolicy> {
  const path = policyPath ? resolve(root, policyPath) : join(root, "governance", "public-content-policy.json");
  const resolvedRoot = resolve(root);
  if (!path.startsWith(`${resolvedRoot}/`) && path !== resolvedRoot) {
    throw new Error("Public content policy path escapes the project root.");
  }
  return publicContentPolicySchema.parse(JSON.parse(await readFile(path, "utf8")));
}

function listGitTrackedFiles(root: string): string[] | null {
  const result = spawnSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.split("\0").filter(Boolean).map(portable).sort();
}

async function listFilesystemFiles(root: string, directory = root): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory() && EXCLUDED_FALLBACK_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFilesystemFiles(root, path)));
    else if (entry.isFile()) files.push(portable(relative(root, path)));
  }
  return files.sort();
}

function isApprovedPublicPath(path: string, policy: PublicContentPolicy): boolean {
  return policy.approvedRootFiles.includes(path) || policy.approvedPublicRoots.some((root) => path.startsWith(root));
}

function evidenceRuleFor(path: string, policy: PublicContentPolicy) {
  return policy.evidenceRules.find((rule) => path.startsWith(rule.pathPrefix));
}

function isEvidencePath(path: string): boolean {
  return path.startsWith("evidence/")
    || /^knowledge-base\/benchmarks\//.test(path);
}

function isHumanFeedbackPath(path: string): boolean {
  return /(?:^|\/)(?:human|review|attestation|session|qualitative|feedback)/i.test(path);
}

function hasPrivateMachinePath(text: string): boolean {
  return /(?:^|[\s"'`(])\/home\/(?:ztothez|ztotvoxq|claude|runner)\b/i.test(text)
    || /(?:^|[\s"'`(])\/mnt\/user-data\b/i.test(text)
    || /\b[A-Za-z]:\\Users\\(?!user\\)[^\\\s"'`)]+/i.test(text);
}

function hasSecretLikeValue(text: string): boolean {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)
    || /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/.test(text)
    || /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/.test(text)
    || /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/.test(text);
}

function hasRawConversationIdentifier(text: string): boolean {
  return /(?:^|\n)\s*\d{1,2}:\d{2}\s+[A-Za-z0-9_.-]{3,}\b/.test(text)
    || /(?:^|\n)\s*<[@#][A-Za-z0-9_.:-]+>/.test(text)
    || /\b(?:discord|telegram|signal|whatsapp)\s*(?:handle|username|id)\s*[:=]/i.test(text);
}

function hasContactDetail(text: string): boolean {
  return /\b[A-Z0-9._%+-]+@(?!users\.noreply\.github\.com\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)
    || /\b(?:tel|phone|mobile)\s*[:=]\s*\+?\d[\d\s().-]{6,}\b/i.test(text);
}

export async function validatePublicContent(options: {
  root?: string;
  policyPath?: string;
} = {}): Promise<PublicContentReport> {
  const root = resolve(options.root ?? process.cwd());
  const policy = await readPolicy(root, options.policyPath);
  const gitFiles = policy.policy.scanTrackedFiles ? listGitTrackedFiles(root) : null;
  const files = gitFiles ?? await listFilesystemFiles(root);
  const findings: Finding[] = [];
  let evidenceFiles = 0;
  let classifiedEvidenceFiles = 0;

  for (const path of files) {
    if (!isApprovedPublicPath(path, policy)) {
      addFinding(
        findings,
        "ZTDE-PUBLIC-101",
        path,
        "approved-public-roots",
        "Tracked public file is outside the approved public roots.",
        "Move it to an approved root, classify it in policy, or keep it outside Git.",
      );
    }
    const blocked = policy.blockedPathPrefixes.find((prefix) => path.startsWith(prefix));
    if (blocked) {
      addFinding(
        findings,
        "ZTDE-PUBLIC-102",
        path,
        "blocked-path-prefixes",
        "Tracked public file is under a private, archived, or superseded source boundary.",
        "Remove the file from Git tracking or replace it with an admitted maintained artifact.",
      );
    }

    const stats = await lstat(join(root, path));
    if (stats.isSymbolicLink()) {
      addFinding(
        findings,
        "ZTDE-PUBLIC-103",
        path,
        "symlink-boundary",
        "Tracked symlinks are not allowed in the public content boundary.",
        "Replace the symlink with a regular reviewed file or remove it from Git.",
      );
      continue;
    }

    const evidenceRule = evidenceRuleFor(path, policy);
    if (isEvidencePath(path)) {
      evidenceFiles += 1;
      if (
        evidenceRule
        && evidenceRule.publicationDecision === "approved-public"
        && evidenceRule.personalDataReviewed
      ) {
        classifiedEvidenceFiles += 1;
      } else if (policy.policy.failClosedOnUnclassifiedEvidence) {
        addFinding(
          findings,
          "ZTDE-PUBLIC-301",
          path,
          "evidence-classification",
          "Public evidence file lacks an approved privacy classification and publication decision.",
          "Add an explicit reviewed evidence rule or keep the evidence outside Git.",
        );
      }
    }

    if (!TEXT_EXTENSIONS.has(extname(path).toLowerCase()) || stats.size > 1024 * 1024) continue;
    const text = await readFile(join(root, path), "utf8");
    if (hasSecretLikeValue(text)) {
      addFinding(
        findings,
        "ZTDE-PUBLIC-201",
        path,
        "secret-redaction",
        "File contains secret-like material. The matched value is intentionally not reproduced.",
        "Remove the value, rotate it if real, and keep the original outside Git.",
      );
    }
    if (hasPrivateMachinePath(text)) {
      addFinding(
        findings,
        "ZTDE-PUBLIC-202",
        path,
        "machine-path-redaction",
        "File contains a private machine path. The matched value is intentionally not reproduced.",
        "Replace it with a portable placeholder or keep the file outside Git.",
      );
    }
    if ((isEvidencePath(path) || isHumanFeedbackPath(path)) && hasRawConversationIdentifier(text)) {
      addFinding(
        findings,
        "ZTDE-PUBLIC-401",
        path,
        "human-feedback-privacy",
        "Human-feedback content appears to contain raw conversation identifiers.",
        "Replace raw logs with stable anonymous labels or retain explicit publication consent outside Git.",
      );
    }
    if ((isEvidencePath(path) || isHumanFeedbackPath(path)) && hasContactDetail(text)) {
      addFinding(
        findings,
        "ZTDE-PUBLIC-402",
        path,
        "human-feedback-privacy",
        "Human-feedback content appears to contain contact details.",
        "Remove contact details from public evidence or retain the file outside Git.",
      );
    }
  }

  return publicContentReportSchema.parse({
    version: "1.0",
    policyId: policy.id,
    status: findings.length > 0 ? "fail" : "pass",
    scannedMode: gitFiles ? "git-tracked" : "filesystem",
    filesScanned: files.length,
    evidenceFiles,
    classifiedEvidenceFiles,
    findingCount: findings.length,
    findings,
  });
}
