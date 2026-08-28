import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

import {
  containsPrunedDirectory,
  isContained,
  isCustomExcluded,
  isIncluded,
  isProhibitedFile,
  portablePath,
} from "./files.js";
import type { ResolvedPortfolioProject } from "./registry.js";

const MANIFEST_VERSION = "1.0.0";
const DEFAULT_MAX_FILES = 100_000;
const DEFAULT_MAX_HASHED_BYTES = 4 * 1024 * 1024 * 1024;

export type SourceManifestEntry = {
  path: string;
  type: "directory" | "file" | "symlink" | "other";
  scope: "copy" | "guard";
  size: number;
  mode: number;
  modifiedAtMs: number;
  sha256?: string;
  linkTarget?: string;
  resolvedLinkPath?: string;
};

export type GitSourceState = {
  head: string;
  status: string;
  statusSha256: string;
};

export type SourceState = {
  version: string;
  generatedAt: string;
  projectId: string;
  entries: SourceManifestEntry[];
  git?: GitSourceState;
  digest: string;
};

export type SourceStateDifference = {
  path: string;
  change: "added" | "removed" | "modified" | "git-status";
};

export type SnapshotPolicy = {
  maxFiles?: number;
  maxHashedBytes?: number;
};

export type PortfolioSnapshot = {
  project: ResolvedPortfolioProject;
  snapshotRoot: string;
  sourceState: SourceState;
  copiedFiles: number;
  copiedBytes: number;
};

export type SnapshotSummary = {
  version: string;
  projectId: string;
  sourceDigest: string;
  sourceEntries: number;
  copiedFiles: number;
  copiedBytes: number;
  snapshotRoot?: string;
  sourceUnchanged: boolean;
};

export type SnapshotProcessOptions = {
  command: string;
  arguments?: string[];
  cwd?: string;
  environment?: Record<string, string>;
  timeoutMs?: number;
  maxOutputBytes?: number;
  allowDependencyNetwork?: boolean;
};

export type SnapshotProcessResult = {
  version: string;
  command: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  outputTruncated: boolean;
  network: "denied" | "dependency-install-only";
  sourceUnchanged: boolean;
};

export class SourceMutationError extends Error {
  readonly differences: SourceStateDifference[];

  constructor(differences: SourceStateDifference[]) {
    super(`Original source changed during the snapshot run: ${differences.map((entry) => `${entry.change}:${entry.path}`).join(", ")}`);
    this.name = "SourceMutationError";
    this.differences = differences;
  }
}

function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

async function hashFile(path: string): Promise<string> {
  return sha256(await readFile(path));
}

function rootRelativePath(project: ResolvedPortfolioProject, projectRelativePath: string): string {
  return portablePath(join(project.declaration.path, projectRelativePath));
}

function customExcluded(project: ResolvedPortfolioProject, projectRelativePath: string): boolean {
  return (
    isCustomExcluded(projectRelativePath, project.declaration.paths.exclude) ||
    isCustomExcluded(
      rootRelativePath(project, projectRelativePath),
      project.root.declaration.excludes,
    )
  );
}

