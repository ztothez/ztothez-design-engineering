import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { DesignPlan } from "../design-plan/schema.js";
import { authorizeGenerationTarget, type GenerationTargetOptions } from "./policy.js";
import {
  generationManifestSchema,
  generationReportSchema,
  type GeneratedFile,
  type GenerationManifest,
  type GenerationReport,
} from "./schema.js";
import { tokenStyles } from "./templates/tokens.js";

export const REACT_TYPESCRIPT_ADAPTER_VERSION = "1.2.0";

export type GenerateReactTypescriptOptions = GenerationTargetOptions;

function digest(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function packageName(plan: DesignPlan): string {
  return `${plan.id}-fixture`.slice(0, 214);
}

function planSource(plan: DesignPlan): string {
  const route = plan.routes[0]!;
  const taskComponents = plan.components.filter((entry) => entry.taskRef === route.taskRef);
  const taskStates = plan.stateOwnership.filter((entry) => entry.taskRefs.includes(route.taskRef));
  const summary = {
    product: plan.product,
    planId: plan.id,
    sourceDigest: plan.sourceBrief.digest,
    task: { id: route.taskRef, label: route.purpose, route: route.path },
    informationFlow: plan.informationArchitecture.map(({ id, order, label, purpose }) => ({ id, order, label, purpose })),
    components: taskComponents.map(({ id, boundary, responsibility, ownsState }) => ({ id, boundary, responsibility, ownsState })),
    states: taskStates.map(({ state, behavior, recovery, disclosure }) => ({ state, behavior, recovery, disclosure })),
    verification: plan.verificationObligations
      .filter((entry) => entry.taskRefs.includes(route.taskRef))
      .map(({ id, method, blocking, expectedEvidence }) => ({ id, method, blocking, expectedEvidence })),
  };
  return `export const generatedPlan = ${json(summary)} as const;\n`;
}

function generatedFiles(plan: DesignPlan): Map<string, string> {
  const files = new Map<string, string>();
  files.set("package.json", `${json({
    name: packageName(plan),
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      build: "tsc -b && vite build",
      test: "vitest run",
      typecheck: "tsc -b --pretty false",
      dev: "vite",
      preview: "vite preview",
    },
    dependencies: { react: "19.1.1", "react-dom": "19.1.1" },
    devDependencies: {
      "@types/react": "19.1.10",
      "@types/react-dom": "19.1.7",
      "@vitejs/plugin-react": "5.0.4",
      typescript: "5.9.3",
      vite: "7.3.6",
      vitest: "3.2.7",
    },
  })}\n`);
  files.set("index.html", `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <link rel="icon" href="data:," />
    <title>${plan.product.replace(/[<>&"]/g, "")}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);
  files.set("tsconfig.json", `${json({
    files: [],
    references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }],
  })}\n`);
  files.set("tsconfig.app.json", `${json({
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      allowJs: false,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      module: "ESNext",
      moduleResolution: "Bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      noUncheckedIndexedAccess: true,
    },
    include: ["src"],
  })}\n`);
  files.set("tsconfig.node.json", `${json({
    compilerOptions: {
      composite: true,
      skipLibCheck: true,
      module: "ESNext",
      moduleResolution: "Bundler",
      strict: true,
    },
    include: ["vite.config.ts"],
  })}\n`);
  files.set("vite.config.ts", `import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const planId = ${JSON.stringify(plan.id)};

function targetIdentity(): Plugin {
  return {
    name: "ztothez-design-target-identity",
    configureServer(server) {
      server.middlewares.use((_request, response, next) => {
        response.setHeader("X-ZtotheZ-Design-Plan", planId);
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_request, response, next) => {
        response.setHeader("X-ZtotheZ-Design-Plan", planId);
        next();
      });
    },
  };
}

export default defineConfig({ plugins: [targetIdentity(), react()] });
`);
  files.set("src/generated/plan.ts", planSource(plan));
  files.set("src/domain/source-mode.ts", `export type DataMode = "demo" | "imported" | "cached" | "live";

export type SourceBoundary = {
  label: string;
  origin: string;
  freshness: string;
  connection: "not-required" | "unavailable" | "unknown";
  limitation: string;
  canRunTask: boolean;
};

