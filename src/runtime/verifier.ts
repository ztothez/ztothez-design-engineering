import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import { chromium, type Page } from "playwright-core";

import {
  checkRenderedAssets,
  checkRenderedVisualContrast,
  checkVisualComposition,
} from "./composition-checks.js";
import {
  checkReducedMotion,
  checkReflowAndTextResize,
  checkTextContrast,
  checkTouchTargets,
} from "./advanced-checks.js";
import {
  addInterfaceCoverageFindings,
  checkChartContracts,
  checkInterfaceTrust,
  createInterfaceCoverage,
  type InterfaceCoverage,
} from "./interface-checks.js";
import {
  DEFAULT_NAVIGATION_TIMEOUT_MS,
  DEFAULT_RUNTIME_COLOR_SCHEMES,
  DEFAULT_RUNTIME_VIEWPORTS,
  DEFAULT_SETTLE_MS,
  MAX_JOURNEY_STEPS,
  MAX_RUNTIME_JOURNEYS,
  resolveChromiumCdpUrl,
  resolveChromiumPath,
  validateRuntimeUrl,
  validateColorSchemes,
  validateViewports,
} from "./policy.js";
import { formatRuntimeReport } from "./report.js";
import { runtimeExpectedNetworkSchema, runtimeScreenshotBaselineSchema } from "./schema.js";
import type {
  RuntimeExpectedNetwork,
  RuntimeExpectedNetworkObservation,
  RuntimeFinding,
  RuntimeJourney,
  RuntimeJourneyResult,
  RuntimeReport,
  RuntimeScreenshot,
  RuntimeScreenshotRegression,
  RuntimeSeverity,
  RuntimeVerificationOptions,
  RuntimeViewport,
} from "./types.js";

const RUNTIME_REPORT_VERSION = "1.1.0";
const MAX_DOWNLOAD_FALLBACK_BYTES = 20 * 1024 * 1024;
const CAPTURED_BLOB_STORE = "__ztothezDesignCapturedBlobsV1";

type FindingContext = {
  viewport?: string;
  journey?: string;
};

type ExpectedNetworkTracker = RuntimeExpectedNetwork & {
  occurrences: number;
  evidence: string[];
};

function createExpectedNetworkTrackers(
  policies: RuntimeExpectedNetwork[],
): ExpectedNetworkTracker[] {
  const validated = runtimeExpectedNetworkSchema.array().max(20).parse(policies);
  const ids = validated.map((policy) => policy.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Expected network policy IDs must be unique");
  }
  return validated.map((policy) => ({ ...policy, occurrences: 0, evidence: [] }));
}

function matchingResponsePolicy(
  trackers: ExpectedNetworkTracker[],
  method: string,
  url: string,
  status: number,
): ExpectedNetworkTracker | undefined {
  return trackers.find(
    (policy) =>
      policy.status === status && policy.method === method && url.includes(policy.urlIncludes),
  );
}

function matchingRequestFailurePolicy(
  trackers: ExpectedNetworkTracker[],
  method: string,
  url: string,
): ExpectedNetworkTracker | undefined {
  return trackers.find(
    (policy) =>
      policy.allowRequestFailure === true &&
      policy.method === method &&
      url.includes(policy.urlIncludes),
  );
}

function recordExpectedNetwork(
  policy: ExpectedNetworkTracker,
  evidence: string,
): void {
  policy.occurrences += 1;
  policy.evidence.push(evidence);
}

function safeName(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized.slice(0, 80) || "evidence";
}

function jsonValueAtPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || !(segment in current)) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, value);
}

async function installBlobDownloadCapture(page: Page): Promise<void> {
  await page.addInitScript(
    ({ storeName, retentionMs }) => {
      type CaptureScope = typeof globalThis & {
        [key: string]: Map<string, Blob> | undefined;
      };
      const scope = globalThis as CaptureScope;
      if (scope[storeName]) return;

      const blobs = new Map<string, Blob>();
      Object.defineProperty(scope, storeName, {
        configurable: false,
        enumerable: false,
        value: blobs,
        writable: false,
      });

      const createObjectUrl = URL.createObjectURL.bind(URL);
      const revokeObjectUrl = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (object: Blob | MediaSource): string => {
        const url = createObjectUrl(object);
        if (object instanceof Blob) blobs.set(url, object);
        return url;
      };
      URL.revokeObjectURL = (url: string): void => {
        revokeObjectUrl(url);
        globalThis.setTimeout(() => blobs.delete(url), retentionMs);
      };
    },
    { storeName: CAPTURED_BLOB_STORE, retentionMs: 60_000 },
  );
}

async function capturedBlobBody(page: Page, downloadUrl: string): Promise<Buffer | undefined> {
  if (!/^blob:/i.test(downloadUrl)) return undefined;
  const bytes = await page.evaluate(
    async ({ url, storeName, maximumBytes }) => {
      type CaptureScope = typeof globalThis & {
        [key: string]: Map<string, Blob> | undefined;
      };
      const blob = (globalThis as CaptureScope)[storeName]?.get(url);
      if (!blob) return undefined;
      if (blob.size > maximumBytes) {
        throw new Error("Captured Blob exceeds the 20 MB evidence limit");
      }
      return [...new Uint8Array(await blob.arrayBuffer())];
    },
    {
      url: downloadUrl,
      storeName: CAPTURED_BLOB_STORE,
      maximumBytes: MAX_DOWNLOAD_FALLBACK_BYTES,
    },
  );
  return bytes ? Buffer.from(bytes) : undefined;
}

