#!/usr/bin/env node

import { resolve } from "node:path";

import { formatQualityGateReport } from "../src/quality-gate/report.js";
import { runQualityGate } from "../src/quality-gate/runner.js";
import type { QualityGateFailOn } from "../src/quality-gate/types.js";

type CliOptions = {
  contract: string;
  repository: string;
  projectRoot: string;
  outputDirectory: string;
  url?: string;
  profile?: string;
  attestationsPath?: string;
  failOn: QualityGateFailOn;
  json: boolean;
};

function defaultOutputDirectory(): string {
  return resolve(
    ".ztothez-design-quality-gate",
    new Date().toISOString().replace(/[:.]/g, "-"),
  );
}

function usage(): string {
  return [
    "Usage: npm run quality-gate -- --contract PATH --repo PATH --url URL --profile ID [options]",
    "",
    "Options:",
    "  --project-root PATH          Root containing contract source files, default current directory",
    "  --output PATH                Consolidated evidence directory",
    "  --fail-on error|warning      Failure threshold, default error",
    "  --attestations PATH          JSON or YAML manual-review attestations",
    "  --skip-runtime               Run contract and architecture stages but report INCOMPLETE",
    "  --json                       Print the consolidated JSON report",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let contract = "";
  let repository = "";
  let projectRoot = process.cwd();
  let outputDirectory = defaultOutputDirectory();
  let url: string | undefined;
  let profile: string | undefined;
  let attestationsPath: string | undefined;
  let failOn: QualityGateFailOn = "error";
  let json = false;
  let skipRuntime = false;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--contract" && next) {
      contract = resolve(next);
      index += 1;
    } else if (argument === "--repo" && next) {
      repository = resolve(next);
      index += 1;
    } else if (argument === "--project-root" && next) {
      projectRoot = resolve(next);
      index += 1;
    } else if (argument === "--output" && next) {
      outputDirectory = resolve(next);
      index += 1;
    } else if (argument === "--url" && next) {
      url = next;
      index += 1;
    } else if (argument === "--profile" && next) {
      profile = next;
      index += 1;
    } else if (argument === "--attestations" && next) {
      attestationsPath = resolve(next);
      index += 1;
    } else if (argument === "--fail-on" && next) {
      if (next !== "error" && next !== "warning") {
        throw new Error("--fail-on must be error or warning");
      }
      failOn = next;
      index += 1;
    } else if (argument === "--skip-runtime") {
      skipRuntime = true;
    } else if (argument === "--json") {
      json = true;
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (!contract) throw new Error("--contract is required");
  if (!repository) throw new Error("--repo is required");
  if (skipRuntime && (url || profile)) {
    throw new Error("--skip-runtime cannot be combined with --url or --profile");
  }
  if (!skipRuntime && (!url || !profile)) {
    throw new Error("--url and --profile are required unless --skip-runtime is used");
  }
  return {
    contract,
    repository,
    projectRoot,
    outputDirectory,
    ...(url ? { url } : {}),
    ...(profile ? { profile } : {}),
    ...(attestationsPath ? { attestationsPath } : {}),
    failOn,
    json,
  };
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const report = await runQualityGate({
    contractPath: options.contract,
    projectRoot: options.projectRoot,
    repository: options.repository,
    outputDirectory: options.outputDirectory,
    ...(options.url ? { url: options.url } : {}),
    ...(options.profile ? { profile: options.profile } : {}),
    ...(options.attestationsPath ? { attestationsPath: options.attestationsPath } : {}),
    failOn: options.failOn,
  });
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatQualityGateReport(report)}\n`);
  if (!report.passed && report.summary.errors > 0) process.exitCode = 1;
  else if (!report.complete) process.exitCode = 2;
  else if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Quality gate failed to execute: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
