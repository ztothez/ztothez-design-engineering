import { resolve } from "node:path";

import type {
  HeuristicAcceptanceCandidate,
  HeuristicFinding,
  HeuristicReview,
  HeuristicReviewReport,
} from "./schema.js";

const REPORT_VERSION = "1.0.0";

function evidenceForValidation(
  method: HeuristicFinding["validation"]["method"],
): HeuristicAcceptanceCandidate["evidence"] {
  if (method === "runtime") return ["runtime"];
  if (method === "accessibility") return ["accessibility"];
  if (method === "screenshot-review") return ["screenshot", "manual-review"];
  return ["manual-review"];
}

function criterionId(findingId: string): string {
  return `heuristic-${findingId}`.slice(0, 64).replace(/-+$/g, "");
}

function acceptanceCandidate(
  finding: HeuristicFinding,
  review: HeuristicReview,
): HeuristicAcceptanceCandidate {
  const task = review.tasks.find((candidate) => candidate.id === finding.task);
  if (!task) throw new Error(`Finding ${finding.id} references unavailable task ${finding.task}`);
  const requirement = [
    finding.remediation,
    `Validation: ${finding.validation.procedure}`,
  ].join(" ");
  return {
    sourceFinding: finding.id,
    id: criterionId(finding.id),
    title: finding.title,
    severity: "blocker",
    requirement: requirement.slice(0, 2_048),
    evidence: evidenceForValidation(finding.validation.method),
    appliesToModes: task.modes,
  };
}

export function evaluateHeuristicReview(
  review: HeuristicReview,
  sourcePath: string,
): HeuristicReviewReport {
  const open = review.findings.filter((finding) => finding.status === "open");
  const acceptanceCandidates = open
    .filter((finding) => finding.severity >= 3)
    .map((finding) => acceptanceCandidate(finding, review));
  const evidence = review.findings.flatMap((finding) => finding.evidence);

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourcePath: resolve(sourcePath),
    reviewId: review.id,
    product: review.product,
    findings: review.findings,
    acceptanceCandidates,
    evidenceLevels: {
      automated: evidence.filter((entry) => entry.level === "automated").length,
      aiAssistedExpert: evidence.filter((entry) => entry.level === "ai-assisted-expert").length,
      humanExpert: evidence.filter((entry) => entry.level === "human-expert").length,
      representativeUser: evidence.filter((entry) => entry.level === "representative-user").length,
    },
    summary: {
      total: review.findings.length,
      open: open.length,
      resolved: review.findings.filter((finding) => finding.status === "resolved").length,
      acceptedRisk: review.findings.filter((finding) => finding.status === "accepted-risk").length,
      severity3: review.findings.filter((finding) => finding.severity === 3).length,
      severity4: review.findings.filter((finding) => finding.severity === 4).length,
      acceptanceCandidates: acceptanceCandidates.length,
    },
    requiresAcceptanceWork: acceptanceCandidates.length > 0,
  };
}
