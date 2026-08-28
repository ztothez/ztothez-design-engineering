import { resolve } from "node:path";

import type {
  InformationDesignContract,
  InformationDesignFinding,
  InformationDesignReport,
} from "./schema.js";

const REPORT_VERSION = "1.0.0";
const REQUIRED_LEVELS = [
  "context-provenance",
  "primary-outcome-action",
  "critical-exceptions",
  "health-impact-metrics",
  "prioritized-findings",
  "operational-telemetry",
  "evidence-audit-trail",
  "history-exports",
] as const;
const REQUIRED_QUESTIONS = [
  "identify-context",
  "identify-priority",
  "explain-impact",
  "inspect-evidence",
  "identify-next-action",
  "verify-success",
] as const;

function addFinding(
  findings: InformationDesignFinding[],
  ruleId: string,
  severity: InformationDesignFinding["severity"],
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

export function validateInformationDesignContract(
  contract: InformationDesignContract,
  sourcePath: string,
): InformationDesignReport {
  const reportFindings: InformationDesignFinding[] = [];
  const sources = new Map(contract.sources.map((entry) => [entry.id, entry]));
  const freshness = new Map(contract.freshness.map((entry) => [entry.id, entry]));
  const baselines = new Map(contract.baselines.map((entry) => [entry.id, entry]));
  const destinations = new Map(contract.destinations.map((entry) => [entry.id, entry]));
  const contexts = new Map(contract.contexts.map((entry) => [entry.id, entry]));
  const labelPolicies = new Map(contract.labelPolicies.map((entry) => [entry.id, entry]));
  const valuePolicies = new Map(contract.valuePolicies.map((entry) => [entry.id, entry]));
  const evidence = new Map(contract.evidence.map((entry) => [entry.id, entry]));
  const metrics = new Map(contract.metrics.map((entry) => [entry.id, entry]));
  const findings = new Map(contract.findings.map((entry) => [entry.id, entry]));
  const charts = new Map(contract.charts.map((entry) => [entry.id, entry]));

  const identifiers: Array<[string, string[]]> = [
    ["sources", contract.sources.map((entry) => entry.id)],
    ["freshness", contract.freshness.map((entry) => entry.id)],
    ["baselines", contract.baselines.map((entry) => entry.id)],
    ["destinations", contract.destinations.map((entry) => entry.id)],
    ["contexts", contract.contexts.map((entry) => entry.id)],
    ["labelPolicies", contract.labelPolicies.map((entry) => entry.id)],
    ["valuePolicies", contract.valuePolicies.map((entry) => entry.id)],
    ["evidence", contract.evidence.map((entry) => entry.id)],
    ["metrics", contract.metrics.map((entry) => entry.id)],
    ["findings", contract.findings.map((entry) => entry.id)],
    ["charts", contract.charts.map((entry) => entry.id)],
    ["collections", contract.collections.map((entry) => entry.id)],
    ["tasks", contract.tasks.map((entry) => entry.id)],
  ];
  for (const [path, values] of identifiers) {
    for (const duplicate of duplicates(values)) {
      addFinding(reportFindings, "ZTDE-INFO-001", "error", path, `Duplicate identifier: ${duplicate}.`, "Give every information-design record a stable unique identifier within its collection.");
    }
  }

  const checkRefs = (
    values: string[],
    target: Map<string, unknown>,
    path: string,
    owner: string,
    kind: string,
  ): void => {
    for (const [index, reference] of values.entries()) {
      if (!target.has(reference)) {
        addFinding(reportFindings, "ZTDE-INFO-101", "error", `${path}[${index}]`, `${owner} references missing ${kind} ${reference}.`, `Add the ${kind} or correct the reference.`);
      }
    }
  };

  for (const [index, item] of contract.freshness.entries()) {
    checkRefs([item.sourceRef], sources, `freshness[${index}].sourceRef`, `Freshness record ${item.id}`, "source");
    if (item.timezone && !validTimezone(item.timezone)) {
      addFinding(reportFindings, "ZTDE-INFO-201", "error", `freshness[${index}].timezone`, `Freshness record ${item.id} uses invalid IANA timezone ${item.timezone}.`, "Use a valid IANA timezone such as Europe/Helsinki or UTC.");
    }
  }

  for (const [index, baseline] of contract.baselines.entries()) {
    checkRefs(baseline.sourceRefs, sources, `baselines[${index}].sourceRefs`, `Baseline ${baseline.id}`, "source");
  }

  for (const [index, context] of contract.contexts.entries()) {
    checkRefs(context.sourceRefs, sources, `contexts[${index}].sourceRefs`, `Context ${context.id}`, "source");
    checkRefs([context.freshnessRef], freshness, `contexts[${index}].freshnessRef`, `Context ${context.id}`, "freshness record");
  }

  for (const [index, policy] of contract.labelPolicies.entries()) {
    if (policy.overflow === "truncate-with-reveal" && !policy.accessibleReveal) {
      addFinding(reportFindings, "ZTDE-INFO-205", "error", `labelPolicies[${index}]`, `Label policy ${policy.id} truncates content without an accessible full-label reveal.`, "Use wrapping or provide keyboard and assistive-technology-accessible full text.");
    }
  }

  for (const [index, policy] of contract.valuePolicies.entries()) {
    const exceptionalStates = [policy.states.missing, policy.states.partial, policy.states.stale];
    if (new Set(exceptionalStates.map((state) => state.label.toLowerCase())).size !== exceptionalStates.length) {
      addFinding(reportFindings, "ZTDE-INFO-203", "error", `valuePolicies[${index}].states`, `Value policy ${policy.id} does not visibly distinguish missing, partial, and stale values.`, "Give missing, partial, and stale states distinct labels and behaviors.");
    }
    if (new Set(exceptionalStates.map((state) => state.behavior.toLowerCase())).size !== exceptionalStates.length) {
      addFinding(reportFindings, "ZTDE-INFO-203", "error", `valuePolicies[${index}].states`, `Value policy ${policy.id} uses the same behavior for missing, partial, and stale values.`, "Define state-specific recovery, provenance, and display behavior.");
    }
  }

  for (const [index, item] of contract.evidence.entries()) {
    checkRefs([item.sourceRef], sources, `evidence[${index}].sourceRef`, `Evidence ${item.id}`, "source");
  }

  for (const [index, metric] of contract.metrics.entries()) {
    checkRefs(metric.sourceRefs, sources, `metrics[${index}].sourceRefs`, `Metric ${metric.id}`, "source");
    checkRefs([metric.contextRef], contexts, `metrics[${index}].contextRef`, `Metric ${metric.id}`, "context");
    checkRefs([metric.freshnessRef], freshness, `metrics[${index}].freshnessRef`, `Metric ${metric.id}`, "freshness record");
    checkRefs([metric.drilldownRef], destinations, `metrics[${index}].drilldownRef`, `Metric ${metric.id}`, "destination");
    checkRefs([metric.labelPolicyRef], labelPolicies, `metrics[${index}].labelPolicyRef`, `Metric ${metric.id}`, "label policy");
    checkRefs([metric.valuePolicyRef], valuePolicies, `metrics[${index}].valuePolicyRef`, `Metric ${metric.id}`, "value policy");
    if (metric.baseline.status === "available" && !baselines.has(metric.baseline.reference)) {
      addFinding(reportFindings, "ZTDE-INFO-204", "error", `metrics[${index}].baseline.reference`, `Metric ${metric.id} references missing baseline ${metric.baseline.reference}.`, "Add the baseline or declare why it is unknown or not applicable.");
    }
    if (metric.decorative) {
      addFinding(reportFindings, "ZTDE-INFO-202", "error", `metrics[${index}].decorative`, `Metric ${metric.id} is declared decorative and does not belong on an operational surface.`, "Remove the metric or bind it to a defined decision, action, source, and drill-down.");
    }
  }

  for (const [index, finding] of contract.findings.entries()) {
    checkRefs(finding.evidenceRefs, evidence, `findings[${index}].evidenceRefs`, `Finding ${finding.id}`, "evidence");
    checkRefs(finding.validation.evidenceRefs, evidence, `findings[${index}].validation.evidenceRefs`, `Finding ${finding.id} validation`, "evidence");
    checkRefs([finding.destinationRef], destinations, `findings[${index}].destinationRef`, `Finding ${finding.id}`, "destination");
    if (new Set(finding.nonColorCues).size !== finding.nonColorCues.length) {
      addFinding(reportFindings, "ZTDE-INFO-302", "error", `findings[${index}].nonColorCues`, `Finding ${finding.id} repeats cues instead of declaring distinct visual signals.`, "Declare at least two distinct cues, including one cue other than color.");
    }
    if (!finding.nonColorCues.some((cue) => cue !== "color")) {
      addFinding(reportFindings, "ZTDE-INFO-302", "error", `findings[${index}].nonColorCues`, `Finding ${finding.id} relies on color alone.`, "Add explicit text, icon, value, shape, pattern, or position semantics in addition to color.");
    }
  }

  for (const [index, chart] of contract.charts.entries()) {
    checkRefs(chart.metricRefs, metrics, `charts[${index}].metricRefs`, `Chart ${chart.id}`, "metric");
    checkRefs([chart.destinationRef], destinations, `charts[${index}].destinationRef`, `Chart ${chart.id}`, "destination");
    checkRefs([chart.alternative.destinationRef], destinations, `charts[${index}].alternative.destinationRef`, `Chart ${chart.id} alternative`, "destination");
    checkRefs([chart.valuePolicyRef], valuePolicies, `charts[${index}].valuePolicyRef`, `Chart ${chart.id}`, "value policy");
    if (chart.decorative) {
      addFinding(reportFindings, "ZTDE-INFO-401", "error", `charts[${index}].decorative`, `Chart ${chart.id} is declared decorative.`, "Remove the chart or define its decision, source metrics, accessible alternative, and drill-down.");
    }
    if (!chart.labeling.titleVisible || !chart.labeling.valuesVisible) {
      addFinding(reportFindings, "ZTDE-INFO-402", "error", `charts[${index}].labeling`, `Chart ${chart.id} hides its title or values.`, "Expose a visible title and readable values; do not depend on hover or color alone.");
    }
    if (!chart.labeling.legendVisible && !chart.labeling.legendReason) {
      addFinding(reportFindings, "ZTDE-INFO-402", "error", `charts[${index}].labeling.legendReason`, `Chart ${chart.id} omits its legend without explaining why labels remain unambiguous.`, "Show the legend or document the direct-labeling strategy.");
    }
  }

  for (const [index, collection] of contract.collections.entries()) {
    checkRefs([collection.labelPolicyRef], labelPolicies, `collections[${index}].labelPolicyRef`, `Collection ${collection.id}`, "label policy");
    if (collection.estimatedMaximumItems > 100) {
      const scalable = collection.strategy === "pagination" || collection.strategy === "virtualization";
      if (!scalable || !collection.search || (!collection.filter && !collection.sort)) {
        addFinding(reportFindings, "ZTDE-INFO-501", "error", `collections[${index}]`, `Large collection ${collection.id} lacks scalable rendering and retrieval controls.`, "Use pagination or virtualization, provide search, and provide filtering or sorting for collections over 100 items.");
      }
    }
  }

  for (const [index, entry] of contract.hierarchy.entries()) {
    const expected = REQUIRED_LEVELS[index];
    if (entry.level !== expected || entry.order !== index + 1) {
      addFinding(reportFindings, "ZTDE-INFO-002", "error", `hierarchy[${index}]`, `Hierarchy position ${index + 1} must be ${expected} with order ${index + 1}, not ${entry.level} with order ${entry.order}.`, "Restore the required eight-level operational answer order.");
    }
    checkRefs(entry.contextRefs, contexts, `hierarchy[${index}].contextRefs`, `Hierarchy level ${entry.level}`, "context");
    checkRefs(entry.metricRefs, metrics, `hierarchy[${index}].metricRefs`, `Hierarchy level ${entry.level}`, "metric");
    checkRefs(entry.findingRefs, findings, `hierarchy[${index}].findingRefs`, `Hierarchy level ${entry.level}`, "finding");
    checkRefs(entry.chartRefs, charts, `hierarchy[${index}].chartRefs`, `Hierarchy level ${entry.level}`, "chart");
    checkRefs(entry.destinationRefs, destinations, `hierarchy[${index}].destinationRefs`, `Hierarchy level ${entry.level}`, "destination");

    const referenceCount = entry.contextRefs.length + entry.metricRefs.length + entry.findingRefs.length + entry.chartRefs.length + entry.destinationRefs.length;
    if (referenceCount === 0) {
      addFinding(reportFindings, "ZTDE-INFO-002", "error", `hierarchy[${index}]`, `Hierarchy level ${entry.level} has no operational content.`, "Reference the context, metric, finding, chart, or destination that answers this level.");
    }
  }

  const requiredLevelContent: Array<[number, boolean, string]> = [
    [0, (contract.hierarchy[0]?.contextRefs.length ?? 0) > 0, "context"],
    [1, (contract.hierarchy[1]?.metricRefs.length ?? 0) > 0 && (contract.hierarchy[1]?.destinationRefs.length ?? 0) > 0, "a primary metric and action destination"],
    [2, (contract.hierarchy[2]?.findingRefs.length ?? 0) > 0, "critical findings"],
    [3, (contract.hierarchy[3]?.metricRefs.length ?? 0) > 0, "health or impact metrics"],
    [4, (contract.hierarchy[4]?.findingRefs.length ?? 0) > 0, "prioritized findings"],
    [5, (contract.hierarchy[5]?.metricRefs.length ?? 0) > 0 || (contract.hierarchy[5]?.chartRefs.length ?? 0) > 0, "operational telemetry"],
    [6, (contract.hierarchy[6]?.findingRefs.length ?? 0) > 0, "evidence-backed findings"],
    [7, contract.hierarchy[7]?.destinationRefs.some((reference) => ["history", "export"].includes(destinations.get(reference)?.kind ?? "")) ?? false, "a history or export destination"],
  ];
  for (const [index, valid, expected] of requiredLevelContent) {
    if (!valid) {
      addFinding(reportFindings, "ZTDE-INFO-002", "error", `hierarchy[${index}]`, `Hierarchy level ${REQUIRED_LEVELS[index]} does not reference ${expected}.`, `Add ${expected} to this hierarchy level.`);
    }
  }

  for (const question of REQUIRED_QUESTIONS) {
    if (!contract.tasks.some((task) => task.question === question)) {
      addFinding(reportFindings, "ZTDE-INFO-601", "error", "tasks", `Required answer-flow task ${question} is missing.`, `Add a task that proves the interface declares how to ${question.replaceAll("-", " ")}.`);
    }
  }

  for (const [index, task] of contract.tasks.entries()) {
    checkRefs(task.contextRefs, contexts, `tasks[${index}].contextRefs`, `Task ${task.id}`, "context");
    checkRefs(task.metricRefs, metrics, `tasks[${index}].metricRefs`, `Task ${task.id}`, "metric");
    checkRefs(task.findingRefs, findings, `tasks[${index}].findingRefs`, `Task ${task.id}`, "finding");
    checkRefs(task.destinationRefs, destinations, `tasks[${index}].destinationRefs`, `Task ${task.id}`, "destination");
    const complete = {
      "identify-context": task.contextRefs.length > 0,
      "identify-priority": task.findingRefs.length > 0,
      "explain-impact": task.findingRefs.length > 0 || task.metricRefs.length > 0,
      "inspect-evidence": task.findingRefs.length > 0,
      "identify-next-action": task.findingRefs.length > 0 && task.destinationRefs.length > 0,
      "verify-success": task.findingRefs.length > 0 && task.destinationRefs.length > 0,
    }[task.question];
    if (!complete) {
      addFinding(reportFindings, "ZTDE-INFO-602", "error", `tasks[${index}]`, `Task ${task.id} does not contain the references needed to answer ${task.question}.`, "Reference the exact context, metric, finding, and destination needed for the declared answer.");
    }
  }

  const summary = reportFindings.reduce(
    (total, finding) => ({ ...total, [finding.severity]: total[finding.severity] + 1 }),
    { error: 0, warning: 0, info: 0 },
  );
  const answerFlow = Object.fromEntries(
    REQUIRED_QUESTIONS.map((question) => [question, contract.tasks.some((task) => task.question === question)]),
  ) as Record<(typeof REQUIRED_QUESTIONS)[number], boolean>;

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourcePath: resolve(sourcePath),
    contractId: contract.id,
    product: contract.product,
    findings: reportFindings,
    coverage: {
      sources: contract.sources.length,
      contexts: contract.contexts.length,
      metrics: contract.metrics.length,
      findings: contract.findings.length,
      charts: contract.charts.length,
      collections: contract.collections.length,
      hierarchyLevels: contract.hierarchy.length,
      answerFlow,
    },
    summary: { errors: summary.error, warnings: summary.warning, info: summary.info },
    passed: summary.error === 0,
    limitations: [
      "This validator checks declared structure, references, decision paths, exceptional states, hierarchy, and non-color cues; it does not inspect a rendered interface.",
      "A declared metric formula, source, finding, chart alternative, or task answer is not proof that implementation code calculates or presents it correctly.",
      "Task declarations are design-review inputs, not representative-user evidence. Human comprehension and task success require attributable Item 8 review.",
    ],
  };
}
