export type RuntimeSeverity = "error" | "warning" | "info";
export type RuntimeColorScheme = "light" | "dark";
export type InteractionCheckpoint =
  | "start"
  | "success"
  | "failure"
  | "preserved-state"
  | "keyboard"
  | "export"
  | "offline"
  | "disconnected"
  | "loading"
  | "empty"
  | "partial"
  | "stale"
  | "unauthorized"
  | "error";

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
  kind: "download" | "response" | "json" | "attribute" | "checkpoint";
  step: number;
  description: string;
  path?: string;
};

export type JourneyJsonValue = string | number | boolean | null;

export type JourneyStep =
  | { action: "navigate"; value: string }
  | { action: "setNetwork"; state: "online" | "offline" }
  | { action: "setStorage"; state: "available" | "unavailable" }
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
  | { action: "expectText"; selector: string; value: string }
  | { action: "checkpoint"; checkpoint: InteractionCheckpoint };

export type RuntimeJourneyInteraction = {
  task: string;
  phases: Array<"primary" | "recovery">;
  applicableStates?: Array<
    "loading" | "empty" | "partial" | "stale" | "disconnected" | "unauthorized" | "error"
  >;
  keyboard?: boolean;
  export?: boolean;
  offline?: boolean;
};

export type RuntimeJourney = {
  name: string;
  interaction?: RuntimeJourneyInteraction;
  steps: JourneyStep[];
};

export type RuntimeJourneyCheckpoint = {
  checkpoint: InteractionCheckpoint;
  step: number;
  evidenceStep: number;
  description: string;
};

export type RuntimeJourneyResult = {
  name: string;
  passed: boolean;
  stepsCompleted: number;
  totalSteps: number;
  screenshot?: string;
  evidence?: RuntimeJourneyEvidence[];
  checkpoints?: RuntimeJourneyCheckpoint[];
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
  colorSchemes?: RuntimeColorScheme[];
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
  colorSchemes?: RuntimeColorScheme[];
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
