import type { NextStepsContent } from "@/shared/next-steps/types";

export const activitySelectionNextSteps: NextStepsContent = {
  recap:
    "You now have your first greedy method: to fit the most non-overlapping activities, always grab the one that finishes earliest. Taking the locally best option, with no looking back, gives the overall best answer here.",
  practiceProblems: [
    {
      name: "Non-overlapping Intervals",
      difficulty: "medium",
      link: "https://leetcode.com/problems/non-overlapping-intervals/",
      hints: [
        "Fitting the most non-overlapping intervals is the same as removing the fewest.",
        "Sort by finish time, then keep grabbing the earliest-finishing one that still fits.",
        "Anything that overlaps the last one you kept gets removed.",
      ],
    },
    {
      name: "Merge Intervals",
      difficulty: "medium",
      link: "https://leetcode.com/problems/merge-intervals/",
      hints: [
        "Sort by start time so overlaps sit next to each other.",
        "Walk through, extending the current block whenever the next one overlaps.",
        "When the next one doesn't overlap, the current block is finished.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Booking a meeting room",
      description:
        "To pack the most meetings into one room, schedulers favor the ones that free the room earliest — exactly this greedy rule.",
    },
    {
      title: "Scheduling jobs on a machine",
      description:
        "Factories and CPUs squeeze in the most tasks by repeatedly committing to the soonest-finishing compatible job.",
    },
  ],
  relatedTopics: [
    {
      name: "Mergesort",
      href: "/categories/algorithms/mergesort",
      reason: "Greedy methods usually start by sorting — this is how the sort underneath actually works.",
    },
    {
      name: "Dynamic Programming",
      href: "/categories/algorithms/dp-1d",
      reason: "When a quick greedy grab isn't enough, you weigh every option instead — the natural step up.",
    },
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "Walking through sorted intervals with one marker is a close relative of the two-pointer sweep.",
    },
  ],
  resources: [
    {
      title: "Greedy algorithms — introduction",
      type: "article",
      url: "https://www.geeksforgeeks.org/greedy-algorithms/",
    },
  ],
};
