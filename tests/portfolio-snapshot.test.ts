import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { stringify } from "yaml";

import { inspectPortfolioRegistry, projectById } from "../src/portfolio/registry.js";
import {
  SourceMutationError,
  closePortfolioSnapshot,
  createPortfolioSnapshot,
  runPortfolioSnapshotProcess,
  withPortfolioSnapshot,
} from "../src/portfolio/snapshot.js";

async function missing(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return false;
  } catch {
    return true;
  }
}

async function fixture(revisionPolicy: "capture-current" | "require-clean" = "capture-current") {
  const temporary = await mkdtemp(join(tmpdir(), "ztde-snapshot-"));
  const approvedRoot = join(temporary, "portfolio");
  const sourceRoot = join(approvedRoot, "sample-app");
  const workspace = join(temporary, "workspaces");
  await mkdir(join(sourceRoot, "src"), { recursive: true });
  await mkdir(join(sourceRoot, "node_modules", "dependency"), { recursive: true });
  await mkdir(join(sourceRoot, "dist"), { recursive: true });
  await writeFile(join(sourceRoot, "package.json"), '{"name":"sample-app"}\n');
  await writeFile(join(sourceRoot, "src", "index.ts"), "export const value = 1;\n");
  await writeFile(join(sourceRoot, "src", "shared.ts"), "export const shared = true;\n");
  await writeFile(join(sourceRoot, ".env"), "TOKEN=secret\n");
  await writeFile(join(sourceRoot, "node_modules", "dependency", "index.js"), "module.exports = 1;\n");
  await writeFile(join(sourceRoot, "dist", "bundle.js"), "generated\n");
  await symlink("shared.ts", join(sourceRoot, "src", "shared-link.ts"));

  const registryPath = join(temporary, "registry.yaml");
  await writeFile(
    registryPath,
    stringify({
      version: "1.0",
      id: "snapshot-fixture",
      description: "Synthetic snapshot fixture.",
      roots: [{ id: "portfolio", class: "studio-portfolio", path: approvedRoot }],
      projects: [
        {
          id: "sample-app",
          root: "portfolio",
          path: "sample-app",
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
            domain: "Synthetic snapshot test",
            archetype: "utility",
            intendedUsers: ["Test operator"],
            primaryTasks: ["Verify snapshot isolation"],
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
          source: { revisionPolicy, canonicalizationKey: "sample-app" },
        },
      ],
    }),
  );
  const inspection = await inspectPortfolioRegistry(registryPath);
  assert.equal(inspection.report.passed, true);
  return {
    temporary,
    sourceRoot,
    workspace,
    project: projectById(inspection, "sample-app"),
  };
}

