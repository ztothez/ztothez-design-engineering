import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

type KnowledgeInventoryEntry = {
  id: string;
  path: string;
  sha256: string;
  retrievalStatus: "included" | "excluded";
  packageStatus: "included";
  publicStatus: "admitted";
  declaredOwner: string;
  licenseOrPermissionBasis: string;
  transformationStatus: string;
  reviewedBy: string;
  reviewedAt: string;
  disposition: "admit";
};

type KnowledgeInventory = {
  version: string;
  authority: string;
  trackedFileCount: number;
  packageFileCount: number;
  retrievalFileCount: number;
  entries: KnowledgeInventoryEntry[];
};

function runInventory(argumentsList: string[]) {
  return spawnSync(process.execPath, ["scripts/knowledge-inventory.mjs", ...argumentsList], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(path)));
    else files.push(path.split("\\").join("/"));
  }
  return files.sort();
}

async function currentKnowledgeBoundary(): Promise<string[]> {
  const git = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (git.status === 0 && git.stdout.trim() === "true") {
    return spawnSync("git", ["ls-files", "knowledge-base"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }).stdout.trim().split("\n").filter(Boolean).sort();
  }
  return filesUnder("knowledge-base");
}

test("public knowledge inventory is deterministic and covers every tracked knowledge file", async () => {
  const result = runInventory(["--check"]);
  assert.equal(result.status, 0, result.stderr);

  const inventory = JSON.parse(
    await readFile("governance/public-knowledge-inventory.json", "utf8"),
  ) as KnowledgeInventory;
  const tracked = await currentKnowledgeBoundary();

  assert.equal(inventory.version, "1.0");
  assert.equal(inventory.authority, "SKILL.md");
  assert.equal(inventory.trackedFileCount, tracked.length);
  assert.equal(inventory.packageFileCount, tracked.length);
  assert.equal(inventory.entries.length, tracked.length);
  assert.deepEqual(inventory.entries.map((entry) => entry.path), tracked);
  assert.equal(new Set(inventory.entries.map((entry) => entry.id)).size, tracked.length);
  assert.equal(
    inventory.entries.filter((entry) => entry.retrievalStatus === "included").length,
    inventory.retrievalFileCount,
  );

  for (const entry of inventory.entries) {
    const digest = createHash("sha256").update(await readFile(entry.path)).digest("hex");
    assert.equal(entry.sha256, digest, `${entry.path} digest mismatch`);
    assert.equal(entry.packageStatus, "included");
    assert.equal(entry.publicStatus, "admitted");
    assert.equal(entry.disposition, "admit");
    assert.ok(entry.declaredOwner.trim());
    assert.ok(entry.licenseOrPermissionBasis.trim());
    assert.ok(entry.transformationStatus.trim());
    assert.ok(entry.reviewedBy.trim());
    assert.equal(Number.isNaN(Date.parse(entry.reviewedAt)), false);
  }
});

test("private V5 research remains outside Git, package metadata, and public inventory", async () => {
  const privateRoot = ["Data", "For", "V5"].join("");
  const tracked = spawnSync("git", ["ls-files", privateRoot], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (tracked.status === 0) {
    assert.equal(tracked.stdout, "");
  } else {
    await assert.rejects(access(privateRoot), { code: "ENOENT" });
  }

  const packageJson = JSON.parse(await readFile("package.json", "utf8")) as { files: string[] };
  assert.equal(packageJson.files.some((path) => path.includes(privateRoot)), false);

  const inventory = await readFile("governance/public-knowledge-inventory.json", "utf8");
  assert.equal(inventory.includes(privateRoot), false);
});

test("knowledge inventory check rejects retained digest drift", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ztde-knowledge-inventory-"));
  const path = join(directory, "tampered.json");
  const inventory = JSON.parse(
    await readFile("governance/public-knowledge-inventory.json", "utf8"),
  ) as KnowledgeInventory;
  const firstEntry = inventory.entries[0];
  assert.ok(firstEntry);
  firstEntry.sha256 = "0".repeat(64);
  await writeFile(path, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

  const result = runInventory(["--check", "--inventory", path]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Public knowledge inventory is stale/);
});
