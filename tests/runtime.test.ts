import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

import { verifyUiRuntime } from "../src/runtime/verifier.js";

const fixtureDirectory = resolve(process.cwd(), "tests", "runtime-fixture");

test("runtime verifier captures evidence, journeys, and rendered failures", async (context) => {
  const goodHtml = await readFile(join(fixtureDirectory, "good.html"), "utf8");
  const badHtml = await readFile(join(fixtureDirectory, "bad.html"), "utf8");
  const clippedHtml = await readFile(join(fixtureDirectory, "clipped.html"), "utf8");
  const overlapHtml = await readFile(join(fixtureDirectory, "overlap.html"), "utf8");
  const advancedHtml = await readFile(join(fixtureDirectory, "advanced.html"), "utf8");
  const blobDownloadHtml = await readFile(join(fixtureDirectory, "blob-download.html"), "utf8");
  const server = createServer((request, response) => {
    if (request.url === "/good") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(goodHtml);
      return;
    }
    if (request.url === "/bad") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(badHtml);
      return;
    }
    if (request.url === "/clipped") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(clippedHtml);
      return;
    }
    if (request.url === "/overlap") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(overlapHtml);
      return;
    }
    if (request.url === "/advanced") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(advancedHtml);
      return;
    }
    if (request.url === "/blob-download") {
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'; connect-src 'self'",
      });
      response.end(blobDownloadHtml);
      return;
    }
    if (request.url === "/api/failure") {
      response.writeHead(500, { "content-type": "application/json" });
      response.end('{"error":"fixture failure"}');
      return;
    }
    if (request.url === "/api/status") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end('{"status":"ready"}');
      return;
    }
    if (request.url === "/download/report.json") {
      response.writeHead(200, {
        "content-type": "application/json",
        "content-disposition": 'attachment; filename="report.json"',
      });
      response.end('{"ok":true}');
      return;
    }
    if (request.url === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }
    response.writeHead(404);
    response.end("not found");
  });
  await new Promise<void>((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  context.after(() => new Promise<void>((resolveClose) => server.close(() => resolveClose())));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const outputRoot = await mkdtemp(join(tmpdir(), "ztothez-design-runtime-test-"));
  context.after(() => rm(outputRoot, { recursive: true, force: true }));
  const viewport = [{ name: "mobile-test", width: 375, height: 812 }];

  const good = await verifyUiRuntime({
    url: `${origin}/good`,
    outputDirectory: join(outputRoot, "good"),
    viewports: viewport,
    settleMs: 50,
    journeys: [
      {
        name: "generate-report",
        steps: [
          { action: "fill", selector: "#name", value: "AegisOPS" },
          { action: "expectValue", selector: "#name", value: "AegisOPS" },
          { action: "expectAttribute", selector: "#status", name: "data-mode", value: "demo" },
          { action: "expectResponse", selector: "#status", urlIncludes: "/api/status", status: 200, method: "GET" },
          { action: "expectJson", selector: "#json", path: "scores.coverage", value: 100 },
          { action: "expectDownload", selector: "#download", filenameIncludes: "report.json" },
          { action: "click", selector: "#open" },
          { action: "expectVisible", selector: "#result" },
          { action: "expectText", selector: "#result", value: "successfully" },
        ],
      },
    ],
  });
  assert.equal(good.passed, true, JSON.stringify(good.findings, null, 2));
  assert.equal(good.journeys[0]?.passed, true);
  assert.deepEqual(
    good.journeys[0]?.evidence?.map((entry) => entry.kind),
    ["attribute", "response", "json", "download"],
  );
  assert.equal(good.screenshots.length, 2);
  assert.ok(
    good.screenshots.some((screenshot) =>
      screenshot.name.includes("journey-generate-report-mobile-test"),
    ),
  );
  await stat(join(good.outputDirectory, "runtime-report.json"));
  await stat(good.screenshots[0]!.path);

  const blobDownload = await verifyUiRuntime({
    url: `${origin}/blob-download`,
    outputDirectory: join(outputRoot, "blob-download"),
    viewports: viewport,
    settleMs: 50,
    journeys: [
      {
        name: "offline-export",
        steps: [
          {
            action: "expectDownload",
            selector: "#blob-download",
            filenameIncludes: "offline-export.txt",
          },
        ],
      },
    ],
  });
  assert.equal(blobDownload.journeys[0]?.passed, true, JSON.stringify(blobDownload.findings, null, 2));
  const blobEvidence = blobDownload.journeys[0]?.evidence?.find(
    (entry) => entry.kind === "download",
  );
  assert.ok(blobEvidence?.path);
  assert.match(blobEvidence.description, /via (browser download|captured Blob)/);
  assert.equal(await readFile(blobEvidence.path, "utf8"), "captured offline export\n");

  const bad = await verifyUiRuntime({
    url: `${origin}/bad`,
    outputDirectory: join(outputRoot, "bad"),
    viewports: viewport,
    settleMs: 100,
  });
  const checkIds = new Set(bad.findings.map((finding) => finding.checkId));
  assert.equal(bad.passed, false);
  assert.ok(checkIds.has("ZTDE-RUNTIME-002"));
  assert.ok(checkIds.has("ZTDE-RUNTIME-003"));
  assert.ok(checkIds.has("ZTDE-RUNTIME-004"));
  assert.ok(
    bad.findings.some(
      (finding) =>
        finding.checkId === "ZTDE-RUNTIME-004" &&
        finding.selector === "#clipped-label" &&
        finding.message.includes("clipped"),
    ),
  );
  assert.ok(checkIds.has("ZTDE-RUNTIME-005"));
  assert.ok(checkIds.has("ZTDE-RUNTIME-007"));

  const expectedFailure = await verifyUiRuntime({
    url: `${origin}/bad`,
    outputDirectory: join(outputRoot, "expected-failure"),
    viewports: viewport,
    settleMs: 100,
    expectedNetwork: [
      {
        id: "fixture-api-failure",
        method: "GET",
        urlIncludes: "/api/failure",
        status: 500,
        minOccurrences: 1,
        maxOccurrences: 1,
      },
    ],
  });
  assert.equal(expectedFailure.expectedNetwork[0]?.satisfied, true);
  assert.equal(expectedFailure.expectedNetwork[0]?.occurrences, 1);
  assert.equal(
    expectedFailure.findings.some(
      (finding) =>
        finding.checkId === "ZTDE-RUNTIME-003" && finding.message.includes("/api/failure"),
    ),
    false,
  );

  const missingExpectedFailure = await verifyUiRuntime({
    url: `${origin}/good`,
    outputDirectory: join(outputRoot, "missing-expected-failure"),
    viewports: viewport,
    settleMs: 50,
    expectedNetwork: [
      {
        id: "must-occur",
        method: "POST",
        urlIncludes: "/api/never-called",
        status: 503,
        minOccurrences: 1,
      },
    ],
  });
  assert.equal(missingExpectedFailure.passed, false);
  assert.equal(missingExpectedFailure.expectedNetwork[0]?.satisfied, false);
  assert.ok(
    missingExpectedFailure.findings.some((finding) => finding.checkId === "ZTDE-RUNTIME-009"),
  );

  const clipped = await verifyUiRuntime({
    url: `${origin}/clipped`,
    outputDirectory: join(outputRoot, "clipped"),
    viewports: viewport,
    settleMs: 50,
  });
  assert.equal(clipped.passed, false);
  assert.ok(
    clipped.findings.some(
      (finding) =>
        finding.checkId === "ZTDE-RUNTIME-004" && finding.selector === "#clipped-label",
    ),
  );
  assert.equal(
    clipped.findings.some((finding) => finding.selector === "#allowed-label"),
    false,
  );
  assert.equal(
    clipped.findings.some((finding) => finding.message.includes("Page overflows horizontally")),
    false,
  );

  const overlap = await verifyUiRuntime({
    url: `${origin}/overlap`,
    outputDirectory: join(outputRoot, "overlap"),
    viewports: viewport,
    settleMs: 50,
  });
  assert.equal(overlap.passed, false);
  assert.ok(
    overlap.findings.some(
      (finding) =>
        finding.checkId === "ZTDE-RUNTIME-010" &&
        finding.message.includes("interactive controls overlap") &&
        finding.selector === "#first-control",
    ),
  );
  assert.ok(
    overlap.findings.some(
      (finding) =>
        finding.checkId === "ZTDE-RUNTIME-010" &&
        finding.message.includes("occludes semantic content") &&
        finding.selector === "#blocking-sidebar",
    ),
  );

  const advanced = await verifyUiRuntime({
    url: `${origin}/advanced`,
    outputDirectory: join(outputRoot, "advanced"),
    viewports: [{ name: "tablet-test", width: 768, height: 1024 }],
    settleMs: 50,
  });
  assert.equal(advanced.passed, false);
  const advancedCheckIds = new Set(advanced.findings.map((finding) => finding.checkId));
  for (const checkId of [
    "ZTDE-RUNTIME-011",
    "ZTDE-RUNTIME-012",
    "ZTDE-RUNTIME-013",
    "ZTDE-RUNTIME-014",
    "ZTDE-RUNTIME-015",
    "ZTDE-RUNTIME-016",
  ]) {
    assert.ok(
      advancedCheckIds.has(checkId),
      `${checkId} missing from ${JSON.stringify(advanced.findings, null, 2)}`,
    );
  }
  assert.ok(
    advanced.findings.some(
      (finding) =>
        finding.checkId === "ZTDE-RUNTIME-013" && finding.selector === "#covered-focus",
    ),
  );
  assert.ok(
    advanced.findings.some(
      (finding) => finding.checkId === "ZTDE-RUNTIME-014" && finding.severity === "error",
    ),
  );

  const journeyDestination = await verifyUiRuntime({
    url: `${origin}/good`,
    outputDirectory: join(outputRoot, "journey-destination"),
    viewports: viewport,
    settleMs: 50,
    journeys: [
      {
        name: "inspect-navigated-route",
        steps: [
          { action: "navigate", value: "/advanced" },
          { action: "expectVisible", selector: "#tiny-target" },
        ],
      },
    ],
  });
  assert.ok(
    journeyDestination.findings.some(
      (finding) =>
        finding.checkId === "ZTDE-RUNTIME-012" &&
        finding.journey === "inspect-navigated-route" &&
        finding.viewport === "mobile-test",
    ),
  );
});
