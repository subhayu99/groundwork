import type { NextStepsContent } from "@/shared/next-steps/types";

export const backtrackingNextSteps: NextStepsContent = {
  recap:
    "You can now build up an answer one choice at a time, and the instant a choice can't possibly work, undo it and try the next — quietly skipping whole mountains of dead-end combinations you never have to look at.",
  interviewAngle: {
    askedAs:
      "The \"generate ALL of them\" set: permutations, subsets, combination sum, \"all valid parentheses\", N-Queens, word search, sudoku solver. The tell is \"find all / list every\" rather than \"count\" or \"find the best\".",
    tip: "Make the choose / recurse / un-choose loop explicit, and talk about pruning — the cut that turns brute force into backtracking. Have your duplicate-handling answer ready (sort, then skip equal siblings); that edge case is where most candidates trip.",
  },
  practiceProblems: [
    {
      name: "Subsets",
      difficulty: "medium",
      link: "https://leetcode.com/problems/subsets/",
      hints: [
        "For each item you make one choice: include it or don't.",
        "Go deeper after each choice, then undo it to explore the other branch.",
        "When you've decided on every item, you've built one complete subset.",
      ],
    },
    {
      name: "Permutations",
      difficulty: "medium",
      link: "https://leetcode.com/problems/permutations/",
      hints: [
        "Pick an unused item for the next slot, then solve the rest.",
        "Mark it used while you go deeper; unmark it when you back out.",
        "A full arrangement is done when every slot is filled.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Sudoku and puzzle solvers",
      description:
        "Try a number in a cell; if it leads to a contradiction, erase it and try the next. That trial-and-undo loop is backtracking.",
    },
    {
      title: "Auto-generating valid schedules",
      description:
        "Timetable tools place a class, check it breaks no rule, and rip it back out the moment it does — pruning impossible layouts early.",
    },
  ],
  relatedTopics: [
    {
      name: "Depth-First Search",
      href: "/categories/algorithms/dfs",
      reason: "Backtracking is depth-first search through choices — it just also undoes each choice on the way back.",
    },
    {
      name: "Recursion",
      href: "/categories/algorithms/recursion",
      reason: "Each 'try, go deeper, undo' is a recursive call — solid recursion makes backtracking click.",
    },
    {
      name: "Binary Search",
      href: "/categories/algorithms/binary-search",
      reason: "A different flavor of skipping work — ruling out whole regions instead of trying and undoing.",
    },
  ],
  resources: [
    {
      title: "Backtracking — explained",
      type: "article",
      url: "https://www.geeksforgeeks.org/introduction-to-backtracking-2/",
    },
  ],
};
