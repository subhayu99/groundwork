import type { NextStepsContent } from "@/shared/next-steps/types";

export const twoPointersNextSteps: NextStepsContent = {
  recap:
    "You can now solve in one pass what used to need checking every pair: put one marker at each end (or both at the start) and move them toward each other based on what you see.",
  practiceProblems: [
    {
      name: "Two Sum II — Input Array Is Sorted",
      difficulty: "easy",
      link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
      hints: [
        "If your two numbers add up to too little, which marker should move?",
        "Both markers only ever move inward — never back out.",
        "Stop when they meet.",
      ],
    },
    {
      name: "Valid Palindrome",
      difficulty: "easy",
      link: "https://leetcode.com/problems/valid-palindrome/",
      hints: [
        "One finger from each end, stepping inward.",
        "Skip anything that isn't a letter or digit.",
        "Compare the two letters, ignoring capitals, as the fingers move.",
      ],
    },
    {
      name: "Container With Most Water",
      difficulty: "medium",
      link: "https://leetcode.com/problems/container-with-most-water/",
      hints: [
        "The shorter wall decides how much water fits — moving the taller one can't help.",
        "So always move the shorter side inward.",
        "Keep track of the most water you've seen.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Merging sorted lists",
      description:
        "Combining two already-sorted lists of IDs — like merging contacts — walks both with one marker each in a single pass. Same converging-fingers shape.",
    },
    {
      title: "Trimming silence from audio",
      description:
        "To cut quiet edges off a recording, one marker advances from the front until it hits sound and one retreats from the back. Two pointers, meeting in the middle.",
    },
  ],
  relatedTopics: [
    {
      name: "Sliding Window",
      href: "/categories/algorithms/sliding-window",
      reason: "A sliding window is two markers that move together at a fixed distance — the same idea, with the gap locked.",
    },
    {
      name: "Binary Search",
      href: "/categories/algorithms/binary-search",
      reason: "Also throws away whole sections of the data each step — but by jumping to the middle rather than walking inward.",
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
