import ts from "typescript";

import type { AuditFinding, AuditRule } from "../types.js";
import { isTestOrStory, nodeLocation, walk } from "./helpers.js";

function hasAttribute(attributes: ts.JsxAttributes, names: readonly string[]): boolean {
  return attributes.properties.some(
    (property) =>
      ts.isJsxAttribute(property) && names.includes(property.name.getText()),
  );
}

function nodeProvidesAccessibleText(node: ts.JsxChild): boolean {
  if (ts.isJsxText(node)) {
    return node.text.trim().length > 0;
  }
  if (ts.isJsxExpression(node) && node.expression) {
    return !ts.isJsxElement(node.expression) && !ts.isJsxSelfClosingElement(node.expression);
  }
  if (ts.isJsxElement(node)) {
    return node.children.some(nodeProvidesAccessibleText);
  }
  return false;
}

function hasAccessibleText(element: ts.JsxElement): boolean {
  return element.children.some((child) => {
    if (ts.isJsxText(child)) {
      return child.text.trim().length > 0;
    }
    if (ts.isJsxExpression(child) && child.expression) {
      return !ts.isJsxElement(child.expression) && !ts.isJsxSelfClosingElement(child.expression);
    }
    return ts.isJsxElement(child) && child.children.some(nodeProvidesAccessibleText);
  });
}

export const accessibilityNameRule: AuditRule = {
  id: "ZTDE-A11Y-001",
  evaluate(file) {
    if (!file.sourceFile || isTestOrStory(file.relativePath)) {
      return [];
    }

    const findings: AuditFinding[] = [];
    walk(file.sourceFile, (node) => {
      if (!ts.isJsxElement(node) || node.openingElement.tagName.getText() !== "button") {
        return;
      }

      const attributes = node.openingElement.attributes;
      if (
        hasAttribute(attributes, ["aria-label", "aria-labelledby", "title"]) ||
        hasAccessibleText(node)
      ) {
        return;
      }

      const containsVisualChild = node.children.some(
        (child) => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child),
      );
      if (!containsVisualChild) {
        return;
      }

      const location = nodeLocation(file, node.openingElement);
      findings.push({
        ruleId: this.id,
        severity: "error",
        confidence: "high",
        file: file.relativePath,
        ...location,
        message: "Icon-only button has no detectable accessible name.",
        evidence: ["Button contains a visual child but no text, aria-label, aria-labelledby, or title."],
        remediation: "Add a concise accessible name that describes the button action.",
      });
    });

    return findings;
  },
};
