"use client";

import { useEffect, useRef, useState } from "react";
import { toneStyle, type Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import activity_selectionPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860,
  VH = 470;

/* ── the seven booking requests (mirrors visualizer.tsx) ───────────────────── */
interface Meeting {
  id: string;
  label: string;
  start: number;
  end: number;
}
const MEETINGS: Meeting[] = [
  { id: "m0", label: "stand-up", start: 9, end: 11 },
  { id: "m1", label: "design sync", start: 10, end: 12 },
  { id: "m2", label: "lunch&learn", start: 11, end: 14 },
  { id: "m3", label: "1:1", start: 13, end: 15 },
  { id: "m4", label: "review", start: 14, end: 16 },
  { id: "m5", label: "all-hands", start: 9, end: 17 },
  { id: "m6", label: "retro", start: 16, end: 17 },
];
const HOUR_START = 9;
const HOUR_END = 17;

/* ── timeline geometry inside the MIDDLE band (y 196 → 414) ────────────────── */
const LABEL_W = 92;
const HOUR_PX = 74;
const AXIS_X = 70 + LABEL_W; // left edge where hour 9 starts
const ROW_TOP = 200;
const ROW_H = 24;
const ROW_GAP = 6;
const xOf = (h: number) => AXIS_X + (h - HOUR_START) * HOUR_PX;
const yOf = (row: number) => ROW_TOP + row * (ROW_H + ROW_GAP);

type BarState = "idle" | "active" | "accepted" | "skipped" | "dimmed";
const stateTone: Record<Exclude<BarState, "dimmed">, Tone> = {
  idle: "idle",
  active: "active",
  accepted: "good",
  skipped: "bad",
};

/* One meeting bar drawn as raw SVG (left=start, width=duration on the hour axis). */
function Bar({ m, row, state }: { m: Meeting; row: number; state: BarState }) {
  const dim = state === "dimmed";
  const ts = toneStyle[dim ? "idle" : stateTone[state]];
  const x = xOf(m.start);
  const w = (m.end - m.start) * HOUR_PX - 4;
  const y = yOf(row);
  return (
    <g style={{ opacity: dim ? 0.25 : 1, transition: "opacity .3s" }}>
      <text
        x={AXIS_X - 8}
        y={y + ROW_H / 2}
        textAnchor="end"
        dominantBaseline="central"
        className="font-mono select-none"
        style={{ fontSize: 10, fill: "var(--text-muted)" }}
      >
        {m.label}
      </text>
      <rect
        x={x}
        y={y}
        width={w}
        height={ROW_H}
        rx={6}
        style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }}
        strokeWidth={2}
      />
      <text
        x={x + w / 2}
        y={y + ROW_H / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono select-none pointer-events-none"
        style={{ fontSize: 9, fill: "var(--text)" }}
      >
        {m.start}&ndash;{m.end}
      </text>
    </g>
  );
}

/* The 9→17 hour axis under the bars. */
function HourAxis({ rows }: { rows: number }) {
  const y = yOf(rows) + 6;
  const ticks = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) ticks.push(h);
  return (
    <g>
      <line x1={AXIS_X} y1={y} x2={xOf(HOUR_END)} y2={y} stroke="var(--line)" strokeWidth={1} />
      {ticks.map((h) => (
        <text
          key={h}
          x={xOf(h)}
          y={y + 12}
          textAnchor="middle"
          className="font-mono select-none"
          style={{ fontSize: 9, fill: "var(--text-faint)" }}
        >
          {h}
        </text>
      ))}
    </g>
  );
}

/* The dashed "free at <hour>" marker that slides right as meetings are kept. */
function FreeAt({ hour, rows }: { hour: number; rows: number }) {
  const x = xOf(hour);
  const yTop = ROW_TOP - 14;
  const yBot = yOf(rows) + 2;
  return (
    <g style={{ transition: "all .3s" }}>
      <line x1={x} y1={yTop} x2={x} y2={yBot} stroke="var(--diff-easy)" strokeWidth={1.5} strokeDasharray="5 4" />
      {/* the dashed line marks "free from this hour"; label omitted to avoid colliding
          with the hour-axis numbers + bottom caption in this cramped lower band */}
    </g>
  );
}

/* helpers shared by visuals */
function sortedByEnd(): Meeting[] {
  return [...MEETINGS].sort((a, b) => a.end - b.end || a.start - b.start);
}

