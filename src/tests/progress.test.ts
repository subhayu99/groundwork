import { describe, it, expect, beforeEach } from "vitest";
import { ProgressStore } from "@/shared/progress/ProgressStore";
import { migrate, normalizeVisitDays } from "@/shared/progress/migrate";
import {
  NullSync,
  serializeState,
  deserializeState,
} from "@/shared/progress/ProfileSync";
import {
  emptyProgressState,
  PROGRESS_SCHEMA_VERSION,
  MAX_REVIEW_OUTCOMES,
  MAX_VISIT_DAYS,
  type ProgressState,
  type ReviewOutcome,
} from "@/shared/progress/types";

const STORAGE_KEY = "fp-progress-v1";

/** Same local-calendar day logic the store uses, so expectations hold in any TZ. */
function isoDayOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Local noon — ±minutes/hours never crosses a local date boundary in tests. */
const LOCAL_NOON = new Date(2026, 5, 10, 12, 0, 0).getTime();

/** A realistic v1 blob, exactly as the v1 code would have persisted it. */
function v1Blob() {
  return {
    version: 1,
    lastUpdated: "2026-05-01T10:00:00.000Z",
    categories: {
      algorithms: {
        "binary-search": {
          derivation: {
            currentStep: 7,
            completedSteps: [1, 2, 3, 4, 5, 6, 7],
            revealedHints: [2],
            completed: true,
          },
          problems: { "find-first": { attempted: true, solved: true, hintsUsed: 1 } },
          customInputs: [{ label: "my array", data: [3, 1, 4] }],
          lastTouched: 1714550400000,
        },
        "sliding-window": {
          derivation: { currentStep: 3, completedSteps: [1, 2], revealedHints: [], completed: false },
          problems: {},
          customInputs: [],
        },
      },
      "data-structures": {
        "hash-maps": {
          derivation: { currentStep: 1, completedSteps: [], revealedHints: [], completed: false },
          problems: { "two-sum": { attempted: true } },
          customInputs: [],
        },
      },
    },
    audience: {
      experience: "code-some",
      register: "structured",
      goal: "interview",
      updatedAt: 1714550400000,
    },
    settings: {
      theme: "dark",
      animationSpeed: "slow",
      codeLanguage: "python",
      reduceMotion: "reduce",
    },
  };
}

beforeEach(() => {
  localStorage.clear();
});

/* ── H10: version migration never loses progress ───────────────────────── */

describe("migrate — v1 → v2", () => {
  it("preserves every topic, the audience and the settings of a v1 blob", () => {
    const state = migrate(v1Blob());

    expect(state.version).toBe(PROGRESS_SCHEMA_VERSION);

    // All 3 topics across both categories, fields intact.
    const bs = state.categories["algorithms"]["binary-search"];
    expect(bs.derivation.currentStep).toBe(7);
    expect(bs.derivation.completedSteps).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(bs.derivation.revealedHints).toEqual([2]);
    expect(bs.derivation.completed).toBe(true);
    expect(bs.problems["find-first"]).toEqual({ attempted: true, solved: true, hintsUsed: 1 });
    expect(bs.customInputs).toEqual([{ label: "my array", data: [3, 1, 4] }]);
    expect(bs.lastTouched).toBe(1714550400000);

    expect(state.categories["algorithms"]["sliding-window"].derivation.currentStep).toBe(3);
    expect(state.categories["data-structures"]["hash-maps"].problems["two-sum"].attempted).toBe(true);

    expect(state.audience).toMatchObject({
      experience: "code-some",
      register: "structured",
      goal: "interview",
      updatedAt: 1714550400000,
    });

    expect(state.settings).toEqual({
      theme: "dark",
      animationSpeed: "slow",
      codeLanguage: "python",
      reduceMotion: "reduce",
    });
  });

  it("adds nothing destructive: no review/meta invented for v1 data", () => {
    const state = migrate(v1Blob());
    expect(state.categories["algorithms"]["binary-search"].review).toBeUndefined();
    expect(state.meta).toBeUndefined();
  });

  it("store.load() of a stored v1 blob returns all topics intact (the old code returned EMPTY)", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1Blob()));
    const state = new ProgressStore().load();
    expect(Object.keys(state.categories["algorithms"])).toHaveLength(2);
    expect(state.categories["algorithms"]["binary-search"].derivation.completed).toBe(true);
    expect(state.version).toBe(PROGRESS_SCHEMA_VERSION);
  });

  it("load() stays pure: migrating a v1 blob does not write back to storage", () => {
    const raw = JSON.stringify(v1Blob());
    localStorage.setItem(STORAGE_KEY, raw);
    new ProgressStore().load();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it("save() upgrades in place: persisted blob carries the current version", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1Blob()));
    const store = new ProgressStore();
    store.save(store.load());
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(raw.version).toBe(PROGRESS_SCHEMA_VERSION);
    expect(raw.categories["algorithms"]["binary-search"].derivation.currentStep).toBe(7);
  });
});

