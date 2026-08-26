import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { evaluateHeuristicReview } from "../src/heuristics/evaluator.js";
import { loadHeuristicReview } from "../src/heuristics/loader.js";
import { formatAcceptanceCandidates } from "../src/heuristics/report.js";
import { heuristicReviewSchema } from "../src/heuristics/schema.js";

const fixture = resolve(process.cwd(), "tests", "fixtures", "heuristic-review.yaml");
const template = resolve(
  process.cwd(),
  "knowledge-base",
  "usability-evaluation",
  "heuristic-review.template.yaml",
);

test("heuristic reviews preserve provenance and derive blocker acceptance candidates", async () => {
  const review = await loadHeuristicReview(fixture);
  const report = evaluateHeuristicReview(review, fixture);

  assert.equal(report.summary.total, 2);
  assert.equal(report.summary.open, 1);
  assert.equal(report.summary.resolved, 1);
  assert.equal(report.summary.acceptanceCandidates, 1);
  assert.equal(report.requiresAcceptanceWork, true);
  assert.deepEqual(report.evidenceLevels, {
    automated: 1,
    aiAssistedExpert: 1,
    humanExpert: 2,
    representativeUser: 1,
  });
  assert.deepEqual(report.acceptanceCandidates[0], {
    sourceFinding: "missing-submit-state",
    id: "heuristic-missing-submit-state",
    title: "Submission provides no immediate progress state",
    severity: "blocker",
    requirement:
      "Disable duplicate submission and expose a visible, programmatically announced pending state. Validation: Verify one request, disabled repeat activation, visible progress, and an aria-live announcement.",
    evidence: ["accessibility"],
    appliesToModes: ["checkout"],
  });

  const yaml = formatAcceptanceCandidates(report.acceptanceCandidates);
  assert.match(yaml, /acceptanceCriteria:/);
  assert.doesNotMatch(yaml, /sourceFinding/);
});

test("the maintained template is valid and severity 3 remains release-blocking", async () => {
  const review = await loadHeuristicReview(template);
  const report = evaluateHeuristicReview(review, template);

  assert.equal(report.summary.severity3, 1);
  assert.equal(report.summary.acceptanceCandidates, 1);
  assert.equal(report.acceptanceCandidates[0]?.severity, "blocker");
});

test("human and representative-user evidence require attributable review metadata", () => {
  const invalid = {
    version: "1.0",
    id: "invalid-review",
    product: "Invalid fixture",
    target: "fixture",
    preparedAt: "2026-08-25T12:00:00+03:00",
    preparedBy: { type: "agent", name: "Fixture agent" },
    tasks: [
      {
        id: "task",
        actor: "User",
        scenario: "Complete a task",
        successCriteria: ["Task completes"],
        modes: ["primary"],
      },
    ],
    findings: [
      {
        id: "finding",
        title: "Finding",
        task: "task",
        heuristic: { id: "visibility", name: "Visibility" },
        location: "Page",
        trigger: "Submit",
        observation: "No feedback",
        impact: "Duplicate action",
        evidence: [{ level: "human-expert", source: "session", detail: "Observed" }],
        severity: 3,
        confidence: "high",
        status: "open",
        remediation: "Show feedback",
        validation: { method: "expert-review", procedure: "Repeat review" },
      },
    ],
  };

  const result = heuristicReviewSchema.safeParse(invalid);
  assert.equal(result.success, false);
  assert.match(JSON.stringify(result.error?.issues), /require contributor and recordedAt/);
});

test("resolved findings require a recorded decision and open findings cannot claim one", async () => {
  const review = await loadHeuristicReview(fixture);
  const resolvedWithoutDecision = structuredClone(review);
  delete resolvedWithoutDecision.findings[1]!.resolution;
  assert.equal(heuristicReviewSchema.safeParse(resolvedWithoutDecision).success, false);

  const openWithDecision = structuredClone(review);
  openWithDecision.findings[0]!.resolution = {
    rationale: "Not actually resolved",
    decidedBy: "Fixture",
    decidedAt: "2026-08-25T13:15:00+03:00",
  };
  assert.equal(heuristicReviewSchema.safeParse(openWithDecision).success, false);
});
