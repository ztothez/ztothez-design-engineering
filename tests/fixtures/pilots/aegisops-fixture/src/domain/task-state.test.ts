import { describe, expect, it } from "vitest";

import { initialTaskState, taskReducer } from "./task-state.js";

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
