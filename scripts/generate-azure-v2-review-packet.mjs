#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

import { parse, stringify } from "yaml";

const CANDIDATES = ["anonymous-a", "anonymous-b", "anonymous-c", "anonymous-d", "anonymous-e"];
const VIEWPORTS = [
  ["mobile", "375x812", 375, 812],
  ["tablet", "768x1024", 768, 1024],
  ["desktop", "1024x768", 1024, 768],
  ["wide", "1440x1000", 1440, 1000],
];
const HUMAN_CRITERIA = [
  "disclosure-consistency",
  "decision-density",
  "visual-rhythm",
  "responsive-composition",
];
const USER_CRITERIA = ["disclosure-speed", "priority-comprehension"];
const TASKS = [
  "identify-data-origin",
  "identify-priority",
  "identify-next-action",
  "recognize-fallback",
  "verify-export-provenance",
];

function usage() {
  return [
    "Usage: node scripts/generate-azure-v2-review-packet.mjs --baseline PATH --v2 PATH --methodology PATH --output PATH [--force]",
    "",
    "Builds a five-candidate anonymous review packet from retained evidence. Coordinator identity data stays outside the reviewer packet.",
  ].join("\n");
}

function parseArguments(argumentsList) {
  const options = { force: false };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (["--baseline", "--v2", "--methodology", "--output"].includes(argument)) {
      const value = argumentsList[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      options[argument.slice(2)] = resolve(value);
      index += 1;
    } else if (argument === "--force") {
      options.force = true;
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  for (const name of ["baseline", "v2", "methodology", "output"]) {
    if (!options[name]) throw new Error(`--${name} is required`);
  }
  return options;
}

function contained(base, candidate) {
  const relation = relative(base, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== "..");
}

async function structured(path) {
  const content = await readFile(path, "utf8");
  return path.endsWith(".json") ? JSON.parse(content) : parse(content);
}

async function digest(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function copyContained(sourceRoot, sourcePath, outputRoot, outputPath = sourcePath) {
  const source = resolve(sourceRoot, sourcePath);
  const target = resolve(outputRoot, outputPath);
  if (!contained(sourceRoot, source) || !contained(outputRoot, target)) {
    throw new Error(`Copy escapes an evidence root: ${sourcePath}`);
  }
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  return outputPath.replaceAll("\\", "/");
}

async function artifact(outputRoot, values) {
  return { ...values, sha256: await digest(resolve(outputRoot, values.path)) };
}

function rotate(values, offset) {
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function sessionTemplate(level) {
  const candidateOrder = [...CANDIDATES];
  const session = {
    id: level === "human-expert" ? "replace-expert-session-id" : "replace-user-session-id",
    level,
    origin: "reviewer-supplied",
    contributor: "replace-with-reviewer-or-facilitator-name",
    ...(level === "representative-user" ? { participantId: "participant-replace" } : {}),
    recordedAt: "replace-with-iso-8601-timestamp",
    blinding: {
      candidateIdentitiesWithheld: false,
      priorCandidateExposure: false,
      conflicts: ["Replace with disclosed conflicts, or remove this item when none exist."],
    },
    candidateOrder,
    taskResults: level === "representative-user"
      ? candidateOrder.flatMap((candidate) => TASKS.map((task) => ({
          task,
          candidate,
          outcome: "not-run",
          durationSeconds: 0,
          navigationErrors: 0,
          recoveryAttempts: 0,
          comprehensionCorrect: false,
          confidence: 1,
          notes: "Replace with the observed result and exact evidence location.",
        })))
      : [],
    ratings: candidateOrder.flatMap((candidate) =>
      (level === "human-expert" ? HUMAN_CRITERIA : USER_CRITERIA).map((criterion) => ({
        candidate,
        criterion,
        score: 0,
        rationale: "Replace with concrete reviewer-supplied evidence.",
      })),
    ),
  };
  return { version: "1.0", status: "draft", session };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options.force) {
    try {
      await readFile(resolve(options.output, "review.yaml"));
      throw new Error("Output already contains review.yaml. Use --force only before collecting sessions.");
    } catch (error) {
      if (error instanceof Error && !error.message.includes("ENOENT")) throw error;
    }
  }
  await rm(options.output, { recursive: true, force: true });
  await mkdir(resolve(options.output, "reviewer-packet", "screenshots"), { recursive: true });
  await mkdir(resolve(options.output, "reviewer-packet", "completed-sessions"), { recursive: true });
  await mkdir(resolve(options.output, "coordinator"), { recursive: true });

  const baselineReview = await structured(resolve(options.baseline, "review.yaml"));
  const methodology = await structured(options.methodology);
  const artifacts = [];
  const copied = new Set();
  for (const sourceArtifact of baselineReview.artifacts) {
    if (!copied.has(sourceArtifact.path)) {
      await copyContained(options.baseline, sourceArtifact.path, options.output);
      copied.add(sourceArtifact.path);
    }
    artifacts.push(sourceArtifact);
  }

  const engineeringSource = resolve(options.v2, "final", "engineering-evidence.json");
  const runtimeSource = resolve(options.v2, "final", "runtime-report.json");
  const engineering = await structured(engineeringSource);
  const runtime = await structured(runtimeSource);
  const sourceRevision = engineering.sourceRevision;
  const recordedAt = engineering.recordedAt;
  const engineeringPath = await copyContained(
    options.v2,
    "final/engineering-evidence.json",
    options.output,
    "anonymous-e/engineering-evidence.json",
  );
  const runtimePath = await copyContained(
    options.v2,
    "final/runtime-report.json",
    options.output,
    "anonymous-e/runtime-report.json",
  );
  const exportPath = await copyContained(
    options.v2,
    "final/export-provenance.json",
    options.output,
    "anonymous-e/export-provenance.json",
  );

  for (const [stage, kind] of [
    ["build", "build-report"],
    ["typecheck", "typecheck-report"],
    ["architecture-audit", "static-audit"],
  ]) {
    artifacts.push(await artifact(options.output, {
      id: `anonymous-e-${stage}`,
      candidate: "anonymous-e",
      stage,
      kind,
      path: engineeringPath,
      producer: "automation",
      retained: true,
      scope: `Exact Azure V2 ${stage} command output and status at the recorded source revision`,
      recordedAt,
      sourceRevision,
    }));
  }
  artifacts.push(await artifact(options.output, {
    id: "anonymous-e-browser-runtime",
    candidate: "anonymous-e",
    stage: "browser-verification",
    kind: "runtime-report",
    path: runtimePath,
    producer: "automation",
    retained: true,
    scope: "Azure V2 browser, responsive, accessibility, state, and screenshot-regression report",
    recordedAt: runtime.generatedAt,
    sourceRevision,
    accessibility: { standard: "WCAG", version: "2.2", level: "AA", coverage: "sampled-states" },
  }));
  artifacts.push(await artifact(options.output, {
    id: "anonymous-e-product-journeys",
    candidate: "anonymous-e",
    stage: "product-journeys",
    kind: "journey-report",
    path: runtimePath,
    producer: "automation",
    retained: true,
    scope: "Nine Azure V2 product journeys across four declared viewports",
    recordedAt: runtime.generatedAt,
    sourceRevision,
  }));
  artifacts.push(await artifact(options.output, {
    id: "anonymous-e-export",
    candidate: "anonymous-e",
    stage: "product-journeys",
    kind: "export",
    path: exportPath,
    producer: "automation",
    retained: true,
    scope: "Captured Azure V2 provenance export",
    recordedAt: runtime.generatedAt,
    sourceRevision,
  }));

  for (const [viewport, dimensions, width, height] of VIEWPORTS) {
    const packetPath = `reviewer-packet/screenshots/candidate-e-overview-${viewport}.png`;
    await copyContained(options.v2, `final/overview-${dimensions}.png`, options.output, packetPath);
    artifacts.push(await artifact(options.output, {
      id: `anonymous-e-${viewport}-initial`,
      candidate: "anonymous-e",
      stage: "browser-verification",
      kind: "screenshot",
      path: packetPath,
      producer: "automation",
      retained: true,
      scope: `Full-page initial overview capture at ${width}x${height}`,
      recordedAt: runtime.generatedAt,
      sourceRevision,
      capture: { viewport, state: "initial", width, height },
    }));
  }
  const resultPath = "reviewer-packet/screenshots/candidate-e-analysis-wide.png";
  await copyContained(options.v2, "final/analysis-result-1440x1000.png", options.output, resultPath);
  artifacts.push(await artifact(options.output, {
    id: "anonymous-e-wide-result",
    candidate: "anonymous-e",
    stage: "browser-verification",
    kind: "screenshot",
    path: resultPath,
    producer: "automation",
    retained: true,
    scope: "Full-page analysis-result capture at 1440x1000",
    recordedAt: runtime.generatedAt,
    sourceRevision,
    capture: { viewport: "wide", state: "result", width: 1440, height: 1000 },
  }));

  const stages = [
    ...baselineReview.stages.filter((stage) => stage.candidate !== "comparison"),
    { id: "build", candidate: "anonymous-e", status: engineering.stages.build.status, evidenceRefs: ["anonymous-e-build"] },
    { id: "typecheck", candidate: "anonymous-e", status: engineering.stages.typecheck.status, evidenceRefs: ["anonymous-e-typecheck"] },
    { id: "architecture-audit", candidate: "anonymous-e", status: engineering.stages.architectureAudit.status, evidenceRefs: ["anonymous-e-architecture-audit"] },
    { id: "browser-verification", candidate: "anonymous-e", status: runtime.passed ? "pass" : "fail", evidenceRefs: ["anonymous-e-browser-runtime", ...VIEWPORTS.map(([viewport]) => `anonymous-e-${viewport}-initial`), "anonymous-e-wide-result"] },
    { id: "product-journeys", candidate: "anonymous-e", status: runtime.journeys.every((journey) => journey.passed) ? "pass" : "fail", evidenceRefs: ["anonymous-e-product-journeys", "anonymous-e-export"] },
    { id: "human-review", candidate: "comparison", status: "not-run", evidenceRefs: [] },
  ];
  const sessionId = "item8-agent-artifact-inspection";
  const claims = CANDIDATES.flatMap((candidate) => {
    const screenshotRefs = VIEWPORTS.map(([viewport]) => `${candidate}-${viewport}-initial`);
    return [
      {
        id: `${candidate}-automated-evidence`,
        candidate,
        kind: "implementation-fact",
        statement: "Automated build, type, architecture, browser, and product-journey evidence is retained at its recorded scope.",
        evidenceType: "automated",
        evidenceRefs: [`${candidate}-build`, `${candidate}-typecheck`, `${candidate}-architecture-audit`, `${candidate}-browser-runtime`, candidate === "anonymous-e" ? `${candidate}-product-journeys` : `${candidate}-analysis-journey`],
        sessionRefs: [],
        scope: "Fixed local Azure comparison artifact; individual stages retain their own pass or fail status.",
        status: "verified",
        outcome: "partial",
        limitations: ["Execution evidence does not establish human preference, comprehension, or design quality."],
      },
      {
        id: `${candidate}-review-ready`,
        candidate,
        kind: "design-quality",
        statement: "The anonymous common-state captures are present for attributable review.",
        evidenceType: "ai-assisted-expert",
        evidenceRefs: [...screenshotRefs, `${candidate}-wide-result`],
        sessionRefs: [sessionId],
        scope: "Artifact readiness only; no score, winner, or human conclusion is asserted.",
        status: "partial",
        outcome: "not-evaluated",
        limitations: ["Only reviewer-supplied sessions can satisfy the human and representative-user decision rules."],
      },
    ];
  });
  const review = {
    version: "1.0",
    id: "azure-v2-anonymous-review-base",
    methodologyId: methodology.id,
    preparedAt: new Date(Math.max(Date.parse(runtime.generatedAt), Date.parse(recordedAt))).toISOString(),
    preparedBy: { type: "agent", name: "ZtotheZ Design Engineering" },
    candidates: CANDIDATES,
    artifacts,
    stages,
    sessions: [{
      id: sessionId,
      level: "ai-assisted-expert",
      origin: "agent-generated",
      contributor: "ZtotheZ Design Engineering",
      recordedAt: new Date().toISOString(),
      candidateOrder: CANDIDATES,
      taskResults: [],
      ratings: [],
    }],
    claims,
  };
  await writeFile(resolve(options.output, "review.yaml"), stringify(review, { lineWidth: 120 }), "utf8");

  const identityMap = {
    version: "1.0",
    scope: "Coordinator only. Never provide this file or its directory to a reviewer.",
    sourceRoots: {
      comparison: "../redesign-azure",
      target: ".",
    },
    candidates: {
      "anonymous-a": { sourceRoot: "comparison", sourceDirectory: "azure-optimizer-og", role: "Original implementation" },
      "anonymous-b": { sourceRoot: "comparison", sourceDirectory: "lovable", role: "Primary comparison implementation" },
      "anonymous-c": { sourceRoot: "comparison", sourceDirectory: "ui-ux-max-pro", role: "Secondary comparison implementation" },
      "anonymous-d": { sourceRoot: "comparison", sourceDirectory: "uix-design-skill", role: "Earlier project implementation" },
      "anonymous-e": { sourceRoot: "target", sourceDirectory: "benchmarks/azure-optimizer-v2", role: "V2 target implementation" },
    },
  };
  await writeFile(resolve(options.output, "coordinator", "candidate-map.yaml"), stringify(identityMap), "utf8");
  const coordinatorReadme = `# Azure V2 Review Coordinator Guide

Keep this directory private from every reviewer and participant. It is the only directory that maps anonymous candidates to source implementations.

## Session Assignment

Assign the first three sequences to human experts. Assign sequences 4, 5, 1, 2, and 3 to the five representative-user sessions. This yields all five required first positions and five distinct orders.

## Neutral Runtime Procedure

1. Build each candidate from the source directory recorded in candidate-map.yaml without modifying it.
2. Serve one candidate at a time on the same neutral loopback URL and reset product state before every session.
3. Give the reviewer only the assigned candidate letter, neutral URL, task prompts, and reviewer packet. Do not expose terminal paths, source labels, browser tab titles that identify a generator, or this directory.
4. Record unavailable actions and failed states as observations. Do not repair, explain, or coach the candidate during the timed task.
5. Stop timing only at the declared success, explicit failure, or participant abandonment point.
6. Ask the contributor whether candidate identities were withheld, whether they had prior candidate exposure, and whether conflicts exist. Record the answer without coaching.
7. Have the contributor review the YAML record before changing top-level status to complete.

## Evidence Handling

Store completed session files in reviewer-packet/completed-sessions. Keep all sessions, including dissent, failed tasks, and low scores. Run compile-comparison only after checking attribution, timestamp, participant pseudonym where required, assigned order, and every matrix cell.
`;
  await writeFile(resolve(options.output, "coordinator", "README.md"), coordinatorReadme, "utf8");

  const readme = `# Anonymous Azure V2 Review Packet

Do not attempt to identify candidate origins. Review all five candidates under the assigned order, identical task prompts, fixed viewport set, and common evidence rules.

## Counterbalanced Orders

| Sequence | Candidate order |
| --- | --- |
${CANDIDATES.map((_, index) => `| ${index + 1} | ${rotate(CANDIDATES.map((candidate) => candidate.replace("anonymous-", "").toUpperCase()), index).join(", ")} |`).join("\n")}

The coordinator assigns sequences. Reviewers must record the actual order in their session file.

## Human-Expert Review

1. Inspect every candidate at mobile, tablet, desktop, and wide viewports.
2. Inspect the common analysis-result capture.
3. Execute the declared states when a coordinator provides an isolated running candidate.
4. Score only disclosure consistency, decision density, visual rhythm, and responsive composition.
5. Ground every score in an observable location. Do not infer implementation quality from candidate identity.

## Representative-User Session

For every candidate, identify data origin, identify the highest priority, identify the next action, recognize live or fallback processing, and verify export provenance. The facilitator records time, errors, recovery, comprehension, confidence, and exact notes without coaching the answer.

## Evidence Rules

- Use one template appropriate to the evidence level.
- Replace every placeholder and change top-level status from draft to complete only after the contributor reviews the record.
- Store completed YAML files in completed-sessions.
- Human-expert and representative-user evidence must be supplied by the named contributor or facilitator. An agent must not complete, sign, or upgrade these records.
- Missing or unavailable behavior is a valid observed result. Record it rather than filling the gap from source inspection.
`;
  await writeFile(resolve(options.output, "reviewer-packet", "README.md"), readme, "utf8");
  await writeFile(resolve(options.output, "reviewer-packet", "human-expert-session.template.yaml"), stringify(sessionTemplate("human-expert"), { lineWidth: 120 }), "utf8");
  await writeFile(resolve(options.output, "reviewer-packet", "representative-user-session.template.yaml"), stringify(sessionTemplate("representative-user"), { lineWidth: 120 }), "utf8");
  await writeFile(resolve(options.output, "reviewer-packet", "completed-sessions", "README.md"), "# Completed Sessions\n\nPlace reviewer-supplied session YAML files here. Do not place coordinator identity records in this directory.\n", "utf8");

  process.stdout.write(`Generated ${relative(process.cwd(), options.output)} with ${artifacts.length} retained artifacts and ${CANDIDATES.length} anonymous candidates.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n\n${usage()}\n`);
  process.exitCode = 1;
});
