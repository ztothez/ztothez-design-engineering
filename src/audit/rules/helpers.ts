import ts from "typescript";

import type { AuditSourceFile } from "../types.js";

export type ComponentSpan = {
  name: string;
  line: number;
  column: number;
  lines: number;
};

export function nodeLocation(
  file: AuditSourceFile,
  node: ts.Node,
): { line: number; column: number } {
  if (!file.sourceFile) {
    return { line: 1, column: 1 };
  }

  const location = file.sourceFile.getLineAndCharacterOfPosition(node.getStart(file.sourceFile));
  return { line: location.line + 1, column: location.character + 1 };
}

export function walk(node: ts.Node, visitor: (child: ts.Node) => void): void {
  visitor(node);
  node.forEachChild((child) => walk(child, visitor));
}

function containsJsx(node: ts.Node): boolean {
  let found = false;
  walk(node, (child) => {
    if (
      ts.isJsxElement(child) ||
      ts.isJsxSelfClosingElement(child) ||
      ts.isJsxFragment(child)
    ) {
      found = true;
    }
  });
  return found;
}

function componentName(node: ts.Node): string {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.text;
  }

  if (
    (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    ts.isVariableDeclaration(node.parent) &&
    ts.isIdentifier(node.parent.name)
  ) {
    return node.parent.name.text;
  }

  return "default component";
}

export function findLargestComponent(file: AuditSourceFile): ComponentSpan | undefined {
  if (!file.sourceFile) {
    return undefined;
  }

  const components: ComponentSpan[] = [];
  walk(file.sourceFile, (node) => {
    const isFunction =
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node);
    if (!isFunction || !containsJsx(node)) {
      return;
    }

    const start = file.sourceFile!.getLineAndCharacterOfPosition(node.getStart(file.sourceFile));
    const end = file.sourceFile!.getLineAndCharacterOfPosition(node.getEnd());
    components.push({
      name: componentName(node),
      line: start.line + 1,
      column: start.character + 1,
      lines: end.line - start.line + 1,
    });
  });

  return components.sort((left, right) => right.lines - left.lines)[0];
}

export function lineNumberForOffset(content: string, offset: number): number {
  return content.slice(0, offset).split("\n").length;
}

export function isTestOrStory(relativePath: string): boolean {
  return /(?:^|\/)(?:__tests__|fixtures?|stories)(?:\/|$)|\.(?:spec|test|stories)\.[^.]+$/i.test(
    relativePath,
  );
}
