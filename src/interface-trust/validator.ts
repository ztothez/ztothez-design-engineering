import { resolve } from "node:path";

import type {
  InterfaceTrustContract,
  InterfaceTrustFinding,
  InterfaceTrustReport,
} from "./schema.js";

const REPORT_VERSION = "1.0.0";
const REQUIRED_SCENARIOS = ["demo", "live", "fallback", "stale", "disconnected"] as const;
const REQUIRED_PROVENANCE_FIELDS = [
  "data-mode",
  "connection",
  "result-origin",
  "freshness",
  "environment",
  "scope",
  "limitations",
] as const;
const FIELD_CLAIM_KIND = {
  "data-mode": "data-mode",
  connection: "connection-status",
  "result-origin": "result-origin",
  freshness: "freshness",
  environment: "environment",
  scope: "scope",
  limitations: "limitation",
} as const;
const RUNTIME_SOURCE_KINDS = new Set(["runtime-probe", "authenticated-api", "runtime-processing"]);
const DEMO_SOURCE_KINDS = new Set(["demo-fixture", "local-simulation"]);
const SECRET_PATTERNS = [
  /\b(?:sk|pk)[_-][a-z0-9]{20,}\b/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:api[_-]?key|secret|password|token)\s*[:=]\s*["']?[a-z0-9+/_=-]{12,}/i,
  /\b(?:your|insert|replace)[_-]?(?:api[_-]?key|secret|password|token)\b/i,
];

function addFinding(
  findings: InterfaceTrustFinding[],
  ruleId: string,
  severity: InterfaceTrustFinding["severity"],
  path: string,
  message: string,
  remediation: string,
): void {
  findings.push({ ruleId, severity, path, message, remediation });
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function findSensitiveValues(value: unknown, path = "contract"): Array<{ path: string; value: string }> {
  if (typeof value === "string") {
    return SECRET_PATTERNS.some((pattern) => pattern.test(value)) ? [{ path, value }] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => findSensitiveValues(entry, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) => findSensitiveValues(entry, `${path}.${key}`));
  }
  return [];
}

