export interface NextStepsContent {
  practiceProblems: Array<{
    name: string;
    difficulty: "easy" | "medium" | "hard";
    link?: string;
    hints: string[];
  }>;
  realWorld: Array<{ title: string; description: string }>;
  relatedTopics: Array<{ name: string; href: string; reason: string }>;
  resources: Array<{ title: string; type: "video" | "article" | "book"; url?: string }>;
}

export const slidingWindowNextSteps: NextStepsContent = {
  practiceProblems: [
    {
      name: "Maximum Sum of K Consecutive Elements",
      difficulty: "easy",
      link: "https://leetcode.com/problems/maximum-average-subarray-i/",
      hints: [
        "What computation are you redoing every slide?",
        "Can you store the previous window's sum and update it in O(1)?",
        "Track the max as you go — don't store every window.",
      ],
    },
    {
      name: "Longest Substring Without Repeating Characters",
      difficulty: "medium",
      link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      hints: [
        "This is a *variable* window — when does the right edge expand vs the left edge shrink?",
        "What invariant does the window maintain at every step?",
        "A hash map can tell you in O(1) whether expanding breaks the invariant.",
      ],
    },
  ],
  realWorld: [
    {
      title: "Redis rate limiting",
      description:
        "Redis tracks request counts within a sliding time window to enforce rate limits — a real-time variant of exactly this pattern.",
    },
    {
      title: "Moving averages in finance",
      description:
        "30-day moving averages of stock prices use the sliding window technique to avoid recomputing the sum at every tick.",
    },
  ],
  relatedTopics: [
    {
      name: "Two Pointers",
      href: "/categories/algorithms/two-pointers",
      reason: "The closest cousin — same monotonicity principle, just without the bounded window size.",
    },
    {
      name: "Prefix Sum + HashMap",
      href: "/categories/algorithms/prefix-sum-hashmap",
      reason:
        "Information reuse turned up to 11: precompute every prefix sum once, answer any range query in O(1).",
    },
  ],
  resources: [
    {
      title: "Sliding Window Technique — visual walkthrough",
      type: "video",
      url: "https://www.youtube.com/results?search_query=sliding+window+algorithm",
    },
  ],
};
