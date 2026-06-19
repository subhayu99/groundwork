"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Arrow } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import setsTuplesPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* the through-line examples (match algorithm.py + visualizer.tsx exactly) */
const TUPLE: (string | number)[] = ["2026-05-28", 47.5, 22.1];
const TUPLE_LABELS = ["[0] date", "[1] lat", "[2] temp"];
const NAME_POOL = ["alice", "bob", "cara", "dan", "eli"];

/* tuple row geometry — wider cells for the dates/numbers, centered, in the middle band */
const TG = rowGeom(TUPLE.length, VW, 318, 132, 14, 44);

/* ── set-pill helpers (rounded chips, drawn in SVG, centered) ───────────────── */
function SetPills({
  members, y = 210, tones, onClick, enabled, label = "set",
}: {
  members: string[];
  y?: number;
  tones?: (Tone | undefined)[];
  onClick?: (i: number) => void;
  enabled?: boolean;
  label?: string;
}) {
  const pw = 86, gap = 12;
  const total = members.length * pw + (members.length - 1) * gap;
  const sx = (VW - total) / 2;
  return (
    <g>
      <text x={VW / 2} y={y - 22} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--accent-ink)" }}>{label} {"{ … }"}</text>
      {members.length === 0 && (
        <text x={VW / 2} y={y + 22} textAnchor="middle" className="font-mono select-none"
          style={{ fontSize: 12, fill: "var(--text-faint)" }}>empty</text>
      )}
      {members.map((m, i) => {
        const x = sx + i * (pw + gap);
        const tone: Tone = tones?.[i] ?? "accent";
        const ts = tone === "good"
          ? { bg: "color-mix(in oklab, var(--diff-easy) 20%, var(--bg-card))", border: "var(--diff-easy)" }
          : tone === "active"
          ? { bg: "color-mix(in oklab, var(--accent-sky) 32%, var(--bg-card))", border: "var(--accent-line)" }
          : { bg: "var(--accent-soft)", border: "var(--accent-line)" };
        const clickable = !!onClick && !!enabled;
        return (
          <g key={m} style={{ cursor: clickable ? "pointer" : "default", outline: "none" }}
            onClick={clickable ? () => onClick!(i) : undefined}
            tabIndex={clickable ? 0 : undefined} role={clickable ? "button" : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick!(i); } } : undefined}>
            <rect x={x} y={y} width={pw} height={36} rx={18}
              style={{ fill: ts.bg, stroke: ts.border, transition: "fill .3s, stroke .3s" }} strokeWidth={2} />
            <text x={x + pw / 2} y={y + 18} textAnchor="middle" dominantBaseline="central"
              className="font-mono select-none pointer-events-none" style={{ fontSize: 13, fill: "var(--text)" }}>{m}</text>
          </g>
        );
      })}
    </g>
  );
}

/* a parenthesised, position-labelled tuple row */
function TupleRow({ error, tones }: { error?: boolean; tones?: (Tone | undefined)[] }) {
  const borderTones = tones ?? TUPLE.map(() => (error ? ("bad" as Tone) : undefined));
  return (
    <g>
      <text x={TG.left(0) - 26} y={TG.y + TG.cellH / 2} textAnchor="middle" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 22, fill: "var(--text-faint)" }}>(</text>
      <CellRow geom={TG} values={TUPLE} tones={borderTones} fontSize={13} />
      <text x={TG.left(TUPLE.length - 1) + TG.cellW + 26} y={TG.y + TG.cellH / 2} textAnchor="middle" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 22, fill: "var(--text-faint)" }}>)</text>
      {TUPLE_LABELS.map((lab, i) => (
        <text key={i} x={TG.cx(i)} y={TG.y + TG.cellH + 16} textAnchor="middle"
          className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>{lab}</text>
      ))}
      <text x={VW / 2} y={TG.y - 20} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--accent-ink)" }}>tuple ( … ) · fixed packet</text>
    </g>
  );
}

