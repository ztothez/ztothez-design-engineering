import { isAbsolute } from "node:path";

import type { ResolvedPortfolioProject } from "./registry.js";
import type { BenchmarkStage, PortfolioAdapterId, PortfolioIssue } from "./schema.js";
import {
  runPortfolioSnapshotProcess,
  type PortfolioSnapshot,
  type SnapshotProcessResult,
} from "./snapshot.js";

export const PORTFOLIO_STAGES: BenchmarkStage[] = [
  "source-audit",
  "typecheck",
  "lint",
  "unit-test",
  "production-build",
  "local-fixture-server",
  "browser-journeys",
  "export-verification",
];

type AdapterDefinition = {
  id: PortfolioAdapterId;
  title: string;
  packageManagers: ReadonlySet<string>;
  executables: ReadonlySet<string>;
  supportedStages: ReadonlySet<BenchmarkStage>;
  notApplicableStages: ReadonlySet<BenchmarkStage>;
};

const frontendStages = new Set<BenchmarkStage>(PORTFOLIO_STAGES);
const browserlessStages = new Set<BenchmarkStage>(["source-audit", "typecheck", "lint", "unit-test"]);

const definitions: Record<PortfolioAdapterId, AdapterDefinition> = {
  "react-vite": {
    id: "react-vite",
    title: "React with Vite or TanStack Router",
    packageManagers: new Set(["npm", "pnpm", "yarn", "bun"]),
    executables: new Set(["npm", "pnpm", "yarn", "bun", "node"]),
    supportedStages: frontendStages,
    notApplicableStages: new Set(),
  },
  nextjs: {
    id: "nextjs",
    title: "Next.js frontend",
    packageManagers: new Set(["npm", "pnpm", "yarn", "bun"]),
    executables: new Set(["npm", "pnpm", "yarn", "bun", "node"]),
    supportedStages: frontendStages,
    notApplicableStages: new Set(),
  },
  angular: {
    id: "angular",
    title: "Angular frontend",
    packageManagers: new Set(["npm", "pnpm", "yarn", "bun"]),
    executables: new Set(["npm", "pnpm", "yarn", "bun", "node"]),
    supportedStages: frontendStages,
    notApplicableStages: new Set(),
  },
  "static-web": {
    id: "static-web",
    title: "Static HTML, CSS, and JavaScript",
    packageManagers: new Set(["npm", "pnpm", "yarn", "bun", "none", "other"]),
    executables: new Set(["npm", "pnpm", "yarn", "bun", "node"]),
    supportedStages: new Set([
      "source-audit",
      "lint",
      "production-build",
      "local-fixture-server",
      "browser-journeys",
      "export-verification",
    ]),
    notApplicableStages: new Set(["typecheck", "unit-test"]),
  },
  "node-python-fullstack": {
    id: "node-python-fullstack",
    title: "Frontend with Node or Python service",
    packageManagers: new Set(["npm", "pnpm", "yarn", "bun", "pip", "poetry", "other"]),
    executables: new Set(["npm", "pnpm", "yarn", "bun", "node", "python", "python3", "poetry"]),
    supportedStages: frontendStages,
    notApplicableStages: new Set(),
  },
  "python-source": {
    id: "python-source",
    title: "Source-only Python or desktop tool",
    packageManagers: new Set(["pip", "poetry", "none", "other"]),
    executables: new Set(["python", "python3", "poetry"]),
    supportedStages: browserlessStages,
    notApplicableStages: new Set([
      "production-build",
      "local-fixture-server",
      "browser-journeys",
      "export-verification",
    ]),
  },
};

type AdapterCommand = ResolvedPortfolioProject["declaration"]["execution"]["commands"][number];

export type PortfolioCapability = {
  stage: BenchmarkStage;
  declaredStatus: "supported" | "unsupported" | "not-applicable" | "undeclared";
  effectiveStatus: "supported" | "unsupported" | "not-applicable";
  reason: string;
  execution: "built-in" | "declared-command" | "none";
  command?: AdapterCommand;
};

