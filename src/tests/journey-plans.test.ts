import { describe, it, expect } from "vitest";
import { planFor } from "@/shared/journey/plans";
import { listAllTopics, listTopicsInCategory } from "@/categories/registry";
import { emptyProgressState, type ProgressState } from "@/shared/progress/types";
import type { Goal } from "@/shared/audience/types";
import type { TopicMeta } from "@/shared/derivation/types";

const GOALS: Goal[] = ["understand", "interview", "refresh"];
const topics: TopicMeta[] = listAllTopics();

function complete(state: ProgressState, category: string, topic: string): ProgressState {
  state.categories[category] = state.categories[category] ?? {};
  state.categories[category][topic] = {
    derivation: { currentStep: 1, completedSteps: [1], revealedHints: [], completed: true },
    problems: {},
    customInputs: [],
  };
  return state;
}

describe("study plans — shape (every goal)", () => {
  it.each(GOALS)("planFor(%s) yields a non-empty, well-formed plan", (goal) => {
    const plan = planFor(goal, emptyProgressState(), topics);
    expect(plan.goal).toBe(goal);
    expect(plan.title.length).toBeGreaterThan(0);
    expect(plan.subtitle.length).toBeGreaterThan(0);
    expect(plan.milestones.length).toBeGreaterThan(0);
  });

  it.each(GOALS)("planFor(%s) never throws on empty / bare state", (goal) => {
    expect(() => planFor(goal, emptyProgressState(), topics)).not.toThrow();
    expect(() => planFor(goal, {} as unknown as ProgressState, topics)).not.toThrow();
  });

  it.each(GOALS)("planFor(%s): every milestone points at a real topic + href", (goal) => {
    const plan = planFor(goal, emptyProgressState(), topics);
    const byKey = new Map(topics.map((t) => [t.key, t]));
    for (const m of plan.milestones) {
      const meta = byKey.get(m.topicKey);
      expect(meta, `${m.topicKey} should be a registry topic`).toBeDefined();
      expect(m.href).toBe(`/categories/${meta!.category}/${meta!.key}`);
      expect(m.name).toBe(meta!.name);
      expect(m.minutes).toBe(meta!.estimatedMinutes);
      expect(typeof m.stageKey).toBe("string");
      expect(m.stageKey.length).toBeGreaterThan(0);
    }
  });

  it.each(GOALS)("planFor(%s): no duplicate milestones", (goal) => {
    const plan = planFor(goal, emptyProgressState(), topics);
    const keys = plan.milestones.map((m) => m.topicKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("study plans — cumulative time", () => {
  it.each(GOALS)("planFor(%s): cumulativeMinutes is non-decreasing", (goal) => {
    const plan = planFor(goal, emptyProgressState(), topics);
    let prev = -Infinity;
    for (const m of plan.milestones) {
      expect(m.cumulativeMinutes).toBeGreaterThanOrEqual(prev);
      prev = m.cumulativeMinutes;
    }
  });

  it.each(GOALS)("planFor(%s): last cumulative == totalMinutes == sum of minutes", (goal) => {
    const plan = planFor(goal, emptyProgressState(), topics);
    const sum = plan.milestones.reduce((acc, m) => acc + m.minutes, 0);
    expect(plan.totalMinutes).toBe(sum);
    expect(plan.milestones[plan.milestones.length - 1].cumulativeMinutes).toBe(sum);
  });

  it("cumulativeMinutes is the exact running sum of minutes", () => {
    const plan = planFor("understand", emptyProgressState(), topics);
    let running = 0;
    for (const m of plan.milestones) {
      running += m.minutes;
      expect(m.cumulativeMinutes).toBe(running);
    }
  });
});

describe("study plans — understand", () => {
  it("covers ALL registry topics in registry order", () => {
    const plan = planFor("understand", emptyProgressState(), topics);
    expect(plan.milestones.map((m) => m.topicKey)).toEqual(topics.map((t) => t.key));
  });
});

describe("study plans — interview", () => {
  it("contains NO programming-basics topic", () => {
    const plan = planFor("interview", emptyProgressState(), topics);
    const basicsKeys = new Set(listTopicsInCategory("programming-basics").map((t) => t.key));
    for (const m of plan.milestones) {
      expect(basicsKeys.has(m.topicKey), `${m.topicKey} is a basics topic`).toBe(false);
    }
  });

  it("includes every algorithms topic", () => {
    const plan = planFor("interview", emptyProgressState(), topics);
    const planKeys = new Set(plan.milestones.map((m) => m.topicKey));
    for (const t of listTopicsInCategory("algorithms")) {
      expect(planKeys.has(t.key), `algorithms/${t.key} should be in the interview plan`).toBe(true);
    }
  });

  it("includes exactly the six interview-relevant DS topics and no other DS topic", () => {
    const plan = planFor("interview", emptyProgressState(), topics);
    const planKeys = new Set(plan.milestones.map((m) => m.topicKey));
    const wanted = ["arrays", "strings", "hash-maps", "linked-lists", "trees", "graphs"];
    for (const k of wanted) expect(planKeys.has(k), `${k} should be present`).toBe(true);
    const dsKeys = listTopicsInCategory("data-structures").map((t) => t.key);
    const excludedDs = dsKeys.filter((k) => !wanted.includes(k));
    for (const k of excludedDs) {
      expect(planKeys.has(k), `${k} should be excluded`).toBe(false);
    }
  });

  it("milestone count == 12 algorithms + 6 DS", () => {
    const plan = planFor("interview", emptyProgressState(), topics);
    const algoCount = listTopicsInCategory("algorithms").length;
    expect(plan.milestones).toHaveLength(algoCount + 6);
  });
});

describe("study plans — refresh", () => {
  const SEVEN = [
    "information-reuse",
    "search-space-pruning",
    "monotonicity-and-invariants",
    "decomposition",
    "trade-space-for-time",
    "amortization",
    "greedy-choice",
  ];

  it("has exactly one milestone per principle (7 total)", () => {
    const plan = planFor("refresh", emptyProgressState(), topics);
    expect(plan.milestones).toHaveLength(SEVEN.length);
  });

  it("each milestone's topic stamps a DISTINCT principle covering all seven", () => {
    const plan = planFor("refresh", emptyProgressState(), topics);
    // Resolve each chosen topic's primary principle from its registry meta.
    const byKey = new Map(topics.map((t) => [t.key, t]));
    const principles = plan.milestones.map((m) => byKey.get(m.topicKey)!.principles[0]);
    expect(new Set(principles).size).toBe(SEVEN.length);
    expect(new Set(principles)).toEqual(new Set(SEVEN));
  });

  it("is the shortest pass — fewer milestones than understand and interview", () => {
    const refresh = planFor("refresh", emptyProgressState(), topics);
    const understand = planFor("understand", emptyProgressState(), topics);
    const interview = planFor("interview", emptyProgressState(), topics);
    expect(refresh.milestones.length).toBeLessThan(understand.milestones.length);
    expect(refresh.milestones.length).toBeLessThan(interview.milestones.length);
  });
});

describe("study plans — done flag reflects ProgressState", () => {
  it("marks a milestone done when its topic is completed in state", () => {
    const state = emptyProgressState();
    complete(state, "algorithms", "binary-search");
    const plan = planFor("understand", state, topics);
    const bs = plan.milestones.find((m) => m.topicKey === "binary-search")!;
    expect(bs.done).toBe(true);
    const other = plan.milestones.find((m) => m.topicKey === "variables")!;
    expect(other.done).toBe(false);
  });

  it("everything is not-done on an empty state", () => {
    const plan = planFor("interview", emptyProgressState(), topics);
    for (const m of plan.milestones) expect(m.done).toBe(false);
  });
});
