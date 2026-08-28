import type { Page } from "playwright-core";

import type { RuntimeFinding, RuntimeViewport } from "./types.js";

type BrowserIssue = {
  selector?: string;
  message: string;
  evidence: string[];
};

function appendIssues(
  findings: RuntimeFinding[],
  checkId: string,
  viewport: RuntimeViewport,
  issues: BrowserIssue[],
): void {
  findings.push(
    ...issues.map((issue) => ({
      checkId,
      severity: "error" as const,
      viewport: viewport.name,
      message: issue.message,
      evidence: issue.evidence,
      ...(issue.selector ? { selector: issue.selector } : {}),
    })),
  );
}

export async function checkVisualComposition(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const issues = await page.evaluate(() => {
    type Issue = BrowserIssue;
    const root = document.querySelector('[data-ztothez-design-composition="1.0"]');
    if (!root) return [] as Issue[];

    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const marker = [...element.attributes].find((entry) => entry.name.startsWith("data-ztothez-design-"));
      return `${element.tagName.toLowerCase()}${marker ? `[${marker.name}]` : ""}`;
    }

    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 1 &&
        rect.height > 1 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number.parseFloat(style.opacity || "1") > 0.01 &&
        !element.closest('[aria-hidden="true"], [inert]')
      );
    }

    function integerAttribute(name: string, fallback: number): number {
      const value = Number.parseInt(root!.getAttribute(name) ?? "", 10);
      return Number.isInteger(value) && value > 0 ? value : fallback;
    }

    const result: Issue[] = [];
    const requiredRoles = ["context", "primary-outcome", "next-action"];
    const priorities = [...root.querySelectorAll("[data-ztothez-design-priority]")];
    const seen = new Map<string, Element[]>();
    for (const element of priorities) {
      const role = element.getAttribute("data-ztothez-design-priority") ?? "";
      seen.set(role, [...(seen.get(role) ?? []), element]);
    }

    for (const role of requiredRoles) {
      const elements = seen.get(role) ?? [];
      if (elements.length !== 1 || !visible(elements[0]!)) {
        result.push({
          selector: selectorFor(root),
          message: `Decision hierarchy requires one visible ${role} region.`,
          evidence: [`Found ${elements.length}; visible=${elements.length === 1 && visible(elements[0]!)}.`],
        });
      }
    }

    const ordered = requiredRoles
      .map((role) => seen.get(role)?.[0])
      .filter((entry): entry is Element => Boolean(entry));
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]!;
      const current = ordered[index]!;
      if (!(previous.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        result.push({
          selector: selectorFor(current),
          message: "Decision-critical regions do not preserve context, outcome, then next-action order.",
          evidence: requiredRoles.map((role) => `${role}: ${selectorFor(seen.get(role)?.[0] ?? root)}`),
        });
        break;
      }
    }

    const nextAction = seen.get("next-action")?.[0];
    if (nextAction) {
      const actionable = nextAction.matches('button:not([disabled]), a[href], [role="button"]')
        ? nextAction
        : nextAction.querySelector('button:not([disabled]), a[href], [role="button"]');
      if (!actionable || !visible(actionable)) {
        result.push({
          selector: selectorFor(nextAction),
          message: "The visible next-action region has no reachable enabled action.",
          evidence: ["Render the primary command directly in the decision path instead of hiding it behind unrelated navigation."],
        });
      }
    }

    const context = seen.get("context")?.[0];
    const outcome = seen.get("primary-outcome")?.[0];
    if (context && outcome && nextAction) {
      for (const region of [...root.querySelectorAll("[data-ztothez-design-region]")].filter(visible)) {
        if (region.contains(outcome) || region.contains(nextAction)) continue;
        const afterContext = Boolean(context.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING);
        const beforeOutcome = Boolean(region.compareDocumentPosition(outcome) & Node.DOCUMENT_POSITION_FOLLOWING);
        const afterOutcome = Boolean(outcome.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING);
        const beforeAction = Boolean(region.compareDocumentPosition(nextAction) & Node.DOCUMENT_POSITION_FOLLOWING);
        if ((afterContext && beforeOutcome) || (afterOutcome && beforeAction)) {
          result.push({
            selector: selectorFor(region),
            message: "A supporting region interrupts the decision-critical context, outcome, and next-action sequence.",
            evidence: ["Move detailed telemetry, provenance, history, or secondary controls after the primary next action."],
          });
        }
      }
    }

    const primaryActions = [...root.querySelectorAll("[data-ztothez-design-primary-action]")].filter(visible);
    const maximumPrimaryActions = integerAttribute("data-ztothez-design-max-primary-actions", 3);
    if (primaryActions.length > maximumPrimaryActions) {
      result.push({
        selector: selectorFor(root),
        message: "Composition exposes too many simultaneous primary actions.",
        evidence: [`Visible primary actions: ${primaryActions.length}; declared maximum: ${maximumPrimaryActions}.`],
      });
    }

    const regions = [...root.querySelectorAll("[data-ztothez-design-region]")].filter(visible);
    const maximumRegions = integerAttribute("data-ztothez-design-max-visible-regions", 8);
    if (regions.length > maximumRegions) {
      result.push({
        selector: selectorFor(root),
        message: "Composition exceeds its declared visible-region density limit.",
        evidence: [`Visible regions: ${regions.length}; declared maximum: ${maximumRegions}.`],
      });
    }

    for (const status of [...root.querySelectorAll("[data-ztothez-design-status]")].filter(visible)) {
      const purpose = status.getAttribute("data-ztothez-design-status-purpose")?.trim();
      const text = status.textContent?.trim();
      if (!purpose || !text) {
        result.push({
          selector: selectorFor(status),
          message: "Visible status treatment is ornamental or lacks explicit meaning.",
          evidence: [`Purpose present=${Boolean(purpose)}; readable text present=${Boolean(text)}.`],
        });
      }
    }

    const allowedClaimBases = new Set(["synthetic", "source", "runtime", "user-provided"]);
    for (const claim of [...root.querySelectorAll("[data-ztothez-design-visual-claim]")].filter(visible)) {
      const basis = claim.getAttribute("data-ztothez-design-claim-basis") ?? "";
      const evidenceRef = claim.getAttribute("data-ztothez-design-evidence-ref")?.trim();
      if (!allowedClaimBases.has(basis) || !evidenceRef) {
        result.push({
          selector: selectorFor(claim),
          message: "Visual claim lacks a supported basis or evidence reference.",
          evidence: [`Basis=${JSON.stringify(basis)}; evidence reference present=${Boolean(evidenceRef)}.`],
        });
      }
    }

    return result.slice(0, 40);
  });

  appendIssues(findings, "ZTDE-RUNTIME-020", viewport, issues);
}

