import type { AuditRule } from "../types.js";
import { findLargestComponent } from "./helpers.js";

export const componentSizeRule: AuditRule = {
  id: "ZTDE-ARCH-001",
  evaluate(file, policy) {
    const component = findLargestComponent(file);
    if (!component || component.lines <= policy.componentLineWarning) {
      return [];
    }

    return [
      {
        ruleId: this.id,
        severity: "warning",
        confidence: "high",
        file: file.relativePath,
        line: component.line,
        column: component.column,
        message: `${component.name} spans ${component.lines} lines, exceeding the ${policy.componentLineWarning}-line review threshold.`,
        evidence: [
          "The measured function contains JSX.",
          `Component span: ${component.lines} lines.`,
        ],
        remediation:
          "Review responsibility boundaries and extract cohesive domain, orchestration, or presentation units. Do not split solely to satisfy the threshold.",
      },
    ];
  },
};
