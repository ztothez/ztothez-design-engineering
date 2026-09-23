#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

import { evaluateShadowCutover } from "../src/shadow/evaluator.js";
import { formatShadowEvaluation } from "../src/shadow/report.js";

export async function runShadowEvaluateCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write("Usage: zz-design shadow-evaluate [--runtime-root DIR] [--output DIR] [--pilot-qualification PATH] [--pilot-evaluation PATH] [--holdout PATH]\n");
    return 0;
  }
  const projectRoot = process.cwd();
  let runtimeRoot = resolve(projectRoot, ".ztothez-design-runtime");
  let output = resolve(runtimeRoot, "v6-shadow-cutover");
  let pilotQualification = "v4-pilots/qualification-report.json";
  let pilotEvaluation = "v4-pilots/evaluation-report.json";
  let holdout = ".ztothez-design-benchmarks/runs/v3-holdout-20260830-r6/report.json";
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const value = argumentsList[index + 1];
    if (argument === "--runtime-root" && value) { runtimeRoot = resolve(value); index += 1; }
    else if (argument === "--output" && value) { output = resolve(value); index += 1; }
    else if (argument === "--pilot-qualification" && value) { pilotQualification = value; index += 1; }
    else if (argument === "--pilot-evaluation" && value) { pilotEvaluation = value; index += 1; }
    else if (argument === "--holdout" && value) { holdout = value; index += 1; }
    else throw new Error(`Unknown or incomplete argument: ${argument}`);
  }
  const report = await evaluateShadowCutover({
    runtimeRoot,
    holdoutRoot: projectRoot,
    pilotQualification,
    pilotEvaluation,
    holdout,
  });
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, "shadow-evaluation.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(resolve(output, "shadow-evaluation.md"), formatShadowEvaluation(report), "utf8");
  process.stdout.write(`${JSON.stringify({ status: report.passed ? "shadow-qualified" : "failed", cutover: report.cutoverStatus, output: relative(projectRoot, output).split(sep).join("/") }, null, 2)}\n`);
  return report.passed ? 0 : 1;
}

if (process.argv[1]?.endsWith("shadow-evaluate.js")) {
  runShadowEvaluateCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
