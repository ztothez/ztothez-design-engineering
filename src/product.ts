export const PRODUCT_NAME = "ZtotheZ Design Engineering System";
export const PRODUCT_SHORT_NAME = "ZtotheZ Design Engineering";
export const PRODUCT_ID = "ztothez-design-engineering";
export const PACKAGE_NAME = "@ztothez/design-engineering";
export const CLI_COMMANDS = ["ztothez-design", "zz-design"] as const;
export const VERSION = "2.0.5";

export function formatCliHelp(command: string = CLI_COMMANDS[0]): string {
  return [
    PRODUCT_NAME,
    "",
    `Usage: ${command} [--help | --version]`,
    `       ${command} validate-brief --brief PATH [--json]`,
    `       ${command} compile-plan --brief PATH [--project-root PATH] [--json]`,
    `       ${command} reconcile-plan --brief PATH [--project-root PATH] [--json]`,
    `       ${command} retrieve-rules --brief PATH [--json]`,
    `       ${command} export-handoff --brief PATH --output PATH [--project-root PATH] [--json]`,
    `       ${command} shadow-evaluate [--runtime-root DIR] [--output DIR]`,
    `       ${command} generate-react --plan PATH --generation-root PATH --output PATH --portfolio-registry PATH [--json]`,
    `       ${command} repair-react --request PATH --generation-root PATH --target PATH --portfolio-registry PATH --contract PATH --url URL --profile ID --output PATH [--json]`,
    `       ${command} qualify-pilots --config PATH --evidence-root PATH [--project-root PATH] [--json]`,
    `       ${command} evaluate-v4 --config PATH --evidence-root PATH [--project-root PATH] [--json]`,
    `       ${command} qualify-v4 --evidence PATH [--project-root PATH] [--json]`,
    `       ${command} validate-model [--model PATH] [--output PATH] [--json]`,
    `       ${command} compile-authority [--check | --write] [--json] [--reference-view PATH]`,
    `       ${command} validate-public-content [--root PATH] [--policy PATH] [--json]`,
    `       ${command} evaluate-knowledge-quality [--manifest PATH] [--project-root PATH] [--output DIR] [--json]`,
    `       ${command} qualify-source-removal [--manifest PATH] [--project-root PATH] [--output DIR] [--json]`,
    `       ${command} portfolio validate-registry|inventory|capabilities|run-stage|snapshot|baseline|benchmark|verify-unchanged|report [options]`,
    "",
    `Without arguments, starts the ${PRODUCT_ID} MCP server over stdio.`,
    `Both ${CLI_COMMANDS[0]} and ${CLI_COMMANDS[1]} invoke this executable.`,
    `Use ${command} validate-brief --help for product intake validation.`,
    `Use ${command} compile-plan --help for deterministic design planning.`,
    `Use ${command} reconcile-plan --help for root decision-rule and stage reconciliation.`,
    `Use ${command} retrieve-rules --help for scoped root decision-rule retrieval.`,
    `Use ${command} export-handoff --help for a checksummed agent handoff.`,
    `Use ${command} shadow-evaluate --help for local V6 parity qualification without authority cutover.`,
    `Use ${command} generate-react --help for contained React and TypeScript fixture generation.`,
    `Use ${command} repair-react --help for finding-bound closed-loop remediation.`,
    `Use ${command} qualify-pilots --help for V4 multi-product pilot qualification.`,
    `Use ${command} evaluate-v4 --help for equivalent before-and-after and holdout evaluation.`,
    `Use ${command} qualify-v4 --help for retained V4 release qualification.`,
    `Use ${command} validate-model --help for V5 shadow model validation.`,
    `Use ${command} compile-authority --help for deterministic V5 authority compilation.`,
    `Use ${command} validate-public-content --help for V5 public repository privacy validation.`,
    `Use ${command} evaluate-knowledge-quality --help for V5 conflict, drift, provenance, and model parity evaluation.`,
    `Use ${command} qualify-source-removal --help for V5 source-removal qualification.`,
    `Use ${command} portfolio --help for local read-only benchmark commands.`,
    "",
  ].join("\n");
}