async function downloadFallbackBody(
  page: Page,
  downloadUrl: string,
  timeoutMs: number,
): Promise<Buffer> {
  if (/^https?:/i.test(downloadUrl)) {
    const response = await page.request.get(downloadUrl, { timeout: timeoutMs });
    if (!response.ok()) {
      throw new Error(`Download fallback request returned ${response.status()}`);
    }
    const body = await response.body();
    if (body.byteLength > MAX_DOWNLOAD_FALLBACK_BYTES) {
      throw new Error("Download fallback exceeded the 20 MB evidence limit");
    }
    return body;
  }
  if (/^data:/i.test(downloadUrl)) {
    const match = /^data:([^,]*),(.*)$/s.exec(downloadUrl);
    if (!match) throw new Error("Downloaded data URL is malformed");
    const metadata = match[1] ?? "";
    const payload = match[2] ?? "";
    const body = /;base64(?:;|$)/i.test(metadata)
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8");
    if (body.byteLength > MAX_DOWNLOAD_FALLBACK_BYTES) {
      throw new Error("Download fallback exceeded the 20 MB evidence limit");
    }
    return body;
  }
  if (/^blob:/i.test(downloadUrl)) {
    const bytes = await page.evaluate(
      async ({ url, maximumBytes }) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Blob download returned ${response.status}`);
        const body = await response.arrayBuffer();
        if (body.byteLength > maximumBytes) throw new Error("Blob download exceeds evidence limit");
        return [...new Uint8Array(body)];
      },
      { url: downloadUrl, maximumBytes: MAX_DOWNLOAD_FALLBACK_BYTES },
    );
    return Buffer.from(bytes);
  }
  throw new Error(`Unsupported download fallback URL: ${downloadUrl.split(":", 1)[0] || "unknown"}`);
}

function addFinding(
  findings: RuntimeFinding[],
  checkId: string,
  severity: RuntimeSeverity,
  message: string,
  evidence: string[],
  context: FindingContext,
  selector?: string,
): void {
  findings.push({ checkId, severity, message, evidence, ...context, ...(selector ? { selector } : {}) });
}

function attachDiagnostics(
  page: Page,
  findings: RuntimeFinding[],
  context: FindingContext,
  expectedNetwork: ExpectedNetworkTracker[],
): void {
  page.on("console", (message) => {
    if (message.type() !== "error" && message.type() !== "warning") {
      return;
    }
    const locationUrl = message.location().url;
    const networkConsoleMessage = /failed to load resource|server responded with a status/i.test(
      message.text(),
    );
    if (
      networkConsoleMessage &&
      locationUrl &&
      expectedNetwork.some((policy) => locationUrl.includes(policy.urlIncludes))
    ) {
      return;
    }
    addFinding(
      findings,
      "ZTDE-RUNTIME-002",
      message.type() === "error" ? "error" : "warning",
      `Browser console ${message.type()}: ${message.text()}`,
      [`Source: ${message.location().url || "unknown"}:${message.location().lineNumber ?? 0}.`],
      context,
    );
  });

  page.on("pageerror", (error) => {
    addFinding(
      findings,
      "ZTDE-RUNTIME-002",
      "error",
      `Uncaught page error: ${error.message}`,
      [error.stack ?? error.message],
      context,
    );
  });

  page.on("requestfailed", (request) => {
    const expected = matchingRequestFailurePolicy(
      expectedNetwork,
      request.method(),
      request.url(),
    );
    if (expected) {
      recordExpectedNetwork(
        expected,
        `${request.method()} ${request.url()} failed: ${request.failure()?.errorText ?? "unknown"}`,
      );
      return;
    }
    const resourceType = request.resourceType();
    addFinding(
      findings,
      "ZTDE-RUNTIME-003",
      resourceType === "document" || resourceType === "fetch" || resourceType === "xhr"
        ? "error"
        : "warning",
      `Request failed: ${request.method()} ${request.url()}`,
      [`Resource type: ${resourceType}.`, `Failure: ${request.failure()?.errorText ?? "unknown"}.`],
      context,
    );
  });

  page.on("response", (response) => {
    if (response.status() < 400) {
      return;
    }
    const expected = matchingResponsePolicy(
      expectedNetwork,
      response.request().method(),
      response.url(),
      response.status(),
    );
    if (expected) {
      recordExpectedNetwork(
        expected,
        `${response.request().method()} ${response.url()} returned ${response.status()}`,
      );
      return;
    }
    const resourceType = response.request().resourceType();
    addFinding(
      findings,
      "ZTDE-RUNTIME-003",
      resourceType === "document" || resourceType === "fetch" || resourceType === "xhr"
        ? "error"
        : "warning",
      `HTTP ${response.status()} from ${response.url()}`,
      [`Resource type: ${resourceType}.`, `Status text: ${response.statusText() || "unavailable"}.`],
      context,
    );
  });
}

function assertSameOrigin(page: Page, expectedOrigin: string): void {
  const currentUrl = new URL(page.url());
  if (currentUrl.origin !== expectedOrigin) {
    throw new Error(
      `Navigation left the allowed origin: expected ${expectedOrigin}, received ${currentUrl.origin}`,
    );
  }
}

async function checkOverflow(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const result = await page.evaluate(() => {
    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const parts: string[] = [];
      let current: Element | null = element;
      while (current && parts.length < 4 && current !== document.body) {
        let part = current.tagName.toLowerCase();
        const className = [...current.classList].find((name) => /^[a-zA-Z][\w-]*$/.test(name));
        if (className) part += `.${CSS.escape(className)}`;
        parts.unshift(part);
        current = current.parentElement;
      }
      return parts.join(" > ");
    }

    function hasScrollContainer(element: Element): boolean {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        if (/auto|scroll/.test(style.overflowX) && parent.scrollWidth > parent.clientWidth) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    }

    function isVisible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 1 &&
        rect.height > 1 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        element.getAttribute("aria-hidden") !== "true"
      );
    }

    function isSemanticCandidate(element: Element): boolean {
      const interactiveSelector =
        'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"]';
      if (element.matches(interactiveSelector)) return true;
      if (element.closest(interactiveSelector)) return false;
      return element.children.length === 0 && (element.textContent?.trim().length ?? 0) > 0;
    }

    function clippedByAncestor(element: Element) {
      const elementRect = element.getBoundingClientRect();
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        if (
          element.hasAttribute("data-ztothez-design-allow-clipping") ||
          ancestor.hasAttribute("data-ztothez-design-allow-clipping")
        ) {
          return null;
        }
        const style = getComputedStyle(ancestor);
        if (style.overflowX === "hidden" || style.overflowX === "clip") {
          const ancestorRect = ancestor.getBoundingClientRect();
          const clippedLeft = ancestorRect.left - elementRect.left;
          const clippedRight = elementRect.right - ancestorRect.right;
          const overlapsAncestor =
            elementRect.right > ancestorRect.left + 2 && elementRect.left < ancestorRect.right - 2;
          const overlapsViewport = elementRect.right > 2 && elementRect.left < window.innerWidth - 2;
          if (
            ancestorRect.width > 1 &&
            overlapsAncestor &&
            overlapsViewport &&
            (clippedLeft > 2 || clippedRight > 2)
          ) {
            return {
              selector: selectorFor(element),
              ancestor: selectorFor(ancestor),
              left: Math.round(elementRect.left),
              right: Math.round(elementRect.right),
              clipLeft: Math.round(ancestorRect.left),
              clipRight: Math.round(ancestorRect.right),
            };
          }
        }
        ancestor = ancestor.parentElement;
      }
      return null;
    }

    const root = document.documentElement;
    const globalOverflow = Math.max(0, root.scrollWidth - root.clientWidth);
    const offenders = [...document.body.querySelectorAll("*")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || rect.width < 1) return false;
        if (hasScrollContainer(element)) return false;
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: selectorFor(element),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      });
    const clipped = [...document.body.querySelectorAll("*")]
      .filter((element) => isVisible(element) && isSemanticCandidate(element))
      .map(clippedByAncestor)
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .filter(
        (entry, index, entries) =>
          entries.findIndex(
            (candidate) =>
              candidate.selector === entry.selector && candidate.ancestor === entry.ancestor,
          ) === index,
      )
      .slice(0, 12);
    return {
      globalOverflow,
      documentWidth: root.scrollWidth,
      viewportWidth: root.clientWidth,
      offenders,
      clipped,
    };
  });

  if (result.globalOverflow > 1) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-004",
      "error",
      `Page overflows horizontally by ${result.globalOverflow}px at ${viewport.width}px.`,
      [
        `Document width: ${result.documentWidth}px; viewport width: ${result.viewportWidth}px.`,
        ...result.offenders.map(
          (offender) =>
            `${offender.selector}: left ${offender.left}px, right ${offender.right}px, width ${offender.width}px.`,
        ),
      ],
      { viewport: viewport.name },
      result.offenders[0]?.selector,
    );
  }

  for (const clipped of result.clipped) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-004",
      "error",
      "Visible semantic content is clipped by an overflow-hidden ancestor.",
      [
        `${clipped.selector}: left ${clipped.left}px, right ${clipped.right}px.`,
        `${clipped.ancestor}: clipping bounds ${clipped.clipLeft}px to ${clipped.clipRight}px.`,
        "Add data-ztothez-design-allow-clipping only when clipping this content is intentional and verified.",
      ],
      { viewport: viewport.name },
      clipped.selector,
    );
  }
}

async function checkLayoutCollisions(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const result = await page.evaluate(async () => {
    type Collision = {
      first: string;
      second: string;
      width: number;
      height: number;
      scrollY?: number;
    };

    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const parts: string[] = [];
      let current: Element | null = element;
      while (current && parts.length < 4 && current !== document.body) {
        let part = current.tagName.toLowerCase();
        const className = [...current.classList].find((name) => /^[a-zA-Z][\w-]*$/.test(name));
        if (className) part += `.${CSS.escape(className)}`;
        parts.unshift(part);
        current = current.parentElement;
      }
      return parts.join(" > ");
    }

    function isVisible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 1 &&
        rect.height > 1 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number.parseFloat(style.opacity || "1") > 0.01 &&
        element.getAttribute("aria-hidden") !== "true"
      );
    }

    function allowsOverlap(element: Element): boolean {
      return Boolean(element.closest("[data-ztothez-design-allow-overlap]"));
    }

    function independent(first: Element, second: Element): boolean {
      return !first.contains(second) && !second.contains(first);
    }

    function intersection(first: DOMRect, second: DOMRect) {
      const left = Math.max(first.left, second.left, 0);
      const right = Math.min(first.right, second.right, window.innerWidth);
      const top = Math.max(first.top, second.top, 0);
      const bottom = Math.min(first.bottom, second.bottom, window.innerHeight);
      return { left, right, top, bottom, width: right - left, height: bottom - top };
    }

    function topElementInIntersection(first: Element, second: Element, overlap: ReturnType<typeof intersection>) {
      const x = overlap.left + overlap.width / 2;
      const y = overlap.top + overlap.height / 2;
      const top = document.elementFromPoint(x, y);
      if (!top) return null;
      if (first === top || first.contains(top)) return first;
      if (second === top || second.contains(top)) return second;
      return null;
    }

    const interactiveSelector =
      'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"], [role="switch"], [tabindex]:not([tabindex="-1"])';
    const interactive = [...document.querySelectorAll(interactiveSelector)].filter(
      (element) => isVisible(element) && !allowsOverlap(element),
    );
    const interactiveCollisions: Collision[] = [];
    for (let firstIndex = 0; firstIndex < interactive.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < interactive.length; secondIndex += 1) {
        const first = interactive[firstIndex]!;
        const second = interactive[secondIndex]!;
        if (!independent(first, second)) continue;
        const overlap = intersection(first.getBoundingClientRect(), second.getBoundingClientRect());
        if (overlap.width <= 3 || overlap.height <= 3 || overlap.width * overlap.height < 36) continue;
        if (!topElementInIntersection(first, second, overlap)) continue;
        interactiveCollisions.push({
          first: selectorFor(first),
          second: selectorFor(second),
          width: Math.round(overlap.width),
          height: Math.round(overlap.height),
        });
        if (interactiveCollisions.length >= 12) break;
      }
      if (interactiveCollisions.length >= 12) break;
    }

    const originalScrollY = window.scrollY;
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const scrollPositions = [...new Set([0, maximumScroll * 0.33, maximumScroll * 0.66, maximumScroll])]
      .map((value) => Math.round(value))
      .filter((value) => value >= 0);
    const occlusions: Collision[] = [];
    const semanticSelector = `${interactiveSelector}, h1, h2, h3, h4, h5, h6, p, li, td, th, label, [role="status"], [role="alert"]`;

    for (const scrollY of scrollPositions) {
      window.scrollTo(0, scrollY);
      await new Promise<void>((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame())));
      const occluders = [...document.body.querySelectorAll("*")].filter((element) => {
        if (!isVisible(element) || allowsOverlap(element)) return false;
        if (element.closest('[role="dialog"], [aria-modal="true"]')) return false;
        const style = getComputedStyle(element);
        if (style.position !== "fixed" && style.position !== "sticky") return false;
        const rect = element.getBoundingClientRect();
        const viewportArea = window.innerWidth * window.innerHeight;
        return (
          (rect.width * rect.height) / viewportArea >= 0.2 ||
          (rect.width / window.innerWidth >= 0.9 && rect.height / window.innerHeight >= 0.25)
        );
      });
      const targets = [...document.querySelectorAll(semanticSelector)].filter(
        (element) =>
          isVisible(element) &&
          !allowsOverlap(element) &&
          !element.closest('[inert], [aria-hidden="true"]'),
      );

      for (const occluder of occluders) {
        for (const target of targets) {
          if (!independent(occluder, target)) continue;
          const overlap = intersection(occluder.getBoundingClientRect(), target.getBoundingClientRect());
          if (overlap.width <= 4 || overlap.height <= 4 || overlap.width * overlap.height < 64) continue;
          if (topElementInIntersection(occluder, target, overlap) !== occluder) continue;
          occlusions.push({
            first: selectorFor(occluder),
            second: selectorFor(target),
            width: Math.round(overlap.width),
            height: Math.round(overlap.height),
            scrollY,
          });
          if (occlusions.length >= 12) break;
        }
        if (occlusions.length >= 12) break;
      }
      if (occlusions.length >= 12) break;
    }

    window.scrollTo(0, originalScrollY);
    await new Promise<void>((resolveFrame) => requestAnimationFrame(() => resolveFrame()));
    return { interactiveCollisions, occlusions };
  });

  for (const collision of result.interactiveCollisions) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-010",
      "error",
      "Independent interactive controls overlap in the rendered layout.",
      [
        `${collision.first} overlaps ${collision.second} by ${collision.width}px by ${collision.height}px.`,
        "Recompose the layout or use data-ztothez-design-allow-overlap only for an intentional, verified interaction.",
      ],
      { viewport: viewport.name },
      collision.first,
    );
  }

  for (const collision of result.occlusions) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-010",
      "error",
      "Oversized fixed or sticky UI occludes semantic content while scrolling.",
      [
        `${collision.first} covers ${collision.second} by ${collision.width}px by ${collision.height}px at scrollY ${collision.scrollY}px.`,
        "Reduce the sticky region, reserve layout space, change the mobile navigation pattern, or annotate a verified intentional overlap.",
      ],
      { viewport: viewport.name },
      collision.first,
    );
  }
}

async function checkAccessibleNames(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const issues = await page.evaluate(() => {
    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const name = element.getAttribute("name");
      if (name) return `${element.tagName.toLowerCase()}[name=${JSON.stringify(name)}]`;
      const className = [...element.classList].find((entry) => /^[a-zA-Z][\w-]*$/.test(entry));
      return `${element.tagName.toLowerCase()}${className ? `.${CSS.escape(className)}` : ""}`;
    }

    function labelledByText(element: Element): string {
      return (element.getAttribute("aria-labelledby") ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ")
        .trim();
    }

    return [
      ...document.querySelectorAll(
        'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"]',
      ),
    ]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      })
      .filter((element) => {
        const label = element.getAttribute("aria-label")?.trim();
        const labelledBy = labelledByText(element);
        const text = element.textContent?.trim();
        const title = element.getAttribute("title")?.trim();
        const imageAlt = element.querySelector("img[alt]")?.getAttribute("alt")?.trim();
        const inputLabel =
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement
            ? (element.labels?.[0]?.textContent?.trim() ?? "")
            : "";
        return !label && !labelledBy && !text && !title && !imageAlt && !inputLabel;
      })
      .slice(0, 20)
      .map((element) => selectorFor(element));
  });

  for (const selector of issues) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-005",
      "error",
      "Rendered interactive control has no detectable accessible name.",
      ["No visible text, associated label, aria-label, aria-labelledby, title, or descendant image alt was found."],
      { viewport: viewport.name },
      selector,
    );
  }
}

async function checkKeyboard(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const overview = await page.evaluate(() => {
    const modal = document.querySelector('[aria-modal="true"], dialog[open]');
    const scope = modal ?? document;
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 1 &&
        rect.height > 1 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !element.closest('[aria-hidden="true"], [inert], nextjs-portal, [data-ztothez-design-runtime-ignore]')
      );
    }
    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const name = element.getAttribute("name");
      return `${element.tagName.toLowerCase()}${name ? `[name=${JSON.stringify(name)}]` : ""}`;
    }
    const focusables = [...scope.querySelectorAll(selector)].filter(visible);
    const positiveTabindex = focusables
      .filter((element) => Number.parseInt(element.getAttribute("tabindex") ?? "0", 10) > 0)
      .map(selectorFor)
      .slice(0, 12);
    return { focusableCount: focusables.length, positiveTabindex, modalOpen: Boolean(modal) };
  });
  if (overview.focusableCount === 0) return;

  for (const selector of overview.positiveTabindex) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-014",
      "warning",
      "Positive tabindex overrides the document's natural keyboard order.",
      [
        "Use DOM order and tabindex=0 so keyboard navigation follows the same logical sequence as the interface.",
      ],
      { viewport: viewport.name },
      selector,
    );
  }

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const focusedSelectors = new Set<string>();
  const focusedIndexes = new Set<number>();
  let visibleFocusCount = 0;
  let previousIndex: number | undefined;
  let trapDetected = false;
  const attempts = Math.min(overview.focusableCount + 2, 50);

  for (let index = 0; index < attempts; index += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body || element === document.documentElement) return null;
      if (element.matches("nextjs-portal") || element.closest("[data-ztothez-design-runtime-ignore]")) return null;
      const modal = document.querySelector('[aria-modal="true"], dialog[open]');
      const scope = modal ?? document;
      const focusableSelector =
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
      const visibleFocusables = [...scope.querySelectorAll(focusableSelector)].filter((candidate) => {
        const rect = candidate.getBoundingClientRect();
        const style = getComputedStyle(candidate);
        return (
          rect.width > 1 &&
          rect.height > 1 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          !candidate.closest('[aria-hidden="true"], [inert], nextjs-portal, [data-ztothez-design-runtime-ignore]')
        );
      });
      const selector = element.id
        ? `#${CSS.escape(element.id)}`
        : `${element.tagName.toLowerCase()}${element.getAttribute("name") ? `[name=${JSON.stringify(element.getAttribute("name"))}]` : ""}`;
      const focusedStyle = getComputedStyle(element);
      const focusedValues = {
        outline: focusedStyle.outline,
        boxShadow: focusedStyle.boxShadow,
        borderColor: focusedStyle.borderColor,
        backgroundColor: focusedStyle.backgroundColor,
        textDecoration: focusedStyle.textDecoration,
      };
      element.blur();
      const blurredStyle = getComputedStyle(element);
      const blurredValues = {
        outline: blurredStyle.outline,
        boxShadow: blurredStyle.boxShadow,
        borderColor: blurredStyle.borderColor,
        backgroundColor: blurredStyle.backgroundColor,
        textDecoration: blurredStyle.textDecoration,
      };
      element.focus();
      const changed = Object.keys(focusedValues).some(
        (key) =>
          focusedValues[key as keyof typeof focusedValues] !==
          blurredValues[key as keyof typeof blurredValues],
      );
      const browserOutline = focusedStyle.outlineStyle !== "none" && focusedStyle.outlineWidth !== "0px";
      const rect = element.getBoundingClientRect();
      const centerX = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
      const centerY = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));
      let occluder: string | undefined;
      let occlusionReason: string | undefined;
      if (!element.closest("[data-ztothez-design-allow-focus-occlusion]")) {
        if (
          rect.left + rect.width / 2 < 0 ||
          rect.left + rect.width / 2 > window.innerWidth ||
          rect.top + rect.height / 2 < 0 ||
          rect.top + rect.height / 2 > window.innerHeight
        ) {
          occlusionReason = "Focused control center is outside the visible viewport.";
        } else {
          const top = document.elementFromPoint(centerX, centerY);
          if (top && top !== element && !element.contains(top) && !top.contains(element)) {
            let layer: Element | null = top;
            while (layer && layer !== document.body) {
              const position = getComputedStyle(layer).position;
              if (position === "fixed" || position === "sticky") {
                occluder = layer.id
                  ? `#${CSS.escape(layer.id)}`
                  : layer.tagName.toLowerCase();
                occlusionReason = `Focused control center is covered by ${position} element ${occluder}.`;
                break;
              }
              layer = layer.parentElement;
            }
          }
        }
      }
      return {
        selector,
        domIndex: visibleFocusables.indexOf(element),
        visibleFocus: changed || browserOutline,
        occluder,
        occlusionReason,
      };
    });
    if (!focused) continue;
    focusedSelectors.add(focused.selector);
    if (focused.visibleFocus) visibleFocusCount += 1;
    if (focused.occlusionReason) {
      addFinding(
        findings,
        "ZTDE-RUNTIME-013",
        "error",
        "Keyboard focus is hidden or centered beneath fixed or sticky content.",
        [
          focused.occlusionReason,
          "Reserve scroll padding, adjust sticky geometry, or move focus so the focused control and indicator remain visible.",
        ],
        { viewport: viewport.name },
        focused.selector,
      );
    }
    if (focused.domIndex >= 0) {
      const repeatedBeforeCompletion =
        focusedIndexes.has(focused.domIndex) && focusedIndexes.size < overview.focusableCount;
      const focusDidNotAdvance =
        previousIndex === focused.domIndex && overview.focusableCount > 1;
      if (!overview.modalOpen && (repeatedBeforeCompletion || focusDidNotAdvance)) {
        addFinding(
          findings,
          "ZTDE-RUNTIME-014",
          "error",
          "Keyboard traversal repeated focus before reaching all visible controls.",
          [
            `Reached ${focusedIndexes.size} of ${overview.focusableCount} visible controls before focus repeated at ${focused.selector}.`,
            "Remove Tab interception or focus redirection that prevents users from reaching the remaining controls.",
          ],
          { viewport: viewport.name },
          focused.selector,
        );
        trapDetected = true;
        break;
      }
      focusedIndexes.add(focused.domIndex);
      previousIndex = focused.domIndex;
    }
  }

  if (focusedSelectors.size === 0) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-006",
      "error",
      "Interactive controls exist but Tab did not reach a control.",
      [`Focusable DOM query found ${overview.focusableCount} visible controls.`],
      { viewport: viewport.name },
    );
  } else if (visibleFocusCount === 0 && !trapDetected) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-006",
      "warning",
      "Keyboard traversal reached controls without a detectable visual focus change.",
      [`Sampled ${focusedSelectors.size} unique controls.`],
      { viewport: viewport.name },
      [...focusedSelectors][0],
    );
  }
}

