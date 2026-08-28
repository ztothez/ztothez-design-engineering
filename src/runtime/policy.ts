import { existsSync } from "node:fs";

import type { RuntimeColorScheme, RuntimeViewport } from "./types.js";

export const DEFAULT_RUNTIME_VIEWPORTS: readonly RuntimeViewport[] = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1024", width: 1024, height: 768 },
  { name: "wide-1440", width: 1440, height: 900 },
];
export const DEFAULT_RUNTIME_COLOR_SCHEMES: readonly RuntimeColorScheme[] = ["light"];

export const DEFAULT_NAVIGATION_TIMEOUT_MS = 30_000;
export const DEFAULT_SETTLE_MS = 500;
export const MAX_RUNTIME_VIEWPORTS = 8;
export const MAX_RUNTIME_JOURNEYS = 10;
export const MAX_JOURNEY_STEPS = 50;

const chromiumCandidates = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
];

export function resolveChromiumPath(configuredPath?: string): string | undefined {
  const explicitPath = configuredPath ?? process.env.ZTOTHEZ_DESIGN_CHROMIUM_PATH;
  if (explicitPath) {
    if (!existsSync(explicitPath)) {
      throw new Error(`Configured Chromium executable does not exist: ${explicitPath}`);
    }
    return explicitPath;
  }

  return chromiumCandidates.find((candidate) => existsSync(candidate));
}

export function resolveChromiumCdpUrl(configuredUrl?: string): string | undefined {
  const explicitUrl = configuredUrl ?? process.env.ZTOTHEZ_DESIGN_CHROMIUM_CDP_URL;
  if (!explicitUrl) return undefined;

  let url: URL;
  try {
    url = new URL(explicitUrl);
  } catch {
    throw new Error("Configured Chromium CDP URL must be a valid absolute URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Configured Chromium CDP URL must use http or https");
  }
  if (!["127.0.0.1", "localhost", "::1"].includes(url.hostname)) {
    throw new Error("Configured Chromium CDP URL must use a loopback host");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Configured Chromium CDP URL must contain only a loopback origin");
  }
  return url.toString();
}

export function validateRuntimeUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Runtime target must be a valid absolute URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Runtime target must use http or https");
  }
  if (url.username || url.password) {
    throw new Error("Runtime target URL must not contain credentials");
  }
  return url;
}

export function validateViewports(viewports: RuntimeViewport[]): void {
  if (viewports.length === 0 || viewports.length > MAX_RUNTIME_VIEWPORTS) {
    throw new Error(`Provide between 1 and ${MAX_RUNTIME_VIEWPORTS} viewports`);
  }

  const names = new Set<string>();
  for (const viewport of viewports) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/i.test(viewport.name)) {
      throw new Error(`Invalid viewport name: ${viewport.name}`);
    }
    if (names.has(viewport.name)) {
      throw new Error(`Duplicate viewport name: ${viewport.name}`);
    }
    names.add(viewport.name);
    if (viewport.width < 240 || viewport.width > 3_840) {
      throw new Error(`Viewport width is outside 240-3840: ${viewport.width}`);
    }
    if (viewport.height < 240 || viewport.height > 2_160) {
      throw new Error(`Viewport height is outside 240-2160: ${viewport.height}`);
    }
  }
}

export function validateColorSchemes(colorSchemes: RuntimeColorScheme[]): void {
  if (colorSchemes.length === 0 || colorSchemes.length > 2) {
    throw new Error("Provide one or both supported color schemes: light and dark");
  }
  if (new Set(colorSchemes).size !== colorSchemes.length) {
    throw new Error("Color schemes must be unique");
  }
}
