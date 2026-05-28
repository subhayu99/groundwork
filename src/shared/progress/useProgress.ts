"use client";

import { useCallback, useEffect, useState } from "react";
import { ProgressStore } from "./ProgressStore";
import { ProgressState, TopicProgress, emptyTopicProgress } from "./types";

const store = new ProgressStore();

export function useProgress() {
  const [state, setState] = useState<ProgressState | null>(null);

  useEffect(() => {
    setState(store.load());
  }, []);

  const updateTopic = useCallback(
    (categoryKey: string, topicKey: string, mutator: (tp: TopicProgress) => TopicProgress) => {
      setState((prev) => {
        if (!prev) return prev;
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
        return updated;
      });
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
