import { describe, it, expect } from "vitest";
import {
  emptyProgressState,
  emptyTopicProgress,
  PROGRESS_SCHEMA_VERSION,
} from "@/shared/progress/types";

describe("progress types", () => {
  it("emptyProgressState returns the current schema version", () => {
    const state = emptyProgressState();
    expect(state.version).toBe(PROGRESS_SCHEMA_VERSION);
  });

  it("emptyProgressState has ISO timestamp", () => {
    const state = emptyProgressState();
    expect(() => new Date(state.lastUpdated).toISOString()).not.toThrow();
  });

  it("emptyProgressState has empty categories and default settings", () => {
    const state = emptyProgressState();
    expect(state.categories).toEqual({});
    expect(state.settings.theme).toBe("system");
    expect(state.settings.animationSpeed).toBe("normal");
  });

  it("emptyTopicProgress starts at step 1, not completed", () => {
    const tp = emptyTopicProgress();
    expect(tp.derivation.currentStep).toBe(1);
    expect(tp.derivation.completedSteps).toEqual([]);
    expect(tp.derivation.completed).toBe(false);
    expect(tp.problems).toEqual({});
    expect(tp.customInputs).toEqual([]);
  });
});