export async function checkRenderedVisualContrast(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const issues = await page.evaluate(() => {
    type Issue = BrowserIssue;
    type Color = { red: number; green: number; blue: number; alpha: number };
    const root = document.querySelector('[data-ztothez-design-composition="1.0"]');
    if (!root) return [] as Issue[];
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const marker = [...element.attributes].find((entry) => entry.name.startsWith("data-ztothez-design-"));
      return `${element.tagName.toLowerCase()}${marker ? `[${marker.name}]` : ""}`;
    }
    function parseColor(value: string): Color | null {
      if (!context) return null;
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      return { red: pixel[0]!, green: pixel[1]!, blue: pixel[2]!, alpha: pixel[3]! / 255 };
    }
    function composite(foreground: Color, background: Color): Color {
      const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
      if (alpha <= 0) return { red: 0, green: 0, blue: 0, alpha: 0 };
      return {
        red: (foreground.red * foreground.alpha + background.red * background.alpha * (1 - foreground.alpha)) / alpha,
        green: (foreground.green * foreground.alpha + background.green * background.alpha * (1 - foreground.alpha)) / alpha,
        blue: (foreground.blue * foreground.alpha + background.blue * background.alpha * (1 - foreground.alpha)) / alpha,
        alpha,
      };
    }
    function backgroundFor(element: Element | null): Color | null {
      let current = element;
      let result: Color = { red: 0, green: 0, blue: 0, alpha: 0 };
      while (current) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== "none") return null;
        const layer = parseColor(style.backgroundColor);
        if (!layer) return null;
        result = composite(result, layer);
        if (result.alpha >= 0.999) return result;
        current = current.parentElement;
      }
      return composite(result, { red: 255, green: 255, blue: 255, alpha: 1 });
    }
    function luminance(color: Color): number {
      const channels = [color.red, color.green, color.blue].map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
    }
    function ratio(first: Color, second: Color): number {
      const left = luminance(first);
      const right = luminance(second);
      return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
    }
    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 1 && rect.height > 1 && style.display !== "none" && style.visibility !== "hidden";
    }
    function issueForColor(element: Element, colorValue: string, surface: Element | null, label: string): Issue | undefined {
      const color = parseColor(colorValue);
      const background = backgroundFor(surface);
      if (!color || !background || color.alpha < 0.99) return undefined;
      const measured = ratio(color, background);
      if (measured + 0.01 >= 3) return undefined;
      return {
        selector: selectorFor(element),
        message: `${label} does not meet rendered 3:1 non-text contrast.`,
        evidence: [`Measured ${measured.toFixed(2)}:1 against the adjacent rendered surface.`],
      };
    }

    const result: Issue[] = [];
    const focusable = [...root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(visible);
    for (const element of focusable) {
      element.focus({ preventScroll: true });
      const style = getComputedStyle(element);
      const outlineWidth = Number.parseFloat(style.outlineWidth);
      const borderWidth = Math.max(...[style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].map(Number.parseFloat));
      const color = outlineWidth >= 2 && style.outlineStyle !== "none" ? style.outlineColor : borderWidth >= 2 ? style.borderColor : "";
      if (!color) {
        result.push({ selector: selectorFor(element), message: "Focusable control has no measurable focus indicator.", evidence: ["Use a visible outline or border at least 2 CSS pixels wide."] });
        continue;
      }
      const issue = issueForColor(element, color, element.parentElement, "Focus indicator");
      if (issue) result.push(issue);
    }

    for (const state of [...root.querySelectorAll("[data-ztothez-design-state-visual]")].filter(visible)) {
      const style = getComputedStyle(state);
      const issue = issueForColor(state, style.color, state, "State indicator");
      if (issue) result.push(issue);
      if (!state.getAttribute("data-ztothez-design-non-color-cue")) {
        result.push({ selector: selectorFor(state), message: "State indicator relies on color without a declared non-color cue.", evidence: ["Add visible text, icon, shape, pattern, value, or position semantics."] });
      }
    }

    for (const chartVisual of [...root.querySelectorAll("[data-ztothez-design-chart-series-visual]")].filter(visible)) {
      const style = getComputedStyle(chartVisual);
      const color = chartVisual.getAttribute("data-ztothez-design-chart-color") ?? style.color;
      const chart = chartVisual.closest("[data-ztothez-design-chart]") ?? chartVisual.parentElement;
      const issue = issueForColor(chartVisual, color, chart, "Chart series");
      if (issue) result.push(issue);
    }

    return result.slice(0, 50);
  });

  appendIssues(findings, "ZTDE-RUNTIME-021", viewport, issues);
}

