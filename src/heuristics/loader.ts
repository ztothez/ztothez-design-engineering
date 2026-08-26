import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import { heuristicReviewSchema, type HeuristicReview } from "./schema.js";

const MAX_REVIEW_BYTES = 1024 * 1024;

export async function loadHeuristicReview(path: string): Promise<HeuristicReview> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Heuristic reviews must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Heuristic review path is not a regular file");
  if (fileStats.size > MAX_REVIEW_BYTES) {
    throw new Error(`Heuristic review exceeds ${MAX_REVIEW_BYTES} bytes`);
  }
  const text = await readFile(resolvedPath, "utf8");
  const content: unknown = resolvedPath.endsWith(".json") ? JSON.parse(text) : parse(text);
  return heuristicReviewSchema.parse(content);
}
