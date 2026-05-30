"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket } from "@/shared/lesson/canvas";
import sliding_window_variablePy from "./algorithm.py";

const S = "abracadabra";
const ARR = Array.from(S);
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250);

/* dim everything outside [l, r] (when r >= l), else dim all */
function dimOutside(l: number, r: number): boolean[] {
  return ARR.map((_, i) => !(r >= l && i >= l && i <= r));
}

/* ── interactive WEDGE: grow R / shrink L by hand, keep the run repeat-free ─── */
function ManualWindow({ api }: { api: BeatVisualApi }) {
  const [l, setL] = useState(0);
  const [r, setR] = useState(0);

  const expand = () => { api.onInteractionDone(); setR((cur) => Math.min(ARR.length - 1, cur + 1)); };
  const contract = () => { api.onInteractionDone(); setL((cur) => Math.min(r, cur + 1)); };
  const reset = () => { setL(0); setR(0); };

  const run = S.slice(l, r + 1);
  const unique = new Set(run).size === run.length;
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i >= l && i <= r ? (unique ? "active" : "bad") : undefined));
  const dim = dimOutside(l, r);
  const markers: Record<number, string> = {};
  markers[l] = l === r ? "L R" : "L";
  if (r !== l) markers[r] = "R";

  const btnY = G.y + G.cellH + 44;
  const Btn = ({ x, w, label, onClick, disabled, primary }: { x: number; w: number; label: string; onClick: () => void; disabled?: boolean; primary?: boolean }) => (
    <g onClick={disabled ? undefined : onClick} style={{ cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1 }}
      tabIndex={disabled ? undefined : 0} role="button" aria-label={label}
      onKeyDown={(e) => { if (!disabled && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}>
      <rect x={x} y={btnY} width={w} height={24} rx={6} fill={primary ? "var(--accent-soft)" : "var(--bg-card)"} stroke={primary ? "var(--accent-line)" : "var(--line)"} />
      <text x={x + w / 2} y={btnY + 12} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: primary ? "var(--accent-ink)" : "var(--text-muted)" }}>{label}</text>
    </g>
  );

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
      <text x={VW / 2} y={G.y - 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: unique ? "var(--diff-easy)" : "var(--diff-hard)" }}>
        {`"${run}" · length ${r - l + 1} · ${unique ? "no repeats ✓" : "repeat ✗"}`}
      </text>
      <Btn x={VW / 2 - 150} w={36} label="↺" onClick={reset} />
      <Btn x={VW / 2 - 104} w={92} label="contract L →" onClick={contract} disabled={l >= r} />
      <Btn x={VW / 2 + 2} w={92} label="expand R →" onClick={expand} disabled={r >= ARR.length - 1} primary />
    </g>
  );
}

/* ── playback: the breathing window runs itself, the code line follows ─────── */
interface SW { l: number; r: number; seen: Record<string, number>; best: number; bestRange: [number, number]; done: boolean; }
function AutoWindow({ api }: { api: BeatVisualApi }) {
  const init = (): SW => ({ l: 0, r: -1, seen: {}, best: 0, bestRange: [0, 0], done: false });
  const [s, setS] = useState<SW>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      const nextR = c.r + 1;
      if (nextR >= ARR.length) { api.onActiveLine(["result"]); setS({ ...c, done: true }); return; }
      const ch = ARR[nextR];
      const prev = c.seen[ch];
      if (prev !== undefined && prev >= c.l) {
        api.onActiveLine(["check", "contract"]);
        setS({ ...c, l: prev + 1, seen: { ...c.seen, [ch]: nextR }, r: nextR, best: Math.max(c.best, nextR - (prev + 1) + 1), bestRange: nextR - (prev + 1) + 1 > c.best ? [prev + 1, nextR] : c.bestRange });
        return;
      }
      const seen = { ...c.seen, [ch]: nextR };
      const len = nextR - c.l + 1;
      if (len > c.best) { api.onActiveLine(["record", "update"]); setS({ ...c, r: nextR, seen, best: len, bestRange: [c.l, nextR] }); }
      else { api.onActiveLine(["expand"]); setS({ ...c, r: nextR, seen }); }
    }, 850);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { l, r, seen, best, bestRange, done } = s;
  const tones: (Tone | undefined)[] = ARR.map((_, i) => {
    if (done && i >= bestRange[0] && i <= bestRange[1]) return "good";
    return r >= l && i >= l && i <= r ? "active" : undefined;
  });
  const dim = done ? ARR.map((_, i) => !(i >= bestRange[0] && i <= bestRange[1])) : dimOutside(l, Math.max(0, r));
  const markers: Record<number, string> = {};
  if (!done && r >= 0) { markers[l] = l === r ? "L R" : "L"; if (r !== l) markers[r] = "R"; }

  const seenStr = Object.keys(seen).length === 0 ? "{}" : `{${Object.entries(seen).map(([k, v]) => `${k}:${v}`).join(", ")}}`;

  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
      <text x={VW / 2} y={G.y - 38} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done ? `done · longest no-repeat run = ${best} ("${S.slice(bestRange[0], bestRange[1] + 1)}")` : r < 0 ? "starting…" : `window "${S.slice(l, r + 1)}" · best so far ${best}`}
      </text>
      <text x={VW / 2} y={G.y - 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>
        {`last-seen table: ${seenStr}`}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={G.y + G.cellH + 40} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 52} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static: the naive scan (one start, run grows rightward) ───────────────── */
