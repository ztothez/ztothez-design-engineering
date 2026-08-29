import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { stringify } from "yaml";

import { listPortfolioProjectsForMcp, readPortfolioReportForMcp } from "../src/portfolio/mcp.js";

test("portfolio MCP summaries require opt-in and omit local source roots", async (context) => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-portfolio-mcp-"));
  context.after(() => {
    delete process.env.ZTOTHEZ_DESIGN_PORTFOLIO_MCP;
    delete process.env.ZTOTHEZ_DESIGN_PORTFOLIO_REGISTRY;
    delete process.env.ZTOTHEZ_DESIGN_PORTFOLIO_REPORT_ROOT;
    return rm(temporary, { recursive: true, force: true });
  });
  await assert.rejects(listPortfolioProjectsForMcp(), /disabled/);
  const source = join(temporary, "source");
  await mkdir(source);
  await writeFile(join(source, "package.json"), "{}\n");
  const registry = join(temporary, "registry.yaml");
  await writeFile(registry, stringify({
    version: "1.0", id: "private-registry", description: "Private fixture.",
    roots: [{ id: "root", class: "studio-portfolio", path: source }],
    projects: [{
      id: "private-project", root: "root", path: ".", enabled: true, ownership: "first-party",
      confidentiality: "private-local", cohort: "development",
      publication: { sourceExcerpts: false, screenshots: false, machineReports: false, aggregateMetrics: true },
      product: { domain: "Fixture", archetype: "utility", intendedUsers: ["Tester"], primaryTasks: ["Test"] },
      technology: { framework: "Python", packageManager: "none", entrypoint: "package.json", adapter: "python-source" },
      capabilities: [{ stage: "source-audit", status: "supported", reason: "Source is available." }],
      execution: { fixtureMode: "disconnected", networkPolicy: "denied", lifecycleScripts: false },
      paths: { include: ["**"] }, source: { revisionPolicy: "capture-current", canonicalizationKey: "private-project" },
    }],
  }));
  const reports = join(temporary, "reports");
  await mkdir(join(reports, "run-1"), { recursive: true });
  await writeFile(join(reports, "run-1", "report.json"), JSON.stringify({
    version: "1.0.0", toolVersion: "2.0.2", runId: "run-1", mode: "cohort", registryId: "private-registry",
    registryDigest: "a", projectIds: ["private-project"], startedAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-01T00:00:01Z",
    projects: [{ projectId: "private-project", cohort: "development", environmentPolicy: { network: "denied", lifecycleScripts: false, environmentVariables: [] }, commands: [], startedAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-01T00:00:01Z", stages: [], artifacts: [], status: "passed" }],
    summary: { passed: 1, findings: 0, limitations: 0, unsafeConfiguration: 0, sourceMutation: 0 }, resultFingerprint: "b", passed: true,
  }));
  process.env.ZTOTHEZ_DESIGN_PORTFOLIO_MCP = "enabled";
  process.env.ZTOTHEZ_DESIGN_PORTFOLIO_REGISTRY = registry;
  process.env.ZTOTHEZ_DESIGN_PORTFOLIO_REPORT_ROOT = reports;
  const listing = await listPortfolioProjectsForMcp();
  assert.equal(listing.projects[0]?.id, "private-project");
  assert.doesNotMatch(JSON.stringify(listing), new RegExp(temporary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const report = await readPortfolioReportForMcp("run-1", "private-project");
  assert.equal(report.projects.length, 1);
  assert.doesNotMatch(JSON.stringify(report), new RegExp(temporary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
