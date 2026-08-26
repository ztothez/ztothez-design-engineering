#!/usr/bin/env node

import { resolve } from "node:path";

import { formatAggregateReport } from "../src/aggregate/report.js";
import { aggregateQualityGates } from "../src/aggregate/runner.js";
import type { QualityGateFailOn } from "../src/quality-gate/types.js";

type CliOptions = {
  contract: string;
  projectRoot: string;
  reportDirectories: string[];
  outputDirectory: string;
  failOn: QualityGateFailOn;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: npm run aggregate-gates -- --contract PATH --reports DIR,DIR [options]",
    "",
    "Options:",
    "  --project-root PATH       Root containing contract sources, default current directory",
    "  --output PATH             Release evidence directory",
    "  --fail-on error|warning   Failure threshold used by every profile, default error",
    "  --json                    Print JSON instead of Markdown",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let contract = "";
  let projectRoot = process.cwd();
  let reportDirectories: string[] = [];
  let outputDirectory = resolve(".ztothez-design-quality-gate", "release");
  let failOn: QualityGateFailOn = "error";
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--contract" && next) {
      contract = resolve(next);
      index += 1;
    } else if (argument === "--project-root" && next) {
      projectRoot = resolve(next);
      index += 1;
    } else if (argument === "--reports" && next) {
      reportDirectories.push(...next.split(",").filter(Boolean).map((entry) => resolve(entry)));
      index += 1;
    } else if (argument === "--output" && next) {
      outputDirectory = resolve(next);
      index += 1;
    } else if (argument === "--fail-on" && next) {
      if (next !== "error" && next !== "warning") {
        throw new Error("--fail-on must be error or warning");
      }
      failOn = next;
      index += 1;
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
  if (reportDirectories.length === 0) throw new Error("--reports is required");
  return { contract, projectRoot, reportDirectories, outputDirectory, failOn, json };
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const report = await aggregateQualityGates({
    contractPath: options.contract,
    projectRoot: options.projectRoot,
    reportDirectories: options.reportDirectories,
    outputDirectory: options.outputDirectory,
    failOn: options.failOn,
  });
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatAggregateReport(report)}\n`);
  if (!report.complete) process.exitCode = 2;
  else if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Quality gate aggregation failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
