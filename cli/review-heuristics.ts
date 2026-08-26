#!/usr/bin/env node

import { resolve } from "node:path";

import { evaluateHeuristicReview } from "../src/heuristics/evaluator.js";
import { loadHeuristicReview } from "../src/heuristics/loader.js";
import {
  formatAcceptanceCandidates,
  formatHeuristicReviewReport,
} from "../src/heuristics/report.js";

type CliOptions = {
  review: string;
  format: "markdown" | "json" | "candidates";
  failOnOpenMajor: boolean;
};

function usage(): string {
  return [
    "Usage: npm run review-heuristics -- --review PATH [--json | --candidates] [--fail-on-open-major]",
    "",
    "Validates a heuristic-review YAML or JSON artifact and derives acceptance-criterion candidates from open severity 3-4 findings.",
    "The command never creates human attestations or modifies a product contract.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let review = "";
  let format: CliOptions["format"] = "markdown";
  let failOnOpenMajor = false;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--review" && next) {
      review = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      if (format !== "markdown") throw new Error("Choose only one output format");
      format = "json";
    } else if (argument === "--candidates") {
      if (format !== "markdown") throw new Error("Choose only one output format");
      format = "candidates";
    } else if (argument === "--fail-on-open-major") {
      failOnOpenMajor = true;
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (!review) throw new Error("--review is required");
  return { review, format, failOnOpenMajor };
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const review = await loadHeuristicReview(options.review);
  const report = evaluateHeuristicReview(review, options.review);
  const output =
    options.format === "json"
      ? JSON.stringify(report, null, 2)
      : options.format === "candidates"
        ? formatAcceptanceCandidates(report.acceptanceCandidates)
        : formatHeuristicReviewReport(report);
  process.stdout.write(`${output}\n`);
  if (options.failOnOpenMajor && report.requiresAcceptanceWork) process.exitCode = 2;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Heuristic review failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
