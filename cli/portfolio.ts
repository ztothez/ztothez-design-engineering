import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  discoverPortfolioCandidates,
  inspectPortfolioRegistry,
  projectById,
} from "../src/portfolio/registry.js";
import {
  formatPortfolioInventoryReport,
  formatPortfolioRegistryReport,
} from "../src/portfolio/report.js";
import {
  formatPortfolioAdapterReport,
  formatPortfolioAdapterStageResult,
} from "../src/portfolio/adapter-report.js";
import {
  resolvePortfolioAdapter,
  runPortfolioAdapterStage,
} from "../src/portfolio/adapters.js";
import { benchmarkStageSchema, type BenchmarkStage } from "../src/portfolio/schema.js";
import {
  closePortfolioSnapshot,
  createPortfolioSnapshot,
  withPortfolioSnapshot,
} from "../src/portfolio/snapshot.js";
import {
  portfolioRunExitCode,
  readPortfolioBenchmarkReport,
  runPortfolioBenchmark,
  verifyPortfolioRunSources,
} from "../src/portfolio/runner.js";
import { deleteProjectEvidence } from "../src/portfolio/vault.js";
import { evaluateCrossProductTaxonomy } from "../src/portfolio/taxonomy.js";
import { evaluateRuleCandidate } from "../src/portfolio/promotion.js";
import { evaluateV3Qualification } from "../src/portfolio/qualification.js";
import {
  verifyEvidenceReferences,
  verifyQualificationEvidenceSemantics,
  verifyRulePromotionEvidenceSemantics,
} from "../src/portfolio/evidence.js";

type PortfolioCommand = "baseline" | "benchmark" | "capabilities" | "cross-product" | "evaluate-rule" | "inventory" | "prune-evidence" | "qualify-v3" | "report" | "run-stage" | "snapshot" | "validate-registry" | "verify-unchanged";

type PortfolioCliOptions = {
  command: PortfolioCommand;
  registry: string;
  project?: string;
  stage?: BenchmarkStage;
  cohort?: "development" | "holdout";
  runId?: string;
  candidatePath?: string;
  evidencePath?: string;
  devRunId?: string;
  holdoutRunId?: string;
  annotationsPath?: string;
  workspace: string;
  runRoot: string;
  keep: boolean;
  json: boolean;
};

export function portfolioUsage(command = "zz-design"): string {
  return [
    "Usage:",
    `  ${command} portfolio validate-registry [--registry PATH] [--json]`,
    `  ${command} portfolio inventory [--registry PATH] [--json]`,
    `  ${command} portfolio capabilities --project ID [--registry PATH] [--json]`,
    `  ${command} portfolio run-stage --project ID --stage STAGE [--registry PATH] [--workspace PATH] [--json]`,
    `  ${command} portfolio baseline --project ID [--run ID] [--registry PATH] [--json]`,
    `  ${command} portfolio benchmark --cohort development|holdout [--run ID] [--registry PATH] [--json]`,
    `  ${command} portfolio verify-unchanged --run ID [--registry PATH] [--json]`,
    `  ${command} portfolio report --run ID [--json]`,
    `  ${command} portfolio prune-evidence --run ID [--project ID] [--json]`,
    `  ${command} portfolio cross-product --run ID [--annotations PATH] [--registry PATH] [--json]`,
    `  ${command} portfolio evaluate-rule --candidate PATH --evidence PATH [--dev-run ID] [--holdout-run ID] [--registry PATH] [--json]`,
    `  ${command} portfolio qualify-v3 --evidence PATH [--dev-run ID] [--holdout-run ID] [--registry PATH] [--json]`,
    `  ${command} portfolio snapshot --project ID [--registry PATH] [--workspace PATH] [--keep] [--json]`,
    "",
    "The registry is local-only. Snapshot commands copy approved files into an isolated workspace",
    "and verify that the original source remains unchanged.",
  ].join("\n");
}

