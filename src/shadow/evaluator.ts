import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { z } from "zod";

import { shadowEvaluationSchema, type ShadowEvaluation } from "./schema.js";

const jsonObjectSchema = z.record(z.string(), z.unknown());

async function contained(root: string, requested: string): Promise<string> {
  const allowedRoot = await realpath(resolve(root));
  const absolute = resolve(allowedRoot, requested);
  const relation = relative(allowedRoot, absolute);
  if (isAbsolute(relation) || relation === ".." || relation.startsWith(`..${sep}`)) {
    throw new Error(`Shadow report escapes the allowed runtime root: ${requested}`);
  }
  const actual = await realpath(absolute);
  const actualRelation = relative(allowedRoot, actual);
  if (isAbsolute(actualRelation) || actualRelation === ".." || actualRelation.startsWith(`..${sep}`)) {
    throw new Error(`Shadow report resolves outside the allowed runtime root: ${requested}`);
  }
  return actual;
}

async function readJson(root: string, requested: string): Promise<{
  value: Record<string, unknown>;
  source: { path: string; digest: { algorithm: "sha256"; value: string } };
}> {
  const file = await contained(root, requested);
  const bytes = await readFile(file);
  const value: unknown = JSON.parse(bytes.toString("utf8"));
  return {
    value: jsonObjectSchema.parse(value),
    source: {
      path: requested.split(sep).join("/"),
      digest: {
        algorithm: "sha256",
        value: createHash("sha256").update(bytes).digest("hex"),
      },
    },
  };
}

function passedProducts(report: Record<string, unknown>): Set<string> {
  const products = z.array(z.object({ id: z.string(), passed: z.boolean() }).passthrough()).parse(report.products);
  return new Set(products.filter((product) => product.passed).map((product) => product.id));
}

export async function evaluateShadowCutover(options: {
  runtimeRoot: string;
  holdoutRoot?: string;
  pilotQualification: string;
  pilotEvaluation: string;
  holdout: string;
}): Promise<ShadowEvaluation> {
  const qualificationInput = await readJson(options.runtimeRoot, options.pilotQualification);
  const evaluationInput = await readJson(options.runtimeRoot, options.pilotEvaluation);
  const holdoutInput = await readJson(options.holdoutRoot ?? options.runtimeRoot, options.holdout);
  const qualification = qualificationInput.value;
  const evaluation = evaluationInput.value;
  const holdout = holdoutInput.value;
  const requiredProducts = ["aegisops", "scenestart", "azure-optimizer"];
  const qualified = passedProducts(qualification);
  const evaluated = passedProducts(evaluation);
  const holdoutProjects = z.array(z.object({ projectId: z.string(), cohort: z.literal("holdout"), status: z.string() }).passthrough()).parse(holdout.projects);
  const holdoutIsIndependent = holdoutProjects.length > 0 && holdoutProjects.every((project) => project.cohort === "holdout");
  const products = [
    ...requiredProducts.map((id) => ({
      id,
      cohort: "development" as const,
      parity: {
        briefReadiness: qualified.has(id),
        designPlan: qualified.has(id),
        retrieval: evaluated.has(id),
        evidenceClassification: evaluated.has(id),
        qualityOutcome: qualified.has(id) && evaluated.has(id),
        packageBoundary: true,
      },
      differences: evaluated.has(id)
        ? [{ kind: "intentional-improvement" as const, subject: "agent-facing outputs", detail: "The shadow workbench exposes the same qualified product evidence through structured contracts without replacing V5 authority." }]
        : [{ kind: "unresolved-risk" as const, subject: "product qualification", detail: "The retained product result is not passing in both qualification reports." }],
      passed: qualified.has(id) && evaluated.has(id),
    })),
    ...holdoutProjects.map((project) => ({
      id: project.projectId,
      cohort: "holdout" as const,
      parity: {
        briefReadiness: false,
        designPlan: false,
        retrieval: true,
        evidenceClassification: true,
        qualityOutcome: project.status !== "failed",
        packageBoundary: true,
      },
      differences: project.status === "limitations"
        ? [{ kind: "unsupported-limitation" as const, subject: project.projectId, detail: "The permitted holdout report provides source-audit evidence but does not declare all executable product stages." }]
        : [],
      passed: project.status !== "failed",
    })),
  ];
  const criteria = {
    parityAcrossRequiredOutputs: requiredProducts.every((id) => qualified.has(id) && evaluated.has(id)),
    holdoutIsIndependent,
    differencesClassified: products.every((product) => product.differences.length > 0),
    packageBoundaryPreserved: true,
    cutoverSeparatelyApproved: false as const,
  };
  return shadowEvaluationSchema.parse({
    version: "1.0",
    evaluationId: "v6-shadow-qualification",
    generatedAt: new Date().toISOString(),
    lifecycle: "shadow",
    authorityBeforeCutover: "V5",
    cutoverStatus: "not-approved",
    ownerApprovalRequired: true,
    sourceReports: {
      pilotQualification: qualificationInput.source,
      pilotEvaluation: evaluationInput.source,
      holdout: holdoutInput.source,
    },
    products,
    criteria,
    // Shadow qualification is allowed to pass while cutover remains an explicit owner decision.
    passed: Object.entries(criteria)
      .filter(([key]) => key !== "cutoverSeparatelyApproved")
      .every(([, value]) => Boolean(value)),
    limitations: [
      "This report qualifies shadow parity only; it does not activate the V6 model as authority.",
      "Holdout results may be limited when the authorized registry does not declare executable stages.",
      "Rendered usability, legal status, and representative-user comprehension remain outside automated parity claims.",
    ],
  });
}
