import type { NextStepsContent } from "@/shared/next-steps/types";

export const treesNextSteps: NextStepsContent = {
  recap:
    "You now see the branching shape: one top item splits into smaller groups, and each of those is itself a smaller tree. That self-similar structure is what makes 'solve it for the children, then combine' such a natural fit.",
  interviewAngle: {
    askedAs:
      "Tree questions cluster around depth, mirroring, path sums, and whether a tree is a valid search tree. The 'how would you walk it' part — in order, top-down, or level by level — is often the real question.",
    tip: "Lean on the self-similar shape: ask each child for its own answer, then combine, and state the base case (an empty branch) first so the recursion has a floor. When order across a level matters, switch to a queue and go level by level instead. Knowing when to drop recursion for that is what stands out.",
    companies: ["Amazon", "Google", "Facebook"],
  },
  practiceProblems: [
    {
      name: "Maximum Depth of Binary Tree",
      difficulty: "easy",
      link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
      hints: [
        "The depth of a tree is one more than the deeper of its two branches.",
        "Ask each branch for its own depth.",
        "An empty branch has depth zero — that's where it bottoms out.",
      ],
    },
    {
      name: "Invert Binary Tree",
      difficulty: "easy",
      link: "https://leetcode.com/problems/invert-binary-tree/",
      hints: [
        "Mirroring means swapping left and right everywhere.",
        "Swap the two branches of the top node.",
        "Then ask each branch to mirror itself the same way.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Folders on your computer",
      description:
        "A folder holds files and more folders, each of which holds more — a tree you navigate every day.",
    },
    {
      title: "Comment threads",
      description:
        "A reply hangs off a comment, replies hang off that, and so on — a tree of conversation.",
    },
  ],
  relatedTopics: [
    {
      name: "Recursion",
      href: "/categories/algorithms/recursion",
      reason: "Trees and recursion are made for each other — a branch is just a smaller tree to solve the same way.",
    },
    {
      name: "Depth-First Search",
      href: "/categories/algorithms/dfs",
      reason: "Walking a tree all the way down one branch before backing up is depth-first search.",
    },
    {
      name: "Graphs",
      href: "/categories/data-structures/graphs",
      reason: "A tree is a special, tidy graph — once you add loops and extra links, it becomes a full graph.",
    },
  ],
  resources: [
    {
      title: "Binary trees — introduction",
      type: "article",
      url: "https://www.geeksforgeeks.org/binary-tree-data-structure/",
    },
  ],
};