describe("migrate — corrupted / unknown versions still salvage (H10)", () => {
  it.each([
    ["newer numeric version", 999],
    ["garbage string version", "bananas"],
    ["missing version", undefined],
    ["null version", null],
  ])("salvages all categories when the version is %s", (_label, version) => {
    const blob: Record<string, unknown> = { ...v1Blob(), version };
    if (version === undefined) delete blob.version;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));

    const state = new ProgressStore().load();
    expect(state.version).toBe(PROGRESS_SCHEMA_VERSION);
    expect(state.categories["algorithms"]["binary-search"].derivation.completedSteps).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(state.categories["data-structures"]["hash-maps"]).toBeDefined();
    expect(state.audience?.register).toBe("structured");
  });

  it("salvages a topic with broken sub-fields instead of dropping it", () => {
    const blob = {
      version: 3,
      categories: {
        algorithms: {
          "binary-search": {
            derivation: "totally broken", // not an object
            problems: { "find-first": { attempted: true } },
            customInputs: "nope",
            lastTouched: "not-a-number",
          },
        },
      },
    };
    const state = migrate(blob);
    const topic = state.categories["algorithms"]["binary-search"];
    expect(topic).toBeDefined();
    expect(topic.derivation.currentStep).toBe(1); // defaulted, not lost
    expect(topic.problems["find-first"].attempted).toBe(true); // salvaged
    expect(topic.customInputs).toEqual([]);
    expect(topic.lastTouched).toBeUndefined();
  });

  it("filters junk out of numeric arrays but keeps the valid entries", () => {
    const blob = {
      version: 1,
      categories: {
        algorithms: {
          x: {
            derivation: {
              currentStep: 4,
              completedSteps: [1, "two", 3, null],
              revealedHints: [NaN, 2],
              completed: false,
            },
            problems: {},
            customInputs: [],
          },
        },
      },
    };
    const d = migrate(blob).categories["algorithms"]["x"].derivation;
    expect(d.completedSteps).toEqual([1, 3]);
    expect(d.revealedHints).toEqual([2]);
  });

  it("returns empty state only when there is truly nothing to salvage", () => {
    expect(migrate(null).categories).toEqual({});
    expect(migrate("garbage").categories).toEqual({});
    expect(migrate(42).categories).toEqual({});
    expect(migrate([1, 2]).categories).toEqual({});
  });
});

/* ── v2 fields: review outcomes cap ────────────────────────────────────── */

