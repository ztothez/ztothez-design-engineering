#!/usr/bin/env node

import { resolve } from "node:path";

import { formatAuditReport } from "../src/audit/report.js";
import { auditRepository } from "../src/audit/scanner.js";
import type { AuditSeverity } from "../src/audit/types.js";

type CliOptions = {
  repository: string;
  json: boolean;
  failOn: AuditSeverity | "none";
};

function usage(): string {
  return [
    "Usage: npm run audit -- --repo PATH [--json] [--fail-on error|warning|none]",
    "",
    "Defaults to the current directory and exits non-zero when error findings exist.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let repository = process.cwd();
  let json = false;
  let failOn: CliOptions["failOn"] = "error";

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--repo") {
      const value = argumentsList[index + 1];
      if (!value) {
        throw new Error("--repo requires a directory path");
      }
      repository = resolve(value);
      index += 1;
      continue;
    }
    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--fail-on") {
      const value = argumentsList[index + 1];
      if (value !== "error" && value !== "warning" && value !== "none") {
        throw new Error("--fail-on must be error, warning, or none");
      }
      failOn = value;
      index += 1;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  return { repository, json, failOn };
}

function shouldFail(options: CliOptions, errors: number, warnings: number): boolean {
  if (options.failOn === "none") {
    return false;
  }
  if (options.failOn === "warning") {
    return errors + warnings > 0;
  }
  return errors > 0;
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const report = await auditRepository(options.repository);
  const output = options.json ? JSON.stringify(report, null, 2) : formatAuditReport(report);
  process.stdout.write(`${output}\n`);

  if (shouldFail(options, report.summary.errors, report.summary.warnings)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Repository audit failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
