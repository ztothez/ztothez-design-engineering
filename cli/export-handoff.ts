#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compileDesignPlan } from "../src/design-plan/compiler.js";
import { reconcileDesignPlan } from "../src/design-plan/reconciliation.js";
import { loadProductDesignBrief } from "../src/product-brief/loader.js";
import { createHandoff, formatHandoff } from "../src/handoff/compiler.js";

function usage(): string { return "Usage: zz-design export-handoff --brief PATH --output PATH [--project-root PATH] [--json]"; }
export async function runExportHandoffCli(args: string[]): Promise<number> {
  let briefPath = ""; let output = ""; let projectRoot = process.cwd(); let json = false;
  for (let i = 0; i < args.length; i += 1) { const arg = args[i]; const next = args[i + 1]; if (arg === "--brief" && next) { briefPath = resolve(next); i += 1; } else if (arg === "--output" && next) { output = resolve(next); i += 1; } else if (arg === "--project-root" && next) { projectRoot = resolve(next); i += 1; } else if (arg === "--json") json = true; else if (arg === "--help" || arg === "-h") { process.stdout.write(`${usage()}\n`); return 0; } else throw new Error(`Unknown or incomplete argument: ${arg}`); }
  if (!briefPath || !output) throw new Error("--brief and --output are required");
  const brief = await loadProductDesignBrief(briefPath); const plan = await compileDesignPlan(brief, { briefSourcePath: briefPath, projectRoot }); const handoff = createHandoff(brief, plan, reconcileDesignPlan(brief, plan));
  await mkdir(resolve(output, ".."), { recursive: true }); await writeFile(output, `${JSON.stringify(handoff, null, 2)}\n`, "utf8");
  process.stdout.write(`${json ? JSON.stringify(handoff, null, 2) : formatHandoff(handoff)}\n`); return handoff.status === "blocked" ? 1 : 0;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runExportHandoffCli(process.argv.slice(2)).catch((error: unknown) => { process.stderr.write(`Handoff export failed: ${error instanceof Error ? error.message : String(error)}\n${usage()}\n`); process.exitCode = 1; });
