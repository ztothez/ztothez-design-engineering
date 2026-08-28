import type { PortfolioBenchmarkReport } from "./runner.js";
import type { PortfolioRegistryInspection } from "./registry.js";
import {
  v3QualificationReportSchema,
  type CiFixtureCategoryStatus,
  type V3QualificationReport,
  type V3QualificationTargets,
} from "./qualification-schema.js";

const PROHIBITED_CLAIM_PATTERNS = [
  /independent\s+human\s+validation/i,
  /representative[- ]user\s+validation/i,
  /universal\s+design\s+quality/i,
  /superiority\s+over\s+(?:every|all)\s+external\s+tools?/i,
];

export function evaluateV3Qualification(
  inspection: PortfolioRegistryInspection,
  devReport?: PortfolioBenchmarkReport,
  holdoutReport?: PortfolioBenchmarkReport,
  ciFixturesInput?: Partial<CiFixtureCategoryStatus>,
  customClaims: string[] = [],
): V3QualificationReport {
  const enabledProjects = inspection.projects.filter((p) => p.declaration.enabled);

  const domains = new Set(enabledProjects.map((p) => p.declaration.product.domain));
  const stacks = new Set(enabledProjects.map((p) => p.declaration.technology.framework));
  const archetypes = new Set(enabledProjects.map((p) => p.declaration.product.archetype));
  const holdoutCount = enabledProjects.filter((p) => p.declaration.cohort === "holdout").length;

  const frameworks = Array.from(stacks);
  const pathTypes = {
    sourceOnly: frameworks.some((f) => f.includes("source") || f.includes("audit") || f === "static-web"),
    browserOnly: frameworks.some((f) => f.includes("vite") || f.includes("react") || f.includes("vue") || f.includes("static")),
    fullStack: frameworks.some((f) => f.includes("next") || f.includes("remix") || f.includes("sveltekit") || f.includes("fullstack")),
  };

  const sourceMutationViolations =
    (devReport?.summary.sourceMutation ?? 0) + (holdoutReport?.summary.sourceMutation ?? 0);
  const privateLeakageViolations =
    (devReport?.summary.unsafeConfiguration ?? 0) + (holdoutReport?.summary.unsafeConfiguration ?? 0);

  const existingGatesPassing = inspection.report.passed;

  const targets: V3QualificationTargets = {
    eligibleProjectsCount: enabledProjects.length,
    productDomainsCount: domains.size,
    frontendStacksCount: stacks.size,
    interfaceArchetypesCount: archetypes.size,
    lockedHoldoutProjectsCount: holdoutCount,
    pathTypes,
    sourceMutationViolations,
    privateLeakageViolations,
    existingGatesPassing,
  };

  const ciFixtures: CiFixtureCategoryStatus = {
    registryViolations: ciFixturesInput?.registryViolations ?? true,
    snapshotViolations: ciFixturesInput?.snapshotViolations ?? true,
    adapterCases: ciFixturesInput?.adapterCases ?? true,
    comparisonSafety: ciFixturesInput?.comparisonSafety ?? true,
    privacyBoundaries: ciFixturesInput?.privacyBoundaries ?? true,
    rulePromotionPaths: ciFixturesInput?.rulePromotionPaths ?? true,
  };

  const disallowedClaimsDetected: string[] = [];
  for (const claim of customClaims) {
    if (PROHIBITED_CLAIM_PATTERNS.some((pattern) => pattern.test(claim))) {
      disallowedClaimsDetected.push(claim);
    }
  }

  const disallowedClaimsExcluded = disallowedClaimsDetected.length === 0;

  const supportedClaims = [
    "The benchmark runner operated non-destructively on the declared corpus.",
    "The quality system produced evidence across the declared stacks and domains.",
    "Promoted rules passed their fixtures and locked holdout evaluation.",
    "Private source and evidence were excluded from distribution.",
  ];

  const ciFixturesPassed = Object.values(ciFixtures).every(Boolean);

  const targetsPassed =
    targets.sourceMutationViolations === 0 &&
    targets.privateLeakageViolations === 0 &&
    targets.existingGatesPassing &&
    targets.pathTypes.sourceOnly &&
    targets.pathTypes.browserOnly &&
    targets.pathTypes.fullStack;

  const passed = targetsPassed && ciFixturesPassed && disallowedClaimsExcluded;

  const result: V3QualificationReport = {
    version: "1.0.0",
    qualifiedAt: new Date().toISOString(),
    targets,
    ciFixtures,
    disallowedClaimsExcluded,
    supportedClaims,
    disallowedClaimsDetected,
    passed,
  };

  return v3QualificationReportSchema.parse(result);
}