describe("review outcomes cap", () => {
  function stateWithOutcomes(count: number): ProgressState {
    const outcomes: ReviewOutcome[] = Array.from({ length: count }, (_, i) => ({
      at: i,
      correct: i % 2 === 0,
    }));
    const state = emptyProgressState();
    state.categories["algorithms"] = {
      "binary-search": {
        derivation: { currentStep: 7, completedSteps: [], revealedHints: [], completed: true },
        problems: {},
        customInputs: [],
        review: { lastRecallAt: 99, nextDueAt: 200, streak: 3, outcomes },
      },
    };
    return state;
  }

  it("save() caps outcomes at the most recent MAX_REVIEW_OUTCOMES", () => {
    const store = new ProgressStore();
    store.save(stateWithOutcomes(25));
    const review = store.load().categories["algorithms"]["binary-search"].review!;
    expect(review.outcomes).toHaveLength(MAX_REVIEW_OUTCOMES);
    expect(review.outcomes![0].at).toBe(5); // oldest 5 trimmed
    expect(review.outcomes![MAX_REVIEW_OUTCOMES - 1].at).toBe(24); // newest kept
    expect(review.lastRecallAt).toBe(99);
    expect(review.streak).toBe(3);
  });

  it("migrate() also enforces the cap and drops malformed outcome entries", () => {
    const blob = {
      version: 2,
      categories: {
        algorithms: {
          x: {
            derivation: { currentStep: 1, completedSteps: [], revealedHints: [], completed: false },
            problems: {},
            customInputs: [],
            review: {
              streak: 2,
              outcomes: [
                ...Array.from({ length: 30 }, (_, i) => ({ at: i, correct: true })),
                { at: "bad", correct: true }, // malformed → dropped
                "junk",
              ],
            },
          },
        },
      },
    };
    const review = migrate(blob).categories["algorithms"]["x"].review!;
    expect(review.outcomes).toHaveLength(MAX_REVIEW_OUTCOMES);
    expect(review.outcomes![0].at).toBe(10);
    expect(review.streak).toBe(2);
  });

  it("save() under the cap leaves outcomes untouched", () => {
    const store = new ProgressStore();
    store.save(stateWithOutcomes(7));
    const review = store.load().categories["algorithms"]["binary-search"].review!;
    expect(review.outcomes).toHaveLength(7);
  });
});

/* ── v2 fields: meta / touchVisit ──────────────────────────────────────── */

describe("touchVisit + visitDays", () => {
  it("first visit stamps firstSeenAt, lastVisitAt and today's local day", () => {
    const store = new ProgressStore();
    store.touchVisit(LOCAL_NOON);
    const meta = store.load().meta!;
    expect(meta.firstSeenAt).toBe(LOCAL_NOON);
    expect(meta.lastVisitAt).toBe(LOCAL_NOON);
    expect(meta.visitDays).toEqual([isoDayOf(new Date(LOCAL_NOON))]);
  });

  it("same-day re-visit dedupes the day and preserves firstSeenAt", () => {
    const store = new ProgressStore();
    store.touchVisit(LOCAL_NOON);
    const later = LOCAL_NOON + 2 * 60 * 60 * 1000; // +2h, outside throttle, same day
    store.touchVisit(later);
    const meta = store.load().meta!;
    expect(meta.visitDays).toHaveLength(1);
    expect(meta.firstSeenAt).toBe(LOCAL_NOON);
    expect(meta.lastVisitAt).toBe(later);
  });

  it("is throttled: a same-day call seconds later does not rewrite", () => {
    const store = new ProgressStore();
    store.touchVisit(LOCAL_NOON);
    store.touchVisit(LOCAL_NOON + 30_000); // within 60s throttle
    expect(store.load().meta!.lastVisitAt).toBe(LOCAL_NOON);
  });

  it("a new day is appended even seconds after the previous stamp", () => {
    const store = new ProgressStore();
    const lateNight = new Date(2026, 5, 10, 23, 59, 50).getTime();
    const justPastMidnight = new Date(2026, 5, 11, 0, 0, 10).getTime();
    store.touchVisit(lateNight);
    store.touchVisit(justPastMidnight); // 20s later but a new local day
    const meta = store.load().meta!;
    expect(meta.visitDays).toHaveLength(2);
    expect(meta.lastVisitAt).toBe(justPastMidnight);
  });

  it("caps visitDays at MAX_VISIT_DAYS, keeping the most recent", () => {
    // Seed 400 distinct historical days ending the day before LOCAL_NOON.
    const days = Array.from({ length: 400 }, (_, i) => isoDayOf(new Date(2026, 5, 9 - i)));
    const state = emptyProgressState();
    state.meta = { firstSeenAt: 1, lastVisitAt: 1, visitDays: days };
    const store = new ProgressStore();
    store.save(state);

    store.touchVisit(LOCAL_NOON);
    const visitDays = store.load().meta!.visitDays!;
    expect(visitDays.length).toBeLessThanOrEqual(MAX_VISIT_DAYS);
    expect(visitDays).toContain(isoDayOf(new Date(LOCAL_NOON))); // newest kept
    expect(visitDays).not.toContain(isoDayOf(new Date(2026, 5, 9 - 399))); // oldest dropped
  });

  it("normalizeVisitDays dedupes, sorts, drops junk and caps", () => {
    expect(normalizeVisitDays(["2026-06-02", "2026-06-01", "2026-06-02", "junk", 7])).toEqual([
      "2026-06-01",
      "2026-06-02",
    ]);
    const many = Array.from({ length: 500 }, (_, i) => isoDayOf(new Date(2024, 0, 1 + i)));
    expect(normalizeVisitDays(many)).toHaveLength(MAX_VISIT_DAYS);
  });
});

