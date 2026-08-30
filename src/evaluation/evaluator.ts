import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";

import { parse } from "yaml";
import { z } from "zod";

import { inspectProductContract } from "../contracts/validator.js";
import { journeySuiteSchema } from "../contracts/schema.js";
import { comparisonReportSchema } from "../comparison/schema.js";
import { runtimeReportSchema } from "../runtime/schema.js";
import {
  v4EvaluationConfigSchema,
  v4EvaluationReportSchema,
  type V4EvaluationConfig,
  type V4EvaluationReport,
} from "./schema.js";

const parsedRuntimeReportSchema = z.object(runtimeReportSchema).strict();

function contained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

async function containedExisting(root: string, requested: string): Promise<string> {
  const candidate = await realpath(resolve(root, requested));
  if (!contained(root, candidate)) throw new Error(`Evaluation path escapes its configured root: ${requested}`);
  if (!(await stat(candidate)).isFile()) throw new Error(`Evaluation path is not a regular file: ${requested}`);
  return candidate;
}

export async function loadV4EvaluationConfig(path: string): Promise<V4EvaluationConfig> {
  return v4EvaluationConfigSchema.parse(parse(await readFile(path, "utf8")));
}

async function interactionRuleFixtures(
  projectRoot: string,
  fixtures: V4EvaluationConfig["ruleFixtures"],
) {
  const parseFixture = async (requested: string) => {
    const path = await containedExisting(projectRoot, requested);
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  };
  const positive = journeySuiteSchema.safeParse(await parseFixture(fixtures.positive)).success;
  const negative = !journeySuiteSchema.safeParse(await parseFixture(fixtures.negative)).success;
  const abstention = journeySuiteSchema.safeParse(await parseFixture(fixtures.abstention)).success;
  return { positive, negative, abstention, passed: positive && negative && abstention };
}

async function runtimeEvidence(
  evidenceRoot: string,
  directory: string,
  profiles: string[],
  requiredViewports: V4EvaluationConfig["requiredViewports"],
  expectedJourneys: ReadonlyMap<string, string> = new Map(),
) {
  const evidence: string[] = [];
  let passed = true;
  for (const profile of profiles) {
    const portablePath = `${directory}/${profile}/runtime-report.json`;
    try {
      const path = await containedExisting(evidenceRoot, portablePath);
      const report = parsedRuntimeReportSchema.parse(JSON.parse(await readFile(path, "utf8")));
      const viewportsPass = requiredViewports.every((required) =>
        report.viewports.some((actual) => actual.width === required.width && actual.height === required.height),
      );
      const expectedJourney = expectedJourneys.get(profile);
      const expectedJourneyPasses = expectedJourney === undefined || report.journeys.some(
        (journey) => journey.name === expectedJourney && journey.passed,
      );
      if (!report.passed || !viewportsPass || report.journeys.length === 0 ||
          !report.journeys.every((journey) => journey.passed) || !expectedJourneyPasses) {
        passed = false;
      }
      evidence.push(portablePath);
    } catch {
      passed = false;
    }
  }
  return { passed, evidence };
}