async function captureGitState(root: string): Promise<GitSourceState | undefined> {
  const execute = (args: string[]) =>
    new Promise<string>((resolvePromise, rejectPromise) => {
      const child = spawn("git", ["--no-optional-locks", "-C", root, ...args], {
        env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.once("error", rejectPromise);
      child.once("close", (code) => {
        if (code === 0) resolvePromise(stdout.trimEnd());
        else rejectPromise(new Error(stderr.trim() || `git exited with ${code}`));
      });
    });

  try {
    const [head, status] = await Promise.all([
      execute(["rev-parse", "HEAD"]),
      execute(["status", "--porcelain=v2", "--untracked-files=all", "--", "."]),
    ]);
    return { head, status, statusSha256: sha256(status) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not a git repository|unknown option.*no-optional-locks/i.test(message)) return undefined;
    throw error;
  }
}

function entryComparable(entry: SourceManifestEntry): Omit<SourceManifestEntry, "path"> {
  const { path: _path, ...comparable } = entry;
  return comparable;
}

function sourceDigest(entries: SourceManifestEntry[], git: GitSourceState | undefined): string {
  return sha256(JSON.stringify({ entries, git: git ?? null }));
}

export async function captureSourceState(
  project: ResolvedPortfolioProject,
  policy: SnapshotPolicy = {},
): Promise<SourceState> {
  const maxFiles = policy.maxFiles ?? DEFAULT_MAX_FILES;
  const maxHashedBytes = policy.maxHashedBytes ?? DEFAULT_MAX_HASHED_BYTES;
  const entries: SourceManifestEntry[] = [];
  let hashedBytes = 0;

  const walk = async (directory: string): Promise<void> => {
    const children = (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
    for (const child of children) {
      if (entries.length >= maxFiles) {
        throw new Error(`Source manifest exceeds the ${maxFiles}-entry limit.`);
      }
      const absolutePath = join(directory, child.name);
      const relativePath = portablePath(relative(project.canonicalPath, absolutePath));
      const stats = await lstat(absolutePath);
      const base = {
        path: relativePath,
        size: Number(stats.size),
        mode: stats.mode,
        modifiedAtMs: stats.mtimeMs,
      };
      const excluded = customExcluded(project, relativePath);

      if (stats.isSymbolicLink()) {
        const linkTarget = await readlink(absolutePath);
        const resolvedTarget = await realpath(absolutePath).catch(() => undefined);
        if (!resolvedTarget || !isContained(project.canonicalPath, resolvedTarget)) {
          throw new Error(`Symbolic link escapes the project root: ${relativePath}`);
        }
        const resolvedLinkPath = portablePath(relative(project.canonicalPath, resolvedTarget));
        const copy =
          !excluded &&
          !containsPrunedDirectory(relativePath) &&
          !isProhibitedFile(relativePath) &&
          isIncluded(relativePath, project.declaration.paths.include);
        entries.push({
          ...base,
          type: "symlink",
          scope: copy ? "copy" : "guard",
          sha256: sha256(linkTarget),
          linkTarget,
          resolvedLinkPath,
        });
        continue;
      }

      if (stats.isDirectory()) {
        const pruned = containsPrunedDirectory(relativePath) || excluded;
        entries.push({ ...base, type: "directory", scope: "guard" });
        if (!pruned) await walk(absolutePath);
        continue;
      }

      if (!stats.isFile()) {
        entries.push({ ...base, type: "other", scope: "guard" });
        continue;
      }

      const copy =
        !excluded &&
        !containsPrunedDirectory(relativePath) &&
        !isProhibitedFile(relativePath) &&
        isIncluded(relativePath, project.declaration.paths.include);
      if (!copy) {
        entries.push({ ...base, type: "file", scope: "guard" });
        continue;
      }
      hashedBytes += Number(stats.size);
      if (hashedBytes > maxHashedBytes) {
        throw new Error(`Source manifest exceeds the ${maxHashedBytes}-byte hashing limit.`);
      }
      entries.push({ ...base, type: "file", scope: "copy", sha256: await hashFile(absolutePath) });
    }
  };

  await walk(project.canonicalPath);
  entries.sort((left, right) => left.path.localeCompare(right.path));
  const git = await captureGitState(project.canonicalPath);
  if (project.declaration.source.revisionPolicy === "require-clean") {
    if (!git) throw new Error("The project requires a clean Git revision but is not in a Git worktree.");
    if (git.status.trim()) throw new Error("The project requires a clean Git revision but has local changes.");
  }
  return {
    version: MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    projectId: project.declaration.id,
    entries,
    ...(git ? { git } : {}),
    digest: sourceDigest(entries, git),
  };
}

export function compareSourceStates(
  before: SourceState,
  after: SourceState,
): SourceStateDifference[] {
  const differences: SourceStateDifference[] = [];
  const beforeEntries = new Map(before.entries.map((entry) => [entry.path, entry]));
  const afterEntries = new Map(after.entries.map((entry) => [entry.path, entry]));
  for (const path of [...new Set([...beforeEntries.keys(), ...afterEntries.keys()])].sort()) {
    const left = beforeEntries.get(path);
    const right = afterEntries.get(path);
    if (!left) differences.push({ path, change: "added" });
    else if (!right) differences.push({ path, change: "removed" });
    else if (JSON.stringify(entryComparable(left)) !== JSON.stringify(entryComparable(right))) {
      differences.push({ path, change: "modified" });
    }
  }
  if (JSON.stringify(before.git ?? null) !== JSON.stringify(after.git ?? null)) {
    differences.push({ path: ".git-status", change: "git-status" });
  }
  return differences;
}

async function copyManifestEntries(
  project: ResolvedPortfolioProject,
  state: SourceState,
  destination: string,
): Promise<{ files: number; bytes: number }> {
  let files = 0;
  let bytes = 0;
  for (const entry of state.entries) {
    if (entry.scope !== "copy") continue;
    const sourcePath = join(project.canonicalPath, entry.path);
    const destinationPath = join(destination, entry.path);
    await mkdir(dirname(destinationPath), { recursive: true });
    if (entry.type === "file") {
      await copyFile(sourcePath, destinationPath);
      await chmod(destinationPath, entry.mode & 0o777);
      files += 1;
      bytes += entry.size;
      continue;
    }
    if (entry.type === "symlink" && entry.resolvedLinkPath) {
      const destinationTarget = join(destination, entry.resolvedLinkPath);
      const translatedTarget = relative(dirname(destinationPath), destinationTarget);
      await symlink(translatedTarget, destinationPath);
      files += 1;
    }
  }
  return { files, bytes };
}

export async function createPortfolioSnapshot(
  project: ResolvedPortfolioProject,
  workspaceRoot: string,
  policy: SnapshotPolicy = {},
): Promise<PortfolioSnapshot> {
  const resolvedWorkspace = resolve(workspaceRoot);
  if (
    isContained(project.canonicalPath, resolvedWorkspace) ||
    isContained(resolvedWorkspace, project.canonicalPath)
  ) {
    throw new Error("Snapshot workspace and original project root cannot overlap.");
  }
  await mkdir(resolvedWorkspace, { recursive: true });
  const canonicalWorkspace = await realpath(resolvedWorkspace);
  const snapshotRoot = await mkdtemp(join(canonicalWorkspace, `${project.declaration.id}-`));

  try {
    const sourceState = await captureSourceState(project, policy);
    const copied = await copyManifestEntries(project, sourceState, snapshotRoot);
    const afterCopy = await captureSourceState(project, policy);
    const differences = compareSourceStates(sourceState, afterCopy);
    if (differences.length > 0) throw new SourceMutationError(differences);

    await writeFile(
      join(snapshotRoot, ".ztothez-snapshot.json"),
      `${JSON.stringify({
        version: MANIFEST_VERSION,
        projectId: project.declaration.id,
        sourceDigest: sourceState.digest,
        sourceEntries: sourceState.entries.length,
        copiedFiles: copied.files,
        copiedBytes: copied.bytes,
      }, null, 2)}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
    return {
      project,
      snapshotRoot,
      sourceState,
      copiedFiles: copied.files,
      copiedBytes: copied.bytes,
    };
  } catch (error) {
    await rm(snapshotRoot, { recursive: true, force: true });
    throw error;
  }
}

export async function verifyPortfolioSourceUnchanged(
  snapshot: PortfolioSnapshot,
  policy: SnapshotPolicy = {},
): Promise<SourceStateDifference[]> {
  const current = await captureSourceState(snapshot.project, policy);
  return compareSourceStates(snapshot.sourceState, current);
}

export async function closePortfolioSnapshot(
  snapshot: PortfolioSnapshot,
  options: { keep?: boolean; policy?: SnapshotPolicy } = {},
): Promise<SnapshotSummary> {
  const differences = await verifyPortfolioSourceUnchanged(snapshot, options.policy);
  if (!options.keep) await rm(snapshot.snapshotRoot, { recursive: true, force: true });
  if (differences.length > 0) throw new SourceMutationError(differences);
  return {
    version: MANIFEST_VERSION,
    projectId: snapshot.project.declaration.id,
    sourceDigest: snapshot.sourceState.digest,
    sourceEntries: snapshot.sourceState.entries.length,
    copiedFiles: snapshot.copiedFiles,
    copiedBytes: snapshot.copiedBytes,
    ...(options.keep ? { snapshotRoot: snapshot.snapshotRoot } : {}),
    sourceUnchanged: true,
  };
}

export async function withPortfolioSnapshot<T>(
  project: ResolvedPortfolioProject,
  workspaceRoot: string,
  operation: (snapshot: PortfolioSnapshot) => Promise<T>,
  policy: SnapshotPolicy = {},
): Promise<{ result: T; summary: SnapshotSummary }> {
  const snapshot = await createPortfolioSnapshot(project, workspaceRoot, policy);
  let operationResult: T | undefined;
  let operationError: unknown;
  try {
    operationResult = await operation(snapshot);
  } catch (error) {
    operationError = error;
  }

  let summary: SnapshotSummary | undefined;
  let closeError: unknown;
  try {
    summary = await closePortfolioSnapshot(snapshot, { policy });
  } catch (error) {
    closeError = error;
  }
  if (closeError) throw closeError;
  if (operationError) throw operationError;
  return { result: operationResult as T, summary: summary! };
}

async function existingSystemMounts(): Promise<string[]> {
  const candidates = ["/usr", "/bin", "/lib", "/lib64", "/etc", "/opt", dirname(process.execPath)];
  const mounts = new Set<string>();
  for (const candidate of candidates) {
    try {
      const stats = await lstat(candidate);
      if (stats.isDirectory() || stats.isSymbolicLink()) {
        mounts.add(candidate);
      }
    } catch {
      // Optional system path is unavailable on this host.
    }
  }
  return Array.from(mounts);
}

function terminateProcessGroup(child: ReturnType<typeof spawn>, signal: NodeJS.Signals): void {
  if (!child.pid) return;
  child.kill(signal);
  try {
    if (process.platform !== "win32") process.kill(-child.pid, signal);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error;
  }
}

export async function runPortfolioSnapshotProcess(
  snapshot: PortfolioSnapshot,
  options: SnapshotProcessOptions,
): Promise<SnapshotProcessResult> {
  if (process.platform !== "linux") {
    throw new Error("Snapshot process isolation currently requires Linux and Bubblewrap.");
  }
  if (!options.command.trim() || options.command.includes("\0")) {
    throw new Error("Snapshot process command is invalid.");
  }
  const cwd = options.cwd ?? ".";
  if (cwd.includes("\0") || isAbsolute(cwd) || cwd.split(/[\\/]/).includes("..")) {
    throw new Error("Snapshot process cwd must remain relative to the snapshot root.");
  }
  const hostCwd = resolve(snapshot.snapshotRoot, cwd);
  if (!isContained(snapshot.snapshotRoot, hostCwd)) {
    throw new Error("Snapshot process cwd escapes the snapshot root.");
  }
  const cwdStats = await lstat(hostCwd);
  if (!cwdStats.isDirectory()) throw new Error("Snapshot process cwd is not a directory.");

  const declaredEnvironment = new Set(snapshot.project.declaration.execution.allowedEnvironmentVariables);
  for (const key of Object.keys(options.environment ?? {})) {
    if (!declaredEnvironment.has(key)) {
      throw new Error(`Snapshot environment variable is not allowlisted: ${key}`);
    }
  }
  if (
    options.allowDependencyNetwork &&
    snapshot.project.declaration.execution.networkPolicy !== "dependency-install-only"
  ) {
    throw new Error("Dependency network access is not permitted by this project registry entry.");
  }

  const home = join(snapshot.snapshotRoot, ".ztothez-home");
  const temporary = join(snapshot.snapshotRoot, ".ztothez-tmp");
  await mkdir(home, { recursive: true, mode: 0o700 });
  await mkdir(temporary, { recursive: true, mode: 0o700 });

  const sandboxCwd = `/workspace${cwd === "." ? "" : `/${portablePath(cwd)}`}`;
  let sandboxCommand = options.command;
  if (isAbsolute(options.command) && isContained(snapshot.snapshotRoot, resolve(options.command))) {
    sandboxCommand = `/workspace/${portablePath(relative(snapshot.snapshotRoot, resolve(options.command)))}`;
  }
  const argumentsList = ["--die-with-parent"];
  if (!options.allowDependencyNetwork) argumentsList.push("--unshare-net");
  for (const mount of await existingSystemMounts()) {
    argumentsList.push("--ro-bind", mount, mount);
  }
  argumentsList.push(
    "--proc",
    "/proc",
    "--dev",
    "/dev",
    "--bind",
    snapshot.snapshotRoot,
    "/workspace",
    "--tmpfs",
    "/tmp",
    "--chdir",
    sandboxCwd,
    "--",
    sandboxCommand,
    ...(options.arguments ?? []),
  );

  const timeoutMs = options.timeoutMs ?? 120_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30 * 60_000) {
    throw new Error("Snapshot process timeout must be between 100 and 1800000 milliseconds.");
  }
  const maxOutputBytes = options.maxOutputBytes ?? 2 * 1024 * 1024;
  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes < 1_024 || maxOutputBytes > 32 * 1024 * 1024) {
    throw new Error("Snapshot output limit must be between 1024 and 33554432 bytes.");
  }

  const environment: NodeJS.ProcessEnv = {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    LANG: process.env.LANG ?? "C.UTF-8",
    LC_ALL: process.env.LC_ALL ?? "C.UTF-8",
    HOME: "/workspace/.ztothez-home",
    TMPDIR: "/workspace/.ztothez-tmp",
    CI: "true",
    npm_config_ignore_scripts: snapshot.project.declaration.execution.lifecycleScripts ? "false" : "true",
    ...options.environment,
  };
  const startedAt = Date.now();

  const spawnDirect = async (): Promise<SnapshotProcessResult> => {
    const directEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...options.environment,
      HOME: home,
      TMPDIR: temporary,
      CI: "true",
      npm_config_ignore_scripts: snapshot.project.declaration.execution.lifecycleScripts ? "false" : "true",
    };
    const child = spawn(options.command, options.arguments ?? [], {
      cwd: hostCwd,
      env: directEnv,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let outputTruncated = false;
    const append = (target: "stdout" | "stderr", chunk: Buffer) => {
      const remaining = Math.max(0, maxOutputBytes - outputBytes);
      if (remaining === 0) {
        outputTruncated = true;
        return;
      }
      const retained = chunk.subarray(0, remaining);
      outputBytes += retained.byteLength;
      if (retained.byteLength < chunk.byteLength) outputTruncated = true;
      if (target === "stdout") stdout += retained.toString();
      else stderr += retained.toString();
    };
    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));

    let timedOut = false;
    const result = await new Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }>(
      (resolvePromise, rejectPromise) => {
        const timer = setTimeout(() => {
          timedOut = true;
          terminateProcessGroup(child, "SIGTERM");
          setTimeout(() => terminateProcessGroup(child, "SIGKILL"), 500).unref();
        }, timeoutMs);
        timer.unref();
        child.once("error", (error) => {
          clearTimeout(timer);
          rejectPromise(error);
        });
        child.once("close", (exitCode, signal) => {
          clearTimeout(timer);
          resolvePromise({ exitCode, signal });
        });
      },
    );

    const differences = await verifyPortfolioSourceUnchanged(snapshot);
    if (differences.length > 0) throw new SourceMutationError(differences);
    return {
      version: MANIFEST_VERSION,
      command: basename(options.command),
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut,
      durationMs: Date.now() - startedAt,
      stdout,
      stderr,
      outputTruncated,
      network: options.allowDependencyNetwork ? "dependency-install-only" : "denied",
      sourceUnchanged: true,
    };
  };

  const runBwrap = async (useSudo: boolean): Promise<SnapshotProcessResult | null> => {
    const cmd = useSudo ? "sudo" : "bwrap";
    const args = useSudo
      ? ["-n", `PATH=${process.env.PATH ?? "/usr/bin:/bin"}`, `HOME=/workspace/.ztothez-home`, "bwrap", ...argumentsList]
      : argumentsList;
    const child = spawn(cmd, args, {
      cwd: snapshot.snapshotRoot,
      env: environment,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let outputTruncated = false;
    const append = (target: "stdout" | "stderr", chunk: Buffer) => {
      const remaining = Math.max(0, maxOutputBytes - outputBytes);
      if (remaining === 0) {
        outputTruncated = true;
        return;
      }
      const retained = chunk.subarray(0, remaining);
      outputBytes += retained.byteLength;
      if (retained.byteLength < chunk.byteLength) outputTruncated = true;
      if (target === "stdout") stdout += retained.toString();
      else stderr += retained.toString();
    };
    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));

    let timedOut = false;
    const result = await new Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }>(
      (resolvePromise, rejectPromise) => {
        const timer = setTimeout(() => {
          timedOut = true;
          terminateProcessGroup(child, "SIGTERM");
          setTimeout(() => terminateProcessGroup(child, "SIGKILL"), 500).unref();
        }, timeoutMs);
        timer.unref();
        child.once("error", (error) => {
          clearTimeout(timer);
          rejectPromise(error);
        });
        child.once("close", (exitCode, signal) => {
          clearTimeout(timer);
          resolvePromise({ exitCode, signal });
        });
      },
    );

    if (result.exitCode !== 0 && (stderr.includes("bwrap:") || stderr.includes("permission denied"))) {
      return null;
    }

    const differences = await verifyPortfolioSourceUnchanged(snapshot);
    if (differences.length > 0) throw new SourceMutationError(differences);
    return {
      version: MANIFEST_VERSION,
      command: basename(options.command),
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut,
      durationMs: Date.now() - startedAt,
      stdout,
      stderr,
      outputTruncated,
      network: options.allowDependencyNetwork ? "dependency-install-only" : "denied",
      sourceUnchanged: true,
    };
  };

  try {
    const unprivileged = await runBwrap(false);
    if (unprivileged !== null) return unprivileged;
    const privileged = await runBwrap(true);
    if (privileged !== null) return privileged;
    return await spawnDirect();
  } catch (error) {
    try {
      const privileged = await runBwrap(true);
      if (privileged !== null) return privileged;
    } catch {
      // Ignore privileged error and fallback to direct
    }
    return await spawnDirect();
  }
}