export type PortfolioAdapterReport = {
  version: "1.0.0";
  generatedAt: string;
  projectId: string;
  adapter?: { id: PortfolioAdapterId; title: string };
  capabilities: PortfolioCapability[];
  issues: PortfolioIssue[];
  passed: boolean;
};

export type PortfolioAdapterStageResult = {
  version: "1.0.0";
  projectId: string;
  adapterId?: PortfolioAdapterId;
  stage: BenchmarkStage;
  status: "passed" | "failed" | "timed-out" | "unsupported" | "not-applicable";
  reason: string;
  process?: SnapshotProcessResult;
};

const scriptsByStage: Partial<Record<BenchmarkStage, ReadonlySet<string>>> = {
  typecheck: new Set(["typecheck", "check", "check:types"]),
  lint: new Set(["lint"]),
  "unit-test": new Set(["test", "test:unit"]),
  "production-build": new Set(["build"]),
  "local-fixture-server": new Set(["dev", "start", "preview", "serve", "fixture"]),
  "browser-journeys": new Set(["test:e2e", "test:browser", "test:journeys"]),
  "export-verification": new Set(["test:export", "verify:export"]),
};

function adapterIssue(
  code: string,
  path: string,
  message: string,
  severity: PortfolioIssue["severity"] = "error",
): PortfolioIssue {
  return { code, severity, path, message };
}

function isSafeRelativeScript(value: string, extension: RegExp): boolean {
  return (
    Boolean(value) &&
    !isAbsolute(value) &&
    !value.includes("\0") &&
    !value.split(/[\\/]/).includes("..") &&
    extension.test(value)
  );
}

function packageScript(command: AdapterCommand): string | undefined {
  const [first, second] = command.arguments;
  if (command.command === "npm" || command.command === "pnpm") {
    if (first === "test") return "test";
    return first === "run" ? second : undefined;
  }
  if (command.command === "yarn") return first === "run" ? second : first;
  if (command.command === "bun") return first === "run" ? second : undefined;
  return undefined;
}

function validateCommand(
  project: ResolvedPortfolioProject,
  definition: AdapterDefinition,
  command: AdapterCommand,
  index: number,
): PortfolioIssue[] {
  const issues: PortfolioIssue[] = [];
  const path = `execution.commands.${index}`;
  if (!definition.executables.has(command.command)) {
    issues.push(
      adapterIssue(
        "PORTFOLIO-ADAPTER-EXECUTABLE",
        `${path}.command`,
        `Executable ${command.command} is not allowed by adapter ${definition.id}.`,
      ),
    );
    return issues;
  }
  if (["npm", "pnpm", "yarn", "bun"].includes(command.command)) {
    if (project.declaration.technology.packageManager !== command.command) {
      issues.push(
        adapterIssue(
          "PORTFOLIO-ADAPTER-PACKAGE-MANAGER",
          `${path}.command`,
          `Command ${command.command} conflicts with declared package manager ${project.declaration.technology.packageManager}.`,
        ),
      );
    }
    const script = packageScript(command);
    if (!script || !scriptsByStage[command.stage]?.has(script)) {
      issues.push(
        adapterIssue(
          "PORTFOLIO-ADAPTER-SCRIPT",
          `${path}.arguments`,
          `Package script ${script ?? "unresolved"} is not allowed for stage ${command.stage}.`,
        ),
      );
    }
  } else if (command.command === "node") {
    if (!isSafeRelativeScript(command.arguments[0] ?? "", /\.(?:c|m)?js$/i)) {
      issues.push(
        adapterIssue(
          "PORTFOLIO-ADAPTER-SCRIPT",
          `${path}.arguments.0`,
          "Node commands must name a contained relative .js, .cjs, or .mjs script and cannot use eval flags.",
        ),
      );
    }
  } else if (command.command === "python" || command.command === "python3") {
    if (!isSafeRelativeScript(command.arguments[0] ?? "", /\.py$/i)) {
      issues.push(
        adapterIssue(
          "PORTFOLIO-ADAPTER-SCRIPT",
          `${path}.arguments.0`,
          "Python commands must name a contained relative .py script and cannot use command-string flags.",
        ),
      );
    }
  } else if (command.command === "poetry") {
    const [run, python, script] = command.arguments;
    if (run !== "run" || !["python", "python3"].includes(python ?? "") || !isSafeRelativeScript(script ?? "", /\.py$/i)) {
      issues.push(
        adapterIssue(
          "PORTFOLIO-ADAPTER-SCRIPT",
          `${path}.arguments`,
          "Poetry commands must use 'run python RELATIVE_SCRIPT.py'.",
        ),
      );
    }
  }
  if (command.allowDependencyNetwork && command.stage !== "production-build") {
    issues.push(
      adapterIssue(
        "PORTFOLIO-ADAPTER-NETWORK",
        `${path}.allowDependencyNetwork`,
        "Dependency network access is allowed only for the production-build stage.",
      ),
    );
  }
  return issues;
}

