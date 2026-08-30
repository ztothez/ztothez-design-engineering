#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { evaluatePilotQualification, loadPilotQualificationConfig } from "../src/pilots/qualification.js";
import { formatPilotQualificationReport } from "../src/pilots/report.js";

type Options = { config: string; projectRoot: string; evidenceRoot: string; json: boolean };

function usage(): string {
  return [
    "Usage: zz-design qualify-pilots --config PATH --evidence-root PATH [--project-root PATH] [--json]",
    "",
    "Qualifies repository-owned V4 delivery pilots without executing or exposing protected product sources.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): Options {
  let config = "";
  let evidenceRoot = "";
  let projectRoot = process.cwd();
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--config" && next) {
      config = resolve(next);
      index += 1;
    } else if (argument === "--evidence-root" && next) {
      evidenceRoot = resolve(next);
      index += 1;
    } else if (argument === "--project-root" && next) {
      projectRoot = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      json = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (!config || !evidenceRoot) throw new Error("--config and --evidence-root are required");
  return { config, evidenceRoot, projectRoot, json };
}

export async function runQualifyPilotsCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const options = parseArguments(argumentsList);
  const config = await loadPilotQualificationConfig(options.config);
  const report = await evaluatePilotQualification({ config, projectRoot: options.projectRoot, evidenceRoot: options.evidenceRoot });
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatPilotQualificationReport(report)}\n`);
  return report.passed ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runQualifyPilotsCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`Pilot qualification failed: ${message}\n\n${usage()}\n`);
    process.exitCode = 1;
  });
}
