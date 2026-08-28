import assert from "node:assert/strict";
import test from "node:test";

import { resolveChromiumCdpUrl, validateColorSchemes } from "../src/runtime/policy.js";

test("Chromium CDP URLs are restricted to loopback origins", () => {
  assert.equal(resolveChromiumCdpUrl("http://127.0.0.1:9222"), "http://127.0.0.1:9222/");
  assert.equal(resolveChromiumCdpUrl("http://localhost:9222"), "http://localhost:9222/");
  assert.throws(() => resolveChromiumCdpUrl("https://example.com:9222"), /loopback host/);
  assert.throws(() => resolveChromiumCdpUrl("http://127.0.0.1:9222/json"), /loopback origin/);
  assert.throws(() => resolveChromiumCdpUrl("ws://127.0.0.1:9222"), /http or https/);
});

test("runtime color schemes accept unique light and dark verification modes", () => {
  assert.doesNotThrow(() => validateColorSchemes(["light"]));
  assert.doesNotThrow(() => validateColorSchemes(["light", "dark"]));
  assert.throws(() => validateColorSchemes([]), /one or both/);
  assert.throws(() => validateColorSchemes(["dark", "dark"]), /unique/);
});