/* ── INTERACTIVE wedge: add a name (dedup), poke the tuple (refusal) ────────── */
function AddNameWedge({ api }: { api: BeatVisualApi }) {
  const [members, setMembers] = useState<string[]>(["alice", "bob"]);
  const [lastIdx, setLastIdx] = useState<number | null>(null);
  const [note, setNote] = useState("add a name, or add one already in — then poke the packet");
  const [tupleErr, setTupleErr] = useState<string | null>(null);

  const addName = (n: string) => {
    api.onInteractionDone();
    const dup = members.includes(n);
    api.onActiveLine(dup ? ["set_add_dup"] : ["set_add"]);
    if (dup) {
      setNote(`"${n}" is already in — the set shrugs, size stays ${members.length}`);
      setLastIdx(members.indexOf(n));
    } else {
      setMembers((m) => [...m, n]);
      setNote(`added "${n}" — a fresh member`);
      setLastIdx(members.length);
    }
  };
  const removeLast = () => {
    api.onInteractionDone();
    if (members.length === 0) return;
    api.onActiveLine(["set_discard"]);
    setNote(`removed "${members[members.length - 1]}"`);
    setMembers((m) => m.slice(0, -1));
    setLastIdx(null);
  };
  const checkIn = () => {
    api.onInteractionDone();
    api.onActiveLine(["set_in"]);
    setNote(`"alice" in set? ${members.includes("alice") ? "True" : "False"} — found in one hop`);
  };
  const pokeTuple = (msg: string) => {
    api.onInteractionDone();
    api.onActiveLine(["tuple_immutable"]);
    setTupleErr(msg);
    setNote("the packet refuses — a tuple can't be changed once made");
    setTimeout(() => setTupleErr(null), 1600);
  };

  const reset = () => {
    setMembers(["alice", "bob"]); setLastIdx(null); setTupleErr(null);
    setNote("add a name, or add one already in — then poke the packet");
  };

  const tones: (Tone | undefined)[] = members.map((_, i) => (i === lastIdx ? "active" : undefined));

  const btnY = 250, bw = 64, bgap = 8;
  const btns = NAME_POOL.slice(0, 4);
  const btnsTotal = (btns.length + 2) * bw + (btns.length + 1) * bgap;
  const bx0 = (VW - btnsTotal) / 2;

  return (
    <g>
      <SetPills members={members} y={202} tones={tones} onClick={(i) => addName(members[i])} enabled label="set · unique members" />

      {/* control buttons row */}
      {btns.map((n, i) => {
        const x = bx0 + i * (bw + bgap);
        return (
          <g key={n} onClick={() => addName(n)} style={{ cursor: "pointer", outline: "none" }}
            tabIndex={0} role="button" aria-label={`add ${n}`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addName(n); } }}>
            <rect x={x} y={btnY} width={bw} height={22} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
            <text x={x + bw / 2} y={btnY + 11} textAnchor="middle" dominantBaseline="central"
              className="font-mono select-none pointer-events-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>+ {n}</text>
          </g>
        );
      })}
      <g onClick={checkIn} style={{ cursor: "pointer", outline: "none" }} tabIndex={0} role="button" aria-label="check membership"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); checkIn(); } }}>
        <rect x={bx0 + btns.length * (bw + bgap)} y={btnY} width={bw} height={22} rx={6} fill="var(--accent-soft)" stroke="var(--accent-line)" />
        <text x={bx0 + btns.length * (bw + bgap) + bw / 2} y={btnY + 11} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 10, fill: "var(--accent-ink)" }}>in?</text>
      </g>
      <g onClick={removeLast} style={{ cursor: "pointer", outline: "none" }} tabIndex={0} role="button" aria-label="remove last"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); removeLast(); } }}>
        <rect x={bx0 + (btns.length + 1) * (bw + bgap)} y={btnY} width={bw} height={22} rx={6}
          fill="color-mix(in oklab, var(--diff-hard) 10%, var(--bg-card))" stroke="color-mix(in oklab, var(--diff-hard) 50%, transparent)" />
        <text x={bx0 + (btns.length + 1) * (bw + bgap) + bw / 2} y={btnY + 11} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 10, fill: "var(--diff-hard)" }}>− last</text>
      </g>

      {/* tuple */}
      <g transform="translate(0,-12)">
        <TupleRow error={!!tupleErr} />
      </g>
      {/* tuple poke buttons */}
      <g onClick={() => pokeTuple("not allowed — a tuple can't be changed")} style={{ cursor: "pointer", outline: "none" }}
        tabIndex={0} role="button" aria-label="try assign"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pokeTuple("not allowed — a tuple can't be changed"); } }}>
        <rect x={VW / 2 - 168} y={TG.y + TG.cellH + 14} width={156} height={22} rx={6}
          fill="color-mix(in oklab, var(--diff-hard) 10%, var(--bg-card))" stroke="color-mix(in oklab, var(--diff-hard) 50%, transparent)" />
        <text x={VW / 2 - 90} y={TG.y + TG.cellH + 25} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 10, fill: "var(--diff-hard)" }}>try: change slot 0</text>
      </g>
      <g onClick={() => pokeTuple("not allowed — a tuple can't grow")} style={{ cursor: "pointer", outline: "none" }}
        tabIndex={0} role="button" aria-label="try append"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pokeTuple("not allowed — a tuple can't grow"); } }}>
        <rect x={VW / 2 + 12} y={TG.y + TG.cellH + 14} width={156} height={22} rx={6}
          fill="color-mix(in oklab, var(--diff-hard) 10%, var(--bg-card))" stroke="color-mix(in oklab, var(--diff-hard) 50%, transparent)" />
        <text x={VW / 2 + 90} y={TG.y + TG.cellH + 25} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 10, fill: "var(--diff-hard)" }}>try: add a 4th</text>
      </g>

      <text x={VW / 2} y={TG.y + TG.cellH + 48} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: tupleErr ? "var(--diff-hard)" : "var(--text-faint)" }}>
        {tupleErr ? `✗ ${tupleErr}` : note}
      </text>

      <g onClick={reset} style={{ cursor: "pointer", outline: "none" }} tabIndex={0} role="button" aria-label="reset"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reset(); } }}>
        <rect x={VW / 2 - 28} y={TG.y + TG.cellH + 58} width={56} height={22} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={TG.y + TG.cellH + 69} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 10, fill: "var(--text-muted)" }}>↺ reset</text>
      </g>
    </g>
  );
}

