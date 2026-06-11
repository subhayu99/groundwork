import { describe, it, expect } from "vitest";
import {
  reg,
  pickRegister,
  isRegisterMap,
  DEFAULT_REGISTER,
  REGISTERS,
} from "@/shared/audience/types";
import { entryHref, resolveRegister, ENTRY_TOPIC, personalizationFor, ASSUMED_CATEGORIES } from "@/shared/audience/policy";
import { listAllTopics } from "@/categories/registry";
import {
  clampBeatIndex,
  filterBeatsForAudience,
  resolveBeatForRegister,
  type LessonBeat,
} from "@/shared/lesson/types";

/**
 * Guards the audience-register contract: plain values pass through untouched,
 * register maps resolve with `base` as the universal fallback, and beat
 * resolution never disturbs the skeleton (visual/sync/interaction). These are
 * the invariants every lesson and the Phase-3 prose generator rely on.
 */

describe("register primitives", () => {
  it("passes plain values through for any register", () => {
    for (const r of REGISTERS) {
      expect(pickRegister("hello", r)).toBe("hello");
    }
  });

  it("resolves the exact variant when present", () => {
    const v = reg({ base: "b", intuitive: "i", rigorous: "r" });
    expect(pickRegister(v, "intuitive")).toBe("i");
    expect(pickRegister(v, "rigorous")).toBe("r");
  });

  it("falls back to base for a missing variant", () => {
    const v = reg({ base: "b", rigorous: "r" });
    expect(pickRegister(v, "structured")).toBe("b");
    expect(pickRegister(v, "intuitive")).toBe("b");
  });

  it("undefined stays undefined", () => {
    expect(pickRegister(undefined, "structured")).toBeUndefined();
  });

  it("isRegisterMap distinguishes maps from plain objects/strings", () => {
    expect(isRegisterMap(reg({ base: "x" }))).toBe(true);
    expect(isRegisterMap("x")).toBe(false);
    expect(isRegisterMap({ anything: true } as never)).toBe(false);
  });

  it("locks the pre-onboarding default register", () => {
    expect(DEFAULT_REGISTER).toBe("structured");
    expect(resolveRegister(undefined)).toBe("structured");
  });
});

describe("resolveBeatForRegister", () => {
  const beat: LessonBeat = {
    id: "b1",
    label: "The wedge",
    visual: null,
    interaction: "wedge",
    codeLabels: ["sig"],
    arrows: [{ x1: 0, y1: 0, x2: 10, y2: 10 }],
    connector: reg({ base: "base-connector", intuitive: "easy-connector" }),
    actionLabel: "Next move",
    takeaway: reg({ base: "base-take", rigorous: "O(log n) take" }),
    detail: "shared detail",
    panels: [
      {
        left: 1,
        top: 2,
        width: 300,
        variant: "main",
        label: reg({ base: "KICKER", rigorous: "INVARIANT" }),
        title: "shared title",
        body: reg({ base: "base body", intuitive: "story body" }),
      },
    ],
  };

  it("resolves prose for the active register with base fallback", () => {
    const intuitive = resolveBeatForRegister(beat, "intuitive");
    expect(intuitive.connector).toBe("easy-connector");
    expect(intuitive.takeaway).toBe("base-take"); // no intuitive variant → base
    expect(intuitive.panels[0].body).toBe("story body");
    expect(intuitive.panels[0].label).toBe("KICKER");

    const rigorous = resolveBeatForRegister(beat, "rigorous");
    expect(rigorous.takeaway).toBe("O(log n) take");
    expect(rigorous.panels[0].label).toBe("INVARIANT");
    expect(rigorous.panels[0].body).toBe("base body");
  });

  it("plain prose and the skeleton pass through untouched", () => {
    const r = resolveBeatForRegister(beat, "structured");
    expect(r.actionLabel).toBe("Next move");
    expect(r.detail).toBe("shared detail");
    expect(r.panels[0].title).toBe("shared title");
    // skeleton identical
    expect(r.id).toBe("b1");
    expect(r.interaction).toBe("wedge");
    expect(r.codeLabels).toEqual(["sig"]);
    expect(r.arrows).toEqual(beat.arrows);
    expect(r.panels[0].left).toBe(1);
  });
});