async function checkMedia(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const media = await page.evaluate(() => {
    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      return element.tagName.toLowerCase();
    }
    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 2 && rect.height > 2 && style.display !== "none" && style.visibility !== "hidden";
    }

    const brokenImages = [...document.images]
      .filter((image) => visible(image) && image.complete && image.naturalWidth === 0)
      .map(selectorFor);
    const unavailableVideos = [...document.querySelectorAll("video")]
      .filter((video) => visible(video) && video.readyState === HTMLMediaElement.HAVE_NOTHING && !video.poster)
      .map(selectorFor);
    const blankCanvases = [...document.querySelectorAll("canvas")]
      .filter((canvas) => visible(canvas) && !canvas.hasAttribute("data-ztothez-design-allow-blank"))
      .flatMap((canvas) => {
        try {
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context || canvas.width === 0 || canvas.height === 0) return [];
          const width = Math.min(canvas.width, 32);
          const height = Math.min(canvas.height, 32);
          const sample = document.createElement("canvas");
          sample.width = width;
          sample.height = height;
          const sampleContext = sample.getContext("2d", { willReadFrequently: true });
          if (!sampleContext) return [];
          sampleContext.drawImage(canvas, 0, 0, width, height);
          const pixels = sampleContext.getImageData(0, 0, width, height).data;
          const colors = new Set<string>();
          for (let index = 0; index < pixels.length; index += 4) {
            colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]},${pixels[index + 3]}`);
            if (colors.size > 1) return [];
          }
          return [selectorFor(canvas)];
        } catch {
          return [];
        }
      });
    const bodyText = document.body.innerText.trim();
    const visibleMediaCount = [...document.querySelectorAll("img, canvas, video, svg")].filter(visible).length;
    return { brokenImages, unavailableVideos, blankCanvases, pageAppearsBlank: bodyText.length === 0 && visibleMediaCount === 0 };
  });

  for (const selector of media.brokenImages) {
    addFinding(findings, "ZTDE-RUNTIME-007", "error", "Visible image failed to render.", ["naturalWidth is zero after loading."], { viewport: viewport.name }, selector);
  }
  for (const selector of media.unavailableVideos) {
    addFinding(findings, "ZTDE-RUNTIME-007", "warning", "Visible video has no loaded media or poster.", ["Video readyState remained HAVE_NOTHING."], { viewport: viewport.name }, selector);
  }
  for (const selector of media.blankCanvases) {
    addFinding(findings, "ZTDE-RUNTIME-007", "warning", "Visible 2D canvas contains only one sampled pixel value.", ["A 32 by 32 sample did not contain visual variation. Add data-ztothez-design-allow-blank only when blank is an intentional state."], { viewport: viewport.name }, selector);
  }
  if (media.pageAppearsBlank) {
    addFinding(findings, "ZTDE-RUNTIME-007", "error", "Rendered page appears blank.", ["No visible text or media was detected."], { viewport: viewport.name });
  }
}

async function captureScreenshot(
  page: Page,
  outputDirectory: string,
  name: string,
  viewport: RuntimeViewport,
  screenshots: RuntimeScreenshot[],
  dynamicSelectors: string[],
): Promise<string> {
  const screenshotPath = join(outputDirectory, `${safeName(name)}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    animations: "disabled",
    mask: dynamicSelectors.map((selector) => page.locator(selector)),
    maskColor: "#7f7f7f",
  });
  const sha256 = createHash("sha256").update(await readFile(screenshotPath)).digest("hex");
  screenshots.push({
    name,
    path: screenshotPath,
    width: viewport.width,
    height: viewport.height,
    fullPage: true,
    sha256,
    dynamicSelectors,
  });
  return screenshotPath;
}

