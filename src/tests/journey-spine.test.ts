import { describe, it, expect } from "vitest";
import {
  STAGES,
  stageForCategory,
  stageForTopic,
  journeyProgress,
} from "@/shared/journey/spine";
import { getCategory, listTopicsInCategory, listAllTopics } from "@/categories/registry";
import { emptyProgressState, type ProgressState } from "@/shared/progress/types";

/** Mark a (category, topic) complete in a ProgressState (mutates + returns). */
function complete(state: ProgressState, category: string, topic: string): ProgressState {
  state.categories[category] = state.categories[category] ?? {};
  state.categories[category][topic] = {
    derivation: { currentStep: 1, completedSteps: [1], revealedHints: [], completed: true },
    problems: {},
    customInputs: [],
  };
  return state;
}

describe("journey spine — STAGES", () => {
  it("has exactly 4 stages numbered 1..4 with total=4", () => {
    expect(STAGES).toHaveLength(4);
    expect(STAGES.map((s) => s.n)).toEqual([1, 2, 3, 4]);
    for (const s of STAGES) expect(s.total).toBe(4);
  });

  it("stages are in canonical key order with their promises and hrefs", () => {
    expect(STAGES.map((s) => s.key)).toEqual([
      "foundations",
      "structures",
      "techniques",
      "fluency",
    ]);
    const byKey = Object.fromEntries(STAGES.map((s) => [s.key, s]));
    expect(byKey.foundations.promise).toBe("Make the computer do what you say.");
    expect(byKey.structures.promise).toBe("Hold data so you can find it again.");
    expect(byKey.techniques.promise).toBe("Turn the seven ideas into algorithms.");
    expect(byKey.fluency.promise).toBe(
      "Make it stick — practice, recall, interview-ready.",
    );
    expect(byKey.foundations.href).toBe("/categories/programming-basics");
    expect(byKey.structures.href).toBe("/categories/data-structures");
    expect(byKey.techniques.href).toBe("/categories/algorithms");
    expect(byKey.fluency.href).toBe("/progress");
  });

  it("maps each stage to the documented categories", () => {
    const byKey = Object.fromEntries(STAGES.map((s) => [s.key, s]));
    expect(byKey.foundations.categoryKeys).toEqual(["programming-basics"]);
    expect(byKey.structures.categoryKeys).toEqual(["data-structures"]);
    expect(byKey.techniques.categoryKeys).toEqual(["algorithms"]);
    // Fluency is the destination — no category of its own.
    expect(byKey.fluency.categoryKeys).toEqual([]);
  });

  it("every non-fluency categoryKey exists in the registry", () => {
    for (const s of STAGES) {
      for (const ck of s.categoryKeys) {
        expect(getCategory(ck), `category ${ck} should exist`).toBeDefined();
      }
    }
  });
});

describe("journey spine — stageForCategory", () => {
  it("resolves a known category to its stage", () => {
    expect(stageForCategory("algorithms")?.key).toBe("techniques");
    expect(stageForCategory("programming-basics")?.key).toBe("foundations");
    expect(stageForCategory("data-structures")?.key).toBe("structures");
  });

  it("returns undefined for an unknown category", () => {
    expect(stageForCategory("nope")).toBeUndefined();
  });
});

describe("journey spine — stageForTopic", () => {
  it("binary-search is a techniques topic", () => {
    expect(stageForTopic("binary-search")?.key).toBe("techniques");
  });

  it("variables is a foundations topic", () => {
    expect(stageForTopic("variables")?.key).toBe("foundations");
  });

  it("arrays is a structures topic", () => {
    expect(stageForTopic("arrays")?.key).toBe("structures");
  });

  it("returns undefined for an unknown topic", () => {
    expect(stageForTopic("not-a-real-topic")).toBeUndefined();
  });
});

