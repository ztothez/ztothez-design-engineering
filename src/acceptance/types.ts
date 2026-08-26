import type { ProductContract } from "../contracts/schema.js";

export type AcceptanceStatus = "pass" | "fail" | "unverified";
export type AcceptanceEvidenceType = ProductContract["acceptanceCriteria"][number]["evidence"][number];

export type AcceptanceEvidenceResult = {
  type: AcceptanceEvidenceType;
  status: AcceptanceStatus;
  message: string;
  evidence: string[];
};

export type AcceptanceCriterionResult = {
  id: string;
  title: string;
  severity: "blocker" | "warning";
  status: AcceptanceStatus;
  journeys: string[];
  evidence: AcceptanceEvidenceResult[];
};

export type AcceptanceAttestation = {
  criterion: string;
  status: "pass" | "fail";
  reviewer: string;
  reviewedAt: string;
  notes: string;
  evidence: string[];
};

export type AcceptanceAttestationFile = {
  version: "1.0";
  contract: string;
  attestations: AcceptanceAttestation[];
};

export type AcceptanceReport = {
  version: string;
  generatedAt: string;
  contractId: string;
  profile: string;
  criteria: AcceptanceCriterionResult[];
  summary: {
    passed: number;
    failed: number;
    unverified: number;
    blockerFailures: number;
    blockerUnverified: number;
    warningFailures: number;
    warningUnverified: number;
  };
  passed: boolean;
};
