import { resolve } from "node:path";

import type {
  DesignDeliverable,
  DesignDeliverableReport,
  DesignIntelligenceFinding,
} from "./schema.js";

const REPORT_VERSION = "1.0.0";
const REQUIRED_GENERATION_STAGES = [
  "product-task",
  "truth-data-source-contract",
  "information-architecture",
  "interaction-state-model",
  "visual-direction",
  "token-architecture",
  "implementation",
  "automated-verification",
  "human-visual-review",
] as const;
const REQUIRED_TRUST_SCENARIOS = ["demo", "live", "fallback", "stale", "disconnected"] as const;
const REQUIRED_INFORMATION_LEVELS = [
  "context-provenance",
  "primary-outcome-action",
  "critical-exceptions",
  "health-impact-metrics",
  "prioritized-findings",
  "operational-telemetry",
  "evidence-audit-trail",
  "history-exports",
] as const;
const REQUIRED_DENSITY_PRIORITY_ROLES = ["context", "primary-outcome", "next-action"] as const;
const DEFERRED_DENSITY_PRIORITY_ROLES = ["telemetry", "evidence", "history"] as const;
const DEFERRED_DENSITY_PRIORITY_ROLE_SET = new Set<string>(DEFERRED_DENSITY_PRIORITY_ROLES);

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function hexToRgb(value: string): [number, number, number] | undefined {
  if (!/^#[0-9a-f]{6}$/i.test(value)) return undefined;
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}

function luminance(value: string): number | undefined {
  const rgb = hexToRgb(value);
  if (!rgb) return undefined;
  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(foreground: string, background: string): number | undefined {
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === undefined || second === undefined) return undefined;
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function requiredSection(
  deliverable: DesignDeliverable["scope"]["deliverables"][number],
  present: boolean,
  path: string,
  findings: DesignIntelligenceFinding[],
): void {
  if (present) return;
  findings.push({
    ruleId: "ZTDE-DI-001",
    severity: "error",
    path,
    message: `Declared deliverable ${deliverable} is missing its structured section.`,
    remediation: `Add the ${path} section or remove ${deliverable} from scope.deliverables.`,
  });
}

function resolveTokenColor(
  name: string,
  tokens: Map<string, DesignDeliverable["tokenSystem"]["tokens"][number]>,
  modeOverrides?: Map<string, DesignDeliverable["tokenSystem"]["modes"][number]["overrides"][number]>,
  visited = new Set<string>(),
): string | undefined {
  if (visited.has(name)) return undefined;
  visited.add(name);
  const override = modeOverrides?.get(name);
  if (typeof override?.value === "string") return override.value;
  if (override?.reference) {
    return resolveTokenColor(override.reference, tokens, modeOverrides, visited);
  }
  const token = tokens.get(name);
  if (!token || token.type !== "color") return undefined;
  if (typeof token.value === "string") return token.value;
  return token.reference ? resolveTokenColor(token.reference, tokens, modeOverrides, visited) : undefined;
}

function tokenChainTerminates(
  name: string,
  tokens: Map<string, DesignDeliverable["tokenSystem"]["tokens"][number]>,
  visited = new Set<string>(),
): boolean {
  if (visited.has(name)) return false;
  visited.add(name);
  const token = tokens.get(name);
  if (!token) return false;
  if (token.value !== undefined) return true;
  return token.reference ? tokenChainTerminates(token.reference, tokens, visited) : false;
}

function resolveTokenValue(
  name: string,
  tokens: Map<string, DesignDeliverable["tokenSystem"]["tokens"][number]>,
  visited = new Set<string>(),
): string | number | undefined {
  if (visited.has(name)) return undefined;
  visited.add(name);
  const token = tokens.get(name);
  if (!token) return undefined;
  if (token.value !== undefined) return token.value;
  return token.reference ? resolveTokenValue(token.reference, tokens, visited) : undefined;
}

function addDuplicates(
  values: string[],
  path: string,
  label: string,
  findings: DesignIntelligenceFinding[],
): void {
  for (const duplicate of duplicateValues(values)) {
    findings.push({
      ruleId: "ZTDE-DI-002",
      severity: "error",
      path,
      message: `Duplicate ${label}: ${duplicate}.`,
      remediation: `Give every ${label} a stable unique identifier.`,
    });
  }
}

export function validateDesignDeliverable(
  manifest: DesignDeliverable,
  sourcePath: string,
): DesignDeliverableReport {
  const findings: DesignIntelligenceFinding[] = [];
  const declared = new Set(manifest.scope.deliverables);

  if (declared.has("interface-system")) {
    if (manifest.version === "1.0") {
      findings.push({
        ruleId: "ZTDE-DI-701",
        severity: "error",
        path: "version",
        message: "Interface-system deliverables require design-deliverable contract version 2.0 or 2.1.",
        remediation: "Migrate the manifest to version 2.1 and declare every required visual-polish section.",
      });
    }
    for (const [path, present] of [
      ["productTask", manifest.productTask !== undefined],
      ["interfaceTrust", manifest.interfaceTrust !== undefined],
      ["informationHierarchy", manifest.informationHierarchy !== undefined],
      ["metricContracts", manifest.metricContracts !== undefined],
      ["generationWorkflow", manifest.generationWorkflow !== undefined],
      ["visualDirection", manifest.visualDirection !== undefined],
      ["typography", manifest.typography !== undefined],
      ["composition", manifest.composition !== undefined],
      ["densityProfile", manifest.densityProfile !== undefined],
      ["interactionStates", manifest.interactionStates !== undefined],
      ["motion", manifest.motion !== undefined],
      ["chartContracts", manifest.chartContracts !== undefined],
      ["renderedEvidence", manifest.renderedEvidence !== undefined],
      ["humanVisualReview", manifest.humanVisualReview !== undefined],
    ] as Array<[string, boolean]>) {
      requiredSection("interface-system", present, path, findings);
    }
  }

  if (declared.has("brand-system")) {
    requiredSection("brand-system", manifest.brand !== undefined, "brand", findings);
  }
  if (declared.has("figma-library")) {
    requiredSection("figma-library", manifest.figma !== undefined, "figma", findings);
  }
  if (declared.has("asset-set")) {
    requiredSection("asset-set", manifest.assets.length > 0, "assets", findings);
  }
  if (declared.has("icon-system")) {
    requiredSection("icon-system", manifest.iconSystem !== undefined, "iconSystem", findings);
  }
  if (declared.has("presentation")) {
    requiredSection("presentation", manifest.presentations.length > 0, "presentations", findings);
  }

  addDuplicates(manifest.scope.deliverables, "scope.deliverables", "deliverable", findings);
  addDuplicates(manifest.tokenSystem.tokens.map((token) => token.name), "tokenSystem.tokens", "token name", findings);
  addDuplicates(manifest.tokenSystem.modes.map((mode) => mode.name), "tokenSystem.modes", "mode name", findings);
  addDuplicates(manifest.assets.map((asset) => asset.id), "assets", "asset identifier", findings);
  addDuplicates(manifest.evidence.map((evidence) => evidence.id), "evidence", "evidence identifier", findings);

  const tokens = new Map(manifest.tokenSystem.tokens.map((token) => [token.name, token]));
  for (const [index, token] of manifest.tokenSystem.tokens.entries()) {
    if (!token.reference) continue;
    const referenced = tokens.get(token.reference);
    if (!referenced) {
      findings.push({
        ruleId: "ZTDE-DI-101",
        severity: "error",
        path: `tokenSystem.tokens[${index}].reference`,
        message: `Token ${token.name} references missing token ${token.reference}.`,
        remediation: "Add the referenced token or correct the reference.",
      });
    } else if (referenced.type !== token.type) {
      findings.push({
        ruleId: "ZTDE-DI-102",
        severity: "error",
        path: `tokenSystem.tokens[${index}].reference`,
        message: `Token ${token.name} and ${token.reference} have different types.`,
        remediation: "Reference a token of the same type.",
      });
    } else if (!tokenChainTerminates(token.name, tokens)) {
      findings.push({
        ruleId: "ZTDE-DI-103",
        severity: "error",
        path: `tokenSystem.tokens[${index}]`,
        message: `Token ${token.name} has a cyclic or unresolved reference chain.`,
        remediation: "Terminate every token chain at one compatible primitive token.",
      });
    }
  }

  const evidenceRecords = new Map(manifest.evidence.map((entry) => [entry.id, entry]));
  const checkVisualTokenRefs = (
    refs: string[],
    path: string,
    ruleId: string,
    expectedType?: DesignDeliverable["tokenSystem"]["tokens"][number]["type"],
  ): void => {
    for (const [index, reference] of refs.entries()) {
      const token = tokens.get(reference);
      if (!token) {
        findings.push({
          ruleId,
          severity: "error",
          path: `${path}[${index}]`,
          message: `Visual contract references missing token ${reference}.`,
          remediation: "Add the canonical token or correct the visual-contract reference.",
        });
      } else if (token.level === "primitive") {
        findings.push({
          ruleId,
          severity: "error",
          path: `${path}[${index}]`,
          message: `Visual usage references primitive token ${reference} directly.`,
          remediation: "Bind component and composition usage to a semantic or component token that resolves to the primitive.",
        });
      } else if (expectedType && token.type !== expectedType) {
        findings.push({
          ruleId,
          severity: "error",
          path: `${path}[${index}]`,
          message: `Visual token ${reference} has type ${token.type}; expected ${expectedType}.`,
          remediation: `Reference a semantic or component ${expectedType} token.`,
        });
      }
    }
  };

  if (manifest.interfaceTrust) {
    addDuplicates(manifest.interfaceTrust.requiredScenarios, "interfaceTrust.requiredScenarios", "trust scenario", findings);
    for (const scenario of REQUIRED_TRUST_SCENARIOS) {
      if (!manifest.interfaceTrust.requiredScenarios.includes(scenario)) {
        findings.push({
          ruleId: "ZTDE-DI-912",
          severity: "error",
          path: "interfaceTrust.requiredScenarios",
          message: `Interface-trust link omits required scenario ${scenario}.`,
          remediation: `Include ${scenario} and bind the interface-system manifest to the complete trust contract.`,
        });
      }
    }
    const validated = manifest.interfaceTrust.status === "validated";
    if (validated && (!manifest.interfaceTrust.reportPath || !manifest.interfaceTrust.evidenceRef)) {
      findings.push({
        ruleId: "ZTDE-DI-912",
        severity: "error",
        path: "interfaceTrust",
        message: "Interface-trust link is marked validated without a report path and evidence reference.",
        remediation: "Set status to declared or attach the actual validator report and an evidence record.",
      });
    }
    if (!validated && (manifest.interfaceTrust.reportPath || manifest.interfaceTrust.evidenceRef)) {
      findings.push({
        ruleId: "ZTDE-DI-912",
        severity: "error",
        path: "interfaceTrust",
        message: "Declared interface-trust link carries validation evidence without validated status.",
        remediation: "Remove premature validation evidence or set validated only after the recorded report passes.",
      });
    }
    if (manifest.interfaceTrust.evidenceRef && !evidenceRecords.has(manifest.interfaceTrust.evidenceRef)) {
      findings.push({
        ruleId: "ZTDE-DI-912",
        severity: "error",
        path: "interfaceTrust.evidenceRef",
        message: `Interface-trust link references missing evidence ${manifest.interfaceTrust.evidenceRef}.`,
        remediation: "Add the validator-report evidence record or correct the reference.",
      });
    }
  }

  if (manifest.informationHierarchy) {
    addDuplicates(manifest.informationHierarchy.levels, "informationHierarchy.levels", "information hierarchy level", findings);
    for (const [index, level] of REQUIRED_INFORMATION_LEVELS.entries()) {
      if (manifest.informationHierarchy.levels[index] !== level) {
        findings.push({
          ruleId: "ZTDE-DI-913",
          severity: "error",
          path: `informationHierarchy.levels[${index}]`,
          message: `Information hierarchy position ${index + 1} must be ${level}.`,
          remediation: "Restore the required context-to-history operational answer order.",
        });
      }
    }
    const validated = manifest.informationHierarchy.status === "validated";
    if (validated && (!manifest.informationHierarchy.reportPath || !manifest.informationHierarchy.evidenceRef)) {
      findings.push({
        ruleId: "ZTDE-DI-913",
        severity: "error",
        path: "informationHierarchy",
        message: "Information hierarchy is marked validated without a report path and evidence reference.",
        remediation: "Set status to declared or attach the actual information validator report and evidence record.",
      });
    }
    if (!validated && (manifest.informationHierarchy.reportPath || manifest.informationHierarchy.evidenceRef)) {
      findings.push({
        ruleId: "ZTDE-DI-913",
        severity: "error",
        path: "informationHierarchy",
        message: "Declared information hierarchy carries validation evidence without validated status.",
        remediation: "Remove premature evidence or set validated only after the recorded report passes.",
      });
    }
    if (manifest.informationHierarchy.evidenceRef && !evidenceRecords.has(manifest.informationHierarchy.evidenceRef)) {
      findings.push({
        ruleId: "ZTDE-DI-913",
        severity: "error",
        path: "informationHierarchy.evidenceRef",
        message: `Information hierarchy references missing evidence ${manifest.informationHierarchy.evidenceRef}.`,
        remediation: "Add the validator-report evidence record or correct the reference.",
      });
    }
  }

  if (manifest.metricContracts) {
    addDuplicates(manifest.metricContracts.metrics.map((entry) => entry.metricId), "metricContracts.metrics", "metric contract", findings);
    if (
      manifest.informationHierarchy &&
      manifest.metricContracts.informationContractId !== manifest.informationHierarchy.contractId
    ) {
      findings.push({
        ruleId: "ZTDE-DI-914",
        severity: "error",
        path: "metricContracts.informationContractId",
        message: "Metric contracts do not reference the declared information hierarchy contract.",
        remediation: "Use the same information-contract identifier for hierarchy, metrics, and charts.",
      });
    }
    const chartIds = new Set(manifest.chartContracts?.map((entry) => entry.id) ?? []);
    for (const [metricIndex, metric] of manifest.metricContracts.metrics.entries()) {
      for (const [chartIndex, chartRef] of metric.chartRefs.entries()) {
        if (!chartIds.has(chartRef)) {
          findings.push({
            ruleId: "ZTDE-DI-914",
            severity: "error",
            path: `metricContracts.metrics[${metricIndex}].chartRefs[${chartIndex}]`,
            message: `Metric ${metric.metricId} references missing chart ${chartRef}.`,
            remediation: "Add the visual chart contract or remove the unsupported chart reference.",
          });
        }
      }
    }
    const metricIds = new Set(manifest.metricContracts.metrics.map((entry) => entry.metricId));
    for (const [chartIndex, chart] of manifest.chartContracts?.entries() ?? []) {
      for (const [metricIndex, metricRef] of chart.metricRefs.entries()) {
        if (!metricIds.has(metricRef)) {
          findings.push({
            ruleId: "ZTDE-DI-914",
            severity: "error",
            path: `chartContracts[${chartIndex}].metricRefs[${metricIndex}]`,
            message: `Chart ${chart.id} references metric ${metricRef} outside metricContracts.`,
            remediation: "Add the metric decision contract or correct the chart metric reference.",
          });
        }
      }
    }
  }

  if (manifest.generationWorkflow) {
    addDuplicates(manifest.generationWorkflow.steps.map((entry) => entry.stage), "generationWorkflow.steps", "generation stage", findings);
    const allowedStatuses: Record<(typeof REQUIRED_GENERATION_STAGES)[number], Set<string>> = {
      "product-task": new Set(["declared"]),
      "truth-data-source-contract": new Set(["declared"]),
      "information-architecture": new Set(["declared"]),
      "interaction-state-model": new Set(["declared"]),
      "visual-direction": new Set(["declared"]),
      "token-architecture": new Set(["declared"]),
      implementation: new Set(["required", "implemented"]),
      "automated-verification": new Set(["required", "verified"]),
      "human-visual-review": new Set(["review-required", "review-completed"]),
    };
    const allowedArtifactRefs = new Set([
      manifest.id,
      manifest.productTask?.productContractId,
      manifest.interfaceTrust?.contractId,
      manifest.informationHierarchy?.contractId,
      ...(manifest.metricContracts?.metrics.map((entry) => entry.metricId) ?? []),
      ...evidenceRecords.keys(),
    ].filter((value): value is string => Boolean(value)));
    for (const [index, stage] of REQUIRED_GENERATION_STAGES.entries()) {
      const entry = manifest.generationWorkflow.steps[index];
      if (!entry || entry.stage !== stage) {
        findings.push({
          ruleId: "ZTDE-DI-915",
          severity: "error",
          path: `generationWorkflow.steps[${index}]`,
          message: `Generation workflow position ${index + 1} must be ${stage}.`,
          remediation: "Restore the required product-task through human-review generation order.",
        });
        continue;
      }
      if (!allowedStatuses[stage].has(entry.status)) {
        findings.push({
          ruleId: "ZTDE-DI-915",
          severity: "error",
          path: `generationWorkflow.steps[${index}].status`,
          message: `Stage ${stage} cannot use status ${entry.status}.`,
          remediation: `Use one of: ${[...allowedStatuses[stage]].join(", ")}.`,
        });
      }
      for (const [referenceIndex, reference] of entry.artifactRefs.entries()) {
        if (!allowedArtifactRefs.has(reference)) {
          findings.push({
            ruleId: "ZTDE-DI-915",
            severity: "error",
            path: `generationWorkflow.steps[${index}].artifactRefs[${referenceIndex}]`,
            message: `Generation stage ${stage} references unknown artifact ${reference}.`,
            remediation: "Reference the manifest, linked contracts, metric contracts, or declared evidence records.",
          });
        }
      }
      if (["verified", "review-completed"].includes(entry.status) && entry.artifactRefs.length === 0) {
        findings.push({
          ruleId: "ZTDE-DI-915",
          severity: "error",
          path: `generationWorkflow.steps[${index}].artifactRefs`,
          message: `Completed stage ${stage} has no evidence reference.`,
          remediation: "Attach the actual verification or reviewer-supplied evidence record.",
        });
      }
    }
    const implementation = manifest.generationWorkflow.steps.find((entry) => entry.stage === "implementation");
    const automated = manifest.generationWorkflow.steps.find((entry) => entry.stage === "automated-verification");
    const human = manifest.generationWorkflow.steps.find((entry) => entry.stage === "human-visual-review");
    if (automated?.status === "verified" && implementation?.status !== "implemented") {
      findings.push({
        ruleId: "ZTDE-DI-915",
        severity: "error",
        path: "generationWorkflow.steps",
        message: "Automated verification is marked complete before implementation.",
        remediation: "Keep verification required until an implemented artifact has produced the referenced evidence.",
      });
    }
    if (human?.status === "review-completed") {
      if (automated?.status !== "verified" || manifest.humanVisualReview?.status !== "completed") {
        findings.push({
          ruleId: "ZTDE-DI-915",
          severity: "error",
          path: "generationWorkflow.steps",
          message: "Human visual review is marked complete before automated evidence and attributable review are complete.",
          remediation: "Keep review-required until automated verification passes and reviewer-supplied evidence is recorded.",
        });
      }
    }
  }

  if (manifest.visualDirection) {
    checkVisualTokenRefs(manifest.visualDirection.tokenRefs, "visualDirection.tokenRefs", "ZTDE-DI-701");
    for (const [index, reference] of manifest.visualDirection.referenceEvidenceRefs.entries()) {
      if (!evidenceRecords.has(reference)) {
        findings.push({
          ruleId: "ZTDE-DI-701",
          severity: "error",
          path: `visualDirection.referenceEvidenceRefs[${index}]`,
          message: `Visual direction references missing evidence ${reference}.`,
          remediation: "Add the evidence record or remove the unsupported visual reference.",
        });
      }
    }
    const ornament = manifest.visualDirection.ornamentPolicy as Record<string, boolean>;
    for (const [name, allowed] of Object.entries(ornament)) {
      if (allowed) {
        findings.push({
          ruleId: "ZTDE-DI-707",
          severity: "error",
          path: `visualDirection.ornamentPolicy.${name}`,
          message: `Visual direction allows prohibited ornament category ${name}.`,
          remediation: "Remove ornamental treatment or bind the visual element to a concrete product meaning and task.",
        });
      }
    }
  }

  if (manifest.typography) {
    addDuplicates(manifest.typography.roles.map((entry) => entry.role), "typography.roles", "typography role", findings);
    const requiredRoles = ["body", "label", "heading", "metadata", "metric", "evidence", "log", "code"];
    for (const role of requiredRoles) {
      if (!manifest.typography.roles.some((entry) => entry.role === role)) {
        findings.push({
          ruleId: "ZTDE-DI-702",
          severity: "error",
          path: "typography.roles",
          message: `Typography role ${role} is missing.`,
          remediation: `Add the ${role} role with semantic family, size, weight, line-height, and color tokens.`,
        });
      }
    }
    for (const [index, role] of manifest.typography.roles.entries()) {
      checkVisualTokenRefs([role.familyToken], `typography.roles[${index}].familyToken`, "ZTDE-DI-702", "font-family");
      checkVisualTokenRefs([role.sizeToken], `typography.roles[${index}].sizeToken`, "ZTDE-DI-702", "dimension");
      checkVisualTokenRefs([role.weightToken], `typography.roles[${index}].weightToken`, "ZTDE-DI-702", "font-weight");
      checkVisualTokenRefs([role.lineHeightToken], `typography.roles[${index}].lineHeightToken`, "ZTDE-DI-702", "number");
      checkVisualTokenRefs([role.colorToken], `typography.roles[${index}].colorToken`, "ZTDE-DI-702", "color");
    }
    if (manifest.typography.numericAlignment !== "tabular") {
      findings.push({
        ruleId: "ZTDE-DI-702",
        severity: "warning",
        path: "typography.numericAlignment",
        message: "Operational metrics use proportional numeric alignment.",
        remediation: "Use tabular numerals for changing metrics and aligned comparisons unless the typeface lacks support.",
      });
    }
  }

  if (manifest.composition) {
    addDuplicates(manifest.composition.grids.map((entry) => String(entry.viewport)), "composition.grids", "responsive viewport", findings);
    const requiredViewports = [375, 768, 1024, 1440];
    for (const viewport of requiredViewports) {
      if (!manifest.composition.grids.some((entry) => entry.viewport === viewport)) {
        findings.push({
          ruleId: "ZTDE-DI-703",
          severity: "error",
          path: "composition.grids",
          message: `Composition grid for ${viewport} CSS pixels is missing.`,
          remediation: `Declare columns, gutter, margin, and composition behavior at ${viewport} CSS pixels.`,
        });
      }
    }
    for (const [index, grid] of manifest.composition.grids.entries()) {
      checkVisualTokenRefs([grid.gutterToken, grid.marginToken], `composition.grids[${index}].tokens`, "ZTDE-DI-703", "dimension");
    }
    checkVisualTokenRefs([manifest.composition.spacingRhythm.baseToken, ...manifest.composition.spacingRhythm.allowedStepTokens], "composition.spacingRhythm", "ZTDE-DI-703", "dimension");
    for (const [index, component] of manifest.composition.stableDimensions.entries()) {
      checkVisualTokenRefs(component.tokenRefs, `composition.stableDimensions[${index}].tokenRefs`, "ZTDE-DI-703", "dimension");
    }
    for (const [path, entries, required] of [
      ["surfaces", manifest.composition.surfaces, ["canvas", "subtle", "raised"]],
      ["borders", manifest.composition.borders, ["default", "strong", "focus", "selected"]],
      ["elevations", manifest.composition.elevations, ["base", "raised", "overlay"]],
      ["emphasis", manifest.composition.emphasis, ["primary", "secondary", "tertiary", "muted"]],
    ] as Array<[string, Array<{ role?: string; level?: string }>, string[]]>) {
      const values = entries.map((entry) => entry.role ?? entry.level ?? "");
      addDuplicates(values, `composition.${path}`, `${path} role`, findings);
      for (const role of required) {
        if (!values.includes(role)) {
          findings.push({
            ruleId: "ZTDE-DI-704",
            severity: "error",
            path: `composition.${path}`,
            message: `Composition ${path} hierarchy is missing ${role}.`,
            remediation: `Declare the ${role} role with semantic token bindings.`,
          });
        }
      }
    }
    for (const [index, entry] of manifest.composition.surfaces.entries()) {
      checkVisualTokenRefs([entry.tokenRef], `composition.surfaces[${index}].tokenRef`, "ZTDE-DI-704", "color");
    }
    for (const [index, entry] of manifest.composition.borders.entries()) {
      checkVisualTokenRefs([entry.tokenRef], `composition.borders[${index}].tokenRef`, "ZTDE-DI-704", "color");
    }
    for (const [index, entry] of manifest.composition.elevations.entries()) {
      checkVisualTokenRefs([entry.tokenRef], `composition.elevations[${index}].tokenRef`, "ZTDE-DI-704", "shadow");
    }
    for (const [index, entry] of manifest.composition.emphasis.entries()) {
      checkVisualTokenRefs([entry.textToken, entry.surfaceToken], `composition.emphasis[${index}].tokens`, "ZTDE-DI-704", "color");
    }
    checkVisualTokenRefs([manifest.composition.selectedState.backgroundToken, manifest.composition.selectedState.borderToken], "composition.selectedState", "ZTDE-DI-704", "color");
  }

  if (manifest.densityProfile) {
    checkVisualTokenRefs([
      manifest.densityProfile.controlHeightToken,
      manifest.densityProfile.rowHeightToken,
      manifest.densityProfile.compactRowHeightToken,
      ...manifest.densityProfile.spacingTokenRefs,
    ], "densityProfile", "ZTDE-DI-705", "dimension");
    addDuplicates(manifest.densityProfile.viewportBehavior.map((entry) => String(entry.viewport)), "densityProfile.viewportBehavior", "density viewport", findings);
    for (const viewport of [375, 768, 1024, 1440]) {
      if (!manifest.densityProfile.viewportBehavior.some((entry) => entry.viewport === viewport)) {
        findings.push({
          ruleId: "ZTDE-DI-705",
          severity: "error",
          path: "densityProfile.viewportBehavior",
          message: `Density behavior for ${viewport} CSS pixels is missing.`,
          remediation: `Declare density mode and visible priorities at ${viewport} CSS pixels.`,
        });
      }
    }
    if (manifest.version === "2.1") {
      for (const [index, entry] of manifest.densityProfile.viewportBehavior.entries()) {
        const path = `densityProfile.viewportBehavior[${index}]`;
        if (!entry.priorityRoles) {
          findings.push({
            ruleId: "ZTDE-DI-709",
            severity: "error",
            path: `${path}.priorityRoles`,
            message: `Density behavior for ${entry.viewport} CSS pixels has no machine-readable decision order.`,
            remediation: "Map each visible priority to a canonical priority role in the same order.",
          });
          continue;
        }
        addDuplicates(entry.priorityRoles, `${path}.priorityRoles`, "density priority role", findings);
        if (entry.priorityRoles.length !== entry.visiblePriorities.length) {
          findings.push({
            ruleId: "ZTDE-DI-709",
            severity: "error",
            path,
            message: `Density behavior for ${entry.viewport} CSS pixels declares ${entry.visiblePriorities.length} visible priorities but ${entry.priorityRoles.length} priority roles.`,
            remediation: "Provide one canonical priority role for each visible priority.",
          });
        }
        for (const role of REQUIRED_DENSITY_PRIORITY_ROLES) {
          if (!entry.priorityRoles.includes(role)) {
            findings.push({
              ruleId: "ZTDE-DI-709",
              severity: "error",
              path: `${path}.priorityRoles`,
              message: `Density behavior for ${entry.viewport} CSS pixels omits required ${role} content.`,
              remediation: "Keep context, the primary outcome, and the next action visible before optional detail.",
            });
          }
        }
        const actionIndex = entry.priorityRoles.indexOf("next-action");
        for (const role of DEFERRED_DENSITY_PRIORITY_ROLES) {
          const detailIndex = entry.priorityRoles.indexOf(role);
          if (detailIndex !== -1 && (actionIndex === -1 || detailIndex < actionIndex)) {
            findings.push({
              ruleId: "ZTDE-DI-709",
              severity: "error",
              path: `${path}.priorityRoles`,
              message: `Density behavior for ${entry.viewport} CSS pixels places ${role} before the next action.`,
              remediation: "Place decision-critical context, outcome, exceptions, and action before telemetry, evidence detail, or history.",
            });
          }
        }
        if (
          entry.viewport === 375 &&
          (entry.mode !== "comfortable" ||
            entry.priorityRoles.length > 4 ||
            entry.priorityRoles.some((role) => DEFERRED_DENSITY_PRIORITY_ROLE_SET.has(role)))
        ) {
          findings.push({
            ruleId: "ZTDE-DI-709",
            severity: "error",
            path,
            message: "The 375 CSS-pixel composition does not preserve a restrained decision-first view.",
            remediation: "Use comfortable density and expose at most context, outcome, critical exceptions, and next action before expandable detail.",
          });
        }
        if (entry.viewport === 768 && entry.mode === "dense") {
          findings.push({
            ruleId: "ZTDE-DI-709",
            severity: "error",
            path: `${path}.mode`,
            message: "The 768 CSS-pixel composition uses dense mode before sufficient horizontal space is available.",
            remediation: "Use comfortable or compact density and verify text resize and touch operation before selecting dense mode.",
          });
        }
      }
    }
  }

  if (manifest.interactionStates) {
    addDuplicates(manifest.interactionStates.states.map((entry) => entry.state), "interactionStates.states", "interaction state", findings);
    const requiredStates = ["loading", "empty", "success", "warning", "error", "partial", "disabled", "selected", "focus"];
    for (const state of requiredStates) {
      if (!manifest.interactionStates.states.some((entry) => entry.state === state)) {
        findings.push({
          ruleId: "ZTDE-DI-706",
          severity: "error",
          path: "interactionStates.states",
          message: `Interaction state ${state} is missing from the visual language.`,
          remediation: `Declare ${state} behavior, semantic tokens, and visible cues.`,
        });
      }
    }
    for (const [index, state] of manifest.interactionStates.states.entries()) {
      checkVisualTokenRefs(state.tokenRefs, `interactionStates.states[${index}].tokenRefs`, "ZTDE-DI-706");
      if (["warning", "error", "partial", "selected"].includes(state.state) && !state.textCue && !state.iconCue) {
        findings.push({
          ruleId: "ZTDE-DI-706",
          severity: "error",
          path: `interactionStates.states[${index}]`,
          message: `State ${state.state} has no text or icon cue independent of color.`,
          remediation: "Add visible text or a semantic icon in addition to color and position.",
        });
      }
    }
  }

  if (manifest.motion) {
    const durationRanges = {
      instant: [0, 100],
      feedback: [100, 220],
      transition: [150, 350],
      emphasis: [200, 500],
    } as const;
    for (const [category, reference] of Object.entries(manifest.motion.durationTokens) as Array<[keyof typeof durationRanges, string]>) {
      checkVisualTokenRefs([reference], `motion.durationTokens.${category}`, "ZTDE-DI-708", "duration");
      const value = resolveTokenValue(reference, tokens);
      const [minimum, maximum] = durationRanges[category];
      if (typeof value !== "number" || value < minimum || value > maximum) {
        findings.push({
          ruleId: "ZTDE-DI-708",
          severity: "error",
          path: `motion.durationTokens.${category}`,
          message: `Motion category ${category} does not resolve to ${minimum}-${maximum} milliseconds.`,
          remediation: "Reference a semantic duration token whose primitive numeric value fits the category.",
        });
      }
    }
    addDuplicates(manifest.motion.motions.map((entry) => entry.id), "motion.motions", "motion identifier", findings);
    const motions = new Set(manifest.motion.motions.map((entry) => entry.id));
    const equivalents = new Set(manifest.motion.reducedMotion.equivalents.map((entry) => entry.motionRef));
    for (const [index, equivalent] of manifest.motion.reducedMotion.equivalents.entries()) {
      if (!motions.has(equivalent.motionRef)) {
        findings.push({
          ruleId: "ZTDE-DI-708",
          severity: "error",
          path: `motion.reducedMotion.equivalents[${index}].motionRef`,
          message: `Reduced-motion equivalent references missing motion ${equivalent.motionRef}.`,
          remediation: "Reference a declared motion or remove the unrelated equivalent.",
        });
      }
    }
    for (const motion of manifest.motion.motions) {
      if (!equivalents.has(motion.id)) {
        findings.push({
          ruleId: "ZTDE-DI-708",
          severity: "error",
          path: "motion.reducedMotion.equivalents",
          message: `Motion ${motion.id} has no reduced-motion equivalent.`,
          remediation: "Declare how the motion is removed, replaced, or shortened without losing state meaning.",
        });
      }
    }
  }

  if (manifest.chartContracts) {
    addDuplicates(manifest.chartContracts.map((entry) => entry.id), "chartContracts", "chart contract", findings);
    for (const [index, chart] of manifest.chartContracts.entries()) {
      checkVisualTokenRefs(chart.tokenRefs, `chartContracts[${index}].tokenRefs`, "ZTDE-DI-801");
      if (chart.backgroundToken) {
        checkVisualTokenRefs([chart.backgroundToken], `chartContracts[${index}].backgroundToken`, "ZTDE-DI-801", "color");
      }
      if (!chart.titleVisible || !chart.valuesVisible) {
        findings.push({
          ruleId: "ZTDE-DI-801",
          severity: "error",
          path: `chartContracts[${index}]`,
          message: `Chart ${chart.id} hides its title or readable values.`,
          remediation: "Show a visible title and values; do not depend on hover, shape, or color alone.",
        });
      }
      if (!chart.legend.visible && !chart.legend.reason) {
        findings.push({
          ruleId: "ZTDE-DI-801",
          severity: "error",
          path: `chartContracts[${index}].legend.reason`,
          message: `Chart ${chart.id} omits its legend without documenting direct labeling.`,
          remediation: "Show a legend or state why direct labels make every series unambiguous.",
        });
      }
      const cues = new Set(chart.nonColorCues);
      if (cues.size !== chart.nonColorCues.length || [...cues].every((cue) => cue === "color")) {
        findings.push({
          ruleId: "ZTDE-DI-801",
          severity: "error",
          path: `chartContracts[${index}].nonColorCues`,
          message: `Chart ${chart.id} lacks distinct color-independent cues.`,
          remediation: "Combine color with direct text, values, shape, pattern, position, or line style.",
        });
      }
      if ((chart as { decorative: boolean }).decorative) {
        findings.push({
          ruleId: "ZTDE-DI-801",
          severity: "error",
          path: `chartContracts[${index}].decorative`,
          message: `Chart ${chart.id} is decorative.`,
          remediation: "Remove the chart or bind it to a metric decision, comparison, accessible alternative, and explicit states.",
        });
      }
    }
  }

  if (manifest.renderedEvidence) {
    addDuplicates(manifest.renderedEvidence.captures.map((entry) => String(entry.viewport)), "renderedEvidence.captures", "rendered viewport", findings);
    for (const viewport of [375, 768, 1024, 1440]) {
      if (!manifest.renderedEvidence.captures.some((entry) => entry.viewport === viewport)) {
        findings.push({
          ruleId: "ZTDE-DI-901",
          severity: "error",
          path: "renderedEvidence.captures",
          message: `Rendered-evidence declaration for ${viewport} CSS pixels is missing.`,
          remediation: `Add a planned, captured, or verified record for ${viewport} CSS pixels.`,
        });
      }
    }
  }

  if (manifest.humanVisualReview) {
    addDuplicates(manifest.humanVisualReview.dimensions, "humanVisualReview.dimensions", "human-review dimension", findings);
    for (const dimension of ["hierarchy", "balance", "scanability", "density", "domain-fit"]) {
      if (!manifest.humanVisualReview.dimensions.includes(dimension as never)) {
        findings.push({
          ruleId: "ZTDE-DI-902",
          severity: "error",
          path: "humanVisualReview.dimensions",
          message: `Human visual review omits ${dimension}.`,
          remediation: `Include ${dimension} in the attributable rendered-output review.`,
        });
      }
    }
    if (manifest.humanVisualReview.status === "completed" && manifest.humanVisualReview.reviewers.length === 0) {
      findings.push({
        ruleId: "ZTDE-DI-902",
        severity: "error",
        path: "humanVisualReview.reviewers",
        message: "Human visual review is marked completed without an attributable reviewer.",
        remediation: "Set status to required or record reviewer-supplied name, role, timestamp, and review evidence. Agents must not invent this record.",
      });
    }
    for (const [index, reviewer] of manifest.humanVisualReview.reviewers.entries()) {
      const record = evidenceRecords.get(reviewer.evidenceRef);
      if (!record || record.kind !== "review") {
        findings.push({
          ruleId: "ZTDE-DI-902",
          severity: "error",
          path: `humanVisualReview.reviewers[${index}].evidenceRef`,
          message: `Human reviewer ${reviewer.name} does not reference review evidence.`,
          remediation: "Add an evidence record with kind review that contains the reviewer-supplied assessment.",
        });
      }
    }
  }

  for (const [modeIndex, mode] of manifest.tokenSystem.modes.entries()) {
    addDuplicates(mode.overrides.map((override) => override.token), `tokenSystem.modes[${modeIndex}].overrides`, "mode override", findings);
    for (const [overrideIndex, override] of mode.overrides.entries()) {
      const token = tokens.get(override.token);
      if (!token) {
        findings.push({
          ruleId: "ZTDE-DI-104",
          severity: "error",
          path: `tokenSystem.modes[${modeIndex}].overrides[${overrideIndex}].token`,
          message: `Mode ${mode.name} overrides missing token ${override.token}.`,
          remediation: "Correct the token name or add the token before declaring the override.",
        });
      }
      if (override.reference && !tokens.has(override.reference)) {
        findings.push({
          ruleId: "ZTDE-DI-104",
          severity: "error",
          path: `tokenSystem.modes[${modeIndex}].overrides[${overrideIndex}].reference`,
          message: `Mode ${mode.name} references missing token ${override.reference}.`,
          remediation: "Correct the mode reference or add the referenced token.",
        });
      }
      if (
        token &&
        override.reference &&
        tokens.get(override.reference)?.type !== token.type
      ) {
        findings.push({
          ruleId: "ZTDE-DI-105",
          severity: "error",
          path: `tokenSystem.modes[${modeIndex}].overrides[${overrideIndex}].reference`,
          message: `Mode ${mode.name} changes ${override.token} to an incompatible token type.`,
          remediation: "Reference a token with the same type as the overridden token.",
        });
      }
      if (token?.type === "color" && override.value !== undefined && (typeof override.value !== "string" || !hexToRgb(override.value))) {
        findings.push({
          ruleId: "ZTDE-DI-105",
          severity: "error",
          path: `tokenSystem.modes[${modeIndex}].overrides[${overrideIndex}].value`,
          message: `Color override for ${override.token} is not an opaque six-digit hexadecimal color.`,
          remediation: "Use an opaque #RRGGBB value or a compatible token reference.",
        });
      }
    }
  }

  const assets = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  if (manifest.brand) {
    addDuplicates(manifest.brand.marks.map((mark) => mark.id), "brand.marks", "brand mark", findings);
    for (const [index, mark] of manifest.brand.marks.entries()) {
      if (!assets.has(mark.asset)) {
        findings.push({
          ruleId: "ZTDE-DI-201",
          severity: "error",
          path: `brand.marks[${index}].asset`,
          message: `Brand mark ${mark.id} references missing asset ${mark.asset}.`,
          remediation: "Add the logo asset with approved provenance or correct the asset identifier.",
        });
      }
    }
  }

  if (manifest.figma) {
    addDuplicates(manifest.figma.pages.map((page) => page.name), "figma.pages", "Figma page name", findings);
    const pageRoles = new Set(manifest.figma.pages.map((page) => page.role));
    for (const requiredRole of ["foundations", "components"] as const) {
      if (!pageRoles.has(requiredRole)) {
        findings.push({
          ruleId: "ZTDE-DI-202",
          severity: "error",
          path: "figma.pages",
          message: `Figma library lacks a ${requiredRole} page.`,
          remediation: `Add a maintained ${requiredRole} page with a stated purpose.`,
        });
      }
    }
    addDuplicates(manifest.figma.collections.map((collection) => collection.name), "figma.collections", "Figma collection", findings);
    for (const [collectionIndex, collection] of manifest.figma.collections.entries()) {
      addDuplicates(collection.modes, `figma.collections[${collectionIndex}].modes`, "Figma mode", findings);
      for (const [tokenIndex, tokenName] of collection.tokens.entries()) {
        if (!tokens.has(tokenName)) {
          findings.push({
            ruleId: "ZTDE-DI-203",
            severity: "error",
            path: `figma.collections[${collectionIndex}].tokens[${tokenIndex}]`,
            message: `Figma collection ${collection.name} references missing token ${tokenName}.`,
            remediation: "Bind the collection only to canonical manifest tokens.",
          });
        }
      }
    }
    addDuplicates(manifest.figma.components.map((component) => component.name), "figma.components", "component name", findings);
    for (const [componentIndex, component] of manifest.figma.components.entries()) {
      addDuplicates(component.properties.map((property) => property.name), `figma.components[${componentIndex}].properties`, "component property", findings);
      const states = new Set(component.states);
      if (!states.has("default") || (component.interactive && !states.has("focus"))) {
        findings.push({
          ruleId: "ZTDE-DI-204",
          severity: "error",
          path: `figma.components[${componentIndex}].states`,
          message: `Component ${component.name} does not declare required default and interactive focus states.`,
          remediation: "Add default and, for interactive components, focus states to the component contract.",
        });
      }
      if (component.interactive && !states.has("disabled")) {
        findings.push({
          ruleId: "ZTDE-DI-205",
          severity: "warning",
          path: `figma.components[${componentIndex}].states`,
          message: `Interactive component ${component.name} has no disabled state.`,
          remediation: "Add a disabled state or document why disabling is invalid for this component.",
        });
      }
      if (!component.documented) {
        findings.push({
          ruleId: "ZTDE-DI-206",
          severity: "warning",
          path: `figma.components[${componentIndex}].documented`,
          message: `Component ${component.name} lacks usage documentation.`,
          remediation: "Document purpose, property semantics, state use, and accessibility constraints.",
        });
      }
    }
  }

  for (const [index, asset] of manifest.assets.entries()) {
    if (manifest.version === "2.1" && (!asset.purpose || !asset.failureBehavior)) {
      findings.push({
        ruleId: "ZTDE-DI-310",
        severity: "error",
        path: `assets[${index}]`,
        message: `Version 2.1 asset ${asset.id} lacks a purpose or explicit failure behavior.`,
        remediation: "Declare why the asset supports the product task and what users receive when it cannot render.",
      });
    }
    if (
      asset.failureBehavior?.strategy === "hide-decorative" &&
      asset.alternative.kind !== "decorative"
    ) {
      findings.push({
        ruleId: "ZTDE-DI-310",
        severity: "error",
        path: `assets[${index}].failureBehavior.strategy`,
        message: `Informative asset ${asset.id} cannot disappear as decorative failure behavior.`,
        remediation: "Provide a text alternative, placeholder, retry, or blocking state that preserves the asset's meaning.",
      });
    }
    if (
      asset.alternative.kind === "decorative" &&
      asset.failureBehavior &&
      asset.failureBehavior.strategy !== "hide-decorative"
    ) {
      findings.push({
        ruleId: "ZTDE-DI-310",
        severity: "error",
        path: `assets[${index}].failureBehavior.strategy`,
        message: `Decorative asset ${asset.id} declares a failure treatment that adds unsupported meaning.`,
        remediation: "Hide failed decorative assets without introducing a placeholder, retry, or blocking state.",
      });
    }
    if (asset.rights.status !== "approved") {
      findings.push({
        ruleId: "ZTDE-DI-301",
        severity: "error",
        path: `assets[${index}].rights.status`,
        message: `Asset ${asset.id} has unresolved rights status ${asset.rights.status}.`,
        remediation: "Do not ship the asset until rights are reviewed and recorded as approved, or replace it.",
      });
    }
    if (asset.rights.status === "approved" && !asset.rights.evidence && !asset.source.sourceUrl) {
      findings.push({
        ruleId: "ZTDE-DI-302",
        severity: "error",
        path: `assets[${index}].rights`,
        message: `Asset ${asset.id} is marked approved without a source URL or evidence path.`,
        remediation: "Record verifiable rights evidence; an approval label alone is insufficient.",
      });
    }
    if (
      asset.rights.status === "approved" &&
      asset.source.origin !== "original" &&
      (!asset.rights.reviewedBy || !asset.rights.reviewedAt)
    ) {
      findings.push({
        ruleId: "ZTDE-DI-309",
        severity: "error",
        path: `assets[${index}].rights`,
        message: `Non-original asset ${asset.id} is approved without attributable review metadata.`,
        remediation: "Record the reviewer-provided name and review timestamp. An agent must not invent this approval.",
      });
    }
    if (asset.rights.basis === "spdx-license" && !asset.rights.spdxExpression) {
      findings.push({
        ruleId: "ZTDE-DI-303",
        severity: "error",
        path: `assets[${index}].rights.spdxExpression`,
        message: `Asset ${asset.id} uses an SPDX basis without an SPDX expression.`,
        remediation: "Record the applicable SPDX identifier or expression and retain source evidence.",
      });
    }
    if (asset.source.origin === "generated" && !asset.generation) {
      findings.push({
        ruleId: "ZTDE-DI-304",
        severity: "error",
        path: `assets[${index}].generation`,
        message: `Generated asset ${asset.id} lacks generation provenance.`,
        remediation: "Record provider, model, prompt record, human contributions, and reference-asset rights.",
      });
    }
    if (asset.source.origin !== "generated" && asset.generation) {
      findings.push({
        ruleId: "ZTDE-DI-305",
        severity: "warning",
        path: `assets[${index}].generation`,
        message: `Asset ${asset.id} has generation metadata but origin ${asset.source.origin}.`,
        remediation: "Correct the origin or remove unrelated generation metadata.",
      });
    }
    for (const [referenceIndex, reference] of asset.generation?.references.entries() ?? []) {
      if (reference.rightsStatus !== "approved") {
        findings.push({
          ruleId: "ZTDE-DI-306",
          severity: "error",
          path: `assets[${index}].generation.references[${referenceIndex}].rightsStatus`,
          message: `Generated asset ${asset.id} depends on a reference with unresolved rights.`,
          remediation: "Approve and document the reference rights or remove the reference from the generation workflow.",
        });
      }
    }
    if (asset.alternative.kind === "decorative" && asset.alternative.content) {
      findings.push({
        ruleId: "ZTDE-DI-307",
        severity: "warning",
        path: `assets[${index}].alternative`,
        message: `Decorative asset ${asset.id} contains alternative text.`,
        remediation: "Use an empty alternative in implementation, or reclassify the asset if it communicates information.",
      });
    }
    if (asset.alternative.kind !== "decorative" && !asset.alternative.content) {
      findings.push({
        ruleId: "ZTDE-DI-308",
        severity: "error",
        path: `assets[${index}].alternative.content`,
        message: `Informative asset ${asset.id} lacks alternative content.`,
        remediation: "Add concise text, a long description, data table, caption, or transcript appropriate to the asset.",
      });
    }
  }

  if (manifest.iconSystem) {
    addDuplicates(manifest.iconSystem.icons.map((icon) => icon.id), "iconSystem.icons", "icon identifier", findings);
    addDuplicates(manifest.iconSystem.icons.map((icon) => icon.name), "iconSystem.icons", "icon name", findings);
    for (const [index, icon] of manifest.iconSystem.icons.entries()) {
      const asset = assets.get(icon.asset);
      if (!asset || asset.kind !== "icon") {
        findings.push({
          ruleId: "ZTDE-DI-401",
          severity: "error",
          path: `iconSystem.icons[${index}].asset`,
          message: `Icon ${icon.id} does not reference an icon asset.`,
          remediation: "Add or reference an approved asset whose kind is icon.",
        });
      }
      if (!icon.decorative && !icon.accessibleName) {
        findings.push({
          ruleId: "ZTDE-DI-402",
          severity: "error",
          path: `iconSystem.icons[${index}].accessibleName`,
          message: `Semantic icon ${icon.id} lacks an accessible name.`,
          remediation: "Provide an outcome-oriented accessible name or pair the icon with equivalent visible text.",
        });
      }
      if (icon.decorative && icon.accessibleName) {
        findings.push({
          ruleId: "ZTDE-DI-403",
          severity: "warning",
          path: `iconSystem.icons[${index}].accessibleName`,
          message: `Decorative icon ${icon.id} declares an accessible name.`,
          remediation: "Hide decorative icons from assistive technology or mark the icon as semantic.",
        });
      }
    }
  }

  for (const [presentationIndex, presentation] of manifest.presentations.entries()) {
    addDuplicates(presentation.masterLayouts, `presentations[${presentationIndex}].masterLayouts`, "master layout", findings);
    addDuplicates(presentation.slides.map((slide) => slide.id), `presentations[${presentationIndex}].slides`, "slide identifier", findings);
    const layouts = new Set(presentation.masterLayouts);
    for (const [slideIndex, slide] of presentation.slides.entries()) {
      if (!layouts.has(slide.layout)) {
        findings.push({
          ruleId: "ZTDE-DI-501",
          severity: "error",
          path: `presentations[${presentationIndex}].slides[${slideIndex}].layout`,
          message: `Slide ${slide.id} references missing master layout ${slide.layout}.`,
          remediation: "Use a declared master layout or add the missing layout to the presentation system.",
        });
      }
      for (const [assetIndex, assetId] of slide.assets.entries()) {
        if (!assets.has(assetId)) {
          findings.push({
            ruleId: "ZTDE-DI-502",
            severity: "error",
            path: `presentations[${presentationIndex}].slides[${slideIndex}].assets[${assetIndex}]`,
            message: `Slide ${slide.id} references missing asset ${assetId}.`,
            remediation: "Add the approved asset record or remove the reference.",
          });
        }
      }
    }
  }

  const contrastResults: DesignDeliverableReport["contrastResults"] = [];
  const tokenModes = new Map(manifest.tokenSystem.modes.map((mode) => [mode.name, mode]));
  addDuplicates(manifest.accessibility.contrastPairs.map((pair) => pair.id), "accessibility.contrastPairs", "contrast pair", findings);
  for (const [index, pair] of manifest.accessibility.contrastPairs.entries()) {
    const mode = pair.mode ? tokenModes.get(pair.mode) : undefined;
    if (pair.mode && !mode) {
      findings.push({
        ruleId: "ZTDE-DI-601",
        severity: "error",
        path: `accessibility.contrastPairs[${index}].mode`,
        message: `Contrast pair ${pair.id} references missing token mode ${pair.mode}.`,
        remediation: "Declare the token mode or correct the contrast-pair mode.",
      });
      continue;
    }
    const modeOverrides = mode
      ? new Map(mode.overrides.map((override) => [override.token, override]))
      : undefined;
    const foreground = resolveTokenColor(pair.foreground, tokens, modeOverrides);
    const background = resolveTokenColor(pair.background, tokens, modeOverrides);
    if (!foreground || !background) {
      findings.push({
        ruleId: "ZTDE-DI-601",
        severity: "error",
        path: `accessibility.contrastPairs[${index}]`,
        message: `Contrast pair ${pair.id} cannot resolve both colors to primitive values.`,
        remediation: "Reference color tokens with valid, acyclic primitive color values.",
      });
      continue;
    }
    if (
      pair.usage === "large-text" &&
      (pair.fontSizePx === undefined ||
        pair.fontWeight === undefined ||
        (pair.fontSizePx < 24 && !(pair.fontSizePx >= 18.66 && pair.fontWeight >= 700)))
    ) {
      findings.push({
        ruleId: "ZTDE-DI-602",
        severity: "error",
        path: `accessibility.contrastPairs[${index}]`,
        message: `Contrast pair ${pair.id} is classified as large text without qualifying size and weight.`,
        remediation: "Record at least 24px regular text or 18.66px text at weight 700 or greater, otherwise classify it as normal text.",
      });
    }
    const ratio = contrastRatio(foreground, background)!;
    const required = pair.usage === "normal-text" ? 4.5 : 3;
    const passed = ratio + Number.EPSILON >= required;
    contrastResults.push({ id: pair.id, ratio: Number(ratio.toFixed(2)), required, passed });
    if (!passed) {
      findings.push({
        ruleId: "ZTDE-DI-603",
        severity: "error",
        path: `accessibility.contrastPairs[${index}]`,
        message: `Contrast pair ${pair.id} has ratio ${ratio.toFixed(2)}:1 and requires ${required}:1.`,
        remediation: "Change semantic token references or primitive values, then verify the rendered result.",
      });
    }
  }

  if (manifest.version === "2.1" && declared.has("interface-system")) {
    const canvasToken = manifest.composition?.surfaces.find((surface) => surface.role === "canvas")?.tokenRef;
    const focusToken = manifest.composition?.borders.find((border) => border.role === "focus")?.tokenRef;
    const textTokens = new Set(manifest.typography?.roles.map((role) => role.colorToken) ?? []);
    const requiredModes: Array<string | undefined> = [
      undefined,
      ...manifest.tokenSystem.modes.map((mode) => mode.name),
    ];

    if (canvasToken) {
      for (const mode of requiredModes) {
        for (const foreground of textTokens) {
          const covered = manifest.accessibility.contrastPairs.some(
            (pair) =>
              pair.foreground === foreground &&
              pair.background === canvasToken &&
              pair.usage === "normal-text" &&
              pair.mode === mode,
          );
          if (!covered) {
            findings.push({
              ruleId: "ZTDE-DI-605",
              severity: "error",
              path: "accessibility.contrastPairs",
              message: `Typography token ${foreground} has no normal-text contrast declaration on ${canvasToken}${mode ? ` in ${mode} mode` : " in the default mode"}.`,
              remediation: "Add and pass an explicit contrast pair for every typography foreground on the canvas in every declared mode.",
            });
          }
        }
        if (focusToken) {
          const focusCovered = manifest.accessibility.contrastPairs.some(
            (pair) =>
              pair.foreground === focusToken &&
              pair.background === canvasToken &&
              pair.usage === "non-text" &&
              pair.mode === mode,
          );
          if (!focusCovered) {
            findings.push({
              ruleId: "ZTDE-DI-605",
              severity: "error",
              path: "accessibility.contrastPairs",
              message: `Focus token ${focusToken} has no non-text contrast declaration on ${canvasToken}${mode ? ` in ${mode} mode` : " in the default mode"}.`,
              remediation: "Add and pass an explicit focus contrast pair for every declared interface mode.",
            });
          }
        }
      }
    }

    const colorTokenNames = new Set(
      manifest.tokenSystem.tokens.filter((token) => token.type === "color").map((token) => token.name),
    );
    const hasContrastPair = (
      foreground: string,
      background: string,
      mode: string | undefined,
    ): boolean => manifest.accessibility.contrastPairs.some(
      (pair) =>
        pair.foreground === foreground &&
        pair.background === background &&
        pair.usage === "non-text" &&
        pair.mode === mode,
    );

    for (const [stateIndex, state] of manifest.interactionStates?.states.entries() ?? []) {
      const colors = state.tokenRefs.filter((reference) => colorTokenNames.has(reference));
      const foreground = colors[0];
      const background = colors[1];
      if (!foreground || !background) continue;
      for (const mode of requiredModes) {
        if (!hasContrastPair(foreground, background, mode)) {
          findings.push({
            ruleId: "ZTDE-DI-606",
            severity: "error",
            path: `interactionStates.states[${stateIndex}].tokenRefs`,
            message: `State ${state.state} lacks declared non-text contrast for ${foreground} on ${background}${mode ? ` in ${mode} mode` : " in the default mode"}.`,
            remediation: "Add and pass a non-text contrast pair for the state foreground and adjacent surface in every declared mode.",
          });
        }
      }
    }

    for (const [chartIndex, chart] of manifest.chartContracts?.entries() ?? []) {
      const foreground = chart.tokenRefs.find((reference) => colorTokenNames.has(reference));
      const background = chart.backgroundToken;
      if (!foreground || !background) {
        findings.push({
          ruleId: "ZTDE-DI-606",
          severity: "error",
          path: `chartContracts[${chartIndex}]`,
          message: `Chart ${chart.id} lacks a series color or background token for contrast verification.`,
          remediation: "Declare the chart background token and at least one semantic series color token.",
        });
        continue;
      }
      for (const mode of requiredModes) {
        if (!hasContrastPair(foreground, background, mode)) {
          findings.push({
            ruleId: "ZTDE-DI-606",
            severity: "error",
            path: `chartContracts[${chartIndex}].tokenRefs`,
            message: `Chart ${chart.id} lacks declared series contrast on ${background}${mode ? ` in ${mode} mode` : " in the default mode"}.`,
            remediation: "Add and pass a non-text contrast pair for the chart series and its rendered surface in every declared mode.",
          });
        }
      }
    }
  }

  for (const [index, cue] of manifest.accessibility.nonColorCues.entries()) {
    const uniqueCues = new Set(cue.cues);
    if (uniqueCues.size !== cue.cues.length || [...uniqueCues].every((value) => value === "color")) {
      findings.push({
        ruleId: "ZTDE-DI-604",
        severity: "error",
        path: `accessibility.nonColorCues[${index}].cues`,
        message: `Meaning ${cue.meaning} does not declare distinct color-independent cues.`,
        remediation: "Combine color with text, icon, shape, pattern, position, value, or underline.",
      });
    }
  }

  const summary = {
    errors: findings.filter((finding) => finding.severity === "error").length,
    warnings: findings.filter((finding) => finding.severity === "warning").length,
    info: findings.filter((finding) => finding.severity === "info").length,
  };
  const requiredViewports = Object.fromEntries(
    [375, 768, 1024, 1440].map((viewport) => {
      const capture = manifest.renderedEvidence?.captures.find((entry) => entry.viewport === viewport);
      return [String(viewport), capture?.status ?? "missing"];
    }),
  ) as Record<"375" | "768" | "1024" | "1440", "missing" | "planned" | "captured" | "verified">;
  const visualPolishDeclared = declared.has("interface-system");
  const renderedEvidenceReady = visualPolishDeclared && Object.values(requiredViewports).every((status) => status === "verified");
  const humanReviewReady =
    visualPolishDeclared &&
    manifest.humanVisualReview?.status === "completed" &&
    manifest.humanVisualReview.reviewers.length > 0;
  const stages = Object.fromEntries(
    REQUIRED_GENERATION_STAGES.map((stage) => [
      stage,
      manifest.generationWorkflow?.steps.find((entry) => entry.stage === stage)?.status ?? "missing",
    ]),
  ) as Record<(typeof REQUIRED_GENERATION_STAGES)[number], "missing" | "required" | "declared" | "implemented" | "verified" | "review-required" | "review-completed">;
  const generationReady =
    visualPolishDeclared &&
    REQUIRED_GENERATION_STAGES.slice(0, 6).every((stage) => stages[stage] === "declared") &&
    stages.implementation !== "missing" &&
    stages["automated-verification"] !== "missing" &&
    stages["human-visual-review"] !== "missing";
  const trustStatus = manifest.interfaceTrust?.status ?? "missing";
  const informationStatus = manifest.informationHierarchy?.status ?? "missing";
  const contractsValidated = trustStatus === "validated" && informationStatus === "validated";
  const automatedVerificationReady = stages["automated-verification"] === "verified";
  const integratedReleaseReady =
    summary.errors === 0 &&
    generationReady &&
    contractsValidated &&
    automatedVerificationReady &&
    renderedEvidenceReady &&
    humanReviewReady;

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourcePath: resolve(sourcePath),
    manifestId: manifest.id,
    product: manifest.product,
    deliverables: manifest.scope.deliverables,
    findings,
    contrastResults,
    coverage: {
      tokens: manifest.tokenSystem.tokens.length,
      assets: manifest.assets.length,
      icons: manifest.iconSystem?.icons.length ?? 0,
      presentations: manifest.presentations.length,
      slides: manifest.presentations.reduce((total, presentation) => total + presentation.slides.length, 0),
      contrastPairs: manifest.accessibility.contrastPairs.length,
      typographyRoles: manifest.typography?.roles.length ?? 0,
      interactionStates: manifest.interactionStates?.states.length ?? 0,
      chartContracts: manifest.chartContracts?.length ?? 0,
      renderedViewports: manifest.renderedEvidence?.captures.length ?? 0,
      metricContracts: manifest.metricContracts?.metrics.length ?? 0,
      generationStages: manifest.generationWorkflow?.steps.length ?? 0,
    },
    integration: {
      generationReady,
      trustStatus,
      informationStatus,
      contractsValidated,
      automatedVerificationReady,
      humanReviewReady,
      releaseReady: integratedReleaseReady,
      stages,
    },
    visualPolish: {
      declared: visualPolishDeclared,
      requiredViewports,
      renderedEvidenceReady,
      humanReviewReady,
      releaseReady: summary.errors === 0 && renderedEvidenceReady && humanReviewReady,
    },
    summary,
    passed: summary.errors === 0,
    limitations: [
      "Manifest validation verifies declared structure, token math, references, and provenance records; it does not inspect Figma files or rendered pixels.",
      "Planned or captured viewport records are not verified rendered evidence. Visual release readiness requires verified screenshots and runtime reports at 375, 768, 1024, and 1440 CSS pixels.",
      "Human visual review is incomplete until a reviewer supplies attributable evidence for hierarchy, balance, scanability, density, and domain fit. An agent must not create that record.",
      "Linked trust and information contracts count as validated only when the manifest records their actual passing reports and evidence references.",
      "Rights records support review but are not legal advice or a determination that an asset is cleared in every jurisdiction and channel.",
      "Run browser verification and human review against final exported or implemented artifacts.",
    ],
  };
}
