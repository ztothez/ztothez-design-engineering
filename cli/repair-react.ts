#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepairRequest } from "../src/repair/loader.js";
import { formatRepairReport } from "../src/repair/report.js";
import { runBoundedRepair } from "../src/repair/runner.js";
import type { QualityGateFailOn } from "../src/quality-gate/types.js";

type CliOptions = {
  request: string;
  generationRoot: string;
  target: string;
  portfolioRegistry: string;
  contract: string;
  projectRoot: string;
  url: string;
  profile: string;
  output: string;
  failOn: QualityGateFailOn;
  settleMs?: number;
  chromiumPath?: string;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: zz-design repair-react --request PATH --generation-root PATH --target PATH --portfolio-registry PATH --contract PATH --url URL --profile ID --output PATH [options]",
    "",
    "Options:",
    "  --project-root PATH       Root containing contract sources, default current directory",
    "  --fail-on error|warning   Full quality-gate threshold, default warning",
    "  --settle-ms NUMBER        Browser settle time between 0 and 30000",
    "  --chromium PATH           Explicit Chromium executable",
    "  --json                    Print the portable JSON report",
    "",
    "Repairs only manifest-owned files in a generated React fixture. The verification URL must be loopback,",
    "evidence must remain outside the target, and unresolved attempts restore the original target snapshot.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let request = "";
  let generationRoot = "";
  let target = "";
  let portfolioRegistry = "";
  let contract = "";
  let projectRoot = process.cwd();
  let url = "";
  let profile = "";
  let output = "";
  let failOn: QualityGateFailOn = "warning";
  let settleMs: number | undefined;
  let chromiumPath: string | undefined;
  let json = false;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--request" && next) {
      request = resolve(next);
      index += 1;
    } else if (argument === "--generation-root" && next) {
      generationRoot = resolve(next);
      index += 1;
    } else if (argument === "--target" && next) {
      target = resolve(next);
      index += 1;
    } else if (argument === "--portfolio-registry" && next) {
      portfolioRegistry = resolve(next);
      index += 1;
    } else if (argument === "--contract" && next) {
      contract = resolve(next);
      index += 1;
    } else if (argument === "--project-root" && next) {
      projectRoot = resolve(next);
      index += 1;
    } else if (argument === "--url" && next) {
      url = next;
      index += 1;
    } else if (argument === "--profile" && next) {
      profile = next;
      index += 1;
    } else if (argument === "--output" && next) {
      output = resolve(next);
      index += 1;
    } else if (argument === "--fail-on" && next) {
      if (next !== "error" && next !== "warning") throw new Error("--fail-on must be error or warning");
      failOn = next;
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
    } else if (argument === "--json") {
      json = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  for (const [flag, value] of Object.entries({
    "--request": request,
    "--generation-root": generationRoot,
    "--target": target,
    "--portfolio-registry": portfolioRegistry,
    "--contract": contract,
    "--url": url,
    "--profile": profile,
    "--output": output,
  })) {
    if (!value) throw new Error(`${flag} is required`);
  }
  return {
    request,
    generationRoot,
    target,
    portfolioRegistry,
    contract,
    projectRoot,
    url,
    profile,
    output,
    failOn,
    ...(settleMs === undefined ? {} : { settleMs }),
    ...(chromiumPath ? { chromiumPath } : {}),
    json,
  };
}

export async function runRepairReactCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const options = parseArguments(argumentsList);
  const request = await loadRepairRequest(options.request);
  const report = await runBoundedRepair({
    request,
    generationRoot: options.generationRoot,
    targetDirectory: options.target,
    portfolioRegistryPath: options.portfolioRegistry,
    contractPath: options.contract,
    projectRoot: options.projectRoot,
    url: options.url,
    profile: options.profile,
    outputDirectory: options.output,
    failOn: options.failOn,
    ...(options.settleMs === undefined ? {} : { settleMs: options.settleMs }),
    ...(options.chromiumPath ? { chromiumPath: options.chromiumPath } : {}),
  });
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatRepairReport(report)}\n`);
  return report.status === "repaired" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runRepairReactCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`Bounded React repair failed: ${message}\n\n${usage()}\n`);
      process.exitCode = 1;
    });
}