/* ── PLAYBACK: a list scan ticks chip by chip, looking for "alice" ──────────── */
const SCAN = ["bob", "cara", "dan", "eli", "alice"]; // alice last → worst case
function ScanPlayback({ api }: { api: BeatVisualApi }) {
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef({ cursor: 0, done: false });
  ref.current = { cursor, done };

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      api.onActiveLine([]); // naive baseline — no @sync line in algorithm.py for the list scan
      if (SCAN[c.cursor] === "alice") { setDone(true); return; }
      if (c.cursor >= SCAN.length - 1) { setDone(true); return; }
      setCursor(c.cursor + 1);
    }, pace(850));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tones: (Tone | undefined)[] = SCAN.map((v, i) =>
    done && i === cursor && v === "alice" ? "good" : i === cursor ? "active" : i < cursor ? "muted" : undefined);

  return (
    <g>
      <SetPills members={SCAN} y={268} tones={tones} label="plain list · scanned one by one" />
      <text x={VW / 2} y={216} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done
          ? (SCAN[cursor] === "alice" ? `found "alice" after ${cursor + 1} checks` : "ran out — not found")
          : `checking "${SCAN[cursor]}" … not alice, keep scanning`}
      </text>
      <g onClick={() => { setCursor(0); setDone(false); }} style={{ cursor: "pointer", outline: "none" }}
        tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCursor(0); setDone(false); } }}>
        <rect x={VW / 2 - 30} y={328} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={340} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static visuals ────────────────────────────────────────────────────────── */
function SetupVisual() {
  return (
    <g>
      <SetPills members={["alice", "bob"]} y={206} label="set · who is here" />
      <g transform="translate(0,4)">
        <TupleRow />
      </g>
    </g>
  );
}

function BucketsVisual() {
  // set as numbered cubbies (buckets) — one hop to a slot
  const slots = ["alice", "", "bob", "", ""];
  const bw = 92, gap = 14, total = slots.length * bw + (slots.length - 1) * gap, sx = (VW - total) / 2, y = 200;
  return (
    <g>
      <text x={VW / 2} y={y - 22} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--accent-ink)" }}>set = a hash map&rsquo;s keys · each name lands in its own cubby</text>
      {slots.map((s, i) => {
        const x = sx + i * (bw + gap), filled = !!s;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={40} rx={8}
              fill={filled ? "var(--accent-soft)" : "var(--bg-card)"}
              stroke={filled ? "var(--accent-line)" : "var(--line)"} strokeWidth={2}
              strokeDasharray={filled ? undefined : "4 4"} />
            <text x={x + bw / 2} y={y + 20} textAnchor="middle" dominantBaseline="central"
              className="font-mono select-none" style={{ fontSize: 12, fill: filled ? "var(--text)" : "var(--text-faint)" }}>{s || "·"}</text>
            <text x={x + bw / 2} y={y + 54} textAnchor="middle" className="font-mono select-none"
              style={{ fontSize: 9, fill: "var(--text-faint)" }}>cubby {i}</text>
          </g>
        );
      })}
      <g transform="translate(0,16)">
        <TupleRow tones={TUPLE.map(() => "accent" as Tone)} />
      </g>
    </g>
  );
}

function OpsVisual() {
  return (
    <g>
      <SetPills members={["alice", "bob"]} y={196} label="set · add · in · remove" />
      <text x={VW / 2} y={250} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--diff-easy)" }}>add O(1) · in O(1) · ∩ O(min) · ∪ O(|A|+|B|) · − O(|A|)</text>
      <text x={VW / 2} y={268} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 9, fill: "var(--text-faint)" }}>overlap = in both · merge = in either · leftovers = in one but not the other</text>
      <g transform="translate(0,18)">
        <TupleRow tones={TUPLE.map(() => "accent" as Tone)} />
      </g>
      <text x={VW / 2} y={TG.y + TG.cellH + 56} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--diff-easy)" }}>slot i → O(1) · read all → O(n) · being fixed lets a tuple live inside a set</text>
    </g>
  );
}

/* ── PREDICTION GATE + reveal: commit to the membership cost, THEN see the
 * price list. The gate is the operations beat's real interaction
 * (interaction: "wedge"): one tap on a pill fires api.onInteractionDone()
 * inside PredictGate, feedback shows, and after a short reading pause the
 * unchanged OpsVisual lands with the actual costs — which the static visual
 * would otherwise spoil before the prediction (the variables-exemplar
 * tap-conditional reveal). HTML hosted on the SVG canvas via <foreignObject>
 * per Predict.tsx; data-canvas-panel opts it into the scene layout's
 * content-extent measurement. */
function MembershipCostGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) return <OpsVisual />;

  return (
    <g>
      <SetPills members={["alice", "bob"]} y={196} label="set · add · in · remove" />
      <text x={VW / 2} y={250} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        the room keeps filling — picture a million names in those cubbies
      </text>
      <foreignObject x={190} y={268} width={480} height={190}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question={"The set grows to a million names — what does asking “is alice in?” cost?"}
            choices={[
              { id: "walk", label: "a walk — check name after name", note: "that's the plain list's price — the cubbies exist precisely so nothing walks the row" },
              { id: "hop", label: "one hop — same as when it held two", correct: true, note: "hash the name, look in its one cubby — the other 999,999 are never touched" },
              { id: "between", label: "in between — more names, more work", note: "the hash points at one cubby regardless of how many others are filled" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1800)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

function FitVisual() {
  return (
    <g>
      <SetPills members={["alice", "bob"]} y={226} label="set" />
      <text x={VW / 2} y={274} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 10, fill: "var(--text-faint)" }}>online users · seen URLs · visited spots · allow-list</text>
      <g transform="translate(0,16)">
        <TupleRow tones={TUPLE.map(() => "accent" as Tone)} />
      </g>
      <text x={VW / 2} y={TG.y + TG.cellH + 56} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 10, fill: "var(--text-faint)" }}>(x, y) points · (row, col) grid spots · (date, lat, temp) readings</text>
    </g>
  );
}

