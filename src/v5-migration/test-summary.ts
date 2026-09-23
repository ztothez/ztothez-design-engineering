import type { z } from "zod";

import { v5MigrationTestCountsSchema } from "./schema.js";

export type V5MigrationTestCounts = z.infer<typeof v5MigrationTestCountsSchema>;

export function parseNodeTestSummary(output: string): V5MigrationTestCounts {
  const readCount = (label: string): number | undefined => {
    const match = output.match(new RegExp(`^# ${label} (\\d+)\\s*$`, "m"));
    return match?.[1] ? Number.parseInt(match[1], 10) : undefined;
  };
  const passed = readCount("pass");
  const failed = readCount("fail");
  const skipped = readCount("skipped");
  if (passed === undefined || failed === undefined || skipped === undefined) {
    return "count-unavailable";
  }
  return { passed, failed, skipped };
}
