#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadDesignPlan } from "../src/generation/loader.js";
import { generateReactTypescriptFixture } from "../src/generation/react-typescript.js";
import { formatGenerationReport } from "../src/generation/report.js";

type CliOptions = {
  plan: string;
  generationRoot: string;
  output: string;
  portfolioRegistry: string;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: zz-design generate-react --plan PATH --generation-root PATH --output PATH --portfolio-registry PATH [--json]",
    "",
    "Creates one new independent React and TypeScript fixture from an implementation-ready design plan.",
    "The output must not exist, must remain inside the explicit generation root, and must not overlap any portfolio root.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let plan = "";
  let generationRoot = "";
  let output = "";
  let portfolioRegistry = "";
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--plan" && next) {
      plan = resolve(next);
      index += 1;
    } else if (argument === "--generation-root" && next) {
      generationRoot = resolve(next);
      index += 1;
    } else if (argument === "--output" && next) {
      output = resolve(next);
      index += 1;
    } else if (argument === "--portfolio-registry" && next) {
      portfolioRegistry = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      json = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (!plan) throw new Error("--plan is required");
  if (!generationRoot) throw new Error("--generation-root is required");
  if (!output) throw new Error("--output is required");
  if (!portfolioRegistry) throw new Error("--portfolio-registry is required");
  return { plan, generationRoot, output, portfolioRegistry, json };
}

export async function runGenerateReactCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const options = parseArguments(argumentsList);
  const plan = await loadDesignPlan(options.plan);
  const report = await generateReactTypescriptFixture(plan, {
    generationRoot: options.generationRoot,
    outputDirectory: options.output,
    portfolioRegistryPath: options.portfolioRegistry,
  });
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatGenerationReport(report)}\n`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runGenerateReactCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`React fixture generation failed: ${message}\n\n${usage()}\n`);
      process.exitCode = 1;
    });
}
