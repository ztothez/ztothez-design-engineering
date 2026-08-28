#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

function usage() {
  return [
    "Usage: node scripts/capture-comparison-engineering.mjs --candidate ID --target PATH --output PATH",
    "",
    "Runs build, TypeScript, and architecture checks and retains their exact outputs.",
  ].join("\n");
}

function parseArguments(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--candidate" || argument === "--target" || argument === "--output") {
      const value = argumentsList[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      options[argument.slice(2)] = value;
      index += 1;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.candidate || !options.target || !options.output) {
    throw new Error("--candidate, --target, and --output are required");
  }
  return options;
}

async function run(command, argumentsList, cwd) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, argumentsList, {
      cwd,
      env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectRun);
    child.on("close", (exitCode, signal) => {
      resolveRun({
        command: [command, ...argumentsList].join(" "),
        cwd,
        exitCode: exitCode ?? 1,
        signal,
        stdout,
        stderr,
      });
    });
  });
}

async function sourceRevision(target) {
  const rootResult = await run("git", ["rev-parse", "--show-toplevel"], target);
  if (rootResult.exitCode !== 0) return "unversioned-source";
  const gitRoot = rootResult.stdout.trim();
  const targetPath = relative(gitRoot, target).replaceAll("\\", "/");
  const revisionResult = await run(
    "git",
    ["rev-parse", targetPath ? `HEAD:${targetPath}` : "HEAD^{tree}"],
    target,
  );
  return revisionResult.exitCode === 0
    ? revisionResult.stdout.trim()
    : `worktree-at-${(await run("git", ["rev-parse", "HEAD"], target)).stdout.trim()}`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const repositoryRoot = resolve(import.meta.dirname, "..");
  const target = resolve(options.target);
  const output = resolve(options.output);
  const recordedAt = new Date().toISOString();

  const build = await run("npm", ["run", "build"], target);
  const typecheck = await run(resolve(target, "node_modules/.bin/tsc"), ["--noEmit"], target);
  const { auditRepository } = await import(resolve(repositoryRoot, "dist/src/audit/scanner.js"));
  const auditReport = await auditRepository(target);
  const auditRun = {
    command: "ZtotheZ Design Engineering auditRepository API",
    cwd: repositoryRoot,
    exitCode: auditReport.summary.errors === 0 ? 0 : 1,
    signal: null,
    stdout: `${JSON.stringify(auditReport, null, 2)}\n`,
    stderr: "",
  };

  const evidence = {
    version: "1.0",
    candidate: options.candidate,
    recordedAt,
    sourceRevision: await sourceRevision(target),
    stages: {
      build: { status: build.exitCode === 0 ? "pass" : "fail", ...build },
      typecheck: { status: typecheck.exitCode === 0 ? "pass" : "fail", ...typecheck },
      architectureAudit: {
        status:
          auditRun.exitCode === 0 && auditReport.summary.errors === 0
            ? "pass"
            : "fail",
        ...auditRun,
        report: auditReport,
      },
    },
  };

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  process.stdout.write(
    `${options.candidate}: build=${evidence.stages.build.status}, typecheck=${evidence.stages.typecheck.status}, architecture=${evidence.stages.architectureAudit.status}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n\n${usage()}\n`);
  process.exitCode = 1;
});
