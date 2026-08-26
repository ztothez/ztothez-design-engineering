import type { AuditRule } from "../types.js";
import { isTestOrStory, lineNumberForOffset } from "./helpers.js";

const networkPattern = /\b(?:fetch|axios\.(?:get|post|put|patch|delete))\s*\(/;
const loadingPattern = /\b(?:isLoading|loading|pending|running|busy|status)\b/i;
const errorPattern = /\b(?:catch|error|failed|failure)\b/i;

export const networkStateRule: AuditRule = {
  id: "ZTDE-STATE-001",
  evaluate(file) {
    if (isTestOrStory(file.relativePath)) {
      return [];
    }

    const networkMatch = networkPattern.exec(file.content);
    if (!networkMatch || networkMatch.index === undefined) {
      return [];
    }

    const missing = [];
    if (!loadingPattern.test(file.content)) {
      missing.push("an observable loading or pending state");
    }
    if (!errorPattern.test(file.content)) {
      missing.push("an error or recovery path");
    }
    if (missing.length === 0) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        severity: "warning",
        confidence: "medium",
        file: file.relativePath,
        line: lineNumberForOffset(file.content, networkMatch.index),
        message: `Network behavior lacks ${missing.join(" and ")}.`,
        evidence: [`Detected network call: ${networkMatch[0].trim()}.`],
        remediation:
          "Expose pending state, preserve relevant user input, and provide a visible error with an actionable retry or recovery path.",
      },
    ];
  },
};
