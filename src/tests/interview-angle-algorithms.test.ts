import { describe, it, expect } from "vitest";
import type { NextStepsContent } from "@/shared/next-steps/types";

import { twoPointersNextSteps } from "@/categories/algorithms/topics/two-pointers/next-steps";
import { binarySearchNextSteps } from "@/categories/algorithms/topics/binary-search/next-steps";
import { slidingWindowNextSteps } from "@/categories/algorithms/topics/sliding-window/next-steps";
import { slidingWindowVariableNextSteps } from "@/categories/algorithms/topics/sliding-window-variable/next-steps";
import { monotonicStackNextSteps } from "@/categories/algorithms/topics/monotonic-stack/next-steps";
import { activitySelectionNextSteps } from "@/categories/algorithms/topics/activity-selection/next-steps";
import { recursionNextSteps } from "@/categories/algorithms/topics/recursion/next-steps";
import { dfsNextSteps } from "@/categories/algorithms/topics/dfs/next-steps";
import { bfsNextSteps } from "@/categories/algorithms/topics/bfs/next-steps";
import { dp1dNextSteps } from "@/categories/algorithms/topics/dp-1d/next-steps";
import { backtrackingNextSteps } from "@/categories/algorithms/topics/backtracking/next-steps";
import { mergesortNextSteps } from "@/categories/algorithms/topics/mergesort/next-steps";

// The 12 ALGORITHMS topics that must carry a concrete interviewAngle.
const TOPICS: Array<[string, NextStepsContent]> = [
  ["two-pointers", twoPointersNextSteps],
  ["binary-search", binarySearchNextSteps],
  ["sliding-window", slidingWindowNextSteps],
  ["sliding-window-variable", slidingWindowVariableNextSteps],
  ["monotonic-stack", monotonicStackNextSteps],
  ["activity-selection", activitySelectionNextSteps],
  ["recursion", recursionNextSteps],
  ["dfs", dfsNextSteps],
  ["bfs", bfsNextSteps],
  ["dp-1d", dp1dNextSteps],
  ["backtracking", backtrackingNextSteps],
  ["mergesort", mergesortNextSteps],
];

// Anti-slop ban list (from CLAUDE.md + the leaf prompt). Matched whole-word,
// case-insensitive. "navigate" also catches the "navigate the landscape" phrase.
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

function bannedHitsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED.filter((word) => {
    if (/[^a-z]/.test(word)) {
      // multi-word / hyphenated phrase: plain substring match
      return lower.includes(word);
    }
    // single word: whole-word match so "underscore" doesn't trip on substrings
    return new RegExp(`\\b${word}\\b`).test(lower);
  });
}

describe("interview angle — 12 algorithms topics", () => {
  it("covers exactly the 12 expected algorithms topics", () => {
    expect(TOPICS.map(([key]) => key)).toEqual([
      "two-pointers",
      "binary-search",
      "sliding-window",
      "sliding-window-variable",
      "monotonic-stack",
      "activity-selection",
      "recursion",
      "dfs",
      "bfs",
      "dp-1d",
      "backtracking",
      "mergesort",
    ]);
  });

  describe.each(TOPICS)("%s", (key, content) => {
    it("has an interviewAngle", () => {
      expect(content.interviewAngle, `${key} is missing interviewAngle`).toBeDefined();
    });

    it("has a non-empty askedAs", () => {
      const askedAs = content.interviewAngle?.askedAs ?? "";
      expect(askedAs.trim().length, `${key}.askedAs is empty`).toBeGreaterThan(0);
    });

    it("has a non-empty tip", () => {
      const tip = content.interviewAngle?.tip ?? "";
      expect(tip.trim().length, `${key}.tip is empty`).toBeGreaterThan(0);
    });

    it("uses no banned (AI-slop) words", () => {
      const angle = content.interviewAngle;
      const combined = [angle?.askedAs ?? "", angle?.tip ?? "", ...(angle?.companies ?? [])].join(" ");
      expect(bannedHitsIn(combined), `${key} interviewAngle contains banned word(s)`).toEqual([]);
    });

    it("companies, if present, is a non-empty list of non-empty strings", () => {
      const companies = content.interviewAngle?.companies;
      if (companies !== undefined) {
        expect(companies.length, `${key}.companies present but empty`).toBeGreaterThan(0);
        for (const c of companies) {
          expect(c.trim().length, `${key}.companies has an empty entry`).toBeGreaterThan(0);
        }
      }
    });
  });
});
