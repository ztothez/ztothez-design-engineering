import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { DesignEngineeringModel, ModelValidationReport } from "./schema.js";

type AdmissionManifest = {
  officialStandards: Array<{ id: string }>;
  records: Array<{ id: string; path: string; decisions: { disposition: string } }>;
};

function addFinding(
  findings: ModelValidationReport["findings"],
  ruleId: string,
  severity: "error" | "warning",
  path: string,
  message: string,
  remediation: string,
): void {
  findings.push({ ruleId, severity, path, message, remediation });
}

function categoryCoverage(model: DesignEngineeringModel): Record<string, number> {
  const coverage: Record<string, number> = {};
  for (const entity of model.entities) {
    coverage[entity.category] = (coverage[entity.category] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(coverage).sort(([left], [right]) => left.localeCompare(right)));
}

export async function validateDesignEngineeringModel(
  model: DesignEngineeringModel,
  projectRoot = process.cwd(),
): Promise<ModelValidationReport> {
  const findings: ModelValidationReport["findings"] = [];
  const admission = JSON.parse(
    await readFile(join(projectRoot, model.sourceRegistry.admissionManifest), "utf8"),
  ) as AdmissionManifest;
  const admittedIds = new Set(admission.records.map((record) => record.id));
  const admittedPaths = new Set(admission.records.map((record) => record.path));
  const officialStandards = new Set(admission.officialStandards.map((standard) => standard.id));
  const entityIds = new Set(model.entities.map((entity) => entity.id));

  if (entityIds.size !== model.entities.length) {
    addFinding(findings, "ZTDE-MODEL-001", "error", "entities", "Model entity IDs are not unique.", "Give every entity one stable unique ZTDE-MODEL ID.");
  }

  const requiredCategories = [
    "product-archetype",
    "user-task",
    "state-recovery-contract",
    "quality-attribute",
    "design-token",
    "component-responsibility",
    "information-priority",
    "interaction-pattern",
    "visual-composition",
    "accessibility-constraint",
    "evidence-class",
    "verification-method",
    "conflict-policy",
    "exception-policy",
    "abstention-policy",
  ];
  const coverage = categoryCoverage(model);
  for (const category of requiredCategories) {
    if (!coverage[category]) {
      addFinding(findings, "ZTDE-MODEL-101", "error", `entities.${category}`, `Required model category is missing: ${category}.`, "Add at least one independently authored entity in this category.");
    }
  }

  for (const [index, entity] of model.entities.entries()) {
    if (entity.lifecycle === "active") {
      addFinding(findings, "ZTDE-MODEL-201", "error", `entities[${index}].lifecycle`, `Entity ${entity.id} is active before V5 cutover qualification.`, "Keep V5 Item 4 entities in shadow mode until Item 8 proves parity and cutover is approved.");
    }
    if (!entity.rationale.trim()) {
      addFinding(findings, "ZTDE-MODEL-202", "error", `entities[${index}].rationale`, `Entity ${entity.id} lacks rationale.`, "Record project-owned rationale for the entity.");
    }

    let hasAvailableSource = false;
    for (const sourceRef of entity.sourceRefs) {
      if (sourceRef.startsWith("admission:")) {
        const sourceId = sourceRef.slice("admission:".length);
        if (admittedIds.has(sourceId)) {
          hasAvailableSource = true;
        } else {
          addFinding(findings, "ZTDE-MODEL-301", "error", `entities[${index}].sourceRefs`, `Entity ${entity.id} references unknown admission source ${sourceId}.`, "Reference an admitted knowledge artifact ID from governance/knowledge-admission.json.");
        }
      } else if (sourceRef.startsWith("standard:")) {
        const standardId = sourceRef.slice("standard:".length);
        if (officialStandards.has(standardId)) {
          hasAvailableSource = true;
        } else {
          addFinding(findings, "ZTDE-MODEL-302", "error", `entities[${index}].sourceRefs`, `Entity ${entity.id} references unknown official standard ${standardId}.`, "Reference an official standard declared by the admission manifest.");
        }
      } else if (sourceRef === "policy:ztothez-design-engineering-policy") {
        hasAvailableSource = true;
      } else {
        addFinding(findings, "ZTDE-MODEL-303", "error", `entities[${index}].sourceRefs`, `Entity ${entity.id} references unsupported source ${sourceRef}.`, "Use admission, standard, or project-policy source references only.");
      }
    }

    if (!hasAvailableSource) {
      addFinding(findings, "ZTDE-MODEL-304", "error", `entities[${index}].sourceRefs`, `Entity ${entity.id} has no available admitted, official, or project-owned source.`, "Attach an admitted source, official standard, or project policy source.");
    }

    if (entity.authorityClass === "official-requirement" && !entity.sourceRefs.some((sourceRef) => sourceRef.startsWith("standard:"))) {
      addFinding(findings, "ZTDE-MODEL-305", "error", `entities[${index}].authorityClass`, `Entity ${entity.id} claims official authority without an official standard source.`, "Attach an official standard source or downgrade the authority class.");
    }
    if (entity.evidenceClass === "owner-authorized-product-evidence") {
      const hasOwnerEvidence = entity.sourceRefs.some((sourceRef) => {
        if (!sourceRef.startsWith("admission:")) return false;
        const record = admission.records.find((item) => item.id === sourceRef.slice("admission:".length));
        return record?.path.includes("benchmarks/") ?? false;
      });
      if (!hasOwnerEvidence) {
        addFinding(findings, "ZTDE-MODEL-306", "error", `entities[${index}].evidenceClass`, `Entity ${entity.id} claims owner product evidence without a benchmark source.`, "Reference an admitted benchmark artifact or change the evidence class.");
      }
    }
  }

  const relationshipIds = new Set(model.relationships.map((relationship) => relationship.id));
  if (relationshipIds.size !== model.relationships.length) {
    addFinding(findings, "ZTDE-MODEL-401", "error", "relationships", "Relationship IDs are not unique.", "Give every relationship one stable unique ID.");
  }
  for (const [index, relationship] of model.relationships.entries()) {
    if (!entityIds.has(relationship.from)) {
      addFinding(findings, "ZTDE-MODEL-402", "error", `relationships[${index}].from`, `Relationship ${relationship.id} references missing source entity ${relationship.from}.`, "Reference an entity declared in the model.");
    }
    if (!entityIds.has(relationship.to)) {
      addFinding(findings, "ZTDE-MODEL-402", "error", `relationships[${index}].to`, `Relationship ${relationship.id} references missing target entity ${relationship.to}.`, "Reference an entity declared in the model.");
    }
  }

  for (const [index, conflict] of model.conflicts.entries()) {
    if (!entityIds.has(conflict.higherPriorityEntity)) {
      addFinding(findings, "ZTDE-MODEL-501", "error", `conflicts[${index}].higherPriorityEntity`, `Conflict ${conflict.id} references missing higher-priority entity.`, "Reference an entity declared in the model.");
    }
    if (!entityIds.has(conflict.lowerPriorityEntity)) {
      addFinding(findings, "ZTDE-MODEL-501", "error", `conflicts[${index}].lowerPriorityEntity`, `Conflict ${conflict.id} references missing lower-priority entity.`, "Reference an entity declared in the model.");
    }
  }

  const verificationIds = new Set(
    model.entities
      .filter((entity) => entity.category === "verification-method")
      .map((entity) => entity.id),
  );
  for (const [index, trace] of model.decisionTraces.entries()) {
    if (!entityIds.has(trace.taskRef)) {
      addFinding(findings, "ZTDE-MODEL-601", "error", `decisionTraces[${index}].taskRef`, `Trace ${trace.id} references missing task ${trace.taskRef}.`, "Reference an existing task entity.");
    }
    const traceCategories = new Set<string>();
    for (const entityRef of trace.orderedEntityRefs) {
      const entity = model.entities.find((item) => item.id === entityRef);
      if (!entity) {
        addFinding(findings, "ZTDE-MODEL-602", "error", `decisionTraces[${index}].orderedEntityRefs`, `Trace ${trace.id} references missing entity ${entityRef}.`, "Reference only model entities.");
      } else {
        traceCategories.add(entity.category);
      }
    }
    for (const requiredCategory of [
      "state-recovery-contract",
      "information-priority",
      "component-responsibility",
      "design-token",
      "verification-method",
      "evidence-class",
    ]) {
      if (!traceCategories.has(requiredCategory)) {
        addFinding(findings, "ZTDE-MODEL-603", "error", `decisionTraces[${index}].orderedEntityRefs`, `Trace ${trace.id} does not include ${requiredCategory}.`, "Trace decisions from task through state, information, component, token, verification, and evidence.");
      }
    }
    for (const verificationRef of trace.requiredVerificationRefs) {
      if (!verificationIds.has(verificationRef)) {
        addFinding(findings, "ZTDE-MODEL-604", "error", `decisionTraces[${index}].requiredVerificationRefs`, `Trace ${trace.id} references missing verification ${verificationRef}.`, "Reference a verification-method entity.");
      }
    }
  }

  if (!model.entities.some((entity) => entity.category === "abstention-policy" && entity.evidenceClass === "knowledge-gap")) {
    addFinding(findings, "ZTDE-MODEL-701", "error", "entities", "Model lacks a knowledge-gap abstention policy.", "Add an abstention entity for unsupported or ungrounded requests.");
  }

  if (![...admittedPaths].length) {
    addFinding(findings, "ZTDE-MODEL-901", "error", "sourceRegistry.admissionManifest", "Admission manifest has no admitted paths.", "Run the V5 admission gate before validating the model.");
  }

  return {
    version: "1.0",
    status: findings.some((finding) => finding.severity === "error") ? "fail" : "pass",
    lifecycle: "shadow",
    entityCount: model.entities.length,
    relationshipCount: model.relationships.length,
    conflictCount: model.conflicts.length,
    decisionTraceCount: model.decisionTraces.length,
    categoryCoverage: coverage,
    findingCount: findings.length,
    findings,
  };
}
