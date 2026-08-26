import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { parse } from "yaml";

import { acceptanceAttestationFileSchema } from "./schema.js";
import type { AcceptanceAttestationFile } from "./types.js";

const MAX_ATTESTATION_BYTES = 1024 * 1024;

export async function loadAcceptanceAttestations(path: string): Promise<AcceptanceAttestationFile> {
  const resolvedPath = resolve(path);
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Attestation path is not a regular file");
  if (fileStats.size > MAX_ATTESTATION_BYTES) {
    throw new Error(`Attestation file exceeds ${MAX_ATTESTATION_BYTES} bytes`);
  }
  const text = await readFile(resolvedPath, "utf8");
  const content: unknown = resolvedPath.endsWith(".json") ? JSON.parse(text) : parse(text);
  return acceptanceAttestationFileSchema.parse(content);
}
