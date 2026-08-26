import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { parse } from "yaml";

import { corpusManifestSchema, type CorpusManifest } from "./schema.js";

const MAX_CORPUS_BYTES = 2 * 1024 * 1024;

export async function loadCorpusManifest(path: string): Promise<CorpusManifest> {
  const resolvedPath = resolve(path);
  if (!/^\.(?:json|ya?ml)$/i.test(extname(resolvedPath))) {
    throw new Error("Corpus manifests must end in .json, .yaml, or .yml");
  }
  const fileStats = await stat(resolvedPath);
  if (!fileStats.isFile()) throw new Error("Corpus manifest path is not a regular file");
  if (fileStats.size > MAX_CORPUS_BYTES) {
    throw new Error(`Corpus manifest exceeds ${MAX_CORPUS_BYTES} bytes`);
  }
  const content = await readFile(resolvedPath, "utf8");
  return corpusManifestSchema.parse(
    extname(resolvedPath).toLowerCase() === ".json" ? JSON.parse(content) : parse(content),
  );
}
