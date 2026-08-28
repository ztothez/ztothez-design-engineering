import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import {
  comparisonMethodologySchema,
  comparisonReviewSchema,
  type ComparisonMethodology,
  type ComparisonReview,
} from "./schema.js";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

async function loadStructuredFile(path: string): Promise<unknown> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Comparison files must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Comparison path is not a regular file");
  if (fileStats.size > MAX_FILE_BYTES) {
    throw new Error(`Comparison file exceeds ${MAX_FILE_BYTES} bytes`);
  }
  const text = await readFile(resolvedPath, "utf8");
  return resolvedPath.endsWith(".json") ? JSON.parse(text) : parse(text);
}

export async function loadComparisonMethodology(path: string): Promise<ComparisonMethodology> {
  return comparisonMethodologySchema.parse(await loadStructuredFile(path));
}

export async function loadComparisonReview(path: string): Promise<ComparisonReview> {
  return comparisonReviewSchema.parse(await loadStructuredFile(path));
}
