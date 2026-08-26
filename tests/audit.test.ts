import assert from "node:assert/strict";
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
      "ZTDE-SLOP-001",
      "ZTDE-SLOP-002",
      "ZTDE-STATE-001",
    ],
  );
  assert.ok(report.findings.every((finding) => finding.evidence.length > 0));
  assert.ok(report.findings.every((finding) => finding.remediation.length > 0));
});

test("generated and dependency directories are excluded", async () => {
  const report = await auditRepository(resolve(fixtures, "violations"), {
    componentLineWarning: 20,
    mixedResponsibilitiesMinLines: 20,
  });

  assert.ok(report.findings.every((finding) => !finding.file.includes("node_modules")));
  assert.ok(report.findings.every((finding) => !finding.file.includes("dist/")));
});
