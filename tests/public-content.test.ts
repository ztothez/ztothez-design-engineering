import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { validatePublicContent } from "../src/public-content/validator.js";

async function runNode(argumentsList: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return await new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, argumentsList, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", rejectRun);
    child.on("close", (code) => resolveRun({ code: code ?? 1, stdout, stderr }));
  });
}

test("public content gate passes the current public repository surface", async () => {
  const report = await validatePublicContent();
  assert.equal(report.status, "pass");
  assert.ok(["git-tracked", "filesystem"].includes(report.scannedMode));
  assert.ok(report.filesScanned > 0);
  assert.equal(report.evidenceFiles, report.classifiedEvidenceFiles);
});

test("public content gate rejects unclassified evidence and redacts sensitive matches", async () => {
  const root = await mkdtemp(join(tmpdir(), "ztde-public-content-"));
  try {
    const privatePath = ["/home", "ztothez", "private", "project"].join("/");
    await mkdir(join(root, "governance"), { recursive: true });
    await mkdir(join(root, "evidence", "raw"), { recursive: true });
    const policy = JSON.parse(await readFile("governance/public-content-policy.json", "utf8"));
    policy.approvedPublicRoots = ["evidence/"];
    policy.evidenceRules = [];
    await writeFile(join(root, "governance", "public-content-policy.json"), JSON.stringify(policy, null, 2), "utf8");
    await writeFile(
      join(root, "evidence", "raw", "chat-log.md"),
      `23:35 reviewer_handle what is this?\nLocal path: ${privatePath}\n`,
      "utf8",
    );

    const report = await validatePublicContent({ root });
    assert.equal(report.status, "fail");
    assert.ok(report.findings.some((finding) => finding.ruleId === "ZTDE-PUBLIC-301"));
    assert.ok(report.findings.some((finding) => finding.ruleId === "ZTDE-PUBLIC-202"));
    assert.ok(report.findings.some((finding) => finding.ruleId === "ZTDE-PUBLIC-401"));
    const serialized = JSON.stringify(report);
    assert.equal(serialized.includes("reviewer_handle"), false);
    assert.equal(serialized.includes(privatePath), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("public content CLI reports JSON without exposing sensitive matched values", async () => {
  const result = await runNode([
    join(process.cwd(), "dist", "cli", "validate-public-content.js"),
    "--json",
  ]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "pass");
  assert.equal(JSON.stringify(report).includes(["/home", "ztothez"].join("/")), false);
});
