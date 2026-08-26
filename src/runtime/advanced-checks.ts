import type { Page } from "playwright-core";

import type { RuntimeFinding, RuntimeViewport } from "./types.js";

type BrowserIssue = {
  selector?: string;
  severity: "error" | "warning";
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
      severity: issue.severity,
      message: issue.message,
      evidence: issue.evidence,
      viewport: viewport.name,
      ...(issue.selector ? { selector: issue.selector } : {}),
    })),
  );
}

export async function checkTextContrast(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const issues = await page.evaluate(() => {
    type Color = { red: number; green: number; blue: number; alpha: number };
    const colorCanvas = document.createElement("canvas");
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });

    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const className = [...element.classList].find((entry) => /^[a-zA-Z][\w-]*$/.test(entry));
      return `${element.tagName.toLowerCase()}${className ? `.${CSS.escape(className)}` : ""}`;
    }

    function parseColor(value: string): Color | null {
      if (!colorContext) return null;
      colorContext.clearRect(0, 0, 1, 1);
      colorContext.fillStyle = value;
      colorContext.fillRect(0, 0, 1, 1);
      const pixel = colorContext.getImageData(0, 0, 1, 1).data;
      return {
        red: pixel[0]!,
        green: pixel[1]!,
        blue: pixel[2]!,
        alpha: pixel[3]! / 255,
      };
    }

    function composite(foreground: Color, background: Color): Color {
      const alpha = foreground.alpha + background.alpha * (1 - foreground.alpha);
      if (alpha <= 0) return { red: 0, green: 0, blue: 0, alpha: 0 };
      return {
        red:
          (foreground.red * foreground.alpha +
            background.red * background.alpha * (1 - foreground.alpha)) /
          alpha,
        green:
          (foreground.green * foreground.alpha +
            background.green * background.alpha * (1 - foreground.alpha)) /
          alpha,
        blue:
          (foreground.blue * foreground.alpha +
            background.blue * background.alpha * (1 - foreground.alpha)) /
          alpha,
        alpha,
      };
    }

    function effectiveBackground(element: Element): Color | null {
      let current: Element | null = element;
      let accumulated: Color = { red: 0, green: 0, blue: 0, alpha: 0 };
      while (current) {
        const style = getComputedStyle(current);
        if (style.backgroundImage !== "none") return null;
        const layer = parseColor(style.backgroundColor);
        if (!layer) return null;
        accumulated = composite(accumulated, layer);
        if (accumulated.alpha >= 0.999) return accumulated;
        current = current.parentElement;
      }
      return composite(accumulated, { red: 255, green: 255, blue: 255, alpha: 1 });
    }

    function luminance(color: Color): number {
      const channels = [color.red, color.green, color.blue].map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
    }

    function contrast(first: Color, second: Color): number {
      const firstLuminance = luminance(first);
      const secondLuminance = luminance(second);
      const light = Math.max(firstLuminance, secondLuminance);
      const dark = Math.min(firstLuminance, secondLuminance);
      return (light + 0.05) / (dark + 0.05);
    }

    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 1 &&
        rect.height > 1 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number.parseFloat(style.opacity || "1") >= 0.99 &&
        !element.closest('[aria-hidden="true"], [inert]')
      );
    }

    function hasOwnRenderedText(element: Element): boolean {
      if (element.matches("input, select, textarea")) return false;
      return [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
      );
    }

    return [...document.body.querySelectorAll("*")]
      .filter(
        (element) =>
          visible(element) &&
          hasOwnRenderedText(element) &&
          !element.closest("[data-ztothez-design-allow-contrast]"),
      )
      .flatMap<BrowserIssue>((element): BrowserIssue[] => {
        let ancestor: Element | null = element;
        while (ancestor) {
          if (Number.parseFloat(getComputedStyle(ancestor).opacity || "1") < 0.99) return [];
          ancestor = ancestor.parentElement;
        }
        const style = getComputedStyle(element);
        const foreground = parseColor(style.color);
        const background = effectiveBackground(element);
        if (!foreground || !background) return [];
        const renderedForeground = composite(foreground, background);
        const ratio = contrast(renderedForeground, background);
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const required = largeText ? 3 : 4.5;
        if (ratio + 0.01 >= required) return [];
        return [
          {
            selector: selectorFor(element),
            severity: "error" as const,
            message: "Rendered text does not meet the minimum contrast ratio.",
            evidence: [
              `Measured ${ratio.toFixed(2)}:1; required ${required.toFixed(1)}:1 for ${largeText ? "large" : "normal"} text.`,
              `Computed foreground ${style.color}; effective background rgb(${Math.round(background.red)}, ${Math.round(background.green)}, ${Math.round(background.blue)}).`,
              "Use data-ztothez-design-allow-contrast only when a separate verified method covers a background this sampler cannot model.",
            ],
          },
        ];
      })
      .slice(0, 30);
  });

  appendIssues(findings, "ZTDE-RUNTIME-011", viewport, issues);
}

