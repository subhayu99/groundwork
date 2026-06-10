import type { AudienceProfile } from "@/shared/audience/types";
import {
  ProgressState,
  TopicProgress,
  ProblemAttempt,
  ProgressMeta,
  ReviewState,
  ReviewOutcome,
  emptyProgressState,
  emptyTopicProgress,
  PROGRESS_SCHEMA_VERSION,
  MAX_REVIEW_OUTCOMES,
  MAX_VISIT_DAYS,
} from "./types";

/**
 * MIGRATION — THE RULE (H10): no code path may ever silently drop a user's
 * `categories` data.
 *
 * `migrate()` is a TOTAL function: any parsed JSON value in → a valid
 * current-version ProgressState out, never throws. It is one field-preserving
 * salvage pass rather than per-version steps, which makes every case land in
 * the same place:
 *
 *   • v1 blob        → carried over verbatim (topics, audience, settings);
 *                      v2 fields (review/meta) simply absent — nothing
 *                      destructive is added.
 *   • v2 blob        → passes through, sub-fields sanitized (caps enforced).
 *   • unknown/newer/corrupted version → best-effort field-preserving load:
 *                      salvage every topic that parses, default only the
 *                      sub-fields that don't. NEVER returns empty state when
 *                      categories data exists.
 *
 * `load()` runs every stored blob through this; `save()` always writes the
 * current PROGRESS_SCHEMA_VERSION, so a loaded-then-saved legacy blob is
 * upgraded in place.
 */
export function migrate(parsed: unknown): ProgressState {
  const empty = emptyProgressState();
  if (!isRecord(parsed)) return empty;

  const state: ProgressState = {
    version: PROGRESS_SCHEMA_VERSION,
    lastUpdated:
      typeof parsed.lastUpdated === "string" ? parsed.lastUpdated : empty.lastUpdated,
    categories: migrateCategories(parsed.categories),
    settings: migrateSettings(parsed.settings),
  };

  const audience = migrateAudience(parsed.audience);
  if (audience) state.audience = audience;

  const meta = migrateMeta(parsed.meta);
  if (meta) state.meta = meta;

  return state;
}

/* ── categories (the sacred part) ──────────────────────────────────────── */

function migrateCategories(v: unknown): ProgressState["categories"] {
  if (!isRecord(v)) return {};
  const out: ProgressState["categories"] = {};
  for (const [categoryKey, topics] of Object.entries(v)) {
    if (!isRecord(topics)) continue;
    const category: Record<string, TopicProgress> = {};
    for (const [topicKey, topic] of Object.entries(topics)) {
      const migrated = migrateTopic(topic);
      if (migrated) category[topicKey] = migrated;
    }
    out[categoryKey] = category;
  }
  return out;
}

/** Salvage a single topic: keep every field that parses, default the rest.
 *  Only a topic that isn't an object at all is dropped. */
function migrateTopic(v: unknown): TopicProgress | null {
  if (!isRecord(v)) return null;
  const base = emptyTopicProgress();
  const d = isRecord(v.derivation) ? v.derivation : {};

  const topic: TopicProgress = {
    derivation: {
      currentStep: num(d.currentStep) ?? base.derivation.currentStep,
      completedSteps: numArray(d.completedSteps),
      revealedHints: numArray(d.revealedHints),
      completed: d.completed === true,
    },
    problems: migrateProblems(v.problems),
    customInputs: migrateCustomInputs(v.customInputs),
  };

  const lastTouched = num(v.lastTouched);
  if (lastTouched !== undefined) topic.lastTouched = lastTouched;

  const review = migrateReview(v.review);
  if (review) topic.review = review;

  return topic;
}

function migrateProblems(v: unknown): Record<string, ProblemAttempt> {
  if (!isRecord(v)) return {};
  const out: Record<string, ProblemAttempt> = {};
  for (const [key, p] of Object.entries(v)) {
    if (!isRecord(p)) continue;
    // A record existing at all means the learner did something with this
    // problem — default `attempted` to true rather than losing that signal.
    const attempt: ProblemAttempt = {
      attempted: typeof p.attempted === "boolean" ? p.attempted : true,
    };
    const hintsUsed = num(p.hintsUsed);
    if (hintsUsed !== undefined) attempt.hintsUsed = hintsUsed;
    if (typeof p.solved === "boolean") attempt.solved = p.solved;
    out[key] = attempt;
  }
  return out;
}

