"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, Pill, rowGeom } from "@/shared/lesson/canvas";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import stringsPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const VW = 860, VH = 470;

/* The running sentence (spaces drawn as a faint dot) and the word we hunt for. */
const SENTENCE = "the quick brown fox"; // 19 chars, indices 0–18
const PATTERN = "brown";                // 5 chars, starts at index 10
const CHARS = Array.from(SENTENCE).map((c) => (c === " " ? "·" : c));
const PAT_LEN = PATTERN.length;
const MAX_START = SENTENCE.length - PAT_LEN; // 14

/* 19 cells must fit inside 860px: 19*34 + 18*4 = 718. */
const G = rowGeom(SENTENCE.length, VW, 250, 34, 4, 40);

/* The short "hello" string for the immutability beats. */
const HELLO = "hello";
const H = rowGeom(HELLO.length, VW, 252, 46, 8, 46);

/* candidate window [start, start+PAT_LEN) matches the pattern? */
const sliceAt = (start: number) => SENTENCE.slice(start, start + PAT_LEN);

/* ── interactive WEDGE: drag the highlight, read what's underneath ─────────── */
function SlideTheWindow({ api }: { api: BeatVisualApi }) {
  const [start, setStart] = useState(0);
  const candidate = sliceAt(start);
  const matched = candidate === PATTERN;

  const move = (v: number) => {
    const ns = Math.max(0, Math.min(MAX_START, v));
    setStart(ns);
    api.onInteractionDone();
    // Sliding re-slices the candidate, then compares it.
    api.onActiveLine(sliceAt(ns) === PATTERN ? ["slice", "find"] : ["slice"]);
  };

  const tones: (Tone | undefined)[] = CHARS.map((_, i) => {
    const inWin = i >= start && i < start + PAT_LEN;
    if (!inWin) return undefined;
    return matched ? "good" : "active";
  });

  // slider track geometry, well below the row so nothing overlaps
  const trackY = G.y + G.cellH + 52, trackX0 = G.left(0), trackW = G.left(SENTENCE.length - 1) + G.cellW - G.left(0);
  const knobX = trackX0 + (MAX_START === 0 ? 0 : (start / MAX_START)) * trackW;

  return (
    <g>
      <CellRow geom={G} values={CHARS} tones={tones} showIndex />
      <text x={VW / 2} y={G.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: matched ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {`s[${start}:${start + PAT_LEN}] = "${candidate}"${matched ? '  = "brown" ✓' : ""}`}
      </text>

      {/* drag slider */}
      <line x1={trackX0} y1={trackY} x2={trackX0 + trackW} y2={trackY} stroke="var(--line)" strokeWidth={4} strokeLinecap="round" />
      <line x1={trackX0} y1={trackY} x2={knobX} y2={trackY} stroke="var(--accent-line)" strokeWidth={4} strokeLinecap="round" />
      {Array.from({ length: MAX_START + 1 }, (_, v) => {
        const cxv = trackX0 + (MAX_START === 0 ? 0 : (v / MAX_START)) * trackW;
        return (
          <g key={v} onClick={() => move(v)} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={`start ${v}`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); move(v); } }}>
            <circle cx={cxv} cy={trackY} r={9} fill="transparent" />
            <circle cx={cxv} cy={trackY} r={3} fill="var(--text-faint)" />
          </g>
        );
      })}
      <circle cx={knobX} cy={trackY} r={8} fill="var(--accent)" stroke="var(--bg-card)" strokeWidth={2} style={{ pointerEvents: "none" }} />
      <text x={trackX0 + trackW / 2} y={trackY + 24} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text-faint)" }}>
        drag the start box
      </text>
    </g>
  );
}

