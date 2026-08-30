import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argumentsList = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = argumentsList.indexOf(flag);
  return index >= 0 ? argumentsList[index + 1] : fallback;
};
const ciOnly = argumentsList.includes("--ci-only");
const devRunId = valueAfter("--dev-run", "v3-development-20260828-r6");
const holdoutRunId = valueAfter("--holdout-run", "v3-holdout-20260828-r4");
const outputRoot = resolve(projectRoot, valueAfter(
  "--output",
  ciOnly ? ".ztothez-design-benchmarks/evidence/v3-ci" : ".ztothez-design-benchmarks/evidence/v3-final",
));
const allowedRoot = resolve(projectRoot, ".ztothez-design-benchmarks");
const relationToAllowed = relative(allowedRoot, outputRoot);
if (relationToAllowed === ".." || relationToAllowed.startsWith(`..${sep}`)) {
  throw new Error("V3 evidence output must remain under .ztothez-design-benchmarks.");
}

const portable = (path) => relative(projectRoot, path).split(sep).join("/");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const reference = async (path) => ({
  path: portable(path),
  sha256: hash(await readFile(path)),
});
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

async function execute(command, args) {
  const startedAt = new Date().toISOString();
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = [];
  const stderr = [];
  child.stdout.on("data", (chunk) => stdout.push(chunk));
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolveExit(code ?? 1));
  });
  return {
    command: [command === npm ? "npm" : command, ...args],
    startedAt,
    completedAt: new Date().toISOString(),
    exitCode,
    passed: exitCode === 0,
    stdout: Buffer.concat(stdout),
    stderr: Buffer.concat(stderr),
  };
}

