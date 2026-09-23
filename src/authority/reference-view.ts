import type { CompiledAuthority, RuleRegistry } from "./schema.js";

export function formatAuthorityReferenceView(
  authority: CompiledAuthority,
  registry: RuleRegistry,
): string {
  const categoryCounts = new Map<string, number>();
  for (const rule of registry.rules) {
    categoryCounts.set(rule.category, (categoryCounts.get(rule.category) ?? 0) + 1);
  }

  return `${[
    "# Generated ZtotheZ Design Engineering Reference View",
    "",
    "This file is a generated explanatory view of the V5 compiled authority boundary. It is not an independent authority and must not override `SKILL.md`, the admitted manifest, the rule registry, or the compiled JSON artifact.",
    "",
    "## Boundary",
    "",
    `- Authority: ${authority.authority}`,
    `- Lifecycle: ${authority.lifecycle}`,
    `- Cutover status: ${authority.cutoverStatus}`,
    `- Admitted knowledge files: ${authority.knowledge.admittedFileCount}`,
    `- Retrieval files: ${authority.knowledge.retrievalFileCount}`,
    `- Exact-read files: ${authority.knowledge.exactReadDocuments.length}`,
    `- Model entities: ${authority.model.entityCount}`,
    `- Registered rules: ${authority.ruleRegistry.ruleCount}`,
    `- Payload SHA-256: ${authority.integrity.payloadSha256}`,
    "",
    "## Rule Categories",
    "",
    ...[...categoryCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, count]) => `- ${category}: ${count}`),
    "",
    "## Retrieval Documents",
    "",
    ...authority.knowledge.retrievalDocuments.map(
      (document) => `- ${document.path} (${document.category}, ${document.authority})`,
    ),
    "",
  ].join("\n")}\n`;
}