export function validateInterfaceTrustContract(
  contract: InterfaceTrustContract,
  sourcePath: string,
): InterfaceTrustReport {
  const findings: InterfaceTrustFinding[] = [];
  const sources = new Map(contract.sources.map((source) => [source.id, source]));
  const states = new Map(contract.states.map((state) => [state.id, state]));
  const claims = new Map(contract.claims.map((claim) => [claim.id, claim]));

  for (const [path, values] of [
    ["sources", contract.sources.map((entry) => entry.id)],
    ["states", contract.states.map((entry) => entry.id)],
    ["claims", contract.claims.map((entry) => entry.id)],
    ["actions", contract.actions.map((entry) => entry.id)],
  ] as Array<[string, string[]]>) {
    for (const duplicate of duplicates(values)) {
      addFinding(
        findings,
        "ZTDE-TRUST-001",
        "error",
        path,
        `Duplicate identifier: ${duplicate}.`,
        "Give every trust-contract record a stable unique identifier.",
      );
    }
  }

  for (const scenario of REQUIRED_SCENARIOS) {
    if (!contract.states.some((state) => state.scenario === scenario)) {
      addFinding(
        findings,
        "ZTDE-TRUST-002",
        "error",
        "states",
        `Required ${scenario} scenario is missing.`,
        `Add a concrete ${scenario} state with provenance, disclosures, and recovery behavior where applicable.`,
      );
    }
  }

  for (const [index, source] of contract.sources.entries()) {
    if (source.authority === "runtime" && !RUNTIME_SOURCE_KINDS.has(source.kind)) {
      addFinding(
        findings,
        "ZTDE-TRUST-104",
        "error",
        `sources[${index}].authority`,
        `Source ${source.id} is marked runtime but uses incompatible kind ${source.kind}.`,
        "Use a runtime-probe, authenticated-api, or runtime-processing source for runtime authority.",
      );
    }
    if (RUNTIME_SOURCE_KINDS.has(source.kind) && (!source.checkedAt || source.authority !== "runtime")) {
      addFinding(
        findings,
        "ZTDE-TRUST-105",
        "error",
        `sources[${index}]`,
        `Runtime source ${source.id} lacks runtime authority or a checkedAt timestamp.`,
        "Bind the source to an actual runtime check and record its offset timestamp.",
      );
    }
  }

  for (const [stateIndex, state] of contract.states.entries()) {
    const stateSources = state.sourceRefs.map((reference) => sources.get(reference)).filter(Boolean);
    for (const [referenceIndex, reference] of state.sourceRefs.entries()) {
      if (!sources.has(reference)) {
        addFinding(findings, "ZTDE-TRUST-101", "error", `states[${stateIndex}].sourceRefs[${referenceIndex}]`, `State ${state.id} references missing source ${reference}.`, "Add the source or correct the state reference.");
      }
    }
    if (state.freshness.timezone && !validTimezone(state.freshness.timezone)) {
      addFinding(findings, "ZTDE-TRUST-205", "error", `states[${stateIndex}].freshness.timezone`, `State ${state.id} uses invalid IANA timezone ${state.freshness.timezone}.`, "Record a valid IANA timezone such as Europe/Helsinki or UTC.");
    }

    const kinds = new Set(stateSources.map((source) => source!.kind));
    const hasRuntime = stateSources.some((source) => source && RUNTIME_SOURCE_KINDS.has(source.kind));
    if (state.dataMode === "demo" && !stateSources.some((source) => source && DEMO_SOURCE_KINDS.has(source.kind))) {
      addFinding(findings, "ZTDE-TRUST-206", "error", `states[${stateIndex}].dataMode`, `Demo state ${state.id} has no fixture or local-simulation source.`, "Bind demo mode to an explicit demo fixture or local simulation.");
    }
    if (state.dataMode === "live" && !hasRuntime) {
      addFinding(findings, "ZTDE-TRUST-206", "error", `states[${stateIndex}].dataMode`, `Live state ${state.id} has no runtime source.`, "Derive live mode from an authenticated API, runtime probe, or runtime-processing result.");
    }
    if (state.dataMode === "hybrid" && (!hasRuntime || !stateSources.some((source) => source && (DEMO_SOURCE_KINDS.has(source.kind) || source.kind === "cache-record")))) {
      addFinding(findings, "ZTDE-TRUST-206", "error", `states[${stateIndex}].dataMode`, `Hybrid state ${state.id} does not identify both runtime and non-live sources.`, "Bind hybrid mode to its live source and fixture, simulation, or cache source.");
    }
    if (state.dataMode === "imported" && !kinds.has("import-record")) {
      addFinding(findings, "ZTDE-TRUST-206", "error", `states[${stateIndex}].dataMode`, `Imported state ${state.id} has no import-record source.`, "Bind imported mode to an inspectable import record.");
    }
    if (state.dataMode === "cached" && !kinds.has("cache-record")) {
      addFinding(findings, "ZTDE-TRUST-206", "error", `states[${stateIndex}].dataMode`, `Cached state ${state.id} has no cache-record source.`, "Bind cached mode to an inspectable cache record.");
    }
    if (state.connection !== "unknown" && !stateSources.some((source) => source?.kind === "runtime-probe" || source?.kind === "authenticated-api")) {
      addFinding(findings, "ZTDE-TRUST-105", "error", `states[${stateIndex}].connection`, `Connection state ${state.connection} in ${state.id} has no runtime connection evidence.`, "Derive checking, connected, degraded, and disconnected states from a runtime probe or authenticated API result.");
    }
    if (state.result.origin === "live" && !stateSources.some((source) => source?.kind === "authenticated-api" || source?.kind === "runtime-processing")) {
      addFinding(findings, "ZTDE-TRUST-104", "error", `states[${stateIndex}].result.origin`, `Live result in ${state.id} has no authenticated API or runtime-processing source.`, "Bind live result origin to runtime processing evidence.");
    }
    if (state.result.origin === "simulated" && !stateSources.some((source) => source && DEMO_SOURCE_KINDS.has(source.kind))) {
      addFinding(findings, "ZTDE-TRUST-104", "error", `states[${stateIndex}].result.origin`, `Simulated result in ${state.id} has no fixture or local-simulation source.`, "Bind simulated results to their explicit fixture or local simulation.");
    }
    if (state.result.origin === "imported" && !kinds.has("import-record")) {
      addFinding(findings, "ZTDE-TRUST-104", "error", `states[${stateIndex}].result.origin`, `Imported result in ${state.id} has no import-record source.`, "Bind imported results to their import record.");
    }
    if (state.result.origin === "cached" && !kinds.has("cache-record")) {
      addFinding(findings, "ZTDE-TRUST-104", "error", `states[${stateIndex}].result.origin`, `Cached result in ${state.id} has no cache-record source.`, "Bind cached results to their cache record.");
    }
    if (state.scenario === "demo" && (state.dataMode !== "demo" || state.result.origin !== "simulated")) {
      addFinding(findings, "ZTDE-TRUST-206", "error", `states[${stateIndex}]`, `Demo scenario ${state.id} is not explicitly demo with simulated result origin.`, "Use dataMode demo and resultOrigin simulated for the demonstration scenario.");
    }
    if (state.scenario === "live" && (state.dataMode !== "live" || state.connection !== "connected" || state.result.origin !== "live")) {
      addFinding(findings, "ZTDE-TRUST-206", "error", `states[${stateIndex}]`, `Live scenario ${state.id} does not establish live, connected, runtime-origin behavior.`, "Use runtime evidence for live data mode, connected state, and live result origin.");
    }
    if (state.scenario === "fallback" && (state.result.origin === "live" || state.limitations.length === 0)) {
      addFinding(findings, "ZTDE-TRUST-202", "error", `states[${stateIndex}]`, `Fallback scenario ${state.id} does not declare a non-live result and limitation.`, "Declare simulated, cached, or imported origin and state the fallback limitation.");
    }
    if (state.scenario === "stale" && state.freshness.status !== "stale") {
      addFinding(findings, "ZTDE-TRUST-203", "error", `states[${stateIndex}].freshness.status`, `Stale scenario ${state.id} is labeled ${state.freshness.status}.`, "Set freshness to stale and retain its timestamp and timezone.");
    }
    if (state.scenario === "disconnected" && (state.connection !== "disconnected" || !state.recoveryAction)) {
      addFinding(findings, "ZTDE-TRUST-204", "error", `states[${stateIndex}]`, `Disconnected scenario ${state.id} lacks disconnected runtime state or a recovery action.`, "Expose runtime-derived disconnection and a concrete retry, reconnect, or offline recovery action.");
    }
  }

  for (const [claimIndex, claim] of contract.claims.entries()) {
    const state = states.get(claim.state);
    if (!state) {
      addFinding(findings, "ZTDE-TRUST-101", "error", `claims[${claimIndex}].state`, `Claim ${claim.id} references missing state ${claim.state}.`, "Use a declared state identifier.");
    }
    const resolvedSources = claim.sourceRefs.map((reference) => sources.get(reference)).filter(Boolean);
    for (const [referenceIndex, reference] of claim.sourceRefs.entries()) {
      if (!sources.has(reference)) {
        addFinding(findings, "ZTDE-TRUST-101", "error", `claims[${claimIndex}].sourceRefs[${referenceIndex}]`, `Claim ${claim.id} references missing source ${reference}.`, "Add the source or correct the claim reference.");
      } else if (state && !state.sourceRefs.includes(reference)) {
        addFinding(findings, "ZTDE-TRUST-102", "error", `claims[${claimIndex}].sourceRefs[${referenceIndex}]`, `Claim ${claim.id} uses source ${reference}, which is outside state ${state.id}.`, "Add the source to the state or bind the claim to evidence available in that state.");
      }
    }
    if (claim.classification === "verified" && claim.sourceRefs.length === 0) {
      addFinding(findings, "ZTDE-TRUST-103", "error", `claims[${claimIndex}].sourceRefs`, `Verified claim ${claim.id} has no evidence source.`, "Attach one or more state sources or downgrade the claim to unknown.");
    }
    if (claim.classification === "demonstration" && !resolvedSources.some((source) => source && DEMO_SOURCE_KINDS.has(source.kind))) {
      addFinding(findings, "ZTDE-TRUST-103", "error", `claims[${claimIndex}].classification`, `Demonstration claim ${claim.id} has no fixture or simulation source.`, "Bind demonstration claims to the exact fixture or local simulation.");
    }
    if (claim.classification === "unknown" && claim.sourceRefs.length > 0) {
      addFinding(findings, "ZTDE-TRUST-103", "warning", `claims[${claimIndex}].sourceRefs`, `Unknown claim ${claim.id} carries evidence references that are not used to establish a value.`, "Remove unrelated evidence or classify the bounded fact it actually establishes.");
    }
    if (claim.kind === "connection-status" && claim.classification === "verified" && !resolvedSources.some((source) => source?.kind === "runtime-probe" || source?.kind === "authenticated-api")) {
      addFinding(findings, "ZTDE-TRUST-105", "error", `claims[${claimIndex}]`, `Verified connection claim ${claim.id} lacks runtime connection evidence.`, "Bind the claim to a current runtime probe or authenticated API result.");
    }
    if (/\b(?:operational|online|connected|production|live)\b/i.test(claim.text) && claim.classification !== "verified") {
      addFinding(findings, "ZTDE-TRUST-402", "error", `claims[${claimIndex}].text`, `Claim ${claim.id} uses a certainty label without verified classification.`, "Use an unknown or demonstration label, or attach evidence and classify the claim as verified.");
    }
  }

  for (const [actionIndex, action] of contract.actions.entries()) {
    for (const reference of action.stateRefs) {
      if (!states.has(reference)) {
        addFinding(findings, "ZTDE-TRUST-101", "error", `actions[${actionIndex}].stateRefs`, `Action ${action.id} references missing state ${reference}.`, "Use only declared state identifiers.");
      }
    }
    for (const reference of action.disclosureClaimRefs) {
      if (!claims.has(reference)) {
        addFinding(findings, "ZTDE-TRUST-101", "error", `actions[${actionIndex}].disclosureClaimRefs`, `Action ${action.id} references missing claim ${reference}.`, "Use only declared claim identifiers.");
      }
    }
    if (!action.consequential) continue;
    const actionClaims = action.disclosureClaimRefs.map((reference) => claims.get(reference)).filter(Boolean);
    for (const stateRef of action.stateRefs) {
      const claimsForState = actionClaims.filter((claim) => claim?.state === stateRef);
      const dataMode = claimsForState.find((claim) => claim?.kind === "data-mode");
      const processing = claimsForState.find((claim) => claim?.kind === "processing-boundary");
      if (!dataMode || !dataMode.locations.includes("shell") || !dataMode.locations.includes("before-action")) {
        addFinding(findings, "ZTDE-TRUST-201", "error", `actions[${actionIndex}].disclosureClaimRefs`, `Consequential action ${action.id} lacks persistent pre-action data-mode disclosure for ${stateRef}.`, "Reference a data-mode claim shown in both the shell and before-action locations.");
      }
      if (!processing || !processing.locations.includes("before-action")) {
        addFinding(findings, "ZTDE-TRUST-201", "error", `actions[${actionIndex}].disclosureClaimRefs`, `Consequential action ${action.id} lacks processing-boundary disclosure for ${stateRef}.`, "Reference a processing-boundary claim visible before the action.");
      }
    }
  }

  const fallbackStates = contract.states.filter((state) => state.scenario === "fallback");
  for (const state of fallbackStates) {
    for (const kind of ["data-mode", "result-origin", "limitation"] as const) {
      const disclosure = contract.claims.find((claim) => claim.state === state.id && claim.kind === kind);
      const requiredLocations = kind === "data-mode"
        ? ["shell", "loading", "result", "history", "export"]
        : ["loading", "result", "history", "export"];
      if (!disclosure || requiredLocations.some((location) => !disclosure.locations.includes(location as never))) {
        addFinding(findings, "ZTDE-TRUST-202", "error", `states.${state.id}.claims`, `Fallback state ${state.id} does not preserve ${kind} disclosure through processing, result, history, and export.`, "Add the missing disclosure claim and required locations.");
      }
    }
  }

  for (const [recordName, record] of Object.entries(contract.records) as Array<["history" | "export", InterfaceTrustContract["records"]["history"]]>) {
    if (!record.enabled) {
      addFinding(findings, "ZTDE-TRUST-301", "error", `records.${recordName}.enabled`, `${recordName} provenance is disabled.`, `Enable ${recordName} provenance or remove the unsupported product capability and revise the contract before release.`);
    }
    for (const field of REQUIRED_PROVENANCE_FIELDS) {
      if (!record.fields.includes(field)) {
        addFinding(findings, "ZTDE-TRUST-301", "error", `records.${recordName}.fields`, `${recordName} omits required provenance field ${field}.`, `Preserve ${field} in every ${recordName} record.`);
      }
    }
    const recordClaims = record.disclosureClaimRefs.map((reference) => claims.get(reference)).filter(Boolean);
    for (const reference of record.disclosureClaimRefs) {
      if (!claims.has(reference)) {
        addFinding(findings, "ZTDE-TRUST-101", "error", `records.${recordName}.disclosureClaimRefs`, `${recordName} references missing claim ${reference}.`, "Use only declared disclosure claim identifiers.");
      }
    }
    for (const stateRef of record.stateRefs) {
      if (!states.has(stateRef)) {
        addFinding(findings, "ZTDE-TRUST-101", "error", `records.${recordName}.stateRefs`, `${recordName} references missing state ${stateRef}.`, "Use only declared state identifiers.");
        continue;
      }
      for (const field of REQUIRED_PROVENANCE_FIELDS) {
        const kind = FIELD_CLAIM_KIND[field];
        if (!recordClaims.some((claim) => claim?.state === stateRef && claim.kind === kind && claim.locations.includes(recordName))) {
          addFinding(findings, "ZTDE-TRUST-302", "error", `records.${recordName}.disclosureClaimRefs`, `${recordName} does not retain ${field} from state ${stateRef}.`, `Reference the ${kind} claim for ${stateRef} and include the ${recordName} location.`);
        }
      }
    }
  }

  for (const sensitive of findSensitiveValues(contract)) {
    addFinding(findings, "ZTDE-TRUST-401", "error", sensitive.path, "Contract contains a credential-like value or realistic secret placeholder.", "Remove the value and declare only environment, secret-manager, OAuth, or runtime-user credential sourcing.");
  }

  const summary = findings.reduce(
    (total, finding) => ({ ...total, [finding.severity]: total[finding.severity] + 1 }),
    { error: 0, warning: 0, info: 0 },
  );
  const scenarios = Object.fromEntries(
    REQUIRED_SCENARIOS.map((scenario) => [scenario, contract.states.some((state) => state.scenario === scenario)]),
  ) as Record<(typeof REQUIRED_SCENARIOS)[number], boolean>;
  const traceability = contract.claims.map((claim) => ({
    claim: claim.id,
    state: claim.state,
    classification: claim.classification,
    sourceRefs: claim.sourceRefs,
    traced:
      claim.classification === "unknown" ||
      (claim.sourceRefs.length > 0 && claim.sourceRefs.every((reference) => sources.has(reference))),
  }));

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourcePath: resolve(sourcePath),
    contractId: contract.id,
    product: contract.product,
    findings,
    coverage: {
      sources: contract.sources.length,
      states: contract.states.length,
      claims: contract.claims.length,
      actions: contract.actions.length,
      scenarios,
    },
    traceability,
    summary: { errors: summary.error, warnings: summary.warning, info: summary.info },
    passed: summary.error === 0,
    limitations: [
      "This validator checks declaration structure, references, state consistency, and provenance coverage; it does not inspect rendered interfaces or runtime services.",
      "A verified source declaration is not proof that implementation code reads or displays that source.",
      "Human comprehension of disclosure placement requires later expert and representative-user review.",
    ],
  };
}
