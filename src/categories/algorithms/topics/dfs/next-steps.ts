import type { NextStepsContent } from "@/shared/next-steps/types";

export const dfsNextSteps: NextStepsContent = {
  recap:
    "You can now explore any connected structure by going as deep as possible down one path, then backing up to try the next — marking where you've been so you never loop forever.",
  interviewAngle: {
    askedAs:
      "\"Number of islands\", \"clone a graph\", \"course schedule / detect a cycle\", \"flood fill\", \"path exists between two nodes\". Often a 2D grid that's secretly a graph — each cell is a node, neighbors are the edges.",
    tip: "Decide recursion vs explicit stack up front, and say where the visited-set goes and why (skip a node before you recurse into it, or you'll revisit and possibly loop). For grids, state your neighbor rule (4-directional vs 8) before coding.",
  },
  practiceProblems: [
    {
      name: "Number of Islands",
      difficulty: "medium",
      link: "https://leetcode.com/problems/number-of-islands/",
      hints: [
        "From each unvisited land square, dive into every connected land square.",
        "Mark squares as you visit so you don't count them twice.",
        "Each fresh dive you have to start is one more island.",
      ],
    },
    {
      name: "Max Area of Island",
      difficulty: "medium",
      link: "https://leetcode.com/problems/max-area-of-island/",
      hints: [
        "Same dive as counting islands — but now return a size.",
        "An island's size is one (this square) plus the sizes its neighbors report back.",
        "Track the largest size you see across all dives.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Solving a maze",
      description:
        "Following one path until you hit a dead end, then retracing to the last fork to try another, is depth-first search by hand.",
    },
    {
      title: "Detecting circular dependencies",
      description:
        "Build tools dive through what-depends-on-what; if a dive ever returns to where it started, there's a cycle.",
    },
  ],
  relatedTopics: [
    {
      name: "Breadth-First Search",
      href: "/categories/algorithms/bfs",
      reason: "The sibling strategy — explore in rings instead of diving deep. Compare when each one wins.",
    },
    {
      name: "Recursion",
      href: "/categories/algorithms/recursion",
      reason: "Diving deep and backing up is recursion's natural shape — the back-up is just the call returning.",
    },
    {
      name: "Backtracking",
      href: "/categories/algorithms/backtracking",
      reason: "Backtracking is depth-first search that also undoes each choice as it backs up.",
    },
  ],
  resources: [
    {
      title: "Depth-first search — explained",
      type: "video",
      url: "https://www.youtube.com/results?search_query=depth+first+search+explained",
    },
  ],
};
