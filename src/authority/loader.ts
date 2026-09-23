import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { compiledAuthoritySchema, type CompiledAuthority } from "./schema.js";

function isPathContained(baseDirectory: string, candidatePath: string): boolean {
  const relation = relative(baseDirectory, candidatePath);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

export async function loadCompiledAuthority(
  authorityPath = "model/compiled-authority.json",
  projectRoot = process.cwd(),
): Promise<CompiledAuthority> {
  if (authorityPath.includes("\0")) throw new Error("Compiled authority path contains an invalid null byte");
  if (isAbsolute(authorityPath)) throw new Error("Compiled authority path must be repository-relative");

  const root = await realpath(projectRoot);
  const candidate = resolve(root, authorityPath);
  if (!isPathContained(root, candidate)) {
    throw new Error("Compiled authority path escapes the project root");
  }

  const resolvedPath = await realpath(candidate);
  if (!isPathContained(root, resolvedPath)) {
    throw new Error("Compiled authority path resolves outside the project root");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) {
    throw new Error("Compiled authority path is not a regular file");
  }

  return compiledAuthoritySchema.parse(JSON.parse(await readFile(resolvedPath, "utf8")));
}
