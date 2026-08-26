#!/usr/bin/env node

import { resolve } from "node:path";

import { formatContractValidationReport } from "../src/contracts/report.js";
import { validateProductContract } from "../src/contracts/validator.js";

type CliOptions = {
  contract: string;
  projectRoot: string;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: npm run validate-contract -- --contract PATH [--project-root PATH] [--json]",
    "",
    "Validates product-contract YAML, declared sources, journey profiles, and cross-references.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let contract = "";
  let projectRoot = process.cwd();
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
  return { contract, projectRoot, json };
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const report = await validateProductContract(options.contract, { projectRoot: options.projectRoot });
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatContractValidationReport(report)}\n`);
  if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Product contract validation failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
