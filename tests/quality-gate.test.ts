import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { runQualityGate } from "../src/quality-gate/runner.js";

const contractPath = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "aegisops",
  "product-contract.yaml",
);
const passingRepository = resolve(process.cwd(), "tests", "fixtures", "passing");
const failingRepository = resolve(process.cwd(), "tests", "fixtures", "violations");

const fixturePath = resolve(process.cwd(), "ci", "fixtures", "responsive-overview.html");

test("quality gate consolidates passing, failing, and incomplete stages", async (context) => {
  const fixtureHtml = await readFile(fixturePath, "utf8");
  const server = createServer((request, response) => {
    if (request.url === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(fixtureHtml);
  });
  await new Promise<void>((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  context.after(() => new Promise<void>((resolveClose) => server.close(() => resolveClose())));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const url = `http://127.0.0.1:${address.port}`;
  const outputRoot = await mkdtemp(join(tmpdir(), "ztothez-design-quality-gate-test-"));
  context.after(() => rm(outputRoot, { recursive: true, force: true }));

  const passing = await runQualityGate({
    contractPath,
    projectRoot: process.cwd(),
    repository: passingRepository,
    outputDirectory: join(outputRoot, "passing"),
    url,
    profile: "responsive-overview",
    settleMs: 20,
  });
  assert.equal(passing.complete, true);
  assert.equal(passing.passed, true, JSON.stringify(passing, null, 2));
  assert.equal(passing.stages.contract.status, "pass");
  assert.equal(passing.stages.architecture.status, "pass");
  assert.equal(passing.stages.runtime.status, "pass");
  assert.equal(passing.stages.acceptance.status, "pass");
  await stat(join(passing.outputDirectory, "quality-gate.json"));
  await stat(join(passing.outputDirectory, "quality-gate.md"));
  await stat(join(passing.outputDirectory, "runtime", "runtime-report.json"));

  const failing = await runQualityGate({
    contractPath,
    projectRoot: process.cwd(),
    repository: failingRepository,
    outputDirectory: join(outputRoot, "failing"),
    url,
    profile: "responsive-overview",
    settleMs: 20,
  });
  assert.equal(failing.complete, true);
  assert.equal(failing.passed, false);
  assert.equal(failing.stages.architecture.status, "fail");
  assert.equal(failing.stages.acceptance.status, "pass");
  assert.ok(failing.summary.errors > 0);

  const incomplete = await runQualityGate({
    contractPath,
    projectRoot: process.cwd(),
    repository: passingRepository,
    outputDirectory: join(outputRoot, "incomplete"),
  });
  assert.equal(incomplete.complete, false);
  assert.equal(incomplete.passed, false);
  assert.equal(incomplete.stages.runtime.status, "skipped");
  assert.equal(incomplete.stages.acceptance.status, "skipped");
});
