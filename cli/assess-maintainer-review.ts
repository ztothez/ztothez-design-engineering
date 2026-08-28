#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { evaluateInterfaceComparison } from "../src/comparison/evaluator.js";
import {
  assessSoloMaintainerTrack,
  formatMaintainerAssessment,
} from "../src/comparison/maintainer.js";
import {
  loadComparisonMethodology,
  loadComparisonReview,
} from "../src/comparison/loader.js";

type Options = {
  methodology: string;
  review: string;
  output?: string;
  json: boolean;
  requireEngineeringReady: boolean;
};

function usage(): string {
  return [
    "Usage: npm run assess-maintainer -- --methodology PATH --review PATH [--output PATH] [--json] [--require-engineering-ready]",
    "",
    "Evaluates disclosed maintainer evidence for continued engineering without converting it into independent release validation.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): Options {
  const options: Options = { methodology: "", review: "", json: false, requireEngineeringReady: false };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--methodology" && next) {
      options.methodology = resolve(next);
      index += 1;
    } else if (argument === "--review" && next) {
      options.review = resolve(next);
      index += 1;
    } else if (argument === "--output" && next) {
      options.output = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      options.json = true;
    } else if (argument === "--require-engineering-ready") {
      options.requireEngineeringReady = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (!options.methodology) throw new Error("--methodology is required");
  if (!options.review) throw new Error("--review is required");
  return options;
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
  const comparisonReport = await evaluateInterfaceComparison(
    methodology,
    review,
    options.methodology,
    options.review,
  );
  const assessment = assessSoloMaintainerTrack(methodology, review, comparisonReport);
  if (options.output) {
    await writeFile(options.output, `${JSON.stringify(assessment, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${options.json ? JSON.stringify(assessment, null, 2) : formatMaintainerAssessment(assessment)}\n`);
  if (options.requireEngineeringReady && !assessment.engineeringReady) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Solo-maintainer assessment failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
