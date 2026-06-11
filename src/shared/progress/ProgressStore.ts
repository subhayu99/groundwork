import {
  ProgressState,
  TopicProgress,
  ProgressMeta,
  emptyProgressState,
  PROGRESS_SCHEMA_VERSION,
  MAX_REVIEW_OUTCOMES,
} from "./types";
import type { AudienceProfile } from "@/shared/audience/types";
import { migrate, normalizeVisitDays } from "./migrate";
import { serializeState, deserializeState } from "./ProfileSync";

// The KEY is a storage namespace, not a schema claim — the schema version
// lives INSIDE the blob and is handled by migrate(). Renaming the key would
// orphan existing users' data, so it stays put across schema bumps.
const STORAGE_KEY = "fp-progress-v1";

/** Don't re-stamp a visit more often than this when the day is already
 *  recorded — keeps the many useProgress mounts from write-storming. */
const VISIT_THROTTLE_MS = 60_000;

export class ProgressStore {
  private listeners = new Set<() => void>();

  /** Subscribe to any save; returns an unsubscribe fn. Lets every useProgress
   *  instance stay in sync (e.g. the lesson page reacts when the derivation
   *  engine marks a topic complete). */
  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(): void {
    for (const cb of this.listeners) cb();
  }

  /** PURE read: parses + migrates, never writes. Version mismatches do NOT
   *  reset progress — migrate() salvages every field that parses (H10). */
  load(): ProgressState {
    if (typeof window === "undefined") return emptyProgressState();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgressState();
    try {
      return migrate(JSON.parse(raw));
    } catch {
      // Unparseable JSON — nothing to salvage from.
      return emptyProgressState();
    }
  }

  /** Always writes the CURRENT schema version and enforces the write-time
   *  caps (review outcomes ≤ MAX_REVIEW_OUTCOMES, visitDays ≤ MAX_VISIT_DAYS,
   *  deduped) so the invariants hold no matter who constructed the state. */
  save(state: ProgressState): void {
    if (typeof window === "undefined") return;
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeForWrite(state)));
    this.notify();
  }

  /**
   * Stamp the current visit into `meta` (firstSeenAt / lastVisitAt /
   * visitDays). Called from useProgress's mount effect — NEVER from load(),
   * which stays pure. Throttled: once the day is recorded, re-stamps at most
   * once per VISIT_THROTTLE_MS so N mounted hooks don't write-storm.
   */
  touchVisit(now: number = Date.now()): void {
    if (typeof window === "undefined") return;
    const state = this.load();
    const meta = state.meta ?? {};
    const day = localIsoDay(now);
    const dayRecorded = meta.visitDays?.includes(day) ?? false;
    const stampedRecently =
      meta.lastVisitAt !== undefined && Math.abs(now - meta.lastVisitAt) < VISIT_THROTTLE_MS;
    if (dayRecorded && stampedRecently) return;

    const nextMeta: ProgressMeta = {
      ...meta,
      firstSeenAt: meta.firstSeenAt ?? now,
      lastVisitAt: now,
      visitDays: normalizeVisitDays([...(meta.visitDays ?? []), day]),
    };
    this.save({ ...state, meta: nextMeta });
  }

  /** Export as the versioned envelope (see ProfileSync — same wire format a
   *  future sync backend uses). */
  exportJson(): string {
    return serializeState(this.load());
  }

  /** Import an envelope OR a bare v1/v2 blob (old exported backups keep
   *  working). The payload is migrated, then merged: for each topic the
   *  more-complete side wins — importing can only ever ADD progress. */
  importJson(json: string): void {
    const incoming = deserializeState(json);
    const current = this.load();
    const merged = mergeStates(current, incoming);
    this.save(merged);
  }
}

/** Write-time normalization: current version stamp + the two caps. Returns a
 *  rebuilt object (the caller's state is not deep-mutated). */