/* ── greedy reducer (mirrors algorithm.py) ─────────────────────────────────── */
interface Pick {
  i: number;
  accepted: string[];
  skipped: string[];
  lastEnd: number;
}
const initPick = (): Pick => ({ i: 0, accepted: [], skipped: [], lastEnd: -Infinity });
function step(prev: Pick, order: Meeting[]): Pick {
  if (prev.i >= order.length) return prev;
  const m = order[prev.i];
  if (m.start >= prev.lastEnd) {
    return { i: prev.i + 1, accepted: [...prev.accepted, m.id], skipped: prev.skipped, lastEnd: m.end };
  }
  return { i: prev.i + 1, accepted: prev.accepted, skipped: [...prev.skipped, m.id], lastEnd: prev.lastEnd };
}
function barState(id: string, p: Pick, activeId: string | null): BarState {
  if (p.accepted.includes(id)) return "accepted";
  if (p.skipped.includes(id)) return "skipped";
  if (activeId === id) return "active";
  return "idle";
}

/* ── static timeline (unsorted, real positions) ────────────────────────────── */
function StaticTimeline({ states, free }: { states?: Record<string, BarState>; free?: number }) {
  return (
    <g>
      {free !== undefined && <FreeAt hour={free} rows={MEETINGS.length} />}
      {MEETINGS.map((m, i) => (
        <Bar key={m.id} m={m} row={i} state={states?.[m.id] ?? "idle"} />
      ))}
      <HourAxis rows={MEETINGS.length} />
    </g>
  );
}

/* ── replay button (shared) ────────────────────────────────────────────────── */
function ReplayButton({ label, onClick }: { label: string; onClick: () => void }) {
  const cx = AXIS_X + 4 * HOUR_PX;
  const y = yOf(MEETINGS.length) + 26;
  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer" }}
      tabIndex={0}
      role="button"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <rect x={cx - 38} y={y} width={76} height={22} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
      <text
        x={cx}
        y={y + 11}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono select-none pointer-events-none"
        style={{ fontSize: 11, fill: "var(--text-muted)" }}
      >
        {label}
      </text>
    </g>
  );
}

/* ── WEDGE beat: press "sort by end", then step through the greedy walk ────── */
function SortAndPick({ api }: { api: BeatVisualApi }) {
  const [sorted, setSorted] = useState(false);
  const [pick, setPick] = useState<Pick>(initPick);

  const order = sorted ? sortedByEnd() : MEETINGS;
  const done = pick.i >= MEETINGS.length;
  const activeId = sorted && !done ? order[pick.i].id : null;

  const doSort = () => {
    api.onInteractionDone();
    api.onActiveLine(["sort"]);
    setSorted(true);
    setPick(initPick());
  };

  const stepOnce = () => {
    api.onInteractionDone();
    if (!sorted || done) return;
    setPick((cur) => {
      const next = step(cur, order);
      const kept = next.accepted.length > cur.accepted.length;
      api.onActiveLine(kept ? ["compatible", "select", "update"] : ["compatible"]);
      return next;
    });
  };

  const reset = () => {
    setSorted(false);
    setPick(initPick());
  };

  const states: Record<string, BarState> = {};
  order.forEach((m) => (states[m.id] = barState(m.id, pick, activeId)));

  const free = sorted && pick.lastEnd > -Infinity ? pick.lastEnd : undefined;

  const btnCx = AXIS_X + 4 * HOUR_PX;
  const btnY = yOf(MEETINGS.length) + 26;

  return (
    <g>
      {free !== undefined && <FreeAt hour={free} rows={MEETINGS.length} />}
      {order.map((m, i) => (
        <Bar key={m.id} m={m} row={i} state={states[m.id]} />
      ))}
      <HourAxis rows={MEETINGS.length} />
      <text
        x={btnCx}
        y={btnY + 44}
        textAnchor="middle"
        className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--text-faint)" }}
      >
        {!sorted
          ? "step 1 — press “sort by end”"
          : done
          ? `kept ${pick.accepted.length} of ${MEETINGS.length} ✓`
          : "press “step” to walk the list"}
      </text>

      {!sorted ? (
        <g
          onClick={doSort}
          style={{ cursor: "pointer" }}
          tabIndex={0}
          role="button"
          aria-label="sort by end"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              doSort();
            }
          }}
        >
          <rect x={btnCx - 60} y={btnY} width={120} height={24} rx={6} fill="var(--accent-soft)" stroke="var(--accent-line)" />
          <text
            x={btnCx}
            y={btnY + 12}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-mono select-none pointer-events-none"
            style={{ fontSize: 11, fill: "var(--accent-ink)" }}
          >
            sort by end →
          </text>
        </g>
      ) : (
        <g>
          <g
            onClick={stepOnce}
            style={{ cursor: done ? "default" : "pointer" }}
            tabIndex={0}
            role="button"
            aria-label="step"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                stepOnce();
              }
            }}
          >
            <rect
              x={btnCx - 78}
              y={btnY}
              width={70}
              height={24}
              rx={6}
              fill={done ? "var(--bg-card)" : "var(--accent-soft)"}
              stroke={done ? "var(--line)" : "var(--accent-line)"}
            />
            <text
              x={btnCx - 43}
              y={btnY + 12}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono select-none pointer-events-none"
              style={{ fontSize: 11, fill: done ? "var(--text-faint)" : "var(--accent-ink)" }}
            >
              step →
            </text>
          </g>
          <g
            onClick={reset}
            style={{ cursor: "pointer" }}
            tabIndex={0}
            role="button"
            aria-label="reset"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                reset();
              }
            }}
          >
            <rect x={btnCx + 8} y={btnY} width={70} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
            <text
              x={btnCx + 43}
              y={btnY + 12}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono select-none pointer-events-none"
              style={{ fontSize: 11, fill: "var(--text-muted)" }}
            >
              ↺ reset
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

