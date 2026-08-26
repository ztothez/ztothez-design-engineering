import type { ContractValidationReport, JourneySuite, ProductContract } from "../contracts/schema.js";
import type { RuntimeFinding, RuntimeJourneyResult, RuntimeReport } from "../runtime/types.js";
import type {
  AcceptanceAttestationFile,
  AcceptanceCriterionResult,
  AcceptanceEvidenceResult,
  AcceptanceEvidenceType,
  AcceptanceReport,
  AcceptanceStatus,
} from "./types.js";

const ACCEPTANCE_REPORT_VERSION = "1.0.0";

type EvaluationInput = {
  contract: ProductContract;
  suite: JourneySuite;
  profile: string;
  contractReport: ContractValidationReport;
  runtimeReport: RuntimeReport;
  attestations?: AcceptanceAttestationFile;
};

function combineStatus(results: AcceptanceEvidenceResult[]): AcceptanceStatus {
  if (results.some((result) => result.status === "fail")) return "fail";
  if (results.some((result) => result.status === "unverified")) return "unverified";
  return "pass";
}

function findingsFor(report: RuntimeReport, checkIds: string[]): RuntimeFinding[] {
  return report.findings.filter(
    (finding) => finding.severity === "error" && checkIds.includes(finding.checkId),
  );
}

function failedFindingEvidence(findings: RuntimeFinding[]): string[] {
  return findings.map(
    (finding) =>
      `${finding.checkId}${finding.viewport ? ` ${finding.viewport}` : ""}${finding.journey ? ` ${finding.journey}` : ""}: ${finding.message}`,
  );
}

function journeyEvidence(
  journeyNames: string[],
  journeyResults: RuntimeJourneyResult[],
): AcceptanceEvidenceResult {
  const results = journeyNames.map((name) => journeyResults.find((journey) => journey.name === name));
  const missing = journeyNames.filter((_, index) => !results[index]);
  if (missing.length > 0) {
    return {
      type: "runtime",
      status: "unverified",
      message: "Bound journeys did not produce runtime results.",
      evidence: missing.map((name) => `Missing journey result: ${name}`),
    };
  }
  const failed = results.filter((result) => result && !result.passed);
  return {
    type: "runtime",
    status: failed.length > 0 ? "fail" : "pass",
    message:
      failed.length > 0
        ? "One or more bound product journeys failed."
        : "All bound product journeys passed.",
    evidence: results.map(
      (result) =>
        `${result!.name}: ${result!.stepsCompleted}/${result!.totalSteps} steps completed`,
    ),
  };
}

