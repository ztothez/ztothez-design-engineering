import type { KnowledgeSearchReport } from "./schema.js";

export function formatKnowledgeSearchReport(report: KnowledgeSearchReport): string {
  const query = report.query.replace(/\s+/g, " ").trim();
  const lines = [
    "# ZtotheZ Design Engineering Knowledge Search",
    "",
    `- Query: ${query}`,
    `- Categories: ${report.categories.join(", ")}`,
    `- Authority: \`${report.authorityPath}\` remains authoritative`,
    `- Scope: ${report.stats.documentsSearched} documents and ${report.stats.chunksSearched} chunks`,
    `- Status: ${report.status === "matches" ? "MATCHES" : "NO MATCH"}`,
    `- Result: ${report.message}`,
  ];

  for (const result of report.results) {
    lines.push(
      "",
      `## ${result.rank}. ${result.title}`,
      "",
      `- Source: \`${result.path}\``,
      `- Category: ${result.category}`,
      `- Authority: ${result.authority}`,
      `- Section: ${result.section}`,
      `- Confidence: ${result.confidence}`,
      `- Score: ${result.score}`,
      `- Matched terms: ${result.matchedTerms.join(", ")}`,
      "",
      result.excerpt,
    );
  }

  if (report.status === "no-match") {
    lines.push(
      "",
      "Do not fill this gap from legacy archives or unapproved local research. Refine the query, broaden the approved categories, or record a knowledge gap.",
    );
  }

  return lines.join("\n");
}
