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
import { portfolioUsage } from "../cli/portfolio.js";

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
  assert.match(help, /validate-brief --brief PATH/);
  assert.match(help, /compile-plan --brief PATH/);
  assert.match(help, /generate-react --plan PATH/);
  assert.match(help, /portfolio validate-registry\|inventory\|capabilities\|run-stage\|snapshot\|baseline\|benchmark\|verify-unchanged\|report/);
  assert.match(portfolioUsage(CLI_COMMANDS[1]), /portfolio snapshot --project ID/);
  assert.match(portfolioUsage(CLI_COMMANDS[1]), /portfolio capabilities --project ID/);
  assert.match(portfolioUsage(CLI_COMMANDS[1]), /portfolio run-stage --project ID --stage STAGE/);
  assert.match(portfolioUsage(CLI_COMMANDS[1]), /portfolio baseline --project ID/);
  assert.match(portfolioUsage(CLI_COMMANDS[1]), /portfolio benchmark --cohort development\|holdout/);
  assert.match(portfolioUsage(CLI_COMMANDS[1]), /portfolio verify-unchanged --run ID/);
  assert.match(portfolioUsage(CLI_COMMANDS[1]), /portfolio report --run ID/);
});
