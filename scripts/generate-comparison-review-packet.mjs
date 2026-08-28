#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, relative, resolve, sep } from "node:path";

import { stringify } from "yaml";

const VIEWPORTS = [
  ["mobile", "375x812", 375, 812],
  ["tablet", "768x1024", 768, 1024],
  ["desktop", "1024x768", 1024, 768],
  ["wide", "1440x1000", 1440, 1000],
];

function usage() {
  return "Usage: node scripts/generate-comparison-review-packet.mjs --baseline PATH";
}

function parseArguments(argumentsList) {
  if (argumentsList.length !== 2 || argumentsList[0] !== "--baseline") {
    throw new Error(usage());
  }
  return resolve(argumentsList[1]);
}

function contained(base, candidate) {
  const relation = relative(base, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== "..");
}

async function json(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function artifact(base, values) {
  const absolutePath = resolve(base, values.path);
  if (!contained(base, absolutePath)) throw new Error(`Artifact escapes baseline: ${values.path}`);
  return { ...values, sha256: await sha256(absolutePath) };
}

function candidateLabel(candidate) {
  return `candidate-${candidate.slice("anonymous-".length)}`;
}

async function main() {
  const baseline = parseArguments(process.argv.slice(2));
  const packet = resolve(baseline, "reviewer-packet");
  if (!contained(baseline, packet)) throw new Error("Reviewer packet must remain inside the baseline");
  await rm(packet, { recursive: true, force: true });
  await mkdir(resolve(packet, "screenshots"), { recursive: true });

  const candidates = ["anonymous-a", "anonymous-b", "anonymous-c", "anonymous-d"];
  const artifacts = [];
  const stages = [];
  const claims = [];
  const recordedTimes = [];

  for (const candidate of candidates) {
    const engineeringPath = `${candidate}/engineering-evidence.json`;
    const overviewPath = `${candidate}/overview/runtime-report.json`;
    const analysisPath = `${candidate}/analysis/runtime-report.json`;
    const engineering = await json(resolve(baseline, engineeringPath));
    const overview = await json(resolve(baseline, overviewPath));
    const analysis = await json(resolve(baseline, analysisPath));
    const recordedAt = engineering.recordedAt;
    const sourceRevision = engineering.sourceRevision;
    recordedTimes.push(recordedAt, overview.generatedAt, analysis.generatedAt);

    for (const [stage, kind] of [
      ["build", "build-report"],
      ["typecheck", "typecheck-report"],
      ["architecture-audit", "static-audit"],
    ]) {
      artifacts.push(await artifact(baseline, {
        id: `${candidate}-${stage}`,
        candidate,
        stage,
        kind,
        path: engineeringPath,
        producer: "automation",
        retained: true,
        scope: `Exact command output and exit status for ${stage} at the recorded candidate source revision`,
        recordedAt,
        sourceRevision,
      }));
    }

    artifacts.push(await artifact(baseline, {
      id: `${candidate}-browser-runtime`,
      candidate,
      stage: "browser-verification",
      kind: "runtime-report",
      path: overviewPath,
      producer: "automation",
      retained: true,
      scope: "Automated browser checks and overview task at all four declared viewports",
      recordedAt: overview.generatedAt,
      sourceRevision,
      accessibility: { standard: "WCAG", version: "2.2", level: "AA", coverage: "sampled-states" },
    }));
    artifacts.push(await artifact(baseline, {
      id: `${candidate}-analysis-journey`,
      candidate,
      stage: "product-journeys",
      kind: "journey-report",
      path: analysisPath,
      producer: "automation",
      retained: true,
      scope: "Candidate-specific Azure analysis journey at the declared wide viewport",
      recordedAt: analysis.generatedAt,
      sourceRevision,
    }));

    for (const [viewport, dimensions, width, height] of VIEWPORTS) {
      const source = `${candidate}/overview/custom-${dimensions}.png`;
      const packetPath = `reviewer-packet/screenshots/${candidateLabel(candidate)}-overview-${viewport}.png`;
      await copyFile(resolve(baseline, source), resolve(baseline, packetPath));
      artifacts.push(await artifact(baseline, {
        id: `${candidate}-${viewport}-initial`,
        candidate,
        stage: "browser-verification",
        kind: "screenshot",
        path: packetPath,
        producer: "automation",
        retained: true,
        scope: `Full-page initial overview capture at ${width}x${height}`,
        recordedAt: overview.generatedAt,
        sourceRevision,
        capture: { viewport, state: "initial", width, height },
      }));
    }

    const analysisFiles = await readdir(resolve(baseline, candidate, "analysis"));
    const analysisImage = analysisFiles.find((entry) => entry.startsWith("journey-") && entry.endsWith(".png"));
    if (!analysisImage) throw new Error(`No analysis journey screenshot found for ${candidate}`);
    const analysisScreenshotPath = `${candidate}/analysis/${analysisImage}`;
    const packetAnalysisPath = `reviewer-packet/screenshots/${candidateLabel(candidate)}-analysis-wide.png`;
    await copyFile(resolve(baseline, analysisScreenshotPath), resolve(baseline, packetAnalysisPath));
    artifacts.push(await artifact(baseline, {
      id: `${candidate}-wide-result`,
      candidate,
      stage: "browser-verification",
      kind: "screenshot",
      path: packetAnalysisPath,
      producer: "automation",
      retained: true,
      scope: "Full-page analysis-result capture at 1440x1000",
      recordedAt: analysis.generatedAt,
      sourceRevision,
      capture: { viewport: "wide", state: "result", width: 1440, height: 1000 },
    }));
    const architectureStatus = engineering.stages.architectureAudit.status;
    const journeyPassed = analysis.journeys.length > 0 && analysis.journeys.every((entry) => entry.passed);
    stages.push(
      { id: "build", candidate, status: engineering.stages.build.status, evidenceRefs: [`${candidate}-build`] },
      { id: "typecheck", candidate, status: engineering.stages.typecheck.status, evidenceRefs: [`${candidate}-typecheck`] },
      { id: "architecture-audit", candidate, status: architectureStatus, evidenceRefs: [`${candidate}-architecture-audit`] },
      { id: "browser-verification", candidate, status: overview.passed ? "pass" : "fail", evidenceRefs: [`${candidate}-browser-runtime`, ...VIEWPORTS.map(([viewport]) => `${candidate}-${viewport}-initial`), `${candidate}-wide-result`] },
      { id: "product-journeys", candidate, status: journeyPassed ? "pass" : "fail", evidenceRefs: [`${candidate}-analysis-journey`] },
    );
    claims.push(
      {
        id: `${candidate}-automated-baseline`,
        candidate,
        kind: "implementation-fact",
        statement: "A production build, independent typecheck, static audit, multi-viewport browser run, and candidate-specific analysis journey were executed and retained.",
        evidenceType: "automated",
        evidenceRefs: [`${candidate}-build`, `${candidate}-typecheck`, `${candidate}-architecture-audit`, `${candidate}-browser-runtime`, `${candidate}-analysis-journey`],
        sessionRefs: [],
        scope: "Fixed local Azure comparison implementation at the recorded source-tree revision",
        status: "verified",
        outcome: "partial",
        limitations: ["A verified execution record does not imply that every stage passed.", "Human-expert and representative-user comparison evidence has not been supplied."],
      },
      {
        id: `${candidate}-agent-visual-inspection`,
        candidate,
        kind: "design-quality",
        statement: "The retained anonymous viewport matrix is ready for attributable visual, disclosure, and information-design review.",
        evidenceType: "ai-assisted-expert",
        evidenceRefs: [...VIEWPORTS.map(([viewport]) => `${candidate}-${viewport}-initial`), `${candidate}-wide-result`],
        sessionRefs: ["baseline-agent-inspection"],
        scope: "Artifact completeness and reviewer readiness only; no human-quality score or winner is asserted.",
        status: "partial",
        outcome: "not-evaluated",
        limitations: ["Agent inspection cannot substitute for human-expert or representative-user evidence."],
      },
    );
  }

  stages.push({ id: "human-review", candidate: "comparison", status: "not-run", evidenceRefs: [] });
  const preparedAt = new Date(Math.max(...recordedTimes.map((value) => Date.parse(value)))).toISOString();
  const review = {
    version: "1.0",
    id: "azure-optimizer-anonymous-baseline-v1",
    methodologyId: "operational-interface-comparison-v1",
    preparedAt,
    preparedBy: { type: "agent", name: "ZtotheZ Design Engineering" },
    candidates,
    artifacts,
    stages,
    sessions: [
      {
        id: "baseline-agent-inspection",
        level: "ai-assisted-expert",
        origin: "agent-generated",
        contributor: "ZtotheZ Design Engineering",
        recordedAt: preparedAt,
        candidateOrder: candidates,
        taskResults: [],
        ratings: [],
      },
    ],
    claims,
  };
  await writeFile(resolve(baseline, "review.yaml"), stringify(review, { lineWidth: 120 }), "utf8");

  const packetReadme = `# Anonymous Azure Interface Review Packet

Review Candidates A, B, C, and D without attempting to identify their source. Use the same task prompts, viewport files, scoring anchors, and evidence standard for every candidate.

## Required Order

Assign one counterbalanced order per reviewer or participant:

| Sequence | Candidate order |
| --- | --- |
| 1 | A, B, C, D |
| 2 | B, C, D, A |
| 3 | C, D, A, B |
| 4 | D, A, B, C |

## Tasks

1. Identify whether the displayed data is live, simulated, cached, imported, or unavailable.
2. Find the highest-priority problem and explain why it should be addressed first.
3. Identify the recommended next action and how its success will be verified.
4. Determine whether live processing or a fallback produced the analysis result.
5. Identify whether an exported result would preserve origin, freshness, environment, and limitations.

## Rating Scale

- 0: Absent, misleading, or unusable.
- 1: Present but materially deficient.
- 2: Functional and understandable.
- 3: Polished and consistently implemented.
- 4: Exceptional and supported by evidence.

Record exact observations in reviewer-session.template.yaml. Human-expert and representative-user records must be supplied by the actual contributor. An agent must not complete or sign those records.
`;
  await writeFile(resolve(packet, "README.md"), packetReadme, "utf8");

  const reviewerTemplate = {
    version: "1.0",
    session: {
      id: "replace-with-stable-session-id",
      level: "human-expert-or-representative-user",
      origin: "reviewer-supplied",
      contributor: "replace-with-reviewer-name-or-approved-pseudonym",
      participantId: "required-for-representative-user",
      recordedAt: "replace-with-iso-8601-timestamp",
      candidateOrder: ["anonymous-a", "anonymous-b", "anonymous-c", "anonymous-d"],
      taskResults: [
        {
          task: "identify-data-origin",
          candidate: "anonymous-a",
          outcome: "completed-partial-failed-or-not-run",
          durationSeconds: 0,
          navigationErrors: 0,
          recoveryAttempts: 0,
          comprehensionCorrect: false,
          confidence: 1,
          notes: "Record the observed answer and evidence location.",
        },
      ],
      ratings: [
        {
          candidate: "anonymous-a",
          criterion: "visual-rhythm",
          score: 0,
          rationale: "Record concrete visual evidence for the score.",
        },
      ],
    },
  };
  await writeFile(resolve(packet, "reviewer-session.template.yaml"), stringify(reviewerTemplate, { lineWidth: 120 }), "utf8");
  process.stdout.write(`Generated ${basename(packet)} and ${relative(process.cwd(), resolve(baseline, "review.yaml"))}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
