#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { evaluateCorpusBenchmark } from "../src/corpus/evaluator.js";
import { formatCorpusReport } from "../src/corpus/report.js";

type Options = { manifest: string; projectRoot: string; json: boolean; output?: string };

function usage(): string {
  return [
    "Usage: npm run evaluate-corpus -- [--manifest PATH] [--project-root PATH] [--output DIR] [--json]",
    "",
    "Evaluates versioned positive and negative cases for retrieval relevance, abstention, architecture, task completeness, and anti-slop rejection.",
  ].join("\n");
}

function parseArguments(args: string[]): Options {
  let manifest = "knowledge-base/benchmarks/corpus/corpus.yaml";
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
    } else if (argument === "--json") {
      json = true;
    } else if (argument === "--output" && next) {
      output = resolve(next);
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  return { manifest: resolve(manifest), projectRoot: resolve(projectRoot), json, ...(output ? { output } : {}) };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const options = parseArguments(args);
  const report = await evaluateCorpusBenchmark(options.manifest, options.projectRoot);
  const markdown = formatCorpusReport(report);
  if (options.output) {
    await mkdir(options.output, { recursive: true });
    await writeFile(join(options.output, "corpus-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    await writeFile(join(options.output, "corpus-report.md"), `${markdown}\n`, "utf8");
  }
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : markdown}\n`);
  if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Corpus evaluation failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
