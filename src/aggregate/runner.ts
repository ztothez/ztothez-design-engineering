import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { AcceptanceReport, AcceptanceStatus } from "../acceptance/types.js";
import { inspectProductContract } from "../contracts/validator.js";
import type { QualityGateReport } from "../quality-gate/types.js";
import { formatAggregateReport } from "./report.js";
import {
  parsedAcceptanceReportSchema,
  parsedQualityGateReportSchema,
} from "./schema.js";
import type {
  AggregateCriterionResult,
  AggregateOptions,
  AggregateProfileResult,
  AggregateReport,
} from "./types.js";

const AGGREGATE_REPORT_VERSION = "1.0.0";

type LoadedProfile = {
  quality: QualityGateReport;
  acceptance: AcceptanceReport;
  result: AggregateProfileResult;
};

function combineStatuses(statuses: AcceptanceStatus[]): AcceptanceStatus {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("unverified")) return "unverified";
  return "pass";
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadProfileDirectory(
  directory: string,
  contractPath: string,
  contractId: string,
  failOn: "error" | "warning",
): Promise<LoadedProfile> {
  const resolvedDirectory = resolve(directory);
  const qualityReportPath = join(resolvedDirectory, "quality-gate.json");
  const acceptanceReportPath = join(resolvedDirectory, "acceptance-report.json");
  const quality = parsedQualityGateReportSchema.parse(await readJson(qualityReportPath));
  const acceptance = parsedAcceptanceReportSchema.parse(await readJson(acceptanceReportPath));
  const issues: string[] = [];
  if (!quality.profile) issues.push("Quality report has no profile ID.");
  if (quality.profile && quality.profile !== acceptance.profile) {
    issues.push(
      `Quality profile ${quality.profile} does not match acceptance profile ${acceptance.profile}.`,
    );
  }
  if (resolve(quality.contractPath) !== contractPath) {
    issues.push(`Quality report targets a different contract: ${quality.contractPath}.`);
  }
  if (acceptance.contractId !== contractId) {
    issues.push(
      `Acceptance report targets contract ${acceptance.contractId}, expected ${contractId}.`,
    );
  }
  if (quality.failOn !== failOn) {
    issues.push(
      `Quality report uses fail-on ${quality.failOn}, expected aggregate policy ${failOn}.`,
    );
  }
  const complete = quality.complete && issues.length === 0;
  return {
    quality,
    acceptance,
    result: {
      profile: quality.profile ?? acceptance.profile,
      directory: resolvedDirectory,
      qualityReportPath,
      acceptanceReportPath,
      complete,
      passed: complete && quality.passed && acceptance.passed,
      issues,
    },
  };
}

export async function aggregateQualityGates(options: AggregateOptions): Promise<AggregateReport> {
  const contractPath = resolve(options.contractPath);
  const outputDirectory = resolve(options.outputDirectory);
  const failOn = options.failOn ?? "error";
  await mkdir(outputDirectory, { recursive: true });
  const inspection = await inspectProductContract(contractPath, {
    projectRoot: resolve(options.projectRoot),
  });
  const issues = inspection.report.issues.map(
    (issue) => `${issue.code} ${issue.path}: ${issue.message}`,
  );
  const requiredProfiles = inspection.contract
    ? [...new Set(inspection.contract.verification.bindings.map((binding) => binding.profile))]
    : [];
  const loaded: LoadedProfile[] = [];

  if (inspection.contract && inspection.suite) {
    for (const directory of options.reportDirectories) {
      try {
        loaded.push(
          await loadProfileDirectory(directory, contractPath, inspection.contract.id, failOn),
        );
      } catch (error) {
        issues.push(
          `Could not load report directory ${resolve(directory)}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  const byProfile = new Map<string, LoadedProfile[]>();
  for (const entry of loaded) {
    const entries = byProfile.get(entry.result.profile) ?? [];
    entries.push(entry);
    byProfile.set(entry.result.profile, entries);
    issues.push(...entry.result.issues.map((issue) => `${entry.result.profile}: ${issue}`));
  }
  for (const profile of requiredProfiles) {
    const count = byProfile.get(profile)?.length ?? 0;
    if (count === 0) issues.push(`Missing required profile report: ${profile}.`);
    if (count > 1) issues.push(`Duplicate profile reports supplied for ${profile}.`);
  }
  for (const profile of byProfile.keys()) {
    if (!requiredProfiles.includes(profile)) issues.push(`Unexpected profile report supplied: ${profile}.`);
  }

  const criteria: AggregateCriterionResult[] = inspection.contract
    ? inspection.contract.acceptanceCriteria.flatMap((criterion) => {
        const profileIds = [
          ...new Set(
            inspection.contract!.verification.bindings
              .filter((binding) => binding.acceptanceCriteria.includes(criterion.id))
              .map((binding) => binding.profile),
          ),
        ];
        if (profileIds.length === 0) return [];
        const profiles = profileIds.map((profile) => {
          const entry = byProfile.get(profile)?.[0];
          const result = entry?.acceptance.criteria.find((item) => item.id === criterion.id);
          return {
            profile,
            status: result?.status ?? "unverified" as const,
            ...(entry ? { acceptanceReportPath: entry.result.acceptanceReportPath } : {}),
          };
        });
        return [{
          id: criterion.id,
          title: criterion.title,
          severity: criterion.severity,
          status: combineStatuses(profiles.map((profile) => profile.status)),
          profiles,
        }];
      })
    : [];

  const profileResults = loaded.map((entry) => entry.result);
  const summary = {
    profilesRequired: requiredProfiles.length,
    profilesSupplied: new Set(profileResults.map((entry) => entry.profile)).size,
    profilesPassed: requiredProfiles.filter(
      (profile) => byProfile.get(profile)?.length === 1 && byProfile.get(profile)?.[0]?.result.passed,
    ).length,
    criteriaPassed: criteria.filter((criterion) => criterion.status === "pass").length,
    criteriaFailed: criteria.filter((criterion) => criterion.status === "fail").length,
    criteriaUnverified: criteria.filter((criterion) => criterion.status === "unverified").length,
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
  const complete =
    inspection.report.passed &&
    issues.length === 0 &&
    requiredProfiles.length > 0 &&
    summary.profilesSupplied === requiredProfiles.length &&
    requiredProfiles.every(
      (profile) => byProfile.get(profile)?.length === 1 && byProfile.get(profile)?.[0]?.result.complete,
    );
  const criteriaPass =
    summary.blockerFailures === 0 &&
    summary.blockerUnverified === 0 &&
    (failOn === "error" ||
      (summary.warningFailures === 0 && summary.warningUnverified === 0));
  const report: AggregateReport = {
    version: AGGREGATE_REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    ...(inspection.contract ? { contractId: inspection.contract.id } : {}),
    contractPath,
    outputDirectory,
    failOn,
    requiredProfiles,
    suppliedProfiles: [...byProfile.keys()],
    profiles: profileResults,
    criteria,
    issues,
    summary,
    complete,
    passed:
      complete &&
      criteriaPass &&
      requiredProfiles.every((profile) => byProfile.get(profile)?.[0]?.result.passed),
  };
  await writeFile(
    join(outputDirectory, "aggregate-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    join(outputDirectory, "aggregate-report.md"),
    `${formatAggregateReport(report)}\n`,
    "utf8",
  );
  return report;
}
