import type { NextStepsContent } from "@/shared/next-steps/types";

export const mergesortNextSteps: NextStepsContent = {
  recap:
    "You can now sort a big list by splitting it in half until each piece is trivially sorted, then merging sorted pieces back together — and merging two already-sorted lists is the easy part, just one walk down both.",
  interviewAngle: {
    askedAs:
      "The merge STEP is the real interview asset: \"merge two sorted lists/arrays\", \"merge k sorted lists\", \"sort a linked list\" (where mergesort beats quicksort), and \"count inversions\". Pure \"sort this\" is rare; the merge-two-sorted move shows up constantly.",
    tip: "Be ready to write the two-pointer merge cleanly, including the leftover tail when one side empties first. Know the talking points: guaranteed O(n log n), stable, but O(n) extra space — and why it's the natural choice for linked lists.",
  },
  practiceProblems: [
    {
      name: "Merge Sorted Array",
      difficulty: "easy",
      link: "https://leetcode.com/problems/merge-sorted-array/",
      hints: [
        "This is just the 'merge' half of mergesort.",
        "Compare the front of each list and take the smaller one.",
        "Filling from the back avoids overwriting items you still need.",
      ],
    },
    {
      name: "Sort an Array",
      difficulty: "medium",
      link: "https://leetcode.com/problems/sort-an-array/",
      hints: [
        "Split the list in half and sort each half the same way.",
        "A list of one item is already sorted — that's where it stops.",
        "Then merge the two sorted halves into one.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Sorting data too big for memory",
      description:
        "When a file won't fit in memory, systems sort chunks separately and merge the sorted chunks — mergesort's merge step at scale.",
    },
    {
      title: "Combining sorted feeds",
      description:
        "Merging several already-sorted streams of posts or logs into one ordered timeline is exactly the merge step.",
    },
  ],
  relatedTopics: [
    {
      name: "Recursion",
      href: "/categories/algorithms/recursion",
      reason: "Mergesort is recursion in action — split, solve each half by calling itself, combine.",
    },
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "The merge step walks both halves with one marker each — a clean two-pointer move.",
    },
    {
      name: "Binary Search",
      href: "/categories/algorithms/binary-search",
      reason: "Sorting unlocks binary search — and both rely on the same cut-it-in-half idea.",
    },
  ],
  resources: [
    {
      title: "Mergesort — visual walkthrough",
      type: "video",
      url: "https://www.youtube.com/results?search_query=merge+sort+explained",
    },
  ],
};
