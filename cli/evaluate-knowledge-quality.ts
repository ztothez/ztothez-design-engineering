#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

import { evaluateKnowledgeQuality } from "../src/knowledge-quality/evaluator.js";
import { formatKnowledgeQualityReport } from "../src/knowledge-quality/report.js";

type Options = { manifest: string; projectRoot: string; json: boolean; output?: string };

function usage(): string {
  return [
    "Usage: zz-design evaluate-knowledge-quality [--manifest PATH] [--project-root PATH] [--output DIR] [--json]",
    "",
    "Evaluates V5 knowledge quality for conflict, drift, provenance, and model parity.",
  ].join("\n");
}

function parseArguments(args: string[]): Options {
  let manifest = "knowledge-base/benchmarks/knowledge-quality/knowledge-quality.yaml";
  let projectRoot = process.cwd();
  let json = false;
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const next = args[index + 1];
    if (argument === "--manifest" && next) {
      manifest = next;
      index += 1;
    } else if (argument === "--project-root" && next) {
      projectRoot = next;
      index += 1;
    } else if (argument === "--output" && next) {
      output = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      json = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  const resolvedProjectRoot = resolve(projectRoot);
  return {
    manifest: isAbsolute(manifest) ? manifest : resolve(resolvedProjectRoot, manifest),
    projectRoot: resolvedProjectRoot,
    json,
    ...(output ? { output } : {}),
  };
}

export async function runEvaluateKnowledgeQualityCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const options = parseArguments(argumentsList);
  const report = await evaluateKnowledgeQuality(options.manifest, options.projectRoot);
  const markdown = formatKnowledgeQualityReport(report);
  if (options.output) {
    await mkdir(options.output, { recursive: true });
    await writeFile(join(options.output, "knowledge-quality-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(join(options.output, "knowledge-quality-report.md"), `${markdown}\n`, "utf8");
  }
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : markdown}\n`);
  return report.passed ? 0 : 1;
}

if (process.argv[1] && process.argv[1].endsWith("evaluate-knowledge-quality.js")) {
  runEvaluateKnowledgeQualityCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`Knowledge quality evaluation failed: ${message}\n\n${usage()}\n`);
      process.exitCode = 1;
    });
}
