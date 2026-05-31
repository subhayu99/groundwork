"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Arrow } from "@/shared/lesson/canvas";
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
      <SetPills members={members} y={188} tones={tones} onClick={(i) => addName(members[i])} enabled label="set · unique members" />

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
        style={{ fontSize: 11, fill: "var(--diff-easy)" }}>add O(1) · in O(1) · combine ≈ size of the smaller set</text>
      <text x={VW / 2} y={268} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 9, fill: "var(--text-faint)" }}>overlap = in both · merge = in either · leftovers = in one not the other</text>
      <g transform="translate(0,18)">
        <TupleRow tones={TUPLE.map(() => "accent" as Tone)} />
      </g>
      <text x={VW / 2} y={TG.y + TG.cellH + 56} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--diff-easy)" }}>slot i → O(1) · read all → O(n) · being fixed lets a tuple live inside a set</text>
    </g>
  );
}

function FitVisual() {
  return (
    <g>
      <SetPills members={["alice", "bob"]} y={196} label="set" />
      <text x={VW / 2} y={250} textAnchor="middle" className="font-mono select-none"
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

export const setsTuplesLesson: LessonSpec = {
  topicTitle: "sets & tuples · membership vs. one fixed packet",
  canvas: { width: VW, height: VH },
  codeSource: setsTuplesPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "I have the question",
      visual: <SetupVisual />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The setup", title: "Two small containers. Two different jobs.",
        body: <>Tonight you track who&rsquo;s in a chat room &mdash; you only care &ldquo;is alice here, yes or no?&rdquo;, not when she arrived. Down the hall, weather arrives as one packet: <code>(date, latitude, temperature)</code>. Both are containers, but with opposite rules.</>,
      }],
      detail: (
        <>
          <p>Tonight you&rsquo;re tracking who&rsquo;s logged into a chat room. You don&rsquo;t care <em>when</em> they arrived, and you don&rsquo;t want to count the same person twice if they log in again. You only care about one thing: <em>is alice in the room, or not?</em></p>
          <p>Down the hall, someone is logging weather readings. Each one is <code>(date, latitude, temperature)</code> &mdash; three values that belong together as a single packet. You&rsquo;d never sneak in a fourth value, and you&rsquo;d never swap out the second.</p>
          <p>Both of these are <strong>containers</strong> (things that hold a bunch of values), but the rules they live by are opposite. One cares about <em>membership</em>; the other cares about <em>keeping a fixed shape</em>.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 188 }],
      codeLabels: ["set_def", "tuple_def"],
    },
    {
      id: "scan",
      label: "The obvious thing",
      connector: "Before reaching for anything special — what happens if you just throw both jobs into a plain list?",
      actionLabel: "What do these need?",
      visual: (api) => <ScanPlayback api={api} />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The obvious thing", title: "Stuff a list. Scan when you need it.",
        body: <>The easy move: keep everyone in a plain list. To check for alice you scan chip after chip until you hit her or run out &mdash; slow if the list is long. And nothing stops a second &ldquo;alice&rdquo; sneaking in. It works, but it doesn&rsquo;t fit.</>,
      }],
      detail: (
        <>
          <p>You could just keep a plain <strong>list</strong> of everyone logged in (a list is an ordered row of values). To check whether alice is there, you walk along the chips one at a time until you find her or run off the end. If five people are online that&rsquo;s fine; if a million are online, you might check nearly a million chips. That cost is <code>O(n)</code> (&ldquo;order n&rdquo; &mdash; the work grows in step with the number of items <code>n</code>).</p>
          <p>A list has another gap for this job: nothing stops a second &ldquo;alice&rdquo; from sneaking in. The list happily holds duplicates, even though for a chat room a person is either present or not.</p>
          <p>You could also stuff the weather reading into a list and grab values by position 0, 1, 2 &mdash; but a future you might forget which slot is the latitude, and nothing stops the list from growing a fourth slot. Both setups <em>work</em>; neither is doing what the data actually wants.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 208 }],
      codeLabels: [],
      interaction: "playback",
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "The list shrugged at duplicates and let the packet grow — so watch what these two purpose-built containers do instead when you push on them.",
      actionLabel: "Identity vs grouping",
      visual: (api) => <AddNameWedge api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Add a name twice. Then poke the packet.",
          body: <>Add a name to the set, then add one already in &mdash; it shrugs: no &ldquo;second alice.&rdquo; Now poke the packet: change a slot or add a fourth. Both refuse &mdash; a tuple is <em>immutable</em> (can&rsquo;t change once made).</>,
        },
        {
          left: 648, top: 372, width: 200, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> what does each container&rsquo;s <em>refusal</em> tell you it&rsquo;s for?</>,
        },
      ],
      detail: (
        <>
          <p>On the canvas is a small <strong>set</strong>. Add a name, then add one that&rsquo;s already in there. The set doesn&rsquo;t care &mdash; a name is either in or out, full stop. There&rsquo;s no order, no count, no &ldquo;second alice.&rdquo; That refusal to keep duplicates is the whole point of a set.</p>
          <p>Below it is a <strong>tuple</strong> &mdash; the fixed weather packet. Try to change a slot, or try to add a fourth value. Both attempts fail. The tuple is <em>immutable</em> (a fancy word meaning &ldquo;can&rsquo;t be changed once it&rsquo;s made&rdquo;): its shape is locked the instant you create it.</p>
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
      connector: "Those two refusals aren't quirks — they fall straight out of how each container is built underneath.",
      actionLabel: "What's the cost?",
      visual: <BucketsVisual />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The structures", title: "A set is a hash map's keys. A tuple is a fixed packet.",
        body: <>A <strong>hash map</strong> jumps straight to any item by its name (its &ldquo;key&rdquo;) in one step. A set is a hash map keeping only keys: &ldquo;is x in the set?&rdquo; is one such jump, and re-adding x does nothing. A tuple is the opposite &mdash; a fixed packet where slot 0 is <em>always</em> the date.</>,
      }],
      detail: (
        <>
          <p>A <strong>hash map</strong> is a container with numbered cubbies, where a quick bit of math on a value (its <em>hash</em>) tells you exactly which cubby it lives in &mdash; so you can jump straight to it in one step instead of searching. The value you look things up by is called its <strong>key</strong>.</p>
          <p>A <strong>set</strong> is just a hash map that kept only the keys and threw away everything else. &ldquo;Is x in the set?&rdquo; is one of those one-step jumps to a cubby. And adding the same value twice changes nothing &mdash; the cubby it lands in already holds it. <em>That</em> is why the set shrugged at the duplicate.</p>
          <p>A <strong>tuple</strong> is the opposite kind of container: an ordered, fixed-size packet that can&rsquo;t be changed after you build it. The slots are positional &mdash; slot 0 is <em>always</em> the date, slot 1 <em>always</em> the latitude. You can&rsquo;t edit a slot and you can&rsquo;t add a fourth. <em>That</em> is why poking the packet failed.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 200 }],
      codeLabels: ["set_def", "set_add_dup", "tuple_def"],
    },
    {
      id: "operations",
      label: "The operations",
      connector: "Once you know a set is hash-cubbies and a tuple is a locked packet, the speed of every move on them follows for free.",
      actionLabel: "When each fits",
      visual: <OpsVisual />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "The operations", title: "Sets are hash-fast. Tuples are basically free.",
        body: <>Set: add, remove, and &ldquo;in&rdquo; each cost <code>O(1)</code> &mdash; same time however big it grows; combining two costs about the smaller one. Tuple: grab any slot instantly, read all <code>n</code> items in <code>O(n)</code>. Being unchangeable lets a tuple live inside a set; a list can&rsquo;t.</>,
      }],
      detail: (
        <>
          <p><strong>Set.</strong> Adding, removing, and asking &ldquo;is x in here?&rdquo; (the <code>in</code> check) all cost <code>O(1)</code> on average &mdash; &ldquo;order 1&rdquo;, meaning the time stays roughly the same no matter how many items the set holds, because you jump straight to the right cubby. Combining two sets &mdash; their <em>overlap</em> (items in both), <em>merge</em> (items in either), or <em>leftovers</em> (in one but not the other) &mdash; costs about the size of the smaller set. There&rsquo;s no order and no <code>set[i]</code>, since cubbies aren&rsquo;t numbered for you.</p>
          <p><strong>Tuple.</strong> Grabbing any slot by its position is <code>O(1)</code> &mdash; instant. Reading all of it from front to back is <code>O(n)</code> (&ldquo;order n&rdquo; &mdash; cost grows in step with the number of items <code>n</code>). And there&rsquo;s no way to change a tuple at all.</p>
          <p>That last point is the quiet payoff: because a tuple can never change, it&rsquo;s safe to use it as a <strong>key in a hash map</strong> or as a <strong>member of a set</strong> &mdash; its cubby will never move. A list, which can change at any moment, can&rsquo;t be trusted that way.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 186 }],
      codeLabels: ["set_ops", "tuple_immutable", "tuple_key"],
    },
    {
      id: "fit",
      label: "When they fit",
      connector: "With the costs settled, the choice between them stops being about syntax and becomes about the question you're asking.",
      actionLabel: "Name them",
      visual: <FitVisual />,
      panels: [{
        left: 150, top: 22, width: 580, variant: "main", label: "When they fit", title: "Set for “is X here?”. Tuple for “X, Y, Z stay together.”",
        body: <>Reach for a set whenever you&rsquo;d ask &ldquo;contains? unique? in both? in one but not the other?&rdquo; &mdash; online users, seen URLs, allow-lists. Reach for a tuple when several values describe one thing whose shape never changes, and you pull the pieces back out by position: <code>date, lat, temp = reading</code>.</>,
      }],
      detail: (
        <>
          <p>Reach for a <strong>set</strong> the moment your question sounds like &ldquo;does this contain x?&rdquo;, &ldquo;are these all unique?&rdquo;, &ldquo;what&rsquo;s in both?&rdquo;, or &ldquo;what&rsquo;s in one but not the other?&rdquo;. Real examples: the set of users currently online, the set of URLs a crawler has already seen, the set of places already visited, an allow-list of permitted accounts.</p>
          <p>Reach for a <strong>tuple</strong> when several values together describe <em>one thing</em> and that shape never changes:</p>
          <ul>
            <li><code>(x, y)</code> &mdash; a point on a map</li>
            <li><code>(row, col)</code> &mdash; a spot in a grid</li>
            <li><code>(date, lat, temp)</code> &mdash; a single weather reading</li>
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
      connector: "Now that you know exactly when to grab each one, give the two tools their names — and the deeper move they share.",
      visual: <NameVisual />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The structures", title: "Set and Tuple.",
        body: <>That&rsquo;s the name. Python writes a set with curly braces <code>{"{1, 2, 3}"}</code> and a tuple with parentheses <code>(1, 2, 3)</code>. The deeper move both make: they <em>say what the data is for</em>. A list stays silent. A set says &ldquo;membership matters.&rdquo; A tuple says &ldquo;these are one thing.&rdquo;</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name. In Python you write a <strong>set</strong> with curly braces &mdash; <code>{"{1, 2, 3}"}</code> &mdash; and a <strong>tuple</strong> with parentheses &mdash; <code>(1, 2, 3)</code>. They look tiny, but they pull their weight.</p>
          <p>The deeper move both of them make: they <em>say what the data is for</em>. A plain list is so flexible that it stays silent about your intent &mdash; it could be anything. A set announces &ldquo;membership is what matters here.&rdquo; A tuple announces &ldquo;these values are one fixed thing.&rdquo; Choosing the right container is half about speed and half about telling the next reader &mdash; including future you &mdash; what you meant.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 188 }],
      codeLabels: ["set_def", "tuple_def"],
    },
  ],
};
