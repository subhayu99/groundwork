"use client";

interface Props {
  playing: boolean;
  onToggle: () => void;
  onReset: () => void;
  /** Single-step forward. Omit to hide the → button. */
  onStep?: () => void;
  /** Disable play/step (e.g. animation finished). */
  atEnd?: boolean;
  playLabel?: string;
  pauseLabel?: string;
}

const ghost =
  "min-h-[40px] min-w-[44px] px-3 py-2 inline-flex items-center justify-center rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] disabled:opacity-40";
const primary =
  "min-h-[40px] px-4 py-2 inline-flex items-center justify-center rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] disabled:opacity-40";

/** The ↺ ← Play → control bar shared by every step-by-step visualizer. */
export function PlaybackControls({
  playing,
  onToggle,
  onReset,
  onStep,
  atEnd = false,
  playLabel = "Play through",
  pauseLabel = "Pause",
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onReset} aria-label="reset" className={ghost}>
        ↺
      </button>
      <button onClick={onToggle} disabled={atEnd && !playing} className={primary}>
        {playing ? pauseLabel : playLabel}
      </button>
      {onStep && (
        <button onClick={onStep} aria-label="step forward" disabled={atEnd} className={ghost}>
          →
        </button>
      )}
    </div>
  );
}
