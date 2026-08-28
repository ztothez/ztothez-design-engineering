import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { startPortfolioFixtureServer } from "../src/portfolio/fixture-server.js";

test("built-in portfolio fixture serves only snapshot files and stops cleanly", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "ztde-fixture-server-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "dist"));
  await writeFile(join(root, "dist", "index.html"), "<!doctype html><title>Fixture</title><main>Ready</main>");
  const port = 43_000 + Math.floor(Math.random() * 1_000);
  const snapshot = {
    snapshotRoot: root,
    project: {
      declaration: {
        verification: { serveDirectory: "dist", port, route: "/workflow", readinessPath: "/", contractPath: "contract.yaml", profile: "primary", settleMs: 0 },
      },
    },
  } as any;
  const server = await startPortfolioFixtureServer(snapshot);
  assert.equal((await fetch(server.url)).status, 200);
  assert.match(await (await fetch(server.url)).text(), /Ready/);
  assert.equal((await fetch(`${server.origin}/..%2F..%2Fetc%2Fpasswd`)).status, 200, "SPA fallback remains inside dist");
  await server.close();
  await assert.rejects(fetch(server.url));
});