async function checkRenderedPage(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
  interfaceCoverage: InterfaceCoverage,
  journey?: string,
): Promise<void> {
  const findingStart = findings.length;
  await checkOverflow(page, viewport, findings);
  await checkLayoutCollisions(page, viewport, findings);
  await checkTextContrast(page, viewport, findings);
  await checkTouchTargets(page, viewport, findings);
  await checkAccessibleNames(page, viewport, findings);
  await checkKeyboard(page, viewport, findings);
  await checkReflowAndTextResize(page, viewport, findings);
  await checkReducedMotion(page, viewport, findings);
  await checkMedia(page, viewport, findings);
  await checkInterfaceTrust(page, viewport, findings, interfaceCoverage);
  await checkChartContracts(page, viewport, findings);
  await checkVisualComposition(page, viewport, findings);
  await checkRenderedVisualContrast(page, viewport, findings);
  await checkRenderedAssets(page, viewport, findings);
  if (journey) {
    for (let index = findingStart; index < findings.length; index += 1) {
      findings[index]!.journey ??= journey;
    }
  }
}

async function evaluateScreenshotRegression(
  screenshots: RuntimeScreenshot[],
  baselinePath: string | undefined,
  updateBaseline: boolean,
  findings: RuntimeFinding[],
): Promise<RuntimeScreenshotRegression> {
  if (!baselinePath) {
    return { status: "not-configured", compared: 0, mismatches: [] };
  }
  const resolvedPath = resolve(baselinePath);
  const records = screenshots.map(({ name, width, height, sha256, dynamicSelectors }) => ({
    name,
    width,
    height,
    sha256,
    dynamicSelectors,
  }));
  if (updateBaseline) {
    await mkdir(dirname(resolvedPath), { recursive: true });
    await writeFile(
      resolvedPath,
      `${JSON.stringify({ version: "1.0", screenshots: records }, null, 2)}\n`,
      "utf8",
    );
    return {
      status: "created",
      baselinePath: resolvedPath,
      compared: records.length,
      mismatches: [],
    };
  }

  const baseline = runtimeScreenshotBaselineSchema.parse(
    JSON.parse(await readFile(resolvedPath, "utf8")),
  );
  const expected = new Map(baseline.screenshots.map((entry) => [entry.name, entry]));
  const actual = new Map(records.map((entry) => [entry.name, entry]));
  const mismatches: string[] = [];
  let compared = 0;
  for (const [name, screenshot] of actual) {
    const reference = expected.get(name);
    if (!reference) {
      mismatches.push(`No baseline record for ${name}.`);
      continue;
    }
    compared += 1;
    if (
      reference.width !== screenshot.width ||
      reference.height !== screenshot.height ||
      reference.sha256 !== screenshot.sha256 ||
      JSON.stringify(reference.dynamicSelectors) !== JSON.stringify(screenshot.dynamicSelectors)
    ) {
      mismatches.push(`Screenshot ${name} differs from its baseline hash, dimensions, or dynamic-region policy.`);
    }
  }
  for (const name of expected.keys()) {
    if (!actual.has(name)) mismatches.push(`Baseline screenshot ${name} was not captured.`);
  }
  if (mismatches.length > 0) {
    findings.push({
      checkId: "ZTDE-RUNTIME-019",
      severity: "error",
      message: "Rendered screenshot regression baseline does not match.",
      evidence: [
        ...mismatches.slice(0, 20),
        "A hash mismatch detects change only. It does not establish whether the design is good or whether an intentional change is acceptable.",
      ],
    });
  }
  return {
    status: mismatches.length === 0 ? "matched" : "mismatched",
    baselinePath: resolvedPath,
    compared,
    mismatches,
  };
}