function normalizeForWrite(state: ProgressState): ProgressState {
  const categories: ProgressState["categories"] = {};
  for (const [categoryKey, topics] of Object.entries(state.categories)) {
    const category: Record<string, TopicProgress> = {};
    for (const [topicKey, tp] of Object.entries(topics)) {
      category[topicKey] =
        tp.review?.outcomes && tp.review.outcomes.length > MAX_REVIEW_OUTCOMES
          ? { ...tp, review: { ...tp.review, outcomes: tp.review.outcomes.slice(-MAX_REVIEW_OUTCOMES) } }
          : tp;
    }
    categories[categoryKey] = category;
  }
  const meta = state.meta?.visitDays
    ? { ...state.meta, visitDays: normalizeVisitDays(state.meta.visitDays) }
    : state.meta;
  return { ...state, version: PROGRESS_SCHEMA_VERSION, categories, meta };
}

/** Local-calendar ISO day ("YYYY-MM-DD") — a learner's "day" follows their
 *  clock, not UTC, so streaks don't break at odd hours. */
function localIsoDay(epochMs: number): string {
  const d = new Date(epochMs);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function mergeStates(local: ProgressState, incoming: ProgressState): ProgressState {
  const merged: ProgressState = {
    ...local,
    categories: { ...local.categories },
  };

  for (const [categoryKey, topics] of Object.entries(incoming.categories)) {
    merged.categories[categoryKey] = merged.categories[categoryKey] ?? {};
    for (const [topicKey, incomingTopic] of Object.entries(topics)) {
      const localTopic = merged.categories[categoryKey][topicKey];
      merged.categories[categoryKey][topicKey] = pickMoreComplete(localTopic, incomingTopic);
    }
  }

  // Never lose the rest either: adopt the incoming audience when it's the
  // only/newer one, and union visit history.
  const audience = pickNewerAudience(local.audience, incoming.audience);
  if (audience) merged.audience = audience;
  const meta = mergeMeta(local.meta, incoming.meta);
  if (meta) merged.meta = meta;

  return merged;
}

function pickNewerAudience(
  local: AudienceProfile | undefined,
  incoming: AudienceProfile | undefined
): AudienceProfile | undefined {
  if (!local) return incoming;
  if (!incoming) return local;
  return (incoming.updatedAt ?? 0) > (local.updatedAt ?? 0) ? incoming : local;
}

function mergeMeta(
  local: ProgressMeta | undefined,
  incoming: ProgressMeta | undefined
): ProgressMeta | undefined {
  if (!local) return incoming;
  if (!incoming) return local;
  const merged: ProgressMeta = {};
  const firstSeens = [local.firstSeenAt, incoming.firstSeenAt].filter(
    (n): n is number => n !== undefined
  );
  if (firstSeens.length) merged.firstSeenAt = Math.min(...firstSeens);
  const lastVisits = [local.lastVisitAt, incoming.lastVisitAt].filter(
    (n): n is number => n !== undefined
  );
  if (lastVisits.length) merged.lastVisitAt = Math.max(...lastVisits);
  const visitDays = normalizeVisitDays([
    ...(local.visitDays ?? []),
    ...(incoming.visitDays ?? []),
  ]);
  if (visitDays.length) merged.visitDays = visitDays;
  return merged;
}

function pickMoreComplete(
  local: TopicProgress | undefined,
  incoming: TopicProgress
): TopicProgress {
  if (!local) return incoming;
  const localScore = scoreTopicProgress(local);
  const incomingScore = scoreTopicProgress(incoming);
  return incomingScore > localScore ? incoming : local;
}

function scoreTopicProgress(tp: TopicProgress): number {
  let score = tp.derivation.currentStep;
  if (tp.derivation.completed) score += 100;
  score += tp.derivation.completedSteps.length;
  for (const p of Object.values(tp.problems)) {
    if (p.solved) score += 10;
    else if (p.attempted) score += 1;
  }
  // Recall history counts toward completeness too (v2).
  score += tp.review?.outcomes?.length ?? 0;
  return score;
}
