import { rm, mkdir } from "node:fs/promises";
import { join } from "node:path";

import {
  PROJECT_ROOT,
  createPackageArchive,
  validatePackageArchive,
  writeChecksum,
} from "./package-artifact.mjs";

const destination = join(PROJECT_ROOT, ".ztothez-design-release");
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

const { archivePath, report } = await createPackageArchive(destination);
const summary = await validatePackageArchive(report);
const checksumPath = await writeChecksum(archivePath, destination);

process.stdout.write(
  `${JSON.stringify({ ...summary, archivePath, checksumPath }, null, 2)}\n`,
);