async function runJourney(
  page: Page,
  baseUrl: URL,
  journey: RuntimeJourney,
  timeoutMs: number,
  settleMs: number,
  outputDirectory: string,
  findings: RuntimeFinding[],
): Promise<RuntimeJourneyResult> {
  const result: RuntimeJourneyResult = {
    name: journey.name,
    passed: true,
    stepsCompleted: 0,
    totalSteps: journey.steps.length,
    evidence: [],
  };

  for (const [index, step] of journey.steps.entries()) {
    try {
      switch (step.action) {
        case "navigate": {
          const destination = new URL(step.value, baseUrl);
          if (destination.origin !== baseUrl.origin) {
            throw new Error("Journey navigation must remain on the target origin");
          }
          await page.goto(destination.toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
          assertSameOrigin(page, baseUrl.origin);
          await page.waitForTimeout(settleMs);
          break;
        }
        case "click":
          await page.locator(step.selector).click({ timeout: timeoutMs });
          break;
        case "fill":
          await page.locator(step.selector).fill(step.value, { timeout: timeoutMs });
          break;
        case "press":
          if (step.selector) {
            await page.locator(step.selector).press(step.value, { timeout: timeoutMs });
          } else {
            await page.keyboard.press(step.value);
          }
          break;
        case "waitFor":
          await page.locator(step.selector).waitFor({ state: "visible", timeout: timeoutMs });
          break;
        case "expectVisible":
          await page.locator(step.selector).waitFor({ state: "visible", timeout: timeoutMs });
          break;
        case "expectValue": {
          const locator = page.locator(step.selector);
          await locator.waitFor({ state: "visible", timeout: timeoutMs });
          const value = await locator.inputValue({ timeout: timeoutMs });
          if (value !== step.value) {
            throw new Error(`Expected value ${JSON.stringify(step.value)}, received ${JSON.stringify(value)}`);
          }
          break;
        }
        case "expectAttribute": {
          const locator = page.locator(step.selector);
          await locator.waitFor({ state: "visible", timeout: timeoutMs });
          const value = await locator.getAttribute(step.name, { timeout: timeoutMs });
          if (value !== step.value) {
            throw new Error(
              `Expected attribute ${step.name}=${JSON.stringify(step.value)}, received ${JSON.stringify(value)}`,
            );
          }
          result.evidence?.push({
            kind: "attribute",
            step: index + 1,
            description: `${step.selector} has ${step.name}=${JSON.stringify(value)}`,
          });
          break;
        }
        case "expectJson": {
          const locator = page.locator(step.selector);
          await locator.waitFor({ state: "visible", timeout: timeoutMs });
          const text = (await locator.textContent()) ?? "";
          const actual = jsonValueAtPath(JSON.parse(text), step.path);
          if (JSON.stringify(actual) !== JSON.stringify(step.value)) {
            throw new Error(
              `Expected JSON path ${step.path}=${JSON.stringify(step.value)}, received ${JSON.stringify(actual)}`,
            );
          }
          result.evidence?.push({
            kind: "json",
            step: index + 1,
            description: `${step.selector} JSON path ${step.path} matched ${JSON.stringify(step.value)}`,
          });
          break;
        }
        case "expectDownload": {
          const [download] = await Promise.all([
            page.waitForEvent("download", { timeout: timeoutMs }),
            page.locator(step.selector).click({ timeout: timeoutMs }),
          ]);
          const suggestedFilename = basename(download.suggestedFilename());
          if (step.filenameIncludes && !suggestedFilename.includes(step.filenameIncludes)) {
            throw new Error(
              `Expected downloaded filename to include ${JSON.stringify(step.filenameIncludes)}, received ${JSON.stringify(suggestedFilename)}`,
            );
          }
          const downloadPath = join(
            outputDirectory,
            `${safeName(`journey-${journey.name}-step-${index + 1}`)}-${suggestedFilename}`,
          );
          let evidenceMethod = "browser download";
          try {
            await download.saveAs(downloadPath);
          } catch (saveError) {
            const downloadUrl = download.url();
            try {
              const capturedBody = await capturedBlobBody(page, downloadUrl);
              if (capturedBody) {
                await writeFile(downloadPath, capturedBody);
                evidenceMethod = "captured Blob";
              } else {
                await writeFile(downloadPath, await downloadFallbackBody(page, downloadUrl, timeoutMs));
                evidenceMethod = "URL fallback";
              }
            } catch (fallbackError) {
              const browserFailure = await download.failure().catch(() => null);
              throw new Error(
                [
                  `Download artifact could not be retained as verifier evidence.`,
                  `Browser save: ${saveError instanceof Error ? saveError.message : String(saveError)}.`,
                  browserFailure ? `Browser failure: ${browserFailure}.` : undefined,
                  `Fallback: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}.`,
                ]
                  .filter(Boolean)
                  .join(" "),
                { cause: saveError },
              );
            }
          }
          result.evidence?.push({
            kind: "download",
            step: index + 1,
            description: `Downloaded ${suggestedFilename} via ${evidenceMethod}`,
            path: downloadPath,
          });
          break;
        }
        case "expectResponse": {
          const [response] = await Promise.all([
            page.waitForResponse(
              (candidate) =>
                candidate.url().includes(step.urlIncludes) &&
                candidate.status() === step.status &&
                (!step.method || candidate.request().method() === step.method),
              { timeout: timeoutMs },
            ),
            page.locator(step.selector).click({ timeout: timeoutMs }),
          ]);
          result.evidence?.push({
            kind: "response",
            step: index + 1,
            description: `${response.request().method()} ${response.url()} returned ${response.status()}`,
          });
          break;
        }
        case "expectText": {
          const locator = page.locator(step.selector).filter({ hasText: step.value });
          await locator.waitFor({ state: "visible", timeout: timeoutMs });
          const text = (await locator.textContent()) ?? "";
          if (!text.includes(step.value)) throw new Error(`Expected text ${JSON.stringify(step.value)}`);
          break;
        }
      }
      result.stepsCompleted = index + 1;
    } catch (error) {
      result.passed = false;
      addFinding(
        findings,
        "ZTDE-RUNTIME-008",
        "error",
        `Journey failed at step ${index + 1} (${step.action}).`,
        [error instanceof Error ? error.message : String(error)],
        { journey: journey.name },
        "selector" in step ? step.selector : undefined,
      );
      break;
    }
  }

  return result;
}

function deduplicateFindings(findings: RuntimeFinding[]): RuntimeFinding[] {
  const unique = new Map<string, RuntimeFinding>();
  for (const finding of findings) {
    const key = [finding.checkId, finding.severity, finding.viewport, finding.journey, finding.selector, finding.message].join("|");
    if (!unique.has(key)) unique.set(key, finding);
  }
  return [...unique.values()];
}

export async function verifyUiRuntime(options: RuntimeVerificationOptions): Promise<RuntimeReport> {
  const targetUrl = validateRuntimeUrl(options.url);
  const outputDirectory = resolve(options.outputDirectory);
  const viewports = [...(options.viewports ?? DEFAULT_RUNTIME_VIEWPORTS)];
  const colorSchemes = [...(options.colorSchemes ?? DEFAULT_RUNTIME_COLOR_SCHEMES)];
  const journeys = options.journeys ?? [];
  const timeoutMs = options.navigationTimeoutMs ?? DEFAULT_NAVIGATION_TIMEOUT_MS;
  const settleMs = options.settleMs ?? DEFAULT_SETTLE_MS;
  const expectedNetworkTrackers = createExpectedNetworkTrackers(options.expectedNetwork ?? []);
  const dynamicSelectors = [...(options.dynamicSelectors ?? [])];
  if (dynamicSelectors.length > 20 || dynamicSelectors.some((selector) => selector.length === 0 || selector.length > 1_024)) {
    throw new Error("Provide no more than 20 non-empty dynamic selectors of at most 1024 characters");
  }
  if (new Set(dynamicSelectors).size !== dynamicSelectors.length) {
    throw new Error("Dynamic screenshot selectors must be unique");
  }
  if (options.updateScreenshotBaseline && !options.screenshotBaselinePath) {
    throw new Error("updateScreenshotBaseline requires screenshotBaselinePath");
  }
  validateViewports(viewports);
  validateColorSchemes(colorSchemes);
  if (journeys.length > MAX_RUNTIME_JOURNEYS) {
    throw new Error(`Provide no more than ${MAX_RUNTIME_JOURNEYS} journeys`);
  }
  for (const journey of journeys) {
    if (journey.steps.length > MAX_JOURNEY_STEPS) {
      throw new Error(`Journey ${journey.name} exceeds the ${MAX_JOURNEY_STEPS}-step limit`);
    }
  }

  await mkdir(outputDirectory, { recursive: true });
  const chromiumCdpUrl = resolveChromiumCdpUrl(options.chromiumCdpUrl);
  const executablePath = chromiumCdpUrl ? undefined : resolveChromiumPath(options.chromiumPath);
  const browser = chromiumCdpUrl
    ? await chromium.connectOverCDP(chromiumCdpUrl)
    : await chromium.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
      });
  const findings: RuntimeFinding[] = [];
  const screenshots: RuntimeScreenshot[] = [];
  const journeyResults: RuntimeJourneyResult[] = [];
  const interfaceCoverage = createInterfaceCoverage();

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: colorSchemes[0], acceptDownloads: true });
      const page = await context.newPage();
      attachDiagnostics(page, findings, { viewport: viewport.name }, expectedNetworkTrackers);
      try {
        const response = await page.goto(targetUrl.toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
        assertSameOrigin(page, targetUrl.origin);
        if (!response) {
          addFinding(findings, "ZTDE-RUNTIME-001", "warning", "Navigation completed without an HTTP response object.", [targetUrl.toString()], { viewport: viewport.name });
        }
        await page.waitForTimeout(settleMs);
        for (const colorScheme of colorSchemes) {
          await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
          await page.waitForTimeout(settleMs);
          const themedViewport = colorSchemes.length === 1 && colorScheme === "light"
            ? viewport
            : { ...viewport, name: `${viewport.name}-${colorScheme}` };
          await checkRenderedPage(page, themedViewport, findings, interfaceCoverage);
          await captureScreenshot(page, outputDirectory, themedViewport.name, themedViewport, screenshots, dynamicSelectors);
        }
      } catch (error) {
        addFinding(findings, "ZTDE-RUNTIME-001", "error", "Viewport verification could not complete.", [error instanceof Error ? error.message : String(error)], { viewport: viewport.name });
      } finally {
        await context.close();
      }
    }

    if (journeys.length > 0) {
      const viewport = viewports[viewports.length - 1]!;
      for (const journey of journeys) {
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, reducedMotion: "reduce", colorScheme: colorSchemes[0], acceptDownloads: true });
        const page = await context.newPage();
        await installBlobDownloadCapture(page);
        attachDiagnostics(page, findings, { journey: journey.name }, expectedNetworkTrackers);
        try {
          await page.goto(targetUrl.toString(), { waitUntil: "domcontentloaded", timeout: timeoutMs });
          assertSameOrigin(page, targetUrl.origin);
          await page.waitForTimeout(settleMs);
          const result = await runJourney(
            page,
            targetUrl,
            journey,
            timeoutMs,
            settleMs,
            outputDirectory,
            findings,
          );
          for (const journeyViewport of viewports) {
            for (const colorScheme of colorSchemes) {
              const themedViewport = colorSchemes.length === 1 && colorScheme === "light"
                ? journeyViewport
                : { ...journeyViewport, name: `${journeyViewport.name}-${colorScheme}` };
              try {
                await page.setViewportSize({
                  width: journeyViewport.width,
                  height: journeyViewport.height,
                });
                await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
                await page.waitForTimeout(settleMs);
                await checkRenderedPage(page, themedViewport, findings, interfaceCoverage, journey.name);
                const screenshot = await captureScreenshot(
                  page,
                  outputDirectory,
                  `journey-${journey.name}-${themedViewport.name}`,
                  themedViewport,
                  screenshots,
                  dynamicSelectors,
                );
                result.screenshot ??= screenshot;
              } catch (error) {
                addFinding(
                  findings,
                  "ZTDE-RUNTIME-001",
                  "warning",
                  `Could not verify journey ${journey.name} at ${themedViewport.name}.`,
                  [error instanceof Error ? error.message : String(error)],
                  { viewport: themedViewport.name, journey: journey.name },
                );
              }
            }
          }
          journeyResults.push(result);
        } catch (error) {
          addFinding(findings, "ZTDE-RUNTIME-001", "error", `Could not initialize journey ${journey.name}.`, [error instanceof Error ? error.message : String(error)], { journey: journey.name });
          journeyResults.push({ name: journey.name, passed: false, stepsCompleted: 0, totalSteps: journey.steps.length });
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  const expectedNetwork: RuntimeExpectedNetworkObservation[] = expectedNetworkTrackers.map(
    (policy) => ({
      ...policy,
      satisfied:
        policy.occurrences >= policy.minOccurrences &&
        (policy.maxOccurrences === undefined || policy.occurrences <= policy.maxOccurrences),
    }),
  );
  for (const observation of expectedNetwork.filter((entry) => !entry.satisfied)) {
    addFinding(
      findings,
      "ZTDE-RUNTIME-009",
      "error",
      `Expected network policy ${observation.id} observed ${observation.occurrences} times; expected at least ${observation.minOccurrences}${observation.maxOccurrences === undefined ? "" : ` and at most ${observation.maxOccurrences}`}.`,
      observation.evidence.length > 0
        ? observation.evidence
        : [
            `No matching ${observation.method} response containing ${JSON.stringify(observation.urlIncludes)} was observed.`,
          ],
      {},
    );
  }

  addInterfaceCoverageFindings(findings, interfaceCoverage);
  const screenshotRegression = await evaluateScreenshotRegression(
    screenshots,
    options.screenshotBaselinePath,
    options.updateScreenshotBaseline ?? false,
    findings,
  );

  const uniqueFindings = deduplicateFindings(findings);
  const summary = {
    errors: uniqueFindings.filter((finding) => finding.severity === "error").length,
    warnings: uniqueFindings.filter((finding) => finding.severity === "warning").length,
    info: uniqueFindings.filter((finding) => finding.severity === "info").length,
  };
  const report: RuntimeReport = {
    version: RUNTIME_REPORT_VERSION,
    url: targetUrl.toString(),
    generatedAt: new Date().toISOString(),
    browser: `Chromium ${browser.version()}`,
    outputDirectory,
    viewports,
    colorSchemes,
    screenshots,
    screenshotRegression,
    journeys: journeyResults,
    expectedNetwork,
    findings: uniqueFindings,
    summary,
    passed: summary.errors === 0,
    evidenceBoundary: {
      verifierLimitations: [
        "Solid-color contrast sampling cannot establish contrast over gradients, images, video, canvas, or transparency without separate evidence.",
        "Composition and rendered-asset checks apply only to explicitly instrumented roots. DOM metadata cannot establish source truth, legal clearance, or whether an unmarked visual should have been declared.",
        "Static DOM and browser checks cannot establish metric correctness, backend availability beyond observed requests, legal clearance, or representative-user comprehension.",
        "Screenshot hashes detect rendered change only; they do not prove visual quality or improvement.",
      ],
      humanReviewRequired: [
        "An attributable reviewer must assess hierarchy, balance, scanability, density, domain fit, and intentional baseline changes.",
        "Representative-user evidence is required for claims about task comprehension, confidence, efficiency, or usability.",
      ],
    },
  };
  await writeFile(join(outputDirectory, "runtime-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(join(outputDirectory, "runtime-report.md"), `${formatRuntimeReport(report)}\n`, "utf8");
  return report;
}
