import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import { interfaceTrustContractSchema, type InterfaceTrustContract } from "./schema.js";

const MAX_CONTRACT_BYTES = 2 * 1024 * 1024;

export async function loadInterfaceTrustContract(path: string): Promise<InterfaceTrustContract> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Interface trust contracts must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Interface trust contract path is not a regular file");
  if (fileStats.size > MAX_CONTRACT_BYTES) {
    throw new Error(`Interface trust contract exceeds ${MAX_CONTRACT_BYTES} bytes`);
  }
  const text = await readFile(resolvedPath, "utf8");
  const content: unknown = resolvedPath.endsWith(".json") ? JSON.parse(text) : parse(text);
  return interfaceTrustContractSchema.parse(content);
}
