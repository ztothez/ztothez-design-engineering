import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import { portfolioRegistrySchema, type PortfolioRegistry } from "./schema.js";

const MAX_REGISTRY_BYTES = 2 * 1024 * 1024;

export async function loadPortfolioRegistry(path: string): Promise<PortfolioRegistry> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Portfolio registries must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Portfolio registry path is not a regular file");
  if (fileStats.size > MAX_REGISTRY_BYTES) {
    throw new Error(`Portfolio registry exceeds ${MAX_REGISTRY_BYTES} bytes`);
  }
  const content = await readFile(resolvedPath, "utf8");
  const parsed = extname(resolvedPath).toLowerCase() === ".json" ? JSON.parse(content) : parse(content);
  return portfolioRegistrySchema.parse(parsed);
}
