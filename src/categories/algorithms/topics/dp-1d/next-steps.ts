import type { NextStepsContent } from "@/shared/next-steps/types";

export const dp1dNextSteps: NextStepsContent = {
  recap:
    "You now have the big payoff of remembering: when a problem keeps asking for the same smaller answers, write each one down the first time and reuse it forever after. A calculation that used to explode becomes a quick walk through a list of answers.",
  interviewAngle: {
    askedAs:
      "\"Climbing stairs\", \"house robber\", \"max subarray (Kadane's)\", \"coin change\", \"longest increasing subsequence\" — the family where the answer at position i is built from a couple of earlier answers, and \"count the ways\" or \"max/min total\" appears.",
    tip: "Say the recurrence in words first — \"the best ending here is the best of taking this or skipping it\" — define what dp[i] MEANS, then nail the base cases. Bonus points for noticing you only need the last one or two values and dropping the array to O(1) space.",
  },
  practiceProblems: [
    {
      name: "Climbing Stairs",
      difficulty: "easy",
      link: "https://leetcode.com/problems/climbing-stairs/",
      hints: [
        "The ways to reach a step depend on the two steps below it.",
        "That's the same shape as the Fibonacci numbers.",
        "Build the answers from the bottom up, keeping the last two as you go.",
      ],
    },
    {
      name: "House Robber",
      difficulty: "medium",
      link: "https://leetcode.com/problems/house-robber/",
      hints: [
        "At each house you either take it (and skip the previous) or skip it.",
        "The best up to a house depends on the best up to the two houses before it.",
        "Walk the row once, keeping the best total so far.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Spell-check and autocorrect",
      description:
        "Measuring how close two words are reuses thousands of already-computed sub-comparisons instead of redoing them — classic remembering.",
    },
    {
      title: "Trip and resource planning",
      description:
        "Tools that pick the best route or the best use of a budget store the best answer for each smaller piece and combine them.",
    },
  ],
  relatedTopics: [
    {
      name: "Recursion",
      href: "/categories/algorithms/recursion",
      reason: "Where this starts — the plain recursive solution that wastefully redoes work is exactly what remembering fixes.",
    },
    {
      name: "Hash Maps",
      href: "/categories/data-structures/hash-maps",
      reason: "The 'write the answer down so you can grab it instantly' part is a hash map doing its job.",
    },
    {
      name: "Activity Selection",
      href: "/categories/algorithms/activity-selection",
      reason: "The contrast: when one greedy grab is enough, you don't need to weigh every option like this.",
    },
  ],
  resources: [
    {
      title: "Dynamic programming — beginner's introduction",
      type: "video",
      url: "https://www.youtube.com/results?search_query=dynamic+programming+for+beginners",
    },
  ],
};
