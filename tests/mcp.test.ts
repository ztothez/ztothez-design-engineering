import assert from "node:assert/strict";
import { delimiter, resolve } from "node:path";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

test("MCP exposes the repository auditor with structured output", async () => {
  process.env.ZTOTHEZ_DESIGN_AUDIT_ROOTS = [resolve(process.cwd(), "tests", "fixtures")].join(delimiter);
  process.env.ZTOTHEZ_DESIGN_HEURISTIC_REVIEW_ROOTS = [
    resolve(process.cwd(), "tests", "fixtures"),
  ].join(delimiter);
  process.env.ZTOTHEZ_DESIGN_DELIVERABLE_ROOTS = [
    resolve(process.cwd(), "tests", "fixtures"),
    resolve(process.cwd(), "knowledge-base", "design-intelligence"),
  ].join(delimiter);
  const { server } = await import("../src/server.js");
  const client = new Client({ name: "ztothez-design-audit-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  try {
    assert.deepEqual(client.getServerVersion(), {
      name: "ztothez-design-engineering",
      version: "2.0.0",
    });
    const tools = await client.listTools();
    assert.ok(tools.tools.some((tool) => tool.name === "audit_repository_architecture"));
    assert.ok(tools.tools.some((tool) => tool.name === "verify_ui_runtime"));
    assert.ok(tools.tools.some((tool) => tool.name === "validate_product_contract"));
    assert.ok(tools.tools.some((tool) => tool.name === "run_design_quality_gate"));
    assert.ok(tools.tools.some((tool) => tool.name === "aggregate_design_quality_gates"));
    assert.ok(tools.tools.some((tool) => tool.name === "get_usability_evaluation"));
    assert.ok(tools.tools.some((tool) => tool.name === "evaluate_heuristic_review"));
    assert.ok(tools.tools.some((tool) => tool.name === "search_design_knowledge"));
    assert.ok(tools.tools.some((tool) => tool.name === "evaluate_corpus_benchmark"));
    assert.ok(tools.tools.some((tool) => tool.name === "get_design_intelligence"));
    assert.ok(tools.tools.some((tool) => tool.name === "validate_design_deliverable"));

    const knowledgeSearch = await client.callTool({
      name: "search_design_knowledge",
      arguments: {
        query: "semantic design tokens component states",
        categories: ["skill", "design-intelligence"],
        limit: 3,
      },
    });
    const knowledgeReport = knowledgeSearch.structuredContent as
      | {
          status?: unknown;
          authorityPath?: unknown;
          results?: Array<{ path?: unknown; authority?: unknown; excerpt?: unknown }>;
        }
      | undefined;
    assert.equal(knowledgeSearch.isError, undefined);
    assert.equal(knowledgeReport?.status, "matches");
    assert.equal(knowledgeReport?.authorityPath, "SKILL.md");
    assert.equal(knowledgeReport?.results?.[0]?.path, "SKILL.md");
    assert.equal(knowledgeReport?.results?.[0]?.authority, "authoritative");
    assert.equal(typeof knowledgeReport?.results?.[0]?.excerpt, "string");

    const noKnowledgeMatch = await client.callTool({
      name: "search_design_knowledge",
      arguments: { query: "xyzzynonexistentknowledge" },
    });
    const noMatchReport = noKnowledgeMatch.structuredContent as
      | { status?: unknown; results?: unknown[] }
      | undefined;
    assert.equal(noKnowledgeMatch.isError, undefined);
    assert.equal(noMatchReport?.status, "no-match");
    assert.deepEqual(noMatchReport?.results, []);

    const corpus = await client.callTool({
      name: "evaluate_corpus_benchmark",
      arguments: {},
    });
    const corpusReport = corpus.structuredContent as
      | { passed?: unknown; overallScore?: unknown; caseResults?: unknown[]; dimensions?: unknown[] }
      | undefined;
    assert.equal(corpus.isError, undefined);
    assert.equal(corpusReport?.passed, true);
    assert.equal(corpusReport?.overallScore, 1);
    assert.equal(corpusReport?.caseResults?.length, 13);
    assert.equal(corpusReport?.dimensions?.length, 5);

    const deniedCorpusTraversal = await client.callTool({
      name: "evaluate_corpus_benchmark",
      arguments: { manifest: "../aegisops/product-contract.yaml" },
    });
    assert.equal(deniedCorpusTraversal.isError, true);

    const designListing = await client.callTool({
      name: "get_design_intelligence",
      arguments: {},
    });
    const designListingText = (designListing.content as Array<{ type: string; text?: string }>).find(
      (entry) => entry.type === "text",
    );
    assert.equal(designListing.isError, undefined);
    assert.match(designListingText?.text ?? "", /brand-systems[.]md/);
    assert.match(designListingText?.text ?? "", /visual-accessibility[.]md/);

    const designManifest = await client.callTool({
      name: "validate_design_deliverable",
      arguments: { manifestFile: "design-deliverable.template.yaml" },
    });
    const designReport = designManifest.structuredContent as
      | { passed?: unknown; contrastResults?: unknown[] }
      | undefined;
    assert.equal(designManifest.isError, undefined);
    assert.equal(designReport?.passed, true);
    assert.equal(designReport?.contrastResults?.length, 4);

    const deniedDesignManifest = await client.callTool({
      name: "validate_design_deliverable",
      arguments: { manifestFile: resolve(process.cwd(), "package.json") },
    });
    assert.equal(deniedDesignManifest.isError, true);

    const usabilityListing = await client.callTool({
      name: "get_usability_evaluation",
      arguments: {},
    });
    const usabilityListingContent = usabilityListing.content as Array<{
      type: string;
      text?: string;
    }>;
    const usabilityListingText = usabilityListingContent.find(
      (entry) => entry.type === "text",
    );
    assert.equal(usabilityListing.isError, undefined);
    assert.equal(usabilityListingText?.type, "text");
    if (usabilityListingText?.type === "text") {
      assert.match(usabilityListingText.text ?? "", /HEURISTIC_EVALUATION[.]md/);
      assert.doesNotMatch(usabilityListingText.text ?? "", /sources\//);
    }

    const usabilityFile = await client.callTool({
      name: "get_usability_evaluation",
      arguments: { file: "HEURISTIC_EVALUATION.md" },
    });
    const usabilityFileContent = usabilityFile.content as Array<{
      type: string;
      text?: string;
    }>;
    const usabilityFileText = usabilityFileContent.find((entry) => entry.type === "text");
    assert.equal(usabilityFile.isError, undefined);
    if (usabilityFileText?.type === "text") {
      assert.match(
        usabilityFileText.text ?? "",
        /Source: knowledge-base\/usability-evaluation\/HEURISTIC_EVALUATION[.]md/,
      );
    }

    const deniedUsabilityTraversal = await client.callTool({
      name: "get_usability_evaluation",
      arguments: { file: "../architecture/ATAM.md" },
    });
    assert.equal(deniedUsabilityTraversal.isError, true);

    const deniedLocalSource = await client.callTool({
      name: "get_usability_evaluation",
      arguments: { file: "sources/Handout Usability testing.md" },
    });
    assert.equal(deniedLocalSource.isError, true);

    const heuristicReview = await client.callTool({
      name: "evaluate_heuristic_review",
      arguments: { reviewFile: "heuristic-review.yaml" },
    });
    const heuristicReport = heuristicReview.structuredContent as
      | { requiresAcceptanceWork?: unknown; acceptanceCandidates?: unknown[] }
      | undefined;
    assert.equal(heuristicReview.isError, undefined);
    assert.equal(heuristicReport?.requiresAcceptanceWork, true);
    assert.equal(heuristicReport?.acceptanceCandidates?.length, 1);

    const deniedHeuristicReview = await client.callTool({
      name: "evaluate_heuristic_review",
      arguments: {
        reviewFile: resolve(
          process.cwd(),
          "knowledge-base",
          "usability-evaluation",
          "heuristic-review.template.yaml",
        ),
      },
    });
    assert.equal(deniedHeuristicReview.isError, true);

    const contract = await client.callTool({
      name: "validate_product_contract",
      arguments: { contract: "aegisops/product-contract.yaml" },
    });
    const contractReport = contract.structuredContent as { passed?: unknown } | undefined;
    assert.equal(contract.isError, undefined);
    assert.equal(contractReport?.passed, true);

    const result = await client.callTool({
      name: "audit_repository_architecture",
      arguments: { targetDirectory: "passing" },
    });
    const structured = result.structuredContent as
      | { passed?: unknown; filesScanned?: unknown }
      | undefined;
    assert.equal(result.isError, undefined);
    assert.equal(structured?.passed, true);
    assert.equal(structured?.filesScanned, 2);

    const denied = await client.callTool({
      name: "audit_repository_architecture",
      arguments: { targetDirectory: resolve(process.cwd(), "src") },
    });
    assert.equal(denied.isError, true);

    const deniedRuntime = await client.callTool({
      name: "verify_ui_runtime",
      arguments: { url: "https://example.com" },
    });
    assert.equal(deniedRuntime.isError, true);

    const deniedQualityGate = await client.callTool({
      name: "run_design_quality_gate",
      arguments: {
        contract: "aegisops/product-contract.yaml",
        targetDirectory: "passing",
        url: "https://example.com",
        profile: "responsive-overview",
      },
    });
    assert.equal(deniedQualityGate.isError, true);
  } finally {
    await client.close();
    await server.close();
    delete process.env.ZTOTHEZ_DESIGN_AUDIT_ROOTS;
    delete process.env.ZTOTHEZ_DESIGN_HEURISTIC_REVIEW_ROOTS;
    delete process.env.ZTOTHEZ_DESIGN_DELIVERABLE_ROOTS;
  }
});