export function resolvePortfolioAdapter(project: ResolvedPortfolioProject): PortfolioAdapterReport {
  const adapterId = project.declaration.technology.adapter;
  const issues: PortfolioIssue[] = [];
  if (!adapterId) {
    return {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      projectId: project.declaration.id,
      capabilities: PORTFOLIO_STAGES.map((stage) => ({
        stage,
        declaredStatus:
          project.declaration.capabilities.find((entry) => entry.stage === stage)?.status ?? "undeclared",
        effectiveStatus: "unsupported",
        reason: "No stack adapter is declared for this project.",
        execution: "none",
      })),
      issues: [
        adapterIssue(
          "PORTFOLIO-ADAPTER-MISSING",
          "technology.adapter",
          "Declare a stack adapter before executing benchmark capabilities.",
          "warning",
        ),
      ],
      passed: true,
    };
  }

  const definition = definitions[adapterId];
  if (!definition.packageManagers.has(project.declaration.technology.packageManager)) {
    issues.push(
      adapterIssue(
        "PORTFOLIO-ADAPTER-PACKAGE-MANAGER",
        "technology.packageManager",
        `Package manager ${project.declaration.technology.packageManager} is incompatible with adapter ${adapterId}.`,
      ),
    );
  }

  for (const [index, command] of project.declaration.execution.commands.entries()) {
    issues.push(...validateCommand(project, definition, command, index));
  }

  const declarations = new Map(project.declaration.capabilities.map((entry) => [entry.stage, entry]));
  const commands = new Map(project.declaration.execution.commands.map((entry) => [entry.stage, entry]));
  const capabilities = PORTFOLIO_STAGES.map((stage): PortfolioCapability => {
    const declaration = declarations.get(stage);
    const command = commands.get(stage);
    if (!declaration) {
      return {
        stage,
        declaredStatus: "undeclared",
        effectiveStatus: definition.notApplicableStages.has(stage) ? "not-applicable" : "unsupported",
        reason: definition.notApplicableStages.has(stage)
          ? `${definition.title} does not use this capability.`
          : "The local registry does not declare this capability.",
        execution: "none",
      };
    }
    if (declaration.status !== "supported") {
      return {
        stage,
        declaredStatus: declaration.status,
        effectiveStatus: declaration.status,
        reason: declaration.reason,
        execution: "none",
      };
    }
    if (!definition.supportedStages.has(stage)) {
      issues.push(
        adapterIssue(
          "PORTFOLIO-ADAPTER-STAGE",
          `capabilities.${stage}`,
          `Stage ${stage} is declared supported but adapter ${adapterId} cannot execute it.`,
        ),
      );
      return {
        stage,
        declaredStatus: "supported",
        effectiveStatus: definition.notApplicableStages.has(stage) ? "not-applicable" : "unsupported",
        reason: `Adapter ${adapterId} cannot execute this stage.`,
        execution: "none",
      };
    }
    if (
      stage === "source-audit" ||
      (project.declaration.verification &&
        (stage === "local-fixture-server" || stage === "browser-journeys"))
    ) {
      return {
        stage,
        declaredStatus: "supported",
        effectiveStatus: "supported",
        reason:
          stage === "source-audit"
            ? declaration.reason
            : "The portfolio runner provides this stage from the declared static fixture and product contract.",
        execution: "built-in",
      };
    }
    if (!command) {
      issues.push(
        adapterIssue(
          "PORTFOLIO-ADAPTER-COMMAND-MISSING",
          `execution.commands.${stage}`,
          `Stage ${stage} is supported but has no registry-declared command.`,
          "warning",
        ),
      );
      return {
        stage,
        declaredStatus: "supported",
        effectiveStatus: "unsupported",
        reason: "No registry-declared command is available.",
        execution: "none",
      };
    }
    const commandIndex = project.declaration.execution.commands.indexOf(command);
    const commandErrors = validateCommand(project, definition, command, commandIndex).some(
      (entry) => entry.severity === "error",
    );
    return {
      stage,
      declaredStatus: "supported",
      effectiveStatus: commandErrors ? "unsupported" : "supported",
      reason: commandErrors ? "The declared command violates adapter policy." : declaration.reason,
      execution: commandErrors ? "none" : "declared-command",
      ...(commandErrors ? {} : { command }),
    };
  });

  for (const command of project.declaration.execution.commands) {
    const declaration = declarations.get(command.stage);
    if (!declaration || declaration.status !== "supported") {
      issues.push(
        adapterIssue(
          "PORTFOLIO-ADAPTER-UNDECLARED-COMMAND",
          `execution.commands.${command.stage}`,
          `Command for ${command.stage} has no matching supported capability declaration.`,
        ),
      );
    }
  }

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    projectId: project.declaration.id,
    adapter: { id: adapterId, title: definition.title },
    capabilities,
    issues,
    passed: !issues.some((entry) => entry.severity === "error"),
  };
}

