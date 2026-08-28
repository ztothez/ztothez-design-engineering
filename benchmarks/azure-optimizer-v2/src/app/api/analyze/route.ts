import { findings, snapshot, type Scenario } from "../../../domain/data";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function POST(request: Request) {
  const scenario = new URL(request.url).searchParams.get("scenario") as Scenario | null;
  if (scenario === "slow") await wait(1200);
  if (scenario === "fallback" || scenario === "disconnected") {
    return Response.json({ error: "Benchmark adapter unavailable" }, { status: 503 });
  }

  const selectedFindings = scenario === "partial" ? findings.slice(0, 2) : findings;
  return Response.json({
    runId: `benchmark-${scenario ?? "demo"}-run`,
    processingOrigin: scenario === "live" || scenario === "slow" ? "live" : scenario === "stale" ? "cached" : "simulated",
    dataOrigin: snapshot.source,
    completedAt: new Date().toISOString(),
    freshness: scenario === "stale" ? "stale" : "current",
    findings: selectedFindings,
    limitations: [
      ...(scenario === "partial" ? ["Two of four checks completed; governance and backup checks are unavailable."] : []),
      ...snapshot.limitations,
    ],
  });
}
