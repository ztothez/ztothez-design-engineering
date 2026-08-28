#!/usr/bin/env node

import { resolve } from "node:path";

import { loadRuntimeJourneySelection } from "../src/contracts/journeys.js";
import { formatRuntimeReport } from "../src/runtime/report.js";
import type {
  RuntimeSeverity,
  RuntimeViewport,
} from "../src/runtime/types.js";
import { verifyUiRuntime } from "../src/runtime/verifier.js";

type CliOptions = {
  url: string;
  outputDirectory: string;
  journeysFile?: string;
  journeyProfile?: string;
  viewports?: RuntimeViewport[];
  settleMs?: number;
  chromiumPath?: string;
  dynamicSelectors: string[];
  screenshotBaselinePath?: string;
  updateScreenshotBaseline: boolean;
  json: boolean;
  failOn: RuntimeSeverity | "none";
};

function usage(): string {
  return [
    "Usage: npm run verify-ui -- --url URL [options]",
    "",
    "Options:",
    "  --output PATH                 Evidence directory",
    "  --journeys PATH               JSON file containing declarative journeys",
    "  --profile ID                  Profile ID when --journeys contains a journey suite",
    "  --viewports 375x812,768x1024  Override default viewport matrix",
    "  --settle-ms NUMBER             Wait after navigation before inspection",
    "  --chromium PATH                Chromium executable",
    "  --dynamic-selector SELECTOR    Mask one dynamic region; repeat as needed",
    "  --screenshot-baseline PATH     Compare screenshots with a versioned JSON baseline",
    "  --update-screenshot-baseline   Write the baseline instead of comparing",
    "  --json                         Print JSON instead of Markdown",
    "  --fail-on error|warning|none   Exit policy, default error",
  ].join("\n");
}

function parseViewports(value: string): RuntimeViewport[] {
  return value.split(",").map((entry) => {
    const match = /^(\d+)x(\d+)$/.exec(entry.trim());
    if (!match) throw new Error(`Invalid viewport: ${entry}`);
    const width = Number(match[1]);
    const height = Number(match[2]);
    return { name: `custom-${width}x${height}`, width, height };
  });
}

function parseArguments(argumentsList: string[]): CliOptions {
  let url = "";
  let outputDirectory = resolve(
    ".ztothez-design-runtime",
    new Date().toISOString().replace(/[:.]/g, "-"),
  );
  let journeysFile: string | undefined;
  let journeyProfile: string | undefined;
  let viewports: RuntimeViewport[] | undefined;
  let settleMs: number | undefined;
  let chromiumPath: string | undefined;
  const dynamicSelectors: string[] = [];
  let screenshotBaselinePath: string | undefined;
  let updateScreenshotBaseline = false;
  let json = false;
  let failOn: CliOptions["failOn"] = "error";

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--url" && next) {
      url = next;
      index += 1;
    } else if (argument === "--output" && next) {
      outputDirectory = resolve(next);
      index += 1;
    } else if (argument === "--journeys" && next) {
      journeysFile = resolve(next);
      index += 1;
    } else if (argument === "--profile" && next) {
      journeyProfile = next;
      index += 1;
    } else if (argument === "--viewports" && next) {
      viewports = parseViewports(next);
      index += 1;
    } else if (argument === "--settle-ms" && next) {
      settleMs = Number(next);
      if (!Number.isInteger(settleMs) || settleMs < 0 || settleMs > 30_000) {
        throw new Error("--settle-ms must be an integer between 0 and 30000");
      }
      index += 1;
    } else if (argument === "--chromium" && next) {
      chromiumPath = resolve(next);
      index += 1;
    } else if (argument === "--dynamic-selector" && next) {
      dynamicSelectors.push(next);
      index += 1;
    } else if (argument === "--screenshot-baseline" && next) {
      screenshotBaselinePath = resolve(next);
      index += 1;
    } else if (argument === "--update-screenshot-baseline") {
      updateScreenshotBaseline = true;
    } else if (argument === "--json") {
      json = true;
    } else if (argument === "--fail-on" && next) {
      if (next !== "error" && next !== "warning" && next !== "none") {
        throw new Error("--fail-on must be error, warning, or none");
      }
      failOn = next;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (!url) throw new Error("--url is required");
  if (journeyProfile && !journeysFile) {
    throw new Error("--profile requires --journeys");
  }
  if (updateScreenshotBaseline && !screenshotBaselinePath) {
    throw new Error("--update-screenshot-baseline requires --screenshot-baseline");
  }
  return {
    url,
    outputDirectory,
    ...(journeysFile ? { journeysFile } : {}),
    ...(journeyProfile ? { journeyProfile } : {}),
    ...(viewports ? { viewports } : {}),
    ...(settleMs === undefined ? {} : { settleMs }),
    ...(chromiumPath ? { chromiumPath } : {}),
    dynamicSelectors,
    ...(screenshotBaselinePath ? { screenshotBaselinePath } : {}),
    updateScreenshotBaseline,
    json,
    failOn,
  };
}

function shouldFail(options: CliOptions, errors: number, warnings: number): boolean {
  if (options.failOn === "none") return false;
  if (options.failOn === "warning") return errors + warnings > 0;
  return errors > 0;
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const selection = options.journeysFile
    ? await loadRuntimeJourneySelection(options.journeysFile, options.journeyProfile)
    : { journeys: [], expectedNetwork: [] };
  const report = await verifyUiRuntime({
    url: options.url,
    outputDirectory: options.outputDirectory,
    journeys: selection.journeys,
    expectedNetwork: selection.expectedNetwork,
    ...(options.viewports ? { viewports: options.viewports } : {}),
    ...(options.settleMs === undefined ? {} : { settleMs: options.settleMs }),
    ...(options.chromiumPath ? { chromiumPath: options.chromiumPath } : {}),
    dynamicSelectors: options.dynamicSelectors,
    ...(options.screenshotBaselinePath
      ? { screenshotBaselinePath: options.screenshotBaselinePath }
      : {}),
    updateScreenshotBaseline: options.updateScreenshotBaseline,
  });
  process.stdout.write(
    `${options.json ? JSON.stringify(report, null, 2) : formatRuntimeReport(report)}\n`,
  );
  if (shouldFail(options, report.summary.errors, report.summary.warnings)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Runtime verification failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
