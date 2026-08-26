import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";

import {
  PROJECT_ROOT,
  createPackageArchive,
  validatePackageArchive,
} from "./package-artifact.mjs";
import { createOfflineRelease } from "./offline-release.mjs";

const destination = join(PROJECT_ROOT, ".ztothez-design-release");
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

const { archivePath, report } = await createPackageArchive(destination);
const summary = await validatePackageArchive(report);
const offline = await createOfflineRelease(destination, archivePath, report);

process.stdout.write(
  `${JSON.stringify({ ...summary, archivePath, ...offline }, null, 2)}\n`,
);
