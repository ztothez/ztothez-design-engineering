export type Scenario = "demo" | "live" | "slow" | "fallback" | "disconnected" | "partial" | "stale";
export type AnalysisStage = "initial" | "loading" | "result" | "error" | "export";
export type Severity = "critical" | "high" | "medium" | "low";

export interface MetricContract {
  id: string;
  label: string;
  value: string;
  change: string;
  definition: string;
  source: string;
  scope: string;
  period: string;
  freshness: string;
  baseline: string;
  decision: string;
  tone: "neutral" | "positive" | "warning" | "danger";
}

export interface Finding {
  id: string;
  rank: number;
  severity: Severity;
  confidence: "high" | "medium";
  source: string;
  title: string;
  affectedScope: string;
  observation: string;
  impact: string;
  evidence: string[];
  action: string;
  owner: string;
  validation: string;
  estimatedMonthlySavings: number;
}

export const snapshot = {
  id: "azure-benchmark-2024-05-10",
  environment: "Production-shaped benchmark estate",
  source: "Imported fixed comparison fixture",
  capturedAt: "2024-05-10T10:30:00+03:00",
  timezone: "Europe/Helsinki",
  scope: "142 resources across compute, storage, network, and governance",
  limitations: [
    "No Azure tenant is connected.",
    "Savings are benchmark estimates and are not billing commitments.",
    "Operator approval is required before remediation.",
  ],
} as const;

export const metrics: MetricContract[] = [
  {
    id: "resources",
    label: "Tracked resources",
    value: "142",
    change: "Complete fixture inventory",
    definition: "Resources included in this analysis snapshot.",
    source: snapshot.source,
    scope: snapshot.scope,
    period: "Point-in-time snapshot",
    freshness: snapshot.capturedAt,
    baseline: "No prior inventory baseline",
    decision: "Confirms the estate scope behind every finding.",
    tone: "neutral",
  },
  {
    id: "savings",
    label: "Potential monthly savings",
    value: "EUR 3,240",
    change: "5.4x the EUR 600 monthly benchmark spend",
    definition: "Sum of finding-level recurring monthly estimates.",
    source: "Four fixed recommendation estimates",
    scope: snapshot.scope,
    period: "Estimated monthly run rate",
    freshness: snapshot.capturedAt,
    baseline: "EUR 600 benchmark monthly spend",
    decision: "Prioritizes cost validation, not automatic changes.",
    tone: "positive",
  },
  {
    id: "issues",
    label: "Open findings",
    value: "4",
    change: "2 high, 1 medium, 1 low",
    definition: "Current evidenced findings in the fixed fixture.",
    source: "Terraform, telemetry, and governance checks",
    scope: snapshot.scope,
    period: "Current imported snapshot",
    freshness: snapshot.capturedAt,
    baseline: "No unresolved-finding comparison period",
    decision: "Directs review to the highest severity and impact.",
    tone: "warning",
  },
  {
    id: "health",
    label: "Infrastructure health",
    value: "78 / 100",
    change: "Down 8 points from May 10 benchmark",
    definition: "Weighted configuration, telemetry, and governance score.",
    source: "Version 1 benchmark score formula",
    scope: snapshot.scope,
    period: "Seven-day fixture window",
    freshness: snapshot.capturedAt,
    baseline: "86 / 100 on May 10",
    decision: "Signals whether evidenced risk is improving or worsening.",
    tone: "danger",
  },
];

export const findings: Finding[] = [
  {
    id: "AZ-METRIC-002",
    rank: 1,
    severity: "high",
    confidence: "high",
    source: "Imported telemetry fixture",
    title: "Memory capacity is fully allocated",
    affectedScope: "vm-prod-api-01, production compute pool",
    observation: "16 of 16 GB is allocated in the snapshot, leaving no measured headroom.",
    impact: "Workload bursts can trigger paging, latency, or process termination.",
    evidence: ["memory.used_gb = 16", "memory.total_gb = 16", "utilization = 100%"],
    action: "Profile peak memory, then resize the instance or set a tested scaling policy.",
    owner: "Platform operations",
    validation: "Repeat the peak-load test and verify at least 20% memory headroom.",
    estimatedMonthlySavings: 0,
  },
  {
    id: "AZ-CONFIG-001",
    rank: 2,
    severity: "high",
    confidence: "high",
    source: "Imported Terraform fixture",
    title: "Production resources have no declared backup policy",
    affectedScope: "12 production resources in infrastructure.tf",
    observation: "The inspected fixture contains no backup policy or retention declaration.",
    impact: "Recovery point and retention expectations cannot be verified before an incident.",
    evidence: ["backup_policy blocks = 0", "production resources inspected = 12"],
    action: "Declare backup coverage, retention, and restore-test ownership.",
    owner: "Cloud governance",
    validation: "Run a restore test and retain the successful recovery record.",
    estimatedMonthlySavings: 0,
  },
  {
    id: "AZ-METRIC-003",
    rank: 3,
    severity: "medium",
    confidence: "medium",
    source: "Imported telemetry fixture",
    title: "Provisioned CPU exceeds observed demand",
    affectedScope: "vm-prod-api-01",
    observation: "One of eight cores is used in the point-in-time benchmark snapshot.",
    impact: "The current profile may carry avoidable compute cost.",
    evidence: ["used cores = 1", "available cores = 8", "utilization = 12.5%"],
    action: "Compare a 30-day percentile profile before selecting a smaller SKU.",
    owner: "FinOps and platform operations",
    validation: "Load-test the proposed SKU and confirm latency and saturation SLOs.",
    estimatedMonthlySavings: 1420,
  },
  {
    id: "AZ-GOV-004",
    rank: 4,
    severity: "low",
    confidence: "medium",
    source: "Imported governance fixture",
    title: "Ownership tags are incomplete",
    affectedScope: "37 of 142 resources",
    observation: "Required owner, environment, cost_center, or lifecycle tags are absent.",
    impact: "Cost attribution and operational ownership require manual reconciliation.",
    evidence: ["resources missing one or more required tags = 37"],
    action: "Apply the required tag policy and assign an exception owner.",
    owner: "Cloud governance",
    validation: "Re-run policy evaluation and verify zero unowned exceptions.",
    estimatedMonthlySavings: 820,
  },
];

export const healthSeries = [
  { date: "May 4", score: 92 },
  { date: "May 5", score: 74 },
  { date: "May 6", score: 79 },
  { date: "May 7", score: 58 },
  { date: "May 8", score: 64 },
  { date: "May 9", score: 72 },
  { date: "May 10", score: 86 },
] as const;

export function normalizeScenario(value: string | string[] | undefined): Scenario {
  const candidate = Array.isArray(value) ? value[0] : value;
  return ["demo", "live", "slow", "fallback", "disconnected", "partial", "stale"].includes(candidate ?? "")
    ? candidate as Scenario
    : "demo";
}
