import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createPackageArchive, validatePackageArchive } from "./package-artifact.mjs";

const temporaryDirectory = await mkdtemp(join(tmpdir(), "ztothez-design-package-check-"));

try {
  const { report } = await createPackageArchive(temporaryDirectory);
  const summary = await validatePackageArchive(report);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
