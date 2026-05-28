import type { NextStepsContent } from "../sliding-window/next-steps";

export const twoPointersNextSteps: NextStepsContent = {
  practiceProblems: [
    {
      name: "Two Sum II — Input array is sorted",
      difficulty: "easy",
      link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
      hints: [
        "Where would the answer be if your sum is too small? Too large?",
        "Both pointers only move inward — never outward.",
        "Stop when they cross.",
      ],
    },
    {
      name: "Valid Palindrome",
      difficulty: "easy",
      link: "https://leetcode.com/problems/valid-palindrome/",
      hints: [
        "Two fingers, one from each end, step inward.",
        "Skip characters that aren't letters or digits.",
        "Compare lowercased letters as the pointers move.",
      ],
    },
    {
      name: "Container With Most Water",
      difficulty: "medium",
      link: "https://leetcode.com/problems/container-with-most-water/",
      hints: [
        "The shorter wall is the bottleneck — moving the taller one can't help.",
        "Always move the shorter side inward.",
        "Track the max area you've seen.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Streaming dedup of sorted IDs",
      description:
        "When merging sorted ID streams to dedupe, two pointers walk both streams in one pass — the same converging-fingers pattern.",
    },
    {
      title: "Audio waveform clipping",
      description:
        "Trim leading and trailing silence from an audio clip: one pointer from the front advances until it hits non-silence, one from the back retreats. Same shape.",
    },
  ],
  relatedTopics: [
    {
      name: "Sliding Window (Fixed)",
      href: "/categories/algorithms/sliding-window",
      reason:
        "A sliding window is two pointers that move together at a fixed distance. Same invariant idea, constrained.",
    },
    {
      name: "Binary Search",
      href: "/categories/algorithms/binary-search",
      reason:
        "Also eliminates whole sides of the search space per comparison — but via halving rather than walking.",
    },
  ],
  resources: [
    {
      title: "Two Pointers technique — overview",
      type: "article",
      url: "https://www.geeksforgeeks.org/two-pointers-technique/",
    },
  ],
};
