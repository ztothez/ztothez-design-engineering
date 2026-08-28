import { basename } from "node:path";

import type {
  ProductDesignBrief,
  ProductBriefFinding,
  ProductBriefReport,
} from "./schema.js";

const REPORT_VERSION = "1.0.0";
const DOWNSTREAM_KINDS = [
  "product-task",
  "interface-trust",
  "information-design",
  "design-deliverable",
] as const;
const PLACEHOLDER_PATTERN = /\b(?:todo|tbd|placeholder|lorem ipsum|unknown user|generic user|user persona)\b/i;

function addFinding(
  findings: ProductBriefFinding[],
  ruleId: string,
  severity: ProductBriefFinding["severity"],
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

function normalizedScope(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function validateProductDesignBrief(
  brief: ProductDesignBrief,
  sourcePath: string,
): ProductBriefReport {
  const findings: ProductBriefFinding[] = [];
  const evidence = new Map(brief.evidenceSources.map((entry) => [entry.id, entry]));
  const audiences = new Map(brief.audiences.map((entry) => [entry.id, entry]));
  const outcomes = new Map(brief.outcomes.map((entry) => [entry.id, entry]));
  const dataSources = new Map(brief.dataSources.map((entry) => [entry.id, entry]));
  const tasks = new Map(brief.tasks.map((entry) => [entry.id, entry]));
  const requirements = new Map(brief.requirements.map((entry) => [entry.id, entry]));

  const identifierCollections: Array<[string, string[]]> = [
    ["evidenceSources", brief.evidenceSources.map((entry) => entry.id)],
    ["audiences", brief.audiences.map((entry) => entry.id)],
    ["outcomes", brief.outcomes.map((entry) => entry.id)],
    ["dataSources", brief.dataSources.map((entry) => entry.id)],
    ["tasks", brief.tasks.map((entry) => entry.id)],
    ["platforms", brief.platforms.map((entry) => entry.id)],
    ["requirements", brief.requirements.map((entry) => entry.id)],
    ["assumptions", brief.assumptions.map((entry) => entry.id)],
    ["acceptanceCriteria", brief.acceptanceCriteria.map((entry) => entry.id)],
  ];
  for (const [path, ids] of identifierCollections) {
    for (const duplicate of duplicates(ids)) {
      addFinding(findings, "ZTDE-BRIEF-001", "error", path, `Duplicate identifier: ${duplicate}.`, "Give every record a stable unique identifier within its collection.");
    }
  }

  const checkRefs = (
    refs: string[],
    target: Map<string, unknown>,
    path: string,
    owner: string,
    kind: string,
  ): void => {
    for (const [index, ref] of refs.entries()) {
      if (!target.has(ref)) {
        addFinding(findings, "ZTDE-BRIEF-101", "error", `${path}[${index}]`, `${owner} references missing ${kind} ${ref}.`, `Add the ${kind} or correct the reference.`);
      }
    }
  };

  checkRefs(brief.problem.evidenceRefs, evidence, "problem.evidenceRefs", "Problem statement", "evidence source");
  for (const [index, audience] of brief.audiences.entries()) {
    checkRefs(audience.evidenceRefs, evidence, `audiences[${index}].evidenceRefs`, `Audience ${audience.id}`, "evidence source");
  }
  for (const [index, outcome] of brief.outcomes.entries()) {
    checkRefs(outcome.evidenceRefs, evidence, `outcomes[${index}].evidenceRefs`, `Outcome ${outcome.id}`, "evidence source");
  }
  for (const [index, source] of brief.dataSources.entries()) {
    checkRefs([source.sourceEvidenceRef], evidence, `dataSources[${index}].sourceEvidenceRef`, `Data source ${source.id}`, "evidence source");
  }
  for (const [index, task] of brief.tasks.entries()) {
    checkRefs(task.audienceRefs, audiences, `tasks[${index}].audienceRefs`, `Task ${task.id}`, "audience");
    checkRefs(task.outcomeRefs, outcomes, `tasks[${index}].outcomeRefs`, `Task ${task.id}`, "outcome");
    checkRefs(task.dataRefs, dataSources, `tasks[${index}].dataRefs`, `Task ${task.id}`, "data source");
    checkRefs(task.evidenceRefs, evidence, `tasks[${index}].evidenceRefs`, `Task ${task.id}`, "evidence source");
  }
  for (const [index, state] of brief.states.entries()) {
    checkRefs(state.taskRefs, tasks, `states[${index}].taskRefs`, `State ${state.state}`, "task");
  }
  for (const [index, requirement] of brief.requirements.entries()) {
    checkRefs(requirement.taskRefs, tasks, `requirements[${index}].taskRefs`, `Requirement ${requirement.id}`, "task");
    checkRefs(requirement.evidenceRefs, evidence, `requirements[${index}].evidenceRefs`, `Requirement ${requirement.id}`, "evidence source");
  }
  for (const [index, assumption] of brief.assumptions.entries()) {
    checkRefs(assumption.evidenceRefs, evidence, `assumptions[${index}].evidenceRefs`, `Assumption ${assumption.id}`, "evidence source");
  }
  for (const [index, criterion] of brief.acceptanceCriteria.entries()) {
    checkRefs(criterion.requirementRefs, requirements, `acceptanceCriteria[${index}].requirementRefs`, `Acceptance criterion ${criterion.id}`, "requirement");
    checkRefs(criterion.taskRefs, tasks, `acceptanceCriteria[${index}].taskRefs`, `Acceptance criterion ${criterion.id}`, "task");
  }

  const primaryAudiences = brief.audiences.filter((entry) => entry.priority === "primary");
  if (primaryAudiences.length === 0) {
    addFinding(findings, "ZTDE-BRIEF-201", "error", "audiences", "The brief has no primary audience.", "Declare at least one primary audience whose task and constraints drive generation.");
  }
  for (const audience of primaryAudiences) {
    const supported = audience.evidenceRefs.some((ref) => evidence.get(ref)?.kind !== "agent-assumption");
    if (!supported || audience.goals.length === 0 || audience.contexts.length === 0) {
      addFinding(findings, "ZTDE-BRIEF-201", "error", `audiences.${audience.id}`, `Primary audience ${audience.id} lacks non-agent evidence, goals, or usage context.`, "Ground the primary audience in user-provided or observed evidence and declare concrete goals and contexts.");
    }
  }
  if (!brief.problem.evidenceRefs.some((ref) => evidence.get(ref)?.kind !== "agent-assumption")) {
    addFinding(findings, "ZTDE-BRIEF-202", "error", "problem.evidenceRefs", "The product problem is supported only by an agent assumption.", "Add user-provided, stakeholder, research, analytics, support, existing-product, or technical evidence.");
  }

  const excluded = new Set(brief.scope.excluded.map(normalizedScope));
  for (const [index, item] of brief.scope.included.entries()) {
    if (excluded.has(normalizedScope(item))) {
      addFinding(findings, "ZTDE-BRIEF-203", "error", `scope.included[${index}]`, `Scope item ${JSON.stringify(item)} is both included and excluded.`, "Resolve the scope conflict before planning implementation.");
    }
  }

  for (const [index, task] of brief.tasks.entries()) {
    if (!task.audienceRefs.some((ref) => audiences.get(ref)?.priority === "primary")) {
      addFinding(findings, "ZTDE-BRIEF-301", "warning", `tasks[${index}].audienceRefs`, `Task ${task.id} is not linked to a primary audience.`, "Link the task to a primary audience or explain why it is secondary work.");
    }
    if (["critical", "high"].includes(task.criticality) && (!task.failureImpact.trim() || !task.recovery.trim())) {
      addFinding(findings, "ZTDE-BRIEF-302", "error", `tasks[${index}]`, `High-impact task ${task.id} has no concrete failure impact or recovery.`, "Declare what failure costs and how the user preserves work, retries, or reaches support.");
    }
    if (task.consequential && task.dataRefs.length === 0) {
      addFinding(findings, "ZTDE-BRIEF-303", "error", `tasks[${index}].dataRefs`, `Consequential task ${task.id} has no declared data boundary.`, "Reference the data used for the decision or action, including local or user-entered data.");
    }
  }

  for (const [index, source] of brief.dataSources.entries()) {
    const evidenceSource = evidence.get(source.sourceEvidenceRef);
    if (["live", "hybrid"].includes(source.mode) && evidenceSource?.kind === "agent-assumption") {
      addFinding(findings, "ZTDE-BRIEF-401", "error", `dataSources[${index}].sourceEvidenceRef`, `Data source ${source.id} claims ${source.mode} behavior from agent-authored evidence.`, "Ground live behavior in a user-provided or technical source and leave connection unknown until runtime verification.");
    }
    if ((["demo", "hybrid"].includes(source.mode) || source.fallback.kind === "demo") && !/(?:demo|simulat)/i.test(source.fallback.disclosure)) {
      addFinding(findings, "ZTDE-BRIEF-402", "error", `dataSources[${index}].fallback.disclosure`, `Data source ${source.id} can show demonstration data without an explicit demo or simulation disclosure.`, "State plainly when data is demonstration or simulated and preserve that origin in results and exports.");
    }
    if (source.fallback.kind !== "none" && !source.fallback.preservesOrigin) {
      addFinding(findings, "ZTDE-BRIEF-402", "error", `dataSources[${index}].fallback.preservesOrigin`, `Fallback for ${source.id} does not preserve result origin.`, "Keep fallback origin visible through loading, result, history, and export states.");
    }
  }

  const declaredStates = new Set<string>(brief.states.map((entry) => entry.state));
  const requiredStates = new Set<string>(["empty", "success", "error"]);
  if (brief.dataSources.some((entry) => ["async", "streaming", "unknown"].includes(entry.latency))) requiredStates.add("loading");
  if (brief.dataSources.some((entry) => ["live", "hybrid", "cached"].includes(entry.mode))) requiredStates.add("stale");
  if (brief.dataSources.length > 1 || brief.dataSources.some((entry) => entry.mode === "hybrid" || entry.latency === "streaming")) requiredStates.add("partial");
  if (brief.dataSources.some((entry) => ["live", "hybrid"].includes(entry.mode) || entry.latency === "streaming")) requiredStates.add("disconnected");
  if (brief.dataSources.some((entry) => ["confidential", "restricted"].includes(entry.classification))) requiredStates.add("unauthorized");
  for (const state of requiredStates) {
    if (!declaredStates.has(state)) {
      addFinding(findings, "ZTDE-BRIEF-501", "error", "states", `Applicable interface state ${state} is missing.`, "Declare its visible behavior, disclosure, affected tasks, and recovery before generation.");
    }
  }
  for (const duplicate of duplicates(brief.states.map((entry) => entry.state))) {
    addFinding(findings, "ZTDE-BRIEF-001", "error", "states", `Duplicate interface state: ${duplicate}.`, "Define one coherent contract per interface state.");
  }

  for (const [index, platform] of brief.platforms.entries()) {
    if (platform.kind === "responsive-web") {
      for (const viewport of [375, 768, 1024, 1440]) {
        if (!platform.viewports.includes(viewport)) {
          addFinding(findings, "ZTDE-BRIEF-502", "error", `platforms[${index}].viewports`, `Responsive platform ${platform.id} omits ${viewport} CSS pixels.`, "Declare all four maintained responsive verification widths.");
        }
      }
      for (const input of ["keyboard", "pointer", "touch", "assistive-technology"] as const) {
        if (!platform.inputModes.includes(input)) {
          addFinding(findings, "ZTDE-BRIEF-502", "error", `platforms[${index}].inputModes`, `Responsive platform ${platform.id} omits ${input} operation.`, "Declare the supported responsive input and accessibility modes before generation.");
        }
      }
    }
  }

  for (const [index, assumption] of brief.assumptions.entries()) {
    if (assumption.status === "unresolved" && assumption.risk === "high") {
      addFinding(findings, "ZTDE-BRIEF-601", "error", `assumptions[${index}]`, `High-risk assumption ${assumption.id} remains unresolved.`, "Validate, reject, or reduce the assumption before generation.");
    } else if (assumption.status === "unresolved" && assumption.risk === "medium") {
      addFinding(findings, "ZTDE-BRIEF-601", "warning", `assumptions[${index}]`, `Medium-risk assumption ${assumption.id} remains unresolved.`, "Record a validation owner and resolve it before the affected implementation stage.");
    }
  }

  const coveredRequirements = new Set(brief.acceptanceCriteria.flatMap((entry) => entry.requirementRefs));
  const coveredTasks = new Set(brief.acceptanceCriteria.flatMap((entry) => entry.taskRefs));
  for (const [index, requirement] of brief.requirements.entries()) {
    if (requirement.priority === "must" && !coveredRequirements.has(requirement.id)) {
      addFinding(findings, "ZTDE-BRIEF-701", "error", `requirements[${index}]`, `Must-have requirement ${requirement.id} has no acceptance criterion.`, "Add an observable criterion, verification method, and expected evidence.");
    }
  }
  for (const [index, task] of brief.tasks.entries()) {
    if (!coveredTasks.has(task.id)) {
      addFinding(findings, "ZTDE-BRIEF-702", "error", `tasks[${index}]`, `Task ${task.id} has no acceptance coverage.`, "Add at least one criterion proving its success or recovery signal.");
    }
  }
  if (!brief.requirements.some((entry) => entry.category === "accessibility" && entry.priority === "must")) {
    addFinding(findings, "ZTDE-BRIEF-703", "error", "requirements", "The brief has no must-have accessibility requirement.", "Declare measurable keyboard, focus, contrast, reflow, target, and assistive-technology obligations as applicable.");
  }
  if (
    brief.dataSources.some((entry) => ["confidential", "restricted"].includes(entry.classification)) &&
    !brief.requirements.some((entry) => ["privacy", "security"].includes(entry.category) && entry.priority === "must")
  ) {
    addFinding(findings, "ZTDE-BRIEF-704", "error", "requirements", "Sensitive data is declared without a must-have privacy or security requirement.", "Declare handling, authorization, retention, disclosure, and verification requirements for sensitive data.");
  }

  const downstreamKinds = brief.downstreamContracts.map((entry) => entry.kind);
  for (const kind of DOWNSTREAM_KINDS) {
    if (!downstreamKinds.includes(kind)) {
      addFinding(findings, "ZTDE-BRIEF-801", "error", "downstreamContracts", `Downstream decision ${kind} is missing.`, "Declare it planned, existing with a path, or not applicable with a reason.");
    }
  }
  for (const duplicate of duplicates(downstreamKinds)) {
    addFinding(findings, "ZTDE-BRIEF-001", "error", "downstreamContracts", `Duplicate downstream contract kind: ${duplicate}.`, "Declare each downstream contract decision once.");
  }

  const inspectForPlaceholders: Array<[string, string]> = [
    ["problem.statement", brief.problem.statement],
    ["problem.currentOutcome", brief.problem.currentOutcome],
    ["problem.desiredOutcome", brief.problem.desiredOutcome],
    ...brief.audiences.map((entry, index) => [`audiences[${index}].role`, entry.role] as [string, string]),
    ...brief.tasks.flatMap((entry, index) => [
      [`tasks[${index}].goal`, entry.goal] as [string, string],
      [`tasks[${index}].successSignal`, entry.successSignal] as [string, string],
      [`tasks[${index}].recovery`, entry.recovery] as [string, string],
    ]),
    ...brief.requirements.map((entry, index) => [`requirements[${index}].statement`, entry.statement] as [string, string]),
    ...brief.acceptanceCriteria.map((entry, index) => [`acceptanceCriteria[${index}].statement`, entry.statement] as [string, string]),
  ];
  for (const [path, value] of inspectForPlaceholders) {
    if (PLACEHOLDER_PATTERN.test(value)) {
      addFinding(findings, "ZTDE-BRIEF-901", "error", path, `Generation-critical text contains unresolved placeholder language: ${JSON.stringify(value)}.`, "Replace placeholder language with evidence-backed content or record a bounded assumption explicitly.");
    }
  }

  if (brief.status === "draft") {
    addFinding(findings, "ZTDE-BRIEF-902", "info", "status", "The brief is still draft and cannot authorize generation.", "Review the report, resolve blockers, and set status to validated only when the evidence is current.");
  }

  const summary = findings.reduce(
    (counts, finding) => ({ ...counts, [finding.severity]: counts[finding.severity] + 1 }),
    { error: 0, warning: 0, info: 0 },
  );
  const passed = summary.error === 0;

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    sourcePath: basename(sourcePath),
    briefId: brief.id,
    product: brief.product,
    findings,
    coverage: {
      evidenceSources: brief.evidenceSources.length,
      audiences: brief.audiences.length,
      primaryAudiences: primaryAudiences.length,
      outcomes: brief.outcomes.length,
      tasks: brief.tasks.length,
      dataSources: brief.dataSources.length,
      states: brief.states.length,
      platforms: brief.platforms.length,
      requirements: brief.requirements.length,
      acceptanceCriteria: brief.acceptanceCriteria.length,
    },
    summary: { errors: summary.error, warnings: summary.warning, info: summary.info },
    passed,
    generationReady: passed && brief.status === "validated",
    limitations: [
      "This validator checks declared evidence, references, task and state completeness, acceptance coverage, and generation-readiness boundaries; it does not prove that the product problem or proposed solution is correct.",
      "A validated brief authorizes design planning, not implementation release. Downstream architecture, trust, information, design, browser, and quality-gate evidence remain required.",
      "Human or representative-user verification methods are evidence requirements only. This tool does not create or satisfy human attestations.",
    ],
  };
}
