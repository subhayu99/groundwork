import type { NextStepsContent } from "@/shared/next-steps/types";

export const hashMapsNextSteps: NextStepsContent = {
  recap:
    "You now have the great trade: spend a little extra memory to remember where things are, and looking anything up stops being a search — it becomes instant.",
  interviewAngle: {
    askedAs:
      "This is the single most reused tool in interviews. The tell is any question with 'have I seen this before,' 'count how many times,' or 'find the pair that adds to a target' in it.",
    tip: "When you catch yourself about to scan the list again inside a loop, stop and remember what you've already seen in a map instead — that turns a two-loop answer into one pass. Be ready to say the cost out loud: you're spending extra memory to make each lookup instant, and that trade is the whole point.",
    companies: ["Amazon", "Meta", "Google"],
  },
  practiceProblems: [
    {
      name: "Two Sum",
      difficulty: "easy",
      link: "https://leetcode.com/problems/two-sum/",
      hints: [
        "For each number, what's the exact partner you need?",
        "As you go, remember every number you've already seen.",
        "Before adding a number, check if its partner is already remembered.",
      ],
    },
    {
      name: "Group Anagrams",
      difficulty: "medium",
      link: "https://leetcode.com/problems/group-anagrams/",
      hints: [
        "Anagrams share the same letters — so they share a 'signature'.",
        "Sort each word's letters to get that signature.",
        "Use the signature as a key; collect all words that share it.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Phone contacts",
      description:
        "Typing a name and getting the number instantly — instead of scrolling the whole list — is a hash map at work.",
    },
    {
      title: "Caching",
      description:
        "Websites remember answers they've already computed under a key, so the next request is returned instantly instead of recomputed.",
    },
  ],
  relatedTopics: [
    {
      name: "Sets & Tuples",
      href: "/categories/data-structures/sets-tuples",
      reason: "A set is a hash map that only remembers what it has seen — perfect for spotting duplicates.",
    },
    {
      name: "Sliding Window (Variable)",
      href: "/categories/algorithms/sliding-window-variable",
      reason: "Keeping a live count of what's inside a growing-and-shrinking window leans on a hash map.",
    },
    {
      name: "Dynamic Programming",
      href: "/categories/algorithms/dp-1d",
      reason: "Remembering answers you've already worked out — so you never redo them — is the same trade pushed further.",
    },
  ],
  resources: [
    {
      title: "How hash tables work",
      type: "video",
      url: "https://www.youtube.com/results?search_query=how+hash+tables+work",
    },
  ],
};
