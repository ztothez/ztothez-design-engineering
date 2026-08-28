import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { formatAuditReport } from "../src/audit/report.js";
import { auditRepository } from "../src/audit/scanner.js";

const fixtures = resolve(process.cwd(), "tests", "fixtures");

test("passing fixture produces no findings", async () => {
  const report = await auditRepository(resolve(fixtures, "passing"));

  assert.equal(report.passed, true);
  assert.equal(report.filesScanned, 2);
  assert.deepEqual(report.findings, []);
  assert.match(formatAuditReport(report), /Result: PASS/);
  assert.match(formatAuditReport(report), /Verifier Limitations/);
  assert.equal(report.evidenceBoundary.humanReviewRequired.length, 1);
});

test("violation fixture reports every initial quality-gate category", async () => {
  const report = await auditRepository(resolve(fixtures, "violations"), {
    componentLineWarning: 20,
    mixedResponsibilitiesMinLines: 20,
  });
  const ruleIds = new Set(report.findings.map((finding) => finding.ruleId));

  assert.equal(report.passed, false);
  assert.deepEqual(
    [...ruleIds].sort(),
    [
      "ZTDE-A11Y-001",
      "ZTDE-ARCH-001",
      "ZTDE-ARCH-002",
      "ZTDE-DESIGN-001",
      "ZTDE-REPO-001",
      "ZTDE-SEC-001",
      "ZTDE-SLOP-001",
      "ZTDE-SLOP-002",
      "ZTDE-SLOP-003",
      "ZTDE-STATE-001",
      "ZTDE-TRUST-001",
    ],
  );
  assert.ok(report.findings.every((finding) => finding.evidence.length > 0));
  assert.ok(report.findings.every((finding) => finding.remediation.length > 0));
  const designFinding = report.findings.find((finding) => finding.ruleId === "ZTDE-DESIGN-001");
  assert.match(designFinding?.message ?? "", /raw visual values/);
  assert.ok(designFinding?.evidence.some((entry) => /padding|boxShadow/.test(entry)));
});

test("generated and dependency directories are excluded", async () => {
  const report = await auditRepository(resolve(fixtures, "violations"), {
    componentLineWarning: 20,
    mixedResponsibilitiesMinLines: 20,
  });

  assert.ok(report.findings.every((finding) => !finding.file.includes("node_modules")));
  assert.ok(report.findings.every((finding) => !finding.file.includes("dist/")));
});

test("semantic CSS variables and media-query conditions are not raw design values", async () => {
  const directory = await mkdtemp(resolve(tmpdir(), "ztde-token-css-"));
  try {
    await writeFile(
      resolve(directory, "components.css"),
      [
        ".panel {",
        "  box-shadow: var(--shadow-raised);",
        "  font-family: var(--font-sans);",
        "}",
        "@media (max-width: 900px) {",
        "  .panel { display: block; }",
        "}",
      ].join("\n"),
    );
    const report = await auditRepository(directory);
    assert.ok(report.findings.every((finding) => finding.ruleId !== "ZTDE-DESIGN-001"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
