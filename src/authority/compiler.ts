import { createHash } from "node:crypto";
import { readFile, readdir, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { parse } from "yaml";

import { loadDesignEngineeringModel } from "../model/loader.js";
import type { DesignEngineeringModel } from "../model/schema.js";
import { validateDesignEngineeringModel } from "../model/validator.js";
import { retrievalCategories, retrievalScopeSchema, type RetrievalCategory } from "../retrieval/schema.js";
import {
  AUTHORITY_COMPILER_VERSION,
  COMPILED_AUTHORITY_VERSION,
  compiledAuthoritySchema,
  ruleRegistrySchema,
  type AuthorityCompilationReport,
  type CompiledAuthority,
  type RuleRegistry,
  type RuleRegistryEntry,
} from "./schema.js";

const POLICY_SOURCE = "policy:ztothez-design-engineering-policy";
const DEFAULT_MODEL_PATH = "model/ztothez-design-engineering-model.json";
const DEFAULT_ADMISSION_PATH = "governance/knowledge-admission.json";
const DEFAULT_RETRIEVAL_SCOPE_PATH = "knowledge-base/retrieval-scope.yaml";
const DEFAULT_RULE_REGISTRY_PATH = "governance/rule-registry.json";
const DEFAULT_COMPILED_AUTHORITY_PATH = "model/compiled-authority.json";

type AdmissionManifest = {
  records: Array<{
    id: string;
    path: string;
    contentDigest: { algorithm: "sha256"; value: string };
    sourceIdentity: { sourceRecord: string; sourceOrigin: string };
    decisions: { retrieval: "included" | "excluded"; package: "approved"; disposition: "admit" };
  }>;
};

type CompilationFinding = AuthorityCompilationReport["findings"][number];

export type AuthorityCompilerOptions = {
  projectRoot?: string;
  modelPath?: string;
  admissionPath?: string;
  retrievalScopePath?: string;
  retainedRuleRegistryPath?: string;
  retainedCompiledAuthorityPath?: string;
};

export type AuthorityCompilation = {
  registry: RuleRegistry;
  authority: CompiledAuthority;
  report: AuthorityCompilationReport;
};

function portable(path: string): string {
  return path.split(sep).join("/");
}

function isPathContained(baseDirectory: string, candidatePath: string): boolean {
  const relation = relative(baseDirectory, candidatePath);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stable(item)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

async function sha256File(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function readJsonFile(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function filesUnder(root: string, current = root): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const paths: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(current, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "dist-test", ".git"].includes(entry.name)) continue;
      paths.push(...(await filesUnder(root, path)));
    } else if (entry.isFile()) {
      paths.push(portable(relative(root, path)));
    }
  }
  return paths.sort((left, right) => left.localeCompare(right));
}

async function sourceFilesForRuleDiscovery(projectRoot: string): Promise<string[]> {
  const sourceRoots = ["src", "cli", "knowledge-base", "model"];
  const all = [];
  for (const sourceRoot of sourceRoots) {
    all.push(...(await filesUnder(projectRoot, join(projectRoot, sourceRoot))));
  }
  return all
    .map((path) => portable(path))
    .filter((path) => {
      if (path === "model/compiled-authority.json") return false;
      if (path === "model/compiled-authority.schema.json") return false;
      if (path === "governance/rule-registry.json") return false;
      return /\.(?:ts|json|ya?ml|md)$/.test(path);
    })
    .sort((left, right) => left.localeCompare(right));
}

function inferCategory(ruleId: string): string {
  if (ruleId.startsWith("ZTDE-MODEL-REL-")) return "model-relationship";
  if (ruleId.startsWith("ZTDE-MODEL-TRACE-")) return "model-decision-trace";
  if (ruleId.startsWith("ZTDE-MODEL-") && /-[0-9]{3}$/.test(ruleId)) return "model-entity-or-validator";
  const prefix = /^ZTDE-([A-Z0-9]+)-/.exec(ruleId)?.[1] ?? "POLICY";
  const names: Record<string, string> = {
    A11Y: "accessibility",
    ARCH: "architecture",
    BRIEF: "product-brief-validation",
    CMP: "comparison-validation",
    DESIGN: "design-token-validation",
    DI: "design-intelligence-validation",
    INFO: "information-design-validation",
    MNT: "maintainer-review-validation",
    REPO: "repository-validation",
    RUNTIME: "runtime-verification",
    SCAN: "repository-scan-boundary",
    SEC: "security-validation",
    SLOP: "anti-slop-validation",
    STATE: "state-recovery-validation",
    TRUST: "interface-trust-validation",
  };
  return names[prefix] ?? "project-policy-validation";
}

