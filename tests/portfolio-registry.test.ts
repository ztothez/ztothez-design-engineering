import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { parse, stringify } from "yaml";

import {
  discoverPortfolioCandidates,
  inspectPortfolioRegistry,
} from "../src/portfolio/registry.js";
import { portfolioRegistrySchema } from "../src/portfolio/schema.js";

function project(id: string, root: string, path: string) {
  return {
    id,
    root,
    path,
    enabled: true,
    ownership: "first-party",
    confidentiality: "private-local",
    cohort: "development",
    publication: {
      sourceExcerpts: false,
      screenshots: false,
      machineReports: false,
      aggregateMetrics: true,
    },
    product: {
      domain: "Synthetic registry test",
      archetype: "utility",
      intendedUsers: ["Test operator"],
      primaryTasks: ["Exercise registry validation"],
    },
    technology: { framework: "Node.js", packageManager: "npm", entrypoint: "package.json" },
    capabilities: [
      { stage: "source-audit", status: "supported", reason: "Synthetic source is available." },
    ],
    execution: {
      fixtureMode: "disconnected",
      networkPolicy: "denied",
      lifecycleScripts: false,
      allowedEnvironmentVariables: [],
      localPorts: [],
    },
    paths: { include: ["**"], exclude: [] },
    source: { revisionPolicy: "capture-current", canonicalizationKey: id },
  };
}

async function writeRegistry(path: string, value: unknown): Promise<void> {
  await writeFile(path, stringify(value), "utf8");
}

test("portfolio registry resolves approved roots without exposing absolute paths in its report", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-portfolio-registry-"));
  try {
    const root = join(temporary, "portfolio");
    const app = join(root, "sample-app");
    await mkdir(app, { recursive: true });
    await writeFile(join(app, "package.json"), '{"name":"sample-app"}\n');
    const registryPath = join(temporary, "registry.yaml");
    await writeRegistry(registryPath, {
      version: "1.0",
      id: "test-portfolio",
      description: "Synthetic local portfolio registry.",
      roots: [{ id: "portfolio", class: "studio-portfolio", path: root, discoveryDepth: 3 }],
      projects: [project("sample-app", "portfolio", "sample-app")],
    });

    const inspection = await inspectPortfolioRegistry(registryPath);
    assert.equal(inspection.report.passed, true);
    assert.equal(inspection.projects.length, 1);
    assert.equal(inspection.report.counts.enabled, 1);
    assert.equal(JSON.stringify(inspection.report).includes(temporary), false);

    const inventory = await discoverPortfolioCandidates(inspection);
    assert.equal(inventory.passed, true);
    assert.deepEqual(inventory.candidates, [
      {
        root: "portfolio",
        rootClass: "studio-portfolio",
        path: "sample-app",
        markers: ["package.json"],
        registeredProject: "sample-app",
      },
    ]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("portfolio registry rejects enabled unknown ownership and escaping real paths", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-portfolio-escape-"));
  try {
    const root = join(temporary, "root");
    const outside = join(temporary, "outside");
    await mkdir(root, { recursive: true });
    await mkdir(outside, { recursive: true });
    await writeFile(join(outside, "package.json"), '{"name":"outside"}\n');
    await symlink(outside, join(root, "escaped"), "dir");
    const unsafe = project("unsafe", "portfolio", "escaped");
    unsafe.ownership = "unknown";
    const registryPath = join(temporary, "registry.yaml");
    await writeRegistry(registryPath, {
      version: "1.0",
      id: "unsafe-portfolio",
      description: "Synthetic unsafe registry.",
      roots: [{ id: "portfolio", class: "studio-portfolio", path: root }],
      projects: [unsafe],
    });

    const inspection = await inspectPortfolioRegistry(registryPath);
    assert.equal(inspection.report.passed, false);
    assert.ok(inspection.report.issues.some((entry) => entry.code === "PORTFOLIO-OWNERSHIP"));
    assert.ok(inspection.report.issues.some((entry) => entry.code === "PORTFOLIO-PROJECT-ESCAPE"));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("portfolio registry rejects duplicate canonical project paths", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-portfolio-duplicate-"));
  try {
    const root = join(temporary, "root");
    const app = join(root, "app");
    await mkdir(app, { recursive: true });
    await writeFile(join(app, "package.json"), '{"name":"app"}\n');
    await symlink(app, join(root, "app-alias"), "dir");
    const registryPath = join(temporary, "registry.yaml");
    await writeRegistry(registryPath, {
      version: "1.0",
      id: "duplicate-portfolio",
      description: "Synthetic duplicate registry.",
      roots: [{ id: "portfolio", class: "studio-portfolio", path: root }],
      projects: [project("app", "portfolio", "app"), project("app-alias", "portfolio", "app-alias")],
    });

    const inspection = await inspectPortfolioRegistry(registryPath);
    assert.equal(inspection.report.passed, false);
    assert.ok(inspection.report.issues.some((entry) => entry.code === "PORTFOLIO-DUPLICATE-PROJECT"));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("portable registry schema and runtime schema reject traversal", async () => {
  const portableSchema = parse(
    await import("node:fs/promises").then(({ readFile }) =>
      readFile(
        resolve("knowledge-base", "benchmarks", "portfolio-corpus", "registry.schema.yaml"),
        "utf8",
      ),
    ),
  ) as Record<string, unknown>;
  assert.equal(portableSchema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(portableSchema.$id, "https://ztothez.dev/schemas/portfolio-registry-1.0.schema.json");

  const invalid = {
    version: "1.0",
    id: "invalid",
    description: "Invalid traversal fixture.",
    roots: [{ id: "portfolio", class: "studio-portfolio", path: "/tmp" }],
    projects: [project("escape", "portfolio", "../escape")],
  };
  assert.equal(portfolioRegistrySchema.safeParse(invalid).success, false);
});

test("registry rejects nested approved roots and private raw-artifact publication", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-portfolio-policy-"));
  try {
    const parent = join(temporary, "parent");
    const child = join(parent, "child");
    const app = join(parent, "app");
    await mkdir(child, { recursive: true });
    await mkdir(app, { recursive: true });
    await writeFile(join(app, "package.json"), '{"name":"app"}\n');
    const unsafe = project("private-app", "parent", "app");
    unsafe.publication.sourceExcerpts = true;
    const registryPath = join(temporary, "registry.yaml");
    await writeRegistry(registryPath, {
      version: "1.0",
      id: "policy-portfolio",
      description: "Synthetic policy registry.",
      roots: [
        { id: "parent", class: "studio-fullstack", path: parent },
        { id: "child", class: "studio-portfolio", path: child },
      ],
      projects: [unsafe],
    });

    const inspection = await inspectPortfolioRegistry(registryPath);
    assert.equal(inspection.report.passed, false);
    assert.ok(inspection.report.issues.some((entry) => entry.code === "PORTFOLIO-DUPLICATE-ROOT"));
    assert.ok(inspection.report.issues.some((entry) => entry.code === "PORTFOLIO-PUBLICATION"));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("registry schema requires an ownership classification", () => {
  const missingOwnership = project("missing-owner", "portfolio", "app") as Record<string, unknown>;
  delete missingOwnership.ownership;
  const result = portfolioRegistrySchema.safeParse({
    version: "1.0",
    id: "missing-owner-registry",
    description: "Synthetic missing ownership registry.",
    roots: [{ id: "portfolio", class: "studio-portfolio", path: "/tmp" }],
    projects: [missingOwnership],
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((entry) => entry.path.join(".") === "projects.0.ownership"));
  }
});
