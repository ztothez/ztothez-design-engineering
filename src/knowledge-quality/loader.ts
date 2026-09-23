import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { parse } from "yaml";

import { knowledgeQualityManifestSchema, type KnowledgeQualityManifest } from "./schema.js";

function isContained(baseDirectory: string, candidatePath: string): boolean {
  const relation = relative(baseDirectory, candidatePath);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

export async function loadKnowledgeQualityManifest(
  manifestPath = "knowledge-base/benchmarks/knowledge-quality/knowledge-quality.yaml",
  projectRoot = process.cwd(),
): Promise<KnowledgeQualityManifest> {
  if (manifestPath.includes("\0")) {
    throw new Error("Knowledge-quality manifest path must be repository-relative");
  }
  const root = await realpath(projectRoot);
  const resolved = isAbsolute(manifestPath) ? manifestPath : resolve(root, manifestPath);
  if (!isContained(root, resolved)) throw new Error("Knowledge-quality manifest escapes the project root");
  const real = await realpath(resolved);
  if (!isContained(root, real)) throw new Error("Knowledge-quality manifest resolves outside the project root");
  const stats = await stat(real);
  if (!stats.isFile()) throw new Error("Knowledge-quality manifest path is not a regular file");
  return knowledgeQualityManifestSchema.parse(parse(await readFile(real, "utf8")));
}
