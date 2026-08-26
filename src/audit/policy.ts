import type { AuditPolicy } from "./types.js";

export const DEFAULT_AUDIT_POLICY: AuditPolicy = {
  componentLineWarning: 400,
  mixedResponsibilitiesMinLines: 200,
  rawColorWarningCount: 3,
  maxFiles: 5_000,
  maxFileBytes: 2 * 1024 * 1024,
  maxTotalBytes: 50 * 1024 * 1024,
  ignoredDirectories: [
    ".git",
    ".next",
    ".nuxt",
    ".output",
    ".svelte-kit",
    ".turbo",
    ".vercel",
    "build",
    "coverage",
    "dist",
    "archive",
    "archives",
    "backups",
    "knowledge-base",
    "legacy",
    "legacy-sources",
    "node_modules",
    "public",
    "vendor",
    "venv",
    ".venv",
  ],
  sourceExtensions: [".css", ".js", ".jsx", ".mjs", ".ts", ".tsx"],
  requiredPackageScripts: ["build", "test"],
  requiredPackageScriptGroups: [["lint", "typecheck"]],
};

export function createAuditPolicy(overrides: Partial<AuditPolicy> = {}): AuditPolicy {
  return {
    ...DEFAULT_AUDIT_POLICY,
    ...overrides,
    ignoredDirectories:
      overrides.ignoredDirectories ?? DEFAULT_AUDIT_POLICY.ignoredDirectories,
    sourceExtensions: overrides.sourceExtensions ?? DEFAULT_AUDIT_POLICY.sourceExtensions,
    requiredPackageScripts:
      overrides.requiredPackageScripts ?? DEFAULT_AUDIT_POLICY.requiredPackageScripts,
    requiredPackageScriptGroups:
      overrides.requiredPackageScriptGroups ??
      DEFAULT_AUDIT_POLICY.requiredPackageScriptGroups,
  };
}
