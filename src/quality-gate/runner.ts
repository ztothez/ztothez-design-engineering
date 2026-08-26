import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { formatAuditReport } from "../audit/report.js";
import { auditRepository } from "../audit/scanner.js";
import { evaluateAcceptance } from "../acceptance/evaluator.js";
import { loadAcceptanceAttestations } from "../acceptance/loader.js";
import { formatAcceptanceReport } from "../acceptance/report.js";
import { formatContractValidationReport } from "../contracts/report.js";
import { inspectProductContract } from "../contracts/validator.js";
import { formatRuntimeReport } from "../runtime/report.js";
import type { RuntimeReport } from "../runtime/types.js";
import { verifyUiRuntime } from "../runtime/verifier.js";
import { formatQualityGateReport } from "./report.js";
import type {
  QualityGateOptions,
  QualityGateReport,
  QualityGateStage,
} from "./types.js";

const QUALITY_GATE_VERSION = "1.0.0";

async function writeEvidence(path: string, content: string | object): Promise<void> {
  await writeFile(
    path,
    typeof content === "string" ? `${content}\n` : `${JSON.stringify(content, null, 2)}\n`,
    "utf8",
  );
}

function skippedStage(message: string): QualityGateStage {
  return { status: "skipped", errors: 0, warnings: 0, info: 0, evidence: [], message };
}

export async function runQualityGate(options: QualityGateOptions): Promise<QualityGateReport> {
  const outputDirectory = resolve(options.outputDirectory);
  const contractPath = resolve(options.contractPath);
  const repository = resolve(options.repository);
  const failOn = options.failOn ?? "error";
  await mkdir(outputDirectory, { recursive: true });

  const inspection = await inspectProductContract(contractPath, {
    projectRoot: resolve(options.projectRoot),
  });
  const contractJson = join(outputDirectory, "contract-report.json");
  const contractMarkdown = join(outputDirectory, "contract-report.md");
  await writeEvidence(contractJson, inspection.report);
  await writeEvidence(contractMarkdown, formatContractValidationReport(inspection.report));
  const contractStage: QualityGateStage = {
    status: inspection.report.passed ? "pass" : "fail",
    errors: inspection.report.issues.length,
    warnings: 0,
    info: 0,
    evidence: [contractJson, contractMarkdown],
  };

  const architectureReport = await auditRepository(repository);
  const architectureJson = join(outputDirectory, "architecture-report.json");
  const architectureMarkdown = join(outputDirectory, "architecture-report.md");
  await writeEvidence(architectureJson, architectureReport);
  await writeEvidence(architectureMarkdown, formatAuditReport(architectureReport));
  const architectureStage: QualityGateStage = {
    status: architectureReport.passed ? "pass" : "fail",
    ...architectureReport.summary,
    evidence: [architectureJson, architectureMarkdown],
  };

  let runtimeStage: QualityGateStage;
  let runtimeReport: RuntimeReport | undefined;
  if (!options.url || !options.profile) {
    runtimeStage = skippedStage(
      "Runtime requires both a URL and a journey profile. A skipped runtime stage cannot produce a passing quality gate.",
    );
  } else if (!inspection.report.passed || !inspection.contract || !inspection.suite) {
    runtimeStage = skippedStage("Runtime was not executed because the product contract is invalid.");
  } else {
    const profile = inspection.suite.profiles.find((candidate) => candidate.id === options.profile);
    if (!profile) {
      runtimeStage = {
        status: "fail",
        errors: 1,
        warnings: 0,
        info: 0,
        evidence: [],
        message: `Unknown journey profile ${options.profile}.`,
      };
    } else {
      const runtimeDirectory = join(outputDirectory, "runtime");
      runtimeReport = await verifyUiRuntime({
        url: options.url,
        outputDirectory: runtimeDirectory,
        viewports: inspection.contract.verification.viewports,
        journeys: profile.journeys.map(({ name, steps }) => ({ name, steps })),
        expectedNetwork: profile.expectedNetwork ?? [],
        ...(options.settleMs === undefined ? {} : { settleMs: options.settleMs }),
        ...(options.chromiumPath ? { chromiumPath: options.chromiumPath } : {}),
      });
      const runtimeMarkdown = join(runtimeDirectory, "runtime-report.md");
      runtimeStage = {
        status: runtimeReport.passed ? "pass" : "fail",
        ...runtimeReport.summary,
        evidence: [join(runtimeDirectory, "runtime-report.json"), runtimeMarkdown],
        message: `${runtimeReport.journeys.filter((journey) => journey.passed).length}/${runtimeReport.journeys.length} journeys passed; ${runtimeReport.screenshots.length} screenshots captured.`,
      };
      await writeEvidence(runtimeMarkdown, formatRuntimeReport(runtimeReport));
    }
  }

  let acceptanceStage: QualityGateStage;
  if (
    !runtimeReport ||
    !options.profile ||
    !inspection.report.passed ||
    !inspection.contract ||
    !inspection.suite
  ) {
    acceptanceStage = skippedStage(
      "Acceptance evidence requires a valid contract and completed runtime profile.",
    );
  } else {
    const attestations = options.attestationsPath
      ? await loadAcceptanceAttestations(options.attestationsPath)
      : undefined;
    const acceptanceReport = evaluateAcceptance({
      contract: inspection.contract,
      suite: inspection.suite,
      profile: options.profile,
      contractReport: inspection.report,
      runtimeReport,
      ...(attestations ? { attestations } : {}),
    });
    const acceptanceJson = join(outputDirectory, "acceptance-report.json");
    const acceptanceMarkdown = join(outputDirectory, "acceptance-report.md");
    await writeEvidence(acceptanceJson, acceptanceReport);
    await writeEvidence(acceptanceMarkdown, formatAcceptanceReport(acceptanceReport));
    acceptanceStage = {
      status: acceptanceReport.passed ? "pass" : "fail",
      errors:
        acceptanceReport.summary.blockerFailures +
        acceptanceReport.summary.blockerUnverified,
      warnings:
        acceptanceReport.summary.warningFailures +
        acceptanceReport.summary.warningUnverified,
      info: 0,
      evidence: [acceptanceJson, acceptanceMarkdown],
      message: `${acceptanceReport.summary.passed} passed, ${acceptanceReport.summary.failed} failed, ${acceptanceReport.summary.unverified} unverified criteria in profile scope.`,
    };
  }

  const stages = {
    contract: contractStage,
    architecture: architectureStage,
    runtime: runtimeStage,
    acceptance: acceptanceStage,
  };
  const summary = Object.values(stages).reduce(
    (total, stage) => ({
      errors: total.errors + stage.errors,
      warnings: total.warnings + stage.warnings,
      info: total.info + stage.info,
    }),
    { errors: 0, warnings: 0, info: 0 },
  );
  const complete =
    runtimeStage.status !== "skipped" &&
    runtimeStage.evidence.length > 0 &&
    acceptanceStage.status !== "skipped";
  const passed =
    complete &&
    summary.errors === 0 &&
    (failOn === "error" || summary.warnings === 0);
  const report: QualityGateReport = {
    version: QUALITY_GATE_VERSION,
    generatedAt: new Date().toISOString(),
    outputDirectory,
    contractPath,
    repository,
    ...(options.url ? { url: options.url } : {}),
    ...(options.profile ? { profile: options.profile } : {}),
    failOn,
    stages,
    summary,
    complete,
    passed,
  };
  await writeEvidence(join(outputDirectory, "quality-gate.json"), report);
  await writeEvidence(join(outputDirectory, "quality-gate.md"), formatQualityGateReport(report));
  return report;
}