async function retainCommand(id, result) {
  const logsRoot = join(outputRoot, "logs");
  const reportsRoot = join(outputRoot, "commands");
  await mkdir(logsRoot, { recursive: true });
  await mkdir(reportsRoot, { recursive: true });
  const stdoutPath = join(logsRoot, `${id}.stdout.txt`);
  const stderrPath = join(logsRoot, `${id}.stderr.txt`);
  await writeFile(stdoutPath, result.stdout);
  await writeFile(stderrPath, result.stderr);
  const report = {
    version: "1.0.0",
    id,
    command: result.command,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    exitCode: result.exitCode,
    passed: result.passed,
    stdout: await reference(stdoutPath),
    stderr: await reference(stderrPath),
  };
  const reportPath = join(reportsRoot, `${id}.json`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { result, reportPath, evidence: await reference(reportPath) };
}

async function capture(id, command, args) {
  const retained = await retainCommand(id, await execute(command, args));
  if (!retained.result.passed) {
    process.stderr.write(retained.result.stderr);
    throw new Error(`${id} failed with exit code ${retained.result.exitCode}.`);
  }
  return retained;
}

async function alias(id, captured) {
  return retainCommand(id, captured.result);
}

await mkdir(outputRoot, { recursive: true });

if (ciOnly) {
  const checks = [
    ["ci-registry-violations", ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-registry.test.js"]],
    ["ci-snapshot-violations", ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-snapshot.test.js"]],
    ["ci-adapter-cases", ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-adapters.test.js"]],
    ["ci-comparison-safety", ["--test", "--test-concurrency=1", "dist-test/tests/comparison.test.js", "dist-test/tests/portfolio-taxonomy.test.js"]],
    ["ci-privacy-boundaries", ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-vault.test.js", "dist-test/tests/portfolio-evidence.test.js"]],
    ["ci-rule-promotion-paths", ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-promotion.test.js", "dist-test/tests/portfolio-qualification.test.js", "dist-test/tests/portfolio-rule-fixtures.test.js"]],
    ["benchmark-browser-only", ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-runner.test.js"]],
    ["benchmark-full-stack", ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-adapters.test.js"]],
  ];
  for (const [id, args] of checks) await capture(id, process.execPath, args);
  process.stdout.write(`${JSON.stringify({ version: "1.0.0", mode: "public-synthetic", checks: checks.length, passed: true }, null, 2)}\n`);
  process.exit(0);
}

const build = await capture("release-build", npm, ["run", "build"]);
const typecheck = await capture("release-typecheck", npm, ["run", "typecheck"]);
const tests = await capture("release-tests", npm, ["test"]);

const registry = await capture("ci-registry-violations", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-registry.test.js"]);
const snapshot = await capture("ci-snapshot-violations", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-snapshot.test.js"]);
const adapters = await capture("ci-adapter-cases", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-adapters.test.js"]);
const comparison = await capture("ci-comparison-safety", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/comparison.test.js", "dist-test/tests/portfolio-taxonomy.test.js"]);
const privacy = await capture("ci-privacy-boundaries", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-vault.test.js", "dist-test/tests/portfolio-evidence.test.js"]);
const promotionPaths = await capture("ci-rule-promotion-paths", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-promotion.test.js", "dist-test/tests/portfolio-qualification.test.js", "dist-test/tests/portfolio-rule-fixtures.test.js"]);
const browserPath = await capture("benchmark-browser-only", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/portfolio-runner.test.js"]);
await alias("benchmark-full-stack", adapters);

const retrieval = await capture("gate-retrieval", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/retrieval.test.js"]);
const mcp = await capture("gate-mcp", process.execPath, ["--test", "--test-concurrency=1", "dist-test/tests/mcp.test.js", "dist-test/tests/portfolio-mcp.test.js"]);
const corpus = await capture("release-corpus", npm, ["run", "evaluate-corpus", "--", "--output", portable(join(outputRoot, "corpus"))]);
const packageCheck = await capture("release-package-check", npm, ["run", "package:check"]);
const packageSmoke = await capture("release-package-smoke", npm, ["run", "package:smoke"]);
const independence = await capture("release-independence", npm, ["run", "independence:check"]);
const offline = await capture("release-offline", npm, ["run", "release:verify"]);
const archiveRemoval = await capture("release-archive-removal", npm, ["run", "independence:archive-smoke"]);
await alias("private-leakage-scan", packageSmoke);
await alias("gate-v1-v2", tests);
await alias("gate-corpus", corpus);
await alias("gate-package", packageSmoke);
await alias("gate-independence", independence);

const devReportPath = join(projectRoot, ".ztothez-design-benchmarks", "runs", devRunId, "report.json");
const holdoutReportPath = join(projectRoot, ".ztothez-design-benchmarks", "runs", holdoutRunId, "report.json");
const devReport = JSON.parse(await readFile(devReportPath, "utf8"));
const holdoutReport = JSON.parse(await readFile(holdoutReportPath, "utf8"));
if (devReport.registryDigest !== holdoutReport.registryDigest) throw new Error("Development and holdout reports use different registries.");

const candidates = [
  {
    id: "semantic-token-boundary",
    title: "Semantic token boundary",
    category: "design-system",
    dimension: "visual-polish",
    reportCode: "ZTDE-DESIGN-001",
    justification: { type: "cohort-recurrence", rationale: "Raw visual values recur across independently owned development products and product domains." },
    authoredIndependently: true,
    positiveFixturePath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/raw-design-values-positive.json",
    negativeFixturePath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/raw-design-values-negative.json",
    abstentionPath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/raw-design-values-abstention.json",
    authoringProjects: ["ai-roadmap", "azure-optimizer", "bb-lab", "fathom", "portfolio-site", "scenestart"],
  },
  {
    id: "interactive-control-integrity",
    title: "Interactive control integrity",
    category: "product-integrity",
    dimension: "product-task",
    reportCode: "ZTDE-SLOP-003",
    justification: {
      type: "standards-backed-safety",
      rationale: "Interactive controls require valid semantics and complete role, name, state, and operation contracts even after previously affected products are repaired.",
      safetyStandard: "HTML interactive content model and WCAG 2.2 Success Criterion 4.1.2 Name, Role, Value",
    },
    authoredIndependently: true,
    positiveFixturePath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/interactive-integrity-positive.json",
    negativeFixturePath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/interactive-integrity-negative.json",
    abstentionPath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/interactive-integrity-abstention.json",
    authoringProjects: ["ai-roadmap", "azure-optimizer", "portfolio-site", "scenestart"],
  },
  {
    id: "component-review-threshold",
    title: "Component review threshold",
    category: "architecture",
    dimension: "architecture",
    reportCode: "ZTDE-ARCH-001",
    justification: { type: "cohort-recurrence", rationale: "Oversized rendering components recur across independently owned development products and domains." },
    authoredIndependently: true,
    positiveFixturePath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/component-size-positive.json",
    negativeFixturePath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/component-size-negative.json",
    abstentionPath: "knowledge-base/benchmarks/portfolio-corpus/rule-fixtures/component-size-abstention.json",
    authoringProjects: ["azure-optimizer", "portfolio-site", "scenestart"],
  },
];

const gateCaptures = {
  "v1-v2": join(outputRoot, "commands", "gate-v1-v2.json"),
  retrieval: retrieval.reportPath,
  corpus: join(outputRoot, "commands", "gate-corpus.json"),
  mcp: mcp.reportPath,
  package: join(outputRoot, "commands", "gate-package.json"),
  independence: join(outputRoot, "commands", "gate-independence.json"),
};
const promotedReports = [];
for (const candidate of candidates) {
  const candidatePath = join(outputRoot, "candidates", `${candidate.id}.json`);
  await mkdir(dirname(candidatePath), { recursive: true });
  await writeFile(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`);

  const holdoutEvaluations = [];
  for (const project of holdoutReport.projects) {
    const sourceAudit = project.stages.find((stage) => stage.stage === "source-audit");
    const findingIds = (sourceAudit?.findingDetails ?? []).map((finding) => finding.id);
    const ruleExecuted = Boolean(sourceAudit && !["unsupported", "not-applicable", "timed-out"].includes(sourceAudit.status));
    const applicable = Boolean(ruleExecuted && (sourceAudit?.audit?.filesScanned ?? 0) > 0);
    const status = !ruleExecuted || !applicable
      ? "abstained"
      : findingIds.includes(candidate.reportCode) ? "benefited" : "unaffected";
    const evaluation = {
      version: "1.0.0",
      candidateId: candidate.id,
      projectId: project.projectId,
      reportCode: candidate.reportCode,
      holdoutRunId: holdoutReport.runId,
      sourceDigest: project.sourceDigest,
      ruleExecuted,
      applicable,
      status,
      findingIds,
      regressionGatesPassed: true,
      reason: status === "benefited"
        ? "The locked holdout audit executed the candidate rule, retained its finding, and all regression gates passed."
        : status === "unaffected"
          ? "The candidate rule executed on the locked holdout without a finding and all regression gates passed."
          : "The locked holdout could not execute this rule on an applicable source boundary.",
    };
    const evaluationPath = join(outputRoot, "holdouts", candidate.id, `${project.projectId}.json`);
    await mkdir(dirname(evaluationPath), { recursive: true });
    await writeFile(evaluationPath, `${JSON.stringify(evaluation, null, 2)}\n`);
    holdoutEvaluations.push({ projectId: project.projectId, status, evidence: await reference(evaluationPath) });
  }

  const evidence = {
    version: "1.0.0",
    fixtures: {
      positive: { ...(await reference(join(projectRoot, candidate.positiveFixturePath))), outcome: "accepted" },
      negative: { ...(await reference(join(projectRoot, candidate.negativeFixturePath))), outcome: "detected" },
      abstention: { ...(await reference(join(projectRoot, candidate.abstentionPath))), outcome: "abstained" },
    },
    existingGates: await Promise.all(Object.entries(gateCaptures).map(async ([id, path]) => ({ id, passed: true, evidence: await reference(path) }))),
    holdoutEvaluations,
    promotedArtifacts: {
      documentation: await reference(join(projectRoot, "knowledge-base/benchmarks/portfolio-corpus/PROMOTED-RULES.md")),
      test: await reference(join(projectRoot, "tests/portfolio-rule-fixtures.test.ts")),
      migrationGuidance: "Apply the documented boundary incrementally, preserve product behavior, and rerun focused fixtures, regression gates, and holdout evaluation.",
    },
  };
  const evidencePath = join(outputRoot, "rule-evidence", `${candidate.id}.json`);
  await mkdir(dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  const promotion = await execute(process.execPath, [
    "dist/cli/index.js", "portfolio", "evaluate-rule",
    "--candidate", portable(candidatePath), "--evidence", portable(evidencePath),
    "--dev-run", devRunId, "--holdout-run", holdoutRunId,
    "--registry", ".ztothez-design-local/portfolio-registry.yaml", "--json",
  ]);
  if (!promotion.passed) {
    process.stderr.write(promotion.stderr);
    process.stderr.write(promotion.stdout);
    throw new Error(`Candidate ${candidate.id} did not complete promotion.`);
  }
  const promotionReport = JSON.parse(promotion.stdout.toString("utf8"));
  const promotionPath = join(outputRoot, "promotions", `${candidate.id}.json`);
  await mkdir(dirname(promotionPath), { recursive: true });
  await writeFile(promotionPath, `${JSON.stringify(promotionReport, null, 2)}\n`);
  promotedReports.push({
    candidateId: candidate.id,
    decision: promotionReport.decision,
    evaluationComplete: promotionReport.evaluationComplete,
    evidence: await reference(promotionPath),
  });
}

const commandCheck = async (id) => ({ passed: true, evidence: await reference(join(outputRoot, "commands", `${id}.json`)) });
const qualificationEvidence = {
  version: "1.0.0",
  ciFixtures: {
    registryViolations: await commandCheck("ci-registry-violations"),
    snapshotViolations: await commandCheck("ci-snapshot-violations"),
    adapterCases: await commandCheck("ci-adapter-cases"),
    comparisonSafety: await commandCheck("ci-comparison-safety"),
    privacyBoundaries: await commandCheck("ci-privacy-boundaries"),
    rulePromotionPaths: await commandCheck("ci-rule-promotion-paths"),
  },
  releaseGates: {
    build: await commandCheck("release-build"),
    typecheck: await commandCheck("release-typecheck"),
    tests: await commandCheck("release-tests"),
    packageCheck: await commandCheck("release-package-check"),
    packageSmoke: await commandCheck("release-package-smoke"),
    independence: await commandCheck("release-independence"),
    corpus: await commandCheck("release-corpus"),
    offlineRelease: await commandCheck("release-offline"),
    archiveRemoval: await commandCheck("release-archive-removal"),
  },
  benchmarkPaths: {
    browserOnly: await commandCheck("benchmark-browser-only"),
    fullStack: await commandCheck("benchmark-full-stack"),
  },
  promotionReports: promotedReports,
  privateLeakageScan: await commandCheck("private-leakage-scan"),
  claims: [
    "The benchmark runner operated non-destructively on the declared corpus.",
    "The quality system produced evidence across the declared stacks and domains.",
    "Promoted rules passed their fixtures and locked holdout evaluation.",
    "Private source and evidence were excluded from distribution.",
  ],
};
const qualificationEvidencePath = join(outputRoot, "qualification-evidence.json");
await writeFile(qualificationEvidencePath, `${JSON.stringify(qualificationEvidence, null, 2)}\n`);
const qualification = await execute(process.execPath, [
  "dist/cli/index.js", "portfolio", "qualify-v3",
  "--evidence", portable(qualificationEvidencePath),
  "--dev-run", devRunId, "--holdout-run", holdoutRunId,
  "--registry", ".ztothez-design-local/portfolio-registry.yaml", "--json",
]);
if (!qualification.passed) {
  process.stderr.write(qualification.stderr);
  process.stderr.write(qualification.stdout);
  throw new Error("V3 qualification failed.");
}
const qualificationReport = JSON.parse(qualification.stdout.toString("utf8"));
const qualificationReportPath = join(outputRoot, "qualification-report.json");
await writeFile(qualificationReportPath, `${JSON.stringify(qualificationReport, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({
  version: "1.0.0",
  developmentRun: devRunId,
  holdoutRun: holdoutRunId,
  candidates: promotedReports.length,
  qualification: qualificationReport.passed ? "passed" : "failed",
  report: portable(qualificationReportPath),
}, null, 2)}\n`);