export async function checkTouchTargets(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const issues = await page.evaluate(() => {
    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const name = element.getAttribute("name");
      const role = element.getAttribute("role");
      const type = element.getAttribute("type");
      return `${element.tagName.toLowerCase()}${name ? `[name=${JSON.stringify(name)}]` : ""}${role ? `[role=${JSON.stringify(role)}]` : ""}${type ? `[type=${JSON.stringify(type)}]` : ""}`;
    }

    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 1 &&
        rect.height > 1 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !element.closest('[aria-hidden="true"], [inert]')
      );
    }

    function expandedRect(element: Element): DOMRect {
      const rects = [element.getBoundingClientRect()];
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      ) {
        for (const label of element.labels ?? []) rects.push(label.getBoundingClientRect());
      }
      const wrappingLabel = element.closest("label");
      if (wrappingLabel) rects.push(wrappingLabel.getBoundingClientRect());
      const left = Math.min(...rects.map((rect) => rect.left));
      const right = Math.max(...rects.map((rect) => rect.right));
      const top = Math.min(...rects.map((rect) => rect.top));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      return new DOMRect(left, top, right - left, bottom - top);
    }

    const selector =
      'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"], [role="switch"], [tabindex]:not([tabindex="-1"])';
    return [...document.querySelectorAll(selector)]
      .filter(
        (element) =>
          visible(element) &&
          !element.closest("[data-ztothez-design-allow-small-target]") &&
          !(element instanceof HTMLAnchorElement && getComputedStyle(element).display === "inline"),
      )
      .flatMap<BrowserIssue>((element): BrowserIssue[] => {
        const rect = expandedRect(element);
        const width = Math.round(rect.width * 10) / 10;
        const height = Math.round(rect.height * 10) / 10;
        const buttonLike = element.matches(
          'button, input, select, textarea, [role="button"], [role="switch"]',
        );
        if (width < 24 || height < 24) {
          return [
            {
              selector: selectorFor(element),
              severity: "error" as const,
              message: "Interactive target is smaller than 24 by 24 CSS pixels.",
              evidence: [
                `Effective target size is ${width}px by ${height}px, including an associated label when present.`,
                "Increase the target or label hit area. Use data-ztothez-design-allow-small-target only for a documented standards exception.",
              ],
            },
          ];
        }
        if (buttonLike && (width < 44 || height < 44)) {
          return [
            {
              selector: selectorFor(element),
              severity: "warning" as const,
              message: "Button-like target meets the 24px minimum but is smaller than the 44px touch recommendation.",
              evidence: [`Effective target size is ${width}px by ${height}px.`],
            },
          ];
        }
        return [];
      })
      .slice(0, 30);
  });

  appendIssues(findings, "ZTDE-RUNTIME-012", viewport, issues);
}

