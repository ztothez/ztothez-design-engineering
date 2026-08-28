export const PRODUCT_NAME = "ZtotheZ Design Engineering System";
export const PRODUCT_SHORT_NAME = "ZtotheZ Design Engineering";
export const PRODUCT_ID = "ztothez-design-engineering";
export const PACKAGE_NAME = "@ztothez/design-engineering";
export const CLI_COMMANDS = ["ztothez-design", "zz-design"] as const;
export const VERSION = "2.0.0";

export function formatCliHelp(command: string = CLI_COMMANDS[0]): string {
  return [
    PRODUCT_NAME,
    "",
    `Usage: ${command} [--help | --version]`,
    `       ${command} validate-brief --brief PATH [--json]`,
    `       ${command} compile-plan --brief PATH [--project-root PATH] [--json]`,
    `       ${command} generate-react --plan PATH --generation-root PATH --output PATH --portfolio-registry PATH [--json]`,
    `       ${command} portfolio validate-registry|inventory|capabilities|run-stage|snapshot|baseline|benchmark|verify-unchanged|report [options]`,
    "",
    `Without arguments, starts the ${PRODUCT_ID} MCP server over stdio.`,
    `Both ${CLI_COMMANDS[0]} and ${CLI_COMMANDS[1]} invoke this executable.`,
    `Use ${command} validate-brief --help for product intake validation.`,
    `Use ${command} compile-plan --help for deterministic design planning.`,
    `Use ${command} generate-react --help for contained React and TypeScript fixture generation.`,
    `Use ${command} portfolio --help for local read-only benchmark commands.`,
    "",
  ].join("\n");
}
