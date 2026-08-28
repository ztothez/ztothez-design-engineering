import { isAbsolute, matchesGlob, relative, sep } from "node:path";

export const DEFAULT_PRUNED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".output",
  ".svelte-kit",
  ".turbo",
  ".venv",
  "__pycache__",
  "build",
  "coverage",
  "data",
  "dist",
  "models",
  "node_modules",
  "playwright-report",
  "test-results",
  "uploads",
  "venv",
  "vendor",
]);

const PROHIBITED_FILE_PATTERNS = [
  ".env",
  ".env.*",
  "**/.env",
  "**/.env.*",
  "*.db",
  "**/*.db",
  "*.sqlite",
  "**/*.sqlite",
  "*.sqlite3",
  "**/*.sqlite3",
  "*.pem",
  "**/*.pem",
  "*.key",
  "**/*.key",
  "*.p12",
  "**/*.p12",
  "*.pfx",
  "**/*.pfx",
  "id_rsa",
  "**/id_rsa",
  "credentials.json",
  "**/credentials.json",
  "service-account.json",
  "**/service-account.json",
  "*.zip",
  "**/*.zip",
  "*.tar",
  "**/*.tar",
  "*.tgz",
  "**/*.tgz",
];

export function portablePath(path: string): string {
  return path.split(sep).join("/");
}

export function isContained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

export function matchesAny(path: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => matchesGlob(path, pattern));
}

export function isProhibitedFile(path: string): boolean {
  return matchesAny(path, PROHIBITED_FILE_PATTERNS);
}

export function containsPrunedDirectory(path: string): boolean {
  return path.split("/").some((segment) => DEFAULT_PRUNED_DIRECTORIES.has(segment));
}

export function isCustomExcluded(path: string, patterns: readonly string[]): boolean {
  return matchesAny(path, patterns);
}

export function isIncluded(path: string, patterns: readonly string[]): boolean {
  return matchesAny(path, patterns);
}
