import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import {
  buildKnowledgeIndex,
  searchKnowledge,
  tokenizeForRetrieval,
} from "../src/retrieval/search.js";

test("retrieval indexes only the explicit approved distributable scope", async () => {
  const index = await buildKnowledgeIndex(process.cwd());

  assert.equal(index.authorityPath, "SKILL.md");
  assert.equal(index.documents.length, 23);
  assert.ok(index.chunks.length > 100);
  assert.equal(new Set(index.documents.map((document) => document.path)).size, 23);
  assert.ok(index.documents.some((document) => document.path === "SKILL.md"));
  assert.equal(
    index.documents.some((document) => document.path.includes("legacy-sources")),
    false,
  );
  assert.equal(
    index.documents.some((document) => document.path.endsWith("designingsearch.md")),
    false,
  );
  assert.equal(
    index.documents.some((document) => document.path.includes("usability-evaluation/sources")),
    false,
  );
});

test("BM25 retrieval is deterministic, category scoped, and authority aware", async () => {
  const index = await buildKnowledgeIndex(process.cwd());
  const architectureInput = {
    query: "ATAM utility tree sensitivity trade-off points",
    categories: ["architecture" as const],
    limit: 4,
  };
  const first = searchKnowledge(index, architectureInput);
  const second = searchKnowledge(index, architectureInput);

  assert.deepEqual(second, first);
  assert.equal(first.status, "matches");
  assert.equal(
    first.results[0]?.path,
    "knowledge-base/maintained/architecture/quality-attributes-and-evaluation.md",
  );
  assert.equal(first.results[0]?.confidence, "high");
  assert.ok(first.results.every((result) => result.category === "architecture"));
  assert.ok(first.results.every((result) => result.excerpt.length <= 566));

  const tokens = tokenizeForRetrieval("component states and trade-off points");
  assert.ok(tokens.includes("component"));
  assert.ok(tokens.includes("state"));
  assert.ok(tokens.includes("tradeoff"));

  const authoritative = searchKnowledge(index, {
    query: "semantic design tokens component states",
    limit: 3,
  });
  assert.equal(authoritative.results[0]?.path, "SKILL.md");
  assert.equal(authoritative.results[0]?.authority, "authoritative");
});

test("retrieval returns explicit no-match results without archive fallback", async () => {
  const index = await buildKnowledgeIndex(process.cwd());
  const unknown = searchKnowledge(index, {
    query: "xyzzynonexistentknowledge",
    limit: 5,
  });

  assert.equal(unknown.status, "no-match");
  assert.deepEqual(unknown.results, []);
  assert.match(unknown.message, /No approved knowledge source/);

  const stopWordsOnly = searchKnowledge(index, { query: "the and of" });
  assert.equal(stopWordsOnly.status, "no-match");
  assert.deepEqual(stopWordsOnly.stats.searchableTerms, []);

  const unrelated = searchKnowledge(index, {
    query: "cryogenic turbine bearing alloy phase diagram zxqv",
    categories: ["design-intelligence"],
  });
  assert.equal(unrelated.status, "no-match");
  assert.deepEqual(unrelated.results, []);
});

test("retrieval evaluation cases preserve relevance and abstention", async () => {
  const fixture = parseRetrievalCases(
    await readFile(join(process.cwd(), "tests", "fixtures", "retrieval-cases.yaml"), "utf8"),
  );
  const index = await buildKnowledgeIndex(process.cwd());

  for (const evaluation of fixture.cases) {
    const report = searchKnowledge(index, {
      query: evaluation.query,
      ...(evaluation.categories ? { categories: evaluation.categories } : {}),
      limit: 5,
    });
    assert.equal(report.status, evaluation.expectedStatus, evaluation.id);
    if (evaluation.expectedPath) {
      const result = report.results.find((entry) => entry.path === evaluation.expectedPath);
      assert.ok(result, `${evaluation.id}: expected ${evaluation.expectedPath}`);
      assert.ok(
        result.rank <= (evaluation.maxRank ?? 5),
        `${evaluation.id}: expected rank <= ${evaluation.maxRank}, received ${result.rank}`,
      );
    } else {
      assert.deepEqual(report.results, [], evaluation.id);
    }
  }
});

test("retrieval scope rejects category escape paths", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "ztothez-design-retrieval-scope-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const scopePath = join(directory, "retrieval-scope.yaml");
  await writeFile(
    scopePath,
    stringify({
      version: "1.0",
      authority: "SKILL.md",
      categories: {
        skill: { label: "Skill", files: ["SKILL.md"] },
        architecture: {
          label: "Architecture",
          files: ["knowledge-base/legacy-sources/forbidden.md"],
        },
        "design-intelligence": {
          label: "Design intelligence",
          files: ["knowledge-base/design-intelligence/allowed.md"],
        },
        "ux-patterns": {
          label: "UX",
          files: ["knowledge-base/maintained/product-patterns/allowed.md"],
        },
        "usability-evaluation": {
          label: "Usability",
          files: ["knowledge-base/usability-evaluation/allowed.md"],
        },
      },
    }),
    "utf8",
  );

  await assert.rejects(
    () => buildKnowledgeIndex(directory, scopePath),
    /outside the architecture category/,
  );
});

type RetrievalEvaluationFixture = {
  version: "1.0";
  cases: Array<{
    id: string;
    query: string;
    categories?: Array<
      | "skill"
      | "architecture"
      | "design-intelligence"
      | "ux-patterns"
      | "usability-evaluation"
    >;
    expectedStatus: "matches" | "no-match";
    expectedPath?: string;
    maxRank?: number;
  }>;
};

function parseRetrievalCases(source: string): RetrievalEvaluationFixture {
  const parsed = parse(source) as RetrievalEvaluationFixture;
  assert.equal(parsed.version, "1.0");
  assert.ok(Array.isArray(parsed.cases));
  return parsed;
}
