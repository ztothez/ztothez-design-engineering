#!/usr/bin/env node

import { resolve } from "node:path";

import { loadInterfaceTrustContract } from "../src/interface-trust/loader.js";
import { formatInterfaceTrustReport } from "../src/interface-trust/report.js";
import { validateInterfaceTrustContract } from "../src/interface-trust/validator.js";

type CliOptions = {
  contract: string;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: npm run validate-trust -- --contract PATH [--json]",
    "",
    "Validates a version 1.0 interface-trust contract for state provenance, claim sources, pre-action disclosure, fallback and stale behavior, history and export preservation, and credential-like values.",
    "The result does not prove rendered disclosure, backend availability, or human comprehension.",
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
  const contract = await loadInterfaceTrustContract(options.contract);
  const report = validateInterfaceTrustContract(contract, options.contract);
  process.stdout.write(
    `${options.json ? JSON.stringify(report, null, 2) : formatInterfaceTrustReport(report)}\n`,
  );
  if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Interface trust validation failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