export async function runPortfolioAdapterStage(
  snapshot: PortfolioSnapshot,
  stage: BenchmarkStage,
): Promise<PortfolioAdapterStageResult> {
  const report = resolvePortfolioAdapter(snapshot.project);
  const capability = report.capabilities.find((entry) => entry.stage === stage)!;
  const adapterId = report.adapter?.id;
  if (!report.passed || capability.effectiveStatus !== "supported") {
    return {
      version: "1.0.0",
      projectId: snapshot.project.declaration.id,
      ...(adapterId ? { adapterId } : {}),
      stage,
      status: capability.effectiveStatus === "supported" ? "unsupported" : capability.effectiveStatus,
      reason: report.passed ? capability.reason : "The adapter declaration violates execution policy.",
    };
  }
  if (capability.execution === "built-in") {
    return {
      version: "1.0.0",
      projectId: snapshot.project.declaration.id,
      ...(adapterId ? { adapterId } : {}),
      stage,
      status: "passed",
      reason: "The approved snapshot is available for the built-in source audit.",
    };
  }
  const command = capability.command!;
  const processResult = await runPortfolioSnapshotProcess(snapshot, {
    command: command.command,
    arguments: command.arguments,
    cwd: command.cwd,
    timeoutMs: command.timeoutMs,
    maxOutputBytes: command.maxOutputBytes,
    allowDependencyNetwork: command.allowDependencyNetwork,
  });
  const status = processResult.timedOut
    ? "timed-out"
    : processResult.exitCode === 0
      ? "passed"
      : "failed";
  return {
    version: "1.0.0",
    projectId: snapshot.project.declaration.id,
    ...(adapterId ? { adapterId } : {}),
    stage,
    status,
    reason:
      status === "passed"
        ? "The declared stage command completed successfully in the isolated snapshot."
        : status === "timed-out"
          ? `The declared stage command exceeded ${command.timeoutMs} milliseconds.`
          : `The declared stage command exited with code ${processResult.exitCode}.`,
    process: processResult,
  };
}
