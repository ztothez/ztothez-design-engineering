import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { cp, lstat, mkdir, mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  PROJECT_ROOT,
  expectedKnowledgePaths,
  expectedProvenancePaths,
} from "./package-artifact.mjs";

const npmExecPath = process.env.npm_execpath;

function runNpm(args, cwd) {
  const command = npmExecPath ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
  const commandArgs = npmExecPath ? [npmExecPath, ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    0,
    [`npm ${args.join(" ")} failed`, result.stdout, result.stderr].filter(Boolean).join("\n"),
  );
}

async function copyFile(sourceRoot, destinationRoot, path) {
  const destination = join(destinationRoot, path);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(sourceRoot, path), destination);
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function waitForFixture(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // The fixture may still be binding its port.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`fixture did not become ready: ${url}`);
}

const temporaryRoot = await mkdtemp(join(tmpdir(), "ztothez-design-independent-"));
const isolatedRoot = join(temporaryRoot, "workspace");
let fixture;

try {
  await mkdir(isolatedRoot, { recursive: true });

  for (const directory of [".github", "ci", "cli", "docs", "evidence", "scripts", "src", "tests"]) {
    await cp(join(PROJECT_ROOT, directory), join(isolatedRoot, directory), { recursive: true });
  }
  for (const path of [
    "LICENSE",
    "package-lock.json",
    "package.json",
    "ROADMAP.md",
    "tsconfig.json",
    "tsconfig.test.json",
    ...(await expectedProvenancePaths()),
    ...(await expectedKnowledgePaths()),
  ]) {
    await copyFile(PROJECT_ROOT, isolatedRoot, path);
  }
  await symlink(join(PROJECT_ROOT, "node_modules"), join(isolatedRoot, "node_modules"), "dir");

  for (const forbiddenPath of [
    ["local", "reference", "archive"].join("-"),
    ["older", "design", "data"].join("-"),
    ["external", "reference", "archive"].join("-"),
    join("knowledge-base", "architecture"),
    join("knowledge-base", "figma-and-systems"),
    join("knowledge-base", ["legacy", "sources"].join("-")),
    join("knowledge-base", "ux-patterns"),
    join("knowledge-base", "usability-evaluation", "sources"),
  ]) {
    await assert.rejects(lstat(join(isolatedRoot, forbiddenPath)), { code: "ENOENT" });
  }

  runNpm(["run", "independence:check", "--silent"], isolatedRoot);
  runNpm(["run", "build", "--silent"], isolatedRoot);
  runNpm(["run", "typecheck", "--silent"], isolatedRoot);
  runNpm(["test", "--silent"], isolatedRoot);
  runNpm([
    "run",
    "evaluate-corpus",
    "--silent",
    "--",
    "--output",
    ".ztothez-design-corpus/archive-removal",
  ], isolatedRoot);

  const port = await availablePort();
  const fixtureUrl = `http://127.0.0.1:${port}`;
  fixture = spawn(process.execPath, [join(isolatedRoot, "ci", "fixture-server.mjs")], {
    cwd: isolatedRoot,
    env: {
      ...process.env,
      ZTOTHEZ_DESIGN_FIXTURE_HOST: "127.0.0.1",
      ZTOTHEZ_DESIGN_FIXTURE_PORT: String(port),
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let fixtureDiagnostics = "";
  fixture.stderr.on("data", (chunk) => {
    fixtureDiagnostics += chunk.toString();
  });
  fixture.once("error", (error) => {
    fixtureDiagnostics += `\n${error.message}`;
  });
  await waitForFixture(fixtureUrl);
  try {
    runNpm([
      "run",
      "quality-gate",
      "--silent",
      "--",
      "--contract",
      "knowledge-base/benchmarks/aegisops/product-contract.yaml",
      "--repo",
      "tests/fixtures/passing",
      "--project-root",
      ".",
      "--url",
      fixtureUrl,
      "--profile",
      "responsive-overview",
      "--output",
      ".ztothez-design-quality-gate/archive-removal",
      "--fail-on",
      "error",
    ], isolatedRoot);
  } catch (error) {
    if (fixtureDiagnostics.trim()) {
      throw new Error(`${error.message}\nFixture diagnostics:\n${fixtureDiagnostics.trim()}`, {
        cause: error,
      });
    }
    throw error;
  }

  const corpusReport = JSON.parse(
    await readFile(
      join(isolatedRoot, ".ztothez-design-corpus", "archive-removal", "corpus-report.json"),
      "utf8",
    ),
  );
  assert.equal(corpusReport.passed, true);

  process.stdout.write(`${JSON.stringify({
    version: "1.0",
    isolatedWorkspace: true,
    referenceArchivesPresent: false,
    build: "passed",
    typecheck: "passed",
    regressionSuite: "passed",
    mcpAndRetrieval: "passed through regression suite",
    corpus: "passed",
    fixtureQualityGate: "passed",
  }, null, 2)}\n`);
} finally {
  if (fixture && fixture.exitCode === null) {
    fixture.kill("SIGTERM");
    await new Promise((resolve) => fixture.once("exit", resolve));
  }
  await rm(temporaryRoot, { recursive: true, force: true });
}
