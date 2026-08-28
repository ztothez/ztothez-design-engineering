#!/usr/bin/env node

import { resolve } from "node:path";

import { evaluateInterfaceComparison } from "../src/comparison/evaluator.js";
import {
  loadComparisonMethodology,
  loadComparisonReview,
} from "../src/comparison/loader.js";
import { formatComparisonReport } from "../src/comparison/report.js";

type CliOptions = {
  methodology: string;
  review: string;
  json: boolean;
  requireReleaseReady: boolean;
};

function usage(): string {
  return [
    "Usage: npm run validate-comparison -- --methodology PATH --review PATH [--json] [--require-release-ready]",
    "",
    "Validates an interface comparison method and review, including claim evidence, required stages, retained artifacts, and human-evidence attribution.",
    "A structurally valid review may remain not release-ready until required human and representative-user evidence is supplied.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let methodology = "";
  let review = "";
  let json = false;
  let requireReleaseReady = false;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--methodology" && next) {
      methodology = resolve(next);
      index += 1;
    } else if (argument === "--review" && next) {
      review = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      json = true;
    } else if (argument === "--require-release-ready") {
      requireReleaseReady = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (!methodology) throw new Error("--methodology is required");
  if (!review) throw new Error("--review is required");
  return { methodology, review, json, requireReleaseReady };
}

async function main(): Promise<void> {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const options = parseArguments(argumentsList);
  const [methodology, review] = await Promise.all([
    loadComparisonMethodology(options.methodology),
    loadComparisonReview(options.review),
  ]);
  const report = await evaluateInterfaceComparison(
    methodology,
    review,
    options.methodology,
    options.review,
  );
  process.stdout.write(
    `${options.json ? JSON.stringify(report, null, 2) : formatComparisonReport(report)}\n`,
  );
  if (!report.passed || (options.requireReleaseReady && !report.releaseReady)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Interface comparison validation failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