describe("depth-adaptive beat filtering", () => {
  const mkBeat = (id: string, extra: Partial<LessonBeat> = {}): LessonBeat => ({
    id,
    visual: null,
    panels: [],
    ...extra,
  });
  const beats = [
    mkBeat("hook", { registers: ["intuitive"] }),
    mkBeat("core"),
    mkBeat("proof", { registers: ["structured", "rigorous"] }),
    mkBeat("recap", { trimOnRefresh: true }),
  ];
  const ids = (bs: LessonBeat[]) => bs.map((b) => b.id);

  it("undefined registers ⇒ the beat appears for every register", () => {
    for (const r of REGISTERS) {
      expect(ids(filterBeatsForAudience(beats, r))).toContain("core");
      expect(ids(filterBeatsForAudience(beats, r))).toContain("recap");
    }
  });

  it("tagged beats appear only for their listed registers", () => {
    expect(ids(filterBeatsForAudience(beats, "intuitive"))).toEqual(["hook", "core", "recap"]);
    expect(ids(filterBeatsForAudience(beats, "structured"))).toEqual(["core", "proof", "recap"]);
    expect(ids(filterBeatsForAudience(beats, "rigorous"))).toEqual(["core", "proof", "recap"]);
  });

  it("a register cut that would empty the lesson falls back to the full list", () => {
    const only = [mkBeat("a", { registers: ["intuitive"] }), mkBeat("b", { registers: ["intuitive"] })];
    expect(ids(filterBeatsForAudience(only, "rigorous"))).toEqual(["a", "b"]);
  });

  it("goal=refresh drops trimOnRefresh beats; other goals keep them", () => {
    expect(ids(filterBeatsForAudience(beats, "structured", "refresh"))).toEqual(["core", "proof"]);
    expect(ids(filterBeatsForAudience(beats, "structured", "understand"))).toEqual(["core", "proof", "recap"]);
    expect(ids(filterBeatsForAudience(beats, "structured", "interview"))).toEqual(["core", "proof", "recap"]);
    expect(ids(filterBeatsForAudience(beats, "structured"))).toEqual(["core", "proof", "recap"]);
  });

  it("the refresh trim never empties the lesson either", () => {
    const all = [mkBeat("a", { trimOnRefresh: true }), mkBeat("b", { trimOnRefresh: true })];
    expect(ids(filterBeatsForAudience(all, "structured", "refresh"))).toEqual(["a", "b"]);
  });

  it("filtering precedes the trim: register cut first, then refresh", () => {
    // For intuitive+refresh: hook survives the register cut, recap is trimmed.
    expect(ids(filterBeatsForAudience(beats, "intuitive", "refresh"))).toEqual(["hook", "core"]);
  });

  it("clampBeatIndex keeps the current step in range when the list shrinks", () => {
    expect(clampBeatIndex(5, 3)).toBe(2); // register switch shrank 6 beats → 3
    expect(clampBeatIndex(1, 3)).toBe(1); // in range — untouched
    expect(clampBeatIndex(-1, 3)).toBe(0);
    expect(clampBeatIndex(0, 0)).toBe(0); // degenerate list — never negative
  });
});

describe("routing policy", () => {
  it("maps every experience to a real entry topic", () => {
    expect(entryHref({ experience: "new-to-code", register: "intuitive", goal: "understand", updatedAt: 0 }))
      .toBe("/categories/programming-basics/variables");
    expect(entryHref({ experience: "code-some", register: "structured", goal: "understand", updatedAt: 0 }))
      .toBe("/categories/data-structures/arrays");
    expect(entryHref({ experience: "knows-dsa", register: "rigorous", goal: "interview", updatedAt: 0 }))
      .toBe("/categories/algorithms/binary-search");
  });

  it("defaults the un-onboarded to the very beginning", () => {
    expect(entryHref(undefined)).toBe(
      `/categories/${ENTRY_TOPIC["new-to-code"].category}/${ENTRY_TOPIC["new-to-code"].topic}`,
    );
  });
});

describe("map personalization", () => {
  const topics = listAllTopics();

  it("rings the entry topic and assumes exactly the experience's covered categories", () => {
    const pz = personalizationFor("knows-dsa", topics);
    expect(pz.startKey).toBe("binary-search");
    const assumedCats = new Set(
      topics.filter((t) => pz.assumedKeys.has(t.key)).map((t) => t.category),
    );
    expect([...assumedCats].sort()).toEqual(["data-structures", "programming-basics"]);
    // every topic of an assumed category is in the set — no stragglers
    for (const t of topics) {
      const should = ASSUMED_CATEGORIES["knows-dsa"].includes(t.category);
      expect(pz.assumedKeys.has(t.key)).toBe(should);
    }
  });

  it("assumes nothing for a brand-new learner", () => {
    const pz = personalizationFor("new-to-code", topics);
    expect(pz.startKey).toBe("variables");
    expect(pz.assumedKeys.size).toBe(0);
  });

  it("every entry topic actually exists in the registry", () => {
    const keys = new Set(topics.map((t) => t.key));
    for (const e of Object.values(ENTRY_TOPIC)) expect(keys.has(e.topic)).toBe(true);
  });
});
