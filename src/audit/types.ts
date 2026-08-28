import type ts from "typescript";

export type AuditSeverity = "error" | "warning" | "info";
export type AuditConfidence = "high" | "medium" | "low";

export type AuditFinding = {
  ruleId: string;
  severity: AuditSeverity;
  confidence: AuditConfidence;
  file: string;
  line?: number;
  column?: number;
  message: string;
  evidence: string[];
  remediation: string;
};

export type AuditSkippedFile = {
  file: string;
  reason: string;
};

export type AuditSummary = {
  errors: number;
  warnings: number;
  info: number;
};

export type AuditReport = {
  version: string;
  target: string;
  generatedAt: string;
  filesScanned: number;
  bytesScanned: number;
  skippedFiles: AuditSkippedFile[];
  findings: AuditFinding[];
  summary: AuditSummary;
  passed: boolean;
  evidenceBoundary: {
    verifierLimitations: string[];
    humanReviewRequired: string[];
  };
};

export type AuditPolicy = {
  componentLineWarning: number;
  mixedResponsibilitiesMinLines: number;
  rawColorWarningCount: number;
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  ignoredDirectories: readonly string[];
  sourceExtensions: readonly string[];
  requiredPackageScripts: readonly string[];
  requiredPackageScriptGroups: readonly (readonly string[])[];
};

export type AuditSourceFile = {
  absolutePath: string;
  relativePath: string;
  extension: string;
  content: string;
  lines: string[];
  sourceFile?: ts.SourceFile;
};

export type AuditRule = {
  id: string;
  evaluate(file: AuditSourceFile, policy: AuditPolicy): AuditFinding[];
};
