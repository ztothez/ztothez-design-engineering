import type { V5MigrationReport } from "./schema.js";

function artifactTable(rows: V5MigrationReport["artifacts"]["removed"], limit = 20): string[] {
  const lines = ["| Path | Disposition | Source-before-removal SHA-256 | Current SHA-256 |", "| --- | --- | --- | --- |"];
  for (const artifact of rows.slice(0, limit)) {
    lines.push("| `" + artifact.path + "` | " + artifact.disposition + " | `" + artifact.preChangeDigest.value + "` | `" + artifact.postChangeDigest.value + "` |");
  }
  if (rows.length > limit) {
    lines.push("| " + (rows.length - limit) + " additional artifacts omitted from this view | See JSON report |  |  |");
  }
  return lines;
}

function rewrittenArtifactTable(rows: V5MigrationReport["artifacts"]["rewritten"], limit = 20): string[] {
  const lines = [
    "| Path | Disposition | Prior artifact SHA-256 | Derived from | Derived source SHA-256 | Current SHA-256 |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const artifact of rows.slice(0, limit)) {
    lines.push("| `" + artifact.path + "` | " + artifact.disposition + " | `" + artifact.preChangeDigest.value + "` | `" + artifact.derivedFrom.path + "` | `" + artifact.derivedFrom.digest.value + "` | `" + artifact.postChangeDigest.value + "` |");
  }
  if (rows.length > limit) {
    lines.push("| " + (rows.length - limit) + " additional artifacts omitted from this view | See JSON report |  |  |  |  |");
  }
  return lines;
}

function fileList(paths: string[]): string[] {
  return paths.length ? paths.map((path) => "- `" + path + "`") : ["- None"];
}

export function formatV5MigrationReport(report: V5MigrationReport): string {
  const commandLines = Object.entries(report.localEvidence.commandEvidence).flatMap(
    ([id, command]) => {
      const line = "- " + id + ": " + (command.passed ? "PASS" : "FAIL") + " `" + command.command.join(" ") + "`";
      if (id !== "tests" || command.testCounts === undefined) return [line];
      if (command.testCounts === "count-unavailable") return [line, "  - Test counts: count-unavailable"];
      return [
        line,
        "  - Test counts: passed=" + command.testCounts.passed + ", failed=" + command.testCounts.failed + ", skipped=" + command.testCounts.skipped,
      ];
    },
  );

  return [
    "# V6 Migration Qualification Report",
    "",
    "- Status: " + report.status.toUpperCase(),
    "- Package version: " + report.packageVersion,
    "- Authority: " + report.authorityPath + " (V5 remains authoritative)",
    "- Generated: " + report.generatedAt,
    "",
    "## Knowledge Identity",
    "",
    "- Admitted files: " + report.knowledgeIdentity.admittedFileCount,
    "- Retrieval files: " + report.knowledgeIdentity.retrievalFileCount,
    "- Rule count: " + report.knowledgeIdentity.ruleCount,
    "- Admission digest: `" + report.knowledgeIdentity.admissionDigest + "`",
    "- Inventory digest: `" + report.knowledgeIdentity.inventoryDigest + "`",
    "- Boundary digest: `" + report.knowledgeIdentity.boundaryDigest + "`",
    "- Compiled authority digest: `" + report.knowledgeIdentity.compiledAuthorityDigest + "`",
    "- Package knowledge matches admission: " + (report.knowledgeIdentity.packageKnowledgeMatchesAdmission === false ? "NO" : "YES"),
    "",
    "## Artifact Counts",
    "",
    "- Removed: " + report.counts.removed,
    "- Privately archived: " + report.counts.privatelyArchived,
    "- Rewritten replacements: " + report.counts.rewritten,
    "- Admitted: " + report.counts.admitted,
    "- Blocked: " + report.counts.blocked,
    "- Package files: " + (report.counts.packageFiles ?? "not-recorded"),
    "- Public tracked files: " + (report.counts.publicFiles ?? "not-recorded"),
    "",
    "## Package And Public File Difference",
    "",
    "### Public Tree Only",
    "",
    ...fileList(report.fileSetDifference.publicOnly),
    "",
    "### Package Only",
    "",
    ...fileList(report.fileSetDifference.packageOnly),
    "",
    "## Removed Artifacts",
    "",
    ...artifactTable(report.artifacts.removed),
    "",
    "## Rewritten Replacement Artifacts",
    "",
    ...rewrittenArtifactTable(report.artifacts.rewritten),
    "",
    "## Local Evidence",
    "",
    ...(commandLines.length ? commandLines : ["- No command evidence was attached to this report."]),
    "- Source-removal qualification: " + (report.localEvidence.sourceRemovalQualified ? "PASS" : "FAIL"),
    "",
    "## Public Actions",
    "",
    ...Object.entries(report.ownerReview.publicActions).map(([action, status]) => "- " + action + ": " + status),
    "",
    "## Claims",
    "",
    ...(report.claims.length ? report.claims.map((claim) => "- " + claim) : ["- No release claims are supported while the report is blocked."]),
    "",
    "## Limitations",
    "",
    ...report.limitations.map((limitation) => "- " + limitation),
    "",
  ].join("\n");
}

export function formatV5ReleaseNotesDraft(report: V5MigrationReport): string {
  return [
    "# Draft V6 Release Notes",
    "",
    "This draft is for owner review only. It does not authorize a Git commit, push, tag, npm publish, GitHub release, or website deployment.",
    "",
    "## Summary",
    "",
    report.releaseNotes.summary,
    "",
    "## Verified Local State",
    "",
    "- Admitted public knowledge files: " + report.knowledgeIdentity.admittedFileCount,
    "- Retrieval files: " + report.knowledgeIdentity.retrievalFileCount,
    "- Rule registry entries: " + report.knowledgeIdentity.ruleCount,
    "- Removed source artifacts absent from current public tree: " + report.counts.removed,
    "- Source-removal qualification: " + (report.localEvidence.sourceRemovalQualified ? "passed" : "failed"),
    "",
    "## Boundaries",
    "",
    "- V6 remains in shadow mode and V5 remains authoritative until owner-approved cutover.",
    "- This release note intentionally avoids naming unnecessary comparative inputs.",
    "- This qualification is engineering evidence, not legal advice or legal clearance.",
    "",
  ].join("\n");
}

export function formatV5OwnerChecklist(report: V5MigrationReport): string {
  return [
    "# V6 Owner Approval Checklist",
    "",
    "Do not mark any item approved until you have reviewed the referenced local evidence.",
    "",
    ...report.ownerReview.requiredBeforePublicAction.map((item) => "- [ ] " + item),
    "",
    "## Separate Public Actions",
    "",
    ...Object.keys(report.ownerReview.publicActions).map((action) => "- [ ] Approve " + action),
    "",
  ].join("\n");
}
