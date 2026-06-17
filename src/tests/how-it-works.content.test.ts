import { describe, it, expect } from "vitest";
import { howItWorks } from "@/app/how-it-works/content";

/**
 * LEAF C — /how-it-works content tests.
 *
 * This file imports ONLY content.ts (no React, no page, no JourneySpine —
 * cross-component composition is checked at the gate). It guards the two things
 * that matter for this surface: the prose is anti-slop clean, and a newcomer is
 * given the three real entry links.
 */

/** Banned AI-slop words. Matched case-insensitively on a word boundary so that,
 *  e.g., "delve" is banned but a hypothetical unrelated substring is not. The
 *  list mirrors the standing writing rules + the leaf's explicit ban list. */
const BANNED_WORDS = [
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
] as const;

/** Banned multi-word phrases (looser match — substring, case-insensitive). */
const BANNED_PHRASES = [
  "in today's fast-paced world",
  "humbled and honored",
  "thrilled to announce",
] as const;

/** Every prose string in the content object, flattened for scanning. */
function allStrings(): string[] {
  const out: string[] = [];
  const visit = (v: unknown): void => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") Object.values(v).forEach(visit);
  };
  visit(howItWorks);
  return out;
}

describe("how-it-works content — anti-slop", () => {
  const strings = allStrings();

  it("has prose to check", () => {
    expect(strings.length).toBeGreaterThan(0);
  });

  it.each(BANNED_WORDS)("contains no banned word: %s", (word) => {
    // \b word boundary; the hyphenated entries match literally with the hyphen.
    const re = new RegExp(`\\b${word.replace(/[-]/g, "\\-")}\\b`, "i");
    const hits = strings.filter((s) => re.test(s));
    expect(hits, `banned word "${word}" in: ${JSON.stringify(hits)}`).toHaveLength(0);
  });

  it.each(BANNED_PHRASES)("contains no banned phrase: %s", (phrase) => {
    const lower = phrase.toLowerCase();
    const hits = strings.filter((s) => s.toLowerCase().includes(lower));
    expect(hits, `banned phrase "${phrase}" in: ${JSON.stringify(hits)}`).toHaveLength(0);
  });

  it("uses straight quotes, not curly quotes, in prose", () => {
    const curly = strings.filter((s) => /[‘’“”]/.test(s));
    expect(curly, `curly quotes in: ${JSON.stringify(curly)}`).toHaveLength(0);
  });
});

describe("how-it-works content — required links", () => {
  it("links to /start, /learn and /how-to-learn", () => {
    const hrefs = howItWorks.links.map((l) => l.href);
    expect(hrefs).toContain("/start");
    expect(hrefs).toContain("/learn");
    expect(hrefs).toContain("/how-to-learn");
  });

  it("every link has a non-empty label and href", () => {
    expect(howItWorks.links.length).toBeGreaterThan(0);
    for (const l of howItWorks.links) {
      expect(l.href.trim().length).toBeGreaterThan(0);
      expect(l.label.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("how-it-works content — sections non-empty", () => {
  it("intro, stagesIntro, sevenIdeas, whereToStart are non-empty strings", () => {
    expect(howItWorks.intro.trim().length).toBeGreaterThan(0);
    expect(howItWorks.stagesIntro.trim().length).toBeGreaterThan(0);
    expect(howItWorks.sevenIdeas.trim().length).toBeGreaterThan(0);
    expect(howItWorks.whereToStart.trim().length).toBeGreaterThan(0);
  });

  it("promise is a non-empty list of non-empty lines", () => {
    expect(Array.isArray(howItWorks.promise)).toBe(true);
    expect(howItWorks.promise.length).toBeGreaterThan(0);
    for (const p of howItWorks.promise) {
      expect(p.trim().length).toBeGreaterThan(0);
    }
  });
});
