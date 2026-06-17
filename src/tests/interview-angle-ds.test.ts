/**
 * LEAF F — interviewAngle content for the six interview-relevant DATA-STRUCTURES
 * topics: [arrays, strings, hash-maps, linked-lists, trees, graphs].
 *
 * Contract: docs/contracts/JOURNEY-SPINE.md §3 + §4a, and the optional
 * `interviewAngle?: { askedAs; tip; companies? }` on NextStepsContent
 * (src/shared/next-steps/types.ts). These six DS files are the ONLY data-structures
 * files that earn an angle; `stacks-queues` and `sets-tuples` do not.
 *
 * The intentional-omission guard: programming-basics topics (here [variables,
 * constants]) get NO interviewAngle — an angle for `variables` would be noise.
 * They carry no NextStepsContent surface at all (no next-steps.ts file, no
 * TopicBundle), so there is literally nowhere for an angle to live. This test
 * proves that omission rather than silently skipping it.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import type { NextStepsContent } from "@/shared/next-steps/types";

// The six interview-relevant DS topics — imported DIRECTLY from each
// per-topic next-steps.ts (the authoring surface in §4a).
import { arraysNextSteps } from "@/categories/data-structures/topics/arrays/next-steps";
import { stringsNextSteps } from "@/categories/data-structures/topics/strings/next-steps";
import { hashMapsNextSteps } from "@/categories/data-structures/topics/hash-maps/next-steps";
import { linkedListsNextSteps } from "@/categories/data-structures/topics/linked-lists/next-steps";
import { treesNextSteps } from "@/categories/data-structures/topics/trees/next-steps";
import { graphsNextSteps } from "@/categories/data-structures/topics/graphs/next-steps";

// ---------------------------------------------------------------------------
// Anti-slop banlist (from the leaf brief / global writing rules). Matched
// case-insensitively as whole words / phrases.
// ---------------------------------------------------------------------------
const BANNED = [
  "delve",
  "tapestry",
  "testament",
  "leverage",
  "elevate",
  "showcase",
  "underscore",
  "pivotal",
  "realm",
  "foster",
  "resonate",
  "embrace",
  "navigate",
  "meticulous",
  "groundbreaking",
  "game-changer",
  "ever-evolving",
  "in today's fast-paced world",
  "humbled and honored",
  "thrilled to announce",
] as const;

/** Single corpus string from an angle — askedAs + tip + any companies. */
function angleText(angle: NonNullable<NextStepsContent["interviewAngle"]>): string {
  return [angle.askedAs, angle.tip, ...(angle.companies ?? [])].join("  ");
}

/** First banned word found in `text` (whole-word / exact-phrase), or null. */
function firstBanned(text: string): string | null {
  const hay = text.toLowerCase();
  for (const word of BANNED) {
    // Word-boundary match. Hyphenated/space phrases use their own boundaries;
    // \b around a phrase containing spaces/hyphens still anchors the ends.
    const re = new RegExp(`(^|[^a-z])${word.replace(/[-]/g, "\\-")}([^a-z]|$)`, "i");
    if (re.test(hay)) return word;
  }
  return null;
}

const DS_TOPICS: ReadonlyArray<{ key: string; content: NextStepsContent }> = [
  { key: "arrays", content: arraysNextSteps },
  { key: "strings", content: stringsNextSteps },
  { key: "hash-maps", content: hashMapsNextSteps },
  { key: "linked-lists", content: linkedListsNextSteps },
  { key: "trees", content: treesNextSteps },
  { key: "graphs", content: graphsNextSteps },
];

// programming-basics topics that must NOT have an interviewAngle (the guard).
const OMITTED_PB_TOPICS = ["variables", "constants"] as const;

const REPO_ROOT = join(__dirname, "..", "..");

describe("interviewAngle — six interview-relevant data-structures topics", () => {
  it("covers exactly the six expected DS topics", () => {
    expect(DS_TOPICS.map((t) => t.key)).toEqual([
      "arrays",
      "strings",
      "hash-maps",
      "linked-lists",
      "trees",
      "graphs",
    ]);
  });

  it.each(DS_TOPICS)("$key has an interviewAngle object", ({ content }) => {
    expect(content.interviewAngle).toBeDefined();
  });

  it.each(DS_TOPICS)("$key has a non-empty askedAs", ({ content }) => {
    const angle = content.interviewAngle!;
    expect(typeof angle.askedAs).toBe("string");
    expect(angle.askedAs.trim().length).toBeGreaterThan(0);
  });

  it.each(DS_TOPICS)("$key has a non-empty tip", ({ content }) => {
    const angle = content.interviewAngle!;
    expect(typeof angle.tip).toBe("string");
    expect(angle.tip.trim().length).toBeGreaterThan(0);
  });

  it.each(DS_TOPICS)("$key angle uses no banned (AI-slop) word", ({ content }) => {
    const angle = content.interviewAngle!;
    const hit = firstBanned(angleText(angle));
    expect(hit, `banned word "${hit}" found in interviewAngle`).toBeNull();
  });

  it.each(DS_TOPICS)("$key companies (if present) are non-empty strings", ({ content }) => {
    const { companies } = content.interviewAngle!;
    if (companies !== undefined) {
      expect(Array.isArray(companies)).toBe(true);
      for (const c of companies) {
        expect(typeof c).toBe("string");
        expect(c.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it.each(DS_TOPICS)(
    "$key keeps the rest of NextStepsContent intact (purely additive change)",
    ({ content }) => {
      // The angle is additive: the existing recap/practice/real-world content
      // must still be present (we did not gut the file to add a field).
      expect(content.practiceProblems.length).toBeGreaterThan(0);
      expect(content.realWorld.length).toBeGreaterThan(0);
      expect(content.relatedTopics.length).toBeGreaterThan(0);
    },
  );
});

describe("intentional omission — programming-basics gets NO interviewAngle", () => {
  // programming-basics has no topics/index.ts and is not wired into the bundle
  // registry, AND ships no per-topic next-steps.ts. There is nowhere for an
  // interviewAngle to live — an angle for `variables` would be noise. This test
  // proves that omission (per JOURNEY-SPINE.md §3/§4a) rather than skipping it.
  it.each(OMITTED_PB_TOPICS)("%s ships no next-steps.ts file on disk", (topicKey) => {
    const p = join(
      REPO_ROOT,
      "src",
      "categories",
      "programming-basics",
      "topics",
      topicKey,
      "next-steps.ts",
    );
    expect(existsSync(p)).toBe(false);
  });

  it("programming-basics has no topics/index.ts (no NextStepsContent surface at all)", () => {
    const p = join(REPO_ROOT, "src", "categories", "programming-basics", "topics", "index.ts");
    expect(existsSync(p)).toBe(false);
  });
});
