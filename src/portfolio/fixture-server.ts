import { createServer, type Server } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, join, normalize, relative, resolve, sep } from "node:path";

import type { PortfolioSnapshot } from "./snapshot.js";

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export type PortfolioFixtureServer = {
  origin: string;
  url: string;
  directory: string;
  port: number;
  readinessPath: string;
  startedAt: string;
  close(): Promise<void>;
};

function contained(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

async function responseFile(root: string, requestPath: string): Promise<string | undefined> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return undefined;
  }
  if (decoded.includes("\0")) return undefined;
  const normalized = normalize(decoded).replace(/^[/\\]+/, "");
  const candidate = resolve(root, normalized || "index.html");
  if (!contained(root, candidate)) return undefined;
  try {
    const candidateStats = await stat(candidate);
    const file = candidateStats.isDirectory() ? join(candidate, "index.html") : candidate;
    const canonical = await realpath(file);
    if (!contained(root, canonical) || !(await stat(canonical)).isFile()) return undefined;
    return canonical;
  } catch {
    const fallback = await realpath(join(root, "index.html")).catch(() => undefined);
    return fallback && contained(root, fallback) ? fallback : undefined;
  }
}

async function waitUntilReady(url: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`Static fixture did not become ready: ${lastError}`);
}

function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", rejectPromise);
      resolvePromise();
    });
  });
}

export async function startPortfolioFixtureServer(
  snapshot: PortfolioSnapshot,
): Promise<PortfolioFixtureServer> {
  const verification = snapshot.project.declaration.verification;
  if (!verification) throw new Error("The project does not declare built-in browser verification.");
  const candidate = resolve(snapshot.snapshotRoot, verification.serveDirectory);
  const directory = await realpath(candidate);
  if (!contained(snapshot.snapshotRoot, directory) || !(await stat(directory)).isDirectory()) {
    throw new Error("The declared fixture directory is unavailable or escapes the snapshot.");
  }

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      const file = await responseFile(directory, requestUrl.pathname);
      if (!file) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }
      const body = await readFile(file);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-length": body.byteLength,
        "content-type": MIME_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
        "x-content-type-options": "nosniff",
      });
      response.end(body);
    } catch (error) {
      console.error(`[portfolio-fixture] ${error instanceof Error ? error.message : String(error)}`);
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end("Fixture server error");
    }
  });
  await listen(server, verification.port);
  const origin = `http://127.0.0.1:${verification.port}`;
  try {
    await waitUntilReady(new URL(verification.readinessPath, origin).toString());
  } catch (error) {
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
    throw error;
  }
  return {
    origin,
    url: new URL(verification.route, origin).toString(),
    directory: verification.serveDirectory,
    port: verification.port,
    readinessPath: verification.readinessPath,
    startedAt: new Date().toISOString(),
    close: () => new Promise<void>((resolvePromise, rejectPromise) => {
      server.close((error) => error ? rejectPromise(error) : resolvePromise());
      server.closeAllConnections();
    }),
  };
}