function evaluateEvidence(
  type: AcceptanceEvidenceType,
  journeyNames: string[],
  input: EvaluationInput,
  criterionId: string,
): AcceptanceEvidenceResult {
  if (type === "contract") {
    return {
      type,
      status: input.contractReport.passed ? "pass" : "fail",
      message: input.contractReport.passed
        ? "Product contract and cross-references are valid."
        : "Product contract validation failed.",
      evidence: input.contractReport.issues.map((entry) => `${entry.code} ${entry.path}: ${entry.message}`),
    };
  }

  if (type === "runtime") {
    const journeys = journeyEvidence(journeyNames, input.runtimeReport.journeys);
    const infrastructureFailures = findingsFor(input.runtimeReport, ["ZTDE-RUNTIME-001", "ZTDE-RUNTIME-008"]);
    if (infrastructureFailures.length > 0) {
      return {
        type,
        status: "fail",
        message: "Runtime navigation or journey execution failed.",
        evidence: failedFindingEvidence(infrastructureFailures),
      };
    }
    return journeys;
  }

  const checkIds =
    type === "screenshot"
      ? ["ZTDE-RUNTIME-004", "ZTDE-RUNTIME-007", "ZTDE-RUNTIME-010", "ZTDE-RUNTIME-015"]
      : type === "network"
        ? ["ZTDE-RUNTIME-003", "ZTDE-RUNTIME-009"]
        : type === "accessibility"
          ? [
              "ZTDE-RUNTIME-005",
              "ZTDE-RUNTIME-006",
              "ZTDE-RUNTIME-011",
              "ZTDE-RUNTIME-012",
              "ZTDE-RUNTIME-013",
              "ZTDE-RUNTIME-014",
              "ZTDE-RUNTIME-015",
              "ZTDE-RUNTIME-016",
            ]
          : [];
  if (checkIds.length > 0) {
    const failures = findingsFor(input.runtimeReport, checkIds);
    if (type === "network") {
      const responses = input.runtimeReport.journeys
        .filter((journey) => journeyNames.includes(journey.name))
        .flatMap((journey) =>
          (journey.evidence ?? []).filter((entry) => entry.kind === "response"),
        );
      if (failures.length === 0 && responses.length === 0) {
        return {
          type,
          status: "unverified",
          message: "No bound journey captured a verified network response.",
          evidence: [],
        };
      }
      if (failures.length === 0) {
        return {
          type,
          status: "pass",
          message: "Bound journeys captured network evidence without blocker failures.",
          evidence: responses.map((response) => response.description),
        };
      }
    }
    if (type === "screenshot") {
      const expected = new Set(input.contract.verification.viewports.map((viewport) => viewport.name));
      const captured = new Set(input.runtimeReport.screenshots.map((screenshot) => screenshot.name));
      const missing = [...expected].filter((name) => !captured.has(name));
      if (failures.length === 0 && missing.length > 0) {
        return {
          type,
          status: "unverified",
          message: "Required viewport screenshots are missing.",
          evidence: missing.map((name) => `Missing screenshot: ${name}`),
        };
      }
    }
    const evidence =
      type === "screenshot"
        ? input.runtimeReport.screenshots.map(
            (screenshot) => `${screenshot.name}: ${screenshot.path}`,
          )
        : [];
    return {
      type,
      status: failures.length > 0 ? "fail" : "pass",
      message:
        failures.length > 0
          ? `${type} verification reported blocker findings.`
          : `${type} verification produced no blocker findings.`,
      evidence: [...failedFindingEvidence(failures), ...evidence],
    };
  }

  if (type === "export") {
    const downloads = input.runtimeReport.journeys
      .filter((journey) => journeyNames.includes(journey.name))
      .flatMap((journey) =>
        (journey.evidence ?? []).filter((entry) => entry.kind === "download"),
      );
    return {
      type,
      status: downloads.length > 0 ? "pass" : "unverified",
      message:
        downloads.length > 0
          ? "A bound journey captured download evidence."
          : "No bound journey captured a verified download.",
      evidence: downloads.map((download) => download.description),
    };
  }

  const attestation = input.attestations?.attestations.find(
    (entry) => entry.criterion === criterionId,
  );
  if (!attestation) {
    return {
      type: "manual-review",
      status: "unverified",
      message: "No manual-review attestation was supplied.",
      evidence: [],
    };
  }
  return {
    type: "manual-review",
    status: attestation.status,
    message: `${attestation.reviewer} reviewed this criterion at ${attestation.reviewedAt}: ${attestation.notes}`,
    evidence: attestation.evidence,
  };
}

export function evaluateAcceptance(input: EvaluationInput): AcceptanceReport {
  if (input.attestations && input.attestations.contract !== input.contract.id) {
    throw new Error(
      `Attestation file targets ${input.attestations.contract}, expected ${input.contract.id}`,
    );
  }
  const profile = input.suite.profiles.find((candidate) => candidate.id === input.profile);
  if (!profile) throw new Error(`Unknown acceptance profile: ${input.profile}`);
  const journeyNamesById = new Map(profile.journeys.map((journey) => [journey.id, journey.name]));
  const bindings = input.contract.verification.bindings.filter(
    (binding) => binding.profile === input.profile,
  );
  const criterionIds = new Set(bindings.flatMap((binding) => binding.acceptanceCriteria));
  const criteria: AcceptanceCriterionResult[] = input.contract.acceptanceCriteria
    .filter((criterion) => criterionIds.has(criterion.id))
    .map((criterion) => {
      const journeys = [
        ...new Set(
          bindings
            .filter((binding) => binding.acceptanceCriteria.includes(criterion.id))
            .map((binding) => journeyNamesById.get(binding.journey))
            .filter((name): name is string => Boolean(name)),
        ),
      ];
      const evidence = criterion.evidence.map((type) =>
        evaluateEvidence(type, journeys, input, criterion.id),
      );
      return {
        id: criterion.id,
        title: criterion.title,
        severity: criterion.severity,
        status: combineStatus(evidence),
        journeys,
        evidence,
      };
    });

  const summary = {
    passed: criteria.filter((criterion) => criterion.status === "pass").length,
    failed: criteria.filter((criterion) => criterion.status === "fail").length,
    unverified: criteria.filter((criterion) => criterion.status === "unverified").length,
    blockerFailures: criteria.filter(
      (criterion) => criterion.severity === "blocker" && criterion.status === "fail",
    ).length,
    blockerUnverified: criteria.filter(
      (criterion) => criterion.severity === "blocker" && criterion.status === "unverified",
    ).length,
    warningFailures: criteria.filter(
      (criterion) => criterion.severity === "warning" && criterion.status === "fail",
    ).length,
    warningUnverified: criteria.filter(
      (criterion) => criterion.severity === "warning" && criterion.status === "unverified",
    ).length,
  };
  return {
    version: ACCEPTANCE_REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    contractId: input.contract.id,
    profile: input.profile,
    criteria,
    summary,
    passed: summary.blockerFailures === 0 && summary.blockerUnverified === 0,
  };
}
