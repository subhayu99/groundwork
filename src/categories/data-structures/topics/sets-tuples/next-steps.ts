import type { NextStepsContent } from "@/shared/next-steps/types";

export const setsTuplesNextSteps: NextStepsContent = {
  recap:
    "You now have a bag that instantly answers 'have I seen this before?' (a set), and a fixed little group of values that can't be changed once made (a tuple) — handy as a single, reliable key.",
  practiceProblems: [
    {
      name: "Contains Duplicate",
      difficulty: "easy",
      link: "https://leetcode.com/problems/contains-duplicate/",
      hints: [
        "You only need to know if any value repeats.",
        "Walk the list, adding each value to a set.",
        "The moment a value is already in the set, you've found a repeat.",
      ],
    },
    {
      name: "Intersection of Two Arrays",
      difficulty: "easy",
      link: "https://leetcode.com/problems/intersection-of-two-arrays/",
      hints: [
        "You want the values that appear in both lists.",
        "Put the first list in a set.",
        "Keep values from the second list that the set already contains.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Removing duplicate emails",
      description:
        "Mailing tools drop repeated addresses by adding each to a set and skipping any already inside.",
    },
    {
      title: "Map coordinates as keys",
      description:
        "A point like (row, column) is a tuple — a fixed pair you can use as one key to mark 'visited' squares on a grid.",
    },
  ],
  relatedTopics: [
    {
      name: "Hash Maps",
      href: "/categories/data-structures/hash-maps",
      reason: "A set is built on the same instant-lookup trick — it just stores keys with no values attached.",
    },
    {
      name: "Arrays & Lists",
      href: "/categories/data-structures/arrays",
      reason: "Compare: a list keeps order and duplicates; a set keeps neither, but answers membership instantly.",
    },
    {
      name: "Sliding Window (Variable)",
      href: "/categories/algorithms/sliding-window-variable",
      reason: "Tracking 'are all items in this window unique?' is a set living inside a moving window.",
    },
  ],
  resources: [
    {
      title: "Sets in practice",
      type: "article",
      url: "https://www.geeksforgeeks.org/sets-in-python/",
    },
  ],
};
