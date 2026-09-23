import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { v5MigrationReportSchema, type AnyV5MigrationReport } from "./schema.js";

export async function loadV5MigrationReport(
  requestedPath: string,
  allowedRoot = process.cwd(),
): Promise<AnyV5MigrationReport> {
  const root = await realpath(resolve(allowedRoot));
  const candidate = resolve(root, requestedPath);
  const relation = relative(root, candidate);
  if (isAbsolute(relation) || relation === ".." || relation.startsWith(`..${sep}`)) {
    throw new Error(`Migration report escapes the allowed root: ${requestedPath}`);
  }
  const actual = await realpath(candidate);
  const actualRelation = relative(root, actual);
  if (isAbsolute(actualRelation) || actualRelation === ".." || actualRelation.startsWith(`..${sep}`)) {
    throw new Error(`Migration report resolves outside the allowed root: ${requestedPath}`);
  }
  const value: unknown = JSON.parse(await readFile(actual, "utf8"));
  return v5MigrationReportSchema.parse(value);
}
