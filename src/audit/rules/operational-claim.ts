import ts from "typescript";

import type { AuditFinding, AuditRule } from "../types.js";
import { isTestOrStory, nodeLocation, walk } from "./helpers.js";

const claimPattern = /^(?:live|online|connected|operational|production)$|\b(?:api|backend|connection|endpoint|environment|service|status|system)\s*(?::|-)?\s*(?:live|online|connected|operational|production)\b/i;
const bindingAttributes = new Set([
  "data-ztothez-design-claim-source",
  "data-ztothez-design-state-binding",
  "data-ztothez-design-data-mode",
  "data-ztothez-design-connection",
]);

function openingAttributes(node: ts.Node): ts.JsxAttributes | undefined {
  if (ts.isJsxElement(node)) return node.openingElement.attributes;
  if (ts.isJsxSelfClosingElement(node)) return node.attributes;
  return undefined;
}

function hasBinding(node: ts.Node): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    const attributes = openingAttributes(current);
    if (
      attributes?.properties.some(
        (property) =>
          ts.isJsxAttribute(property) && bindingAttributes.has(property.name.getText()),
      )
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function isStaticCondition(node: ts.Expression): boolean {
  let current = node;
  while (ts.isParenthesizedExpression(current)) current = current.expression;
  return (
    current.kind === ts.SyntaxKind.TrueKeyword ||
    current.kind === ts.SyntaxKind.FalseKeyword ||
    current.kind === ts.SyntaxKind.NullKeyword ||
    ts.isStringLiteral(current) ||
    ts.isNumericLiteral(current)
  );
}

function hasRuntimeCondition(node: ts.Node): boolean {
  let child = node;
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (
      ts.isConditionalExpression(current) &&
      (current.whenTrue === child || current.whenFalse === child) &&
      !isStaticCondition(current.condition)
    ) {
      return true;
    }
    if (
      ts.isBinaryExpression(current) &&
      current.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
      current.right === child &&
      !isStaticCondition(current.left)
    ) {
      return true;
    }
    child = current;
    current = current.parent;
  }
  return false;
}

export const operationalClaimRule: AuditRule = {
  id: "ZTDE-TRUST-001",
  evaluate(file) {
    if (!file.sourceFile || isTestOrStory(file.relativePath)) return [];

    const findings: AuditFinding[] = [];
    walk(file.sourceFile, (node) => {
      if (!ts.isJsxText(node)) return;
      const claim = node.text.replace(/\s+/g, " ").trim();
      if (!claim || !claimPattern.test(claim) || hasBinding(node)) return;
      const runtimeConditioned = hasRuntimeCondition(node);
      findings.push({
        ruleId: this.id,
        severity: runtimeConditioned ? "info" : "error",
        confidence: runtimeConditioned ? "medium" : "high",
        file: file.relativePath,
        ...nodeLocation(file, node),
        message: runtimeConditioned
          ? "Runtime-conditioned operational status claim has no explicit source annotation."
          : "Literal operational status claim has no declared runtime source binding.",
        evidence: [
          `Unbound rendered claim: ${JSON.stringify(claim.slice(0, 120))}.`,
          runtimeConditioned
            ? "The claim is rendered only within a non-constant conditional branch."
            : "No runtime conditional or source-binding attribute was detected.",
        ],
        remediation: runtimeConditioned
          ? "When the claim is consequential, declare its source with data-ztothez-design-claim-source or data-ztothez-design-state-binding. Otherwise retain this as a static-verifier limitation."
          : "Derive the claim from runtime state and declare its source with data-ztothez-design-claim-source or data-ztothez-design-state-binding.",
      });
    });
    return findings;
  },
};
