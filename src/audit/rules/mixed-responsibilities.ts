import type { AuditRule } from "../types.js";
import { findLargestComponent } from "./helpers.js";

const effectPatterns = [
  { label: "network requests", pattern: /\b(?:fetch|axios\.(?:get|post|put|patch|delete))\s*\(/ },
  { label: "local storage", pattern: /\b(?:localStorage|sessionStorage)\s*\./ },
  { label: "browser database access", pattern: /\bindexedDB\s*\./ },
  { label: "download orchestration", pattern: /\bURL\.createObjectURL\s*\(/ },
];

export const mixedResponsibilitiesRule: AuditRule = {
  id: "ZTDE-ARCH-002",
  evaluate(file, policy) {
    const component = findLargestComponent(file);
    if (!component || component.lines < policy.mixedResponsibilitiesMinLines) {
      return [];
    }

    const effects = effectPatterns
      .filter(({ pattern }) => pattern.test(file.content))
      .map(({ label }) => label);
    if (effects.length === 0) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        severity: "warning",
        confidence: "medium",
        file: file.relativePath,
        line: component.line,
        column: component.column,
        message: `${component.name} combines a large rendering surface with direct side-effect orchestration.`,
        evidence: [
          `Component span: ${component.lines} lines.`,
          `Detected: ${effects.join(", ")}.`,
        ],
        remediation:
          "Move network, persistence, and export policy behind focused hooks or services while keeping user-visible state in the owning feature.",
      },
    ];
  },
};
