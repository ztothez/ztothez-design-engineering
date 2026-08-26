import type { AuditRule } from "../types.js";
import { isTestOrStory, lineNumberForOffset } from "./helpers.js";

const rawColorPattern = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g;

function isTokenFile(relativePath: string): boolean {
  return /(?:^|\/)(?:tokens?|theme|palettes?|colors?)(?:[.-]|\/)/i.test(relativePath);
}

function isGeneratedMediaSource(content: string): boolean {
  return /CanvasRenderingContext|\bctx\.(?:fillStyle|strokeStyle)|\.getContext\(["']2d["']\)|create(?:Linear|Radial)Gradient/.test(
    content,
  );
}

function cssCommentRanges(content: string): Array<{ start: number; end: number }> {
  return [...content.matchAll(/\/\*[\s\S]*?\*\//g)].map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

export const rawDesignValuesRule: AuditRule = {
  id: "ZTDE-DESIGN-001",
  evaluate(file, policy) {
    if (
      isTokenFile(file.relativePath) ||
      isTestOrStory(file.relativePath) ||
      isGeneratedMediaSource(file.content)
    ) {
      return [];
    }

    const commentRanges = file.extension === ".css" ? cssCommentRanges(file.content) : [];
    const matches = [...file.content.matchAll(rawColorPattern)].filter((match) => {
      if (match.index === undefined) {
        return false;
      }
      if (
        commentRanges.some(
          (range) => match.index !== undefined && match.index >= range.start && match.index < range.end,
        )
      ) {
        return false;
      }
      if (file.extension !== ".css") {
        return true;
      }

      const lineStart = file.content.lastIndexOf("\n", match.index) + 1;
      const lineEnd = file.content.indexOf("\n", match.index);
      const line = file.content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim();
      return !/^--[a-zA-Z0-9_-]+\s*:/.test(line);
    });

    if (matches.length < policy.rawColorWarningCount) {
      return [];
    }

    const first = matches[0]!;
    return [
      {
        ruleId: this.id,
        severity: "warning",
        confidence: "medium",
        file: file.relativePath,
        line: lineNumberForOffset(file.content, first.index ?? 0),
        message: `${matches.length} raw color values appear outside an identifiable token definition file.`,
        evidence: matches.slice(0, 5).map((match) => `Raw value: ${match[0]}.`),
        remediation:
          "Move recurring interface colors into semantic tokens. Keep genuinely data-driven canvas, chart, or generated-media colors local and document that exception.",
      },
    ];
  },
};
