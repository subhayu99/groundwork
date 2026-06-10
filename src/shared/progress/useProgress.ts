"use client";

import { useCallback, useEffect, useState } from "react";
import { ProgressStore } from "./ProgressStore";
import { ProgressState, TopicProgress, emptyTopicProgress, emptyProgressState } from "./types";
import type { AudienceProfile } from "@/shared/audience/types";

type Settings = ProgressState["settings"];

const store = new ProgressStore();

// Stamp the visit once per page load, not once per mounted hook instance —
// many components call useProgress, and the store throttles besides.
let visitTouchedThisLoad = false;

export function useProgress() {
  const [state, setState] = useState<ProgressState | null>(null);

  useEffect(() => {
    // Visit stamping lives HERE (a mount effect), never in store.load() —
    // load stays a pure read. Runs before the first setState so this
    // instance's snapshot already includes the fresh meta.
    if (!visitTouchedThisLoad) {
      visitTouchedThisLoad = true;
      store.touchVisit();
    }
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
      // Stamp recency on every write so "continue where you left off" picks the
      // most-recently-touched topic, not the first one in registry order.
      const next: TopicProgress = { ...mutator(current), lastTouched: Date.now() };
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

  const updateSettings = useCallback((mutator: (s: Settings) => Settings) => {
    const prev = store.load();
    store.save({ ...prev, settings: mutator(prev.settings) });
  }, []);

  /** Set (or clear) the onboarding profile. `null` clears it (re-onboard). */
  const setAudience = useCallback((profile: AudienceProfile | null) => {
    const prev = store.load();
    store.save({ ...prev, audience: profile ?? undefined });
  }, []);

  const resetProgress = useCallback(() => {
    store.save(emptyProgressState());
  }, []);

  const exportJson = useCallback(() => store.exportJson(), []);
  const importJson = useCallback((json: string) => {
    store.importJson(json);
  }, []);

  /** Manually re-stamp the visit (the mount effect already does this once per
   *  page load; store-side throttling makes extra calls cheap). */
  const touchVisit = useCallback(() => {
    store.touchVisit();
  }, []);

  return {
    state,
    updateTopic,
    getTopic,
    updateSettings,
    setAudience,
    resetProgress,
    exportJson,
    importJson,
    touchVisit,
  };
}
