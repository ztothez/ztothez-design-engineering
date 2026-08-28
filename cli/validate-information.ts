#!/usr/bin/env node

import { resolve } from "node:path";

import { loadInformationDesignContract } from "../src/information-design/loader.js";
import { formatInformationDesignReport } from "../src/information-design/report.js";
import { validateInformationDesignContract } from "../src/information-design/validator.js";

type CliOptions = {
  contract: string;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: npm run validate-information -- --contract PATH [--json]",
    "",
    "Validates a version 1.0 operational information-design contract for metric and finding traceability, decision support, hierarchy, exceptional states, non-color cues, charts, collections, and answer-flow task declarations.",
    "The result does not prove rendered hierarchy, runtime calculations, accessibility behavior, or representative-user comprehension.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let contract = "";
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--contract" && next) {
      contract = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      json = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (!contract) throw new Error("--contract is required");
  return { contract, json };
}

async function main(): Promise<void> {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const options = parseArguments(argumentsList);
  const contract = await loadInformationDesignContract(options.contract);
  const report = validateInformationDesignContract(contract, options.contract);
  process.stdout.write(
    `${options.json ? JSON.stringify(report, null, 2) : formatInformationDesignReport(report)}\n`,
  );
  if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Information-design validation failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
