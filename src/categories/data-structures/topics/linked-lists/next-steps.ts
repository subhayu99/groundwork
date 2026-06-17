import type { NextStepsContent } from "@/shared/next-steps/types";

export const linkedListsNextSteps: NextStepsContent = {
  recap:
    "You now know a list that doesn't sit in one row: each item just holds an arrow to the next one. That makes inserting in the middle cheap, but reaching the middle slow — the exact opposite trade-off from a plain list.",
  interviewAngle: {
    askedAs:
      "Expect 'reverse this list,' 'find the middle in one pass,' 'detect a loop,' or 'merge two sorted lists.' These check whether you can rewire arrows without losing the rest of the chain.",
    tip: "Draw three or four nodes on the whiteboard and move a 'previous / current / next' set of markers by hand before you code — pointer questions go wrong when you reassign an arrow and lose the node you still needed. For 'find the middle' or 'is there a loop,' reach for the slow-and-fast marker pair; recognizing that pattern fast is the signal interviewers want.",
    companies: ["Microsoft", "Amazon", "Bloomberg"],
  },
  practiceProblems: [
    {
      name: "Reverse Linked List",
      difficulty: "easy",
      link: "https://leetcode.com/problems/reverse-linked-list/",
      hints: [
        "Reversing means flipping every arrow to point backward.",
        "Walk the list with three markers: previous, current, and next.",
        "Before moving on, point current's arrow back at previous.",
      ],
    },
    {
      name: "Linked List Cycle",
      difficulty: "easy",
      link: "https://leetcode.com/problems/linked-list-cycle/",
      hints: [
        "If the arrows loop forever, how would you ever know?",
        "Send one marker one step at a time and another two steps at a time.",
        "If there's a loop, the fast one eventually laps the slow one.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Music and slideshow playlists",
      description:
        "A 'next track' button just follows the arrow to the next item — and you can splice a song in without renumbering everything after it.",
    },
    {
      title: "Browser history chains",
      description:
        "Each page links back to the previous one, forming a chain you can walk in either direction.",
    },
  ],
  relatedTopics: [
    {
      name: "Arrays & Lists",
      href: "/categories/data-structures/arrays",
      reason: "The other way to store a sequence — compare the trade-offs side by side.",
    },
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "The fast-and-slow marker trick for cycles is two pointers in disguise.",
    },
    {
      name: "Trees",
      href: "/categories/data-structures/trees",
      reason: "A tree is a linked structure too — items connected by arrows, just branching instead of in a line.",
    },
  ],
  resources: [
    {
      title: "Linked Lists — visual introduction",
      type: "video",
      url: "https://www.youtube.com/results?search_query=linked+list+explained",
    },
  ],
};
