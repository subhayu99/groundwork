import { TopicMeta } from "@/shared/derivation/types";

export const meta: TopicMeta = {
  key: "arrays",
  name: "Arrays & Lists",
  category: "data-structures",
  principles: [],
  // Builds on the Programming Basics track: once you can loop over a collection,
  // arrays are the structure underneath. This makes the whole DS&A tree sit below
  // the fundamentals in the dependency map.
  prerequisites: ["for-loops"],
  tier: "free",
  difficulty: "foundation",
  estimatedMinutes: 8,
};
