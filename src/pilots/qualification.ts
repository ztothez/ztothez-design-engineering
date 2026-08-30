import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";

import { parse } from "yaml";
import { z } from "zod";

import { compileDesignPlan } from "../design-plan/compiler.js";
import { validateProductContract } from "../contracts/validator.js";
import { designPlanSchema } from "../design-plan/schema.js";
import { generationManifestSchema } from "../generation/schema.js";
import { loadProductDesignBrief } from "../product-brief/loader.js";
import { validateProductDesignBrief } from "../product-brief/validator.js";
import { runtimeReportSchema } from "../runtime/schema.js";
import {
  pilotQualificationConfigSchema,
  pilotQualificationReportSchema,
  type PilotQualificationConfig,
  type PilotQualificationReport,
} from "./schema.js";

const parsedRuntimeReportSchema = z.object(runtimeReportSchema).strict();

function contained(root: string, candidate: string): boolean {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

async function containedExisting(root: string, requested: string): Promise<string> {
  const candidate = await realpath(resolve(root, requested));
  if (!contained(root, candidate)) throw new Error(`Pilot path escapes its configured root: ${requested}`);
  return candidate;
}

async function digestFile(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

export async function loadPilotQualificationConfig(path: string): Promise<PilotQualificationConfig> {
  const source = await readFile(path, "utf8");
  return pilotQualificationConfigSchema.parse(parse(source));
}

export async function evaluatePilotQualification(options: {
  config: PilotQualificationConfig;
  projectRoot: string;
  evidenceRoot: string;
}): Promise<PilotQualificationReport> {
  const projectRoot = await realpath(resolve(options.projectRoot));
  const evidenceRoot = await realpath(resolve(options.evidenceRoot));
  if (!(await stat(projectRoot)).isDirectory() || !(await stat(evidenceRoot)).isDirectory()) {
    throw new Error("Pilot project and evidence roots must be directories.");
  }

  const products = [];
  for (const pilot of options.config.products) {
    const systemDefects: string[] = [];
    const productFindings: string[] = [];
    const verifierLimitations: string[] = [];
    const sourcePolicyRestrictions = [
      "Only the repository-owned disposable fixture is executable; protected product sources remain read-only.",
    ];
    const adaptedManifestFiles: string[] = [];
    const profileResults: Array<{ id: string; passed: boolean; journeys: number; screenshots: number }> = [];

    let briefPassed = false;
    let planPassed = false;
    let implementationPassed = false;
    let interactionPassed = true;
    let manifestOwnedFiles = 0;

    const briefPath = await containedExisting(projectRoot, pilot.brief);
    const planPath = await containedExisting(projectRoot, pilot.plan);
    const fixturePath = await containedExisting(projectRoot, pilot.fixture);

    try {
      const brief = await loadProductDesignBrief(briefPath);
      const briefReport = validateProductDesignBrief(brief, briefPath);
      briefPassed = briefReport.passed && briefReport.generationReady;
      if (!briefPassed) systemDefects.push(`${pilot.id}: product brief is not generation-ready.`);

      const retainedPlan = designPlanSchema.parse(JSON.parse(await readFile(planPath, "utf8")));
      const compiledPlan = await compileDesignPlan(brief, { briefSourcePath: briefPath, projectRoot });
      planPassed =
        retainedPlan.status === "ready" &&
        retainedPlan.planningReady &&
        retainedPlan.implementationReady &&
        isDeepStrictEqual(retainedPlan, compiledPlan);
      if (!planPassed) systemDefects.push(`${pilot.id}: retained design plan is stale, provisional, or not traceable to its brief.`);

      const manifestPath = await containedExisting(fixturePath, "ztothez-design-generation.json");
      const manifest = generationManifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
      manifestOwnedFiles = manifest.files.length;
      implementationPassed =
        planPassed &&
        manifest.plan.id === retainedPlan.id &&
        manifest.plan.sourceDigest === retainedPlan.sourceBrief.digest &&
        manifest.plan.compilerVersion === retainedPlan.compilerVersion;
      for (const file of manifest.files) {
        try {
          const currentPath = await containedExisting(fixturePath, file.path);
          if (!(await stat(currentPath)).isFile()) throw new Error("not a file");
          if ((await digestFile(currentPath)) !== file.digest) adaptedManifestFiles.push(file.path);
        } catch {
          implementationPassed = false;
          systemDefects.push(`${pilot.id}: manifest-owned file is missing or escapes the fixture: ${file.path}.`);
        }
      }
      if (!implementationPassed && !systemDefects.some((finding) => finding.includes("manifest-owned"))) {
        systemDefects.push(`${pilot.id}: fixture generation identity does not match the retained ready plan.`);
      }
    } catch (error) {
      briefPassed = false;
      planPassed = false;
      implementationPassed = false;
      const message = error instanceof Error ? error.message : String(error);
      systemDefects.push(`${pilot.id}: brief, plan, or fixture validation failed: ${message}`);
    }

    if (pilot.interactionContract) {
      try {
        const interactionContractPath = await containedExisting(projectRoot, pilot.interactionContract);
        const contractReport = await validateProductContract(interactionContractPath, { projectRoot });
        interactionPassed = contractReport.passed;
        if (!interactionPassed) {
          systemDefects.push(`${pilot.id}: versioned interaction contract failed validation.`);
        }
      } catch (error) {
        interactionPassed = false;
        const message = error instanceof Error ? error.message : String(error);
        systemDefects.push(`${pilot.id}: interaction contract unavailable or invalid: ${message}`);
      }
    }

    const declaredProfiles = [...pilot.profiles, ...(pilot.interactionProfiles ?? [])];
    for (const profile of declaredProfiles) {
      try {
        const reportPath = await containedExisting(
          evidenceRoot,
          `${pilot.evidenceDirectory}/${profile}/runtime-report.json`,
        );
        const report = parsedRuntimeReportSchema.parse(JSON.parse(await readFile(reportPath, "utf8")));
        const viewportCoverage = options.config.requiredViewports.every((required) =>
          report.viewports.some((actual) => actual.width === required.width && actual.height === required.height),
        );
        const passed = report.passed && viewportCoverage && report.journeys.length > 0 && report.journeys.every((journey) => journey.passed);
        profileResults.push({ id: profile, passed, journeys: report.journeys.length, screenshots: report.screenshots.length });
        if (!passed) systemDefects.push(`${pilot.id}/${profile}: browser evidence is missing required viewport or journey coverage.`);
        for (const finding of report.findings) {
          productFindings.push(`${pilot.id}/${profile} ${finding.checkId}: ${finding.message}`);
        }
        for (const limitation of report.evidenceBoundary.verifierLimitations) {
          verifierLimitations.push(`${pilot.id}/${profile}: ${limitation}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        profileResults.push({ id: profile, passed: false, journeys: 0, screenshots: 0 });
        systemDefects.push(`${pilot.id}/${profile}: browser report unavailable or invalid: ${message}`);
      }
    }

    const verificationPassed = profileResults.length === declaredProfiles.length && profileResults.every((profile) => profile.passed);
    if (pilot.interactionProfiles) {
      interactionPassed = interactionPassed && pilot.interactionProfiles.every((profile) =>
        profileResults.some((result) => result.id === profile && result.passed),
      );
    }
    const passed = briefPassed && planPassed && implementationPassed && verificationPassed && interactionPassed && systemDefects.length === 0;
    products.push({
      id: pilot.id,
      domain: pilot.domain,
      sourcePolicy: pilot.sourcePolicy,
      stages: {
        brief: { passed: briefPassed, evidence: [pilot.brief] },
        plan: { passed: planPassed, evidence: [pilot.plan] },
        implementation: { passed: implementationPassed, evidence: [pilot.fixture, `${pilot.fixture}/ztothez-design-generation.json`] },
        verification: { passed: verificationPassed, evidence: declaredProfiles.map((profile) => `${pilot.evidenceDirectory}/${profile}/runtime-report.json`) },
        ...(pilot.interactionContract ? {
          interaction: {
            passed: interactionPassed,
            evidence: [
              pilot.interactionContract,
              ...(pilot.interactionProfiles ?? []).map((profile) => `${pilot.evidenceDirectory}/${profile}/runtime-report.json`),
            ],
          },
        } : {}),
      },
      profiles: profileResults,
      manifestOwnedFiles,
      adaptedManifestFiles,
      systemDefects,
      productFindings,
      verifierLimitations,
      sourcePolicyRestrictions,
      passed,
    });
  }

  const criteria = {
    threeProductDomains: new Set(products.map((product) => product.domain)).size >= 3,
    briefsReady: products.every((product) => product.stages.brief.passed),
    plansReadyAndTraceable: products.every((product) => product.stages.plan.passed),
    implementationsContained: products.every((product) => product.stages.implementation.passed),
    browserProfilesPassing: products.every((product) => product.stages.verification.passed),
    declaredInteractionContractsPassing: products.every((product) => product.stages.interaction?.passed ?? true),
    evidenceClassified: products.every((product) => product.sourcePolicyRestrictions.length > 0),
    humanEvidenceNotGenerated: true as const,
  };
  const passed = Object.values(criteria).every(Boolean) && products.every((product) => product.passed);
  const supportedClaims = passed
    ? [
        "Three repository-owned product-domain fixtures completed brief, plan, implementation, and browser verification stages.",
        "The retained browser reports passed the declared profiles and required responsive viewports.",
        "Protected product sources were not required as executable pilot targets.",
      ]
    : [];

  return pilotQualificationReportSchema.parse({
    version: "1.0",
    qualificationId: options.config.id,
    generatedAt: new Date().toISOString(),
    products,
    criteria,
    supportedClaims,
    humanEvidence: "not-generated",
    passed,
  });
}
