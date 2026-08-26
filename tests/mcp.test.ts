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
  }
});
