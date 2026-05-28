type AnalyticsEvent =
  | { type: "topic_opened"; category: string; topic: string }
  | { type: "step_completed"; category: string; topic: string; step: number }
  | { type: "topic_completed"; category: string; topic: string }
  | { type: "problem_attempted"; category: string; topic: string; problem: string }
  | { type: "problem_solved"; category: string; topic: string; problem: string };

export function emitEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  // Today: console. Tomorrow: Mixpanel/Amplitude/PostHog.
  console.debug("[analytics]", event);
}
