// Shared visual vocabulary for cells / nodes / stack items across all
// visualizers. Before this, every topic hand-wrote the same color-mix rules.
// One tone → one (bg, border) pairing keeps the whole app visually consistent.

export type Tone =
  | "idle"
  | "active"
  | "visited"
  | "trail"
  | "good"
  | "bad"
  | "muted"
  | "wall"
  | "start"
  | "goal"
  | "accent";

export interface ToneStyle {
  bg: string;
  border: string;
}

export const toneStyle: Record<Tone, ToneStyle> = {
  idle: { bg: "var(--bg-card)", border: "var(--line)" },
  active: {
    bg: "color-mix(in oklab, var(--accent-sky) 32%, var(--bg-card))",
    border: "var(--accent-line)",
  },
  visited: {
    bg: "color-mix(in oklab, var(--accent-sky) 14%, var(--bg-card))",
    border: "color-mix(in oklab, var(--accent-line) 55%, var(--line))",
  },
  trail: {
    bg: "color-mix(in oklab, var(--diff-easy) 24%, var(--bg-card))",
    border: "var(--diff-easy)",
  },
  good: {
    bg: "color-mix(in oklab, var(--diff-easy) 20%, var(--bg-card))",
    border: "var(--diff-easy)",
  },
  bad: {
    bg: "color-mix(in oklab, var(--diff-hard) 20%, var(--bg-card))",
    border: "var(--diff-hard)",
  },
  muted: {
    bg: "color-mix(in oklab, var(--diff-med) 20%, var(--bg-card))",
    border: "var(--diff-med)",
  },
  wall: { bg: "var(--bg-elevated)", border: "var(--line-faint)" },
  start: { bg: "var(--bg-card)", border: "var(--text-muted)" },
  goal: { bg: "var(--bg-card)", border: "var(--text-muted)" },
  accent: { bg: "var(--accent-soft)", border: "var(--accent-line)" },
};
