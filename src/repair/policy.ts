import { lstat, realpath, stat } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";

import { generationManifestSchema, type GenerationManifest } from "../generation/schema.js";
import { isContained, portablePath } from "../portfolio/files.js";
import { inspectPortfolioRegistry } from "../portfolio/registry.js";
import { readFile } from "node:fs/promises";

export type RepairTargetOptions = {
  generationRoot: string;
  targetDirectory: string;
  portfolioRegistryPath: string;
  manifestPath: string;
};

export type AuthorizedRepairTarget = {
  generationRoot: string;
  targetDirectory: string;
  portableTarget: string;
  manifest: GenerationManifest;
  manifestPath: string;
};

async function requireRealDirectory(path: string, label: string): Promise<string> {
  const lexical = resolve(path);
  const lexicalStats = await lstat(lexical);
  if (lexicalStats.isSymbolicLink()) throw new Error(`${label} cannot be a symbolic link`);
  const canonical = await realpath(lexical);
  if (!(await stat(canonical)).isDirectory()) throw new Error(`${label} must be a directory`);
  return canonical;
}

export async function authorizeRepairTarget(
  options: RepairTargetOptions,
): Promise<AuthorizedRepairTarget> {
  const generationRoot = await requireRealDirectory(options.generationRoot, "Generation root");
  const targetDirectory = await requireRealDirectory(options.targetDirectory, "Repair target");
  if (targetDirectory === generationRoot || !isContained(generationRoot, targetDirectory)) {
    throw new Error("Repair target must be a child of the authorized generation root");
  }

  const registryInspection = await inspectPortfolioRegistry(resolve(options.portfolioRegistryPath));
  if (!registryInspection.registry || !registryInspection.report.passed) {
    throw new Error("Portfolio registry must pass validation before repair");
  }
  for (const root of registryInspection.roots) {
    if (isContained(root.canonicalPath, targetDirectory) || isContained(targetDirectory, root.canonicalPath)) {
      throw new Error(`Repair target overlaps read-only portfolio root ${root.declaration.id}`);
    }
  }

  const requestedManifest = resolve(targetDirectory, options.manifestPath);
  if (!isContained(targetDirectory, requestedManifest)) {
    throw new Error("Generation manifest resolves outside the repair target");
  }
  const manifestStats = await lstat(requestedManifest);
  if (manifestStats.isSymbolicLink() || !manifestStats.isFile()) {
    throw new Error("Generation manifest must be a regular non-symbolic file");
  }
  const manifestCanonical = await realpath(requestedManifest);
  if (!isContained(targetDirectory, manifestCanonical)) {
    throw new Error("Generation manifest escapes the repair target");
  }
  const manifest = generationManifestSchema.parse(
    JSON.parse(await readFile(manifestCanonical, "utf8")),
  );

  return {
    generationRoot,
    targetDirectory,
    portableTarget: portablePath(relative(generationRoot, targetDirectory)) || basename(targetDirectory),
    manifest,
    manifestPath: manifestCanonical,
  };
}

export function requireLoopbackUrl(value: string): string {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (!(["127.0.0.1", "localhost", "::1"].includes(hostname))) {
    throw new Error("Repair verification URL must use a loopback host");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Repair verification URL must use HTTP or HTTPS");
  }
  url.hash = "";
  return url.toString();
}
