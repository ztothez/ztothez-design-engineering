import ts from "typescript";

import type { AuditFinding, AuditRule } from "../types.js";
import { isTestOrStory, nodeLocation, walk } from "./helpers.js";

const sensitiveNames = new Set([
  "apikey",
  "accesstoken",
  "authtoken",
  "clientsecret",
  "credential",
  "credentials",
  "password",
  "privatekey",
  "secret",
  "token",
]);

function normalizedName(node: ts.Node): string | undefined {
  const value = ts.isIdentifier(node) || ts.isPrivateIdentifier(node)
    ? node.text
    : ts.isStringLiteral(node) || ts.isNumericLiteral(node)
      ? node.text
      : undefined;
  return value?.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function literalValue(node: ts.Expression | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function sensitiveAssignment(node: ts.Node): { name: string; value: string; location: ts.Node } | undefined {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    const name = normalizedName(node.name);
    const value = literalValue(node.initializer);
    if (name && sensitiveNames.has(name) && value?.trim()) return { name, value, location: node.name };
  }
  if (ts.isPropertyAssignment(node)) {
    const name = normalizedName(node.name);
    const value = literalValue(node.initializer);
    if (name && sensitiveNames.has(name) && value?.trim()) return { name, value, location: node.name };
  }
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken
  ) {
    const target = ts.isPropertyAccessExpression(node.left) ? node.left.name : node.left;
    const name = normalizedName(target);
    const value = literalValue(node.right);
    if (name && sensitiveNames.has(name) && value?.trim()) return { name, value, location: target };
  }
  return undefined;
}

export const credentialPlaceholderRule: AuditRule = {
  id: "ZTDE-SEC-001",
  evaluate(file) {
    if (!file.sourceFile || isTestOrStory(file.relativePath)) return [];

    const findings: AuditFinding[] = [];
    const seen = new Set<number>();
    walk(file.sourceFile, (node) => {
      const assignment = sensitiveAssignment(node);
      if (!assignment || seen.has(assignment.location.getStart(file.sourceFile))) return;
      seen.add(assignment.location.getStart(file.sourceFile));
      const location = nodeLocation(file, assignment.location);
      findings.push({
        ruleId: this.id,
        severity: "error",
        confidence: "high",
        file: file.relativePath,
        ...location,
        message: "A credential-like field contains a hard-coded non-empty string literal.",
        evidence: [
          `Sensitive field ${assignment.name} is assigned a ${assignment.value.length}-character literal.`,
          "The value is intentionally redacted from audit output.",
        ],
        remediation:
          "Remove the literal. Load credentials from an approved runtime secret source and represent unavailable credentials as an explicit configuration state.",
      });
    });
    return findings;
  },
};
