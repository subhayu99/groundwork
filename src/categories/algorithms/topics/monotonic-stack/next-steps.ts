import type { NextStepsContent } from "@/shared/next-steps/types";

export const monotonicStackNextSteps: NextStepsContent = {
  recap:
    "You can now answer 'what's the next bigger thing to the right?' for every item in one pass — by keeping a stack in order and letting each item kick out the smaller ones waiting behind it. Each item is added and removed just once.",
  practiceProblems: [
    {
      name: "Daily Temperatures",
      difficulty: "medium",
      link: "https://leetcode.com/problems/daily-temperatures/",
      hints: [
        "For each day you want the wait until a warmer day.",
        "Keep a stack of days still waiting for something warmer.",
        "A warm day clears out every cooler day waiting on the stack — and that wait is your answer for each.",
      ],
    },
    {
      name: "Next Greater Element",
      difficulty: "easy",
      link: "https://leetcode.com/problems/next-greater-element-i/",
      hints: [
        "Walk the numbers, keeping a stack of ones still looking for a bigger neighbor.",
        "A new number bigger than the top answers that one — pop it.",
        "Whatever is left on the stack at the end has no greater element.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Stock span",
      description:
        "Finance tools compute, for each day, how many days in a row the price stayed below today's — exactly this kept-in-order stack.",
    },
    {
      title: "Skyline and histogram tools",
      description:
        "Figuring out the largest rectangle that fits under a row of bars uses a monotonic stack to track which bars are still 'open'.",
    },
  ],
  relatedTopics: [
    {
      name: "Stacks & Queues",
      href: "/categories/data-structures/stacks-queues",
      reason: "The plain stack this technique is built on — review it if 'push and pop' feels unfamiliar.",
    },
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "Another 'each item handled a constant number of times' pattern — same spirit of avoiding repeat work.",
    },
    {
      name: "Sliding Window (Variable)",
      href: "/categories/algorithms/sliding-window-variable",
      reason: "Also processes a list in one sweep while maintaining a running structure as items enter and leave.",
    },
  ],
  resources: [
    {
      title: "Monotonic stack — explained",
      type: "article",
      url: "https://www.geeksforgeeks.org/introduction-to-monotonic-stack/",
    },
  ],
};
