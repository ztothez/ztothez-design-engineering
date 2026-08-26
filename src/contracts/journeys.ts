import { readFile } from "node:fs/promises";

import { z } from "zod";

import { runtimeJourneySchema } from "../runtime/schema.js";
import type { RuntimeExpectedNetwork, RuntimeJourney } from "../runtime/types.js";
import { journeySuiteSchema } from "./schema.js";

export type RuntimeJourneySelection = {
  journeys: RuntimeJourney[];
  expectedNetwork: RuntimeExpectedNetwork[];
};

export async function loadRuntimeJourneySelection(
  file: string,
  requestedProfile?: string,
): Promise<RuntimeJourneySelection> {
  const content: unknown = JSON.parse(await readFile(file, "utf8"));
  const flatJourneys = z.array(runtimeJourneySchema).safeParse(content);
  if (flatJourneys.success) {
    if (requestedProfile) {
      throw new Error("--profile cannot be used with a flat journey array");
    }
    return { journeys: flatJourneys.data, expectedNetwork: [] };
  }

  const suite = journeySuiteSchema.parse(content);
  if (!requestedProfile) {
    const profileIds = suite.profiles.map((profile) => profile.id).join(", ");
    throw new Error(`--profile is required for a journey suite. Available profiles: ${profileIds}`);
  }
  const profile = suite.profiles.find((candidate) => candidate.id === requestedProfile);
  if (!profile) {
    const profileIds = suite.profiles.map((candidate) => candidate.id).join(", ");
    throw new Error(`Unknown journey profile ${requestedProfile}. Available profiles: ${profileIds}`);
  }
  return {
    journeys: profile.journeys.map(({ name, steps }) => ({ name, steps })),
    expectedNetwork: profile.expectedNetwork ?? [],
  };
}

export async function loadRuntimeJourneys(
  file: string,
  requestedProfile?: string,
): Promise<RuntimeJourney[]> {
  return (await loadRuntimeJourneySelection(file, requestedProfile)).journeys;
}
