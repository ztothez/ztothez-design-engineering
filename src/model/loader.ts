import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { designEngineeringModelSchema, type DesignEngineeringModel } from "./schema.js";

function isContained(baseDirectory: string, candidatePath: string): boolean {
  const relation = relative(baseDirectory, candidatePath);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

export async function loadDesignEngineeringModel(
  modelPath = "model/ztothez-design-engineering-model.json",
  projectRoot = process.cwd(),
): Promise<DesignEngineeringModel> {
  if (modelPath.includes("\0")) throw new Error("Model path contains an invalid null byte");
  if (isAbsolute(modelPath)) throw new Error("Model path must be repository-relative");

  const root = await realpath(projectRoot);
  const resolvedPath = resolve(root, modelPath);
  if (!isContained(root, resolvedPath)) throw new Error("Model path escapes the project root");

  const resolvedRealPath = await realpath(resolvedPath);
  if (!isContained(root, resolvedRealPath)) throw new Error("Model path resolves outside the project root");

  const stats = await stat(resolvedRealPath);
  if (!stats.isFile()) throw new Error("Model path is not a regular file");

  return designEngineeringModelSchema.parse(JSON.parse(await readFile(resolvedRealPath, "utf8")));
}
