import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import { designDeliverableSchema, type DesignDeliverable } from "./schema.js";

const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;

export async function loadDesignDeliverable(path: string): Promise<DesignDeliverable> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Design deliverable manifests must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Design deliverable path is not a regular file");
  if (fileStats.size > MAX_MANIFEST_BYTES) {
    throw new Error(`Design deliverable manifest exceeds ${MAX_MANIFEST_BYTES} bytes`);
  }
  const text = await readFile(resolvedPath, "utf8");
  const content: unknown = resolvedPath.endsWith(".json") ? JSON.parse(text) : parse(text);
  return designDeliverableSchema.parse(content);
}
