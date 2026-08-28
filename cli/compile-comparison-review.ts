#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";

import { parse, stringify } from "yaml";
import { z } from "zod";

import { evaluateInterfaceComparison } from "../src/comparison/evaluator.js";
import {
  loadComparisonMethodology,
  loadComparisonReview,
} from "../src/comparison/loader.js";
import {
  comparisonReviewSchema,
  comparisonReviewSessionSchema,
  type ComparisonReview,
} from "../src/comparison/schema.js";

type Options = {
  methodology: string;
  baseReview: string;
  sessions: string;
  output: string;
  report: string;
  requireReleaseReady: boolean;
};

const sessionEnvelopeSchema = z
  .object({
    version: z.literal("1.0"),
    status: z.literal("complete"),
    session: comparisonReviewSessionSchema,
  })
  .strict();

function usage(): string {
  return [
    "Usage: npm run compile-comparison -- --methodology PATH --base-review PATH --sessions DIRECTORY --output PATH [--report PATH] [--require-release-ready]",
    "",
    "Compiles reviewer-supplied complete session files into a comparison review, hashes each source file, and evaluates the configured human and benchmark thresholds.",
    "Draft templates are rejected. The command never creates or upgrades human evidence.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): Options {
  const values: Partial<Options> = { requireReleaseReady: false };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (!argument) continue;
    if (["--methodology", "--base-review", "--sessions", "--output", "--report"].includes(argument)) {
      const value = argumentsList[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      const key = argument.slice(2).replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()) as keyof Options;
      values[key] = resolve(value) as never;
      index += 1;
    } else if (argument === "--require-release-ready") {
      values.requireReleaseReady = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (!values.methodology || !values.baseReview || !values.sessions || !values.output) {
    throw new Error("--methodology, --base-review, --sessions, and --output are required");
  }
  return {
    methodology: values.methodology,
    baseReview: values.baseReview,
    sessions: values.sessions,
    output: values.output,
    report: values.report ?? `${values.output}.report.json`,
    requireReleaseReady: values.requireReleaseReady ?? false,
  };
}

function contained(base: string, candidate: string): boolean {
  const relation = relative(base, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

function portable(path: string): string {
  return path.split(sep).join("/");
}

async function sha256(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const reviewRoot = dirname(options.baseReview);
  if (!contained(reviewRoot, options.sessions)) {
    throw new Error("Session directory must remain inside the base review evidence directory");
  }
  if (!contained(reviewRoot, options.output) || !contained(reviewRoot, options.report)) {
    throw new Error("Compiled review and report must remain inside the base review evidence directory");
  }

  const [methodology, baseReview, entries] = await Promise.all([
    loadComparisonMethodology(options.methodology),
    loadComparisonReview(options.baseReview),
    readdir(options.sessions, { withFileTypes: true }),
  ]);
  const sessionFiles = entries
    .filter((entry) => entry.isFile() && /^\.ya?ml$/i.test(extname(entry.name)))
    .map((entry) => resolve(options.sessions, entry.name))
    .sort();
  if (sessionFiles.length === 0) {
    throw new Error("No completed YAML session files were found");
  }

  const envelopes = await Promise.all(sessionFiles.map(async (path) => ({
    path,
    envelope: sessionEnvelopeSchema.parse(parse(await readFile(path, "utf8"))),
  })));
  for (const { envelope } of envelopes) {
    if (envelope.session.level === "ai-assisted-expert") {
      throw new Error(`Completed session ${envelope.session.id} must be human-expert or representative-user evidence`);
    }
  }
  const sessionIds = envelopes.map(({ envelope }) => envelope.session.id);
  if (new Set(sessionIds).size !== sessionIds.length) {
    throw new Error("Completed session IDs must be unique");
  }

  const review: ComparisonReview = comparisonReviewSchema.parse({
    ...baseReview,
    id: `${baseReview.id.replace(/-base$/, "")}-compiled`,
    preparedAt: new Date(
      Math.max(...envelopes.map(({ envelope }) => Date.parse(envelope.session.recordedAt!))),
    ).toISOString(),
    preparedBy: { type: "mixed", name: "ZtotheZ Design Engineering and attributed reviewers" },
    sessions: [
      ...baseReview.sessions.filter((session) => session.origin === "agent-generated"),
      ...envelopes.map(({ envelope }) => envelope.session),
    ],
    artifacts: [
      ...baseReview.artifacts.filter((artifact) => artifact.stage !== "human-review"),
      ...await Promise.all(envelopes.map(async ({ path, envelope }) => ({
        id: `${envelope.session.id}-evidence`,
        candidate: "comparison" as const,
        stage: "human-review",
        kind: envelope.session.level === "representative-user" ? "user-session" as const : "human-review" as const,
        path: portable(relative(reviewRoot, path)),
        producer: "human" as const,
        retained: true,
        scope: `${envelope.session.level} session supplied by the attributed contributor`,
        recordedAt: envelope.session.recordedAt!,
        sourceRevision: "reviewer-supplied",
        sha256: await sha256(path),
      }))),
    ],
    stages: baseReview.stages.map((stage) =>
      stage.id === "human-review" && stage.candidate === "comparison"
        ? { ...stage, status: "not-run" as const, evidenceRefs: [] }
        : stage,
    ),
    claims: baseReview.claims,
  });

  const provisional = await evaluateInterfaceComparison(
    methodology,
    review,
    options.methodology,
    options.output,
  );
  if (provisional.humanReview.requirementsMet) {
    const humanEvidenceRefs = review.artifacts
      .filter((artifact) => artifact.stage === "human-review")
      .map((artifact) => artifact.id);
    review.stages = review.stages.map((stage) =>
      stage.id === "human-review" && stage.candidate === "comparison"
        ? { ...stage, status: "pass", evidenceRefs: humanEvidenceRefs }
        : stage,
    );
  }

  const report = await evaluateInterfaceComparison(
    methodology,
    review,
    options.methodology,
    options.output,
  );
  await writeFile(options.output, stringify(review, { lineWidth: 120 }), "utf8");
  await writeFile(options.report, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.passed || (options.requireReleaseReady && !report.releaseReady)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`Comparison review compilation failed: ${message}\n\n${usage()}\n`);
  process.exitCode = 1;
});
