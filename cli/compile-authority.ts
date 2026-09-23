#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compileAuthority, stableJson } from "../src/authority/compiler.js";
import { formatAuthorityReferenceView } from "../src/authority/reference-view.js";
import { formatAuthorityCompilationReport } from "../src/authority/report.js";
import { validateCompiledAuthority } from "../src/authority/validator.js";

function usage(): string {
  return [
    "Usage: zz-design compile-authority [--check | --write] [--json] [--reference-view PATH]",
    "",
    "Compiles the admitted knowledge manifest, retrieval scope, shadow model, and rule registry into the deterministic V5 compiled authority boundary.",
    "The compiled authority remains shadow-only until V5 cutover evidence is accepted.",
  ].join("\n");
}

function readArgs(argv: string[]) {
  const args = { mode: "check" as "check" | "write", json: false, referenceView: undefined as string | undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") args.mode = "check";
    else if (argument === "--write") args.mode = "write";
    else if (argument === "--json") args.json = true;
    else if (argument === "--reference-view") {
      const value = argv[index + 1];
      if (!value) throw new Error("--reference-view requires a path");
      args.referenceView = value;
      index += 1;
    }
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return args;
}

export async function runCompileAuthorityCli(argumentsList: string[]): Promise<number> {
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  const args = readArgs(argumentsList);
  if (args.mode === "write") {
    const compiled = await compileAuthority();
    await mkdir("governance", { recursive: true });
    await mkdir("model", { recursive: true });
    await writeFile("governance/rule-registry.json", stableJson(compiled.registry), "utf8");
    await writeFile("model/compiled-authority.json", stableJson(compiled.authority), "utf8");
    if (args.referenceView) {
      await mkdir(dirname(args.referenceView), { recursive: true });
      await writeFile(args.referenceView, formatAuthorityReferenceView(compiled.authority, compiled.registry), "utf8");
    }
    const output = args.json ? `${JSON.stringify(compiled.report, null, 2)}\n` : formatAuthorityCompilationReport(compiled.report);
    process.stdout.write(output);
    return compiled.report.status === "pass" ? 0 : 1;
  }

  const report = await validateCompiledAuthority();
  if (args.referenceView) {
    const compiled = await compileAuthority();
    await mkdir(dirname(args.referenceView), { recursive: true });
    await writeFile(args.referenceView, formatAuthorityReferenceView(compiled.authority, compiled.registry), "utf8");
  }
  const output = args.json ? `${JSON.stringify(report, null, 2)}\n` : formatAuthorityCompilationReport(report);
  process.stdout.write(output);
  return report.status === "pass" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCompileAuthorityCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      process.stderr.write(`Authority compilation failed: ${message}\n\n${usage()}\n`);
      process.exitCode = 1;
    });
}
