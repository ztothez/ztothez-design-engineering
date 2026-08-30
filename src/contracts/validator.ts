import { readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { parse } from "yaml";

import {
  journeySuiteSchema,
  productContractSchema,
  type ContractIssue,
  type ContractValidationReport,
  type JourneySuite,
  type ProductContract,
} from "./schema.js";
import { validateArchetypeActivation } from "./archetypes.js";

const REPORT_VERSION = "1.0.0";
const MAX_CONTRACT_BYTES = 1024 * 1024;

export type ValidationOptions = {
  projectRoot?: string;
};

export type ContractInspection = {
  report: ContractValidationReport;
  contract?: ProductContract;
  suite?: JourneySuite;
  journeyPath?: string;
};

function isContained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

function issue(code: string, path: string, message: string): ContractIssue {
  return { code, path, message };
}

function zodIssues(prefix: string, errors: readonly { path: PropertyKey[]; message: string }[]): ContractIssue[] {
  return errors.map((entry) =>
    issue(
      "CONTRACT-SCHEMA",
      [prefix, ...entry.path.map(String)].filter(Boolean).join("."),
      entry.message,
    ),
  );
}

function duplicateIssues(label: string, values: string[]): ContractIssue[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].map((value) =>
    issue("CONTRACT-DUPLICATE-ID", label, `Duplicate identifier: ${value}`),
  );
}

async function readStructuredFile(path: string): Promise<unknown> {
  const fileStats = await stat(path);
  if (!fileStats.isFile()) throw new Error("Path is not a regular file");
  if (fileStats.size > MAX_CONTRACT_BYTES) {
    throw new Error(`File exceeds the ${MAX_CONTRACT_BYTES}-byte contract limit`);
  }
  const text = await readFile(path, "utf8");
  return path.endsWith(".json") ? JSON.parse(text) : parse(text);
}

async function validateDeclaredFile(
  declaredPath: string,
  baseDirectory: string,
  projectRoot: string | undefined,
  fieldPath: string,
  issues: ContractIssue[],
): Promise<string | undefined> {
  if (declaredPath.includes("\0") || isAbsolute(declaredPath)) {
    issues.push(issue("CONTRACT-PATH", fieldPath, "Declared files must use repository-relative paths"));
    return undefined;
  }
  const candidate = resolve(baseDirectory, declaredPath);
  if (projectRoot && !isContained(projectRoot, candidate)) {
    issues.push(issue("CONTRACT-PATH", fieldPath, "Declared file resolves outside the project root"));
    return undefined;
  }
  try {
    const fileStats = await stat(candidate);
    if (!fileStats.isFile()) throw new Error("not a regular file");
    return candidate;
  } catch {
    issues.push(issue("CONTRACT-MISSING-SOURCE", fieldPath, `Declared file does not exist: ${declaredPath}`));
    return undefined;
  }
}