function migrateCustomInputs(v: unknown): TopicProgress["customInputs"] {
  if (!Array.isArray(v)) return [];
  const out: TopicProgress["customInputs"] = [];
  for (const item of v) {
    if (isRecord(item) && typeof item.label === "string") {
      out.push({ label: item.label, data: item.data });
    }
  }
  return out;
}

function migrateReview(v: unknown): ReviewState | undefined {
  if (!isRecord(v)) return undefined;
  const review: ReviewState = {};
  const lastRecallAt = num(v.lastRecallAt);
  if (lastRecallAt !== undefined) review.lastRecallAt = lastRecallAt;
  const nextDueAt = num(v.nextDueAt);
  if (nextDueAt !== undefined) review.nextDueAt = nextDueAt;
  const streak = num(v.streak);
  if (streak !== undefined) review.streak = streak;
  if (Array.isArray(v.outcomes)) {
    const outcomes: ReviewOutcome[] = [];
    for (const o of v.outcomes) {
      if (!isRecord(o)) continue;
      const at = num(o.at);
      if (at !== undefined && typeof o.correct === "boolean") {
        outcomes.push({ at, correct: o.correct });
      }
    }
    if (outcomes.length > 0) review.outcomes = outcomes.slice(-MAX_REVIEW_OUTCOMES);
  }
  return Object.keys(review).length > 0 ? review : undefined;
}

/* ── audience / settings / meta ────────────────────────────────────────── */

/** Field-preserving: any object with the three string axes is kept whole
 *  (unknown enum values are tolerated downstream — pickRegister falls back to
 *  base). Audience is re-creatable via the quiz, so a malformed one is the
 *  one thing we allow ourselves to drop. */
function migrateAudience(v: unknown): AudienceProfile | undefined {
  if (!isRecord(v)) return undefined;
  if (
    typeof v.experience !== "string" ||
    typeof v.register !== "string" ||
    typeof v.goal !== "string"
  ) {
    return undefined;
  }
  return { ...v, updatedAt: num(v.updatedAt) ?? 0 } as unknown as AudienceProfile;
}

function migrateSettings(v: unknown): ProgressState["settings"] {
  const defaults = emptyProgressState().settings;
  if (!isRecord(v)) return defaults;
  return {
    theme: oneOf(v.theme, ["system", "light", "dark"], defaults.theme),
    animationSpeed: oneOf(v.animationSpeed, ["slow", "normal", "fast"], defaults.animationSpeed),
    codeLanguage: "python",
    reduceMotion: oneOf<"system" | "reduce">(
      v.reduceMotion,
      ["system", "reduce"],
      defaults.reduceMotion ?? "system"
    ),
  };
}

function migrateMeta(v: unknown): ProgressMeta | undefined {
  if (!isRecord(v)) return undefined;
  const meta: ProgressMeta = {};
  const firstSeenAt = num(v.firstSeenAt);
  if (firstSeenAt !== undefined) meta.firstSeenAt = firstSeenAt;
  const lastVisitAt = num(v.lastVisitAt);
  if (lastVisitAt !== undefined) meta.lastVisitAt = lastVisitAt;
  const visitDays = normalizeVisitDays(v.visitDays);
  if (visitDays.length > 0) meta.visitDays = visitDays;
  return Object.keys(meta).length > 0 ? meta : undefined;
}

/** Shared invariant for visitDays: valid "YYYY-MM-DD" strings only, deduped,
 *  sorted ascending (ISO dates sort chronologically), capped to the most
 *  recent MAX_VISIT_DAYS. Used by migrate, save-normalization, touchVisit
 *  and import-merge so the rule lives in exactly one place. */
export function normalizeVisitDays(days: unknown): string[] {
  if (!Array.isArray(days)) return [];
  const valid = days.filter(
    (d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
  );
  return Array.from(new Set(valid)).sort().slice(-MAX_VISIT_DAYS);
}

/* ── tiny parse helpers ────────────────────────────────────────────────── */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function numArray(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fallback;
}
