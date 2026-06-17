import type { NextStepsContent } from "@/shared/next-steps/types";

export const slidingWindowVariableNextSteps: NextStepsContent = {
  recap:
    "You can now handle a window that breathes: push the right edge out to include more, and pull the left edge in whenever a rule breaks — finding the best stretch in a single pass instead of testing every stretch.",
  interviewAngle: {
    askedAs:
      "The \"longest/shortest substring such that…\" family: longest substring without repeating characters, smallest subarray with sum >= target, longest with at most K distinct. The tell is \"longest/shortest\" plus a condition the window must satisfy.",
    tip: "Be explicit about two things: what makes the window INVALID, and that you only ever shrink from the left. Saying \"right pointer always moves forward, left only catches up, so each index is touched at most twice\" is how you justify O(n) instead of hand-waving it.",
  },
  practiceProblems: [
    {
      name: "Longest Substring Without Repeating Characters",
      difficulty: "medium",
      link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      hints: [
        "Grow the window to the right one character at a time.",
        "The rule: no character appears twice inside the window.",
        "When a repeat sneaks in, pull the left edge in until the rule holds again.",
      ],
    },
    {
      name: "Minimum Size Subarray Sum",
      difficulty: "medium",
      link: "https://leetcode.com/problems/minimum-size-subarray-sum/",
      hints: [
        "Grow right until the window's total is big enough.",
        "Then shrink from the left as long as it stays big enough — recording the smallest length.",
        "Each edge only ever moves forward, so it's still one pass.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Live network monitoring",
      description:
        "Tools watch 'how much traffic in the last N seconds' by growing and shrinking a time window as events arrive and age out.",
    },
    {
      title: "Streaming quality control",
      description:
        "A video player tracks the most recent stretch of stable connection, expanding and trimming the window as conditions change.",
    },
  ],
  relatedTopics: [
    {
      name: "Sliding Window",
      href: "/categories/algorithms/sliding-window",
      reason: "The fixed-size version — the foundation this builds on. Worth reviewing if the breathing window feels shaky.",
    },
    {
      name: "Hash Maps",
      href: "/categories/data-structures/hash-maps",
      reason: "Keeping a live count of what's inside the window — to know when a rule breaks — relies on a hash map.",
    },
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "The left and right edges are two pointers; this is two pointers with a rule deciding who moves.",
    },
  ],
  resources: [
    {
      title: "Variable-size sliding window patterns",
      type: "article",
      url: "https://www.geeksforgeeks.org/window-sliding-technique/",
    },
  ],
};
