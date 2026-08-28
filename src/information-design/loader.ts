import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import { informationDesignContractSchema, type InformationDesignContract } from "./schema.js";

const MAX_CONTRACT_BYTES = 2 * 1024 * 1024;

export async function loadInformationDesignContract(path: string): Promise<InformationDesignContract> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Information-design contracts must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Information-design contract path is not a regular file");
  if (fileStats.size > MAX_CONTRACT_BYTES) {
    throw new Error(`Information-design contract exceeds ${MAX_CONTRACT_BYTES} bytes`);
  }
  const text = await readFile(resolvedPath, "utf8");
  const content: unknown = resolvedPath.endsWith(".json") ? JSON.parse(text) : parse(text);
  return informationDesignContractSchema.parse(content);
}
