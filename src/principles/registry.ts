import { PrincipleKey } from "@/shared/derivation/types";

export interface PrincipleMeta {
  key: PrincipleKey;
  name: string;
  universalFraming: string;
  order: number;
}

const principles: PrincipleMeta[] = [
  {
    key: "information-reuse",
    name: "Information Reuse",
    universalFraming: "Don't re-figure-out what you already figured out.",
    order: 1,
  },
  {
    key: "search-space-pruning",
    name: "Search Space Pruning",
    universalFraming: "Eliminate half the possibilities instead of checking each one.",
    order: 2,
  },
  {
    key: "monotonicity-and-invariants",
    name: "Monotonicity & Invariants",
    universalFraming: "Maintain a guarantee that lets you skip work.",
    order: 3,
  },
  {
    key: "decomposition",
    name: "Decomposition",
    universalFraming: "Solve a smaller version of the same problem.",
    order: 4,
  },
  {
    key: "trade-space-for-time",
    name: "Trade Space for Time",
    universalFraming: "Write it down so you can look it up instantly.",
    order: 5,
  },
  {
    key: "amortization",
    name: "Amortization",
    universalFraming: "Pay a little extra sometimes so the average is cheap.",
    order: 6,
  },
  {
    key: "greedy-choice",
    name: "Greedy Choice",
    universalFraming: "The locally best choice is globally best — when you can prove it.",
    order: 7,
  },
];

export function listPrinciples(): PrincipleMeta[] {
  return [...principles].sort((a, b) => a.order - b.order);
}

export function getPrinciple(key: PrincipleKey): PrincipleMeta | undefined {
  return principles.find((p) => p.key === key);
}