export async function checkReflowAndTextResize(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const reflowIssues: BrowserIssue[] = [];
  if (viewport.width >= 640) {
    const reflowWidth = Math.max(320, Math.floor(viewport.width / 2));
    try {
      await page.setViewportSize({ width: reflowWidth, height: viewport.height });
      await page.evaluate(
        () =>
          new Promise<void>((resolveFrame) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())),
          ),
      );
      const issue = await page.evaluate(() => {
        function selectorFor(element: Element): string {
          if (element.id) return `#${CSS.escape(element.id)}`;
          const className = [...element.classList].find((entry) => /^[a-zA-Z][\w-]*$/.test(entry));
          return `${element.tagName.toLowerCase()}${className ? `.${CSS.escape(className)}` : ""}`;
        }
        function visible(element: Element): boolean {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 1 && rect.height > 1 && style.display !== "none" && style.visibility !== "hidden";
        }
        if (document.body.hasAttribute("data-ztothez-design-allow-reflow")) return null;
        const overflow = Math.max(
          0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        if (overflow <= 2) return null;
        const offender = [...document.body.querySelectorAll("*")].find((element) => {
          if (!visible(element) || element.closest("[data-ztothez-design-allow-reflow]")) return false;
          const style = getComputedStyle(element);
          const htmlElement = element as HTMLElement;
          if (
            /auto|scroll/.test(style.overflowX) &&
            htmlElement.scrollWidth > htmlElement.clientWidth
          ) {
            return false;
          }
          let ancestor = element.parentElement;
          while (ancestor && ancestor !== document.body) {
            const ancestorStyle = getComputedStyle(ancestor);
            if (
              /auto|scroll/.test(ancestorStyle.overflowX) &&
              (ancestor as HTMLElement).scrollWidth > (ancestor as HTMLElement).clientWidth
            ) {
              return false;
            }
            ancestor = ancestor.parentElement;
          }
          const rect = element.getBoundingClientRect();
          return rect.left < -1 || rect.right > window.innerWidth + 1;
        });
        if (!offender) return null;
        return {
          selector: selectorFor(offender),
          severity: "error" as const,
          message: "Page requires horizontal scrolling at 200% zoom.",
          evidence: [
            `At an effective ${window.innerWidth}px layout width, the document overflows by ${Math.round(overflow)}px.`,
            "Reflow content into one dimension or keep only intentionally scrollable data regions horizontal.",
          ],
        };
      });
      if (issue) reflowIssues.push(issue);
    } finally {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.evaluate(
        () =>
          new Promise<void>((resolveFrame) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())),
          ),
      );
    }
  }

  const textResizeIssues = await page.evaluate(async () => {
    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const className = [...element.classList].find((entry) => /^[a-zA-Z][\w-]*$/.test(entry));
      return `${element.tagName.toLowerCase()}${className ? `.${CSS.escape(className)}` : ""}`;
    }

    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 1 && rect.height > 1 && style.display !== "none" && style.visibility !== "hidden";
    }

    async function settle(): Promise<void> {
      await new Promise<void>((resolveFrame) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())),
      );
    }

    const results: BrowserIssue[] = [];
    const candidates = [...document.body.querySelectorAll("*")].filter((element) => {
      if (!visible(element) || element.closest("[data-ztothez-design-allow-text-resize]")) return false;
      if (element.matches("script, style, svg, path, canvas, img, video")) return false;
      return (
        [...element.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()),
        ) || element.matches("input, select, textarea")
      );
    });
    const originals = candidates.map((element) => ({
      element: element as HTMLElement,
      style: element.getAttribute("style"),
      fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    }));
    for (const entry of originals) {
      entry.element.style.fontSize = `${entry.fontSize * 2}px`;
    }
    await settle();

    const clipped = candidates
      .filter((element) => {
        const htmlElement = element as HTMLElement;
        const style = getComputedStyle(element);
        const constrained =
          element.matches("button, input, select, textarea") ||
          /hidden|clip/.test(`${style.overflowX} ${style.overflowY}`);
        return (
          constrained &&
          (htmlElement.scrollWidth > htmlElement.clientWidth + 2 ||
            htmlElement.scrollHeight > htmlElement.clientHeight + 2)
        );
      })
      .slice(0, 12);
    const resizedOverflow = Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (resizedOverflow > 2) {
      const edgeCandidate = [...document.body.querySelectorAll("*")]
        .filter(visible)
        .map((element) => ({ element, right: element.getBoundingClientRect().right }))
        .sort((left, right) => right.right - left.right)[0];
      const offender = [...document.body.querySelectorAll("*")].reverse().find((element) => {
        if (!visible(element) || element.closest("[data-ztothez-design-allow-text-resize]")) return false;
        const elementStyle = getComputedStyle(element);
        const htmlElement = element as HTMLElement;
        if (
          /auto|scroll/.test(elementStyle.overflowX) &&
          htmlElement.scrollWidth > htmlElement.clientWidth
        ) {
          return false;
        }
        let ancestor = element.parentElement;
        while (ancestor && ancestor !== document.body) {
          const ancestorStyle = getComputedStyle(ancestor);
          if (
            /auto|scroll/.test(ancestorStyle.overflowX) &&
            (ancestor as HTMLElement).scrollWidth > (ancestor as HTMLElement).clientWidth
          ) {
            return false;
          }
          ancestor = ancestor.parentElement;
        }
        const rect = element.getBoundingClientRect();
        return (
          rect.left < -1 ||
          rect.right > window.innerWidth + 1 ||
          htmlElement.scrollWidth > htmlElement.clientWidth + 2
        );
      });
      if (offender) {
        results.push({
          selector: selectorFor(offender),
          severity: "error",
          message: "Text-only resizing to 200% creates page-level horizontal overflow.",
          evidence: [
            `Document exceeds the viewport by ${Math.round(resizedOverflow)}px after text resizing.`,
            `First non-scroll-contained offender: ${selectorFor(offender)}.`,
            `Root ${document.documentElement.scrollWidth}px/${document.documentElement.clientWidth}px; body ${document.body.scrollWidth}px/${document.body.clientWidth}px.`,
            ...(edgeCandidate
              ? [`Furthest rendered edge: ${selectorFor(edgeCandidate.element)} at ${Math.round(edgeCandidate.right)}px.`]
              : []),
          ],
        });
      }
    }
    for (const element of clipped) {
      const htmlElement = element as HTMLElement;
      results.push({
        selector: selectorFor(element),
        severity: "error",
        message: "Content is clipped when text is resized to 200%.",
        evidence: [
          `Rendered box ${htmlElement.clientWidth}px by ${htmlElement.clientHeight}px; content requires ${htmlElement.scrollWidth}px by ${htmlElement.scrollHeight}px.`,
          "Allow the container to grow or wrap without losing text or controls.",
        ],
      });
    }

    for (const entry of originals) {
      if (entry.style === null) entry.element.removeAttribute("style");
      else entry.element.setAttribute("style", entry.style);
    }
    await settle();
    return results.slice(0, 30);
  });

  appendIssues(findings, "ZTDE-RUNTIME-015", viewport, [
    ...reflowIssues,
    ...textResizeIssues,
  ]);
}

