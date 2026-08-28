import { lstat, readdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

import { ZodError } from "zod";

import {
  containsPrunedDirectory,
  isContained,
  isCustomExcluded,
  portablePath,
} from "./files.js";
import { loadPortfolioRegistry } from "./loader.js";
import type {
  PortfolioIssue,
  PortfolioProject,
  PortfolioRegistry,
  PortfolioRegistryReport,
  PortfolioRoot,
} from "./schema.js";

const REPORT_VERSION = "1.0.0";
const DISCOVERY_MARKERS = new Set([
  "Cargo.toml",
  "composer.json",
  "go.mod",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
]);

export type ResolvedPortfolioRoot = {
  declaration: PortfolioRoot;
  canonicalPath: string;
};

export type ResolvedPortfolioProject = {
  declaration: PortfolioProject;
  root: ResolvedPortfolioRoot;
  canonicalPath: string;
};

export type PortfolioRegistryInspection = {
  report: PortfolioRegistryReport;
  registry?: PortfolioRegistry;
  roots: ResolvedPortfolioRoot[];
  projects: ResolvedPortfolioProject[];
};

export type PortfolioCandidate = {
  root: string;
  rootClass: PortfolioRoot["class"];
  path: string;
  markers: string[];
  registeredProject?: string;
};

export type PortfolioInventoryReport = {
  version: string;
  generatedAt: string;
  registryId?: string;
  candidates: PortfolioCandidate[];
  issues: PortfolioIssue[];
  passed: boolean;
};

function issue(
  code: string,
  path: string,
  message: string,
  severity: PortfolioIssue["severity"] = "error",
): PortfolioIssue {
  return { code, severity, path, message };
}

function relationIsNested(left: string, right: string): boolean {
  return left !== right && (isContained(left, right) || isContained(right, left));
}

function emptyCounts(): PortfolioRegistryReport["counts"] {
  return { roots: 0, projects: 0, enabled: 0, development: 0, holdout: 0, excluded: 0 };
}

export async function inspectPortfolioRegistry(path: string): Promise<PortfolioRegistryInspection> {
  const issues: PortfolioIssue[] = [];
  let registry: PortfolioRegistry | undefined;

  try {
    registry = await loadPortfolioRegistry(path);
  } catch (error) {
    if (error instanceof ZodError) {
      for (const entry of error.issues) {
        issues.push(issue("PORTFOLIO-SCHEMA", entry.path.map(String).join("."), entry.message));
      }
    } else {
      issues.push(issue("PORTFOLIO-PARSE", "registry", error instanceof Error ? error.message : String(error)));
    }
  }

  if (!registry) {
    return {
      report: {
        version: REPORT_VERSION,
        generatedAt: new Date().toISOString(),
        counts: emptyCounts(),
        projects: [],
        issues,
        passed: false,
      },
      roots: [],
      projects: [],
    };
  }

  const roots: ResolvedPortfolioRoot[] = [];
  for (const [index, root] of registry.roots.entries()) {
    const field = `roots.${index}.path`;
    if (!isAbsolute(root.path)) {
      issues.push(issue("PORTFOLIO-ROOT-PATH", field, "Local root paths must be absolute."));
      continue;
    }
    try {
      const canonicalPath = await realpath(root.path);
      const stats = await lstat(canonicalPath);
      if (!stats.isDirectory()) {
        issues.push(issue("PORTFOLIO-ROOT-TYPE", field, "Portfolio roots must resolve to directories."));
        continue;
      }
      roots.push({ declaration: root, canonicalPath });
    } catch (error) {
      issues.push(
        issue(
          "PORTFOLIO-ROOT-MISSING",
          field,
          `Portfolio root is unavailable: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }

  for (let left = 0; left < roots.length; left += 1) {
    for (let right = left + 1; right < roots.length; right += 1) {
      const first = roots[left]!;
      const second = roots[right]!;
      if (first.canonicalPath === second.canonicalPath || relationIsNested(first.canonicalPath, second.canonicalPath)) {
        issues.push(
          issue(
            "PORTFOLIO-DUPLICATE-ROOT",
            "roots",
            `Roots ${first.declaration.id} and ${second.declaration.id} resolve to duplicate or nested locations.`,
          ),
        );
      }
    }
  }

  const rootById = new Map(roots.map((root) => [root.declaration.id, root]));
  const projects: ResolvedPortfolioProject[] = [];
  for (const [index, project] of registry.projects.entries()) {
    const field = `projects.${index}.path`;
    const root = rootById.get(project.root);
    if (!root) continue;

    if (project.enabled && ["third-party-reference", "unknown"].includes(project.ownership)) {
      issues.push(
        issue(
          "PORTFOLIO-OWNERSHIP",
          `projects.${index}.ownership`,
          "Third-party or unknown-origin projects cannot be enabled for portfolio benchmarking.",
        ),
      );
    }
    if (
      project.confidentiality === "private-local" &&
      (project.publication.sourceExcerpts || project.publication.screenshots || project.publication.machineReports)
    ) {
      issues.push(
        issue(
          "PORTFOLIO-PUBLICATION",
          `projects.${index}.publication`,
          "Private-local projects cannot publish source excerpts, screenshots, or machine reports.",
        ),
      );
    }
    if (
      project.ownership === "client-authorized" &&
      (project.publication.sourceExcerpts || project.publication.screenshots || project.publication.machineReports)
    ) {
      issues.push(
        issue(
          "PORTFOLIO-CLIENT-PUBLICATION",
          `projects.${index}.publication`,
          "Client projects default to zero publishable raw artifacts.",
        ),
      );
    }

    const lexicalPath = resolve(root.canonicalPath, project.path);
    if (!isContained(root.canonicalPath, lexicalPath)) {
      issues.push(issue("PORTFOLIO-PROJECT-ESCAPE", field, "Project path resolves outside its approved root."));
      continue;
    }
    try {
      const canonicalPath = await realpath(lexicalPath);
      const stats = await lstat(canonicalPath);
      if (!stats.isDirectory()) {
        issues.push(issue("PORTFOLIO-PROJECT-TYPE", field, "Project paths must resolve to directories."));
        continue;
      }
      if (!isContained(root.canonicalPath, canonicalPath)) {
        issues.push(issue("PORTFOLIO-PROJECT-ESCAPE", field, "Project real path escapes its approved root."));
        continue;
      }

      const entrypoint = resolve(canonicalPath, project.technology.entrypoint);
      if (!isContained(canonicalPath, entrypoint)) {
        issues.push(
          issue(
            "PORTFOLIO-ENTRYPOINT-ESCAPE",
            `projects.${index}.technology.entrypoint`,
            "Entrypoint resolves outside the project root.",
          ),
        );
      } else {
        try {
          const entryStats = await lstat(entrypoint);
          if (!entryStats.isFile()) throw new Error("not a regular file");
        } catch {
          issues.push(
            issue(
              "PORTFOLIO-ENTRYPOINT-MISSING",
              `projects.${index}.technology.entrypoint`,
              `Declared entrypoint is unavailable: ${project.technology.entrypoint}.`,
            ),
          );
        }
      }
      projects.push({ declaration: project, root, canonicalPath });
    } catch (error) {
      issues.push(
        issue(
          "PORTFOLIO-PROJECT-MISSING",
          field,
          `Project is unavailable: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    }
  }

  for (let left = 0; left < projects.length; left += 1) {
    for (let right = left + 1; right < projects.length; right += 1) {
      const first = projects[left]!;
      const second = projects[right]!;
      if (first.canonicalPath === second.canonicalPath || relationIsNested(first.canonicalPath, second.canonicalPath)) {
        issues.push(
          issue(
            "PORTFOLIO-DUPLICATE-PROJECT",
            "projects",
            `Projects ${first.declaration.id} and ${second.declaration.id} resolve to duplicate or nested locations.`,
          ),
        );
      }
    }
  }

  const resolvedIds = new Set(projects.map((project) => project.declaration.id));
  const reportProjects = registry.projects.map((project) => ({
    id: project.id,
    root: project.root,
    rootClass: registry.roots.find((root) => root.id === project.root)?.class,
    enabled: project.enabled,
    cohort: project.cohort,
    ownership: project.ownership,
    confidentiality: project.confidentiality,
    resolved: resolvedIds.has(project.id),
  }));
  const counts = {
    roots: registry.roots.length,
    projects: registry.projects.length,
    enabled: registry.projects.filter((project) => project.enabled).length,
    development: registry.projects.filter((project) => project.cohort === "development").length,
    holdout: registry.projects.filter((project) => project.cohort === "holdout").length,
    excluded: registry.projects.filter((project) => project.cohort === "excluded").length,
  };

  const report: PortfolioRegistryReport = {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    registryId: registry.id,
    counts,
    projects: reportProjects,
    issues,
    passed: !issues.some((entry) => entry.severity === "error"),
  };
  return { report, registry, roots, projects };
}

export async function discoverPortfolioCandidates(
  inspection: PortfolioRegistryInspection,
): Promise<PortfolioInventoryReport> {
  const candidateMap = new Map<string, PortfolioCandidate>();
  const issues = [...inspection.report.issues];

  for (const root of inspection.roots) {
    let directoriesVisited = 0;
    const walk = async (directory: string, depth: number): Promise<void> => {
      directoriesVisited += 1;
      if (directoriesVisited > 50_000) {
        issues.push(
          issue(
            "PORTFOLIO-INVENTORY-LIMIT",
            root.declaration.id,
            "Discovery stopped after 50,000 directories.",
          ),
        );
        return;
      }
      const entries = (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      const markerNames = entries
        .filter((entry) => entry.isFile() && DISCOVERY_MARKERS.has(entry.name))
        .map((entry) => entry.name);
      if (markerNames.length > 0) {
        const relativeDirectory = portablePath(relative(root.canonicalPath, directory)) || ".";
        const registeredProject = inspection.projects.find((project) =>
          isContained(project.canonicalPath, directory),
        );
        candidateMap.set(`${root.declaration.id}:${relativeDirectory}`, {
          root: root.declaration.id,
          rootClass: root.declaration.class,
          path: relativeDirectory,
          markers: markerNames,
          ...(registeredProject ? { registeredProject: registeredProject.declaration.id } : {}),
        });
      }
      if (depth >= root.declaration.discoveryDepth) return;
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
        const child = join(directory, entry.name);
        const relativeChild = portablePath(relative(root.canonicalPath, child));
        if (
          containsPrunedDirectory(relativeChild) ||
          isCustomExcluded(relativeChild, root.declaration.excludes)
        ) {
          continue;
        }
        await walk(child, depth + 1);
      }
    };

    try {
      await walk(root.canonicalPath, 0);
    } catch (error) {
      issues.push(
        issue(
          "PORTFOLIO-INVENTORY-READ",
          root.declaration.id,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    ...(inspection.registry ? { registryId: inspection.registry.id } : {}),
    candidates: [...candidateMap.values()].sort(
      (left, right) => left.root.localeCompare(right.root) || left.path.localeCompare(right.path),
    ),
    issues,
    passed: !issues.some((entry) => entry.severity === "error"),
  };
}

export function projectById(
  inspection: PortfolioRegistryInspection,
  projectId: string,
): ResolvedPortfolioProject {
  const project = inspection.projects.find((entry) => entry.declaration.id === projectId);
  if (!project) throw new Error(`Portfolio project is unavailable or unregistered: ${projectId}`);
  if (!project.declaration.enabled) throw new Error(`Portfolio project is disabled: ${projectId}`);
  return project;
}
