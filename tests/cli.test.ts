import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  CLI_COMMANDS,
  PACKAGE_NAME,
  PRODUCT_ID,
  PRODUCT_NAME,
  VERSION,
  formatCliHelp,
} from "../src/product.js";

test("package exposes the canonical and short CLI commands", async () => {
  const packageJson = JSON.parse(
    await readFile(resolve(process.cwd(), "package.json"), "utf8"),
  ) as {
    name?: string;
    version?: string;
    bin?: Record<string, string>;
  };

  assert.equal(packageJson.name, PACKAGE_NAME);
  assert.equal(packageJson.version, VERSION);
  assert.deepEqual(packageJson.bin, {
    [CLI_COMMANDS[0]]: "dist/cli/index.js",
    [CLI_COMMANDS[1]]: "dist/cli/index.js",
  });
});

test("CLI help identifies the product, server, and both commands", () => {
  const help = formatCliHelp(CLI_COMMANDS[0]);

  assert.match(help, new RegExp(PRODUCT_NAME));
  assert.match(help, new RegExp(`${CLI_COMMANDS[0]} and ${CLI_COMMANDS[1]}`));
  assert.match(help, new RegExp(PRODUCT_ID));
  assert.match(help, new RegExp(`Usage: ${CLI_COMMANDS[0]}`));
});
