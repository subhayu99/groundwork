import { describe, it, expect } from "vitest";
import { howToLearn } from "@/app/how-to-learn/content";

/**
 * LEAF D — /how-to-learn (the meta-lesson). This suite imports ONLY content.ts.
 * It guards two things the page can't be trusted to enforce by itself:
 *   1. anti-slop hygiene (no banned AI-ese in any human-facing string), and
 *   2. the TRACK-NARRATIVES bridge rule — at least one real topic linked, and
 *      its label recalls the IDEA, not the topic's name.
 */

// The standing banned list (CLAUDE.md + the leaf brief). Whole-word, case-insensitive.
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
];

/** Every human-facing string in the content module, flattened for scanning. */
function allProse(): string[] {
  const out: string[] = [howToLearn.intro, howToLearn.theWall, howToLearn.comeBack];
  for (const r of howToLearn.rules) out.push(r.title, r.body);
  for (const l of howToLearn.links) out.push(l.label);
  return out;
}

describe("how-to-learn content — anti-slop", () => {
  it("contains no banned AI-slop word in any prose field", () => {
    const haystacks = allProse();
    for (const phrase of BANNED) {
      // \b is unreliable around hyphens ("game-changer"), so match on word edges
      // built from non-letters; this still catches "Delve"/"delves".
      const re = new RegExp(`(^|[^a-z])${phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z]|$)`, "i");
      for (const text of haystacks) {
        expect(re.test(text), `banned phrase "${phrase}" found in: ${text}`).toBe(false);
      }
    }
  });
});

describe("how-to-learn content — sections non-empty", () => {
  it("has a non-empty intro, theWall, and comeBack", () => {
    expect(howToLearn.intro.trim().length).toBeGreaterThan(0);
    expect(howToLearn.theWall.trim().length).toBeGreaterThan(0);
    expect(howToLearn.comeBack.trim().length).toBeGreaterThan(0);
  });

  it("has at least three rules, each with a non-empty title and body", () => {
    expect(howToLearn.rules.length).toBeGreaterThanOrEqual(3);
    for (const r of howToLearn.rules) {
      expect(r.title.trim().length).toBeGreaterThan(0);
      expect(r.body.trim().length).toBeGreaterThan(0);
    }
  });

  it("covers the load-bearing ideas: derive-not-memorize, type-and-run, the wall, spaced re-derivation, the 4-stage journey", () => {
    const blob = allProse().join(" \n ").toLowerCase();
    // derive, don't memorize
    expect(blob).toMatch(/deriv/);
    expect(blob).toMatch(/memor/);
    // type the code yourself and run it
    expect(blob).toMatch(/\btype\b/);
    expect(blob).toMatch(/\brun\b/);
    // the frustration wall
    expect(blob).toMatch(/wall/);
    // spaced re-derivation (come back later, re-derive instead of re-read)
    expect(howToLearn.comeBack.toLowerCase()).toMatch(/re-?deriv/);
    // the four-stage journey
    expect(blob).toMatch(/four|4/);
    expect(blob).toMatch(/stage/);
  });
});

describe("how-to-learn content — links (TRACK-NARRATIVES bridge rule)", () => {
  it("has at least one real topic link present", () => {
    expect(howToLearn.links.length).toBeGreaterThanOrEqual(1);
    for (const l of howToLearn.links) {
      expect(l.href.startsWith("/")).toBe(true);
      expect(l.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("links to a real lesson route under /categories/", () => {
    const topicLinks = howToLearn.links.filter((l) => l.href.includes("/categories/"));
    expect(topicLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("links binary-search BY ITS IDEA, not by its name", () => {
    const bs = howToLearn.links.find((l) => l.href.includes("/categories/algorithms/binary-search"));
    expect(bs, "expected a link to the binary-search lesson").toBeTruthy();
    const label = bs!.label.toLowerCase();
    // The bridge rule: label recalls the idea (sorted row, halving), never "binary search".
    expect(label).not.toContain("binary search");
    expect(label).toMatch(/sorted/);
    expect(label).toMatch(/halv/);
  });
});