export async function evaluateV4BeforeAfter(options: {
  config: V4EvaluationConfig;
  projectRoot: string;
  evidenceRoot: string;
}): Promise<V4EvaluationReport> {
  const projectRoot = await realpath(resolve(options.projectRoot));
  const evidenceRoot = await realpath(resolve(options.evidenceRoot));

  const calibrationPath = await containedExisting(projectRoot, options.config.calibration.report);
  const calibrationInput = comparisonReportSchema.parse(JSON.parse(await readFile(calibrationPath, "utf8")));
  for (const source of options.config.calibration.qualitativeSources) {
    await containedExisting(projectRoot, source);
  }
  const calibration = {
    retained: calibrationInput.passed === true && (calibrationInput.summary?.sessions ?? 0) > 0,
    sessions: calibrationInput.summary?.sessions ?? 0,
    warnings: calibrationInput.summary?.warnings ?? 0,
    releaseReady: calibrationInput.releaseReady === true,
    disagreementPreserved: (calibrationInput.summary?.warnings ?? 0) > 0,
    evidence: [options.config.calibration.report, ...options.config.calibration.qualitativeSources],
    limitation: "V2 human findings calibrate visual interpretation only; they are not regenerated, rescored, or treated as V4 release approval.",
  };

  const products = [];
  for (const product of options.config.products) {
    const baselinePath = await containedExisting(projectRoot, product.baselineContract);
    const candidatePath = await containedExisting(projectRoot, product.candidateContract);
    const baseline = await inspectProductContract(baselinePath, { projectRoot });
    const candidate = await inspectProductContract(candidatePath, { projectRoot });
    const baselineProfiles = [...new Set(product.tasks.flatMap((task) => task.baselineProfiles))];
    const candidateProfiles = [...new Set(product.tasks.map((task) => task.candidateProfile))];
    const baselineExpectedJourneys = new Map<string, string>();
    const candidateExpectedJourneys = new Map<string, string>();
    if (baseline.contract && baseline.contract.version !== "1.0") {
      for (const taskConfig of product.tasks) {
        const task = baseline.contract.benchmark.tasks.find((candidate) => candidate.id === taskConfig.id);
        if (task?.journey) baselineExpectedJourneys.set(task.journey.profile, task.journey.journey);
      }
    }
    if (candidate.contract && candidate.contract.version !== "1.0") {
      for (const taskConfig of product.tasks) {
        const task = candidate.contract.benchmark.tasks.find((candidateTask) => candidateTask.id === taskConfig.id);
        if (task?.journey) candidateExpectedJourneys.set(task.journey.profile, task.journey.journey);
      }
    }
    const baselineRuntime = await runtimeEvidence(
      evidenceRoot,
      product.evidenceDirectory,
      baselineProfiles,
      options.config.requiredViewports,
      baselineExpectedJourneys,
    );
    const candidateRuntime = await runtimeEvidence(
      evidenceRoot,
      product.evidenceDirectory,
      candidateProfiles,
      options.config.requiredViewports,
      candidateExpectedJourneys,
    );
    const limitations: string[] = [];

    const taskResults = product.tasks.map((taskConfig) => {
      const baselineTask = baseline.contract && baseline.contract.version !== "1.0"
        ? baseline.contract.benchmark.tasks.find((task) => task.id === taskConfig.id)
        : undefined;
      const candidateTask = candidate.contract && candidate.contract.version !== "1.0"
        ? candidate.contract.benchmark.tasks.find((task) => task.id === taskConfig.id)
        : undefined;
      const sameTask = Boolean(
        baselineTask && candidateTask &&
        baselineTask.primary === candidateTask.primary &&
        baselineTask.actor === candidateTask.actor &&
        baselineTask.mode === candidateTask.mode &&
        baselineTask.intent === candidateTask.intent,
      );
      const sameStates = Boolean(
        baselineTask && candidateTask &&
        isDeepStrictEqual(baselineTask.start, candidateTask.start) &&
        isDeepStrictEqual(baselineTask.success, candidateTask.success) &&
        isDeepStrictEqual(baselineTask.recovery, candidateTask.recovery),
      );
      const sameRoute = Boolean(baselineTask?.browser?.route && baselineTask.browser.route === candidateTask?.browser?.route);
      const sameViewports = Boolean(
        baseline.contract && candidate.contract &&
        isDeepStrictEqual(baseline.contract.verification.viewports, candidate.contract.verification.viewports),
      );
      const candidateJourney = candidateTask?.journey && candidate.suite?.profiles
        .find((profile) => profile.id === candidateTask.journey!.profile)?.journeys
        .find((journey) => journey.id === candidateTask.journey!.journey);
      const candidateInteraction = candidate.report.passed && candidate.suite?.version === "1.1" &&
        candidateTask?.journey?.profile === taskConfig.candidateProfile &&
        candidateJourney?.interaction?.phases.includes("primary") &&
        candidateJourney.interaction.phases.includes("recovery")
        ? "passed" as const
        : "failed" as const;
      return {
        id: taskConfig.id,
        sameTask,
        sameStates,
        sameRoute,
        sameViewports,
        baselineInteraction: "unverified" as const,
        candidateInteraction,
      };
    });

    const equivalent = taskResults.every((task) => task.sameTask && task.sameStates && task.sameRoute && task.sameViewports);
    const candidateInteractionPassing = taskResults.every((task) => task.candidateInteraction === "passed");
    if (!baselineRuntime.passed) limitations.push("One or more baseline browser profiles are missing or failed.");
    if (!candidateRuntime.passed) limitations.push("One or more candidate interaction profiles are missing or failed.");
    if (!equivalent) limitations.push("Task, state, route, or viewport identity differs between baseline and candidate.");

    const improvementPassing = baseline.report.passed && candidate.report.passed && baselineRuntime.passed && candidateRuntime.passed && equivalent && candidateInteractionPassing;
    const dimensions = [
      { id: "task-completeness" as const, status: improvementPassing ? "improved" as const : "unverified" as const, rationale: "The candidate adds task-bound primary and required recovery checkpoints while the historical suite remains unqualified." },
      { id: "hierarchy" as const, status: candidateRuntime.passed ? "non-regressed" as const : "unverified" as const, rationale: "Equivalent candidate routes pass the same rendered composition and responsive checks; no hierarchy improvement is inferred." },
      { id: "accessibility" as const, status: candidateRuntime.passed ? "non-regressed" as const : "unverified" as const, rationale: "Candidate interaction reports pass the configured automated accessibility and rendered checks at every required viewport." },
      { id: "responsiveness" as const, status: candidateRuntime.passed && equivalent ? "non-regressed" as const : "unverified" as const, rationale: "Baseline and candidate use identical viewport declarations and candidate reports cover every required width." },
      { id: "truthful-disclosure" as const, status: improvementPassing ? "improved" as const : "unverified" as const, rationale: "Failure, preserved state, fallback, and recovered success are observed without converting unavailable sources into live claims." },
      { id: "maintainability" as const, status: candidate.report.passed ? "improved" as const : "unverified" as const, rationale: "Historical compatibility and qualified interaction evidence use separate versioned contracts instead of mutating the baseline suite." },
      { id: "visual-quality" as const, status: "calibration-only" as const, rationale: "Existing attributable V2 findings remain the visual calibration input; automated evidence does not rescore visual preference." },
    ];
    products.push({
      id: product.id,
      cohort: product.cohort,
      stages: {
        baseline: { passed: baseline.report.passed && baselineRuntime.passed, evidence: [product.baselineContract, ...baselineRuntime.evidence] },
        candidate: { passed: candidate.report.passed && candidateRuntime.passed, evidence: [product.candidateContract, ...candidateRuntime.evidence] },
        equivalence: { passed: equivalent, evidence: [product.baselineContract, product.candidateContract] },
      },
      tasks: taskResults,
      dimensions,
      passed: improvementPassing,
      limitations,
    });
  }

  const fixtures = await interactionRuleFixtures(projectRoot, options.config.ruleFixtures);
  const criteria = {
    equivalentComparisons: products.every((product) => product.stages.equivalence.passed),
    deterministicRuleFixtures: fixtures.passed,
    developmentEvidencePassing: products.filter((product) => product.cohort === "development").every((product) => product.passed),
    lockedHoldoutPassing: products.filter((product) => product.cohort === "holdout").every((product) => product.passed),
    humanCalibrationRetained: calibration.retained,
    disagreementPreserved: calibration.disagreementPreserved,
    noVanityScore: true as const,
  };
  const passed = Object.values(criteria).every(Boolean);
  return v4EvaluationReportSchema.parse({
    version: "1.0",
    evaluationId: options.config.id,
    generatedAt: new Date().toISOString(),
    calibration,
    ruleFixtures: fixtures,
    products,
    criteria,
    promotedRules: passed ? ["task-bound-interaction-evidence"] : [],
    withheldRules: [{
      id: "storage-failure-control",
      reason: "Retained as a product-specific verifier capability; the Azure holdout has no browser-storage task and cannot establish cross-product promotion.",
    }],
    humanEvidence: "not-generated",
    passed,
  });
}
