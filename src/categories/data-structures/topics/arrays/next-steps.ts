import type { NextStepsContent } from "@/shared/next-steps/types";

export const arraysNextSteps: NextStepsContent = {
  recap:
    "You now know why a list keeps its items in one unbroken row, why jumping straight to item #5,000 is just as fast as item #1, and why squeezing a new item into the middle is the slow part.",
  practiceProblems: [
    {
      name: "Remove Duplicates from Sorted Array",
      difficulty: "easy",
      link: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
      hints: [
        "You don't need a second list — overwrite in place.",
        "Keep one marker for where the next kept item goes.",
        "Only write when the current item differs from the last one you kept.",
      ],
    },
    {
      name: "Rotate Array",
      difficulty: "medium",
      link: "https://leetcode.com/problems/rotate-array/",
      hints: [
        "Moving every item one-by-one is slow — is there a pattern?",
        "Try reversing the whole list, then reversing two pieces of it.",
        "Where does the split go for a rotation of size k?",
      ],
    },
  ],
  realWorld: [
    {
      title: "Image pixels",
      description:
        "A photo is just a long row of color values. Reaching any pixel instantly — by its position — is what makes editing fast.",
    },
    {
      title: "Spreadsheets",
      description:
        "A column of cells is a list. Inserting a row near the top shifts everything below it down — exactly why it feels slower than adding at the end.",
    },
  ],
  relatedTopics: [
    {
      name: "Strings",
      href: "/categories/data-structures/strings",
      reason: "A piece of text is just a list of characters — everything you learned here applies directly.",
    },
    {
      name: "Linked Lists",
      href: "/categories/data-structures/linked-lists",
      reason: "The opposite trade-off: slow to reach the middle, but fast to insert there.",
    },
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "The first real technique built on top of a plain list — two markers walking through it.",
    },
  ],
  resources: [
    {
      title: "How arrays work in memory",
      type: "article",
      url: "https://www.geeksforgeeks.org/introduction-to-arrays/",
    },
  ],
};
