import type { NextStepsContent } from "@/shared/next-steps/types";

export const stringsNextSteps: NextStepsContent = {
  recap:
    "You now see text as just a row of characters — and you know why changing a letter often means building a fresh copy of the whole word rather than editing it in place.",
  practiceProblems: [
    {
      name: "Reverse String",
      difficulty: "easy",
      link: "https://leetcode.com/problems/reverse-string/",
      hints: [
        "You can flip it without a second list.",
        "Swap the first and last characters, then move inward.",
        "Stop when the two markers meet.",
      ],
    },
    {
      name: "Valid Anagram",
      difficulty: "easy",
      link: "https://leetcode.com/problems/valid-anagram/",
      hints: [
        "Two words are anagrams if they use the exact same letters the same number of times.",
        "Count each letter in the first word.",
        "Subtract as you walk the second — everything should land back at zero.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Search and find-replace",
      description:
        "Every time an editor finds a word or replaces text, it's walking a row of characters and comparing pieces — the core of string work.",
    },
    {
      title: "Web addresses and file paths",
      description:
        "Splitting a URL into its parts means scanning the text for separators like '/' and '?' and cutting between them.",
    },
  ],
  relatedTopics: [
    {
      name: "Arrays & Lists",
      href: "/categories/data-structures/arrays",
      reason: "A string is a list of characters — the same storage idea underneath.",
    },
    {
      name: "Hash Maps",
      href: "/categories/data-structures/hash-maps",
      reason: "Counting letters or spotting repeats in text is the classic use of a hash map.",
    },
    {
      name: "Sliding Window",
      href: "/categories/algorithms/sliding-window",
      reason: "Most 'find the longest stretch of text that...' problems are sliding windows over characters.",
    },
  ],
  resources: [
    {
      title: "String algorithms — overview",
      type: "article",
      url: "https://www.geeksforgeeks.org/string-data-structure/",
    },
  ],
};
