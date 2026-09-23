#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compileDesignPlan } from "../src/design-plan/compiler.js";
import { formatPlanReconciliation, reconcileDesignPlan } from "../src/design-plan/reconciliation.js";
import { loadProductDesignBrief } from "../src/product-brief/loader.js";

function usage(): string {
  return "Usage: zz-design reconcile-plan --brief PATH [--project-root PATH] [--json]";
}

function parseArguments(argumentsList: string[]): { brief: string; projectRoot: string; json: boolean } {
  let brief = "";
  let projectRoot = process.cwd();
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--brief" && next) { brief = resolve(next); index += 1; }
    else if (argument === "--project-root" && next) { projectRoot = resolve(next); index += 1; }
    else if (argument === "--json") json = true;
    else throw new Error(`Unknown or incomplete argument: ${argument}`);
  }
  if (!brief) throw new Error("--brief is required");
  return { brief, projectRoot, json };
}

export async function runReconcilePlanCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) { process.stdout.write(`${usage()}\n`); return 0; }
  const options = parseArguments(argumentsList);
  const brief = await loadProductDesignBrief(options.brief);
  const plan = await compileDesignPlan(brief, { briefSourcePath: options.brief, projectRoot: options.projectRoot });
  const report = reconcileDesignPlan(brief, plan);
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : formatPlanReconciliation(report)}\n`);
  return report.status === "blocked" ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runReconcilePlanCli(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`Plan reconciliation failed: ${error instanceof Error ? error.message : String(error)}\n${usage()}\n`);
    process.exitCode = 1;
  });
}
