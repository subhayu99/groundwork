import type { NextStepsContent } from "@/shared/next-steps/types";

export const graphsNextSteps: NextStepsContent = {
  recap:
    "You now have the most general shape there is: dots connected by lines, where anything can link to anything. Maps, friend networks, and dependency charts are all graphs — and most graph problems come down to 'how do I explore it without getting lost or going in circles?'",
  practiceProblems: [
    {
      name: "Number of Islands",
      difficulty: "medium",
      link: "https://leetcode.com/problems/number-of-islands/",
      hints: [
        "Each square of land connects to its neighbors — that's a graph hidden in a grid.",
        "Start at any unvisited land square and explore everything reachable from it.",
        "Each fresh start you make is one new island; mark squares so you don't recount them.",
      ],
    },
    {
      name: "Clone Graph",
      difficulty: "medium",
      link: "https://leetcode.com/problems/clone-graph/",
      hints: [
        "You're making a copy where every dot and every link is duplicated.",
        "Use a hash map from each original dot to its copy.",
        "When you reach a dot you've already copied, reuse that copy instead of making another.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Maps and navigation",
      description:
        "Intersections are dots and roads are the lines between them — finding the shortest drive is a graph search.",
    },
    {
      title: "Social networks",
      description:
        "People are dots, friendships are lines. 'People you may know' walks the graph a couple of links out.",
    },
  ],
  relatedTopics: [
    {
      name: "Depth-First Search",
      href: "/categories/algorithms/dfs",
      reason: "One of the two core ways to explore a graph — go as deep as you can, then back up.",
    },
    {
      name: "Breadth-First Search",
      href: "/categories/algorithms/bfs",
      reason: "The other core way — spread outward in rings, which finds shortest paths.",
    },
    {
      name: "Trees",
      href: "/categories/data-structures/trees",
      reason: "A tree is the simplest graph — no loops, one clear top. Good intuition before tackling tangled graphs.",
    },
  ],
  resources: [
    {
      title: "Graph theory — visual introduction",
      type: "video",
      url: "https://www.youtube.com/results?search_query=graph+data+structure+explained",
    },
  ],
};
