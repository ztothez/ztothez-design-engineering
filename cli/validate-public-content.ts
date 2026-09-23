#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { formatPublicContentReport } from "../src/public-content/report.js";
import { validatePublicContent } from "../src/public-content/validator.js";

function usage(): string {
  return [
    "Usage: zz-design validate-public-content [--root PATH] [--policy PATH] [--json]",
    "",
    "Runs public repository privacy validation against the V5 privacy and content policy.",
    "Findings name the file and policy only; sensitive matched values are not printed.",
  ].join("\n");
}

function readArgs(argv: string[]) {
  const args = { root: process.cwd(), policy: undefined as string | undefined, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root") {
      const value = argv[index + 1];
      if (!value) throw new Error("--root requires a path");
      args.root = value;
      index += 1;
    } else if (argument === "--policy") {
      const value = argv[index + 1];
      if (!value) throw new Error("--policy requires a path");
      args.policy = value;
      index += 1;
    } else if (argument === "--json") {
      args.json = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return args;
}

export async function runValidatePublicContentCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  const args = readArgs(argumentsList);
  const report = await validatePublicContent({ root: resolve(args.root), policyPath: args.policy });
  process.stdout.write(args.json ? `${JSON.stringify(report, null, 2)}\n` : formatPublicContentReport(report));
  return report.status === "pass" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runValidatePublicContentCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`Public content validation failed: ${message}\n\n${usage()}\n`);
      process.exitCode = 1;
    });
}
