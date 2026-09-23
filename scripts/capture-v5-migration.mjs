import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argumentsList = process.argv.slice(2);
const outputFlag = argumentsList.indexOf("--output");
const outputRoot = resolve(projectRoot, outputFlag >= 0 && argumentsList[outputFlag + 1]
  ? argumentsList[outputFlag + 1]
  : ".ztothez-design-runtime/v5-migration");
const allowedRoot = resolve(projectRoot, ".ztothez-design-runtime");

function requireContained(root, candidate, label) {
  const relation = relative(root, candidate);
  if (relation === ".." || relation.startsWith(`..${sep}`)) {
    throw new Error(`${label} must remain under ${relative(projectRoot, root)}.`);
  }
}

requireContained(allowedRoot, outputRoot, "V6 migration qualification output");
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const portable = (path) => relative(projectRoot, path).split(sep).join("/");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const reference = async (path) => ({ path: portable(path), sha256: hash(await readFile(path)) });
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

async function execute(command, args) {
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
    exitCode,
    passed: exitCode === 0,
    stdout: Buffer.concat(stdout),
    stderr: Buffer.concat(stderr),
  };
}

async function capture(id, command, args, enrich = () => ({})) {
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
    command: result.command,
    exitCode: result.exitCode,
    passed: result.passed,
    stdout: await reference(stdoutPath),
    stderr: await reference(stderrPath),
    ...enrich(result),
  };
  await writeFile(join(commandsRoot, `${id}.json`), `${JSON.stringify(report, null, 2)}\n`);
  if (!result.passed) {
    process.stderr.write(result.stderr);
    process.stderr.write(result.stdout);
    throw new Error(`V6 migration qualification prerequisite failed: ${result.command.join(" ")}`);
  }
  return report;
}

const buildEvidence = await capture("build", npm, ["run", "build"]);

const { buildV5MigrationReport } = await import("../dist/src/v5-migration/evaluator.js");
const { parseNodeTestSummary } = await import("../dist/src/v5-migration/test-summary.js");
const {
  formatV5MigrationReport,
  formatV5OwnerChecklist,
  formatV5ReleaseNotesDraft,
} = await import("../dist/src/v5-migration/report.js");

const commandEvidence = {
  build: buildEvidence,
  typecheck: await capture("typecheck", npm, ["run", "typecheck"]),
  tests: await capture("tests", npm, ["test"], (result) => ({
    testCounts: parseNodeTestSummary(Buffer.concat([result.stdout, result.stderr]).toString("utf8")),
  })),
  "package-check": await capture("package-check", npm, ["run", "package:check"]),
  "package-smoke": await capture("package-smoke", npm, ["run", "package:smoke"]),
  independence: await capture("independence", npm, ["run", "independence:check"]),
  "archive-removal": await capture("archive-removal", npm, ["run", "independence:archive-smoke"]),
  "public-content": await capture("public-content", npm, ["run", "public-content:check"]),
  "knowledge-quality": await capture("knowledge-quality", npm, ["run", "knowledge-quality:check"]),
  "source-removal": await capture("source-removal", npm, ["run", "source-removal:qualify"]),
  "diff-check": await capture("diff-check", "git", ["diff", "--check"]),
};

const packageDryRun = await execute(npm, ["pack", "--ignore-scripts", "--dry-run", "--json"]);
if (!packageDryRun.passed) {
  process.stderr.write(packageDryRun.stderr);
  throw new Error("V6 migration qualification package dry-run failed.");
}
const packageReport = JSON.parse(packageDryRun.stdout.toString("utf8"))[0];
const packageFiles = packageReport.files.map((file) => file.path).sort();
await writeFile(join(outputRoot, "package-file-list.txt"), `${packageFiles.join("\n")}\n`, "utf8");

const publicFileList = await execute("git", ["ls-files"]);
if (!publicFileList.passed) throw new Error("Unable to list Git tracked files.");
const publicFiles = publicFileList.stdout.toString("utf8").trim().split("\n").filter(Boolean).sort();
await writeFile(join(outputRoot, "public-file-list.txt"), `${publicFiles.join("\n")}\n`, "utf8");

const boundary = JSON.parse(await readFile(join(projectRoot, "governance/public-knowledge-boundary.json"), "utf8"));
const replacementPaths = [...new Set(boundary.removedArtifacts.flatMap(
  (artifact) => artifact.maintainedReplacementPaths,
))].sort();
const preChangeDigests = {};
for (const path of replacementPaths) {
  const prior = await execute("git", ["show", `HEAD:${path}`]);
  preChangeDigests[path] = prior.passed
    ? hash(prior.stdout)
    : "not-present-before-rewrite";
}

const report = await buildV5MigrationReport({
  projectRoot,
  commandEvidence,
  packageFiles,
  publicFiles,
  preChangeDigests,
  releaseNotesDraftPath: join(outputRoot, "release-notes-draft.md"),
});

const reportJsonPath = join(outputRoot, "migration-report.json");
const reportMarkdownPath = join(outputRoot, "migration-report.md");
await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(reportMarkdownPath, `${formatV5MigrationReport(report)}\n`, "utf8");
await writeFile(join(outputRoot, "release-notes-draft.md"), `${formatV5ReleaseNotesDraft(report)}\n`, "utf8");
await writeFile(join(outputRoot, "owner-approval-checklist.md"), `${formatV5OwnerChecklist(report)}\n`, "utf8");

process.stdout.write(`${JSON.stringify({
  version: "2.0",
  output: portable(outputRoot),
  report: portable(reportJsonPath),
  markdown: portable(reportMarkdownPath),
  status: report.status,
  passed: report.passed,
  publicActions: report.ownerReview.publicActions,
}, null, 2)}\n`);