export const sourceBoundaries: Record<DataMode, SourceBoundary> = {
  demo: {
    label: "Demonstration data",
    origin: "Local synthetic fixture",
    freshness: "Static fixture; no production timestamp",
    connection: "not-required",
    limitation: "Demonstration results cannot establish live service availability or current production state.",
    canRunTask: true,
  },
  imported: {
    label: "Imported data",
    origin: "No file has been imported",
    freshness: "Unknown until an import is validated",
    connection: "not-required",
    limitation: "No imported record is available in this generated fixture.",
    canRunTask: false,
  },
  cached: {
    label: "Cached data",
    origin: "No cached snapshot is available",
    freshness: "Unavailable",
    connection: "not-required",
    limitation: "The interface does not substitute demonstration data for a missing cache.",
    canRunTask: false,
  },
  live: {
    label: "Live data",
    origin: "No production connector configured",
    freshness: "Unverified",
    connection: "unavailable",
    limitation: "Live actions remain unavailable until a real connector supplies authenticated runtime evidence.",
    canRunTask: false,
  },
};
`);
  files.set("src/domain/task-state.ts", `import type { DataMode } from "./source-mode";
import { sourceBoundaries } from "./source-mode";

export type TaskPhase = "review" | "running" | "success" | "error";

export type TaskState = {
  mode: DataMode;
  phase: TaskPhase;
  selectedRecord: string;
  message: string;
};

export type TaskAction =
  | { type: "select-mode"; mode: DataMode }
  | { type: "start" }
  | { type: "complete" }
  | { type: "retry-source" }
  | { type: "use-demo-fallback" }
  | { type: "return-to-review" };

export const initialTaskState: TaskState = {
  mode: "demo",
  phase: "review",
  selectedRecord: "priority-record-01",
  message: "Review the disclosed fixture evidence before recording the bounded decision.",
};

export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  if (action.type === "select-mode") {
    return {
      ...state,
      mode: action.mode,
      phase: "review",
      message: sourceBoundaries[action.mode].canRunTask
        ? "Review the disclosed fixture evidence before recording the bounded decision."
        : sourceBoundaries[action.mode].limitation,
    };
  }
  if (action.type === "start") {
    if (!sourceBoundaries[state.mode].canRunTask) {
      return { ...state, phase: "error", message: sourceBoundaries[state.mode].limitation };
    }
    return { ...state, phase: "running", message: "Recording the local fixture decision." };
  }
  if (action.type === "complete") {
    if (state.phase !== "running") return state;
    return { ...state, phase: "success", message: "Decision recorded in local demonstration state." };
  }
  if (action.type === "retry-source") {
    return {
      ...state,
      phase: "error",
      message: "Connection remains unavailable. The selected record is preserved; use the disclosed demo fallback or return to review.",
    };
  }
  if (action.type === "use-demo-fallback") {
    return { ...state, mode: "demo", phase: "review", message: "Demonstration fallback selected. Origin remains visible." };
  }
  return { ...state, phase: "review", message: "Selection preserved. Review the evidence before trying again." };
}
`);
  files.set("src/domain/task-state.test.ts", `import { describe, expect, it } from "vitest";

import { initialTaskState, taskReducer } from "./task-state";

describe("taskReducer", () => {
  it("completes the primary demonstration task", () => {
    const running = taskReducer(initialTaskState, { type: "start" });
    expect(taskReducer(running, { type: "complete" }).phase).toBe("success");
  });

  it("preserves selection and exposes recovery when live data is unavailable", () => {
    const live = taskReducer(initialTaskState, { type: "select-mode", mode: "live" });
    const failed = taskReducer(live, { type: "retry-source" });
    const recovered = taskReducer(failed, { type: "use-demo-fallback" });
    expect(failed.selectedRecord).toBe(initialTaskState.selectedRecord);
    expect(failed.phase).toBe("error");
    expect(recovered.mode).toBe("demo");
    expect(recovered.selectedRecord).toBe(initialTaskState.selectedRecord);
  });
});
`);
  files.set("src/components/SourceBoundaryPanel.tsx", `import type { DataMode } from "../domain/source-mode";
import { sourceBoundaries } from "../domain/source-mode";

const modes: DataMode[] = ["demo", "imported", "cached", "live"];

