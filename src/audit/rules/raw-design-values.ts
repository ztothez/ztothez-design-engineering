import type { AuditRule } from "../types.js";
import { isTestOrStory, lineNumberForOffset } from "./helpers.js";

const rawColorPattern = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g;
const rawDimensionPattern = /\b(?:margin|padding|gap|inset|top|right|bottom|left|width|height|minWidth|minHeight|maxWidth|maxHeight|min-width|min-height|max-width|max-height|borderRadius|border-radius|fontSize|font-size|lineHeight|line-height)\b\s*[:=]\s*["']?(-?\d+(?:[.]\d+)?(?:px|rem|em|ch|vh|vw))\b/gi;
const rawDurationPattern = /\b(?:transitionDuration|animationDuration|transition-duration|animation-duration|duration)\b\s*[:=]\s*["']?(\d+(?:[.]\d+)?(?:ms|s))\b/gi;
const rawShadowPattern = /\b(?:boxShadow|box-shadow)\b\s*[:=]\s*["']?([^;\n}]+)/gi;
const rawFontPattern = /\b(?:fontFamily|font-family)\b\s*[:=]\s*["']([^"'\n]+)["']/gi;

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
    const candidateMatches = [
      ...file.content.matchAll(rawColorPattern),
      ...file.content.matchAll(rawDimensionPattern),
      ...file.content.matchAll(rawDurationPattern),
      ...file.content.matchAll(rawShadowPattern),
      ...file.content.matchAll(rawFontPattern),
    ].sort((first, second) => (first.index ?? 0) - (second.index ?? 0));
    const matches = candidateMatches.filter((match) => {
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
      if (/^--[a-zA-Z0-9_-]+\s*:/.test(line) || /^@media\b/.test(line)) {
        return false;
      }
      return !/\b(?:box-shadow|font-family)\s*:\s*var\(/i.test(match[0]);
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
        message: `${matches.length} raw visual values appear outside an identifiable token definition file.`,
        evidence: matches.slice(0, 5).map((match) => `Raw value: ${match[0]}.`),
        remediation:
          "Move recurring interface colors, dimensions, durations, shadows, and font declarations into semantic tokens. Keep genuinely data-driven canvas, chart, generated-media, and one-off intrinsic geometry values local and document those exceptions.",
      },
    ];
  },
};
