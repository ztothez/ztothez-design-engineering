import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const host = process.env.ZTOTHEZ_DESIGN_FIXTURE_HOST ?? "127.0.0.1";
const port = Number.parseInt(process.env.ZTOTHEZ_DESIGN_FIXTURE_PORT ?? "4173", 10);
const fixturePath = fileURLToPath(
  new URL("./fixtures/responsive-overview.html", import.meta.url),
);
const v2FixturePath = fileURLToPath(
  new URL("./fixtures/v2-quality-states.html", import.meta.url),
);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("ZTOTHEZ_DESIGN_FIXTURE_PORT must be an integer between 1 and 65535");
}

const fixture = await readFile(fixturePath);
const v2Fixture = await readFile(v2FixturePath);
const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end('{"status":"ready"}');
    return;
  }
  if (request.url === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }
  const requestPath = new URL(request.url ?? "/", `http://${host}:${port}`).pathname;
  if (requestPath === "/v2-quality-states") {
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
    });
    response.end(v2Fixture);
    return;
  }
  if (requestPath !== "/") {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("not found");
    return;
  }

  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": "text/html; charset=utf-8",
  });
  response.end(fixture);
});

function shutdown(signal) {
  console.error(`Received ${signal}; stopping ZtotheZ Design Engineering fixture server.`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

server.on("error", (error) => {
  console.error("ZtotheZ Design Engineering fixture server failed:", error);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.error(`ZtotheZ Design Engineering fixture server listening at http://${host}:${port}`);
});
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