export async function checkRenderedAssets(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const issues = await page.evaluate(() => {
    type Issue = BrowserIssue;
    const root = document.querySelector('[data-ztothez-design-composition="1.0"]');
    if (!root) return [] as Issue[];
    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      return `${element.tagName.toLowerCase()}[data-ztothez-design-asset]`;
    }
    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 1 && rect.height > 1 && style.display !== "none" && style.visibility !== "hidden";
    }
    const allowedSources = new Set(["original", "user-provided", "generated", "commissioned", "licensed", "open-source", "public-domain"]);
    const allowedFailures = new Set(["hide-decorative", "text-alternative", "placeholder", "retry", "block"]);
    return [...root.querySelectorAll("[data-ztothez-design-asset]")]
      .filter(visible)
      .flatMap<Issue>((asset) => {
        const purpose = asset.getAttribute("data-ztothez-design-asset-purpose")?.trim();
        const source = asset.getAttribute("data-ztothez-design-asset-source") ?? "";
        const rights = asset.getAttribute("data-ztothez-design-asset-rights") ?? "";
        const alternative = asset.getAttribute("data-ztothez-design-asset-alternative") ?? "";
        const failure = asset.getAttribute("data-ztothez-design-asset-failure") ?? "";
        const informativeImageWithoutAlt = asset instanceof HTMLImageElement && alternative !== "decorative" && !asset.alt.trim();
        if (purpose && allowedSources.has(source) && rights === "approved" && alternative && allowedFailures.has(failure) && !informativeImageWithoutAlt) return [];
        return [{
          selector: selectorFor(asset),
          message: "Rendered asset lacks production provenance, alternative, or failure metadata.",
          evidence: [
            `Purpose=${Boolean(purpose)}; source=${JSON.stringify(source)}; rights=${JSON.stringify(rights)}.`,
            `Alternative=${JSON.stringify(alternative)}; failure=${JSON.stringify(failure)}; informative image alt valid=${!informativeImageWithoutAlt}.`,
          ],
        }];
      })
      .slice(0, 30);
  });

  appendIssues(findings, "ZTDE-RUNTIME-022", viewport, issues);
}
