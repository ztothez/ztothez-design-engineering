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
    "",
    `Without arguments, starts the ${PRODUCT_ID} MCP server over stdio.`,
    `Both ${CLI_COMMANDS[0]} and ${CLI_COMMANDS[1]} invoke this executable.`,
    "",
  ].join("\n");
}
