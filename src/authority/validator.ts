import type { AuthorityCompilationReport } from "./schema.js";
import { compileAuthority, readRetainedAuthority, stableJson, type AuthorityCompilerOptions } from "./compiler.js";

function addFinding(
  findings: AuthorityCompilationReport["findings"],
  path: string,
  message: string,
  remediation: string,
): void {
  findings.push({ ruleId: "ZTDE-AUTHORITY-002", severity: "error", path, message, remediation });
}

export async function validateCompiledAuthority(
  options: AuthorityCompilerOptions = {},
): Promise<AuthorityCompilationReport> {
  const compiled = await compileAuthority(options);
  const findings = [...compiled.report.findings];

  try {
    const retained = await readRetainedAuthority(options);
    if (stableJson(retained.registry) !== stableJson(compiled.registry)) {
      addFinding(
        findings,
        options.retainedRuleRegistryPath ?? "governance/rule-registry.json",
        "Retained rule registry differs from deterministic compiler output.",
        "Run zz-design compile-authority --write after reviewing the changed public model, rules, or knowledge boundary.",
      );
    }
    if (stableJson(retained.authority) !== stableJson(compiled.authority)) {
      addFinding(
        findings,
        options.retainedCompiledAuthorityPath ?? "model/compiled-authority.json",
        "Retained compiled authority differs from deterministic compiler output.",
        "Run zz-design compile-authority --write after reviewing the changed public model, rules, or knowledge boundary.",
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    addFinding(
      findings,
      "compiled-authority",
      `Retained compiled authority could not be read or validated: ${message}`,
      "Generate the retained authority and rule registry with zz-design compile-authority --write.",
    );
  }

  return {
    ...compiled.report,
    status: findings.length > 0 ? "fail" : "pass",
    findingCount: findings.length,
    findings,
  };
}
