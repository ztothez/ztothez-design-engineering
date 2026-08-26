export type QualityGateFailOn = "error" | "warning";
export type QualityGateStageStatus = "pass" | "fail" | "skipped";

export type QualityGateStage = {
  status: QualityGateStageStatus;
  errors: number;
  warnings: number;
  info: number;
  evidence: string[];
  message?: string;
};

export type QualityGateReport = {
  version: string;
  generatedAt: string;
  outputDirectory: string;
  contractPath: string;
  repository: string;
  url?: string;
  profile?: string;
  failOn: QualityGateFailOn;
  stages: {
    contract: QualityGateStage;
    architecture: QualityGateStage;
    runtime: QualityGateStage;
    acceptance: QualityGateStage;
  };
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
  complete: boolean;
  passed: boolean;
};

export type QualityGateOptions = {
  contractPath: string;
  projectRoot: string;
  repository: string;
  outputDirectory: string;
  url?: string;
  profile?: string;
  failOn?: QualityGateFailOn;
  settleMs?: number;
  chromiumPath?: string;
  attestationsPath?: string;
};