function parseArguments(argumentsList: string[]): PortfolioCliOptions {
  const command = argumentsList[0];
  if (!["validate-registry", "inventory", "capabilities", "run-stage", "snapshot", "baseline", "benchmark", "verify-unchanged", "report", "prune-evidence", "cross-product", "evaluate-rule", "qualify-v3"].includes(command ?? "")) {
    throw new Error("Unknown portfolio command.");
  }
  const parsedCommand = command as PortfolioCommand;
  let registry = resolve(".ztothez-design-local", "portfolio-registry.yaml");
  let workspace = resolve(".ztothez-design-benchmarks", "workspaces");
  let runRoot = resolve(".ztothez-design-benchmarks", "runs");
  let project: string | undefined;
  let stage: BenchmarkStage | undefined;
  let cohort: "development" | "holdout" | undefined;
  let runId: string | undefined;
  let candidatePath: string | undefined;
  let evidencePath: string | undefined;
  let devRunId: string | undefined;
  let holdoutRunId: string | undefined;
  let annotationsPath: string | undefined;
  let keep = false;
  let json = false;

  for (let index = 1; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const next = argumentsList[index + 1];
    if (argument === "--registry" && next) {
      registry = resolve(next);
      index += 1;
    } else if (argument === "--workspace" && next) {
      workspace = resolve(next);
      index += 1;
    } else if (argument === "--project" && next) {
      project = next;
      index += 1;
    } else if (argument === "--candidate" && next) {
      candidatePath = resolve(next);
      index += 1;
    } else if (argument === "--evidence" && next) {
      evidencePath = resolve(next);
      index += 1;
    } else if (argument === "--dev-run" && next) {
      devRunId = next;
      index += 1;
    } else if (argument === "--holdout-run" && next) {
      holdoutRunId = next;
      index += 1;
    } else if (argument === "--annotations" && next) {
      annotationsPath = resolve(next);
      index += 1;
    } else if (argument === "--stage" && next) {
      const parsed = benchmarkStageSchema.safeParse(next);
      if (!parsed.success) throw new Error(`Unknown portfolio stage: ${next}`);
      stage = parsed.data;
      index += 1;
    } else if (argument === "--cohort" && (next === "development" || next === "holdout")) {
      cohort = next;
      index += 1;
    } else if (argument === "--run" && next) {
      runId = next;
      index += 1;
    } else if (argument === "--keep") {
      keep = true;
    } else if (argument === "--json") {
      json = true;
    } else if (argument === "--help" || argument === "-h") {
      throw new Error("PORTFOLIO_HELP");
    } else {
      throw new Error(`Unknown or incomplete portfolio argument: ${argument}`);
    }
  }
  if (["snapshot", "capabilities", "run-stage", "baseline"].includes(parsedCommand) && !project) {
    throw new Error(`${parsedCommand} requires --project ID`);
  }
  if (parsedCommand === "evaluate-rule" && !candidatePath) {
    throw new Error("evaluate-rule requires --candidate PATH");
  }
  if (["evaluate-rule", "qualify-v3"].includes(parsedCommand) && !evidencePath) {
    throw new Error(`${parsedCommand} requires --evidence PATH`);
  }
  if (!["evaluate-rule", "qualify-v3"].includes(parsedCommand) && evidencePath) {
    throw new Error("--evidence applies only to evaluate-rule and qualify-v3");
  }
  if (parsedCommand === "run-stage" && !stage) throw new Error("run-stage requires --stage STAGE");
  if (parsedCommand !== "snapshot" && keep) throw new Error("--keep applies only to the snapshot command");
  if (parsedCommand !== "run-stage" && stage) throw new Error("--stage applies only to the run-stage command");
  if (["validate-registry", "inventory", "benchmark", "verify-unchanged", "report", "cross-product", "evaluate-rule", "qualify-v3"].includes(parsedCommand) && project) {
    throw new Error("--project does not apply to this command");
  }
  if (parsedCommand === "benchmark" && !cohort) throw new Error("benchmark requires --cohort development or holdout");
  if (parsedCommand !== "benchmark" && cohort) throw new Error("--cohort applies only to benchmark");
  if (["verify-unchanged", "report", "prune-evidence", "cross-product"].includes(parsedCommand) && !runId) throw new Error(`${parsedCommand} requires --run ID`);
  if (!["baseline", "benchmark", "verify-unchanged", "report", "prune-evidence", "cross-product"].includes(parsedCommand) && runId) throw new Error("--run does not apply to this command");
  if (["baseline", "benchmark"].includes(parsedCommand) && !runId) {
    runId = `run-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  }
  return {
    command: parsedCommand,
    registry,
    workspace,
    ...(project ? { project } : {}),
    ...(stage ? { stage } : {}),
    ...(cohort ? { cohort } : {}),
    ...(runId ? { runId } : {}),
    ...(candidatePath ? { candidatePath } : {}),
    ...(evidencePath ? { evidencePath } : {}),
    ...(devRunId ? { devRunId } : {}),
    ...(holdoutRunId ? { holdoutRunId } : {}),
    ...(annotationsPath ? { annotationsPath } : {}),
    keep,
    json,
    runRoot,
  };
}

export async function runPortfolioCli(argumentsList: string[], executable = "zz-design"): Promise<number> {
  if (argumentsList.length === 0 || argumentsList[0] === "--help" || argumentsList[0] === "-h") {
    process.stdout.write(`${portfolioUsage(executable)}\n`);
    return 0;
  }
  let options: PortfolioCliOptions;
  try {
    options = parseArguments(argumentsList);
  } catch (error) {
    if (error instanceof Error && error.message === "PORTFOLIO_HELP") {
      process.stdout.write(`${portfolioUsage(executable)}\n`);
      return 0;
    }
    throw error;
  }

  if (options.command === "report") {
    const report = await readPortfolioBenchmarkReport(options.runRoot, options.runId!);
    process.stdout.write(`${JSON.stringify(report, null, options.json ? 2 : 2)}\n`);
    return portfolioRunExitCode(report);
  }
  if (options.command === "prune-evidence") {
    const result = await deleteProjectEvidence(options.runRoot, options.runId!, options.project);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }
  if (options.command === "qualify-v3") {
    const inspection = await inspectPortfolioRegistry(options.registry);
    const evidenceInput = JSON.parse(await readFile(options.evidencePath!, "utf8"));
    const evidenceIntegrity = await verifyEvidenceReferences(process.cwd(), evidenceInput);
    for (const failure of evidenceIntegrity.failures) console.error(`[qualify-v3] ${failure}`);
    let devReport;
    let holdoutReport;
    if (options.devRunId) {
      devReport = await readPortfolioBenchmarkReport(options.runRoot, options.devRunId);
    }
    if (options.holdoutRunId) {
      holdoutReport = await readPortfolioBenchmarkReport(options.runRoot, options.holdoutRunId);
    }
    const evidenceSemantics = await verifyQualificationEvidenceSemantics(process.cwd(), evidenceInput);
    for (const failure of evidenceSemantics.failures) console.error(`[qualify-v3] ${failure}`);
    const report = evaluateV3Qualification(
      inspection,
      devReport,
      holdoutReport,
      evidenceInput,
      evidenceIntegrity.passed && evidenceSemantics.passed,
    );
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.passed ? 0 : 1;
  }
  if (options.command === "evaluate-rule") {
    const candidateInput = JSON.parse(await readFile(options.candidatePath!, "utf8"));
    const evidenceInput = JSON.parse(await readFile(options.evidencePath!, "utf8"));
    const evidenceIntegrity = await verifyEvidenceReferences(process.cwd(), evidenceInput);
    for (const failure of evidenceIntegrity.failures) console.error(`[evaluate-rule] ${failure}`);
    const inspection = await inspectPortfolioRegistry(options.registry);
    let devReport;
    let holdoutReport;
    if (options.devRunId) {
      devReport = await readPortfolioBenchmarkReport(options.runRoot, options.devRunId);
    }
    if (options.holdoutRunId) {
      holdoutReport = await readPortfolioBenchmarkReport(options.runRoot, options.holdoutRunId);
    }
    const evidenceSemantics = await verifyRulePromotionEvidenceSemantics(
      process.cwd(),
      candidateInput,
      evidenceInput,
      holdoutReport,
    );
    for (const failure of evidenceSemantics.failures) console.error(`[evaluate-rule] ${failure}`);
    const report = evaluateRuleCandidate(
      candidateInput,
      inspection,
      devReport,
      holdoutReport,
      evidenceInput,
      evidenceIntegrity.passed && evidenceSemantics.passed,
    );
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.passed ? 0 : 1;
  }
  if (options.command === "cross-product") {
    const report = await readPortfolioBenchmarkReport(options.runRoot, options.runId!);
    const inspection = await inspectPortfolioRegistry(options.registry);
    let annotations: any[] = [];
    if (options.annotationsPath) {
      try {
        const content = await readFile(options.annotationsPath, "utf8");
        annotations = JSON.parse(content);
      } catch {
        // empty annotations on read error
      }
    }
    const evalReport = evaluateCrossProductTaxonomy(report, inspection.projects, annotations);
    process.stdout.write(`${JSON.stringify(evalReport, null, 2)}\n`);
    return evalReport.passed ? 0 : 1;
  }
  const inspection = await inspectPortfolioRegistry(options.registry);
  if (options.command === "validate-registry") {
    process.stdout.write(
      `${options.json ? JSON.stringify(inspection.report, null, 2) : formatPortfolioRegistryReport(inspection.report)}\n`,
    );
    return inspection.report.passed ? 0 : 1;
  }

  if (options.command === "inventory") {
    const report = await discoverPortfolioCandidates(inspection);
    process.stdout.write(
      `${options.json ? JSON.stringify(report, null, 2) : formatPortfolioInventoryReport(report)}\n`,
    );
    return report.passed ? 0 : 1;
  }

  if (!inspection.report.passed) {
    process.stdout.write(
      `${options.json ? JSON.stringify(inspection.report, null, 2) : formatPortfolioRegistryReport(inspection.report)}\n`,
    );
    return 1;
  }
  if (options.command === "verify-unchanged") {
    const verification = await verifyPortfolioRunSources(inspection, options.runRoot, options.runId!);
    process.stdout.write(`${JSON.stringify(verification, null, 2)}\n`);
    return verification.unchanged ? 0 : 4;
  }
  if (options.command === "baseline" || options.command === "benchmark") {
    const projects = options.command === "baseline"
      ? [projectById(inspection, options.project!)]
      : inspection.projects.filter(
          (entry) => entry.declaration.enabled && entry.declaration.cohort === options.cohort,
        );
    const execution = await runPortfolioBenchmark(inspection, {
      runId: options.runId!,
      registryPath: options.registry,
      workspaceRoot: options.workspace,
      runRoot: options.runRoot,
      mode: options.command === "baseline" ? "baseline" : "cohort",
      ...(options.cohort ? { cohort: options.cohort } : {}),
      projects,
    });
    process.stdout.write(`${JSON.stringify({ reportPath: execution.path, ...execution.report }, null, 2)}\n`);
    return portfolioRunExitCode(execution.report);
  }
  const project = projectById(inspection, options.project!);
  if (options.command === "capabilities") {
    const report = resolvePortfolioAdapter(project);
    process.stdout.write(
      `${options.json ? JSON.stringify(report, null, 2) : formatPortfolioAdapterReport(report)}\n`,
    );
    return report.passed ? 0 : 1;
  }
  if (options.command === "run-stage") {
    const execution = await withPortfolioSnapshot(project, options.workspace, (snapshot) =>
      runPortfolioAdapterStage(snapshot, options.stage!),
    );
    process.stdout.write(
      `${options.json ? JSON.stringify({ ...execution.result, snapshot: execution.summary }, null, 2) : formatPortfolioAdapterStageResult(execution.result)}\n`,
    );
    return ["passed", "unsupported", "not-applicable"].includes(execution.result.status) ? 0 : 1;
  }
  const snapshot = await createPortfolioSnapshot(project, options.workspace);
  const summary = await closePortfolioSnapshot(snapshot, { keep: options.keep });
  process.stdout.write(
    `${options.json ? JSON.stringify(summary, null, 2) : [
      "# Portfolio Snapshot",
      "",
      `- Project: \`${summary.projectId}\``,
      `- Source digest: \`${summary.sourceDigest}\``,
      `- Source entries: ${summary.sourceEntries}`,
      `- Copied files: ${summary.copiedFiles}`,
      `- Copied bytes: ${summary.copiedBytes}`,
      `- Source unchanged: ${summary.sourceUnchanged ? "yes" : "no"}`,
      ...(summary.snapshotRoot ? [`- Snapshot: \`${summary.snapshotRoot}\``] : []),
    ].join("\n")}\n`,
  );
  return 0;
}