function NameVisual() {
  return (
    <g>
      <SetPills members={["alice", "bob"]} y={206} label="set" />
      <g transform="translate(0,4)">
        <TupleRow />
      </g>
      <text x={VW / 2} y={TG.y + TG.cellH + 40} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--diff-easy)" }}>list = silent · set = membership matters · tuple = these are one thing</text>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, scan, wedge, structures, operations, fit, name)
 *   structured : 5 — cuts `scan` (slot-2 naive scan) and `fit` (slot-6 transfer);
 *                the wedge connector re-states the naive baseline inline.
 *   rigorous   : 3 — `structures` (the model, invariants stated) + `operations`
 *                (exact costs + edges, with the prediction gate) + `name` (close);
 *                when-to-reach-for-each is folded into those beats' rigorous prose.
 *   refresh    : additionally trims `scan` + `fit` (trimOnRefresh).             */
export const setsTuplesLesson: LessonSpec = {
  topicTitle: "sets & tuples · membership vs. one fixed packet",
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: VH },
  codeSource: setsTuplesPy as string,
  // standing on hash-maps (TRACK-NARRATIVES row 15): the memory-for-instant-lookup
  // deal is already banked — this lesson strips it to membership + the fixed record.
  bridgeFrom: reg({
    base: "A hash map spends memory so lookup never searches. Now strip that deal to one question: is it here?",
    intuitive: "You spent memory on a filing trick and “find it by name” became one hop. Now keep just the question “is it here?”",
    rigorous: "Hashing made key lookup size-independent. A set is the table keys-only; a tuple, the immutable record fit to be a key.",
  }),
  // Stamp from meta (no ⚑): the lesson genuinely IS the trade — pay hash cubbies,
  // membership stops depending on size — so the close claims idea 5, not a seed.
  principle: { key: "trade-space-for-time", n: 5, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "I have the question",
      takeaway: reg({
        base: "Two containers, opposite rules: one tracks membership, one keeps a fixed shape.",
        intuitive: "Two jobs: “is alice here, yes or no?” and “keep these three values as one packet.”",
      }),
      visual: <SetupVisual />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The setup", title: "Two small containers. Two different jobs.",
        body: reg({
          base: <>Tonight you track who&rsquo;s in a chat room. You only care &ldquo;is alice here, yes or no?&rdquo;, not when she arrived. Down the hall, weather arrives as one packet: <code>(date, latitude, temperature)</code>. Both are containers, but with opposite rules.</>,
          intuitive: <>Tonight you&rsquo;re watching a chat room, and only one question ever comes up: &ldquo;is alice here, yes or no?&rdquo; Not when she came, not how many times. Down the hall, each weather reading arrives as one sealed packet of three values: <code>(date, latitude, temperature)</code>. Two containers, and they want opposite things from you.</>,
        }),
      }],
      detail: (
        <>
          <p>Tonight you&rsquo;re tracking who&rsquo;s logged into a chat room. You don&rsquo;t care <em>when</em> they arrived, and you don&rsquo;t want to count the same person twice if they log in again. You only care about one thing: <em>is alice in the room, or not?</em></p>
          <p>Down the hall, someone is logging weather readings. Each one is <code>(date, latitude, temperature)</code>: three values that belong together as a single packet. You&rsquo;d never sneak in a fourth value, and you&rsquo;d never swap out the second.</p>
          <p>Both of these are <strong>containers</strong> (things that hold a bunch of values), but the rules they live by are opposite. One cares about <em>membership</em>; the other cares about <em>keeping a fixed shape</em>.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 188 }],
      codeLabels: ["set_def", "tuple_def"],
    },
    {
      id: "scan",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Before reaching for anything special, what happens if you just throw both jobs into a plain list?",
      actionLabel: "What do these need?",
      takeaway: "A plain list works but doesn't fit: scanning is O(n), and it can't refuse a duplicate.",
      visual: (api) => <ScanPlayback api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The obvious thing", title: "Stuff a list. Scan when you need it.",
        body: <>The easy move: keep everyone in a plain list. To check for alice you scan chip after chip until you hit her or run out, slow if the list is long. And nothing stops a second &ldquo;alice&rdquo; sneaking in. It works, but it doesn&rsquo;t fit.</>,
      }],
      detail: (
        <>
          <p>You could just keep a plain <strong>list</strong> of everyone logged in (a list is an ordered row of values). To check whether alice is there, you walk along the chips one at a time until you find her or run off the end. If five people are online that&rsquo;s fine; if a million are online, you might check nearly a million chips. That cost is <Term word="O(n)"><code>O(n)</code></Term> (&ldquo;order n&rdquo;: the work grows in step with the number of items <code>n</code>).</p>
          <p>A list has another gap for this job: nothing stops a second &ldquo;alice&rdquo; from sneaking in. The list happily holds duplicates, even though for a chat room a person is either present or not.</p>
          <p>You could also stuff the weather reading into a list and grab values by position 0, 1, 2. But a future you might forget which slot is the latitude, and nothing stops the list from growing a fourth slot. Both setups <em>work</em>; neither is doing what the data actually wants.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 208 }],
      codeLabels: [],
      interaction: "playback",
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "The list shrugged at duplicates and let the packet grow. So watch what these two purpose-built containers do instead when you push on them.",
        intuitive: "A plain list shrugs at a second “alice” and happily grows a fourth slot. So push on these two purpose-built containers and watch what they do instead.",
        structured: "A plain list could do both jobs: checking a name means walking it chip by chip, and nothing refuses a duplicate. Push on these two purpose-built containers instead.",
      }),
      actionLabel: "Identity vs grouping",
      takeaway: "A set refuses duplicates; a tuple refuses any change. Each refusal reveals its purpose.",
      visual: (api) => <AddNameWedge api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Add a name twice. Then poke the packet.",
          body: <>Add a name to the set, then add one already in: it shrugs, no &ldquo;second alice.&rdquo; Now poke the packet: change a slot or add a fourth. Both refuse, because a tuple is <em>immutable</em> (can&rsquo;t change once made).</>,
        },
        {
          left: 648, top: 372, width: 200, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> what does each container&rsquo;s <em>refusal</em> tell you it&rsquo;s for?</>,
        },
      ],
      detail: (
        <>
          <p>On the canvas is a small <strong>set</strong>. Add a name, then add one that&rsquo;s already in there. The set doesn&rsquo;t care: a name is either in or out, full stop. There&rsquo;s no order, no count, no &ldquo;second alice.&rdquo; That refusal to keep duplicates is the whole point of a set.</p>
          <p>Below it is a <strong>tuple</strong>, the fixed weather packet. Try to change a slot, or try to add a fourth value. Both attempts fail. The tuple is <em>immutable</em> (a fancy word meaning &ldquo;can&rsquo;t be changed once it&rsquo;s made&rdquo;): its shape is locked the instant you create it.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct question:</strong> what does each container&rsquo;s <em>refusal</em>{" "}&mdash; the set rejecting a duplicate, the tuple rejecting any change &mdash; tell you about what it&rsquo;s really for?
          </div>
        </>
      ),
      codeLabels: ["set_add", "set_add_dup"],
      interaction: "wedge",
    },
    {
      id: "structures",
      label: "The structures",
      connector: reg({
        base: "Those two refusals aren't quirks. They fall straight out of how each container is built underneath.",
        rigorous: "Two containers, two contracts: a set is a hash table keys-only; a tuple is an immutable fixed-arity record. Start with the model.",
      }),
      actionLabel: "What's the cost?",
      takeaway: reg({
        base: "A set is a hash map's keys (one-hop lookup); a tuple is an ordered, locked packet.",
        intuitive: "A set is a hash map keeping only the names; a tuple is a packet locked at birth.",
        rigorous: "Set = hash-table keys (dedup by addressing); tuple = immutable record, hence hashable.",
      }),
      visual: <BucketsVisual />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The structures",
        title: reg({
          base: "A set is a hash map's keys. A tuple is a fixed packet.",
          rigorous: "Set = hash table, keys only. Tuple = immutable record.",
        }),
        body: reg({
          base: <>A <strong>hash map</strong> jumps straight to any item by its name (its &ldquo;key&rdquo;) in one step. A set is a hash map keeping only keys: &ldquo;is x in the set?&rdquo; is one such jump, and re-adding x does nothing. A tuple is the opposite: a fixed packet where slot 0 is <em>always</em> the date.</>,
          intuitive: <>Picture numbered cubbies. A quick bit of math on a name &mdash; its <em>hash</em> &mdash; says exactly which cubby it lives in, so &ldquo;is alice here?&rdquo; is one hop, never a search. A <strong>set</strong> is that filing system keeping only the names. A <strong>tuple</strong> is the opposite kind of container: a packet whose slots are locked, where slot 0 is <em>always</em> the date.</>,
          rigorous: <>A set is a hash table storing keys only: membership hashes the value and probes its bucket in one expected probe, exactly a <code>dict</code> lookup; re-inserting an equal element lands in the occupied bucket and is a no-op. A tuple is an immutable fixed-arity sequence: position carries meaning, contents are frozen at construction, and that freeze is what makes it hashable.</>,
        }),
      }],
      detail: reg({
        rigorous: (
          <>
            <p><strong>Set.</strong> A hash table with the value column deleted: insert hashes the element to a bucket; a second insert of an equal element resolves to the same bucket, finds it occupied, does nothing. The invariant, at most one copy of any element, is enforced by the addressing itself, not by a scan. No order and no index are exposed; the structure answers one question, membership.</p>
            <p><strong>Tuple.</strong> A fixed-arity sequence frozen at construction: no slot can be rebound, none added or dropped. Frozen contents mean a hash that is stable for the object&rsquo;s lifetime, precisely the property a hash table demands of its keys, so tuples qualify as set members and <code>dict</code> keys. Mutability and hashability exclude each other: the <code>list</code> sits on the mutable side, the tuple on the other.</p>
          </>
        ),
        base: (
        <>
          <p>A <strong>hash map</strong> is a container with numbered cubbies, where a quick bit of math on a value (its <em>hash</em>) tells you exactly which cubby it lives in, so you can jump straight to it in one step instead of searching. The value you look things up by is called its <strong>key</strong>.</p>
          <p>A <strong>set</strong> is just a hash map that kept only the keys and threw away everything else. &ldquo;Is x in the set?&rdquo; is one of those one-step jumps to a cubby. And adding the same value twice changes nothing: the cubby it lands in already holds it. <em>That</em> is why the set shrugged at the duplicate.</p>
          <p>A <strong>tuple</strong> is the opposite kind of container: an ordered, fixed-size packet that can&rsquo;t be changed after you build it. The slots are positional: slot 0 is <em>always</em> the date, slot 1 <em>always</em> the latitude. You can&rsquo;t edit a slot and you can&rsquo;t add a fourth. <em>That</em> is why poking the packet failed.</p>
        </>
        ),
      }),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 200 }],
      codeLabels: ["set_def", "set_add_dup", "tuple_def"],
    },
    {
      id: "operations",
      label: "The operations",
      connector: reg({
        base: "Once you know a set is hash-cubbies and a tuple is a locked packet, the speed of every move on them follows for free.",
        rigorous: "The model fixes every cost. Commit to one before the price list lands.",
      }),
      actionLabel: reg({
        base: "When each fits",
        structured: "Name them",
        rigorous: "Name them",
      }),
      takeaway: reg({
        base: "Set add/in/remove are O(1); a tuple's fixed shape lets it live inside a set or as a key.",
        intuitive: "Set add/check/remove are one hop at any size; a locked tuple can live inside a set.",
        rigorous: "Set add/in/discard: O(1) expected; immutability is what makes a tuple a legal key.",
      }),
      visual: (api) => <MembershipCostGate api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The operations", title: "Sets are hash-fast. Tuples are basically free.",
        body: reg({
          base: <>Set: add, remove, and &ldquo;in&rdquo; each cost <Term word="O(1)"><code>O(1)</code></Term>, the same time however big it grows. Combining two has its own cost: overlap (intersection) is <code>O(min(|A|,|B|))</code>, merge (union) is <code>O(|A|+|B|)</code>, leftovers (difference) is <code>O(|A|)</code>. Tuple: grab any slot instantly, read all <code>n</code> items in <code>O(n)</code>. Being unchangeable lets a tuple live inside a set; a list can&rsquo;t.</>,
          intuitive: <>Predict it first, then check. Set moves (add, remove, &ldquo;in?&rdquo;) are each one hop to a cubby, the same hop at any size; that flat cost is written <Term word="O(1)"><code>O(1)</code></Term>. Combining two sets visits members one by one: the overlap walks the smaller set, the merge touches both. The tuple: grab a slot instantly, read it all one value at a time. And because it can never change, a tuple may live <em>inside</em> a set.</>,
          rigorous: <>Expected costs: <code>add</code> / <code>discard</code> / <code>in</code> hash once and probe one bucket, <Term word="O(1)"><code>O(1)</code></Term> average. Intersection scans the smaller side: <Term word="O(min(|A|,|B|))"><code>O(min(|A|,|B|))</code></Term>; union touches both: <Term word="O(|A|+|B|)"><code>O(|A|+|B|)</code></Term>; difference scans the left: <Term word="O(|A|)"><code>O(|A|)</code></Term>. Tuple: index <Term word="O(1)"><code>O(1)</code></Term>, full scan <Term word="O(n)"><code>O(n)</code></Term>, no write path, so the stable hash is what licenses tuple-as-key.</>,
        }),
      }],
      detail: reg({
        intuitive: (
          <>
            <p><strong>Set.</strong> Count the work instead of taking it on faith: adding a name, removing one, asking &ldquo;is alice in?&rdquo; is each a hash and one look into one cubby. One hop in a set of five; one hop in a set of five million; and an empty set answers &ldquo;no&rdquo; just as fast. Work that stays flat like that is written <Term word="O(1)"><code>O(1)</code></Term>.</p>
            <p>Combining two sets costs real steps, because members get visited one by one: the <em>overlap</em> (in both) walks the smaller set and looks each member up in the bigger one, <Term word="O(min(|A|,|B|))"><code>O(min(|A|,|B|))</code></Term>; the <em>merge</em> (in either) touches every member of both, <Term word="O(|A|+|B|)"><code>O(|A|+|B|)</code></Term>; the <em>leftovers</em> (in the first but not the second) walk just the first, <Term word="O(|A|)"><code>O(|A|)</code></Term>. And a set has no slot numbers: no <code>set[0]</code>, and no promised order when you read it back.</p>
            <p><strong>Tuple.</strong> Grab any slot by position in one step; read the whole packet front to back in <Term word="O(n)"><code>O(n)</code></Term>, one look per value. There&rsquo;s no way to change it, and that&rsquo;s the payoff: a thing that can never change is safe to drop <em>inside</em> a set, or to use as a <Term word="hash map">hash map</Term>&rsquo;s key, since its cubby never moves. One small trap: a one-value tuple needs its comma, <code>(5,)</code>, or Python just sees a number in parentheses.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact costs.</strong> <code>add</code>, <code>discard</code>, <code>in</code>: expected <Term word="O(1)"><code>O(1)</code></Term>, one hash, one bucket probe; degenerate worst case <Term word="O(n)"><code>O(n)</code></Term> when collisions stack a single bucket. Intersection iterates the smaller set and probes the larger: <Term word="O(min(|A|,|B|))"><code>O(min(|A|,|B|))</code></Term>. Union builds from both: <Term word="O(|A|+|B|)"><code>O(|A|+|B|)</code></Term>. Difference scans the left operand: <Term word="O(|A|)"><code>O(|A|)</code></Term>. Tuple: index <Term word="O(1)"><code>O(1)</code></Term>, scan <Term word="O(n)"><code>O(n)</code></Term>, no mutation, so its hash is stable, which is what admits it as a set member or <code>dict</code> key.</p>
            <p><strong>Edges.</strong> The empty set answers any membership probe False in one hash. <code>discard</code> of an absent element is a no-op; <code>remove</code> raises <code>KeyError</code>. Sets expose no order and no indexing: iteration order is an implementation detail, never a contract. <code>(5,)</code> is a tuple; <code>(5)</code> is an int. And hashability is shallow: a tuple is hashable only if every element is, so <code>(&quot;a&quot;, [1, 2])</code> fails as a set member with <code>TypeError</code>. When the work is membership at scale, this beat is the whole choice: reach for the set on &ldquo;contained? unique? shared?&rdquo;, the tuple when k values form one immutable record.</p>
          </>
        ),
        base: (
        <>
          <p><strong>Set.</strong> Adding, removing, and asking &ldquo;is x in here?&rdquo; (the <code>in</code> check) all cost <code>O(1)</code> on average: &ldquo;order 1&rdquo;, meaning the time stays roughly the same no matter how many items the set holds, because you jump straight to the right cubby. Combining two sets has a cost that depends on which combination: the <em>overlap</em> (items in both) is <code>O(min(|A|,|B|))</code>, where you only scan the smaller set; the <em>merge</em> (items in either) is <code>O(|A|+|B|)</code>, touching every item in both; the <em>leftovers</em> (in one but not the other) is <code>O(|A|)</code>, scanning just the first set. There&rsquo;s no order and no <code>set[i]</code>, since cubbies aren&rsquo;t numbered for you.</p>
          <p><strong>Tuple.</strong> Grabbing any slot by its position is <code>O(1)</code>, instant. Reading all of it from front to back is <code>O(n)</code> (&ldquo;order n&rdquo;: cost grows in step with the number of items <code>n</code>). And there&rsquo;s no way to change a tuple at all.</p>
          <p>That last point is the quiet payoff: because a tuple can never change, it&rsquo;s safe to use it as a <strong>key in a hash map</strong> or as a <strong>member of a set</strong>, since its cubby will never move. A list, which can change at any moment, can&rsquo;t be trusted that way.</p>
          <p><strong>Two edges that bite.</strong> A one-value tuple needs a trailing comma &mdash; <code>(5,)</code> &mdash; because <code>(5)</code> is just the number 5 in parentheses. And the <code>O(1)</code> figures are averages: in the rare worst case where many values land in the same cubby, a set check can degrade toward <Term word="O(n)"><code>O(n)</code></Term>.</p>
        </>
        ),
      }),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 186 }],
      codeLabels: ["set_ops", "tuple_immutable", "tuple_key"],
      interaction: "wedge",
    },
    {
      id: "fit",
      label: "When they fit",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "With the costs settled, the choice between them stops being about syntax and becomes about the question you're asking.",
      actionLabel: "Name them",
      takeaway: "Use a set for “is X here? / unique?”; use a tuple when several values are one fixed thing.",
      visual: <FitVisual />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "When they fit", title: "Set for “is X here?”. Tuple for “X, Y, Z stay together.”",
        body: <>Reach for a set whenever you&rsquo;d ask &ldquo;contains? unique? in both? in one but not the other?&rdquo;: online users, seen URLs, allow-lists. Reach for a tuple when several values describe one thing whose shape never changes, and you pull the pieces back out by position: <code>date, lat, temp = reading</code>.</>,
      }],
      detail: (
        <>
          <p>Reach for a <strong>set</strong> the moment your question sounds like &ldquo;does this contain x?&rdquo;, &ldquo;are these all unique?&rdquo;, &ldquo;what&rsquo;s in both?&rdquo;, or &ldquo;what&rsquo;s in one but not the other?&rdquo;. Real examples: the set of users currently online, the set of URLs a crawler has already seen, the set of places already visited, an allow-list of permitted accounts.</p>
          <p>Reach for a <strong>tuple</strong> when several values together describe <em>one thing</em> and that shape never changes:</p>
          <ul>
            <li><code>(x, y)</code>: a point on a map</li>
            <li><code>(row, col)</code>: a spot in a grid</li>
            <li><code>(date, lat, temp)</code>: a single weather reading</li>
          </ul>
          <p>And because the shape is fixed, you can pull the pieces straight back out by position in one line &mdash; <code>date, lat, temp = reading</code> &mdash; which is also how a function hands back several results at once.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 178 }],
      codeLabels: ["set_in", "tuple_unpack"],
    },
    {
      id: "name",
      label: "Set and Tuple",
      connector: reg({
        base: "Now that you know exactly when to grab each one, give the two tools their names, and the deeper move they share.",
        intuitive: "Two tools, two refusals, two jobs. Time to give them their names, and the deeper move they share.",
        structured: "The costs are settled. Give the two tools their names, and the deeper move they share.",
        rigorous: "Name them, and file the deal they share.",
      }),
      takeaway: reg({
        base: "Set {…} and tuple (…): both declare intent. A list stays silent about what the data is for.",
        intuitive: "A set says “membership matters”; a tuple says “these are one thing.” Lists say nothing.",
        rigorous: "Set = hashed membership, tuple = immutable record: intent a plain list never declares.",
      }),
      visual: <NameVisual />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The structures", title: "Set and Tuple.",
        body: reg({
          base: <>That&rsquo;s the name. Python writes a set with curly braces <code>{"{1, 2, 3}"}</code> and a tuple with parentheses <code>(1, 2, 3)</code>. The deeper move both make: they <em>say what the data is for</em>. A list stays silent. A set says &ldquo;membership matters.&rdquo; A tuple says &ldquo;these are one thing.&rdquo;</>,
          intuitive: <>That&rsquo;s their names. Python writes a set with curly braces <code>{"{1, 2, 3}"}</code> and a tuple with parentheses <code>(1, 2, 3)</code>. And both say out loud what the data is for: a set says &ldquo;membership matters,&rdquo; a tuple says &ldquo;these belong together as one thing.&rdquo; A plain list says nothing.</>,
          rigorous: <>Set: <code>{"{1, 2, 3}"}</code>, the hash-table membership structure. Tuple: <code>(1, 2, 3)</code>, the immutable record. Each narrows a <code>list</code>&rsquo;s contract on purpose, and the narrowing is itself documentation: membership matters, or these values are one thing.</>,
        }),
      }],
      detail: reg({
        intuitive: (
          <>
            <p>That&rsquo;s their names. In Python a <strong>set</strong> is written with curly braces, <code>{"{1, 2, 3}"}</code>, and a <strong>tuple</strong> with parentheses, <code>(1, 2, 3)</code>. Tiny to write, but they pull their weight.</p>
            <p>And they say what you <em>mean</em>. A plain list could be anything. A set announces &ldquo;membership is the point here.&rdquo; A tuple announces &ldquo;these values are one fixed thing.&rdquo; Picking the right container tells the next reader (including future you) what the data is for.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The big idea (5 of 7), trade space for time:</strong> the set spends memory on cubbies so &ldquo;is alice here?&rdquo; is one hop in a set of five or five million, the hash map&rsquo;s deal, kept just for the question &ldquo;in or out?&rdquo;
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>Set: <code>{"{…}"}</code> literal, <code>set()</code> for empty (<code>{"{}"}</code> is a dict). Tuple: <code>(…)</code>, arity fixed, contents frozen: the only built-in sequence admissible as a <code>dict</code> key or set member. Both narrow a list&rsquo;s contract deliberately; the narrowing is the documentation.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 5 of 7, trade space for time:</strong> spend memory on a hash table and membership is O(1) expected at any n, the hash-map deal reduced to its purest form.
            </div>
          </>
        ),
        base: (
        <>
          <p>That&rsquo;s the name. In Python you write a <strong>set</strong> with curly braces, <code>{"{1, 2, 3}"}</code>, and a <strong>tuple</strong> with parentheses, <code>(1, 2, 3)</code>. They look tiny, but they pull their weight.</p>
          <p>The deeper move both of them make: they <em>say what the data is for</em>. A plain list is so flexible that it stays silent about your intent; it could be anything. A set announces &ldquo;membership is what matters here.&rdquo; A tuple announces &ldquo;these values are one fixed thing.&rdquo; Choosing the right container is half about speed and half about telling the next reader (including future you) what you meant.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>Idea 5 of 7, trade space for time:</strong> the set pays memory for hash cubbies so &ldquo;is it here?&rdquo; costs the same at any size, the hash map&rsquo;s deal, stripped to membership.
          </div>
        </>
        ),
      }),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 188 }],
      codeLabels: ["set_def", "tuple_def"],
    },
  ],
};
