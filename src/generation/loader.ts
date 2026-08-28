import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import { designPlanSchema, type DesignPlan } from "../design-plan/schema.js";

const MAX_PLAN_BYTES = 8 * 1024 * 1024;

export async function loadDesignPlan(path: string): Promise<DesignPlan> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Design plans must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Design plan path is not a regular file");
  if (fileStats.size > MAX_PLAN_BYTES) {
    throw new Error(`Design plan exceeds ${MAX_PLAN_BYTES} bytes`);
  }
  const content = await readFile(resolvedPath, "utf8");
  const parsed: unknown = extname(resolvedPath).toLowerCase() === ".json" ? JSON.parse(content) : parse(content);
  return designPlanSchema.parse(parsed);
}