export function SourceBoundaryPanel({ mode, onChange }: { mode: DataMode; onChange: (mode: DataMode) => void }) {
  const source = sourceBoundaries[mode];
  return (
    <section className="source-panel" aria-labelledby="source-heading" data-ztothez-design-data-mode={mode} data-ztothez-design-region="source-boundary">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Data boundary</p>
          <h2 id="source-heading">{source.label}</h2>
        </div>
        <span className={\`status status--\${mode}\`} data-ztothez-design-status data-ztothez-design-status-purpose="data-origin" data-ztothez-design-state-visual data-ztothez-design-non-color-cue="visible-text">{mode}</span>
      </div>
      <div className="mode-control" aria-label="Inspect data modes">
        {modes.map((entry) => (
          <button key={entry} type="button" aria-pressed={entry === mode} onClick={() => onChange(entry)}>
            {entry}
          </button>
        ))}
      </div>
      <dl className="source-facts">
        <div><dt>Origin</dt><dd>{source.origin}</dd></div>
        <div><dt>Freshness</dt><dd>{source.freshness}</dd></div>
        <div><dt>Connection</dt><dd>{source.connection}</dd></div>
      </dl>
      <p className="limitation"><strong>Limitation:</strong> {source.limitation}</p>
    </section>
  );
}
`);
  files.set("src/components/TaskWorkspace.tsx", `import { useReducer } from "react";

import { generatedPlan } from "../generated/plan";
import { sourceBoundaries } from "../domain/source-mode";
import { initialTaskState, taskReducer } from "../domain/task-state";
import { SourceBoundaryPanel } from "./SourceBoundaryPanel";

export function TaskWorkspace() {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const source = sourceBoundaries[state.mode];

  function runTask() {
    dispatch({ type: "start" });
    if (source.canRunTask) queueMicrotask(() => dispatch({ type: "complete" }));
  }

  return (
    <main className="workspace" data-ztothez-design-composition="1.0" data-ztothez-design-max-primary-actions="1" data-ztothez-design-max-visible-regions="4">
      <header className="product-header" data-ztothez-design-priority="context">
        <div>
          <p className="eyebrow">Operational decision workspace</p>
          <h1>{generatedPlan.product}</h1>
          <p className="lede">{generatedPlan.task.label}</p>
        </div>
        <span className="route-label">Route {generatedPlan.task.route}</span>
      </header>

      <section className="decision-layout" aria-labelledby="decision-heading">
        <div className="primary-flow" data-ztothez-design-region="primary-decision">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Primary task</p>
              <h2 id="decision-heading">Review and record the bounded decision</h2>
            </div>
            <span className={\`status status--\${state.phase}\`} data-ztothez-design-status data-ztothez-design-status-purpose="task-phase" data-ztothez-design-state-visual data-ztothez-design-non-color-cue="visible-text">{state.phase}</span>
          </div>
          <div className="finding" data-ztothez-design-priority="primary-outcome" data-ztothez-design-visual-claim="selected-record" data-ztothez-design-claim-basis="synthetic" data-ztothez-design-evidence-ref="local-fixture-priority-record-01">
            <p className="finding-label">Selected record</p>
            <h3>{state.selectedRecord}</h3>
            <p>This synthetic record demonstrates the planned decision order without claiming production evidence.</p>
          </div>
          <div className="action-row" data-ztothez-design-priority="next-action">
            <p className="action-boundary"><strong>{source.label}</strong> · {source.origin}</p>
            <button className="primary-action" type="button" data-ztothez-design-primary-action onClick={runTask} disabled={!source.canRunTask || state.phase === "running" || state.phase === "success"}>
              {state.phase === "running" ? "Recording decision" : state.phase === "success" ? "Decision recorded" : "Record decision"}
            </button>
            <button type="button" onClick={() => dispatch({ type: "return-to-review" })}>Return to review</button>
          </div>
          <ol className="answer-flow">
            {generatedPlan.informationFlow.map((entry) => (
              <li key={entry.id}><span>{entry.order}</span><div><strong>{entry.label}</strong><p>{entry.purpose}</p></div></li>
            ))}
          </ol>
        </div>

        <aside className="recovery" aria-labelledby="recovery-heading" data-ztothez-design-region="recovery">
          <p className="eyebrow">Recovery path</p>
          <h2 id="recovery-heading">Preserve context when a source is unavailable</h2>
          <p aria-live="polite" className="task-message">{state.message}</p>
          {!source.canRunTask && (
            <div className="recovery-actions">
              <button type="button" onClick={() => dispatch({ type: "retry-source" })}>Retry source</button>
              <button type="button" onClick={() => dispatch({ type: "use-demo-fallback" })}>Use disclosed demo fallback</button>
            </div>
          )}
          <p className="evidence-boundary">This fixture validates generated structure and state behavior. It does not prove live connectivity, rendered accessibility, product usability, or release readiness.</p>
        </aside>
      </section>

      <SourceBoundaryPanel mode={state.mode} onChange={(mode) => dispatch({ type: "select-mode", mode })} />
    </main>
  );
}
`);
  files.set("src/App.tsx", `import { TaskWorkspace } from "./components/TaskWorkspace";

export default function App() {
  return <TaskWorkspace />;
}
`);
  files.set("src/main.tsx", `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles/tokens.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
`);
  files.set("src/styles/tokens.css", tokenStyles);
  files.set("src/styles/app.css", `* { box-sizing: border-box; }
html { background: var(--color-canvas); font-family: var(--font-sans); color: var(--color-text); }
body { margin: 0; min-width: 320px; }
button { min-height: 44px; border: var(--border-width) solid var(--color-border); border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-text); padding: var(--space-2) var(--space-4); font: inherit; font-weight: 700; cursor: pointer; }
button:hover:not(:disabled) { border-color: var(--color-action); }
button:focus-visible { outline: var(--focus-width) solid var(--color-focus); outline-offset: var(--space-1); }
button:disabled { opacity: 0.6; cursor: not-allowed; }
h1, h2, h3, p { margin-top: 0; }
h1 { margin-bottom: var(--space-2); font-size: var(--font-size-page-title); line-height: 1.15; }
h2 { margin-bottom: var(--space-3); font-size: var(--font-size-section-title); line-height: 1.3; }
h3 { margin-bottom: var(--space-2); font-size: var(--font-size-item-title); }
.workspace { width: min(100% - (2 * var(--space-4)), var(--measure-workspace)); margin-inline: auto; padding-block: var(--space-6) var(--space-7); }
.product-header, .section-heading, .action-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); }
.product-header { margin-bottom: var(--space-5); }
.eyebrow, .finding-label { margin-bottom: var(--space-2); color: var(--color-text-muted); font-size: var(--font-size-label); font-weight: 800; text-transform: uppercase; }
.lede { max-width: var(--measure-copy); color: var(--color-text-muted); }
.route-label, .status { border: var(--border-width) solid var(--color-border); border-radius: var(--radius-control); padding: var(--space-2) var(--space-3); font-size: var(--font-size-label); font-weight: 800; white-space: nowrap; }
.source-panel, .primary-flow, .recovery { border: var(--border-width) solid var(--color-border); border-radius: var(--radius-panel); background: var(--color-surface); padding: var(--space-5); }
.source-panel { margin-bottom: var(--space-4); }
.mode-control { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-block: var(--space-4); }
.mode-control button[aria-pressed="true"] { background: var(--color-action); border-color: var(--color-action); color: var(--color-action-text); }
.source-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-3); margin: 0; }
.source-facts div { background: var(--color-surface-raised); padding: var(--space-3); }
.source-facts dt { color: var(--color-text-muted); font-size: var(--font-size-label); font-weight: 700; }
.source-facts dd { margin: var(--space-1) 0 0; }
.limitation, .evidence-boundary { margin: var(--space-4) 0 0; color: var(--color-text-muted); }
.decision-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(var(--measure-aside), 1fr); gap: var(--space-4); }
.finding { margin-block: var(--space-4); border-left: var(--focus-width) solid var(--color-action); background: var(--color-surface-raised); padding: var(--space-4); }
.answer-flow { display: grid; gap: var(--space-2); padding: 0; list-style: none; }
.answer-flow li { display: grid; grid-template-columns: var(--size-step) 1fr; gap: var(--space-3); border-top: var(--border-width) solid var(--color-border); padding-top: var(--space-3); }
.answer-flow li > span { display: grid; place-items: center; width: var(--size-step); height: var(--size-step); border-radius: 50%; background: var(--color-surface-raised); font-weight: 800; }
.answer-flow p { margin: var(--space-1) 0 0; color: var(--color-text-muted); }
.action-row { justify-content: flex-start; flex-wrap: wrap; margin-top: var(--space-5); }
.action-boundary { flex-basis: 100%; margin: 0; color: var(--color-text-muted); }
.primary-action { background: var(--color-action); border-color: var(--color-action); color: var(--color-action-text); }
.primary-action:hover:not(:disabled) { background: var(--color-action-hover); }
.recovery-actions { display: grid; gap: var(--space-2); margin-top: var(--space-4); }
.task-message { min-height: var(--size-message); padding: var(--space-3); background: var(--color-surface-raised); }
.status--success, .status--demo { color: var(--color-positive); }
.status--error, .status--live { color: var(--color-negative); }
.status--running, .status--cached, .status--imported { color: var(--color-warning); }

@media (max-width: 48rem) {
  .decision-layout, .source-facts { grid-template-columns: 1fr; }
  .product-header { display: block; }
  .route-label { display: inline-block; margin-top: var(--space-2); white-space: normal; }
  .section-heading { flex-wrap: wrap; }
  .status { max-width: 100%; white-space: normal; overflow-wrap: anywhere; }
}

@media (prefers-reduced-motion: no-preference) {
  button { transition: background-color var(--duration-fast), border-color var(--duration-fast); }
}
`);
  files.set("README.md", `# ${plan.product} generated fixture

This independent React and TypeScript fixture was generated from design plan \`${plan.id}\` by the project-owned \`react-typescript-vite\` adapter.

It implements one local demonstration task and a disconnected-source recovery path. Demo, imported, cached, and live modes have separate disclosures. No production connector, imported file, or cache is implied.

## Run

\`npm install\`

\`npm run typecheck\`

\`npm test\`

\`npm run dev\`

Generation is not release evidence. Run contract, architecture, browser, accessibility, and human-review gates before shipping.
`);
  return files;
}

async function writeGeneratedFiles(root: string, files: Map<string, string>): Promise<GeneratedFile[]> {
  const records: GeneratedFile[] = [];
  for (const [path, content] of [...files.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const absolute = join(root, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, content, "utf8");
    records.push({ path, digest: digest(content), bytes: Buffer.byteLength(content) });
  }
  return records;
}

export async function generateReactTypescriptFixture(
  plan: DesignPlan,
  options: GenerateReactTypescriptOptions,
): Promise<GenerationReport> {
  if (!plan.implementationReady || plan.status !== "ready") {
    throw new Error("Generation requires a ready design plan with implementationReady set to true");
  }
  if (plan.routes.length === 0 || plan.components.length === 0 || plan.stateOwnership.length === 0) {
    throw new Error("Generation requires a planned route, component boundaries, and explicit state ownership");
  }

  const target = await authorizeGenerationTarget(options);
  const temporary = await mkdtemp(join(target.outputParent, ".ztde-generate-"));
  try {
    const files = generatedFiles(plan);
    const fileRecords = await writeGeneratedFiles(temporary, files);
    const manifest: GenerationManifest = generationManifestSchema.parse({
      version: "1.0",
      adapter: "react-typescript-vite",
      adapterVersion: REACT_TYPESCRIPT_ADAPTER_VERSION,
      plan: {
        id: plan.id,
        sourceDigest: plan.sourceBrief.digest,
        compilerVersion: plan.compilerVersion,
      },
      outputMode: "new-independent-fixture",
      files: fileRecords,
      guarantees: [
        "The target was absent, contained by the authorized generation root, and separate from every validated portfolio root.",
        "The generated task uses explicit reducer-owned domain state and semantic CSS tokens.",
        "Demonstration, imported, cached, and live source modes retain separate origin, freshness, connection, and limitation disclosures.",
        "The generated task exposes measurable context, outcome, next-action, status-purpose, density, and evidence-basis composition semantics.",
        "Development and preview responses expose the generation plan identifier for repair-target verification.",
      ],
      limitations: [
        "This adapter creates a new independent fixture and does not merge into an existing repository.",
        "Generated source and unit tests do not prove rendered accessibility, live integration, usability, or release readiness.",
      ],
    });
    const manifestContent = `${json(manifest)}\n`;
    await writeFile(join(temporary, "ztothez-design-generation.json"), manifestContent, "utf8");
    const manifestRecord = {
      path: "ztothez-design-generation.json",
      digest: digest(manifestContent),
      bytes: Buffer.byteLength(manifestContent),
    };
    await rename(temporary, target.outputDirectory);

    return generationReportSchema.parse({
      version: "1.0",
      adapter: "react-typescript-vite",
      adapterVersion: REACT_TYPESCRIPT_ADAPTER_VERSION,
      status: "generated",
      product: plan.product,
      planId: plan.id,
      target: target.portableTarget,
      manifest: `${target.portableTarget}/ztothez-design-generation.json`,
      files: [...fileRecords, manifestRecord],
      capabilities: [
        "One complete local demonstration task with success and disconnected-source recovery paths.",
        "Semantic token layers and reducer-owned domain state.",
        "Truthful source-mode disclosure for demo, imported, cached, and live contexts.",
        "Opt-in rendered composition semantics for responsive, theme, claim, state, and clutter verification.",
        "A runtime plan-identity response header that binds bounded repair evidence to this generated fixture.",
      ],
      limitations: manifest.limitations,
    });
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}
