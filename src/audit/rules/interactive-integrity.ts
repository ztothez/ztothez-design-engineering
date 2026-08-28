import ts from "typescript";

import type { AuditFinding, AuditRule } from "../types.js";
import { isTestOrStory, nodeLocation, walk } from "./helpers.js";

type JsxOpening = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

function attribute(attributes: ts.JsxAttributes, name: string): ts.JsxAttribute | undefined {
  return attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  );
}

function literalAttribute(attributes: ts.JsxAttributes, name: string): string | undefined {
  const match = attribute(attributes, name);
  return match?.initializer && ts.isStringLiteral(match.initializer)
    ? match.initializer.text.toLowerCase()
    : undefined;
}

function hasAnyAttribute(attributes: ts.JsxAttributes, names: readonly string[]): boolean {
  return attributes.properties.some(
    (property) =>
      ts.isJsxSpreadAttribute(property) ||
      (ts.isJsxAttribute(property) && names.includes(property.name.getText())),
  );
}

function insideForm(node: ts.Node): boolean {
  let current = node.parent;
  while (current) {
    if (ts.isJsxElement(current) && current.openingElement.tagName.getText() === "form") return true;
    current = current.parent;
  }
  return false;
}

function openingNode(node: ts.Node): JsxOpening | undefined {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) return node;
  return undefined;
}

export const interactiveIntegrityRule: AuditRule = {
  id: "ZTDE-SLOP-003",
  evaluate(file) {
    if (!file.sourceFile || isTestOrStory(file.relativePath)) return [];

    const findings: AuditFinding[] = [];
    walk(file.sourceFile, (node) => {
      const opening = openingNode(node);
      if (!opening) return;
      const tag = opening.tagName.getText();
      const attributes = opening.attributes;
      const location = nodeLocation(file, opening);

      if (tag === "button") {
        const type = literalAttribute(attributes, "type");
        const intentionallyUnavailable = hasAnyAttribute(attributes, ["disabled", "aria-disabled"]);
        const hasHandler = hasAnyAttribute(attributes, [
          "onClick",
          "onPointerUp",
          "onMouseUp",
          "formAction",
        ]);
        const submitsForm = type === "submit" || type === "reset" || (type === undefined && insideForm(opening));
        if (!intentionallyUnavailable && !hasHandler && !submitsForm) {
          findings.push({
            ruleId: this.id,
            severity: "error",
            confidence: "high",
            file: file.relativePath,
            ...location,
            message: "Button has no detectable action, form behavior, or intentional disabled state.",
            evidence: ["No event handler, formAction, submit/reset behavior, disabled state, or spread props were found."],
            remediation:
              "Implement the action, bind form behavior, or render a non-interactive element until the action exists.",
          });
        }
        return;
      }

      const role = literalAttribute(attributes, "role");
      const hasClick = hasAnyAttribute(attributes, ["onClick", "onPointerUp", "onMouseUp"]);
      const hasKeyboard = hasAnyAttribute(attributes, ["onKeyDown", "onKeyUp", "onKeyPress"]);
      const hasTabStop = hasAnyAttribute(attributes, ["tabIndex"]);
      if (role === "button" && (!hasClick || !hasKeyboard || !hasTabStop)) {
        findings.push({
          ruleId: this.id,
          severity: "error",
          confidence: "high",
          file: file.relativePath,
          ...location,
          message: "Custom button semantics are incomplete.",
          evidence: [
            `Detected role=button with click=${hasClick}, keyboard=${hasKeyboard}, tab stop=${hasTabStop}.`,
          ],
          remediation:
            "Use a native button. If a custom control is unavoidable, provide click, Enter or Space keyboard behavior, and tabIndex=0.",
        });
      } else if (role !== "button" && hasClick && !hasKeyboard) {
        findings.push({
          ruleId: this.id,
          severity: "warning",
          confidence: "medium",
          file: file.relativePath,
          ...location,
          message: "A non-control element has pointer behavior without detectable keyboard semantics.",
          evidence: [`${tag} declares a pointer handler without a keyboard handler or button role.`],
          remediation: "Use a native interactive element or add the complete keyboard and semantic contract.",
        });
      }
    });
    return findings;
  },
};
