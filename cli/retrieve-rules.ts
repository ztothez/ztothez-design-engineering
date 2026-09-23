#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadProductDesignBrief } from "../src/product-brief/loader.js";
import { retrieveDecisionRuleReport } from "../src/design-plan/reconciliation.js";

function usage(): string {
  return "Usage: zz-design retrieve-rules --brief PATH [--json]";
}

export async function runRetrieveRulesCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) { process.stdout.write(`${usage()}\n`); return 0; }
  let briefPath = "";
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--brief" && next) { briefPath = resolve(next); index += 1; }
    else if (argument === "--json") json = true;
    else throw new Error(`Unknown or incomplete argument: ${argument}`);
  }
  if (!briefPath) throw new Error("--brief is required");
  const report = retrieveDecisionRuleReport(await loadProductDesignBrief(briefPath));
  process.stdout.write(`${JSON.stringify(report, null, json ? 2 : 0)}\n`);
  return report.noMatch ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runRetrieveRulesCli(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`Decision-rule retrieval failed: ${error instanceof Error ? error.message : String(error)}\n${usage()}\n`);
    process.exitCode = 1;
  });
}
