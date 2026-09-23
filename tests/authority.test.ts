import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { compileAuthority, stableJson } from "../src/authority/compiler.js";
import { loadCompiledAuthority } from "../src/authority/loader.js";
import { validateCompiledAuthority } from "../src/authority/validator.js";
import { buildKnowledgeIndex } from "../src/retrieval/search.js";

test("compiled authority is deterministic and binds public knowledge, retrieval, model, and rule registry", async () => {
  const first = await compileAuthority();
  const second = await compileAuthority();

  assert.equal(first.report.status, "pass");
  assert.equal(first.report.admittedFileCount, 142);
  assert.equal(first.report.retrievalFileCount, 25);
  assert.equal(first.report.exactReadFileCount, 24);
  assert.equal(first.report.modelEntityCount, 20);
  assert.equal(first.report.ruleCount, 251);
  assert.equal(stableJson(first.authority), stableJson(second.authority));
  assert.equal(stableJson(first.registry), stableJson(second.registry));
  assert.equal(first.authority.policy.supportingFilesCannotOverrideSkill, true);
  assert.equal(first.authority.policy.privateSourcesAreRuntimeFallbacks, false);
  assert.ok(
    first.authority.knowledge.retrievalDocuments.some(
      (document) => document.path === "SKILL.md" && document.authority === "authoritative",
    ),
  );
  assert.ok(first.registry.rules.every((rule) => rule.owner === "ZtotheZ"));
  assert.ok(first.registry.rules.every((rule) => rule.modelLinks.length > 0));
  assert.ok(first.registry.rules.every((rule) => rule.sourceIds.length > 0));
});

test("retained compiled authority matches deterministic compiler output", async () => {
  const report = await validateCompiledAuthority();

  assert.equal(report.status, "pass");
  assert.equal(report.findingCount, 0);
  assert.equal(report.ruleCount, 251);
  assert.match(report.payloadSha256, /^[a-f0-9]{64}$/);
});

test("compiled authority rejects retained artifact drift", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "ztde-authority-drift-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "governance"), { recursive: true });
  await mkdir(join(directory, "model"), { recursive: true });
  await copyFile("governance/rule-registry.json", join(directory, "governance", "rule-registry.json"));
  await copyFile("model/compiled-authority.json", join(directory, "model", "compiled-authority.json"));

  const retained = JSON.parse(await readFile(join(directory, "model", "compiled-authority.json"), "utf8"));
  retained.ruleRegistry.ruleCount = 1;
  await writeFile(join(directory, "model", "compiled-authority.json"), `${JSON.stringify(retained, null, 2)}\n`, "utf8");

  const report = await validateCompiledAuthority({
    retainedRuleRegistryPath: join(directory, "governance", "rule-registry.json"),
    retainedCompiledAuthorityPath: join(directory, "model", "compiled-authority.json"),
  });

  assert.equal(report.status, "fail");
  assert.ok(report.findings.some((finding) => finding.path.endsWith("compiled-authority.json")));
});

test("retrieval uses the compiled authority boundary and rejects digest drift", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "ztde-authority-search-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "knowledge-base"), { recursive: true });
  await copyFile("SKILL.md", join(directory, "SKILL.md"));
  await copyFile("knowledge-base/retrieval-scope.yaml", join(directory, "knowledge-base", "retrieval-scope.yaml"));

  const authority = await loadCompiledAuthority();
  const tampered = structuredClone(authority);
  const skill = tampered.knowledge.retrievalDocuments.find((document) => document.path === "SKILL.md");
  assert.ok(skill);
  skill.sha256 = "0".repeat(64);

  await assert.rejects(
    () => buildKnowledgeIndex(process.cwd(), join(process.cwd(), "knowledge-base", "retrieval-scope.yaml"), tampered),
    /digest differs from the compiled authority boundary/,
  );
});

test("compile-authority CLI returns machine-readable shadow status", () => {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const build = spawnSync(npmCommand, ["run", "build", "--silent"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(build.status, 0, [build.stdout, build.stderr].filter(Boolean).join("\n"));
  const result = spawnSync(process.execPath, ["dist/cli/compile-authority.js", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout) as { status: string; ruleCount: number; retrievalFileCount: number };
  assert.equal(report.status, "pass");
  assert.equal(report.ruleCount, 251);
  assert.equal(report.retrievalFileCount, 25);
});

test("compile-authority CLI can emit a non-authoritative Markdown reference view", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "ztde-authority-reference-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const outputPath = join(directory, "reference.md");
  const result = spawnSync(process.execPath, [
    "dist/cli/compile-authority.js",
    "--reference-view",
    outputPath,
    "--json",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const reference = await readFile(outputPath, "utf8");
  assert.match(reference, /Generated ZtotheZ Design Engineering Reference View/);
  assert.match(reference, /not an independent authority/);
  assert.match(reference, /SKILL[.]md/);
  assert.match(reference, /Registered rules: 251/);
});
