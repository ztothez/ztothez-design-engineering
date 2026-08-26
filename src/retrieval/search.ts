import { readFile, realpath, stat } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";

import { parse } from "yaml";

import {
  knowledgeSearchInputSchema,
  retrievalCategories,
  retrievalScopeSchema,
  type KnowledgeSearchInput,
  type KnowledgeSearchReport,
  type KnowledgeSearchResult,
  type RetrievalCategory,
  type RetrievalScope,
} from "./schema.js";

const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const MAX_CHUNK_CHARACTERS = 1_600;
const MAX_EXCERPT_CHARACTERS = 560;
const BM25_K1 = 1.2;
const BM25_B = 0.75;

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "when",
  "with",
]);

const categoryRoots: Record<RetrievalCategory, string> = {
  skill: "SKILL.md",
  architecture: "knowledge-base/architecture",
  "design-intelligence": "knowledge-base/design-intelligence",
  "figma-and-systems": "knowledge-base/figma-and-systems",
  "ux-patterns": "knowledge-base/ux-patterns",
  "usability-evaluation": "knowledge-base/usability-evaluation",
};

type IndexedChunk = {
  id: number;
  path: string;
  category: RetrievalCategory;
  authority: "authoritative" | "approved";
  title: string;
  section: string;
  text: string;
  normalizedText: string;
  termFrequency: Map<string, number>;
  length: number;
};

export type KnowledgeIndex = {
  version: "1.0";
  authorityPath: "SKILL.md";
  documents: Array<{ path: string; category: RetrievalCategory }>;
  chunks: IndexedChunk[];
};

function isPathContained(baseDirectory: string, candidatePath: string): boolean {
  const relation = relative(baseDirectory, candidatePath);
  return (
    relation === "" ||
    (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation))
  );
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function stem(token: string): string {
  if (token.length > 5 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 6 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 5 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 5 && token.endsWith("sses")) return token.slice(0, -2);
  if (token.length > 5 && /(?:ches|shes|xes|zes|oes)$/.test(token)) {
    return token.slice(0, -2);
  }
  if (
    token.length > 4 &&
    token.endsWith("s") &&
    !token.endsWith("ss") &&
    !token.endsWith("us")
  ) {
    return token.slice(0, -1);
  }
  return token;
}

export function tokenizeForRetrieval(value: string): string[] {
  const lexicalTokens = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*/gu) ?? [];
  const expanded = lexicalTokens.flatMap((token) => {
    const parts = token.split(/[-_]/).filter(Boolean);
    return parts.length > 1 ? [...parts, parts.join("")] : parts;
  });
  return expanded
    .filter((token) => token.length > 1 && !stopWords.has(token))
    .map(stem);
}

function addWeightedTerms(target: Map<string, number>, terms: string[], weight: number): void {
  for (const term of terms) target.set(term, (target.get(term) ?? 0) + weight);
}

function cleanMarkdownText(value: string): string {
  return value
    .replace(/\uE200cite\uE202[^\uE201]*\uE201/gu, " ")
    .replace(/^```[^\n]*$/gm, " ")
    .replace(/[`*_>#|]/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLongParagraph(paragraph: string): string[] {
  if (paragraph.length <= MAX_CHUNK_CHARACTERS) return [paragraph];
  const words = paragraph.split(/\s+/);
  const segments: string[] = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + word.length + 1 > MAX_CHUNK_CHARACTERS) {
      segments.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) segments.push(current);
  return segments;
}

