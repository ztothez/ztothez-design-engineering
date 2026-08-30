#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateV4Qualification,
  loadV4QualificationEvidence,
} from "../src/v4-qualification/evaluator.js";
import { formatV4QualificationReport } from "../src/v4-qualification/report.js";

function usage(): string {
  return [
    "Usage: zz-design qualify-v4 --evidence PATH [--project-root PATH] [--json]",
    "",
    "Validates retained V4 pilot, holdout, command, package, documentation, independence, and evidence-boundary results.",
  ].join("\n");
}

export async function runQualifyV4Cli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  let evidence = "";
  let projectRoot = process.cwd();
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--evidence" && next) {
      evidence = resolve(next);
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
  if (!evidence) throw new Error("--evidence is required");
  const report = await evaluateV4Qualification({
    evidence: await loadV4QualificationEvidence(evidence),
    projectRoot,
  });
  process.stdout.write(`${json ? JSON.stringify(report, null, 2) : formatV4QualificationReport(report)}\n`);
  return report.passed ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runQualifyV4Cli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`V4 qualification failed: ${message}\n\n${usage()}\n`);
    process.exitCode = 1;
  });
}
