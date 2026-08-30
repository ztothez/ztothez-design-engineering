export type DataMode = "demo" | "imported" | "cached" | "live";

export type SourceBoundary = {
  label: string;
  origin: string;
  freshness: string;
  connection: "not-required" | "unavailable" | "unknown";
  limitation: string;
  canRunTask: boolean;
};

export const sourceBoundaries: Record<DataMode, SourceBoundary> = {
  demo: {
    label: "Demonstration data",
    origin: "Local synthetic fixture",
    freshness: "Static fixture; no production timestamp",
    connection: "not-required",
    limitation: "Demonstration results cannot establish live service availability or current production state.",
    canRunTask: true,
  },
  imported: {
    label: "Imported data",
    origin: "No file has been imported",
    freshness: "Unknown until an import is validated",
    connection: "not-required",
    limitation: "No imported record is available in this generated fixture.",
    canRunTask: false,
  },
  cached: {
    label: "Cached data",
    origin: "No cached snapshot is available",
    freshness: "Unavailable",
    connection: "not-required",
    limitation: "The interface does not substitute demonstration data for a missing cache.",
    canRunTask: false,
  },
  live: {
    label: "Live data",
    origin: "No production connector configured",
    freshness: "Unverified",
    connection: "unavailable",
    limitation: "Live actions remain unavailable until a real connector supplies authenticated runtime evidence.",
    canRunTask: false,
  },
};