/* ── L4.2 seam: envelope + import compatibility ────────────────────────── */

describe("ProfileSync envelope", () => {
  function richState(): ProgressState {
    const state = emptyProgressState();
    state.categories["algorithms"] = {
      "binary-search": {
        derivation: { currentStep: 5, completedSteps: [1, 2, 3], revealedHints: [], completed: false },
        problems: { p1: { attempted: true, solved: true } },
        customInputs: [{ label: "x", data: { n: 1 } }],
        lastTouched: 123,
        review: { lastRecallAt: 50, nextDueAt: 500, streak: 2, outcomes: [{ at: 50, correct: true }] },
      },
    };
    state.audience = {
      experience: "knows-dsa",
      register: "rigorous",
      goal: "refresh",
      updatedAt: 999,
    };
    state.meta = { firstSeenAt: 10, lastVisitAt: 20, visitDays: ["2026-06-01", "2026-06-02"] };
    return state;
  }

  it("serializeState produces the versioned envelope { v, exportedAt, state }", () => {
    const parsed = JSON.parse(serializeState(richState()));
    expect(parsed.v).toBe(PROGRESS_SCHEMA_VERSION);
    expect(() => new Date(parsed.exportedAt).toISOString()).not.toThrow();
    expect(parsed.state.categories["algorithms"]["binary-search"].review.streak).toBe(2);
  });

  it("round-trips a full v2 state through the envelope", () => {
    const original = richState();
    const back = deserializeState(serializeState(original));
    expect(back.version).toBe(PROGRESS_SCHEMA_VERSION);
    expect(back.categories).toEqual(original.categories);
    expect(back.audience).toEqual(original.audience);
    expect(back.meta).toEqual(original.meta);
    expect(back.settings).toEqual(original.settings);
  });

  it("deserializeState accepts a BARE v1 blob (old exported backups)", () => {
    const state = deserializeState(JSON.stringify(v1Blob()));
    expect(state.version).toBe(PROGRESS_SCHEMA_VERSION);
    expect(state.categories["algorithms"]["binary-search"].derivation.currentStep).toBe(7);
  });

  it("deserializeState migrates an envelope that wraps an older-version state", () => {
    const envelope = { v: 1, exportedAt: "2026-05-01T00:00:00.000Z", state: v1Blob() };
    const state = deserializeState(JSON.stringify(envelope));
    expect(state.version).toBe(PROGRESS_SCHEMA_VERSION);
    expect(Object.keys(state.categories["algorithms"])).toHaveLength(2);
  });

  it("deserializeState throws on non-object payloads (nothing to salvage)", () => {
    expect(() => deserializeState("42")).toThrow(/backup/i);
    expect(() => deserializeState("[1,2]")).toThrow(/backup/i);
    expect(() => deserializeState("not json at all")).toThrow();
  });

  it("NullSync pulls nothing and swallows pushes", async () => {
    const sync = new NullSync();
    await expect(sync.pull()).resolves.toBeNull();
    await expect(sync.push(emptyProgressState())).resolves.toBeUndefined();
  });
});

