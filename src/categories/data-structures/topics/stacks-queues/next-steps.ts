import type { NextStepsContent } from "@/shared/next-steps/types";

export const stacksQueuesNextSteps: NextStepsContent = {
  recap:
    "You now have two ways to hold a line of things: a stack, where the last one in comes out first (like a pile of plates), and a queue, where the first one in comes out first (like a line at a counter).",
  practiceProblems: [
    {
      name: "Valid Parentheses",
      difficulty: "easy",
      link: "https://leetcode.com/problems/valid-parentheses/",
      hints: [
        "Every opening bracket needs a matching closer later.",
        "Push each opener onto a stack; pop when you meet its closer.",
        "If the top doesn't match — or the stack isn't empty at the end — it's invalid.",
      ],
    },
    {
      name: "Implement Queue using Stacks",
      difficulty: "easy",
      link: "https://leetcode.com/problems/implement-queue-using-stacks/",
      hints: [
        "One stack reverses the order; two stacks reverse it back.",
        "Push onto an 'in' stack.",
        "Pour into an 'out' stack only when 'out' is empty.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Undo and back buttons",
      description:
        "Every undo, and every browser back button, pops the most recent action off a stack — last thing you did is the first thing reversed.",
    },
    {
      title: "Print and task queues",
      description:
        "Documents sent to a printer, or jobs waiting for a server, are handled first-come-first-served — a queue.",
    },
  ],
  relatedTopics: [
    {
      name: "Monotonic Stack",
      href: "/categories/algorithms/monotonic-stack",
      reason: "A clever use of a stack that answers 'what's the next bigger thing?' in a single pass.",
    },
    {
      name: "Breadth-First Search",
      href: "/categories/algorithms/bfs",
      reason: "Exploring step by step, closest first, is powered by a queue.",
    },
    {
      name: "Recursion",
      href: "/categories/algorithms/recursion",
      reason: "Every function that calls itself quietly uses a stack behind the scenes.",
    },
  ],
  resources: [
    {
      title: "Stacks and Queues explained",
      type: "article",
      url: "https://www.geeksforgeeks.org/stack-data-structure/",
    },
  ],
};
