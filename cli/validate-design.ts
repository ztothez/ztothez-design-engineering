#!/usr/bin/env node

import { resolve } from "node:path";

import { loadDesignDeliverable } from "../src/design-intelligence/loader.js";
import { formatDesignDeliverableReport } from "../src/design-intelligence/report.js";
import { validateDesignDeliverable } from "../src/design-intelligence/validator.js";

type CliOptions = {
  manifest: string;
  json: boolean;
};

function usage(): string {
  return [
    "Usage: npm run validate-design -- --manifest PATH [--json]",
    "",
    "Validates versioned design-deliverable manifests for tokens, visual polish, responsive composition, states, motion, charts, rendered-evidence declarations, Figma structure, assets, rights, icon semantics, presentations, and visual accessibility.",
    "Read visualPolish.releaseReady separately from passed. Planned captures and agent-authored review text do not satisfy rendered or human evidence.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): CliOptions {
  let manifest = "";
  let json = false;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--manifest" && next) {
      manifest = resolve(next);
      index += 1;
    } else if (argument === "--json") {
      json = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (!manifest) throw new Error("--manifest is required");
  return { manifest, json };
}

async function main(): Promise<void> {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.includes("--help") || argumentsList.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const options = parseArguments(argumentsList);
  const manifest = await loadDesignDeliverable(options.manifest);
  const report = validateDesignDeliverable(manifest, options.manifest);
  process.stdout.write(
    `${options.json ? JSON.stringify(report, null, 2) : formatDesignDeliverableReport(report)}\n`,
  );
  if (!report.passed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Design deliverable validation failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
