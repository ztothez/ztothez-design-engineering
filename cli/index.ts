#!/usr/bin/env node

import { basename } from "node:path";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { CLI_COMMANDS, PRODUCT_ID, VERSION, formatCliHelp } from "../src/product.js";

function writeHelp(): void {
  const command = basename(process.argv[1] ?? CLI_COMMANDS[0]);
  process.stdout.write(formatCliHelp(command));
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    writeHelp();
    return;
  }
  if (process.argv.includes("--version") || process.argv.includes("-v")) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  const { server } = await import("../src/server.js");
  const transport = new StdioServerTransport();
  process.stdin.resume();
  await server.connect(transport);
  console.error(`${PRODUCT_ID} MCP server connected over stdio`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Failed to start ${PRODUCT_ID} MCP server:`, message);
  process.exitCode = 1;
});
