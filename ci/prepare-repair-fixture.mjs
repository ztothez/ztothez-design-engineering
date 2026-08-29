import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

import { stringify } from "yaml";

import { compileDesignPlan } from "../dist/src/design-plan/compiler.js";
import { generateReactTypescriptFixture } from "../dist/src/generation/react-typescript.js";
import { loadProductDesignBrief } from "../dist/src/product-brief/loader.js";

function parseArguments(argumentsList) {
  let brief = "";
  let projectRoot = process.cwd();
  let root = "";
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--brief" && next) {
      brief = resolve(next);
      index += 1;
    } else if (argument === "--project-root" && next) {
      projectRoot = resolve(next);
      index += 1;
    } else if (argument === "--root" && next) {
      root = resolve(next);
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  if (!brief) throw new Error("--brief is required");
  if (!root) throw new Error("--root is required");
  if (!basename(root).startsWith(".ztothez-design-repair-fixture")) {
    throw new Error("Repair fixture root basename must start with .ztothez-design-repair-fixture");
  }
  return { brief, projectRoot, root };
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

const options = parseArguments(process.argv.slice(2));
try {
  await lstat(options.root);
  throw new Error("Repair fixture root must not already exist");
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
}

const generationRoot = join(options.root, "generated");
const protectedRoot = join(options.root, "protected");
const target = join(generationRoot, "fixture");
const registry = join(options.root, "portfolio-registry.json");
const requestPath = join(options.root, "repair-request.yaml");
const contractPath = join(options.root, "repair-product-contract.yaml");
const journeyPath = join(options.root, "repair-journeys.json");
await Promise.all([
  mkdir(generationRoot, { recursive: true }),
  mkdir(protectedRoot, { recursive: true }),
]);
await writeFile(registry, `${JSON.stringify({
  version: "1.0",
  id: "ci-v4-repair-registry",
  description: "Public synthetic protected root for the V4 bounded repair fixture.",
  roots: [{ id: "protected", class: "studio-portfolio", path: protectedRoot }],
  projects: [],
}, null, 2)}\n`, "utf8");

const brief = structuredClone(await loadProductDesignBrief(options.brief));
brief.downstreamContracts = [
  { kind: "product-task", status: "exists", path: "knowledge-base/benchmarks/aegisops/product-contract.yaml" },
  { kind: "interface-trust", status: "exists", path: "knowledge-base/design-intelligence/interface-trust.template.yaml" },
  { kind: "information-design", status: "exists", path: "knowledge-base/design-intelligence/information-design.template.yaml" },
  { kind: "design-deliverable", status: "exists", path: "knowledge-base/design-intelligence/design-deliverable.template.yaml" },
];
const plan = await compileDesignPlan(brief, {
  briefSourcePath: options.brief,
  projectRoot: options.projectRoot,
});
if (!plan.implementationReady || plan.status !== "ready") {
  throw new Error(`Synthetic repair fixture plan is not implementation-ready: ${plan.blockers.join("; ")}`);
}
await writeFile(join(options.root, "ready-design-plan.json"), `${JSON.stringify(plan, null, 2)}\n`, "utf8");
await generateReactTypescriptFixture(plan, {
  generationRoot,
  outputDirectory: target,
  portfolioRegistryPath: registry,
});

await writeFile(contractPath, stringify({
  version: "1.2",
  id: "ci-repair-fixture",
  name: "CI bounded repair fixture",
  status: "benchmark",
  purpose: "Verify one generated decision workspace before and after an exact bounded source repair.",
  authority: {
    behavior: "The compiled design plan defines the generated fixture behavior.",
    visual: "The generated semantic tokens and composition markers define the synthetic visual baseline.",
    precedence: [
      {
        path: "ready-design-plan.json",
        role: "Compiled source plan for this disposable fixture.",
        authority: "primary",
      },
    ],
  },
  actors: [
    {
      id: "operator",
      name: "Fixture operator",
      goals: ["Review the bounded decision and record it from the generated workspace."],
      responsibilities: ["Treat all displayed records as disclosed synthetic evidence."],
    },
  ],
  outputs: [
    {
      id: "recorded-decision",
      name: "Recorded synthetic decision",
      sourceOfTruth: "Reducer-owned local fixture state.",
      requiredEvidence: ["Visible selected record", "Visible demonstration origin", "Recorded state"],
    },
  ],
  modes: [
    {
      id: "demo",
      name: "Demonstration",
      purpose: "Exercise generated structure without implying a live connector.",
      input: "Bundled synthetic priority record.",
      outputs: ["recorded-decision"],
    },
  ],
  stateMachines: [
    {
      id: "decision",
      initial: "review",
      states: [
        {
          id: "review",
          category: "idle",
          userVisible: true,
          requirement: "The synthetic record, origin, and bounded action are visible.",
        },
        {
          id: "recorded",
          category: "success",
          userVisible: true,
          requirement: "The interface confirms that the synthetic decision was recorded.",
        },
        {
          id: "unavailable",
          category: "error",
          userVisible: true,
          requirement: "Unavailable sources retain a visible recovery path.",
        },
      ],
      transitions: [
        { from: "review", to: "recorded", trigger: "Record decision" },
        { from: "review", to: "unavailable", trigger: "Select unavailable source" },
        { from: "unavailable", to: "review", trigger: "Use disclosed demo fallback" },
      ],
    },
  ],
  metrics: [
    {
      id: "decision-state",
      name: "Decision state",
      definition: "Current reducer-owned state of the bounded synthetic decision.",
      sourceOfTruth: "Local task reducer.",
      format: "status",
      evidenceRequired: true,
    },
  ],
  constraints: {
    outOfScope: ["Production data access or automated production remediation."],
    prohibitedClaims: ["Live, imported, or cached evidence without a configured source."],
    mockData: {
      allowedEnvironments: ["test", "demo"],
      mustBeLabeled: true,
      prohibitedInProduction: true,
      fallbackDisclosure: "Demonstration data remains visible beside the record and action.",
    },
  },
  acceptanceCriteria: [
    {
      id: "responsive-integrity",
      title: "Generated task remains operable and readable",
      severity: "blocker",
      requirement: "The disclosed synthetic task, result, and action pass contract, runtime, screenshot, and accessibility checks at every declared viewport.",
      evidence: ["contract", "runtime", "screenshot", "accessibility"],
      appliesToModes: ["demo"],
    },
  ],
  verification: {
    journeyFile: "repair-journeys.json",
    viewports: [
      { name: "mobile-375", width: 375, height: 812 },
      { name: "tablet-768", width: 768, height: 1024 },
      { name: "desktop-1024", width: 1024, height: 768 },
      { name: "wide-1440", width: 1440, height: 900 },
    ],
    bindings: [
      {
        profile: "generated-responsive",
        journey: "generated-overview",
        actor: "operator",
        mode: "demo",
        acceptanceCriteria: ["responsive-integrity"],
      },
    ],
  },
  benchmark: {
    archetype: "utility",
    interface: "browser",
    qualityDimensions: [
      { id: "truthful-disclosure", status: "required", reason: "The fixture must retain its visible demonstration boundary." },
      { id: "information-design", status: "required", reason: "The fixture contains one bounded decision rather than an operational metric surface." },
      { id: "visual-system", status: "required", reason: "The generated semantic composition is checked at every declared viewport." },
      { id: "accessibility", status: "required", reason: "The primary and recovery actions remain browser-operable." },
      { id: "responsive-structure", status: "required", reason: "The fixture is checked from mobile through wide desktop." },
      { id: "state-integrity", status: "required", reason: "The task and unavailable-source recovery states are reducer-owned and visible." },
      { id: "maintainability", status: "required", reason: "The repair gate preserves the manifest-owned generation boundary." },
    ],
    tasks: [
      {
        id: "record-generated-decision",
        primary: true,
        actor: "operator",
        mode: "demo",
        intent: "Record the disclosed synthetic decision and recover without losing the selected record when a source is unavailable.",
        start: { stateMachine: "decision", state: "review", observable: "The selected record and bounded action are visible." },
        success: { stateMachine: "decision", state: "recorded", observable: "The fixture confirms the recorded decision.", evidence: ["contract", "runtime"] },
        recovery: {
          required: true,
          failure: { stateMachine: "decision", state: "unavailable", observable: "The unavailable source remains visible with a recovery path." },
          observable: "The selected record remains visible while the operator can retry or choose the disclosed fallback.",
        },
        journey: { profile: "generated-responsive", journey: "generated-overview" },
        browser: { route: "/", narrowViewport: "mobile-375" },
      },
    ],
    evidencePolicy: { missingEvidence: "unverified", failedBehavior: "failed", unsupportedCapability: "limitation" },
    comparison: { taskContractId: "ci-generated-decision", crossContractRanking: false },
  },
}), "utf8");
await writeFile(journeyPath, `${JSON.stringify({
  version: "1.1",
  contract: "ci-repair-fixture",
  profiles: [
    {
      id: "generated-responsive",
      name: "Generated responsive decision path",
      environment: ["The disposable generated Vite preview is running locally."],
      journeys: [
        {
          id: "generated-overview",
          name: "generated-overview",
          interaction: {
            task: "record-generated-decision",
            phases: ["primary", "recovery"],
            applicableStates: ["disconnected", "error"],
          },
          steps: [
            { action: "expectVisible", selector: "main[data-ztothez-design-composition=\"1.0\"]" },
            { action: "checkpoint", checkpoint: "start" },
            { action: "expectText", selector: "body", value: plan.product },
            { action: "expectText", selector: "body", value: "Demonstration data" },
            { action: "expectVisible", selector: "button[data-ztothez-design-primary-action]" },
            { action: "click", selector: "button[data-ztothez-design-primary-action]" },
            { action: "expectText", selector: "body", value: "Decision recorded" },
            { action: "checkpoint", checkpoint: "success" },
            { action: "click", selector: "button:has-text(\"live\")" },
            { action: "click", selector: "button:has-text(\"Retry source\")" },
            { action: "expectText", selector: ".task-message", value: "Connection remains unavailable" },
            { action: "checkpoint", checkpoint: "failure" },
            { action: "expectText", selector: ".finding", value: "priority-record-01" },
            { action: "checkpoint", checkpoint: "preserved-state" },
            { action: "expectText", selector: ".status", value: "error" },
            { action: "checkpoint", checkpoint: "error" },
            { action: "expectText", selector: ".source-facts", value: "unavailable" },
            { action: "checkpoint", checkpoint: "disconnected" },
          ],
        },
      ],
    },
  ],
}, null, 2)}\n`, "utf8");

const stylesheetPath = join(target, "src", "styles", "app.css");
const rawBlock = `.ci-unsafe-rule {
  color: #111111;
  background: #eeeeee;
  border-color: #777777;
}
`;
const stylesheet = await readFile(stylesheetPath, "utf8");
const mutatedStylesheet = `${stylesheet}\n${rawBlock}`;
await writeFile(stylesheetPath, mutatedStylesheet, "utf8");
await writeFile(requestPath, stringify({
  version: "1.0",
  id: "ci-v4-responsive-token-repair",
  target: { adapter: "react-typescript-vite", manifest: "ztothez-design-generation.json" },
  findings: [
    {
      id: "raw-responsive-values",
      source: "architecture",
      checkId: "ZTDE-DESIGN-001",
      file: "src/styles/app.css",
      messageIncludes: "raw visual values",
      acceptanceCriterion: "responsive-integrity",
      expectedEvidence: [
        "contract-validation",
        "static-audit",
        "browser-runtime",
        "responsive-screenshots",
      ],
    },
  ],
  attempts: [
    {
      id: "remove-unsupported-values",
      operations: [
        {
          id: "remove-ci-unsafe-rule",
          findingRef: "raw-responsive-values",
          kind: "replace-exact",
          file: "src/styles/app.css",
          expectedFileDigest: digest(mutatedStylesheet),
          before: rawBlock,
          after: "",
          expectedOccurrences: 1,
        },
      ],
    },
  ],
  stopping: {
    maxAttempts: 1,
    resolved: "all-referenced-findings-absent-and-quality-gate-passed",
    repeatedFinding: "stop-unresolved-and-restore",
    preconditionFailure: "stop-without-write",
    verificationFailure: "stop-unresolved-and-restore",
  },
}), "utf8");

process.stdout.write(`${JSON.stringify({
  root: relative(process.cwd(), options.root),
  generationRoot: relative(process.cwd(), generationRoot),
  target: relative(process.cwd(), target),
  registry: relative(process.cwd(), registry),
  request: relative(process.cwd(), requestPath),
  contract: relative(process.cwd(), contractPath),
  journeys: relative(process.cwd(), journeyPath),
  plan: relative(process.cwd(), join(options.root, "ready-design-plan.json")),
}, null, 2)}\n`);
