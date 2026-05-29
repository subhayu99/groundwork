"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePlayback } from "@/shared/viz/usePlayback";
import { PlaybackControls } from "@/shared/viz/PlaybackControls";
import { useIsMobile } from "@/shared/layout/useIsMobile";

interface Meeting {
  id: string;
  label: string;
  start: number;
  end: number;
}

const MEETINGS: Meeting[] = [
  { id: "m0", label: "stand-up",     start: 9,  end: 11 },
  { id: "m1", label: "design sync",  start: 10, end: 12 },
  { id: "m2", label: "lunch&learn",  start: 11, end: 14 },
  { id: "m3", label: "1:1",          start: 13, end: 15 },
  { id: "m4", label: "review",       start: 14, end: 16 },
  { id: "m5", label: "all-hands",    start: 9,  end: 17 },
  { id: "m6", label: "retro",        start: 16, end: 17 },
];

const HOUR_START = 9;
const HOUR_END = 17;

interface Dims {
  HOUR_PX: number;
  ROW_H: number;
  ROW_GAP: number;
  LABEL_W: number;
}

// Desktop / SSR defaults — identical to the original constants.
const DESKTOP_DIMS: Dims = { HOUR_PX: 56, ROW_H: 32, ROW_GAP: 6, LABEL_W: 110 };
// Mobile: shrink so 76 + 8*28 = 300px natural width fits a ~340px panel near 1.0 scale.
const MOBILE_DIMS: Dims = { HOUR_PX: 28, ROW_H: 26, ROW_GAP: 5, LABEL_W: 76 };

function useDims(): Dims {
  const isMobile = useIsMobile();
  return isMobile ? MOBILE_DIMS : DESKTOP_DIMS;
}

// algorithm.py line numbers the greedy walk emits as it runs.
const LINE_SORT_BY_END = 8; // by_end = sorted(meetings, key=lambda m: m[1])
const LINE_COMPAT_CHECK = 14; // if start >= last_end:
const LINE_ACCEPT = 15; // chosen.append((start, end))
const LINE_UPDATE_LAST_END = 16; // last_end = end

interface VisualizerProps {
  step: number;
  onWedgeInteraction?: () => void;
  onActiveLine?: (lines: number[]) => void;
}

export function ActivitySelectionVisualizer({ step, onWedgeInteraction, onActiveLine }: VisualizerProps) {
  if (step <= 2) return <RawTimelineViz />;
  if (step === 3) return <SortAndPickViz onInteraction={onWedgeInteraction} onActiveLine={onActiveLine} />;
  return <DerivedViz />;
}

function HourAxis({ dims }: { dims: Dims }) {
  const { HOUR_PX, LABEL_W } = dims;
  const ticks = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) ticks.push(h);
  return (
    <div className="flex items-end" style={{ marginLeft: LABEL_W, width: (HOUR_END - HOUR_START) * HOUR_PX }}>
      {ticks.map((h, i) => (
        <div
          key={h}
          className="font-mono text-[9px] text-[var(--text-faint)] text-left"
          style={{ width: i === ticks.length - 1 ? 0 : HOUR_PX }}
        >
          {h}
        </div>
      ))}
    </div>
  );
}

function MeetingBar({
  m,
  state,
  row,
  dims,
}: {
  m: Meeting;
  state: "idle" | "active" | "accepted" | "skipped";
  row: number;
  dims: Dims;
}) {
  const { HOUR_PX, ROW_H, ROW_GAP, LABEL_W } = dims;
  const compact = HOUR_PX < DESKTOP_DIMS.HOUR_PX; // mobile
  const left = LABEL_W + (m.start - HOUR_START) * HOUR_PX;
  const width = (m.end - m.start) * HOUR_PX - 4;
  const bg =
    state === "accepted"
      ? "color-mix(in oklab, var(--diff-easy) 26%, var(--bg-card))"
      : state === "skipped"
      ? "color-mix(in oklab, var(--diff-hard) 18%, var(--bg-card))"
      : state === "active"
      ? "color-mix(in oklab, var(--accent-sky) 26%, var(--bg-card))"
      : "var(--bg-card)";
  const border =
    state === "accepted"
      ? "var(--diff-easy)"
      : state === "skipped"
      ? "var(--diff-hard)"
      : state === "active"
      ? "var(--accent-line)"
      : "var(--line)";
  return (
    <>
      <motion.div
        animate={{ top: row * (ROW_H + ROW_GAP) }}
        transition={{ duration: 0.32 }}
        className={`absolute font-mono ${compact ? "text-[8px] pr-1" : "text-[10px] pr-2"} text-[var(--text-muted)] text-right truncate`}
        style={{ left: 0, width: LABEL_W, height: ROW_H, lineHeight: `${ROW_H}px` }}
      >
        {m.label}
      </motion.div>
      <motion.div
        animate={{ top: row * (ROW_H + ROW_GAP), backgroundColor: bg, borderColor: border }}
        transition={{ duration: 0.32 }}
        className={`absolute rounded-md border flex items-center justify-center font-mono ${compact ? "text-[8px]" : "text-[10px]"}`}
        style={{ left, width, height: ROW_H, color: "var(--text)" }}
      >
        {m.start}&ndash;{m.end}
      </motion.div>
    </>
  );
}

