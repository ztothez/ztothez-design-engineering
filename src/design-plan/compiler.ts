import { createHash } from "node:crypto";
import { realpath, stat } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";

import { validateProductContract } from "../contracts/validator.js";
import { loadDesignDeliverable } from "../design-intelligence/loader.js";
import { validateDesignDeliverable } from "../design-intelligence/validator.js";
import { loadInformationDesignContract } from "../information-design/loader.js";
import { validateInformationDesignContract } from "../information-design/validator.js";
import { loadInterfaceTrustContract } from "../interface-trust/loader.js";
import { validateInterfaceTrustContract } from "../interface-trust/validator.js";
import type { ProductDesignBrief } from "../product-brief/schema.js";
import { validateProductDesignBrief } from "../product-brief/validator.js";
import {
  designPlanSchema,
  type DesignPlan,
  type DesignPlanTrace,
  type DownstreamContractResult,
} from "./schema.js";

export const DESIGN_PLAN_COMPILER_VERSION = "1.0.0";

export type CompileDesignPlanOptions = {
  briefSourcePath: string;
  projectRoot: string;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function isContained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

async function resolveContractPath(projectRoot: string, requestedPath: string): Promise<{ absolute: string; source: string }> {
  if (requestedPath.includes("\0") || isAbsolute(requestedPath)) {
    throw new Error("Existing downstream contract paths must be project-root-relative");
  }
  if (!/\.(?:json|ya?ml)$/i.test(requestedPath)) {
    throw new Error("Existing downstream contracts must end in .json, .yaml, or .yml");
  }
  const root = await realpath(resolve(projectRoot));
  if (!(await stat(root)).isDirectory()) throw new Error("Project root must be a directory");
  const candidate = await realpath(resolve(root, requestedPath));
  if (!isContained(root, candidate)) throw new Error("Existing downstream contract escapes the project root");
  if (!(await stat(candidate)).isFile()) throw new Error("Existing downstream contract is not a regular file");
  return { absolute: candidate, source: relative(root, candidate).split(sep).join("/") };
}

function traceId(prefix: string, value: string): string {
  return `trace-${prefix}-${value}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").slice(0, 128).replace(/-$/, "");
}

function planId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

async function validateDownstreamContracts(
  brief: ProductDesignBrief,
  projectRoot: string,
  traceFor: (kind: DesignPlanTrace["kind"], reference: string, description: string) => string,
): Promise<DownstreamContractResult[]> {
  const results: DownstreamContractResult[] = [];
  for (const declaration of brief.downstreamContracts) {
    const traceRefs = [traceFor("brief", `downstreamContracts.${declaration.kind}`, `Brief decision for the ${declaration.kind} contract.`)];
    if (declaration.status === "planned") {
      results.push({ kind: declaration.kind, declaration: "planned", validation: "planned", passed: false, findings: 0, reason: "The contract is planned and must be authored and validated before implementation.", traceRefs });
      continue;
    }
    if (declaration.status === "not-applicable") {
      results.push({ kind: declaration.kind, declaration: "not-applicable", validation: "not-applicable", passed: true, findings: 0, reason: declaration.reason!, traceRefs });
      continue;
    }
    try {
      const resolved = await resolveContractPath(projectRoot, declaration.path!);
      let passed = false;
      let findings = 0;
      if (declaration.kind === "product-task") {
        const report = await validateProductContract(resolved.absolute, { projectRoot });
        passed = report.passed;
        findings = report.issues.length;
      } else if (declaration.kind === "interface-trust") {
        const report = validateInterfaceTrustContract(await loadInterfaceTrustContract(resolved.absolute), resolved.absolute);
        passed = report.passed;
        findings = report.findings.length;
      } else if (declaration.kind === "information-design") {
        const report = validateInformationDesignContract(await loadInformationDesignContract(resolved.absolute), resolved.absolute);
        passed = report.passed;
        findings = report.findings.length;
      } else {
        const report = validateDesignDeliverable(await loadDesignDeliverable(resolved.absolute), resolved.absolute);
        passed = report.passed;
        findings = report.findings.length;
      }
      results.push({
        kind: declaration.kind,
        declaration: "exists",
        validation: passed ? "validated" : "invalid",
        source: resolved.source,
        passed,
        findings,
        reason: passed ? "The declared existing contract passed its maintained validator." : "The declared existing contract has validation findings that block implementation.",
        traceRefs,
      });
    } catch {
      results.push({ kind: declaration.kind, declaration: "exists", validation: "invalid", passed: false, findings: 1, reason: "The declared existing contract could not be loaded within the allowed project root or did not pass structural parsing.", traceRefs });
    }
  }
  return results;
}

export async function compileDesignPlan(
  brief: ProductDesignBrief,
  options: CompileDesignPlanOptions,
): Promise<DesignPlan> {
  const traces = new Map<string, DesignPlanTrace>();
  const traceFor = (kind: DesignPlanTrace["kind"], reference: string, description: string): string => {
    const id = traceId(kind, reference);
    if (!traces.has(id)) traces.set(id, { id, kind, reference, description });
    return id;
  };
  const standard = (reference: string, description: string) => traceFor("standard", reference, description);
  const briefTrace = (reference: string, description: string) => traceFor("brief", reference, description);
  const assumptionTrace = (id: string, description: string) => traceFor("assumption", `assumptions.${id}`, description);

  const briefReport = validateProductDesignBrief(brief, options.briefSourcePath);
  const contracts = await validateDownstreamContracts(brief, options.projectRoot, traceFor);
  const invalidContracts = contracts.filter((entry) => entry.validation === "invalid");
  const plannedContracts = contracts.filter((entry) => entry.validation === "planned");
  const plannedRoutes = brief.tasks.map((task) => ({
    id: `route-${task.id}`,
    path: `/tasks/${task.id}`,
    taskRef: task.id,
    status: "confirmed" as const,
    purpose: task.goal,
    traceRefs: [
      briefTrace(`tasks.${task.id}`, `Task ${task.id} requires a reachable route.`),
      standard("route-convention", "Use stable task-oriented route identifiers in the design plan; the generation adapter must map them to an existing target router without collision."),
    ],
  }));

  const blockers = [
    ...(!briefReport.generationReady ? ["The product design brief is not generation-ready."] : []),
    ...invalidContracts.map((entry) => `The existing ${entry.kind} contract is invalid or unavailable.`),
    ...plannedContracts.map((entry) => `Author and validate the planned ${entry.kind} contract.`),
  ];
  const planningReady = briefReport.generationReady;
  const implementationReady = planningReady && invalidContracts.length === 0 && plannedContracts.length === 0;
  const status: DesignPlan["status"] = !planningReady || invalidContracts.length > 0 ? "blocked" : implementationReady ? "ready" : "provisional";

  const informationArchitecture = brief.tasks.flatMap((task) => {
    const taskRef = briefTrace(`tasks.${task.id}`, `Primary task and recovery contract for ${task.id}.`);
    const dataRefs = task.dataRefs.map((reference) => `dataSources.${reference}`);
    return [
      { id: `ia-${task.id}-context`, order: 1, label: "Context and provenance", purpose: `Establish trigger, scope, data origin, and freshness before ${task.title}.`, contentRefs: [task.trigger, ...dataRefs], traceRefs: [taskRef, standard("decision-hierarchy", "Operational interfaces answer context, priority, impact, evidence, action, and verification in that order.")] },
      { id: `ia-${task.id}-priority`, order: 2, label: "Primary outcome and action", purpose: task.goal, contentRefs: task.outcomeRefs.map((reference) => `outcomes.${reference}`), traceRefs: [taskRef] },
      { id: `ia-${task.id}-impact`, order: 3, label: "Impact and exceptions", purpose: task.failureImpact, contentRefs: [`tasks.${task.id}.failureImpact`], traceRefs: [taskRef] },
      { id: `ia-${task.id}-evidence`, order: 4, label: "Evidence and explanation", purpose: "Expose the evidence needed to verify the decision without promoting supporting telemetry above the task.", contentRefs: dataRefs.length ? dataRefs : [`tasks.${task.id}.inputs`], traceRefs: [taskRef] },
      { id: `ia-${task.id}-action`, order: 5, label: "Bounded next action", purpose: task.successSignal, contentRefs: [`tasks.${task.id}.successSignal`], traceRefs: [taskRef] },
      { id: `ia-${task.id}-verification`, order: 6, label: "Recovery and verification", purpose: task.recovery, contentRefs: [`tasks.${task.id}.recovery`], traceRefs: [taskRef] },
    ];
  });

  const components = brief.tasks.flatMap((task) => {
    const taskRef = briefTrace(`tasks.${task.id}`, `Component boundaries implement task ${task.id}.`);
    const boundaryRef = standard("component-boundaries", "Separate orchestration, state ownership, evidence presentation, actions, and recovery behind explicit inputs and outputs.");
    return [
      { id: `component-${task.id}-shell`, taskRef: task.id, boundary: "task-shell", responsibility: "Own route context and compose the decision path without owning service behavior.", ownsState: [], inputs: [task.trigger], outputs: ["selected task context"], traceRefs: [taskRef, boundaryRef] },
      { id: `component-${task.id}-state`, taskRef: task.id, boundary: "domain-state-controller", responsibility: "Own task, data-origin, progress, failure, and recovery state independently from rendering.", ownsState: brief.states.filter((entry) => entry.taskRefs.includes(task.id)).map((entry) => entry.state), inputs: task.dataRefs, outputs: ["typed task state", "bounded actions"], traceRefs: [taskRef, boundaryRef] },
      { id: `component-${task.id}-decision`, taskRef: task.id, boundary: "decision-summary", responsibility: "Present scope, priority, impact, and the primary next action in decision order.", ownsState: [], inputs: task.outcomeRefs, outputs: ["selected decision"], traceRefs: [taskRef, boundaryRef] },
      { id: `component-${task.id}-evidence`, taskRef: task.id, boundary: "evidence-detail", responsibility: "Present source, freshness, limitations, and supporting evidence without obscuring the primary task.", ownsState: [], inputs: task.dataRefs, outputs: ["evidence selection"], traceRefs: [taskRef, boundaryRef] },
      { id: `component-${task.id}-action`, taskRef: task.id, boundary: "bounded-action-and-recovery", responsibility: "Confirm consequential actions, preserve context on failure, and expose retry or return behavior.", ownsState: [], inputs: task.inputs, outputs: [task.successSignal, task.recovery], traceRefs: [taskRef, boundaryRef] },
    ];
  });

  const stateOwnership = brief.states.flatMap((state) => state.taskRefs.map((taskRef) => ({
    state: state.state,
    taskRefs: [taskRef],
    ownerComponentRef: `component-${taskRef}-state`,
    behavior: state.behavior,
    recovery: state.recovery,
    disclosure: state.disclosure,
    traceRefs: [briefTrace(`states.${state.state}`, `Declared ${state.state} behavior, recovery, and disclosure.`)],
  })));

  const requirementRefs = (category: ProductDesignBrief["requirements"][number]["category"]) => brief.requirements.filter((entry) => entry.category === category).map((entry) => briefTrace(`requirements.${entry.id}`, entry.statement));
  const baseTrace = [standard("semantic-token-architecture", "Bind components to semantic roles backed by component and primitive token layers; do not emit raw visual values in the plan.")];
  const tokenRequirements = [
    { id: "tokens-color", category: "color" as const, roles: ["surface", "text", "border", "focus", "status", "action"], rule: "Define theme-specific semantic roles with contrast and non-color state cues.", traceRefs: [...baseTrace, ...requirementRefs("accessibility")] },
    { id: "tokens-typography", category: "typography" as const, roles: ["page-title", "section-title", "body", "label", "data", "annotation"], rule: "Use stable readable roles with no viewport-width font scaling or negative letter spacing.", traceRefs: baseTrace },
    { id: "tokens-spacing", category: "spacing" as const, roles: ["inline", "stack", "section", "control", "viewport-gutter"], rule: "Use a finite spacing scale that preserves grouping and responsive rhythm.", traceRefs: baseTrace },
    { id: "tokens-shape", category: "shape" as const, roles: ["control-radius", "panel-radius", "border-width", "focus-width"], rule: "Use restrained component geometry and a distinct focus treatment.", traceRefs: baseTrace },
    { id: "tokens-motion", category: "motion" as const, roles: ["duration-fast", "duration-standard", "easing", "reduced-motion"], rule: "Motion must communicate state and provide a reduced-motion equivalent.", traceRefs: [...baseTrace, ...requirementRefs("accessibility")] },
    { id: "tokens-data-visualization", category: "data-visualization" as const, roles: ["series", "threshold", "selection", "grid", "annotation"], rule: "Chart roles must remain distinguishable without color and preserve source and freshness context.", traceRefs: baseTrace },
  ];

  const responsiveBehavior = brief.platforms.map((platform) => ({
    platformRef: platform.id,
    viewports: [...platform.viewports].sort((left, right) => left - right),
    inputModes: [...platform.inputModes],
    rules: ["Preserve decision order and task state at every declared viewport.", "Remove competing page-level scroll regions and prevent clipping or control overlap.", "Keep the primary action reachable before secondary telemetry.", ...platform.constraints],
    traceRefs: [briefTrace(`platforms.${platform.id}`, `Declared platform, viewport, input, and constraint boundary for ${platform.id}.`), standard("responsive-verification", "Verify maintained responsive widths, text resize, reflow, focus, touch targets, and reduced motion in a browser.")],
  }));

  const assetRequirements = brief.requirements.filter((entry) => ["brand", "content"].includes(entry.category)).map((entry) => ({
    id: `asset-${entry.id}`,
    purpose: entry.statement,
    rightsRequired: true,
    alternativesRequired: true,
    traceRefs: [briefTrace(`requirements.${entry.id}`, entry.statement)],
  }));
  const assets = {
    status: (assetRequirements.length > 0 ? "confirmed" : "provisional") as "confirmed" | "provisional",
    requirements: assetRequirements,
    rule: assetRequirements.length > 0 ? "Every asset requires purpose, provenance, rights, accessible alternatives, and failure behavior." : "No brand or content asset is required by the brief. Do not invent decorative assets; record any later need before generation.",
    traceRefs: [standard("asset-provenance", "Assets are optional specialized deliverables and require purpose, rights, alternatives, contrast, and fallback evidence.")],
  };

  const stageDefinitions = [
    ["stage-contracts", "Validate downstream contracts", "All applicable product-task, trust, information, and design contracts pass."],
    ["stage-architecture", "Confirm target architecture", "Routes, component boundaries, state owners, and target repository conventions are confirmed."],
    ["stage-tokens", "Define semantic tokens", "Primitive, semantic, and component token layers cover every declared role and theme."],
    ["stage-task-path", "Implement the primary task and recovery", "The smallest coherent task path covers success, failure, disclosure, and recovery."],
    ["stage-automated-verification", "Run automated verification", "Static, contract, integration, and browser evidence satisfies every automated obligation."],
    ["stage-human-review", "Complete attributable human review", "Only criteria explicitly requiring human evidence have attributable reviewer records."],
  ] as const;
  const implementationStages = stageDefinitions.map(([id, name, exitCondition], index) => ({
    id, order: index + 1, name, exitCondition,
    status: (index === 0
      ? invalidContracts.length > 0
        ? "blocked"
        : plannedContracts.length > 0
          ? "provisional"
          : "confirmed"
      : "provisional") as "blocked" | "provisional" | "confirmed",
    traceRefs: [standard("delivery-sequence", "Validate intent and contracts before architecture, tokens, implementation, automated verification, and attributable human review.")],
  }));

  const verificationObligations = brief.acceptanceCriteria.map((criterion) => ({
    id: `verify-${criterion.id}`,
    acceptanceCriterionRef: criterion.id,
    taskRefs: criterion.taskRefs,
    method: criterion.method,
    blocking: criterion.blocking,
    expectedEvidence: criterion.expectedEvidence,
    traceRefs: [briefTrace(`acceptanceCriteria.${criterion.id}`, criterion.statement)],
  }));

  for (const assumption of brief.assumptions) assumptionTrace(assumption.id, `${assumption.status} ${assumption.risk}-risk assumption: ${assumption.statement}`);
  const decisions = [
    { id: "decision-product-boundary", status: planningReady ? "confirmed" as const : "blocked" as const, statement: brief.problem.desiredOutcome, rationale: brief.problem.statement, traceRefs: [briefTrace("problem", "Evidence-backed current problem and desired outcome.")] },
    { id: "decision-route-boundary", status: "confirmed" as const, statement: "Use one stable task-oriented design route per declared task.", rationale: "The plan establishes a deterministic route contract; the generation adapter remains responsible for collision-safe target-router integration.", traceRefs: [standard("route-convention", "Task-oriented route planning with target integration deferred to the generation adapter."), ...brief.tasks.map((task) => briefTrace(`tasks.${task.id}`, task.title))] },
    { id: "decision-assets", status: assets.status, statement: assets.rule, rationale: "Asset scope follows declared brand and content requirements rather than decorative defaults.", traceRefs: assets.traceRefs },
    ...brief.assumptions.map((assumption) => ({ id: `decision-${assumption.id}`, status: (assumption.status === "validated" ? "confirmed" : assumption.status === "rejected" ? "blocked" : "provisional") as "confirmed" | "blocked" | "provisional", statement: assumption.statement, rationale: assumption.validationMethod, traceRefs: [assumptionTrace(assumption.id, `${assumption.status} ${assumption.risk}-risk assumption.`)] })),
  ];

  const plan: DesignPlan = {
    version: "1.0",
    compilerVersion: DESIGN_PLAN_COMPILER_VERSION,
    id: `${planId(brief.id)}-design-plan`,
    product: brief.product,
    sourceBrief: { id: brief.id, version: brief.version, file: basename(options.briefSourcePath), digest: digest(brief), generationReady: briefReport.generationReady },
    status,
    planningReady,
    implementationReady,
    traces: [...traces.values()].sort((left, right) => left.id.localeCompare(right.id)),
    decisions,
    informationArchitecture,
    routes: plannedRoutes,
    components,
    stateOwnership,
    contracts,
    tokenRequirements,
    responsiveBehavior,
    assets,
    implementationStages,
    verificationObligations,
    blockers,
    limitations: [
      "A compiled plan proves deterministic transformation and declaration traceability, not product desirability, target-repository compatibility, rendered quality, or runtime correctness.",
      "Provisional decisions require the stated downstream contract or target-architecture evidence before implementation begins.",
      "Human-expert and representative-user obligations remain evidence requirements. Compilation does not create or satisfy human attestations.",
    ],
  };

  const parsed = designPlanSchema.parse(plan);
  const knownTraces = new Set(parsed.traces.map((entry) => entry.id));
  const allTraceRefs = [
    ...parsed.decisions.flatMap((entry) => entry.traceRefs),
    ...parsed.informationArchitecture.flatMap((entry) => entry.traceRefs),
    ...parsed.routes.flatMap((entry) => entry.traceRefs),
    ...parsed.components.flatMap((entry) => entry.traceRefs),
    ...parsed.stateOwnership.flatMap((entry) => entry.traceRefs),
    ...parsed.contracts.flatMap((entry) => entry.traceRefs),
    ...parsed.tokenRequirements.flatMap((entry) => entry.traceRefs),
    ...parsed.responsiveBehavior.flatMap((entry) => entry.traceRefs),
    ...parsed.assets.traceRefs,
    ...parsed.assets.requirements.flatMap((entry) => entry.traceRefs),
    ...parsed.implementationStages.flatMap((entry) => entry.traceRefs),
    ...parsed.verificationObligations.flatMap((entry) => entry.traceRefs),
  ];
  const missingTrace = allTraceRefs.find((reference) => !knownTraces.has(reference));
  if (missingTrace) throw new Error(`Compiled design plan references missing trace ${missingTrace}`);
  return parsed;
}