function NaiveScan() {
  const start = 2, end = 5; // a frozen snapshot of "racad"-style scan from start=2
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i === start ? "muted" : i > start && i <= end ? "active" : undefined));
  const dim = ARR.map((_, i) => i < start || i > end);
  return (
    <g>
      <text x={VW / 2} y={G.y - 44} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        from every start, walk right until a letter repeats · then start over one cell over
      </text>
      <text x={VW / 2} y={G.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-med)" }}>
        about length × length checks — the same letters get re-read again and again
      </text>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={{ [start]: "start" }} />
    </g>
  );
}

/* ── static: touched-twice / linear-time contrast ─────────────────────────── */
function LinearContrast() {
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i >= 1 && i <= 4 ? "good" : undefined));
  const dim = ARR.map((_, i) => !(i >= 1 && i <= 4));
  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={{ 1: "L", 4: "R" }} />
      <text x={VW / 2} y={G.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        each letter is added once (R reaches it) and dropped once (L passes it) — about 2n moves
      </text>
      <text x={VW / 2} y={G.y + G.cellH + 52} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--diff-easy)" }}>
        naive on 1,000 letters ≈ 500,000 checks · breathing window ≈ 2,000
      </text>
    </g>
  );
}

/* ── static: three tiny windows sharing the same two-marker motion ─────────── */
function ThreeVariants() {
  const rows: { y: number; label: string; values: string[]; lo: number; hi: number }[] = [
    { y: 196, label: "no repeats (this lesson)", values: Array.from("abrac"), lo: 1, hi: 4 },
    { y: 286, label: "covers every needed letter", values: Array.from("xaybzc"), lo: 1, hi: 5 },
    { y: 376, label: "at most 2 different letters", values: Array.from("aabbc"), lo: 0, hi: 3 },
  ];
  const mini = (count: number, y: number) => rowGeom(count, VW, y, 34, 5, 30);
  return (
    <g>
      {rows.map((row, ri) => {
        const g = mini(row.values.length, row.y);
        const tones: (Tone | undefined)[] = row.values.map((_, i) => (i >= row.lo && i <= row.hi ? "active" : undefined));
        const dim = row.values.map((_, i) => i < row.lo || i > row.hi);
        return (
          <g key={ri}>
            <CellRow geom={g} values={row.values} tones={tones} dim={dim} fontSize={12} markers={{ [row.lo]: "L", [row.hi]: "R" }} />
            <text x={g.left(0) - 14} y={g.y + g.cellH / 2} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>
              {ri + 1}.
            </text>
            <text x={g.cx(row.values.length - 1) + g.cellW / 2 + 18} y={g.y + g.cellH / 2} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>
              {row.label}
            </text>
          </g>
        );
      })}
      <text x={VW / 2} y={446} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>
        right grows · left shrinks just enough — the rule changes, the motion doesn&rsquo;t
      </text>
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[], markers?: Record<number, string>) => (
  <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
);

export const slidingWindowVariableLesson: LessonSpec = {
  topicTitle: "variable sliding window · longest run with no repeats",
  canvas: { width: VW, height: VH },
  codeSource: sliding_window_variablePy as string,
  beats: [
    {
      id: "setup",
      visual: (
        <g>
          {idleRow()}
          <Bracket x1={G.left(0)} x2={G.left(ARR.length - 1) + G.cellW} y={G.y - 16} label="find the longest no-repeat run" color="var(--text-faint)" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The setup", title: "The longest stretch with no repeats.",
        body: <>Here is the word <code>abracadabra</code> spelled out as a row of letter boxes. The question: what is the longest run you can read left-to-right without ever repeating a letter? We don&rsquo;t fix the length &mdash; we protect a rule: every letter inside is different.</>,
      }],
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: G.y - 18 }],
      codeLabels: ["sig"],
    },
    {
      id: "naive",
      visual: <NaiveScan />,
      panels: [{
        left: 150, top: 332, width: 580, variant: "main", label: "The obvious thing", title: "Check every possible stretch.",
        body: <>The slow way: from each starting box, walk right until a letter repeats, and remember the longest clean run. For an <em>n</em>-letter word that&rsquo;s about <code>n²/2</code> &mdash; roughly length-times-length &mdash; checks. Worse, we keep re-reading the same letters, throwing away facts we already proved.</>,
      }],
      arrows: [{ x1: G.cx(2), y1: 328, x2: G.cx(2), y2: G.y + G.cellH + 25 }],
      codeLabels: [],
      interaction: "none",
    },
    {
      id: "wedge",
      visual: (api) => <ManualWindow api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The wedge", title: "Two ends. Move them by hand.",
          body: <>Two <strong>markers</strong> (just labels under the row): <code>L</code> on the left edge of your run, <code>R</code> on the right. <em>Expand</em> adds the next letter on the right; <em>contract</em> drops the leftmost one. Try to find the longest no-repeat run &mdash; notice you never restart.</>,
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The wedge:</strong> when does <code>R</code> <em>want</em> to move? When does <code>L</code> <em>have</em> to move? Are they ever moving for the same reason?</>,
        },
      ],
      codeLabels: [],
      interaction: "wedge",
    },
    {
      id: "derive",
      visual: (api) => <AutoWindow api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The derivation", title: "Right grows greedily. Left shrinks just enough.",
        body: <>Walk <code>R</code> across the word. Each step: is the letter at position <code>R</code> (its position number, counting from 0) already inside the current run? No &mdash; keep it, and update the best length. Yes &mdash; the no-repeat rule just broke, so slide <code>L</code> forward past the duplicate. <span className="text-[var(--accent-ink)]">A small lookup table remembers each letter&rsquo;s last position, so <code>L</code> jumps there in one move.</span></>,
      }],
      codeLabels: ["expand", "check", "contract", "record", "update"],
      interaction: "playback",
    },
    {
      id: "win",
      visual: <LinearContrast />,
      panels: [{
        left: 150, top: 30, width: 560, variant: "main", label: "The win", title: "Every letter touched twice. Linear time.",
        body: <>Each letter joins the run once and leaves once &mdash; about <code>2n</code> moves, written <code>O(n)</code> (the work grows in step with the word&rsquo;s length). The table lookup is instant &mdash; <code>O(1)</code>, the same tiny cost no matter how full it gets. Naive on 1,000 letters: half a million checks; this: about two thousand.</>,
      }],
      arrows: [{ x1: G.cx(2), y1: 150, x2: G.cx(2), y2: G.y - 4 }],
      codeLabels: ["expand", "contract"],
      interaction: "none",
    },
    {
      id: "general",
      visual: <ThreeVariants />,
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The generalization", title: "Any rule that breaks once you cross a line.",
        body: <>The trick works for any rule the window keeps that snaps the moment you cross a line. &ldquo;Smallest window covering every needed letter.&rdquo; &ldquo;Longest run with at most <code>k</code> different letters.&rdquo; Grow <code>R</code> while the rule holds; shrink <code>L</code> the least amount that brings it back. The rule changes; the motion doesn&rsquo;t.</>,
      }],
      codeLabels: ["expand", "check", "contract"],
      interaction: "none",
    },
    {
      id: "name",
      visual: idleRow(ARR.map((_, i) => (i >= 1 && i <= 4 ? "good" : undefined)), ARR.map((_, i) => !(i >= 1 && i <= 4)), { 1: "L", 4: "R ✓" }),
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Sliding Window (Variable).",
        body: <>That&rsquo;s the name &mdash; the answer here is <code>brac</code> (length 4). Same family as the fixed-size window, but the window breathes: right expands when it can, left contracts when it must. Spot it whenever a problem asks for a longest or shortest <em>substring</em> (a run of letters sitting next to each other) under a rule that flips on or off once.</>,
      }],
      arrows: [{ x1: G.cx(2), y1: G.y + G.cellH + 34, x2: G.cx(2), y2: G.y + G.cellH + 4 }],
      codeLabels: ["result"],
      interaction: "none",
    },
  ],
};
