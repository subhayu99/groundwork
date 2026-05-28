import { describe, it, expect, beforeEach } from "vitest";
import { ProgressStore } from "@/shared/progress/ProgressStore";
import {
  emptyProgressState,
  PROGRESS_SCHEMA_VERSION,
} from "@/shared/progress/types";

describe("ProgressStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns an empty state if nothing is stored", () => {
    const store = new ProgressStore();
    const state = store.load();
    expect(state.version).toBe(PROGRESS_SCHEMA_VERSION);
    expect(state.categories).toEqual({});
  });

  it("persists and loads state through localStorage", () => {
    const store = new ProgressStore();
    const initial = store.load();
    initial.categories["algorithms"] = {
      "sliding-window": {
        derivation: {
          currentStep: 3,
          completedSteps: [1, 2],
          revealedHints: [],
          completed: false,
        },
        problems: {},
        customInputs: [],
      },
    };
    store.save(initial);

    const reloaded = new ProgressStore().load();
    expect(reloaded.categories["algorithms"]["sliding-window"].derivation.currentStep).toBe(3);
  });

  it("exportJson returns the current state as a JSON string", () => {
    const store = new ProgressStore();
    const json = store.exportJson();
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(PROGRESS_SCHEMA_VERSION);
  });

  it("importJson rejects state with unsupported version", () => {
    const store = new ProgressStore();
    const bad = JSON.stringify({ version: 999, categories: {}, settings: {} });
    expect(() => store.importJson(bad)).toThrow(/version/i);
  });

  it("importJson merges by taking the more-complete topic state", () => {
    const store = new ProgressStore();
    // Local: step 2 completed
    const local = emptyProgressState();
    local.categories["algorithms"] = {
      "sliding-window": {
        derivation: { currentStep: 2, completedSteps: [1, 2], revealedHints: [], completed: false },
        problems: {},
        customInputs: [],
      },
    };
    store.save(local);

    // Imported: step 5 completed (further along)
    const imported = emptyProgressState();
    imported.categories["algorithms"] = {
      "sliding-window": {
        derivation: { currentStep: 5, completedSteps: [1, 2, 3, 4, 5], revealedHints: [], completed: false },
        problems: {},
        customInputs: [],
      },
    };
    store.importJson(JSON.stringify(imported));

    const merged = store.load();
    expect(merged.categories["algorithms"]["sliding-window"].derivation.currentStep).toBe(5);
  });

  it("importJson keeps local state if it is further along than the import", () => {
    const store = new ProgressStore();
    const local = emptyProgressState();
    local.categories["algorithms"] = {
      "sliding-window": {
        derivation: { currentStep: 7, completedSteps: [1,2,3,4,5,6,7], revealedHints: [], completed: true },
        problems: {},
        customInputs: [],
      },
    };
    store.save(local);

    const older = emptyProgressState();
    older.categories["algorithms"] = {
      "sliding-window": {
        derivation: { currentStep: 3, completedSteps: [1, 2, 3], revealedHints: [], completed: false },
        problems: {},
        customInputs: [],
      },
    };
    store.importJson(JSON.stringify(older));

    const result = store.load();
    expect(result.categories["algorithms"]["sliding-window"].derivation.currentStep).toBe(7);
    expect(result.categories["algorithms"]["sliding-window"].derivation.completed).toBe(true);
  });
});