describe("journey spine — journeyProgress", () => {
  it("never throws on an empty / partial ProgressState and returns 4 rollups", () => {
    expect(() => journeyProgress(emptyProgressState())).not.toThrow();
    // A bare {} (no categories key at all) must also be tolerated.
    expect(() => journeyProgress({} as unknown as ProgressState)).not.toThrow();
    const rows = journeyProgress(emptyProgressState());
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.stage.key)).toEqual([
      "foundations",
      "structures",
      "techniques",
      "fluency",
    ]);
  });

  it("totalInStage equals the registry topic count for each stage's categories", () => {
    const rows = journeyProgress(emptyProgressState());
    const byKey = Object.fromEntries(rows.map((r) => [r.stage.key, r]));
    expect(byKey.foundations.totalInStage).toBe(
      listTopicsInCategory("programming-basics").length,
    );
    expect(byKey.structures.totalInStage).toBe(
      listTopicsInCategory("data-structures").length,
    );
    expect(byKey.techniques.totalInStage).toBe(
      listTopicsInCategory("algorithms").length,
    );
    // Fluency (destination) has no topics of its own.
    expect(byKey.fluency.totalInStage).toBe(0);
  });

  it("overallTotal equals the sum of stages 1..3 registry counts and is identical on every row", () => {
    const rows = journeyProgress(emptyProgressState());
    const expectedTotal =
      listTopicsInCategory("programming-basics").length +
      listTopicsInCategory("data-structures").length +
      listTopicsInCategory("algorithms").length;
    // overall is the running platform-wide total — same value on every row.
    for (const r of rows) expect(r.overallTotal).toBe(expectedTotal);
    // Sanity: the three concrete stages cover every registry topic.
    expect(expectedTotal).toBe(listAllTopics().length);
  });

  it("on an empty state nothing is done", () => {
    const rows = journeyProgress(emptyProgressState());
    for (const r of rows) expect(r.doneInStage).toBe(0);
    for (const r of rows) expect(r.overallDone).toBe(0);
  });

  it("counts completed topics per stage and rolls them into overallDone", () => {
    const state = emptyProgressState();
    complete(state, "programming-basics", "variables");
    complete(state, "algorithms", "binary-search");
    complete(state, "algorithms", "two-pointers");
    const rows = journeyProgress(state);
    const byKey = Object.fromEntries(rows.map((r) => [r.stage.key, r]));
    expect(byKey.foundations.doneInStage).toBe(1);
    expect(byKey.techniques.doneInStage).toBe(2);
    expect(byKey.structures.doneInStage).toBe(0);
    // overallDone is the platform-wide completed count, identical on every row.
    for (const r of rows) expect(r.overallDone).toBe(3);
  });

  it("ignores topics recorded but not completed, and unknown topic keys", () => {
    const state = emptyProgressState();
    // recorded but not completed → not counted
    state.categories["algorithms"] = {
      "binary-search": {
        derivation: { currentStep: 2, completedSteps: [1], revealedHints: [], completed: false },
        problems: {},
        customInputs: [],
      },
      // a stale key that is not in the registry → must not inflate the count
      "ghost-topic": {
        derivation: { currentStep: 1, completedSteps: [1], revealedHints: [], completed: true },
        problems: {},
        customInputs: [],
      },
    };
    const rows = journeyProgress(state);
    const byKey = Object.fromEntries(rows.map((r) => [r.stage.key, r]));
    expect(byKey.techniques.doneInStage).toBe(0);
    for (const r of rows) expect(r.overallDone).toBe(0);
  });

  it("doneInStage never exceeds totalInStage", () => {
    const state = emptyProgressState();
    for (const t of listTopicsInCategory("algorithms")) {
      complete(state, "algorithms", t.key);
    }
    const rows = journeyProgress(state);
    for (const r of rows) expect(r.doneInStage).toBeLessThanOrEqual(r.totalInStage);
    const tech = rows.find((r) => r.stage.key === "techniques")!;
    expect(tech.doneInStage).toBe(tech.totalInStage);
  });
});