/* Steps 1-2 — original, unsorted, overlaps visible */
function RawTimelineViz() {
  const dims = useDims();
  const { HOUR_PX, ROW_H, ROW_GAP, LABEL_W } = dims;
  // Count overlaps to expose the difficulty.
  const overlaps = useMemo(() => {
    let count = 0;
    for (let i = 0; i < MEETINGS.length; i++) {
      for (let j = i + 1; j < MEETINGS.length; j++) {
        const a = MEETINGS[i];
        const b = MEETINGS[j];
        if (a.start < b.end && b.start < a.end) count++;
      }
    }
    return count;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        one room · seven requests · lots of clashes
      </div>
      <div
        className="relative"
        style={{
          width: LABEL_W + (HOUR_END - HOUR_START) * HOUR_PX,
          height: MEETINGS.length * (ROW_H + ROW_GAP),
        }}
      >
        {MEETINGS.map((m, i) => (
          <MeetingBar key={m.id} m={m} row={i} state="idle" dims={dims} />
        ))}
      </div>
      <HourAxis dims={dims} />
      <div className="font-mono text-xs text-[var(--text-muted)]">
        overlapping pairs: <span className="text-[var(--diff-hard)]">{overlaps}</span>
        <span className="mx-3">·</span>
        possible subsets to try: <span className="text-[var(--diff-hard)]">{Math.pow(2, MEETINGS.length)}</span>
      </div>
    </div>
  );
}

interface PickState {
  sorted: boolean;
  i: number; // next meeting to consider
  accepted: string[];
  skipped: string[];
  lastEnd: number;
}

function initialPick(): PickState {
  return { sorted: false, i: 0, accepted: [], skipped: [], lastEnd: -Infinity };
}

function sortedMeetings(): Meeting[] {
  return [...MEETINGS].sort((a, b) => a.end - b.end || a.start - b.start);
}

function pickStep(prev: PickState): PickState {
  const order = sortedMeetings();
  if (prev.i >= order.length) return prev;
  const m = order[prev.i];
  if (m.start >= prev.lastEnd) {
    return {
      ...prev,
      i: prev.i + 1,
      accepted: [...prev.accepted, m.id],
      lastEnd: m.end,
    };
  }
  return { ...prev, i: prev.i + 1, skipped: [...prev.skipped, m.id] };
}

function meetingState(
  id: string,
  pick: PickState,
  active: string | null,
): "idle" | "active" | "accepted" | "skipped" {
  if (pick.accepted.includes(id)) return "accepted";
  if (pick.skipped.includes(id)) return "skipped";
  if (active === id) return "active";
  return "idle";
}

/* Step 3 — sort button + step/play */
function SortAndPickViz({
  onInteraction,
  onActiveLine,
}: {
  onInteraction?: () => void;
  onActiveLine?: (lines: number[]) => void;
}) {
  const dims = useDims();
  const { HOUR_PX, ROW_H, ROW_GAP, LABEL_W } = dims;
  const [pick, setPick] = useState<PickState>(initialPick());

  const order = useMemo(() => (pick.sorted ? sortedMeetings() : MEETINGS), [pick.sorted]);

  const done = pick.i >= MEETINGS.length;

  // Advance one greedy step, emitting the algorithm.py lines that the move
  // corresponds to: the compatibility check always fires; accept + update
  // fire only when the meeting fits.
  const advance = () => {
    setPick((cur) => {
      const next = pickStep(cur);
      if (next === cur) return cur; // walk finished, nothing to emit
      const accepted = next.accepted.length > cur.accepted.length;
      onActiveLine?.(
        accepted
          ? [LINE_COMPAT_CHECK, LINE_ACCEPT, LINE_UPDATE_LAST_END]
          : [LINE_COMPAT_CHECK],
      );
      return next;
    });
  };

  const pb = usePlayback({
    onTick: advance,
    isDone: () => done,
    intervalMs: 700,
  });

  const sort = () => {
    onInteraction?.();
    onActiveLine?.([LINE_SORT_BY_END]);
    setPick({ sorted: true, i: 0, accepted: [], skipped: [], lastEnd: -Infinity });
  };
  const next = () => {
    onInteraction?.();
    pb.stepOnce();
  };
  const reset = () => {
    setPick(initialPick());
    pb.stop();
  };

  const order_ids = order.map((m) => m.id);
  const activeId = pick.sorted && pick.i < order_ids.length ? order_ids[pick.i] : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        sort by end · walk · accept if it fits
      </div>
      <div
        className="relative"
        style={{
          width: LABEL_W + (HOUR_END - HOUR_START) * HOUR_PX,
          height: MEETINGS.length * (ROW_H + ROW_GAP),
        }}
      >
        {order.map((m, i) => (
          <MeetingBar key={m.id} m={m} row={i} state={meetingState(m.id, pick, activeId)} dims={dims} />
        ))}
        {pick.sorted && pick.lastEnd > -Infinity && (
          <motion.div
            animate={{ left: LABEL_W + (pick.lastEnd - HOUR_START) * HOUR_PX }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 bottom-0 border-l-2 border-dashed border-[var(--diff-easy)] pointer-events-none"
          >
            <div className="absolute -top-3 -translate-x-1/2 text-[9px] font-mono text-[var(--diff-easy)] bg-[var(--bg-elevated)] px-1">
              free at {pick.lastEnd}
            </div>
          </motion.div>
        )}
      </div>
      <HourAxis dims={dims} />
      <div className="font-mono text-xs text-[var(--text-muted)]">
        accepted: <span className="text-[var(--diff-easy)]">{pick.accepted.length}</span>
        <span className="mx-3">·</span>
        skipped: <span className="text-[var(--diff-hard)]">{pick.skipped.length}</span>
        {done && <span className="text-[var(--diff-easy)] ml-3">✓ done</span>}
      </div>
      {!pick.sorted ? (
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-md font-mono text-xs border border-[var(--line)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
          >
            ↺
          </button>
          <button
            onClick={sort}
            className="px-4 py-1.5 rounded-md font-mono text-xs border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)]"
          >
            sort by end →
          </button>
        </div>
      ) : (
        <PlaybackControls
          playing={pb.playing}
          onToggle={pb.toggle}
          onReset={reset}
          onStep={next}
          atEnd={done}
          playLabel="Play through"
        />
      )}
    </div>
  );
}

/* Steps 4-7 — auto-play with sorted order pre-shown */
function DerivedViz() {
  const dims = useDims();
  const { HOUR_PX, ROW_H, ROW_GAP, LABEL_W } = dims;
  const order = useMemo(() => sortedMeetings(), []);
  const [pick, setPick] = useState<PickState>({
    sorted: true,
    i: 0,
    accepted: [],
    skipped: [],
    lastEnd: -Infinity,
  });
  const done = pick.i >= MEETINGS.length;

  const pb = usePlayback({
    onTick: () => setPick((cur) => pickStep(cur)),
    isDone: () => done,
    intervalMs: 650,
  });

  const reset = () => {
    setPick({ sorted: true, i: 0, accepted: [], skipped: [], lastEnd: -Infinity });
    pb.stop();
  };

  const activeId = pick.i < order.length ? order[pick.i].id : null;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
        sorted by end · greedy walks once
      </div>
      <div
        className="relative"
        style={{
          width: LABEL_W + (HOUR_END - HOUR_START) * HOUR_PX,
          height: MEETINGS.length * (ROW_H + ROW_GAP),
        }}
      >
        {order.map((m, i) => (
          <MeetingBar key={m.id} m={m} row={i} state={meetingState(m.id, pick, activeId)} dims={dims} />
        ))}
        {pick.lastEnd > -Infinity && (
          <motion.div
            animate={{ left: LABEL_W + (pick.lastEnd - HOUR_START) * HOUR_PX }}
            transition={{ duration: 0.3 }}
            className="absolute top-0 bottom-0 border-l-2 border-dashed border-[var(--diff-easy)] pointer-events-none"
          >
            <div className="absolute -top-3 -translate-x-1/2 text-[9px] font-mono text-[var(--diff-easy)] bg-[var(--bg-elevated)] px-1">
              free at {pick.lastEnd}
            </div>
          </motion.div>
        )}
      </div>
      <HourAxis dims={dims} />
      <div className="font-mono text-xs text-[var(--text-muted)]">
        kept <span className="text-[var(--diff-easy)]">{pick.accepted.length}</span> of{" "}
        {MEETINGS.length}
        {done && <span className="text-[var(--diff-easy)] ml-3">✓ done</span>}
      </div>
      <PlaybackControls
        playing={pb.playing}
        onToggle={pb.toggle}
        onReset={reset}
        atEnd={done}
        playLabel="Play through"
      />
    </div>
  );
}
