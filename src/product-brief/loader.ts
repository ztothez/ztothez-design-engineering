import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import { productDesignBriefSchema, type ProductDesignBrief } from "./schema.js";

const MAX_BRIEF_BYTES = 2 * 1024 * 1024;

export async function loadProductDesignBrief(path: string): Promise<ProductDesignBrief> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Product design briefs must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Product design brief path is not a regular file");
  if (fileStats.size > MAX_BRIEF_BYTES) {
    throw new Error(`Product design brief exceeds ${MAX_BRIEF_BYTES} bytes`);
  }
  const content = await readFile(resolvedPath, "utf8");
  const parsed: unknown = resolvedPath.endsWith(".json") ? JSON.parse(content) : parse(content);
  return productDesignBriefSchema.parse(parsed);
}
