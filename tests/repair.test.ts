import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import { generationManifestSchema } from "../src/generation/schema.js";
import { runBoundedRepair } from "../src/repair/runner.js";
import { repairRequestSchema, type RepairRequest } from "../src/repair/schema.js";
import { requireLoopbackUrl } from "../src/repair/policy.js";

const contractPath = resolve(
  process.cwd(),
  "knowledge-base",
  "benchmarks",
  "aegisops",
  "product-contract.yaml",
);
const runtimeFixturePath = resolve(process.cwd(), "ci", "fixtures", "responsive-overview.html");
const rawBlock = `.example-unsafe-rule {
  color: #111111;
  background: #eeeeee;
  border-color: #777777;
}
`;

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function createRepairTarget(root: string, name: string): Promise<{
  generationRoot: string;
  target: string;
  registry: string;
  badCss: string;
}> {
  const generationRoot = join(root, `${name}-generated`);
  const target = join(generationRoot, "fixture");
  const protectedRoot = join(root, `${name}-protected`);
  await Promise.all([
    mkdir(join(target, "src", "styles"), { recursive: true }),
    mkdir(protectedRoot),
  ]);
  const packageContent = `${JSON.stringify({
    name: `${name}-fixture`,
    private: true,
    scripts: { build: "tsc", test: "node --test", typecheck: "tsc --noEmit" },
  }, null, 2)}\n`;
  const cleanCss = `.shell { color: var(--color-text); background: var(--color-surface); }\n`;
  const badCss = `${cleanCss}${rawBlock}`;
  await writeFile(join(target, "package.json"), packageContent, "utf8");
  await writeFile(join(target, "src", "styles", "app.css"), cleanCss, "utf8");
  const manifest = generationManifestSchema.parse({
    version: "1.0",
    adapter: "react-typescript-vite",
    adapterVersion: "1.2.1",
    plan: {
      id: "repair-fixture-plan",
      sourceDigest: "a".repeat(64),
      compilerVersion: "1.0.0",
    },
    outputMode: "new-independent-fixture",
    files: [
      { path: "package.json", digest: digest(packageContent), bytes: Buffer.byteLength(packageContent) },
      { path: "src/styles/app.css", digest: digest(cleanCss), bytes: Buffer.byteLength(cleanCss) },
    ],
    guarantees: ["Synthetic fixture is contained by the test generation root."],
    limitations: ["Synthetic fixture is not release evidence."],
  });
  await writeFile(
    join(target, "ztothez-design-generation.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  await writeFile(join(target, "src", "styles", "app.css"), badCss, "utf8");

  const registry = join(root, `${name}-registry.yaml`);
  await writeFile(registry, stringify({
    version: "1.0",
    id: `${name}-registry`,
    description: "Synthetic protected root for bounded repair tests.",
    roots: [{ id: "protected", class: "studio-portfolio", path: protectedRoot }],
    projects: [],
  }), "utf8");
  return { generationRoot, target, registry, badCss };
}

function repairRequest(
  badCss: string,
  after: string,
  expectedDigest = digest(badCss),
): RepairRequest {
  return repairRequestSchema.parse({
    version: "1.0",
    id: "raw-responsive-repair",
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
        id: "bounded-token-repair",
        operations: [
          {
            id: "replace-raw-values",
            findingRef: "raw-responsive-values",
            kind: "replace-exact",
            file: "src/styles/app.css",
            expectedFileDigest: expectedDigest,
            before: rawBlock,
            after,
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
  });
}

test("bounded repair resolves a fresh finding and preserves comparable evidence", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-repair-success-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const fixtureHtml = await readFile(runtimeFixturePath, "utf8");
  const server = createServer((request, response) => {
    if (request.url === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "x-ztothez-design-plan": "repair-fixture-plan",
    });
    response.end(fixtureHtml);
  });
  await new Promise<void>((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  context.after(() => new Promise<void>((resolveClose) => server.close(() => resolveClose())));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const target = await createRepairTarget(temporary, "success");
  const packageBefore = await readFile(join(target.target, "package.json"), "utf8");
  const report = await runBoundedRepair({
    request: repairRequest(target.badCss, ""),
    generationRoot: target.generationRoot,
    targetDirectory: target.target,
    portfolioRegistryPath: target.registry,
    contractPath,
    projectRoot: process.cwd(),
    url: `http://127.0.0.1:${address.port}`,
    profile: "responsive-overview",
    outputDirectory: join(temporary, "success-evidence"),
    failOn: "warning",
    settleMs: 20,
  });

  assert.equal(report.status, "repaired", JSON.stringify(report, null, 2));
  assert.equal(report.reason, "quality-gate-passed");
  assert.deepEqual(report.resolvedFindingIds, ["raw-responsive-values"]);
  assert.deepEqual(report.unresolvedFindingIds, []);
  assert.equal(report.targetRestored, false);
  assert.equal(report.unrelatedFilesPreserved, true);
  assert.equal(report.humanEvidence, "not-generated");
  assert.equal(report.before?.passed, false);
  assert.equal(report.attempts[0]?.evidence?.passed, true);
  assert.deepEqual(report.before?.viewports, report.attempts[0]?.evidence?.viewports);
  assert.deepEqual(report.before?.journeys, report.attempts[0]?.evidence?.journeys);
  assert.equal(report.before?.screenshots.length, 8);
  assert.equal(report.attempts[0]?.evidence?.screenshots.length, 8);
  assert.equal(await readFile(join(target.target, "src", "styles", "app.css"), "utf8"), target.badCss.replace(rawBlock, ""));
  assert.equal(await readFile(join(target.target, "package.json"), "utf8"), packageBefore);
  await stat(join(temporary, "success-evidence", "repair-report.json"));
  await stat(join(temporary, "success-evidence", "before", "runtime", "runtime-report.json"));
  await stat(join(temporary, "success-evidence", "attempt-01", "runtime", "runtime-report.json"));
});

test("repeated findings stop unresolved and restore the original target", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-repair-repeat-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const fixtureHtml = await readFile(runtimeFixturePath, "utf8");
  const server = createServer((_request, response) => {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "x-ztothez-design-plan": "repair-fixture-plan",
    });
    response.end(fixtureHtml);
  });
  await new Promise<void>((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  context.after(() => new Promise<void>((resolveClose) => server.close(() => resolveClose())));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const target = await createRepairTarget(temporary, "repeat");
  const report = await runBoundedRepair({
    request: repairRequest(target.badCss, rawBlock.replace("}\n", "} \n")),
    generationRoot: target.generationRoot,
    targetDirectory: target.target,
    portfolioRegistryPath: target.registry,
    contractPath,
    projectRoot: process.cwd(),
    url: `http://127.0.0.1:${address.port}`,
    profile: "responsive-overview",
    outputDirectory: join(temporary, "repeat-evidence"),
    failOn: "warning",
    settleMs: 20,
  });

  assert.equal(report.status, "unresolved");
  assert.equal(report.reason, "repeated-finding");
  assert.equal(report.targetRestored, true);
  assert.deepEqual(report.resolvedFindingIds, []);
  assert.deepEqual(report.unresolvedFindingIds, ["raw-responsive-values"]);
  assert.equal(await readFile(join(target.target, "src", "styles", "app.css"), "utf8"), target.badCss);
});

test("failed exact preconditions reject the attempt without writing", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-repair-precondition-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const fixtureHtml = await readFile(runtimeFixturePath, "utf8");
  const server = createServer((_request, response) => {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "x-ztothez-design-plan": "repair-fixture-plan",
    });
    response.end(fixtureHtml);
  });
  await new Promise<void>((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  context.after(() => new Promise<void>((resolveClose) => server.close(() => resolveClose())));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const target = await createRepairTarget(temporary, "precondition");
  const report = await runBoundedRepair({
    request: repairRequest(target.badCss, "", "f".repeat(64)),
    generationRoot: target.generationRoot,
    targetDirectory: target.target,
    portfolioRegistryPath: target.registry,
    contractPath,
    projectRoot: process.cwd(),
    url: `http://127.0.0.1:${address.port}`,
    profile: "responsive-overview",
    outputDirectory: join(temporary, "precondition-evidence"),
    failOn: "warning",
    settleMs: 20,
  });

  assert.equal(report.status, "rejected");
  assert.equal(report.reason, "precondition-failed");
  assert.equal(report.targetRestored, false);
  assert.deepEqual(report.attempts[0]?.changedFiles, []);
  assert.equal(await readFile(join(target.target, "src", "styles", "app.css"), "utf8"), target.badCss);
});

test("runtime evidence must identify the generated repair target", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-repair-identity-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const fixtureHtml = await readFile(runtimeFixturePath, "utf8");
  const server = createServer((_request, response) => {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "x-ztothez-design-plan": "different-plan",
    });
    response.end(fixtureHtml);
  });
  await new Promise<void>((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  context.after(() => new Promise<void>((resolveClose) => server.close(() => resolveClose())));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const target = await createRepairTarget(temporary, "identity");

  await assert.rejects(
    runBoundedRepair({
      request: repairRequest(target.badCss, ""),
      generationRoot: target.generationRoot,
      targetDirectory: target.target,
      portfolioRegistryPath: target.registry,
      contractPath,
      projectRoot: process.cwd(),
      url: `http://127.0.0.1:${address.port}`,
      profile: "responsive-overview",
      outputDirectory: join(temporary, "identity-evidence"),
      failOn: "warning",
      settleMs: 20,
    }),
    /does not match the generation manifest plan/,
  );
  assert.equal(await readFile(join(target.target, "src", "styles", "app.css"), "utf8"), target.badCss);
});

test("repair contracts reject unsafe scope, invented human evidence, and unbounded attempts", async (context) => {
  const schema = parse(await readFile(
    resolve(process.cwd(), "knowledge-base", "design-intelligence", "repair-request.schema.yaml"),
    "utf8",
  )) as {
    $schema?: string;
    properties?: Record<string, { const?: string; maxItems?: number }>;
  };
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties?.version?.const, "1.0");
  assert.equal(schema.properties?.attempts?.maxItems, 3);

  const valid = repairRequest("x".repeat(64), "fixed", "a".repeat(64));
  assert.throws(
    () => repairRequestSchema.parse({ ...valid, humanAttestation: { reviewer: "AI" } }),
    /Unrecognized key|unrecognized/i,
  );
  assert.throws(
    () => repairRequestSchema.parse({ ...valid, stopping: { ...valid.stopping, maxAttempts: 2 } }),
    /maxAttempts must equal/,
  );
  assert.throws(
    () => repairRequestSchema.parse({ ...valid, target: { ...valid.target, manifest: "../escape.json" } }),
    /traversal|relative/i,
  );
  assert.throws(() => requireLoopbackUrl("https://example.com"), /loopback/);

  const temporary = await mkdtemp(join(tmpdir(), "ztde-repair-output-policy-"));
  context.after(() => rm(temporary, { recursive: true, force: true }));
  const target = await createRepairTarget(temporary, "output-policy");
  const alias = join(temporary, "target-alias");
  await symlink(target.target, alias, "dir");
  await assert.rejects(
    runBoundedRepair({
      request: repairRequest(target.badCss, ""),
      generationRoot: target.generationRoot,
      targetDirectory: target.target,
      portfolioRegistryPath: target.registry,
      contractPath,
      projectRoot: process.cwd(),
      url: "http://127.0.0.1:4173",
      profile: "responsive-overview",
      outputDirectory: join(alias, "evidence"),
      failOn: "warning",
      settleMs: 20,
    }),
    /outside the repair target/,
  );
});