describe("store export/import on the envelope", () => {
  it("exportJson → importJson round-trips through a fresh store", () => {
    const a = new ProgressStore();
    const state = emptyProgressState();
    state.categories["algorithms"] = {
      "two-pointers": {
        derivation: { currentStep: 4, completedSteps: [1, 2, 3], revealedHints: [], completed: false },
        problems: {},
        customInputs: [],
      },
    };
    a.save(state);
    const exported = a.exportJson();

    localStorage.clear();
    const b = new ProgressStore();
    b.importJson(exported);
    expect(b.load().categories["algorithms"]["two-pointers"].derivation.currentStep).toBe(4);
  });

  it("importJson still accepts a bare v1 backup and keeps its audience", () => {
    const store = new ProgressStore();
    store.importJson(JSON.stringify(v1Blob()));
    const state = store.load();
    expect(state.categories["algorithms"]["binary-search"].derivation.completed).toBe(true);
    expect(state.audience?.goal).toBe("interview");
  });

  it("merges meta on import: visitDays union, earliest firstSeenAt, latest lastVisitAt", () => {
    const store = new ProgressStore();
    const local = emptyProgressState();
    local.meta = { firstSeenAt: 100, lastVisitAt: 300, visitDays: ["2026-06-01", "2026-06-02"] };
    store.save(local);

    const incoming = emptyProgressState();
    incoming.meta = { firstSeenAt: 50, lastVisitAt: 200, visitDays: ["2026-06-02", "2026-06-03"] };
    store.importJson(serializeState(incoming));

    const meta = store.load().meta!;
    expect(meta.firstSeenAt).toBe(50);
    expect(meta.lastVisitAt).toBe(300);
    expect(meta.visitDays).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
  });

  it("adopts the incoming audience when local has none, else keeps the newer one", () => {
    const store = new ProgressStore();
    const incoming = emptyProgressState();
    incoming.audience = { experience: "new-to-code", register: "intuitive", goal: "understand", updatedAt: 100 };
    store.importJson(serializeState(incoming));
    expect(store.load().audience?.register).toBe("intuitive");

    const newer = emptyProgressState();
    newer.audience = { experience: "knows-dsa", register: "rigorous", goal: "refresh", updatedAt: 200 };
    store.importJson(serializeState(newer));
    expect(store.load().audience?.register).toBe("rigorous");

    const older = emptyProgressState();
    older.audience = { experience: "code-some", register: "structured", goal: "interview", updatedAt: 150 };
    store.importJson(serializeState(older));
    expect(store.load().audience?.register).toBe("rigorous"); // newer local wins
  });

  it("import still keeps the more-complete topic when review history says so", () => {
    const store = new ProgressStore();
    const local = emptyProgressState();
    local.categories["algorithms"] = {
      x: {
        derivation: { currentStep: 3, completedSteps: [1, 2, 3], revealedHints: [], completed: false },
        problems: {},
        customInputs: [],
        review: { streak: 4, outcomes: Array.from({ length: 5 }, (_, i) => ({ at: i, correct: true })) },
      },
    };
    store.save(local);

    const incoming = emptyProgressState();
    incoming.categories["algorithms"] = {
      x: {
        derivation: { currentStep: 3, completedSteps: [1, 2, 3], revealedHints: [], completed: false },
        problems: {},
        customInputs: [],
      },
    };
    store.importJson(serializeState(incoming));
    // Same derivation progress, but local has recall history → local wins.
    expect(store.load().categories["algorithms"]["x"].review?.streak).toBe(4);
  });
});