function splitSectionBody(body: string): string[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map(cleanMarkdownText)
    .filter(Boolean)
    .flatMap(splitLongParagraph);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > MAX_CHUNK_CHARACTERS) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function markdownSections(content: string, fallbackTitle: string): Array<{
  title: string;
  section: string;
  text: string;
}> {
  const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  const lines = withoutFrontmatter.split(/\r?\n/);
  const titleLine = lines.find((line) => /^#\s+/.test(line));
  const title = cleanMarkdownText(titleLine?.replace(/^#\s+/, "") ?? fallbackTitle);
  const headingStack: string[] = [];
  const sections: Array<{ title: string; section: string; text: string }> = [];
  let bodyLines: string[] = [];

  const flush = (): void => {
    const body = bodyLines.join("\n");
    const section = headingStack.length > 0 ? headingStack.join(" > ") : title;
    for (const text of splitSectionBody(body)) sections.push({ title, section, text });
    bodyLines = [];
  };

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      bodyLines.push(line);
      continue;
    }
    flush();
    const level = match[1]?.length ?? 1;
    const heading = cleanMarkdownText(match[2] ?? "");
    headingStack.splice(level - 1);
    headingStack[level - 1] = heading;
  }
  flush();
  return sections;
}

function validateScopedPath(category: RetrievalCategory, path: string): void {
  if (path.includes("\0") || isAbsolute(path) || !path.toLowerCase().endsWith(".md")) {
    throw new Error(`Invalid retrieval scope path: ${path}`);
  }
  const normalized = path.split("\\").join("/").replace(/^\.\//, "");
  const requiredRoot = categoryRoots[category];
  const valid =
    category === "skill"
      ? normalized === requiredRoot
      : normalized.startsWith(`${requiredRoot}/`) && !normalized.includes("/../");
  if (!valid) {
    throw new Error(`Retrieval path is outside the ${category} category: ${path}`);
  }
}

async function loadScope(projectRoot: string, scopePath: string): Promise<RetrievalScope> {
  const root = await realpath(projectRoot);
  const resolvedScope = await realpath(resolve(scopePath));
  if (!isPathContained(root, resolvedScope)) {
    throw new Error("Retrieval scope resolves outside the project root");
  }
  const parsed: unknown = parse(await readFile(resolvedScope, "utf8"));
  const scope = retrievalScopeSchema.parse(parsed);
  const seen = new Set<string>();

  for (const category of retrievalCategories) {
    for (const path of scope.categories[category].files) {
      validateScopedPath(category, path);
      if (seen.has(path)) throw new Error(`Duplicate retrieval scope path: ${path}`);
      seen.add(path);
    }
  }
  if (!scope.categories.skill.files.includes(scope.authority)) {
    throw new Error("The authoritative skill must be included in the skill category");
  }
  return scope;
}

export async function buildKnowledgeIndex(
  projectRoot: string,
  scopePath = join(projectRoot, "knowledge-base", "retrieval-scope.yaml"),
): Promise<KnowledgeIndex> {
  const root = await realpath(projectRoot);
  const scope = await loadScope(root, scopePath);
  const documents: KnowledgeIndex["documents"] = [];
  const chunks: IndexedChunk[] = [];

  for (const category of retrievalCategories) {
    for (const sourcePath of scope.categories[category].files) {
      const candidate = resolve(root, sourcePath);
      if (!isPathContained(root, candidate)) {
        throw new Error(`Retrieval source escapes the project root: ${sourcePath}`);
      }
      const resolvedSource = await realpath(candidate);
      if (!isPathContained(root, resolvedSource)) {
        throw new Error(`Retrieval source resolves outside the project root: ${sourcePath}`);
      }
      const sourceStats = await stat(resolvedSource);
      if (!sourceStats.isFile() || sourceStats.size > MAX_SOURCE_BYTES) {
        throw new Error(`Retrieval source is unavailable or exceeds the size limit: ${sourcePath}`);
      }
      const content = await readFile(resolvedSource, "utf8");
      documents.push({ path: sourcePath, category });
      const fallbackTitle = basename(sourcePath, ".md").replace(/[_-]+/g, " ");
      for (const section of markdownSections(content, fallbackTitle)) {
        const bodyTerms = tokenizeForRetrieval(section.text);
        if (bodyTerms.length === 0) continue;
        const termFrequency = new Map<string, number>();
        addWeightedTerms(termFrequency, bodyTerms, 1);
        addWeightedTerms(termFrequency, tokenizeForRetrieval(section.section), 2);
        addWeightedTerms(termFrequency, tokenizeForRetrieval(section.title), 1.5);
        addWeightedTerms(termFrequency, tokenizeForRetrieval(sourcePath), 0.5);
        chunks.push({
          id: chunks.length,
          path: sourcePath,
          category,
          authority: sourcePath === scope.authority ? "authoritative" : "approved",
          title: section.title,
          section: section.section,
          text: section.text,
          normalizedText: normalizeText(
            `${section.title} ${section.section} ${section.text}`,
          ),
          termFrequency,
          length: bodyTerms.length,
        });
      }
    }
  }

  return {
    version: scope.version,
    authorityPath: scope.authority,
    documents,
    chunks,
  };
}

function makeExcerpt(text: string, query: string): string {
  const clean = cleanMarkdownText(text);
  if (clean.length <= MAX_EXCERPT_CHARACTERS) return clean;
  const queryWords = normalizeText(query).split(" ").filter((word) => word.length > 1);
  const lower = clean.toLowerCase();
  const positions = queryWords
    .map((word) => lower.indexOf(word))
    .filter((position) => position >= 0);
  const matchPosition = positions.length > 0 ? Math.min(...positions) : 0;
  let start = Math.max(0, matchPosition - Math.floor(MAX_EXCERPT_CHARACTERS / 3));
  let end = Math.min(clean.length, start + MAX_EXCERPT_CHARACTERS);
  if (end === clean.length) start = Math.max(0, end - MAX_EXCERPT_CHARACTERS);
  if (start > 0) {
    const nextSpace = clean.indexOf(" ", start);
    if (nextSpace >= 0 && nextSpace < end) start = nextSpace + 1;
  }
  if (end < clean.length) {
    const previousSpace = clean.lastIndexOf(" ", end);
    if (previousSpace > start) end = previousSpace;
  }
  return `${start > 0 ? "..." : ""}${clean.slice(start, end).trim()}${end < clean.length ? "..." : ""}`;
}

function confidenceFor(
  queryTermCount: number,
  matchedTermCount: number,
  exactPhrase: boolean,
): KnowledgeSearchResult["confidence"] {
  const coverage = matchedTermCount / queryTermCount;
  if (exactPhrase || (queryTermCount >= 2 && coverage === 1)) return "high";
  if (coverage >= 0.5 || queryTermCount === 1) return "medium";
  return "low";
}

export function searchKnowledge(
  index: KnowledgeIndex,
  input: KnowledgeSearchInput,
): KnowledgeSearchReport {
  const options = knowledgeSearchInputSchema.parse(input);
  const categories = options.categories ?? [...retrievalCategories];
  const selectedCategories = new Set(categories);
  const selectedChunks = index.chunks.filter((chunk) => selectedCategories.has(chunk.category));
  const selectedDocuments = index.documents.filter((document) =>
    selectedCategories.has(document.category),
  );
  const queryTerms = [...new Set(tokenizeForRetrieval(options.query))];
  const stats = {
    documentsSearched: selectedDocuments.length,
    chunksSearched: selectedChunks.length,
    searchableTerms: queryTerms,
  };

  if (queryTerms.length === 0) {
    return {
      version: "1.0",
      query: options.query,
      categories,
      authorityPath: index.authorityPath,
      status: "no-match",
      message: "The query contains no searchable terms after normalization.",
      results: [],
      stats,
    };
  }

  const documentFrequency = new Map<string, number>();
  for (const term of queryTerms) {
    documentFrequency.set(
      term,
      selectedChunks.reduce(
        (count, chunk) => count + (chunk.termFrequency.has(term) ? 1 : 0),
        0,
      ),
    );
  }
  const averageLength =
    selectedChunks.length > 0
      ? selectedChunks.reduce((total, chunk) => total + chunk.length, 0) /
        selectedChunks.length
      : 1;
  const normalizedPhrase = normalizeText(options.query);

  const scored = selectedChunks
    .map((chunk) => {
      const matchedTerms = queryTerms.filter((term) => chunk.termFrequency.has(term));
      if (matchedTerms.length === 0) return undefined;
      let score = 0;
      for (const term of matchedTerms) {
        const frequency = chunk.termFrequency.get(term) ?? 0;
        const containingChunks = documentFrequency.get(term) ?? 0;
        const inverseDocumentFrequency = Math.log(
          1 + (selectedChunks.length - containingChunks + 0.5) / (containingChunks + 0.5),
        );
        const lengthNormalization =
          frequency +
          BM25_K1 * (1 - BM25_B + BM25_B * (chunk.length / Math.max(averageLength, 1)));
        score += inverseDocumentFrequency * ((frequency * (BM25_K1 + 1)) / lengthNormalization);
      }
      const exactPhrase = normalizedPhrase.length > 2 && chunk.normalizedText.includes(normalizedPhrase);
      if (exactPhrase) score *= 1.35;
      const titleTerms = new Set(tokenizeForRetrieval(chunk.title));
      const titleMatches = matchedTerms.filter((term) => titleTerms.has(term)).length;
      if (titleMatches > 0) score *= 1 + 0.4 * Math.min(titleMatches / 2, 1);
      if (chunk.authority === "authoritative") score *= 1.12;
      return {
        chunk,
        matchedTerms,
        exactPhrase,
        score,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== undefined)
    .sort(
      (left, right) =>
        right.score - left.score ||
        Number(right.chunk.authority === "authoritative") -
          Number(left.chunk.authority === "authoritative") ||
        left.chunk.path.localeCompare(right.chunk.path) ||
        left.chunk.section.localeCompare(right.chunk.section) ||
        left.chunk.id - right.chunk.id,
    );

  const limit = options.limit ?? 5;
  const sourceCounts = new Map<string, number>();
  const selected = scored.filter((candidate) => {
    const count = sourceCounts.get(candidate.chunk.path) ?? 0;
    if (count >= 2) return false;
    sourceCounts.set(candidate.chunk.path, count + 1);
    return true;
  }).slice(0, limit);

  if (selected.length === 0) {
    return {
      version: "1.0",
      query: options.query,
      categories,
      authorityPath: index.authorityPath,
      status: "no-match",
      message: "No approved knowledge source contains the normalized query terms.",
      results: [],
      stats,
    };
  }

  const results: KnowledgeSearchResult[] = selected.map((candidate, resultIndex) => ({
    rank: resultIndex + 1,
    path: candidate.chunk.path,
    category: candidate.chunk.category,
    authority: candidate.chunk.authority,
    title: candidate.chunk.title,
    section: candidate.chunk.section,
    excerpt: makeExcerpt(candidate.chunk.text, options.query),
    score: Number(candidate.score.toFixed(6)),
    confidence: confidenceFor(
      queryTerms.length,
      candidate.matchedTerms.length,
      candidate.exactPhrase,
    ),
    matchedTerms: candidate.matchedTerms,
  }));

  return {
    version: "1.0",
    query: options.query,
    categories,
    authorityPath: index.authorityPath,
    status: "matches",
    message: `Found ${results.length} ranked result${results.length === 1 ? "" : "s"} in the approved retrieval scope.`,
    results,
    stats,
  };
}