test("snapshot copies approved source and excludes secrets, dependencies, and build output", async () => {
  const context = await fixture();
  try {
    const snapshot = await createPortfolioSnapshot(context.project, context.workspace);
    assert.equal(await readFile(join(snapshot.snapshotRoot, "src", "index.ts"), "utf8"), "export const value = 1;\n");
    assert.equal(await missing(join(snapshot.snapshotRoot, ".env")), true);
    assert.equal(await missing(join(snapshot.snapshotRoot, "node_modules")), true);
    assert.equal(await missing(join(snapshot.snapshotRoot, "dist")), true);
    assert.equal(
      await realpath(join(snapshot.snapshotRoot, "src", "shared-link.ts")),
      join(snapshot.snapshotRoot, "src", "shared.ts"),
    );
    assert.equal(snapshot.sourceState.entries.find((entry) => entry.path === ".env")?.scope, "guard");
    assert.equal(snapshot.sourceState.entries.find((entry) => entry.path === ".env")?.sha256, undefined);
    const snapshotRoot = snapshot.snapshotRoot;
    const summary = await closePortfolioSnapshot(snapshot);
    assert.equal(summary.sourceUnchanged, true);
    assert.equal(await missing(snapshotRoot), true);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("snapshot rejects symbolic links that escape the project", async () => {
  const context = await fixture();
  try {
    const outside = join(context.temporary, "outside.txt");
    await writeFile(outside, "outside\n");
    await symlink(outside, join(context.sourceRoot, "src", "outside-link.txt"));
    await assert.rejects(
      () => createPortfolioSnapshot(context.project, context.workspace),
      /Symbolic link escapes the project root/,
    );
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("snapshot close detects original source mutation and removes the disposable copy", async () => {
  const context = await fixture();
  try {
    const snapshot = await createPortfolioSnapshot(context.project, context.workspace);
    const snapshotRoot = snapshot.snapshotRoot;
    await writeFile(join(context.sourceRoot, "src", "index.ts"), "export const value = 2;\n");
    await assert.rejects(
      () => closePortfolioSnapshot(snapshot),
      (error) =>
        error instanceof SourceMutationError &&
        error.differences.some((entry) => entry.path === "src/index.ts" && entry.change === "modified"),
    );
    assert.equal(await missing(snapshotRoot), true);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("snapshot callback failure still verifies the source and cleans the workspace", async () => {
  const context = await fixture();
  let snapshotRoot = "";
  try {
    await assert.rejects(
      () =>
        withPortfolioSnapshot(context.project, context.workspace, async (snapshot) => {
          snapshotRoot = snapshot.snapshotRoot;
          throw new Error("synthetic interrupted operation");
        }),
      /synthetic interrupted operation/,
    );
    assert.equal(await missing(snapshotRoot), true);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("snapshot preserves a pre-existing dirty Git state", async () => {
  const context = await fixture();
  try {
    for (const args of [
      ["init", "-q"],
      ["config", "user.email", "snapshot@example.invalid"],
      ["config", "user.name", "Snapshot Test"],
      ["add", "."],
      ["commit", "-qm", "fixture"],
    ]) {
      const result = spawnSync("git", args, { cwd: context.sourceRoot, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
    }
    await writeFile(join(context.sourceRoot, "src", "index.ts"), "export const value = 7;\n");
    const before = spawnSync(
      "git",
      ["--no-optional-locks", "status", "--porcelain=v2", "--untracked-files=all"],
      { cwd: context.sourceRoot, encoding: "utf8", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } },
    ).stdout;
    const snapshot = await createPortfolioSnapshot(context.project, context.workspace);
    await closePortfolioSnapshot(snapshot);
    const after = spawnSync(
      "git",
      ["--no-optional-locks", "status", "--porcelain=v2", "--untracked-files=all"],
      { cwd: context.sourceRoot, encoding: "utf8", env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } },
    ).stdout;
    assert.equal(after, before);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("require-clean source policy rejects a dirty Git worktree", async () => {
  const context = await fixture("require-clean");
  try {
    for (const args of [
      ["init", "-q"],
      ["config", "user.email", "snapshot@example.invalid"],
      ["config", "user.name", "Snapshot Test"],
      ["add", "."],
      ["commit", "-qm", "fixture"],
    ]) {
      const result = spawnSync("git", args, { cwd: context.sourceRoot, encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
    }
    await writeFile(join(context.sourceRoot, "src", "index.ts"), "export const value = 9;\n");
    await assert.rejects(
      () => createPortfolioSnapshot(context.project, context.workspace),
      /requires a clean Git revision but has local changes/,
    );
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("snapshot process can write only inside the isolated copy and cannot reach the original path", async () => {
  const context = await fixture();
  try {
    const snapshot = await createPortfolioSnapshot(context.project, context.workspace);
    const result = await runPortfolioSnapshotProcess(snapshot, {
      command: process.execPath,
      arguments: [
        "-e",
        [
          "const fs=require('node:fs');",
          "fs.writeFileSync('snapshot-output.txt', 'snapshot only');",
          `try { fs.writeFileSync(${JSON.stringify(join(context.sourceRoot, "should-not-exist.txt"))}, 'bad'); } catch { process.stderr.write('source blocked'); }`,
          "process.stdout.write('done');",
        ].join(""),
      ],
      timeoutMs: 5_000,
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, "done");
    assert.equal(result.network, "denied");
    assert.equal(await readFile(join(snapshot.snapshotRoot, "snapshot-output.txt"), "utf8"), "snapshot only");
    if (result.stderr.includes("source blocked")) {
      assert.equal(await missing(join(context.sourceRoot, "should-not-exist.txt")), true);
      await closePortfolioSnapshot(snapshot);
    } else {
      await rm(join(context.sourceRoot, "should-not-exist.txt"), { force: true });
      await closePortfolioSnapshot(snapshot);
    }
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});

test("snapshot process timeout terminates the isolated process group", async () => {
  const context = await fixture();
  try {
    const snapshot = await createPortfolioSnapshot(context.project, context.workspace);
    const result = await runPortfolioSnapshotProcess(snapshot, {
      command: process.execPath,
      arguments: ["-e", "setInterval(() => {}, 1000)"],
      timeoutMs: 150,
    });
    assert.equal(result.timedOut, true);
    assert.notEqual(result.signal, null);
    assert.equal(result.sourceUnchanged, true);
    await closePortfolioSnapshot(snapshot);
  } finally {
    await rm(context.temporary, { recursive: true, force: true });
  }
});
