import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";

import ts from "typescript";

import { createAuditPolicy } from "./policy.js";
import { sourceRules } from "./rules/index.js";
import type {
  AuditFinding,
  AuditPolicy,
  AuditReport,
  AuditSeverity,
  AuditSkippedFile,
  AuditSourceFile,
} from "./types.js";

const AUDIT_REPORT_VERSION = "1.0.0";

const severityRank: Record<AuditSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

function portablePath(path: string): string {
  return path.split(sep).join("/");
}

function scriptKind(extension: string): ts.ScriptKind | undefined {
  switch (extension) {
    case ".js":
    case ".mjs":
      return ts.ScriptKind.JS;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".ts":
      return ts.ScriptKind.TS;
    case ".tsx":
      return ts.ScriptKind.TSX;
    default:
      return undefined;
  }
}

async function packageScriptFindings(
  rootDirectory: string,
  policy: AuditPolicy,
): Promise<AuditFinding[]> {
  let packageContent: string;
  try {
    packageContent = await readFile(join(rootDirectory, "package.json"), "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  let packageData: unknown;
  try {
    packageData = JSON.parse(packageContent);
  } catch {
    return [
      {
        ruleId: "ZTDE-REPO-001",
        severity: "error",
        confidence: "high",
        file: "package.json",
        message: "package.json is not valid JSON.",
        evidence: ["The repository manifest could not be parsed."],
        remediation: "Repair package.json before running build or verification commands.",
      },
    ];
  }

  const scripts =
    packageData && typeof packageData === "object" && "scripts" in packageData
      ? (packageData.scripts as Record<string, unknown> | undefined)
      : undefined;
  const missingScripts = policy.requiredPackageScripts.filter(
    (name) => typeof scripts?.[name] !== "string" || scripts[name].trim() === "",
  );
  const missingGroups = policy.requiredPackageScriptGroups.filter(
    (group) =>
      !group.some(
        (name) => typeof scripts?.[name] === "string" && scripts[name].trim() !== "",
      ),
  );
  if (missingScripts.length === 0 && missingGroups.length === 0) {
    return [];
  }

  const missingLabels = [
    ...missingScripts,
    ...missingGroups.map((group) => group.join(" or ")),
  ];

  return [
    {
      ruleId: "ZTDE-REPO-001",
      severity: "warning",
      confidence: "high",
      file: "package.json",
      message: `Repository is missing required verification scripts: ${missingLabels.join(", ")}.`,
      evidence: [
        ...missingScripts.map((name) => `Missing npm script: ${name}.`),
        ...missingGroups.map(
          (group) => `Missing verification script alternative: ${group.join(" or ")}.`,
        ),
      ],
      remediation:
        "Add commands that exercise the repository's actual build, static checks, and automated tests, or configure the audit policy for a non-JavaScript project.",
    },
  ];
}

function sortFindings(findings: AuditFinding[]): AuditFinding[] {
  return findings.sort((left, right) => {
    return (
      severityRank[left.severity] - severityRank[right.severity] ||
      left.file.localeCompare(right.file) ||
      (left.line ?? 0) - (right.line ?? 0) ||
      left.ruleId.localeCompare(right.ruleId)
    );
  });
}

export async function auditRepository(
  targetDirectory: string,
  policyOverrides: Partial<AuditPolicy> = {},
): Promise<AuditReport> {
  const policy = createAuditPolicy(policyOverrides);
  const rootDirectory = await realpath(targetDirectory);
  const rootStats = await stat(rootDirectory);
  if (!rootStats.isDirectory()) {
    throw new Error("Audit target must be a directory");
  }

  const findings: AuditFinding[] = await packageScriptFindings(rootDirectory, policy);
  const skippedFiles: AuditSkippedFile[] = [];
  let filesScanned = 0;
  let bytesScanned = 0;
  let scanStopped = false;

  async function scanDirectory(currentDirectory: string): Promise<void> {
    if (scanStopped) {
      return;
    }

    const entries = (await readdir(currentDirectory, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    for (const entry of entries) {
      if (scanStopped) {
        break;
      }

      const absolutePath = join(currentDirectory, entry.name);
      const relativePath = portablePath(relative(rootDirectory, absolutePath));

      if (entry.isSymbolicLink()) {
        skippedFiles.push({ file: relativePath, reason: "symbolic link" });
        continue;
      }

      if (entry.isDirectory()) {
        if (!policy.ignoredDirectories.includes(entry.name)) {
          await scanDirectory(absolutePath);
        }
        continue;
      }

      if (!entry.isFile()) {
        skippedFiles.push({ file: relativePath, reason: "not a regular file" });
        continue;
      }

      const extension = extname(entry.name).toLowerCase();
      if (!policy.sourceExtensions.includes(extension)) {
        continue;
      }

      if (filesScanned >= policy.maxFiles) {
        findings.push({
          ruleId: "ZTDE-SCAN-001",
          severity: "error",
          confidence: "high",
          file: ".",
          message: `Audit stopped after reaching the ${policy.maxFiles}-file limit.`,
          evidence: ["The report does not cover every eligible source file."],
          remediation: "Narrow the audit target or explicitly raise the policy limit.",
        });
        scanStopped = true;
        break;
      }

      const fileStats = await stat(absolutePath);
      if (fileStats.size > policy.maxFileBytes) {
        skippedFiles.push({
          file: relativePath,
          reason: `exceeds ${policy.maxFileBytes}-byte per-file limit`,
        });
        continue;
      }

      if (bytesScanned + fileStats.size > policy.maxTotalBytes) {
        findings.push({
          ruleId: "ZTDE-SCAN-001",
          severity: "error",
          confidence: "high",
          file: relativePath,
          message: `Audit stopped before exceeding the ${policy.maxTotalBytes}-byte total read limit.`,
          evidence: ["The report does not cover every eligible source file."],
          remediation: "Narrow the audit target or explicitly raise the policy limit.",
        });
        scanStopped = true;
        break;
      }

      const content = await readFile(absolutePath, "utf8");
      const kind = scriptKind(extension);
      const auditFile: AuditSourceFile = {
        absolutePath,
        relativePath,
        extension,
        content,
        lines: content.split(/\r?\n/),
        sourceFile:
          kind === undefined
            ? undefined
            : ts.createSourceFile(relativePath, content, ts.ScriptTarget.Latest, true, kind),
      };

      filesScanned += 1;
      bytesScanned += fileStats.size;
      for (const rule of sourceRules) {
        findings.push(...rule.evaluate(auditFile, policy));
      }
    }
  }

  await scanDirectory(rootDirectory);

  const sortedFindings = sortFindings(findings);
  const summary = {
    errors: sortedFindings.filter((finding) => finding.severity === "error").length,
    warnings: sortedFindings.filter((finding) => finding.severity === "warning").length,
    info: sortedFindings.filter((finding) => finding.severity === "info").length,
  };

  return {
    version: AUDIT_REPORT_VERSION,
    target: rootDirectory,
    generatedAt: new Date().toISOString(),
    filesScanned,
    bytesScanned,
    skippedFiles,
    findings: sortedFindings,
    summary,
    passed: summary.errors === 0,
    evidenceBoundary: {
      verifierLimitations: [
        "Static source patterns cannot prove rendered placement, runtime state, backend availability, or whether an interaction succeeds.",
        "Medium-confidence findings require repository-context review before remediation or suppression.",
      ],
      humanReviewRequired: [
        "A qualified reviewer must evaluate domain fit, architectural trade-offs, task coherence, and any accepted static-rule exception.",
      ],
    },
  };
}
