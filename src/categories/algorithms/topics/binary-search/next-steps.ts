import type { NextStepsContent } from "@/shared/next-steps/types";

export const binarySearchNextSteps: NextStepsContent = {
  recap:
    "You can now find something in a sorted list by throwing away half the possibilities with every single guess — so even a list of a million items is found in about twenty checks.",
  practiceProblems: [
    {
      name: "Binary Search",
      difficulty: "easy",
      link: "https://leetcode.com/problems/binary-search/",
      hints: [
        "Guess the middle. Too small? Throw away the left half. Too big? Throw away the right.",
        "Keep two markers for the part still worth checking.",
        "Stop when they cross — the item isn't there.",
      ],
    },
    {
      name: "First Bad Version",
      difficulty: "easy",
      link: "https://leetcode.com/problems/first-bad-version/",
      hints: [
        "Once a version goes bad, every version after it is bad too — that's the sorted-ness you need.",
        "You're hunting the boundary between good and bad.",
        "Check the middle: bad means the answer is here or earlier; good means it's later.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Looking up a word in a dictionary",
      description:
        "You don't read page by page — you open the middle, decide which half the word is in, and repeat. That's binary search by hand.",
    },
    {
      title: "Finding which change broke the code",
      description:
        "Developers bisect their history: test the middle commit, keep the half that still has the bug, and zero in fast.",
    },
  ],
  relatedTopics: [
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "Also shrinks the part still worth checking each step — by walking inward rather than jumping to the middle.",
    },
    {
      name: "Mergesort",
      href: "/categories/algorithms/mergesort",
      reason: "Binary search needs sorted data — this is how you get it, and it uses the same split-in-half idea.",
    },
    {
      name: "Sliding Window",
      href: "/categories/algorithms/sliding-window",
      reason: "Another way to avoid redundant work over a list — a natural next pattern to pick up.",
    },
  ],
  resources: [
    {
      title: "Binary search — visual walkthrough",
      type: "video",
      url: "https://www.youtube.com/results?search_query=binary+search+explained",
    },
  ],
};
