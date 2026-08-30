import type { DataMode } from "./source-mode.js";
import { sourceBoundaries } from "./source-mode.js";

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
  selectedRecord: "vm-prod-17",
  message: "Review the disclosed local dataset before running analysis.",
};

export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  if (action.type === "select-mode") {
    return {
      ...state,
      mode: action.mode,
      phase: "review",
      message: sourceBoundaries[action.mode].canRunTask
        ? "Review the disclosed local dataset before running analysis."
        : sourceBoundaries[action.mode].limitation,
    };
  }
  if (action.type === "start") {
    if (!sourceBoundaries[state.mode].canRunTask) {
      return { ...state, phase: "error", message: sourceBoundaries[state.mode].limitation };
    }
    return { ...state, phase: "running", message: "Running analysis against the local demonstration dataset." };
  }
  if (action.type === "complete") {
    if (state.phase !== "running") return state;
    return { ...state, phase: "success", message: "Operating in verified local demonstration mode" };
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
  return { ...state, phase: "review", message: "Scope and selected finding preserved. Review the evidence before trying again." };
}
