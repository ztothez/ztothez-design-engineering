import type { AuditRule } from "../types.js";
import { isTestOrStory, lineNumberForOffset } from "./helpers.js";

const mockPatterns = [
  /\bsetMock[A-Z][A-Za-z0-9_]*/,
  /\b(?:autonomous|production|backend)\s+mock\b/i,
  /\bmock\s+(?:fallback|report|response|result|data)\b/i,
  /\bfake\s+(?:loading|progress|response|result|data)\b/i,
  /\bsimulat(?:e|ed|ing)\s+(?:loading|progress|request|response|result)\b/i,
];

export const mockProductionPathRule: AuditRule = {
  id: "ZTDE-SLOP-001",
  evaluate(file) {
    if (isTestOrStory(file.relativePath)) {
      return [];
    }

    const match = mockPatterns
      .map((pattern) => pattern.exec(file.content))
      .find((candidate): candidate is RegExpExecArray => candidate !== null);
    if (!match || match.index === undefined) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        severity: "error",
        confidence: "high",
        file: file.relativePath,
        line: lineNumberForOffset(file.content, match.index),
        message: "A mock or simulated behavior path is present in production source.",
        evidence: [`Matched production-source text: ${JSON.stringify(match[0])}.`],
        remediation:
          "Remove the mock path, isolate it behind an explicit demo fixture, or label the resulting data and behavior as simulated in the interface.",
      },
    ];
  },
};