/* ── PLAYBACK: the naive scan slides the window itself, counting compares ──── */
interface Scan { start: number; comparisons: number; done: boolean; found: boolean; }
function AutoScan({ api }: { api: BeatVisualApi }) {
  const init = (): Scan => ({ start: 0, comparisons: 0, done: false, found: false });
  const [s, setS] = useState<Scan>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      // count how many chars of the candidate match before a mismatch
      let m = 0;
      for (let i = 0; i < PAT_LEN; i++) { m += 1; if (SENTENCE[c.start + i] !== PATTERN[i]) break; }
      if (m === PAT_LEN) { api.onActiveLine(["find"]); setS({ ...c, comparisons: c.comparisons + m, done: true, found: true }); return; }
      if (c.start >= MAX_START) { api.onActiveLine(["find"]); setS({ ...c, comparisons: c.comparisons + m, done: true }); return; }
      api.onActiveLine(["find"]);
      setS({ ...c, comparisons: c.comparisons + m, start: c.start + 1 });
    }, pace(650));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { start, comparisons, done, found } = s;
  const tones: (Tone | undefined)[] = CHARS.map((_, i) => {
    const inWin = i >= start && i < start + PAT_LEN;
    if (!inWin) return i < start ? "visited" : undefined;
    return found ? "good" : "active";
  });

  return (
    <g>
      <CellRow geom={G} values={CHARS} tones={tones} showIndex />
      <text x={VW / 2} y={G.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: found ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {found ? `found "brown" at index ${start}  ·  ${comparisons} comparisons` : `start = ${start}  ·  comparisons so far: ${comparisons}`}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={G.y + G.cellH + 36} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 48} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── PLAYBACK: immutability — every edit allocates a fresh string ──────────── */
interface Edit { chars: string[]; copied: number; flash: number | null; step: number; }
function AutoImmutable({ api }: { api: BeatVisualApi }) {
  const init = (): Edit => ({ chars: Array.from(HELLO), copied: 0, flash: null, step: 0 });
  const [s, setS] = useState<Edit>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.step >= 3) return;
      if (c.step === 0) {
        // replace s[0] with 'H' → builds a new string
        const next = [...c.chars]; next[0] = "H";
        api.onActiveLine(["rebuild"]);
        setS({ chars: next, copied: c.copied + c.chars.length, flash: 0, step: 1 });
      } else if (c.step === 1) {
        // append '!' → concatenation, new string of length n+1
        const next = [...c.chars, "!"];
        api.onActiveLine(["concat"]);
        setS({ chars: next, copied: c.copied + c.chars.length + 1, flash: c.chars.length, step: 2 });
      } else {
        // append '!' again — the cost keeps climbing
        const next = [...c.chars, "!"];
        api.onActiveLine(["concat"]);
        setS({ chars: next, copied: c.copied + c.chars.length + 1, flash: c.chars.length, step: 3 });
      }
    }, pace(1100));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { chars, copied, flash } = s;
  const geom = rowGeom(chars.length, VW, 252, 46, 8, 46);
  const tones: (Tone | undefined)[] = chars.map((_, i) => (i === flash ? "active" : i === 0 ? "muted" : undefined));

  return (
    <g>
      <CellRow geom={geom} values={chars} tones={tones} showIndex />
      <text x={VW / 2} y={geom.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        every edit builds a NEW string
      </text>
      <text x={VW / 2} y={geom.y + geom.cellH + 40} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--diff-med)" }}>
        characters copied so far: {copied}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={geom.y + geom.cellH + 56} width={60} height={24} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={geom.y + geom.cellH + 68} textAnchor="middle" dominantBaseline="central" className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static visuals ────────────────────────────────────────────────────────── */
const idleRow = (tones?: (Tone | undefined)[], markers?: Record<number, string>) => (
  <CellRow geom={G} values={CHARS} tones={tones} markers={markers} showIndex />
);

/* ── PREDICTION GATE on "hello": commit to what s[0] = 'H' does BEFORE the
 * lock lands. Strings have behaved exactly like arrays up to this beat, so the
 * honest guess is "the write works" — the refusal IS the lesson's twist, which
 * is why the lock pill and the refusal caption stay hidden until the tap (the
 * tap-conditional reveal, per the variables exemplar). One pill tap is the real
 * interaction (fires api.onInteractionDone() inside PredictGate, satisfying
 * interaction: "wedge"). HTML hosted on the canvas via <foreignObject>;
 * data-canvas-panel opts it into the scene layout's content-extent measurement. */
function LockedFirstGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const tones: (Tone | undefined)[] = Array.from(HELLO).map((_, i) => (i === 0 ? "muted" : undefined));
  return (
    <g>
      <CellRow geom={H} values={Array.from(HELLO)} tones={tones} showIndex />
      {revealed && (
        <g>
          <Pill x={H.left(0) - 50} y={H.y + H.cellH / 2 - 8} text="🔒 locked" />
          <text x={VW / 2} y={H.y - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>
            s[0] = &apos;H&apos; is not allowed — strings are immutable
          </text>
        </g>
      )}
      <foreignObject x={190} y={H.y + H.cellH + 26} width={480} height={170} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question="This string has acted like an array so far — what does s[0] = 'H' do?"
            choices={[
              { id: "writes", label: "replaces the first letter, in place", note: "an array would allow it — but a string's cells are sealed the moment it's made" },
              { id: "refused", label: "refused — the program raises an error", correct: true, note: "strings are locked at birth — to change one, you build a new string" },
              { id: "copies", label: "quietly hands back an edited copy", note: "nothing happens quietly — the write is refused, and building the new string is your job" },
            ]}
            onRevealed={() => setRevealed(true)}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* a gallery of real-world strings, each a tiny character strip */
function StringGallery() {
  const rows = [
    { label: "URL", text: "groundwork.io" },
    { label: "email", text: "you@site.com" },
    { label: "JSON key", text: "\"name\"" },
    { label: "log line", text: "ERR 404" },
  ];
  const cw = 20, gap = 3, y0 = 202, rowH = 56;
  const widest = Math.max(...rows.map((r) => Array.from(r.text).length));
  const stripX = VW / 2 - (widest * cw + (widest - 1) * gap) / 2;
  return (
    <g>
      {rows.map((r, ri) => {
        const chars = Array.from(r.text);
        const sx = stripX;
        const y = y0 + ri * rowH;
        return (
          <g key={ri}>
            <text x={sx - 14} y={y + cw / 2} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>{r.label}</text>
            {chars.map((ch, i) => {
              const x = sx + i * (cw + gap);
              return (
                <g key={i}>
                  <rect x={x} y={y} width={cw} height={cw} rx={4} fill="color-mix(in oklab, var(--accent-sky) 12%, var(--bg-card))" stroke="var(--accent-line)" strokeWidth={1} />
                  <text x={x + cw / 2} y={y + cw / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--text)" }}>{ch === " " ? "·" : ch}</text>
                </g>
              );
            })}
          </g>
        );
      })}
      <text x={VW / 2} y={y0 + rows.length * rowH + 6} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--diff-easy)" }}>all of these are just strings</text>
    </g>
  );
}

/* the takeaway cost table — dimmed string up top, cost rows in a centered card below */
const CT_ROW = rowGeom(SENTENCE.length, VW, 196, 34, 4, 32);
function CostTable() {
  const rows: [string, string, string][] = [
    ["s[i]", "O(1)", "var(--diff-easy)"],
    ["len(s)", "O(1)", "var(--diff-easy)"],
    ["s[i:j]", "O(j − i)", "var(--diff-med)"],
    ["a + b", "O(n + m)", "var(--diff-med)"],
    ["repeat +=", "way too long", "var(--diff-hard)"],
    ["find word", "scans the text", "var(--diff-med)"],
  ];
  const tableW = 320, x0 = VW / 2 - tableW / 2, y0 = 274, rh = 28;
  return (
    <g>
      <CellRow geom={CT_ROW} values={CHARS} tones={CHARS.map(() => "visited" as Tone)} />
      <rect x={x0 - 18} y={y0 - 22} width={tableW + 36} height={rows.length * rh + 18} rx={10}
        fill="var(--bg-card)" stroke="var(--line)" strokeWidth={1.5} />
      {rows.map((r, i) => {
        const y = y0 + i * rh;
        return (
          <g key={i}>
            <text x={x0} y={y} dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{r[0]}</text>
            <text x={x0 + tableW} y={y} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: r[2] }}>{r[1]}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 7 beats (setup, obvious, wedge, structure, cost, fits, name)
 *   structured : 5 — cuts `obvious` (its 15×5 count folds into the wedge
 *                  connector) and `fits` (the slot-6 generalization)
 *   rigorous   : 3 — `structure` (the model + the immutability invariant, gate
 *                  included) + `cost` (exact costs + edges) + `name` (close).
 *   refresh    : additionally trims `obvious` + `fits` (trimOnRefresh).        */
export const stringsLesson: LessonSpec = {
  topicTitle: "strings · find \"brown\" in a sentence",
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: VH },
  codeSource: stringsPy as string,
  // standing on arrays (TRACK-NARRATIVES row 11): position i costs one step,
  // always — a string is that same row, wearing text's clothes.
  bridgeFrom: reg({
    base: "An array hands you slot i in one step. A string is that same row of slots, wearing text's clothes.",
    intuitive: "You just saw a row of same-size boxes where any spot is one step away. Now the boxes hold letters.",
    rigorous: "arr[i] is O(1) address arithmetic; a string is that contiguous row, with one added invariant.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 11): immutability is an enforced
  // invariant — the SEED of monotonicity-and-invariants, not its proof.
  principle: { key: "monotonicity-and-invariants", n: 3, total: 7 },
  beats: [
    {
      id: "setup",
      label: "The setup",
      registers: ["intuitive", "structured"],
      actionLabel: "I have the question",
      takeaway: "A sentence is one long stream of letters; find the word “brown” in it.",
      visual: idleRow(),
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The setup", title: "Find a word inside a sentence.",
        body: reg({
          base: <>Someone hands you a sentence and asks: &ldquo;Is the word <code>brown</code> in here, and where?&rdquo; You don&rsquo;t see five neat boxes. You see one long stream of letters. So how do you actually go find <code>brown</code> inside it?</>,
          intuitive: <>Here&rsquo;s the sentence, letter by letter, and one question: is the word <code>brown</code> in there, and at which spot? Notice what you&rsquo;re given. Not five neat boxes spelling the word out, just one long stream of letters. How would you hunt it down by hand?</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Someone hands you a sentence (<code>the quick brown fox</code>) and asks a simple question: &ldquo;Is the word <code>brown</code> in here? And if it is, <em>where</em>?&rdquo;</p>
            <p>When you look at the sentence on screen, you don&rsquo;t see five tidy letter-boxes spelling out <code>brown</code>. You see one long, unbroken stream of characters. The word you want is buried somewhere inside it. So the real puzzle is this: starting from that stream, how do you actually go and <em>find</em> the word?</p>
          </>
        ),
        intuitive: (
          <>
            <p>Start with what&rsquo;s actually in front of you: one long row of letters (<code>the quick brown fox</code>) and one question: &ldquo;Is <code>brown</code> in here? And if it is, <em>where</em>?&rdquo;</p>
            <p>The word isn&rsquo;t handed to you in its own five boxes. It&rsquo;s buried somewhere in the stream, and nothing marks where it starts. That&rsquo;s the puzzle, and chasing it is going to show us what text really <em>is</em> underneath.</p>
          </>
        ),
      }),
      codeLabels: ["source"],
    },
    {
      id: "obvious",
      label: "The obvious thing",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Now that we have the question, what's the most direct way to go answer it?",
      actionLabel: "Strings are arrays?",
      takeaway: reg({
        base: "Slide a 5-letter window across, comparing at each spot. Slow, but it works.",
        intuitive: "Checking every starting spot works: 15 starts, about 75 letter-checks for one word.",
      }),
      visual: (api) => <AutoScan api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 580, variant: "main", label: "The obvious thing", title: "Walk it box by box.",
          body: <>Start at box 0. Compare the next five letters to <code>brown</code>. No match? Slide one box right and retry. That&rsquo;s 15 starting spots, about 75 checks. Slow, but it works.</>,
        },
      ],
      detail: (
        <>
          <p>The most direct method: start at position <code>0</code>. Line up the next five letters against <code>brown</code> and compare them. No match? Slide one position to the right and try again. Keep sliding until you either find it or run off the end.</p>
          <p>Let&rsquo;s count the work. The sentence has 19 letters and the word is 5 long, so there are 15 places the word could start. At each spot you compare up to 5 letters, so the worst case is <code>15 &times; 5 = 75</code> comparisons. It&rsquo;s slow, but it genuinely works.</p>
          <p>One thing to notice while it runs: jumping straight to position 10 to start a comparison is no harder than starting at position 0. You can land on <em>any</em> letter in a single step. So reading individual letters isn&rsquo;t the slow part, which hints that text behaves a lot like a plain row of boxes.</p>
        </>
      ),
      arrows: [{ x1: G.cx(2), y1: 150, x2: G.cx(2), y2: G.y - 4 }],
      codeLabels: ["find"],
      interaction: "playback",
    },
    {
      id: "wedge",
      label: "The instinct",
      registers: ["intuitive", "structured"],
      connector: reg({
        base: "If landing on any letter is instant, let's feel that for ourselves: drag the slider under the row and read what's underneath.",
        structured: "The obvious scan slides a 5-letter window along, comparing at each of 15 starts, about 75 checks; it works. The interesting part is what each landing costs: drag the slider and read what's underneath.",
      }),
      actionLabel: "Same machinery, different content",
      takeaway: "Reaching any letter is one instant lookup; text acts just like a row of boxes.",
      visual: (api) => <SlideTheWindow api={api} />,
      panels: [
        {
          left: 24, top: 18, width: 480, variant: "main", label: "The instinct", title: "Drag the highlight. Read underneath.",
          body: reg({
            base: <>Drag the slider to pick a starting box. The five letters under the highlight are your candidate. Slide it across. Landing on box 12 is no harder than box 2: jumping straight to any single letter is one quick, instant lookup.</>,
            intuitive: <>Drag the slider under the row. The five highlighted letters are your candidate, the stretch you&rsquo;d compare to <code>brown</code>. Now feel the cost: landing on box 12 takes exactly as long as box 2. Any letter, one instant look, no counting past the others.</>,
          }),
        },
        {
          left: 540, top: 372, width: 290, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> if reading any letter is instant, what actually makes a string <em>different</em> from a plain row of letter-boxes?</>,
        },
      ],
      detail: reg({
        base: (
          <>
            <p>Drag the slider to choose a starting box. The five highlighted letters are your <strong>candidate</strong>, the stretch you&rsquo;d compare against <code>brown</code> right now. Slide it back and forth across the sentence.</p>
            <p>As you move, notice the cost: hopping all the way to box 12 is no slower than reaching box 2. Reading a single letter is one instant <strong>address lookup</strong>. The computer keeps the letters in a neat numbered row, so &ldquo;give me letter 12&rdquo; goes straight there without counting past the others. That&rsquo;s exactly how a plain array of boxes behaves.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> if reading any letter is instant, what is actually <em>different</em> about a string versus a plain row of character-boxes? Anything at all?
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Drag the slider and watch the highlight jump. Wherever it lands, the five letters underneath are your <strong>candidate</strong>, the stretch you&rsquo;d line up against <code>brown</code> at that spot.</p>
            <p>The thing to feel is the cost. Hopping to box 12 is no slower than hopping to box 2; you never wade through the letters in between. &ldquo;Give me letter 12&rdquo; goes straight to it, one quick step &mdash; exactly like grabbing a numbered slot on last lesson&rsquo;s shelf.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The instinct question:</strong> the letters didn&rsquo;t move and the reading never slowed down, so is a string anything <em>more</em> than a plain row of letter-boxes? Anything at all?
            </div>
          </>
        ),
      }),
      arrows: [{ x1: 560, y1: 150, x2: G.cx(10), y2: G.y - 4 }],
      codeLabels: ["slice", "find"],
      interaction: "wedge",
    },
    {
      id: "structure",
      label: "The structure",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "So the answer to that question is almost “nothing”: a string really is just an array of characters, with one twist.",
        rigorous: "",
      }),
      actionLabel: "What's cheap, what's not?",
      takeaway: reg({
        base: "A string is an array of characters, but immutable: you can’t edit it in place.",
        intuitive: "A string is a row of letter boxes that can never be edited, only rebuilt.",
        rigorous: "A string: char array + enforced immutability, so every edit allocates a copy.",
      }),
      visual: (api) => <LockedFirstGate api={api} />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The structure",
        title: reg({
          base: "A string is an array of characters.",
          rigorous: "An immutable array of characters.",
        }),
        body: reg({
          base: <>That&rsquo;s the secret: boxed letters in order, side by side, so every array move still works. The one twist: a string is <strong>immutable</strong> (can&rsquo;t be changed once made). <code>s[0]=&apos;H&apos;</code> simply isn&rsquo;t allowed; to &ldquo;change&rdquo; it you build a brand-new string.</>,
          intuitive: <>That&rsquo;s the secret: letters boxed up in order, side by side, and every array move you know still works on text. The one twist: a string is <strong>immutable</strong>. Once it&rsquo;s made, it can never be edited. <code>s[0] = &apos;H&apos;</code> is refused outright; to &ldquo;change&rdquo; a string you build a brand-new one with the change baked in.</>,
          rigorous: <>A <code>str</code> is a contiguous character array: index, length, slice behave exactly as on a list. The addition is an enforced invariant: <strong>immutability</strong>. No write ever lands in place (<code>s[0] = &apos;H&apos;</code> raises <code>TypeError</code>); every &ldquo;edit&rdquo; allocates a new string and copies into it.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s essentially the whole story: a string is just characters boxed up in order, sitting side by side in memory. Because of that, every move you already know for arrays (jump to position <code>i</code>, ask for the length, take a slice) works exactly the same on a string.</p>
            <p>There is one twist worth knowing. In many languages (Python, Java, JavaScript) a string is <strong>immutable</strong>: once it&rsquo;s made, you cannot edit it in place. Writing <code>s[0] = &apos;H&apos;</code> simply isn&rsquo;t allowed; the box is locked. To &ldquo;change&rdquo; a string you don&rsquo;t patch the old one; you build a brand-new string with the change baked in. That sounds harmless, but it has real cost consequences once you start stitching many pieces together &mdash; which is exactly what we look at next.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The answer to the instinct question is &ldquo;almost nothing.&rdquo; A string is letters boxed up in order, side by side, so every move you learned for arrays works here unchanged: jump to letter <code>i</code>, ask the length, grab a stretch.</p>
            <p>The one twist is the lock you just predicted. In many languages (Python, Java, JavaScript) a string is <strong>immutable</strong>: once it&rsquo;s made, it can never be edited. <code>s[0] = &apos;H&apos;</code> is flat-out refused. Want &ldquo;Hello&rdquo; instead of &ldquo;hello&rdquo;? You don&rsquo;t fix the old string; you build a brand-new one with the change baked in.</p>
            <p>Keep the word for a promise like this: an <Term word="invariant">invariant</Term>, a fact guaranteed to stay true, no matter what. &ldquo;This string never changes&rdquo; is exactly one, and the next beat counts what the guarantee costs.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model.</strong> A string is a contiguous array of characters, and the array contract carries over whole: position is computed, not searched, so indexing, length, and slicing behave exactly as they do on a list. Nothing about text changes the machinery.</p>
            <p><strong>The invariant.</strong> Contents are fixed at construction. No write ever lands in place (<code>s[0] = &apos;H&apos;</code> raises <code>TypeError</code>), so every transformation allocates a new string and copies into it. What the constraint buys: strings hash and share safely (a value that cannot change can key a dict, sit in a set, or be passed anywhere without a defensive copy), and every cost is explicit: if it transforms, it copies.</p>
          </>
        ),
      }),
      arrows: [{ x1: H.cx(0), y1: 150, x2: H.cx(0), y2: H.y - 4 }],
      codeLabels: ["index_read", "rebuild"],
      interaction: "wedge",
    },
    {
      id: "cost",
      label: "The operations",
      connector: reg({
        base: "If \"changing\" a string secretly rebuilds it, then which operations are cheap and which quietly cost a fortune?",
        rigorous: "The invariant, priced: every mutation is an allocation plus a copy. Count the copies as they land.",
      }),
      actionLabel: reg({
        base: "When it fits",
        structured: "Name the structure",
        rigorous: "Name the structure",
      }),
      takeaway: reg({
        base: "Reading a letter is instant; every edit copies the whole string. Growing with += explodes.",
        rigorous: "s[i] O(1) · slice O(j − i) · concat O(n + m) · repeated += O(n²); join instead.",
      }),
      visual: (api) => <AutoImmutable api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 580, variant: "main", label: "The operations", title: "Reading is free. Building is not.",
          body: reg({
            base: <>Reading one letter <code>s[i]</code> is <Term word="O(1)"><strong>O(1)</strong></Term>. &ldquo;O(...)&rdquo; just describes how cost grows; O(1) means instant, the same however long the string is. But every edit copies the whole thing into a new string. Watch the counter climb.</>,
            intuitive: <>Reading one letter is one step however long the string is, and that flat cost is written <Term word="O(1)"><code>O(1)</code></Term>. The counter under the row is the real story: every &ldquo;edit&rdquo; quietly copies <em>every letter</em> into a fresh string. Watch how fast the copies pile up.</>,
            rigorous: <><code>s[i]</code> and <code>len(s)</code> are one address computation each: <Term word="O(1)"><code>O(1)</code></Term>. Everything else allocates. <code>s[i:j]</code> copies j &minus; i characters, <Term word="O(j − i)"><code>O(j &minus; i)</code></Term>; <code>a + b</code> copies both, <Term word="O(n + m)"><code>O(n + m)</code></Term>. The counter tallies copies; watch <code>+=</code> pay the full length every round.</>,
          }),
        },
        {
          left: 540, top: 352, width: 290, variant: "note",
          body: reg({
            base: <>The trap: gluing letters on with <code>+=</code> in a loop re-copies everything each time and quietly explodes. Build a list and join once instead.</>,
            intuitive: <>The trap with a name in every codebase: growing a string with <code>+=</code> in a loop. Every pass re-copies all the letters built so far. Collect the pieces in a list instead and glue once at the end with <code>&quot;&quot;.join(...)</code>.</>,
            rigorous: <>Repeated <code>+=</code> to length n: 1 + 2 + &hellip; + n copies = n(n+1)/2, which is <Term word="O(n²)"><code>O(n&sup2;)</code></Term>. Accumulate in a list, <code>&quot;&quot;.join</code> once: O(n) total.</>,
          }),
        },
      ],
      detail: reg({
        base: (
          <>
            <p><strong>Reading one letter</strong> <code>s[i]</code> is <strong>O(1)</strong>. The &ldquo;O(...)&rdquo; notation just describes how the cost <em>grows</em> as the string gets longer; <code>O(1)</code> means &ldquo;constant&rdquo;: instant, and exactly the same whether the string is 5 letters or 5 million.</p>
            <p><strong>Taking a slice</strong> <code>s[i:j]</code> is <code>O(j &minus; i)</code>: a fresh string of that length gets built and the characters copied into it, so the cost grows with how many letters you grab. <strong>Gluing two strings together</strong> (<code>a + b</code>) is <code>O(n + m)</code>: the cost grows with the two lengths added up, since a new string is made and both halves are copied in.</p>
            <p>Here&rsquo;s the trap the counter is showing you: because strings are immutable, every edit rebuilds the whole thing. Stick letters on one at a time with <code>+=</code> inside a loop and each step re-copies everything you&rsquo;ve built so far, so the total work grows like the <em>square</em> of the length (<Term word="O(n²)"><code>O(n&sup2;)</code></Term>), which gets brutal fast.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The fix:</strong> don&rsquo;t grow a string in a loop. Collect the pieces in a list, then glue them all at once with <code>&quot;&quot;.join(...)</code>: one build instead of thousands.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p><strong>Reading one letter</strong> is one step, whether the string holds 5 letters or 5 million. Cost that stays flat like that is written <Term word="O(1)"><code>O(1)</code></Term>; tap the chip, it just means &ldquo;same work at any size.&rdquo;</p>
            <p><strong>Now the counter.</strong> Swapping one letter of &ldquo;hello&rdquo; copied 5 characters; sticking a &ldquo;!&rdquo; on copied 6; the next one copied 7. Build a string letter by letter with <code>+=</code> and the copies climb 1, 2, 3 &hellip; up to n, so the total grows like the <em>square</em> of the length, written <Term word="O(n²)"><code>O(n&sup2;)</code></Term>. A 10,000-letter string built that way costs about fifty million copies.</p>
            <p>Two quieter prices while we&rsquo;re counting: grabbing a stretch <code>s[i:j]</code> copies just that stretch (<Term word="O(j − i)"><code>O(j &minus; i)</code></Term>), and gluing <code>a + b</code> copies both halves (<Term word="O(n + m)"><code>O(n + m)</code></Term>). And two edges that bite: the empty string has no letter 0 at all (asking for it is an error), and hunting a word that isn&rsquo;t there still walks the whole text before saying no.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The fix:</strong> never grow a string one letter at a time. Pile the pieces into a list as you go, then glue them all in one move with <code>&quot;&quot;.join(...)</code>: one build instead of thousands.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Exact costs.</strong> <code>s[i]</code>, <code>len(s)</code>: O(1) address arithmetic, as for any array. <code>s[i:j]</code>: a new string, j &minus; i characters copied, so O(j &minus; i). <code>a + b</code>: allocate n + m, copy both, so O(n + m). Building length n by repeated <code>+=</code>: 1 + 2 + &hellip; + n copies = n(n+1)/2, which is O(n&sup2;); collecting parts and joining once is O(n) total. (CPython sometimes patches <code>+=</code> in place when the reference count allows; never design against it.) Substring search: up to m letter-checks at each of n &minus; m + 1 starts, O(n&middot;m) naive; the library&rsquo;s search is tuned, but still grows with the text.</p>
            <p><strong>Edges.</strong> The empty string: <code>len</code> 0; <code>s[0]</code> raises <code>IndexError</code>; <code>find</code> returns &minus;1, not an exception, two different not-found behaviours in one API. Slicing never raises: out-of-range bounds clamp (<code>s[5:999]</code> is fine), which silently absorbs the off-by-one bugs that indexing would crash on. Negative indices alias from the end. Searching for an absent word always pays the full scan.</p>
          </>
        ),
      }),
      arrows: [{ x1: 440, y1: 150, x2: VW / 2, y2: 244 }],
      codeLabels: ["index_read", "concat", "rebuild"],
      interaction: "playback",
    },
    {
      id: "fits",
      label: "When it fits",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Now that we know what's cheap and what's not, where does this structure actually show up?",
      actionLabel: "Name the structure",
      takeaway: "Most data is text: URLs, emails, JSON keys, logs are all strings underneath.",
      visual: <StringGallery />,
      panels: [{
        left: 150, top: 18, width: 560, variant: "main", label: "When it fits", title: "Text is everywhere.",
        body: <>Strings show up constantly because most data the world hands you is text: URLs, emails, JSON keys, log lines, error messages. Anywhere you&rsquo;d say &ldquo;this thing has a name,&rdquo; there&rsquo;s probably a string underneath.</>,
      }],
      detail: (
        <>
          <p>Strings turn up everywhere because most of the data the world hands you is text: log lines, JSON keys, email addresses, URLs, usernames and IDs, error messages. Almost anywhere you&rsquo;d say &ldquo;this thing has a name,&rdquo; there&rsquo;s a string sitting underneath.</p>
          <p>Two habits pay off once you know the costs. When you&rsquo;re <em>building</em> text piece by piece, collect the parts in a list and join them at the very end instead of growing one string in a loop. And when you&rsquo;re <em>searching</em> text, the built-in library functions are almost always faster and safer than hand-rolling the naive box-by-box scan we started with.</p>
        </>
      ),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 196 }],
      codeLabels: ["find", "concat"],
    },
    {
      id: "name",
      label: "String",
      connector: reg({
        base: "Pull it all together and the thing finally earns its name.",
        rigorous: "Name it, and file it under the promise it keeps.",
      }),
      takeaway: reg({
        base: "It’s a String: an array of characters, immutable, indexed instantly.",
        intuitive: "A string is an unchangeable row of letter boxes: read any spot instantly; edits rebuild.",
        rigorous: "String: immutable char array, O(1) reads, edits copy; the first enforced invariant.",
      }),
      visual: <CostTable />,
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The structure", title: "String.",
        body: reg({
          base: <>The mental model: an array of characters, immutable from the outside, indexed instantly. Almost every array cost rule carries straight over; the only new rule is that &ldquo;changing&rdquo; one letter means quietly building a whole new string.</>,
          intuitive: <>The name: a <strong>string</strong>. Keep the model: a row of letter boxes, instantly indexable, never editable. That locked-box promise is a guarantee that never breaks, an <Term word="invariant">invariant</Term>, and it&rsquo;s your first taste of idea 3 of 7.</>,
          rigorous: <>A string: an immutable character array, O(1) index and length, a copy for every transform, list + join for accumulation. The immutability is an enforced <Term word="invariant">invariant</Term>, the seed of idea 3 of 7, <strong>monotonicity &amp; invariants</strong>.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The name is the obvious one: a <strong>string</strong>. And the mental model to keep is short: <em>an array of characters, immutable from the outside, indexed in constant time.</em> Reach for any letter instantly, take its length instantly, and everything you learned about arrays carries straight over.</p>
            <p>The only genuinely new rule is the one to remember: &ldquo;changing&rdquo; a single letter isn&rsquo;t an edit, it&rsquo;s a quiet rebuild of the whole string. Keep that in mind and the cost table below stops being surprising. Open the code drawer to see the Python string interface that backs all of this.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The name is the obvious one: a <strong>string</strong>. The model to keep is one line: <em>a row of letter boxes, instantly indexable, never editable.</em> Everything you banked about arrays carries straight over; the only new rule is that &ldquo;changing&rdquo; a letter quietly rebuilds the whole string, which is why the cost table above holds no surprises now.</p>
            <p>And the twist is bigger than text. &ldquo;This value never changes&rdquo; is a promise the language <em>enforces</em>: an <Term word="invariant">invariant</Term>, a fact you can lean on without ever re-checking it. You&rsquo;ve seen what the kept promise costs (copies) and what it buys (a value that can&rsquo;t change behind your back).</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 3 of 7, keep a guarantee:</strong> immutability is your first <em>enforced</em> invariant. Later lessons keep promises like this on purpose; a guarantee you can trust is work you can skip.
            </div>
            <p>Open the code drawer to see the Python string interface that backs all of this.</p>
          </>
        ),
        rigorous: (
          <>
            <p>String: an immutable, contiguous character array. O(1) index and length; every transform (slice, concat, <code>upper</code>) allocates and copies; accumulation goes through a list and one join. Immutability also makes strings hashable: dict keys, set members, sharing without defensive copies.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7, foreshadowed, monotonicity &amp; invariants:</strong> immutability is an invariant the language maintains for you. The algorithm lessons maintain their own: a guarantee held at every step is work skipped at every step.
            </div>
          </>
        ),
      }),
      arrows: [{ x1: VW / 2, y1: 150, x2: VW / 2, y2: 190 }],
      codeLabels: ["source", "index_read", "length", "slice", "concat", "find", "rebuild"],
    },
  ],
};
