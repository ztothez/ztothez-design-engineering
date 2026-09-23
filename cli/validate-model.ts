#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadDesignEngineeringModel } from "../src/model/loader.js";
import { formatModelValidationReport } from "../src/model/report.js";
import { validateDesignEngineeringModel } from "../src/model/validator.js";

function usage(): string {
  return [
    "Usage: zz-design validate-model [--model PATH] [--output PATH] [--json]",
    "",
    "Validates the V5 shadow ZtotheZ design-engineering model against admitted public knowledge, official-standard references, source boundaries, decision traces, conflict rules, and abstention behavior.",
    "The model remains shadow-only until V5 cutover evidence is accepted.",
  ].join("\n");
}

function readArgs(argv: string[]) {
  const args = {
    model: "model/ztothez-design-engineering-model.json",
    output: undefined as string | undefined,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--model") {
      const value = argv[index + 1];
      if (!value) throw new Error("--model requires a path");
      args.model = value;
      index += 1;
    } else if (argument === "--output") {
      const value = argv[index + 1];
      if (!value) throw new Error("--output requires a path");
      args.output = value;
      index += 1;
    } else if (argument === "--json") {
      args.json = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return args;
}

export async function runValidateModelCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  const args = readArgs(argumentsList);
  const model = await loadDesignEngineeringModel(args.model);
  const report = await validateDesignEngineeringModel(model);
  const output = args.json ? `${JSON.stringify(report, null, 2)}\n` : formatModelValidationReport(report);

  if (args.output) {
    await writeFile(args.output, output, "utf8");
  } else {
    process.stdout.write(output);
  }

  return report.status === "pass" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runValidateModelCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`Design model validation failed: ${message}\n\n${usage()}\n`);
      process.exitCode = 1;
    });
}
