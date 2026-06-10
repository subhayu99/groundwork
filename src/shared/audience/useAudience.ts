"use client";

import { useCallback } from "react";
import { useProgress } from "@/shared/progress/useProgress";
import type { AudienceProfile, Experience, Goal, Register } from "./types";
import { DEFAULT_REGISTER } from "./types";

/**
 * The one hook components use to read/write the learner profile.
 *
 * `register` always resolves to a usable value (DEFAULT_REGISTER pre-onboarding),
 * so register-aware rendering never has to branch on "did they onboard?".
 * `onboarded` is for the bits that DO care (the first-visit invite, settings).
 */
export function useAudience() {
  const { state, setAudience } = useProgress();

  const profile = state?.audience;
  const register: Register = profile?.register ?? DEFAULT_REGISTER;

  const saveProfile = useCallback(
    (p: { experience: Experience; register: Register; goal: Goal }) => {
      setAudience({ ...p, updatedAt: Date.now() });
    },
    [setAudience],
  );

  const clearProfile = useCallback(() => setAudience(null), [setAudience]);

  return {
    /** undefined while localStorage loads OR if never onboarded. */
    profile: profile as AudienceProfile | undefined,
    /** true once the questionnaire has been completed (or a profile set in settings). */
    onboarded: !!profile,
    /** progress state has been read from localStorage (false on the first paint). */
    loaded: state !== null,
    register,
    saveProfile,
    clearProfile,
  };
}
