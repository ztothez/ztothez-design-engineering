import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argumentsList = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = argumentsList.indexOf(flag);
  return index >= 0 ? argumentsList[index + 1] : fallback;
};
const outputRoot = resolve(projectRoot, valueAfter(
  "--output",
  ".ztothez-design-runtime/v4-qualification",
));
const pilotEvidenceRoot = resolve(projectRoot, valueAfter(
  "--pilot-evidence-root",
  ".ztothez-design-runtime/v4-pilots",
));
const allowedRoot = resolve(projectRoot, ".ztothez-design-runtime");

function requireContained(root, candidate, label) {
  const relation = relative(root, candidate);
  if (relation === ".." || relation.startsWith(`..${sep}`)) {
    throw new Error(`${label} must remain under ${relative(projectRoot, root)}.`);
  }
}

requireContained(allowedRoot, outputRoot, "V4 qualification output");
requireContained(allowedRoot, pilotEvidenceRoot, "V4 pilot evidence");
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
const allowedRealRoot = await realpath(allowedRoot);
const outputRealRoot = await realpath(outputRoot);
const pilotEvidenceRealRoot = await realpath(pilotEvidenceRoot);
requireContained(allowedRealRoot, outputRealRoot, "Resolved V4 qualification output");
requireContained(allowedRealRoot, pilotEvidenceRealRoot, "Resolved V4 pilot evidence");

const portable = (path) => relative(projectRoot, path).split(sep).join("/");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const reference = async (path) => ({ path: portable(path), sha256: hash(await readFile(path)) });
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

async function capture(id, command, args) {
  const logsRoot = join(outputRoot, "logs");
  const commandsRoot = join(outputRoot, "commands");
  await Promise.all([mkdir(logsRoot, { recursive: true }), mkdir(commandsRoot, { recursive: true })]);
  const result = await execute(command, args);
  const stdoutPath = join(logsRoot, `${id}.stdout.txt`);
  const stderrPath = join(logsRoot, `${id}.stderr.txt`);
  await Promise.all([
    writeFile(stdoutPath, result.stdout),
    writeFile(stderrPath, result.stderr),
  ]);
  const report = {
    version: "1.0",
    id,
    command: result.command,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    exitCode: result.exitCode,
    passed: result.passed,
    stdout: await reference(stdoutPath),
    stderr: await reference(stderrPath),
  };
  const reportPath = join(commandsRoot, `${id}.json`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { result, reportPath, stdoutPath };
}

const gates = {
  build: await capture("release-build", npm, ["run", "build"]),
  typecheck: await capture("release-typecheck", npm, ["run", "typecheck"]),
  tests: await capture("release-tests", npm, ["test"]),
  packageCheck: await capture("release-package-check", npm, ["run", "package:check"]),
  packageSmoke: await capture("release-package-smoke", npm, ["run", "package:smoke"]),
  independence: await capture("release-independence", npm, ["run", "independence:check"]),
  offlineRelease: await capture("release-offline", npm, ["run", "release:verify"]),
  archiveRemoval: await capture("release-archive-removal", npm, ["run", "independence:archive-smoke"]),
};

const pilot = await capture("pilot-qualification", process.execPath, [
  "dist/cli/qualify-pilots.js",
  "--config", "knowledge-base/benchmarks/delivery-pilots.yaml",
  "--project-root", ".",
  "--evidence-root", portable(pilotEvidenceRoot),
  "--json",
]);
const holdout = await capture("holdout-evaluation", process.execPath, [
  "dist/cli/evaluate-v4.js",
  "--config", "knowledge-base/benchmarks/v4-evaluation.yaml",
  "--project-root", ".",
  "--evidence-root", portable(pilotEvidenceRoot),
  "--json",
]);

const prerequisiteFailure = [
  ...Object.values(gates).map(({ result }) => result),
  pilot.result,
  holdout.result,
].find((result) => !result.passed);
if (prerequisiteFailure) {
  process.stderr.write(prerequisiteFailure.stderr);
  throw new Error(`V4 qualification prerequisite failed: ${prerequisiteFailure.command.join(" ")}`);
}

const evidence = {
  version: "1.0",
  productEvidence: {
    pilotQualification: await reference(pilot.stdoutPath),
    holdoutEvaluation: await reference(holdout.stdoutPath),
  },
  releaseGates: Object.fromEntries(await Promise.all(Object.entries(gates).map(async ([id, value]) => [
    id,
    await reference(value.reportPath),
  ]))),
  documentation: {
    readme: await reference(join(projectRoot, "README.md")),
    installation: await reference(join(projectRoot, "docs/installation.md")),
    workflow: await reference(join(projectRoot, ".github/workflows/quality.yml")),
  },
};
const evidencePath = join(outputRoot, "qualification-evidence.json");
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);

const qualification = await execute(process.execPath, [
  "dist/cli/qualify-v4.js",
  "--evidence", portable(evidencePath),
  "--project-root", ".",
  "--json",
]);
await writeFile(join(outputRoot, "qualification-report.json"), qualification.stdout);
await writeFile(join(outputRoot, "qualification.stderr.txt"), qualification.stderr);
if (!qualification.passed) {
  process.stderr.write(qualification.stderr);
  process.stderr.write(qualification.stdout);
  throw new Error("V4 qualification failed.");
}

process.stdout.write(qualification.stdout);
