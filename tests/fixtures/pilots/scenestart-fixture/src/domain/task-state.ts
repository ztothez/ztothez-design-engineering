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
  | { type: "return-to-review" }
  | { type: "fail"; message: string };

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
  if (action.type === "fail") {
    return { ...state, phase: "error", message: action.message };
  }
  return { ...state, phase: "review", message: "Selection preserved. Review the evidence before trying again." };
}
