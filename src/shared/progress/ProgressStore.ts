import {
  ProgressState,
  TopicProgress,
  emptyProgressState,
  PROGRESS_SCHEMA_VERSION,
} from "./types";

const STORAGE_KEY = "fp-progress-v1";

export class ProgressStore {
  load(): ProgressState {
    if (typeof window === "undefined") return emptyProgressState();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgressState();
    try {
      const parsed = JSON.parse(raw) as ProgressState;
      if (parsed.version !== PROGRESS_SCHEMA_VERSION) return emptyProgressState();
      return parsed;
    } catch {
      return emptyProgressState();
    }
  }

  save(state: ProgressState): void {
    if (typeof window === "undefined") return;
    state.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  exportJson(): string {
    return JSON.stringify(this.load(), null, 2);
  }

  importJson(json: string): void {
    const parsed = JSON.parse(json) as ProgressState;
    if (parsed.version !== PROGRESS_SCHEMA_VERSION) {
      throw new Error(
        `Unsupported progress schema version ${parsed.version}; expected ${PROGRESS_SCHEMA_VERSION}`
      );
    }
    const current = this.load();
    const merged = mergeStates(current, parsed);
    this.save(merged);
  }
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
  return score;
}
