"use client";

import { useCallback, useEffect, useState } from "react";
import { ProgressStore } from "./ProgressStore";
import { ProgressState, TopicProgress, emptyTopicProgress } from "./types";

const store = new ProgressStore();

export function useProgress() {
  const [state, setState] = useState<ProgressState | null>(null);

  useEffect(() => {
    setState(store.load());
    // Re-read on any save (from this or any other useProgress instance) so all
    // consumers stay in sync — e.g. the lesson page reacts the moment the
    // derivation engine marks the topic complete.
    const unsubscribe = store.subscribe(() => setState(store.load()));
    return unsubscribe;
  }, []);

  const updateTopic = useCallback(
    (categoryKey: string, topicKey: string, mutator: (tp: TopicProgress) => TopicProgress) => {
      // Derive from the persisted truth (not React state) and save; the store
      // notifies every subscriber, which re-reads. No setState during render.
      const prev = store.load();
      const current = prev.categories[categoryKey]?.[topicKey] ?? emptyTopicProgress();
      const next = mutator(current);
      const updated: ProgressState = {
        ...prev,
        categories: {
          ...prev.categories,
          [categoryKey]: {
            ...(prev.categories[categoryKey] ?? {}),
            [topicKey]: next,
          },
        },
      };
      store.save(updated);
    },
    []
  );

  const getTopic = useCallback(
    (categoryKey: string, topicKey: string): TopicProgress => {
      return state?.categories[categoryKey]?.[topicKey] ?? emptyTopicProgress();
    },
    [state]
  );

  const exportJson = useCallback(() => store.exportJson(), []);
  const importJson = useCallback((json: string) => {
    store.importJson(json);
    setState(store.load());
  }, []);

  return { state, updateTopic, getTopic, exportJson, importJson };
}
