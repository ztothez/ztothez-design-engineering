import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { auditRepository } from "../src/audit/scanner.js";
import { ruleFixtureSpecSchema } from "../src/portfolio/promotion-schema.js";

const fixtureRoot = resolve("knowledge-base/benchmarks/portfolio-corpus/rule-fixtures");
const fixtureFiles = [
  "raw-design-values-positive.json",
  "raw-design-values-negative.json",
  "raw-design-values-abstention.json",
  "interactive-integrity-positive.json",
  "interactive-integrity-negative.json",
  "interactive-integrity-abstention.json",
  "component-size-positive.json",
  "component-size-negative.json",
  "component-size-abstention.json",
];

test("maintained rule fixtures execute against the production audit engine", async (context) => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "ztde-maintained-fixtures-"));
  context.after(() => rm(temporaryRoot, { recursive: true, force: true }));

  for (const fixtureFile of fixtureFiles) {
    const fixture = ruleFixtureSpecSchema.parse(
      JSON.parse(await readFile(join(fixtureRoot, fixtureFile), "utf8")),
    );
    const caseRoot = join(temporaryRoot, fixtureFile.replace(".json", ""));
    const source = [
      ...fixture.prefix,
      ...Array(fixture.repeat.count).fill(fixture.repeat.line),
      ...fixture.suffix,
    ].join("\n");
    await mkdir(caseRoot, { recursive: true });
    await writeFile(join(caseRoot, fixture.fileName), `${source}\n`);

    const report = await auditRepository(caseRoot, {
      requiredPackageScripts: [],
      requiredPackageScriptGroups: [],
    });
    const detected = report.findings.some((finding) => finding.ruleId === fixture.ruleId);
    assert.equal(
      detected,
      fixture.expected === "detected",
      `${fixtureFile} produced an unexpected ${fixture.ruleId} result`,
    );
  }
});
