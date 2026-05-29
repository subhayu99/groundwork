import type { NextStepsContent } from "@/shared/next-steps/types";

export const slidingWindowNextSteps: NextStepsContent = {
  recap:
    "You can now scan every block of a fixed size in one pass — instead of re-adding the same numbers over and over, you slide the window and just adjust for the one item that left and the one that joined.",
  practiceProblems: [
    {
      name: "Maximum Average Subarray",
      difficulty: "easy",
      link: "https://leetcode.com/problems/maximum-average-subarray-i/",
      hints: [
        "What are you re-adding every time you slide?",
        "Keep the previous window's sum, then subtract the item leaving and add the item joining.",
        "Track the best average as you go — don't store every window.",
      ],
    },
    {
      name: "Longest Substring Without Repeating Characters",
      difficulty: "medium",
      link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      hints: [
        "Here the window changes size — when should the right edge move, and when should the left edge?",
        "What rule must stay true inside the window the whole time?",
        "A hash map can tell you instantly whether a new character breaks the rule.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Rate limiting",
      description:
        "Servers count how many requests you sent in the last 60 seconds by sliding a time window forward — the same trick, applied to time instead of an array.",
    },
    {
      title: "Moving averages in finance",
      description:
        "A 30-day average stock price slides one day forward at a time, reusing yesterday's total instead of re-adding 30 numbers every day.",
    },
  ],
  relatedTopics: [
    {
      name: "Sliding Window (Variable)",
      href: "/categories/algorithms/sliding-window-variable",
      reason: "Same window idea, but now it grows and shrinks to keep a rule true instead of staying a fixed size.",
    },
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "The close cousin — two markers walking through the data, just without a fixed gap between them.",
    },
  ],
  resources: [
    {
      title: "Sliding Window Technique — visual walkthrough",
      type: "video",
      url: "https://www.youtube.com/results?search_query=sliding+window+algorithm",
    },
  ],
};
