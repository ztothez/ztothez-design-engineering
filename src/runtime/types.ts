export type RuntimeSeverity = "error" | "warning" | "info";

export type RuntimeViewport = {
  name: string;
  width: number;
  height: number;
};

export type RuntimeFinding = {
  checkId: string;
  severity: RuntimeSeverity;
  message: string;
  evidence: string[];
  viewport?: string;
  journey?: string;
  selector?: string;
};

export type RuntimeScreenshot = {
  name: string;
  path: string;
  width: number;
  height: number;
  fullPage: boolean;
  sha256: string;
  dynamicSelectors: string[];
};

export type RuntimeScreenshotRegression = {
  status: "not-configured" | "created" | "matched" | "mismatched";
  baselinePath?: string;
  compared: number;
  mismatches: string[];
};

export type RuntimeEvidenceBoundary = {
  verifierLimitations: string[];
  humanReviewRequired: string[];
};

export type RuntimeJourneyEvidence = {
  kind: "download" | "response" | "json" | "attribute";
  step: number;
  description: string;
  path?: string;
};

export type JourneyJsonValue = string | number | boolean | null;

export type JourneyStep =
  | { action: "navigate"; value: string }
  | { action: "click"; selector: string }
  | { action: "fill"; selector: string; value: string }
  | { action: "press"; selector?: string; value: string }
  | { action: "waitFor"; selector: string }
  | { action: "expectVisible"; selector: string }
  | { action: "expectValue"; selector: string; value: string }
  | { action: "expectAttribute"; selector: string; name: string; value: string }
  | { action: "expectJson"; selector: string; path: string; value: JourneyJsonValue }
  | { action: "expectDownload"; selector: string; filenameIncludes?: string }
  | {
      action: "expectResponse";
      selector: string;
      urlIncludes: string;
      status: number;
      method?: string;
    }
  | { action: "expectText"; selector: string; value: string };

export type RuntimeJourney = {
  name: string;
  steps: JourneyStep[];
};

export type RuntimeJourneyResult = {
  name: string;
  passed: boolean;
  stepsCompleted: number;
  totalSteps: number;
  screenshot?: string;
  evidence?: RuntimeJourneyEvidence[];
};

export type RuntimeExpectedNetwork = {
  id: string;
  method: string;
  urlIncludes: string;
  status?: number;
  allowRequestFailure?: boolean;
  minOccurrences: number;
  maxOccurrences?: number;
};

export type RuntimeExpectedNetworkObservation = RuntimeExpectedNetwork & {
  occurrences: number;
  evidence: string[];
  satisfied: boolean;
};

export type RuntimeSummary = {
  errors: number;
  warnings: number;
  info: number;
};

export type RuntimeReport = {
  version: string;
  url: string;
  generatedAt: string;
  browser: string;
  outputDirectory: string;
  viewports: RuntimeViewport[];
  screenshots: RuntimeScreenshot[];
  screenshotRegression: RuntimeScreenshotRegression;
  journeys: RuntimeJourneyResult[];
  expectedNetwork: RuntimeExpectedNetworkObservation[];
  findings: RuntimeFinding[];
  summary: RuntimeSummary;
  passed: boolean;
  evidenceBoundary: RuntimeEvidenceBoundary;
};

export type RuntimeVerificationOptions = {
  url: string;
  outputDirectory: string;
  viewports?: RuntimeViewport[];
  journeys?: RuntimeJourney[];
  expectedNetwork?: RuntimeExpectedNetwork[];
  navigationTimeoutMs?: number;
  settleMs?: number;
  chromiumPath?: string;
  chromiumCdpUrl?: string;
  dynamicSelectors?: string[];
  screenshotBaselinePath?: string;
  updateScreenshotBaseline?: boolean;
};
