#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadProductDesignBrief } from "../src/product-brief/loader.js";
import { formatProductBriefReport } from "../src/product-brief/report.js";
import { validateProductDesignBrief } from "../src/product-brief/validator.js";

type CliOptions = {
  brief: string;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: npm run validate-brief -- --brief PATH [--json]",
    "",
    "Validates a version 1.0 product design brief for evidence-backed users, tasks, data behavior, interface states, platforms, assumptions, requirements, and acceptance coverage.",
    "A generation-ready result authorizes design planning only; it does not prove implementation or release readiness.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let brief = "";
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--brief" && next) {
      brief = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      json = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (!brief) throw new Error("--brief is required");
  return { brief, json };
}

export async function runValidateBriefCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const options = parseArguments(argumentsList);
  const brief = await loadProductDesignBrief(options.brief);
  const report = validateProductDesignBrief(brief, options.brief);
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatProductBriefReport(report)}\n`);
  return report.generationReady ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runValidateBriefCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`Product design brief validation failed: ${message}\n\n${usage()}\n`);
      process.exitCode = 1;
    });
}
