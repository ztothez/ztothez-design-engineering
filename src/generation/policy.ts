import { lstat, realpath, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";

import { isContained, portablePath } from "../portfolio/files.js";
import { inspectPortfolioRegistry } from "../portfolio/registry.js";

export type GenerationTargetOptions = {
  generationRoot: string;
  outputDirectory: string;
  portfolioRegistryPath: string;
};

export type AuthorizedGenerationTarget = {
  generationRoot: string;
  outputDirectory: string;
  outputParent: string;
  portableTarget: string;
};

function pathsOverlap(left: string, right: string): boolean {
  return isContained(left, right) || isContained(right, left);
}

async function requireRealDirectory(path: string, label: string): Promise<string> {
  const lexical = resolve(path);
  const lexicalStats = await lstat(lexical);
  if (lexicalStats.isSymbolicLink()) throw new Error(`${label} cannot be a symbolic link`);
  const canonical = await realpath(lexical);
  if (!(await stat(canonical)).isDirectory()) throw new Error(`${label} must be a directory`);
  return canonical;
}

export async function authorizeGenerationTarget(
  options: GenerationTargetOptions,
): Promise<AuthorizedGenerationTarget> {
  if (!options.portfolioRegistryPath.trim()) {
    throw new Error("A portfolio registry is required before generation");
  }

  const generationRoot = await requireRealDirectory(options.generationRoot, "Generation root");
  const requestedOutput = resolve(options.outputDirectory);
  if (requestedOutput === generationRoot || !isContained(generationRoot, requestedOutput)) {
    throw new Error("Output must be a child of the authorized generation root");
  }

  try {
    await lstat(requestedOutput);
    throw new Error("Output must not already exist; this adapter creates new fixtures only");
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }

  const outputParent = await requireRealDirectory(dirname(requestedOutput), "Output parent");
  if (!isContained(generationRoot, outputParent)) {
    throw new Error("Output parent resolves outside the authorized generation root");
  }
  const outputDirectory = resolve(outputParent, basename(requestedOutput));
  if (!isContained(generationRoot, outputDirectory)) {
    throw new Error("Output resolves outside the authorized generation root");
  }

  const registryPath = resolve(options.portfolioRegistryPath);
  if (!isAbsolute(registryPath)) throw new Error("Portfolio registry resolution failed");
  const inspection = await inspectPortfolioRegistry(registryPath);
  if (!inspection.registry || !inspection.report.passed) {
    throw new Error("Portfolio registry must pass validation before generation");
  }
  for (const root of inspection.roots) {
    if (pathsOverlap(root.canonicalPath, generationRoot) || pathsOverlap(root.canonicalPath, outputDirectory)) {
      throw new Error(`Generation target overlaps read-only portfolio root ${root.declaration.id}`);
    }
  }

  return {
    generationRoot,
    outputDirectory,
    outputParent,
    portableTarget: portablePath(relative(generationRoot, outputDirectory)),
  };
}