function modelLinksFor(ruleId: string, model: DesignEngineeringModel): string[] {
  const all = new Set(model.entities.map((entity) => entity.id));
  const candidates: string[] = [];
  if (ruleId.startsWith("ZTDE-MODEL-") && all.has(ruleId)) candidates.push(ruleId);
  if (ruleId.includes("A11Y") || ruleId.includes("RUNTIME")) candidates.push("ZTDE-MODEL-A11Y-001", "ZTDE-MODEL-VERIFY-002");
  if (ruleId.includes("ARCH") || ruleId.includes("SCAN")) candidates.push("ZTDE-MODEL-COMPONENT-001");
  if (ruleId.includes("DESIGN") || ruleId.includes("DI")) candidates.push("ZTDE-MODEL-TOKEN-001", "ZTDE-MODEL-VISUAL-001");
  if (ruleId.includes("INFO")) candidates.push("ZTDE-MODEL-INFO-001");
  if (ruleId.includes("TRUST") || ruleId.includes("STATE")) candidates.push("ZTDE-MODEL-STATE-001");
  if (ruleId.includes("BRIEF")) candidates.push("ZTDE-MODEL-TASK-001");
  if (ruleId.includes("SLOP") || ruleId.includes("SEC")) candidates.push("ZTDE-MODEL-ABSTENTION-001", "ZTDE-MODEL-EVIDENCE-001");
  if (ruleId.includes("CMP") || ruleId.includes("MNT")) candidates.push("ZTDE-MODEL-EVIDENCE-001", "ZTDE-MODEL-VERIFY-004");
  if (candidates.length === 0) candidates.push("ZTDE-MODEL-ABSTENTION-001");
  return [...new Set(candidates.filter((id) => all.has(id)))].sort();
}

function evidenceClassFor(ruleId: string): RuleRegistryEntry["evidenceClass"] {
  if (ruleId.includes("A11Y")) return "official-standard";
  if (ruleId.includes("RUNTIME") || ruleId.includes("SCAN")) return "automated-verification";
  if (ruleId.includes("CMP") || ruleId.includes("MNT")) return "human-expert-review";
  if (ruleId.startsWith("ZTDE-MODEL-")) return "owner-authored";
  return "owner-authored";
}

function authorityClassFor(ruleId: string): RuleRegistryEntry["authorityClass"] {
  if (ruleId.includes("A11Y")) return "official-requirement";
  if (ruleId.includes("RUNTIME") || ruleId.includes("CMP") || ruleId.includes("MNT")) return "measured-evidence";
  if (ruleId.startsWith("ZTDE-MODEL-") || ruleId.includes("BRIEF") || ruleId.includes("DI") || ruleId.includes("INFO") || ruleId.includes("TRUST")) return "heuristic";
  return "project-policy";
}

function sourceIdsFor(ruleId: string, locations: string[], model: DesignEngineeringModel, admissionByPath: Map<string, AdmissionManifest["records"][number]>): string[] {
  const modelEntity = model.entities.find((entity) => entity.id === ruleId);
  if (modelEntity) return modelEntity.sourceRefs.sort();
  const sourceIds = new Set<string>();
  if (ruleId.includes("A11Y")) sourceIds.add("standard:wcag-2.2");
  for (const location of locations) {
    const admitted = admissionByPath.get(location);
    if (admitted) sourceIds.add(`admission:${admitted.id}`);
  }
  sourceIds.add(POLICY_SOURCE);
  return [...sourceIds].sort();
}

async function discoverRuleRegistry(projectRoot: string, model: DesignEngineeringModel, admission: AdmissionManifest): Promise<RuleRegistry> {
  const files = await sourceFilesForRuleDiscovery(projectRoot);
  const ruleLocations = new Map<string, Set<string>>();
  const pattern = /ZTDE-[A-Z0-9-]+-[0-9]{3}/g;
  for (const path of files) {
    const absolutePath = join(projectRoot, path);
    const content = await readFile(absolutePath, "utf8");
    for (const match of content.matchAll(pattern)) {
      const id = match[0];
      const locations = ruleLocations.get(id) ?? new Set<string>();
      locations.add(path);
      ruleLocations.set(id, locations);
    }
  }

  const admissionByPath = new Map(admission.records.map((record) => [record.path, record]));
  const rules = [...ruleLocations.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, locations]) => {
      const implementationLocations = [...locations].sort((left, right) => left.localeCompare(right));
      return {
        id,
        owner: "ZtotheZ" as const,
        category: inferCategory(id),
        authorityClass: authorityClassFor(id),
        evidenceClass: evidenceClassFor(id),
        rationale: `Stable ${id} rule registry entry generated from maintained public source and bound to the V5 shadow model. This entry identifies where the rule is implemented or declared without making project policy an external legal or platform requirement.`,
        implementationLocations,
        modelLinks: modelLinksFor(id, model),
        sourceIds: sourceIdsFor(id, implementationLocations, model, admissionByPath),
      };
    });

  return ruleRegistrySchema.parse({
    version: COMPILED_AUTHORITY_VERSION,
    compilerVersion: AUTHORITY_COMPILER_VERSION,
    authority: "SKILL.md",
    generatedAt: "deterministic-build",
    policy: {
      generatedFromCurrentPublicBoundary: true,
      projectPolicyIsNotExternalLaw: true,
      privateSourcesAreNotRuntimeFallbacks: true,
    },
    rules,
  });
}

