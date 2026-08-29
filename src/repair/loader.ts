import { readFile } from "node:fs/promises";
import { extname } from "node:path";

import { parse } from "yaml";

import { repairRequestSchema, type RepairRequest } from "./schema.js";

export async function loadRepairRequest(path: string): Promise<RepairRequest> {
  const source = await readFile(path, "utf8");
  const extension = extname(path).toLowerCase();
  const parsed = extension === ".json" ? JSON.parse(source) : parse(source);
  return repairRequestSchema.parse(parsed);
}
