#!/usr/bin/env node

import { basename } from "node:path";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { CLI_COMMANDS, PRODUCT_ID, VERSION, formatCliHelp } from "../src/product.js";

function writeHelp(): void {
  const command = basename(process.argv[1] ?? CLI_COMMANDS[0]);
  process.stdout.write(formatCliHelp(command));
}

async function main(): Promise<void> {
  const argumentsList = process.argv.slice(2);
  if (argumentsList[0] === "portfolio") {
    const { runPortfolioCli } = await import("./portfolio.js");
    process.exitCode = await runPortfolioCli(argumentsList.slice(1), basename(process.argv[1] ?? CLI_COMMANDS[0]));
    return;
  }
  if (argumentsList[0] === "validate-brief") {
    const { runValidateBriefCli } = await import("./validate-brief.js");
    process.exitCode = await runValidateBriefCli(argumentsList.slice(1));
    return;
  }
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    writeHelp();
    return;
  }
  if (process.argv.includes("--version") || process.argv.includes("-v")) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  if (argumentsList.length > 0) {
    throw new Error(`Unknown command: ${argumentsList[0]}`);
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