function evidenceClassForSource(record: AdmissionManifest["records"][number]): RuleRegistryEntry["evidenceClass"] {
  if (record.sourceIdentity.sourceOrigin === "user-owned") return "owner-authorized-product-evidence";
  if (record.path.includes("benchmarks/corpus/") || record.path.includes("fixtures")) return "synthetic-fixture";
  return "owner-authored";
}

function addFinding(findings: CompilationFinding[], path: string, message: string, remediation: string): void {
  findings.push({ ruleId: "ZTDE-AUTHORITY-001", severity: "error", path, message, remediation });
}

export async function compileAuthority(options: AuthorityCompilerOptions = {}): Promise<AuthorityCompilation> {
  const projectRoot = await realpath(resolve(options.projectRoot ?? process.cwd()));
  const modelPath = options.modelPath ?? DEFAULT_MODEL_PATH;
  const admissionPath = options.admissionPath ?? DEFAULT_ADMISSION_PATH;
  const retrievalScopePath = options.retrievalScopePath ?? DEFAULT_RETRIEVAL_SCOPE_PATH;
  const findings: CompilationFinding[] = [];

  for (const path of [modelPath, admissionPath, retrievalScopePath]) {
    if (path.includes("\0") || isAbsolute(path)) {
      throw new Error(`Compiler input must be repository-relative: ${path}`);
    }
  }

  const [model, admission, retrievalScope] = await Promise.all([
    loadDesignEngineeringModel(modelPath, projectRoot),
    readJsonFile(join(projectRoot, admissionPath)) as Promise<AdmissionManifest>,
    readFile(join(projectRoot, retrievalScopePath), "utf8").then((source) => retrievalScopeSchema.parse(parse(source))),
  ]);
  const modelReport = await validateDesignEngineeringModel(model, projectRoot);
  if (modelReport.status !== "pass") {
    addFinding(findings, modelPath, "The shadow model does not validate.", "Run zz-design validate-model and resolve model findings before compiling authority.");
  }

  const registry = await discoverRuleRegistry(projectRoot, model, admission);
  const admittedByPath = new Map(admission.records.map((record) => [record.path, record]));
  const retrievalPaths = new Set<string>();
  const retrievalDocuments: CompiledAuthority["knowledge"]["retrievalDocuments"] = [];

  for (const category of retrievalCategories) {
    for (const path of retrievalScope.categories[category].files) {
      retrievalPaths.add(path);
      if (path === "SKILL.md") {
        retrievalDocuments.push({
          path,
          category,
          sourceId: POLICY_SOURCE,
          sha256: await sha256File(join(projectRoot, path)),
          authority: "authoritative",
        });
        continue;
      }
      const record = admittedByPath.get(path);
      if (!record) {
        addFinding(findings, path, "Retrieval scope contains a path outside the admission manifest.", "Admit the path or remove it from retrieval-scope.yaml.");
        continue;
      }
      retrievalDocuments.push({
        path,
        category,
        sourceId: `admission:${record.id}`,
        sha256: record.contentDigest.value,
        authority: "approved",
      });
    }
  }

  const sources: CompiledAuthority["knowledge"]["sources"] = [];
  for (const record of [...admission.records].sort((left, right) => left.path.localeCompare(right.path))) {
    const filePath = join(projectRoot, record.path);
    const resolvedFile = await realpath(filePath);
    if (!isPathContained(projectRoot, resolvedFile)) {
      addFinding(findings, record.path, "Admitted knowledge path resolves outside the project root.", "Remove symlinks or escaping paths from the admitted manifest.");
      continue;
    }
    const fileStats = await stat(resolvedFile);
    if (!fileStats.isFile()) {
      addFinding(findings, record.path, "Admitted knowledge path is not a regular file.", "Replace the path with a regular maintained file.");
      continue;
    }
    const actualDigest = await sha256File(resolvedFile);
    if (actualDigest !== record.contentDigest.value) {
      addFinding(findings, record.path, "Admitted knowledge digest drifted.", "Regenerate and review the admission manifest before compiling authority.");
    }
    sources.push({
      id: record.id,
      path: record.path,
      sha256: record.contentDigest.value,
      sourceRecord: record.sourceIdentity.sourceRecord,
      evidenceClass: evidenceClassForSource(record),
      retrieval: retrievalPaths.has(record.path) ? "included" : "excluded",
      package: record.decisions.package,
    });
  }

  const exactReadDocuments = retrievalDocuments.filter((document) => document.path !== "SKILL.md");
  const registryJson = stableJson(registry);
  const payloadWithoutHash = {
    version: COMPILED_AUTHORITY_VERSION,
    compilerVersion: AUTHORITY_COMPILER_VERSION,
    product: "ZtotheZ Design Engineering",
    authority: "SKILL.md",
    lifecycle: "shadow",
    cutoverStatus: "not-authoritative-until-v5-item-8",
    buildMetadata: {
      generatedAt: "deterministic-build",
      generatedBy: "ztothez-design compile-authority",
      privateSourcesIncluded: false,
    },
    policy: {
      markdownRemainsWorkflowAuthorityDuringMigration: true,
      supportingFilesCannotOverrideSkill: true,
      privateSourcesAreRuntimeFallbacks: false,
      noMatchProducesKnowledgeGap: true,
      projectPolicyIsNotExternalLaw: true,
    },
    integrity: {
      admissionSha256: await sha256File(join(projectRoot, admissionPath)),
      modelSha256: await sha256File(join(projectRoot, modelPath)),
      retrievalScopeSha256: await sha256File(join(projectRoot, retrievalScopePath)),
      ruleRegistrySha256: sha256Text(registryJson),
      payloadSha256: "0".repeat(64),
    },
    knowledge: {
      admittedFileCount: sources.length,
      retrievalFileCount: retrievalDocuments.length,
      sources,
      retrievalDocuments: retrievalDocuments.sort((left, right) => left.path.localeCompare(right.path)),
      exactReadDocuments: exactReadDocuments.sort((left, right) => left.path.localeCompare(right.path)),
    },
    model: {
      entityCount: model.entities.length,
      relationshipCount: model.relationships.length,
      conflictCount: model.conflicts.length,
      decisionTraceCount: model.decisionTraces.length,
      entityIds: model.entities.map((entity) => entity.id).sort(),
    },
    ruleRegistry: {
      ruleCount: registry.rules.length,
      ruleIds: registry.rules.map((rule) => rule.id).sort(),
      sourcePaths: [...new Set(registry.rules.flatMap((rule) => rule.implementationLocations))].sort(),
    },
  };
  const payloadSha256 = sha256Text(stableJson(payloadWithoutHash));
  const authority = compiledAuthoritySchema.parse({
    ...payloadWithoutHash,
    integrity: {
      ...payloadWithoutHash.integrity,
      payloadSha256,
    },
  });

  return {
    registry,
    authority,
    report: {
      version: COMPILED_AUTHORITY_VERSION,
      status: findings.length > 0 ? "fail" : "pass",
      compilerVersion: AUTHORITY_COMPILER_VERSION,
      authorityPath: "SKILL.md",
      lifecycle: "shadow",
      admittedFileCount: sources.length,
      retrievalFileCount: retrievalDocuments.length,
      exactReadFileCount: exactReadDocuments.length,
      modelEntityCount: model.entities.length,
      ruleCount: registry.rules.length,
      payloadSha256,
      findingCount: findings.length,
      findings,
    },
  };
}

export async function readRetainedAuthority(options: AuthorityCompilerOptions = {}): Promise<{
  registry: RuleRegistry;
  authority: CompiledAuthority;
}> {
  const projectRoot = await realpath(resolve(options.projectRoot ?? process.cwd()));
  const registryPath = options.retainedRuleRegistryPath ?? DEFAULT_RULE_REGISTRY_PATH;
  const authorityPath = options.retainedCompiledAuthorityPath ?? DEFAULT_COMPILED_AUTHORITY_PATH;
  const resolvedRegistryPath = isAbsolute(registryPath) ? registryPath : join(projectRoot, registryPath);
  const resolvedAuthorityPath = isAbsolute(authorityPath) ? authorityPath : join(projectRoot, authorityPath);
  return {
    registry: ruleRegistrySchema.parse(await readJsonFile(resolvedRegistryPath)),
    authority: compiledAuthoritySchema.parse(await readJsonFile(resolvedAuthorityPath)),
  };
}
