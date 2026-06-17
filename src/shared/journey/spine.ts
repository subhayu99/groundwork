/**
 * THE JOURNEY SPINE — a named, domain-agnostic layer over the existing track
 * registry. It does NOT re-order anything; it *names* the arc into a four-stage
 * journey and answers "where am I / what's next."
 *
 * Front-Door Wave (2026-06). FROZEN CONTRACT — see docs/contracts/JOURNEY-SPINE.md.
 * Every leaf imports these types/selectors; none redefine them.
 *
 * Stage definitions reference `categoryKeys`, so adding a track later
 * (e.g. system-design) plus one STAGES row extends the journey with zero leaf
 * changes. Stage 4 (`fluency`) has NO category of its own — it is the
 * DESTINATION (practice / recall / interview-ready), pointing at /progress.
 *
 * Robustness rule (H10-adjacent): the rollup NEVER throws on an empty or
 * partial ProgressState — a bare `{}` is tolerated. Newcomers (no progress yet)
 * are the common case for these surfaces.
 */

import { listTopicsInCategory } from "@/categories/registry";
import type { ProgressState } from "@/shared/progress/types";

export interface JourneyStage {
  /** Stable stage id (also the URL/test key). */
  key: string;
  /** 1-based stage number (1..total). */
  n: number;
  /** How many stages there are (always 4). */
  total: number;
  /** Display name. */
  name: string;
  /** One-line promise — what this stage lets you do. */
  promise: string;
  /** Registry category keys this stage names (empty for the destination). */
  categoryKeys: string[];
  /** Where the stage's CTA goes. */
  href: string;
}

const TOTAL = 4;

/**
 * The four stages, in journey order. `total` is 4 on every stage.
 * Stage 4 (`fluency`) is the destination: empty `categoryKeys`, points at
 * /progress (the recall/practice home).
 */
export const STAGES: JourneyStage[] = [
  {
    key: "foundations",
    n: 1,
    total: TOTAL,
    name: "Foundations",
    promise: "Make the computer do what you say.",
    categoryKeys: ["programming-basics"],
    href: "/categories/programming-basics",
  },
  {
    key: "structures",
    n: 2,
    total: TOTAL,
    name: "Structures",
    promise: "Hold data so you can find it again.",
    categoryKeys: ["data-structures"],
    href: "/categories/data-structures",
  },
  {
    key: "techniques",
    n: 3,
    total: TOTAL,
    name: "Techniques",
    promise: "Turn the seven ideas into algorithms.",
    categoryKeys: ["algorithms"],
    href: "/categories/algorithms",
  },
  {
    key: "fluency",
    n: 4,
    total: TOTAL,
    name: "Fluency",
    promise: "Make it stick — practice, recall, interview-ready.",
    categoryKeys: [],
    href: "/progress",
  },
];

/** The stage that names a given category, or undefined. */
export function stageForCategory(categoryKey: string): JourneyStage | undefined {
  return STAGES.find((s) => s.categoryKeys.includes(categoryKey));
}

/**
 * The stage that owns a given topic, via its category in the registry.
 * Resolves by scanning each concrete stage's categories for the topic key, so
 * it stays correct without depending on topic→category lookups elsewhere.
 */
export function stageForTopic(topicKey: string): JourneyStage | undefined {
  for (const stage of STAGES) {
    for (const ck of stage.categoryKeys) {
      if (listTopicsInCategory(ck).some((t) => t.key === topicKey)) return stage;
    }
  }
  return undefined;
}

export interface StageProgress {
  stage: JourneyStage;
  /** Completed registry topics within this stage's categories. */
  doneInStage: number;
  /** Total registry topics within this stage's categories (0 for the destination). */
  totalInStage: number;
  /** Platform-wide completed count across the concrete stages (same on every row). */
  overallDone: number;
  /** Platform-wide topic count across the concrete stages (same on every row). */
  overallTotal: number;
}

/** True iff a topic record is present AND marked completed. Tolerant of holes. */
function isTopicCompleted(
  state: ProgressState | undefined,
  categoryKey: string,
  topicKey: string,
): boolean {
  return state?.categories?.[categoryKey]?.[topicKey]?.derivation?.completed === true;
}

/**
 * Per-stage rollup from a ProgressState. NEVER throws on empty/partial state.
 *
 * - `doneInStage` / `totalInStage` count ONLY registry topics in the stage's
 *   categories (stale/unknown keys in saved state are ignored — they cannot
 *   inflate the count, and a topic recorded-but-not-completed does not count).
 * - `overallDone` / `overallTotal` are the running PLATFORM-WIDE totals across
 *   the concrete stages (1..3); they are identical on every returned row.
 * - The destination stage (`fluency`, empty categories) reports
 *   totalInStage = 0 — consumers treat it as the journey's end, not a topic set.
 *
 * The CURRENT stage is intentionally NOT returned here: consumers compute it as
 * the first stage with `doneInStage < totalInStage` (falling through to the
 * destination when every concrete stage is complete).
 */
export function journeyProgress(state: ProgressState): StageProgress[] {
  const rows = STAGES.map((stage) => {
    let doneInStage = 0;
    let totalInStage = 0;
    for (const ck of stage.categoryKeys) {
      for (const topic of listTopicsInCategory(ck)) {
        totalInStage += 1;
        if (isTopicCompleted(state, ck, topic.key)) doneInStage += 1;
      }
    }
    return { stage, doneInStage, totalInStage };
  });

  const overallTotal = rows.reduce((acc, r) => acc + r.totalInStage, 0);
  const overallDone = rows.reduce((acc, r) => acc + r.doneInStage, 0);

  return rows.map((r) => ({ ...r, overallDone, overallTotal }));
}