/* ── PLAYBACK beat: sorted, the greedy walk runs itself frame by frame ─────── */
function AutoGreedy({ api }: { api: BeatVisualApi }) {
  const order = sortedByEnd();
  const [pick, setPick] = useState<Pick>(initPick);
  const ref = useRef(pick);
  ref.current = pick;

  useEffect(() => {
    const id = setInterval(() => {
      const cur = ref.current;
      if (cur.i >= order.length) return;
      const next = step(cur, order);
      const kept = next.accepted.length > cur.accepted.length;
      api.onActiveLine(kept ? ["compatible", "select", "update"] : ["compatible"]);
      setPick(next);
    }, pace(900));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = pick.i >= order.length;
  const activeId = !done ? order[pick.i].id : null;
  const free = pick.lastEnd > -Infinity ? pick.lastEnd : undefined;

  return (
    <g>
      {free !== undefined && <FreeAt hour={free} rows={MEETINGS.length} />}
      {order.map((m, i) => (
        <Bar key={m.id} m={m} row={i} state={barState(m.id, pick, activeId)} />
      ))}
      <HourAxis rows={MEETINGS.length} />
      <text
        x={AXIS_X + 4 * HOUR_PX}
        y={yOf(MEETINGS.length) + 64}
        textAnchor="middle"
        className="font-mono select-none"
        style={{ fontSize: 11, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}
      >
        {done ? `kept ${pick.accepted.length} of ${MEETINGS.length} ✓` : "walking the sorted list…"}
      </text>
      <ReplayButton label="↺ replay" onClick={() => setPick(initPick())} />
    </g>
  );
}

/* ── Beat 6: coin-change failure strip (greedy loses on {1,3,4}, target 6) ─── */
function GreedyVsDP() {
  const cx = VW / 2;
  const topY = 210;
  // left thumbnail: tiny accepted timeline + green tag
  const leftX = 120;
  // right: coins {1,3,4} target 6 — greedy 4+1+1=3 coins; optimal 3+3=2 coins
  const coinY = 250;
  const coin = (x: number, y: number, v: number, tone: Tone) => {
    const ts = toneStyle[tone];
    return (
      <g key={`${x}-${y}-${v}`}>
        <circle cx={x} cy={y} r={18} style={{ fill: ts.bg, stroke: ts.border }} strokeWidth={2} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 12, fill: "var(--text)" }}>
          {v}
        </text>
      </g>
    );
  };
  return (
    <g>
      {/* divider */}
      <line x1={cx} y1={topY - 6} x2={cx} y2={400} stroke="var(--line)" strokeWidth={1.5} strokeDasharray="4 4" />

      {/* LEFT — greedy wins */}
      <text x={leftX + 130} y={topY} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>
        swap works → greedy wins
      </text>
      {[0, 1, 2, 3].map((r) => {
        const w = [90, 70, 60, 50][r];
        return (
          <rect
            key={r}
            x={leftX + 40 + r * 8}
            y={topY + 24 + r * 24}
            width={w}
            height={16}
            rx={5}
            style={{ fill: toneStyle.good.bg, stroke: toneStyle.good.border }}
            strokeWidth={2}
          />
        );
      })}
      <text x={leftX + 130} y={topY + 150} textAnchor="middle" className="font-mono" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
        meetings: kept the most, clash-free
      </text>

      {/* RIGHT — greedy fails */}
      <text x={cx + 240} y={topY} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-hard)" }}>
        swap fails → needs step-back
      </text>
      <text x={cx + 240} y={topY + 24} textAnchor="middle" className="font-mono" style={{ fontSize: 11, fill: "var(--text-muted)" }}>
        make 6 from coins {"{1, 3, 4}"}
      </text>
      {/* greedy row: 4 + 1 + 1 = 3 coins */}
      <text x={cx + 110} y={coinY + 16} textAnchor="end" className="font-mono" style={{ fontSize: 10, fill: "var(--diff-hard)" }}>
        greedy:
      </text>
      {coin(cx + 140, coinY + 12, 4, "bad")}
      {coin(cx + 182, coinY + 12, 1, "bad")}
      {coin(cx + 224, coinY + 12, 1, "bad")}
      <text x={cx + 260} y={coinY + 16} textAnchor="start" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-hard)" }}>
        = 3 coins
      </text>
      {/* optimal row: 3 + 3 = 2 coins */}
      <text x={cx + 110} y={coinY + 76} textAnchor="end" className="font-mono" style={{ fontSize: 10, fill: "var(--diff-easy)" }}>
        best:
      </text>
      {coin(cx + 140, coinY + 72, 3, "good")}
      {coin(cx + 182, coinY + 72, 3, "good")}
      <text x={cx + 218} y={coinY + 76} textAnchor="start" className="font-mono" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>
        = 2 coins
      </text>
    </g>
  );
}

