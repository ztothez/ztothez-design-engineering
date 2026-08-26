import type { AcceptanceStatus } from "../acceptance/types.js";
import type { QualityGateFailOn } from "../quality-gate/types.js";

export type AggregateProfileResult = {
  profile: string;
  directory: string;
  qualityReportPath: string;
  acceptanceReportPath: string;
  complete: boolean;
  passed: boolean;
  issues: string[];
};

export type AggregateCriterionProfileResult = {
  profile: string;
  status: AcceptanceStatus;
  acceptanceReportPath?: string;
};

export type AggregateCriterionResult = {
  id: string;
  title: string;
  severity: "blocker" | "warning";
  status: AcceptanceStatus;
  profiles: AggregateCriterionProfileResult[];
};

export type AggregateReport = {
  version: string;
  generatedAt: string;
  contractId?: string;
  contractPath: string;
  outputDirectory: string;
  failOn: QualityGateFailOn;
  requiredProfiles: string[];
  suppliedProfiles: string[];
  profiles: AggregateProfileResult[];
  criteria: AggregateCriterionResult[];
  issues: string[];
  summary: {
    profilesRequired: number;
    profilesSupplied: number;
    profilesPassed: number;
    criteriaPassed: number;
    criteriaFailed: number;
    criteriaUnverified: number;
    blockerFailures: number;
    blockerUnverified: number;
    warningFailures: number;
    warningUnverified: number;
  };
  complete: boolean;
  passed: boolean;
};

export type AggregateOptions = {
  contractPath: string;
  projectRoot: string;
  reportDirectories: string[];
  outputDirectory: string;
  failOn?: QualityGateFailOn;
};
