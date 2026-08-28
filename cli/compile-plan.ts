#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compileDesignPlan } from "../src/design-plan/compiler.js";
import { formatDesignPlan } from "../src/design-plan/report.js";
import { loadProductDesignBrief } from "../src/product-brief/loader.js";

type CliOptions = {
  brief: string;
  projectRoot: string;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: zz-design compile-plan --brief PATH [--project-root PATH] [--json]",
    "",
    "Compiles a generation-ready product design brief into a deterministic, traceable design plan.",
    "Planned contracts and unconfirmed target routes remain provisional instead of becoming invented implementation certainty.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let brief = "";
  let projectRoot = process.cwd();
  let json = false;
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--brief" && next) {
      brief = resolve(next);
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
  if (!brief) throw new Error("--brief is required");
  return { brief, projectRoot, json };
}

export async function runCompilePlanCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const options = parseArguments(argumentsList);
  const brief = await loadProductDesignBrief(options.brief);
  const plan = await compileDesignPlan(brief, {
    briefSourcePath: options.brief,
    projectRoot: options.projectRoot,
  });
  process.stdout.write(`${options.json ? JSON.stringify(plan, null, 2) : formatDesignPlan(plan)}\n`);
  return plan.status === "blocked" ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCompilePlanCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`Design plan compilation failed: ${message}\n\n${usage()}\n`);
      process.exitCode = 1;
    });
}