/* ── final accepted set for the naming beat ────────────────────────────────── */
function finalStates(): Record<string, BarState> {
  const order = sortedByEnd();
  let p = initPick();
  for (let k = 0; k < order.length; k++) p = step(p, order);
  const st: Record<string, BarState> = {};
  order.forEach((m) => (st[m.id] = barState(m.id, p, null)));
  return st;
}

const idleStates = (): Record<string, BarState> => {
  const st: Record<string, BarState> = {};
  MEETINGS.forEach((m) => (st[m.id] = "idle"));
  return st;
};

/* arrow endpoints */
const PANEL_BOTTOM = 150;
const clashX = xOf(12); // tangled region ~11–14
const allHandsX = xOf(13); // middle of all-hands bar
const allHandsRow = MEETINGS.findIndex((m) => m.id === "m5");

export const activitySelectionLesson: LessonSpec = {
  topicTitle: "activity selection · fit the most meetings",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: activity_selectionPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "How would you decide?",
      takeaway: "One room, many requests — fit the most that don’t overlap.",
      detail: (
        <>
          <p>
            You have one meeting room and a stack of booking requests. Each request is just two numbers: a <strong>start hour</strong> and an{" "}
            <strong>end hour</strong>. Two meetings can share the room only if they don&rsquo;t <strong>overlap</strong> in time.
          </p>
          <p>
            Touching at the edges is fine &mdash; if one meeting ends at 11 and the next starts at 11, the room is free in time. But 10&ndash;12
            sitting next to 11&ndash;14 is a clash: at 11:30 both want the room. You can&rsquo;t make everyone happy.
          </p>
          <p>
            So the real question is: <strong>how do you fit as many meetings as possible</strong> into that single room?
          </p>
        </>
      ),
      visual: <StaticTimeline />,
      panels: [
        {
          left: 150,
          top: 22,
          width: 560,
          variant: "main",
          label: "The setup",
          title: "One room. Seven people want it. Fit the most.",
          body: (
            <>
              One meeting room, seven booking requests &mdash; each with a start and end hour. Two can share the room only if they don&rsquo;t
              <strong> overlap</strong>: touching is fine (one ends at 11, the next starts at 11), but 10&ndash;12 beside 11&ndash;14 clashes. Fit as
              many as you can.
            </>
          ),
        },
      ],
      arrows: [{ x1: clashX, y1: PANEL_BOTTOM, x2: clashX, y2: ROW_TOP + 2.5 * (ROW_H + ROW_GAP) }],
      codeLabels: ["sig"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      connector: "Now that the only goal is to pack in the most meetings, what's the first plan that comes to mind?",
      actionLabel: "Judge by end time",
      takeaway: "Testing every group is too slow; “shortest” and “earliest start” both lie.",
      detail: (
        <>
          <p>
            The careful, brute-force answer: try <em>every</em> possible group of meetings, throw out the ones that overlap, and keep the biggest
            clash-free group. With seven meetings that&rsquo;s 128 groups to test &mdash; doable. But each extra meeting <em>doubles</em> the count, so
            thirty meetings is already over a billion groups. Far too slow.
          </p>
          <p>
            So you reach for a quick rule instead. <em>Shortest meeting first?</em> Sounds clever &mdash; short meetings free the room fast. But the
            shortest meeting might sit right in the middle of the day and block both the morning <em>and</em> the afternoon. Wrong rule.
          </p>
          <p>
            <em>Earliest start first?</em> Then the one meeting that runs 9&ndash;17 starts earliest and blocks the entire day. Also wrong.
          </p>
          <p>
            Both guesses fail for the same reason: they look at the wrong number. What if we picked a rule based on{" "}
            <strong>when each meeting frees the room</strong> &mdash; that is, its end time?
          </p>
        </>
      ),
      visual: (
        <StaticTimeline
          states={(() => {
            const st = idleStates();
            st["m5"] = "skipped";
            MEETINGS.forEach((m) => {
              if (m.id !== "m5") st[m.id] = "dimmed";
            });
            return st;
          })()}
        />
      ),
      panels: [
        {
          left: 150,
          top: 22,
          width: 590,
          variant: "main",
          label: "The obvious thing",
          title: "Try every group, or grab a quick rule that lies.",
          body: (
            <>
              You could test every group and keep the biggest clash-free one &mdash; but seven meetings means 128 groups, thirty means a billion. Too
              slow. So you guess a rule. &ldquo;Shortest first&rdquo;? A short midday meeting blocks both halves. &ldquo;Earliest start&rdquo;? The
              all-day 9&ndash;17 meeting blocks everything. Both wrong.
            </>
          ),
        },
      ],
      arrows: [{ x1: allHandsX, y1: 178, x2: allHandsX, y2: yOf(allHandsRow) - 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "That hunch — judge a meeting by when it frees the room — turns into one concrete move.",
      actionLabel: "Why it always wins",
      takeaway: "Sort by end time, then always take the meeting that frees the room soonest.",
      detail: (
        <>
          <p>
            The day is laid out as a timeline in the visual. Press the <strong>sort by end</strong> button below it: the meetings rearrange so the one
            that <em>finishes earliest</em> sits on top.
          </p>
          <p>
            Now press <strong>step</strong> to walk down the list one meeting at a time. Each step <strong>accepts</strong> a meeting if it starts on or
            after the last accepted one ended; otherwise it <strong>skips</strong> it. The very first meeting is always accepted &mdash; nobody has used
            the room yet, so nothing can clash with it. (Use <strong>↺ reset</strong> to start over.)
          </p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The intuition:</strong> picking the earliest-finishing meeting frees the room at the soonest possible moment. That can only help
            &mdash; any later choice keeps the room busy longer and rules out more of what could come next.
          </div>
        </>
      ),
      visual: (api) => <SortAndPick api={api} />,
      panels: [
        {
          left: 150,
          top: 18,
          width: 480,
          variant: "main",
          label: "The instinct",
          title: "Sort by end time; take the one that frees the room soonest.",
          body: (
            <>
              Press <strong>sort by end</strong> &mdash; the meetings reorder so the earliest-finishing one is on top. Then step through: keep a
              meeting only if it starts at or after the last kept one ended. (The first is always kept &mdash; nobody has used the room yet.)
            </>
          ),
        },
        {
          left: 646,
          top: 96,
          width: 198,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">The instinct:</strong> the dashed line marks when the room next opens. Freeing it soonest rules out the least.
            </>
          ),
        },
      ],
      codeLabels: ["sort", "compatible", "select", "update"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: "Watch that same move run on its own, and the whole method falls out in five lines.",
      actionLabel: "Count the work",
      takeaway: "Sort once, walk once, track when the room is free — and a swap proves it’s best.",
      detail: (
        <>
          <p>
            The entire algorithm is five short steps. <strong>1.</strong> Sort the meetings by end time. <strong>2.</strong> Keep one number,{" "}
            <code>last_end</code>, for when the room is next free. <strong>3.</strong> Walk down the sorted list. <strong>4.</strong> If a meeting starts
            at or after <code>last_end</code>, accept it and set <code>last_end</code> to its end. <strong>5.</strong> Otherwise, skip it.
          </p>
          <p>
            We start <code>last_end</code> at &ldquo;minus infinity&rdquo; &mdash; a stand-in for &ldquo;free since before time began&rdquo; &mdash; so
            the first meeting always clears the check and is taken.
          </p>
          <p>
            Why is this the <em>best</em> we can do? Suppose someone picks a different first meeting than ours. We can swap ours in: ours ends sooner or
            at the same time, so anything that fit after their pick also fits after ours. The swap never costs us a meeting. So our locally best choice
            &mdash; free the room earliest &mdash; is never worse than any other choice.
          </p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The principle:</strong> the locally best choice (free the room first) is never worse than any other choice. So greed wins.
          </div>
        </>
      ),
      visual: (api) => <AutoGreedy api={api} />,
      panels: [
        {
          left: 150,
          top: 18,
          width: 480,
          variant: "main",
          label: "The derivation",
          title: "Sort once. Walk once. Track when the room is free.",
          body: (
            <>
              Sort by end. Keep <code>last_end</code>, one number for when the room next opens &mdash; it starts at &ldquo;minus infinity&rdquo; (free
              since before time, so the first meeting always fits). Walk the list: if a meeting starts at or after <code>last_end</code>, take it and
              update; else skip.
            </>
          ),
        },
        {
          left: 646,
          top: 96,
          width: 198,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">Why it wins:</strong>{" "}swap our first pick for any other &mdash; ours frees the room no later, so the swap never loses a meeting.
            </>
          ),
        },
      ],
      codeLabels: ["sort", "last_end", "loop", "compatible", "select", "update"],
      interaction: "playback",
    },
    {
      id: "operations",
      label: "The operations",
      connector: "Five lines that always win — but how much work is the computer actually doing?",
      actionLabel: "Same shape, new problems",
      takeaway: "The sort (O(n log n)) is the only cost; the walk is one clean O(n) pass.",
      detail: (
        <>
          <p>
            Let <code>n</code> be the number of meetings. <strong>Sorting by end time</strong> costs <Term word="O(n log n)"><code>O(n log n)</code></Term> &mdash; a way of saying the
            cost grows a little faster than <code>n</code> itself, but only slightly: a thousand meetings is about ten thousand small comparisons, not a
            million.
          </p>
          <p>
            <strong>The walk</strong> through the sorted list costs <Term word="O(n)"><code>O(n)</code></Term> &mdash; the work grows in step with the number of meetings, one
            quick check apiece.
          </p>
          <p>
            For memory we keep just one running number (<code>last_end</code>) and the list of accepted meetings &mdash; no extra bookkeeping. So the
            sort is the only pricey part; everything after it is a single clean pass.
          </p>
        </>
      ),
      visual: <StaticTimeline states={finalStates()} free={17} />,
      panels: [
        {
          left: 150,
          top: 22,
          width: 590,
          variant: "main",
          label: "The operations",
          title: "Sort once, then one clean pass.",
          body: (
            <>
              Here <code>n</code> is the number of meetings. Sorting costs <code>O(n log n)</code> &mdash; cost grows a bit faster than <code>n</code>,
              but slowly: a thousand meetings is about ten thousand small comparisons. The walk costs <code>O(n)</code> &mdash; one check each. The sort
              is the only pricey part.
            </>
          ),
        },
      ],
      arrows: [{ x1: xOf(13), y1: 178, x2: xOf(13), y2: 196 }],
      codeLabels: ["sort", "loop"],
    },
    {
      id: "general",
      label: "The generalization",
      connector: "That swap argument was the real engine — and it powers a whole family of problems beyond meetings.",
      actionLabel: "Name the pattern",
      takeaway: "Greedy wins only when the swap holds; when it can’t (coins {1,3,4}), you need DP.",
      detail: (
        <>
          <p>
            <strong>Greedy</strong> means: at each step take the locally best choice and never look back. It&rsquo;s allowed whenever you can argue the
            swap &mdash; &ldquo;if anyone else made a different choice first, I could swap mine in without losing.&rdquo;
          </p>
          <p>
            The same shape shows up everywhere intervals or sorted choices appear: scheduling jobs on a single machine, fitting talks into one
            conference track, picking the most non-overlapping tasks on a timeline.
          </p>
          <p>
            But greedy isn&rsquo;t magic. Try making 6 from coins worth <code>{"{1, 3, 4}"}</code>: greedy grabs the biggest coin that fits &mdash; 4
            &mdash; then is forced into 1 + 1, three coins total. The real best is 3 + 3, only two coins. Here no clean swap exists, so the locally best
            grab actively blocks the global best.
          </p>
          <p>
            When that happens you need <strong>dynamic programming</strong> &mdash; the approach that&rsquo;s allowed to step back and retry other
            combinations. Greedy only wins when no backtracking is ever needed.
          </p>
        </>
      ),
      visual: <GreedyVsDP />,
      panels: [
        {
          left: 150,
          top: 22,
          width: 600,
          variant: "main",
          label: "The generalization",
          title: "Greedy works when the swap argument holds.",
          body: (
            <>
              <strong>Greedy</strong>{" "}means: at each step take the locally best option and never undo it. Allowed whenever you can argue &ldquo;if
              someone chose differently first, I could swap mine in without losing.&rdquo; It fails when no clean swap exists &mdash; making 6 from{" "}
              {"{1, 3, 4}"}, greedy grabs 4+1+1, but 3+3 is better. Then you need <strong>dynamic programming</strong>: step back and retry.
            </>
          ),
        },
      ],
      arrows: [{ x1: VW / 2, y1: PANEL_BOTTOM, x2: VW / 2, y2: 204 }],
      codeLabels: ["compatible", "select"],
    },
    {
      id: "name",
      label: "The pattern",
      connector: "So give this whole move its name — and the signals that tell you to reach for it.",
      takeaway: "It’s Greedy — reach for it on “fit the most” / “min X to cover all Y”.",
      detail: (
        <>
          <p>
            That&rsquo;s the name: <strong>greedy</strong>. The hard part was never the code &mdash; it&rsquo;s knowing greed is <em>allowed</em>. The
            test is the swap argument: if the locally best choice is never worse than any other choice, you can stop second-guessing and just take it.
          </p>
          <p>
            <strong>Pattern signals</strong> &mdash; reach for greedy when you see:
          </p>
          <ul>
            <li>&ldquo;Fit the most non-overlapping things into one slot&rdquo;</li>
            <li>&ldquo;Minimum number of X to cover all Y&rdquo; on intervals or a sorted axis</li>
            <li>&ldquo;Pick the cheapest available edge / job / coin&rdquo; with a local-best rule</li>
            <li>Anywhere the locally best choice provably can&rsquo;t block the overall best</li>
          </ul>
          <p>
            Open the <strong>&lt;/&gt; code</strong> tab on the right to see the Python: five lines of real work, one of them a sort.
          </p>
        </>
      ),
      visual: <StaticTimeline states={finalStates()} />,
      panels: [
        {
          left: 150,
          top: 18,
          width: 480,
          variant: "main",
          label: "The pattern",
          title: "Greedy.",
          body: (
            <>
              That&rsquo;s the name. The hard part isn&rsquo;t the code &mdash; it&rsquo;s knowing greed is allowed (the swap test). Spot it when you
              see &ldquo;fit the most non-overlapping things&rdquo;, &ldquo;minimum X to cover all Y&rdquo;, or any time the locally best choice
              can&rsquo;t block the overall best. Open the <strong>&lt;/&gt; code</strong> tab &mdash; five lines, one sort.
            </>
          ),
        },
        {
          left: 646,
          top: 96,
          width: 198,
          variant: "note",
          body: (
            <>
              <strong className="text-[var(--accent-ink)]">The result:</strong>{" "}the green bars are greedy&rsquo;s clash-free set &mdash; the most meetings one room can hold.
            </>
          ),
        },
      ],
      arrows: [{ x1: 744, y1: 158, x2: 715, y2: yOf(MEETINGS.length - 1) + ROW_H / 2 }],
      codeLabels: ["sig", "sort", "result_init", "last_end", "loop", "compatible", "select", "update", "result"],
    },
  ],
};