function validateContractReferences(contract: ProductContract, suite: JourneySuite): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const actorIds = new Set(contract.actors.map((actor) => actor.id));
  const modeIds = new Set(contract.modes.map((mode) => mode.id));
  const outputIds = new Set(contract.outputs.map((output) => output.id));
  const criterionIds = new Set(contract.acceptanceCriteria.map((criterion) => criterion.id));
  const profiles = new Map(suite.profiles.map((profile) => [profile.id, profile]));

  issues.push(...duplicateIssues("actors", contract.actors.map((actor) => actor.id)));
  issues.push(...duplicateIssues("modes", contract.modes.map((mode) => mode.id)));
  issues.push(...duplicateIssues("outputs", contract.outputs.map((output) => output.id)));
  issues.push(...duplicateIssues("metrics", contract.metrics.map((metric) => metric.id)));
  issues.push(...duplicateIssues("acceptanceCriteria", contract.acceptanceCriteria.map((criterion) => criterion.id)));
  issues.push(...duplicateIssues("journeyProfiles", suite.profiles.map((profile) => profile.id)));

  for (const [modeIndex, mode] of contract.modes.entries()) {
    for (const output of mode.outputs) {
      if (!outputIds.has(output)) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `modes.${modeIndex}.outputs`, `Unknown output: ${output}`));
      }
    }
  }

  for (const [machineIndex, machine] of contract.stateMachines.entries()) {
    const states = new Set(machine.states.map((state) => state.id));
    issues.push(...duplicateIssues(`stateMachines.${machineIndex}.states`, machine.states.map((state) => state.id)));
    if (!states.has(machine.initial)) {
      issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `stateMachines.${machineIndex}.initial`, `Unknown initial state: ${machine.initial}`));
    }
    for (const [transitionIndex, transition] of machine.transitions.entries()) {
      if (!states.has(transition.from)) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `stateMachines.${machineIndex}.transitions.${transitionIndex}.from`, `Unknown state: ${transition.from}`));
      }
      if (!states.has(transition.to)) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `stateMachines.${machineIndex}.transitions.${transitionIndex}.to`, `Unknown state: ${transition.to}`));
      }
    }
  }

  for (const [criterionIndex, criterion] of contract.acceptanceCriteria.entries()) {
    for (const mode of criterion.appliesToModes) {
      if (!modeIds.has(mode)) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `acceptanceCriteria.${criterionIndex}.appliesToModes`, `Unknown mode: ${mode}`));
      }
    }
  }

  if (suite.contract !== contract.id) {
    issues.push(issue("CONTRACT-MISMATCH", "journeys.contract", `Journey suite targets ${suite.contract}, expected ${contract.id}`));
  }

  for (const [profileIndex, profile] of suite.profiles.entries()) {
    issues.push(...duplicateIssues(`journeyProfiles.${profileIndex}.journeys`, profile.journeys.map((journey) => journey.id)));
  }

  for (const [bindingIndex, binding] of contract.verification.bindings.entries()) {
    const path = `verification.bindings.${bindingIndex}`;
    const profile = profiles.get(binding.profile);
    if (!profile) {
      issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.profile`, `Unknown journey profile: ${binding.profile}`));
    } else if (!profile.journeys.some((journey) => journey.id === binding.journey)) {
      issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.journey`, `Unknown journey ${binding.journey} in profile ${binding.profile}`));
    }
    if (!actorIds.has(binding.actor)) {
      issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.actor`, `Unknown actor: ${binding.actor}`));
    }
    if (!modeIds.has(binding.mode)) {
      issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.mode`, `Unknown mode: ${binding.mode}`));
    }
    for (const criterion of binding.acceptanceCriteria) {
      if (!criterionIds.has(criterion)) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.acceptanceCriteria`, `Unknown acceptance criterion: ${criterion}`));
      }
    }
  }

  if (contract.version !== "1.0") {
    const benchmark = contract.benchmark;
    issues.push(...validateArchetypeActivation(benchmark));

    issues.push(...duplicateIssues("benchmark.tasks", benchmark.tasks.map((task) => task.id)));
    const machines = new Map(contract.stateMachines.map((machine) => [machine.id, machine]));
    const viewportByName = new Map(contract.verification.viewports.map((viewport) => [viewport.name, viewport]));
    const validateState = (
      stateRef: { stateMachine: string; state: string },
      path: string,
      allowedCategories?: Set<string>,
    ) => {
      const machine = machines.get(stateRef.stateMachine);
      if (!machine) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.stateMachine`, `Unknown state machine: ${stateRef.stateMachine}`));
        return;
      }
      const state = machine.states.find((entry) => entry.id === stateRef.state);
      if (!state) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.state`, `Unknown state: ${stateRef.state}`));
      } else if (allowedCategories && !allowedCategories.has(state.category)) {
        issues.push(
          issue(
            "CONTRACT-TASK-STATE",
            `${path}.state`,
            `State ${state.id} has category ${state.category}; expected ${[...allowedCategories].join(" or ")}.`,
          ),
        );
      }
    };

    for (const [taskIndex, task] of benchmark.tasks.entries()) {
      const path = `benchmark.tasks.${taskIndex}`;
      if (!actorIds.has(task.actor)) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.actor`, `Unknown actor: ${task.actor}`));
      }
      if (!modeIds.has(task.mode)) {
        issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.mode`, `Unknown mode: ${task.mode}`));
      }
      validateState(task.start, `${path}.start`);
      validateState(task.success, `${path}.success`, new Set(["success", "terminal"]));
      validateState(task.recovery.failure, `${path}.recovery.failure`, new Set(["error", "fallback", "terminal"]));

      if (task.journey) {
        const journeyProfile = profiles.get(task.journey.profile);
        const journey = journeyProfile?.journeys.find((entry) => entry.id === task.journey!.journey);
        if (!journeyProfile) {
          issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.journey.profile`, `Unknown journey profile: ${task.journey.profile}`));
        } else if (!journey) {
          issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.journey.journey`, `Unknown journey: ${task.journey.journey}`));
        } else if (contract.version === "1.2") {
          if (suite.version !== "1.1") {
            issues.push(
              issue(
                "CONTRACT-INTERACTION-SUITE",
                `${path}.journey`,
                "V1.2 product contracts require a V1.1 interaction journey suite.",
              ),
            );
          } else if (!journey.interaction) {
            issues.push(
              issue(
                "CONTRACT-INTERACTION-COVERAGE",
                `${path}.journey`,
                "The bound journey must declare interaction coverage.",
              ),
            );
          } else {
            if (journey.interaction.task !== task.id) {
              issues.push(
                issue(
                  "CONTRACT-INTERACTION-TASK",
                  `${path}.journey`,
                  `Journey interaction task ${journey.interaction.task} must match product task ${task.id}.`,
                ),
              );
            }
            if (task.primary && !journey.interaction.phases.includes("primary")) {
              issues.push(
                issue(
                  "CONTRACT-INTERACTION-COVERAGE",
                  `${path}.journey`,
                  "Primary product tasks require primary journey checkpoints.",
                ),
              );
            }
            if (task.recovery.required && !journey.interaction.phases.includes("recovery")) {
              issues.push(
                issue(
                  "CONTRACT-INTERACTION-COVERAGE",
                  `${path}.journey`,
                  "Tasks with required recovery require failure and preserved-state checkpoints.",
                ),
              );
            }
          }
        }
        const binding = contract.verification.bindings.find(
          (entry) =>
            entry.profile === task.journey!.profile &&
            entry.journey === task.journey!.journey &&
            entry.actor === task.actor &&
            entry.mode === task.mode,
        );
        if (!binding) {
          issues.push(
            issue(
              "CONTRACT-TASK-BINDING",
              `${path}.journey`,
              "Task journey must have a verification binding with the same actor and mode.",
            ),
          );
        }
      }

      if (task.browser) {
        const viewport = viewportByName.get(task.browser.narrowViewport);
        if (!viewport) {
          issues.push(issue("CONTRACT-UNKNOWN-REFERENCE", `${path}.browser.narrowViewport`, `Unknown viewport: ${task.browser.narrowViewport}`));
        } else if (viewport.width > 768) {
          issues.push(
            issue(
              "CONTRACT-NARROW-VIEWPORT",
              `${path}.browser.narrowViewport`,
              `Viewport ${viewport.name} is ${viewport.width}px wide; task paths require 768px or narrower.`,
            ),
          );
        }
      }
    }
  }

  return issues;
}

export async function inspectProductContract(
  requestedContractPath: string,
  options: ValidationOptions = {},
): Promise<ContractInspection> {
  const contractPath = resolve(requestedContractPath);
  const projectRoot = options.projectRoot ? resolve(options.projectRoot) : undefined;
  const baseDirectory = resolve(contractPath, "..");
  const issues: ContractIssue[] = [];
  let contract: ProductContract | undefined;
  let suite: JourneySuite | undefined;
  let journeyPath: string | undefined;

  if (projectRoot && !isContained(projectRoot, contractPath)) {
    issues.push(issue("CONTRACT-PATH", "contract", "Contract path is outside the project root"));
  } else {
    try {
      const parsed = productContractSchema.safeParse(await readStructuredFile(contractPath));
      if (parsed.success) contract = parsed.data;
      else issues.push(...zodIssues("contract", parsed.error.issues));
    } catch (error) {
      issues.push(issue("CONTRACT-PARSE", "contract", error instanceof Error ? error.message : String(error)));
    }
  }

  if (contract) {
    for (const [index, source] of contract.authority.precedence.entries()) {
      await validateDeclaredFile(source.path, baseDirectory, projectRoot, `authority.precedence.${index}.path`, issues);
    }
    journeyPath = await validateDeclaredFile(contract.verification.journeyFile, baseDirectory, projectRoot, "verification.journeyFile", issues);
    if (journeyPath) {
      try {
        const parsed = journeySuiteSchema.safeParse(await readStructuredFile(journeyPath));
        if (parsed.success) suite = parsed.data;
        else issues.push(...zodIssues("journeys", parsed.error.issues));
      } catch (error) {
        issues.push(issue("CONTRACT-PARSE", "journeys", error instanceof Error ? error.message : String(error)));
      }
    }
  }

  if (contract && suite) issues.push(...validateContractReferences(contract, suite));

  const counts = {
    actors: contract?.actors.length ?? 0,
    modes: contract?.modes.length ?? 0,
    acceptanceCriteria: contract?.acceptanceCriteria.length ?? 0,
    journeyProfiles: suite?.profiles.length ?? 0,
    journeys: suite?.profiles.reduce((sum, profile) => sum + profile.journeys.length, 0) ?? 0,
  };
  const taskModel = contract && contract.version !== "1.0"
    ? {
        status: issues.some((entry) => entry.path.startsWith("benchmark.")) ? "invalid" as const : "ready" as const,
        archetype: contract.benchmark.archetype,
        primaryTasks: contract.benchmark.tasks.filter((task) => task.primary).length,
        recoveryTasks: contract.benchmark.tasks.filter((task) => task.recovery.required).length,
        narrowViewportTasks: contract.benchmark.tasks.filter((task) => Boolean(task.browser)).length,
        evidencePolicy: contract.benchmark.evidencePolicy,
      }
    : {
        status: contract ? "legacy" as const : "invalid" as const,
        primaryTasks: 0,
        recoveryTasks: 0,
        narrowViewportTasks: 0,
        evidencePolicy: {
          missingEvidence: "unverified" as const,
          failedBehavior: "failed" as const,
          unsupportedCapability: "limitation" as const,
        },
      };
  const limitations = contract?.version === "1.0"
    ? ["Legacy version 1.0 contract has no archetype-aware product task model."]
    : [];

  const report: ContractValidationReport = {
    version: REPORT_VERSION,
    contractPath,
    ...(journeyPath ? { journeyPath } : {}),
    generatedAt: new Date().toISOString(),
    ...(contract ? { contractId: contract.id } : {}),
    counts,
    taskModel,
    limitations,
    issues,
    passed: issues.length === 0,
  };
  return {
    report,
    ...(contract ? { contract } : {}),
    ...(suite ? { suite } : {}),
    ...(journeyPath ? { journeyPath } : {}),
  };
}

export async function validateProductContract(
  requestedContractPath: string,
  options: ValidationOptions = {},
): Promise<ContractValidationReport> {
  return (await inspectProductContract(requestedContractPath, options)).report;
}
