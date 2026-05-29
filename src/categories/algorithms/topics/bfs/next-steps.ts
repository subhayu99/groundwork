import type { NextStepsContent } from "@/shared/next-steps/types";

export const bfsNextSteps: NextStepsContent = {
  recap:
    "You can now explore outward in rings — everything one step away, then everything two steps away — using a queue. Because you reach closer things first, the moment you arrive somewhere, you arrived by the shortest path.",
  practiceProblems: [
    {
      name: "Binary Tree Level Order Traversal",
      difficulty: "medium",
      link: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
      hints: [
        "You want the nodes grouped by how deep they are.",
        "A queue naturally hands them to you closest-first.",
        "Process one full ring at a time before starting the next.",
      ],
    },
    {
      name: "Rotting Oranges",
      difficulty: "medium",
      link: "https://leetcode.com/problems/rotting-oranges/",
      hints: [
        "Rot spreads to all neighbors at once each minute — that's one ring per minute.",
        "Start the queue with every already-rotten orange.",
        "Each ring you spread is one more minute elapsed.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Shortest route on a map",
      description:
        "When every road costs the same, spreading outward ring by ring reaches your destination by the fewest hops — the basis of simple route finding.",
    },
    {
      title: "Degrees of separation",
      description:
        "'Friends of friends' on a social network is BFS: rings of people one connection, then two connections, out from you.",
    },
  ],
  relatedTopics: [
    {
      name: "Depth-First Search",
      href: "/categories/algorithms/dfs",
      reason: "The sibling strategy — dives deep instead of spreading wide. Compare when each one wins.",
    },
    {
      name: "Stacks & Queues",
      href: "/categories/data-structures/stacks-queues",
      reason: "BFS runs on a queue — the first-in-first-out line is exactly what makes the rings work.",
    },
    {
      name: "Graphs",
      href: "/categories/data-structures/graphs",
      reason: "The structure BFS shines on — networks where you need the shortest number of hops.",
    },
  ],
  resources: [
    {
      title: "Breadth-first search — explained",
      type: "video",
      url: "https://www.youtube.com/results?search_query=breadth+first+search+explained",
    },
  ],
};
