import type { Page } from "playwright-core";

import type { RuntimeFinding, RuntimeViewport } from "./types.js";

type BrowserIssue = {
  selector?: string;
  message: string;
  evidence: string[];
};

export type InterfaceCoverage = {
  requiredStages: Set<string>;
  observedStages: Set<string>;
  requiredStates: Set<string>;
  observedStates: Set<string>;
};

export function createInterfaceCoverage(): InterfaceCoverage {
  return {
    requiredStages: new Set(),
    observedStages: new Set(),
    requiredStates: new Set(),
    observedStates: new Set(),
  };
}

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

export async function checkInterfaceTrust(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
  coverage: InterfaceCoverage,
): Promise<void> {
  const result = await page.evaluate(() => {
    const root = document.querySelector("[data-ztothez-design-interface-trust]");
    if (!root) return null;
    const trustRoot = root;

    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const attribute = [...element.attributes].find((entry) => entry.name.startsWith("data-ztothez-design-"));
      return `${element.tagName.toLowerCase()}${attribute ? `[${attribute.name}]` : ""}`;
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

    function list(name: string): string[] {
      return (trustRoot.getAttribute(name) ?? "")
        .split(/[\s,]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }

    const issues: BrowserIssue[] = [];
    const modes = [...document.querySelectorAll("[data-ztothez-design-data-mode]")].filter(visible);
    if (modes.length === 0) {
      issues.push({
        selector: selectorFor(root),
        message: "V2 interface has no visible persistent data-mode disclosure.",
        evidence: ["The interface-trust marker is present, but no visible data-mode element was rendered."],
      });
    }
    for (const modeElement of modes) {
      const mode = modeElement.getAttribute("data-ztothez-design-data-mode") ?? "";
      const text = modeElement.textContent?.trim().toLowerCase() ?? "";
      if (!new Set(["demo", "live", "hybrid", "imported", "cached"]).has(mode) || !text.includes(mode)) {
        issues.push({
          selector: selectorFor(modeElement),
          message: "Data-mode disclosure is invalid or not readable in visible text.",
          evidence: [`Declared mode ${JSON.stringify(mode)}; visible text ${JSON.stringify(text.slice(0, 120))}.`],
        });
      }
    }

    const stage = root.getAttribute("data-ztothez-design-stage") ?? "";
    const state = root.getAttribute("data-ztothez-design-state") ?? "";
    const allowedStages = new Set(["initial", "loading", "result", "error", "history", "export"]);
    if (stage && !allowedStages.has(stage)) {
      issues.push({
        selector: selectorFor(root),
        message: "Interface-trust stage is not recognized.",
        evidence: [`Received ${JSON.stringify(stage)}; expected initial, loading, result, error, history, or export.`],
      });
    }

    const simulated = [...document.querySelectorAll('[data-ztothez-design-result-origin="simulated"]')].filter(visible);
    for (const element of simulated) {
      const text = element.textContent?.trim().toLowerCase() ?? "";
      if (!/(?:demo|fallback|simulat)/.test(text)) {
        issues.push({
          selector: selectorFor(element),
          message: "Simulated result origin is not disclosed in visible text.",
          evidence: [`Visible text was ${JSON.stringify(text.slice(0, 120))}.`],
        });
      }
    }

    const stale = [...document.querySelectorAll('[data-ztothez-design-freshness="stale"]')].filter(visible);
    for (const element of stale) {
      const timestamp = element.getAttribute("data-ztothez-design-timestamp");
      const timezone = element.getAttribute("data-ztothez-design-timezone");
      if (!timestamp || Number.isNaN(Date.parse(timestamp)) || !timezone || !(element.textContent ?? "").toLowerCase().includes("stale")) {
        issues.push({
          selector: selectorFor(element),
          message: "Stale data lacks a visible stale label, parseable timestamp, or timezone.",
          evidence: [`Timestamp present=${Boolean(timestamp)}; timezone present=${Boolean(timezone)}.`],
        });
      }
    }

    const disconnected = [...document.querySelectorAll('[data-ztothez-design-connection="disconnected"]')].filter(visible);
    if (disconnected.length > 0 && ![...document.querySelectorAll("[data-ztothez-design-recovery-action]")].some(visible)) {
      issues.push({
        selector: selectorFor(disconnected[0]!),
        message: "Disconnected state has no visible recovery action.",
        evidence: ["Declare a retry, reconnect, configuration, or offline continuation action."],
      });
    }

    return {
      issues,
      stage,
      state,
      requiredStages: list("data-ztothez-design-required-stages"),
      requiredStates: list("data-ztothez-design-required-states"),
    };
  });

  if (!result) return;
  if (result.stage) coverage.observedStages.add(result.stage);
  if (result.state) coverage.observedStates.add(result.state);
  for (const stage of result.requiredStages) coverage.requiredStages.add(stage);
  for (const state of result.requiredStates) coverage.requiredStates.add(state);
  appendIssues(findings, "ZTDE-RUNTIME-017", viewport, result.issues);
}

export function addInterfaceCoverageFindings(
  findings: RuntimeFinding[],
  coverage: InterfaceCoverage,
): void {
  const missingStages = [...coverage.requiredStages].filter((stage) => !coverage.observedStages.has(stage));
  const missingStates = [...coverage.requiredStates].filter((state) => !coverage.observedStates.has(state));
  if (missingStages.length > 0) {
    findings.push({
      checkId: "ZTDE-RUNTIME-017",
      severity: "error",
      message: "Required interface-trust stages were not observed.",
      evidence: [
        `Missing: ${missingStages.join(", ")}.`,
        `Observed: ${[...coverage.observedStages].join(", ") || "none"}.`,
      ],
    });
  }
  if (missingStates.length > 0) {
    findings.push({
      checkId: "ZTDE-RUNTIME-017",
      severity: "error",
      message: "Required V2 fixture states were not observed.",
      evidence: [
        `Missing: ${missingStates.join(", ")}.`,
        `Observed: ${[...coverage.observedStates].join(", ") || "none"}.`,
      ],
    });
  }
}

export async function checkChartContracts(
  page: Page,
  viewport: RuntimeViewport,
  findings: RuntimeFinding[],
): Promise<void> {
  const issues = await page.evaluate(() => {
    function selectorFor(element: Element): string {
      if (element.id) return `#${CSS.escape(element.id)}`;
      return `${element.tagName.toLowerCase()}[data-ztothez-design-chart]`;
    }
    function visible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 1 && rect.height > 1 && style.display !== "none" && style.visibility !== "hidden";
    }
    function labelledBy(element: Element): string {
      return (element.getAttribute("aria-labelledby") ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ")
        .trim();
    }

    return [...document.querySelectorAll("[data-ztothez-design-chart]")]
      .filter(visible)
      .flatMap<BrowserIssue>((chart) => {
        const chartIssues: BrowserIssue[] = [];
        const name = chart.getAttribute("aria-label")?.trim() || labelledBy(chart) || chart.querySelector("figcaption")?.textContent?.trim();
        if (!name) {
          chartIssues.push({
            selector: selectorFor(chart),
            message: "Chart has no visible or programmatic name.",
            evidence: ["Provide aria-label, aria-labelledby, or a figcaption."],
          });
        }
        const valuesDeclared = chart.getAttribute("data-ztothez-design-chart-values") === "visible";
        const valuesRendered = [...chart.querySelectorAll("[data-ztothez-design-chart-value]")].some(visible);
        if (!valuesDeclared && !valuesRendered) {
          chartIssues.push({
            selector: selectorFor(chart),
            message: "Chart does not expose readable values.",
            evidence: ["Declare visible values or render elements marked with data-ztothez-design-chart-value."],
          });
        }
        const alternativeSelector = chart.getAttribute("data-ztothez-design-chart-alternative");
        let alternative: Element | null = null;
        try {
          alternative = alternativeSelector ? document.querySelector(alternativeSelector) : null;
        } catch {
          alternative = null;
        }
        if (!alternativeSelector || !alternative || !visible(alternative)) {
          chartIssues.push({
            selector: selectorFor(chart),
            message: "Chart has no visible textual or tabular alternative.",
            evidence: [`Alternative selector: ${JSON.stringify(alternativeSelector)}.`],
          });
        }
        const series = Number.parseInt(chart.getAttribute("data-ztothez-design-chart-series") ?? "1", 10);
        if (series > 1 && ![...chart.querySelectorAll("[data-ztothez-design-chart-legend]")].some(visible)) {
          chartIssues.push({
            selector: selectorFor(chart),
            message: "Multi-series chart has no visible legend.",
            evidence: [`Declared series count: ${series}.`],
          });
        }
        return chartIssues;
      })
      .slice(0, 30);
  });

  appendIssues(findings, "ZTDE-RUNTIME-018", viewport, issues);
}
