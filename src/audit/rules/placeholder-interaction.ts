import ts from "typescript";

import type { AuditFinding, AuditRule } from "../types.js";
import { isTestOrStory, nodeLocation, walk } from "./helpers.js";

function attributeValue(
  attributes: ts.JsxAttributes,
  name: string,
): string | undefined {
  const attribute = attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  );
  if (!attribute?.initializer) {
    return undefined;
  }
  if (ts.isStringLiteral(attribute.initializer)) {
    return attribute.initializer.text;
  }
  return undefined;
}

export const placeholderInteractionRule: AuditRule = {
  id: "ZTDE-SLOP-002",
  evaluate(file) {
    if (!file.sourceFile || isTestOrStory(file.relativePath)) {
      return [];
    }

    const findings: AuditFinding[] = [];
    walk(file.sourceFile, (node) => {
      if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) {
        return;
      }
      if (node.tagName.getText() !== "a") {
        return;
      }

      const href = attributeValue(node.attributes, "href");
      if (href !== "#" && href !== "" && !href?.toLowerCase().startsWith("javascript:")) {
        return;
      }

      const location = nodeLocation(file, node);
      findings.push({
        ruleId: this.id,
        severity: "error",
        confidence: "high",
        file: file.relativePath,
        ...location,
        message: `Anchor uses a non-functional href value: ${JSON.stringify(href)}.`,
        evidence: ["The anchor cannot navigate to a product destination."],
        remediation:
          "Provide a real route or URL. If the action is not navigation, use a button with a complete event handler.",
      });
    });

    return findings;
  },
};
