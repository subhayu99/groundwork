import type { NextStepsContent } from "@/shared/next-steps/types";

export const recursionNextSteps: NextStepsContent = {
  recap:
    "You can now solve a big problem by handing a smaller copy of it to the same method — trusting that copy to work, and stopping at the simplest case. This 'shrink until it's trivial' move is the engine behind trees, searching, and much more.",
  practiceProblems: [
    {
      name: "Fibonacci Number",
      difficulty: "easy",
      link: "https://leetcode.com/problems/fibonacci-number/",
      hints: [
        "Each number is the sum of the two before it.",
        "So the method asks itself for the two smaller versions and adds them.",
        "The first two numbers are the stopping point — answer those directly.",
      ],
    },
    {
      name: "Reverse String (recursively)",
      difficulty: "easy",
      link: "https://leetcode.com/problems/reverse-string/",
      hints: [
        "Reversing means swapping the outer pair, then reversing what's inside.",
        "Each call moves the two ends one step inward.",
        "Stop when the ends meet in the middle.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Exploring nested folders",
      description:
        "To list every file on a disk, a program handles each folder by handling the folders inside it the same way — recursion all the way down.",
    },
    {
      title: "Russian nesting dolls",
      description:
        "Open a doll to find a smaller doll, and do the exact same thing again — until you reach the tiny solid one. That's a base case.",
    },
  ],
  relatedTopics: [
    {
      name: "Trees",
      href: "/categories/data-structures/trees",
      reason: "The natural home for recursion — each branch is a smaller tree solved the very same way.",
    },
    {
      name: "Mergesort",
      href: "/categories/algorithms/mergesort",
      reason: "A clean payoff: split in half, sort each half by calling itself, then merge.",
    },
    {
      name: "Dynamic Programming",
      href: "/categories/algorithms/dp-1d",
      reason: "What happens when recursion redoes the same work — and how remembering answers fixes it.",
    },
  ],
  resources: [
    {
      title: "Recursion — visual introduction",
      type: "video",
      url: "https://www.youtube.com/results?search_query=recursion+explained+for+beginners",
    },
  ],
};