export async function checkReducedMotion(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const issues = await page.evaluate(() => {
    const motionProperties = new Set([
      "transform",
      "translate",
      "rotate",
      "scale",
      "left",
      "right",
      "top",
      "bottom",
      "inset",
      "offset",
      "offsetDistance",
      "offsetPath",
    ]);

    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const className = [...element.classList].find((entry) => /^[a-zA-Z][\w-]*$/.test(entry));
      return `${element.tagName.toLowerCase()}${className ? `.${CSS.escape(className)}` : ""}`;
    }

    function seconds(value: string): number {
      const number = Number.parseFloat(value);
      return value.trim().endsWith("ms") ? number / 1000 : number;
    }

    const results: BrowserIssue[] = [];
    for (const element of [...document.body.querySelectorAll("*")]) {
      if (element.closest("[data-ztothez-design-essential-motion]")) continue;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (rect.width <= 1 || rect.height <= 1 || style.display === "none" || style.visibility === "hidden") {
        continue;
      }
      const animations = element.getAnimations().filter((animation) => animation.playState === "running");
      for (const animation of animations) {
        const effect = animation.effect;
        if (!(effect instanceof KeyframeEffect)) continue;
        const properties = new Set(effect.getKeyframes().flatMap((frame) => Object.keys(frame)));
        if (![...properties].some((property) => motionProperties.has(property))) continue;
        const timing = effect.getComputedTiming();
        const duration = typeof timing.duration === "number" ? timing.duration : 0;
        if (duration <= 100) continue;
        results.push({
          selector: selectorFor(element),
          severity: "error",
          message: "Transform or positional animation remains active with reduced motion enabled.",
          evidence: [
            `Animation duration is ${Math.round(duration)}ms and properties include ${[...properties].filter((property) => motionProperties.has(property)).join(", ")}.`,
            "Disable or substantially reduce nonessential motion under prefers-reduced-motion. Mark only essential, reviewed motion with data-ztothez-design-essential-motion.",
          ],
        });
        break;
      }

      const transitionProperties = style.transitionProperty.split(",").map((value) => value.trim());
      const transitionDurations = style.transitionDuration.split(",").map(seconds);
      const longMotionTransition = transitionProperties.find((property, index) => {
        const duration = transitionDurations[index % Math.max(transitionDurations.length, 1)] ?? 0;
        return duration > 0.2 && (property === "all" || motionProperties.has(property));
      });
      if (longMotionTransition) {
        results.push({
          selector: selectorFor(element),
          severity: "warning",
          message: "A long motion-capable transition remains configured with reduced motion enabled.",
          evidence: [
            `Computed transition property ${longMotionTransition} exceeds 200ms.`,
            "Use a reduced-motion media query to remove transform and positional transitions.",
          ],
        });
      }
      if (results.length >= 30) break;
    }

    const smoothScroll = [document.documentElement, document.body].find(
      (element) => getComputedStyle(element).scrollBehavior === "smooth",
    );
    if (smoothScroll && !smoothScroll.hasAttribute("data-ztothez-design-essential-motion")) {
      results.push({
        selector: selectorFor(smoothScroll),
        severity: "warning",
        message: "Smooth scrolling remains enabled with reduced motion enabled.",
        evidence: ["Set scroll-behavior to auto in prefers-reduced-motion contexts."],
      });
    }
    return results.slice(0, 30);
  });

  appendIssues(findings, "ZTDE-RUNTIME-016", viewport, issues);
}
