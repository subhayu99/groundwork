"use client";

import { useEffect, useRef, useState } from "react";
import type { Tone } from "@/shared/viz/tones";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { CellRow, rowGeom, Bracket, Arrow } from "@/shared/lesson/canvas";
import two_pointersPy from "./algorithm.py";
import { pace } from "@/shared/lesson/pace";

const ARR = [1, 3, 5, 7, 9, 10, 12, 15, 18, 20];
const TARGET = 17; // 5 + 12 → indices 2 and 6
const VW = 860, VH = 470;
const G = rowGeom(ARR.length, VW, 250);

/* the floating "target = 17" tag, drawn above the row */
function TargetTag({ y = G.y - 34 }: { y?: number }) {
  return (
    <g>
      <rect x={VW / 2 - 56} y={y} width={112} height={22} rx={7}
        fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth={1} />
      <text x={VW / 2} y={y + 11} textAnchor="middle" dominantBaseline="central"
        className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>
        target = 17
      </text>
    </g>
  );
}

/* ── interactive (wedge): move a finger, watch the sum & verdict change ────── */
function MoveTheFingers({ api }: { api: BeatVisualApi }) {
  const [L, setL] = useState(0);
  const [R, setR] = useState(ARR.length - 1);
  const sum = ARR[L] + ARR[R];
  const verdict = sum === TARGET ? "match!" : sum < TARGET ? "too small" : "too big";

  const stepL = () => { api.onInteractionDone(); api.onActiveLine(["compute", "compare"]); if (L < R - 1) setL(L + 1); };
  const stepR = () => { api.onInteractionDone(); api.onActiveLine(["compute", "compare"]); if (R > L + 1) setR(R - 1); };
  const reset = () => { setL(0); setR(ARR.length - 1); };

  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    sum === TARGET && (i === L || i === R) ? "good" : i === L || i === R ? "active" : undefined);
  const markers: Record<number, string> = { [L]: "L", [R]: "R" };

  const Btn = ({ x, label, on }: { x: number; label: string; on: () => void }) => (
    <g onClick={on} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={label}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); on(); } }}>
      <rect x={x - 48} y={G.y + G.cellH + 42} width={96} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
      <text x={x} y={G.y + G.cellH + 55} textAnchor="middle" dominantBaseline="central"
        className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>{label}</text>
    </g>
  );

  return (
    <g>
      <TargetTag />
      <CellRow geom={G} values={ARR} tones={tones} markers={markers} />
      <text x={VW / 2} y={G.y - 52} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 13, fill: sum === TARGET ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {`arr[L] + arr[R] = ${ARR[L]} + ${ARR[R]} = ${sum}  (${verdict})`}
      </text>
      <Btn x={VW / 2 - 110} label="L → bigger" on={stepL} />
      <Btn x={VW / 2 + 110} label="R → smaller" on={stepR} />
      <g onClick={reset} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="reset"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reset(); } }}>
        <rect x={VW / 2 - 28} y={G.y + G.cellH + 42} width={56} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 55} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ reset</text>
      </g>
    </g>
  );
}

/* ── playback: the two pointers converge on their own, code follows ────────── */
interface TP { L: number; R: number; done: boolean; found: boolean; steps: number; }
function AutoTwoPointers({ api }: { api: BeatVisualApi }) {
  const init = (): TP => ({ L: 0, R: ARR.length - 1, done: false, found: false, steps: 0 });
  const [s, setS] = useState<TP>(init);
  const ref = useRef(s); ref.current = s;

  useEffect(() => {
    const id = setInterval(() => {
      const c = ref.current;
      if (c.done) return;
      if (c.L >= c.R) { api.onActiveLine(["notfound"]); setS({ ...c, done: true }); return; }
      const sum = ARR[c.L] + ARR[c.R];
      const steps = c.steps + 1;
      if (sum === TARGET) { api.onActiveLine(["compare", "found"]); setS({ ...c, done: true, found: true, steps }); return; }
      if (sum < TARGET) { api.onActiveLine(["less", "move_left"]); setS({ ...c, L: c.L + 1, steps }); }
      else { api.onActiveLine(["greater", "move_right"]); setS({ ...c, R: c.R - 1, steps }); }
    }, pace(950));
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { L, R, done, found, steps } = s;
  const sum = ARR[L] + ARR[R];
  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    found && (i === L || i === R) ? "good" : i === L || i === R ? "active" : undefined);
  const dim = ARR.map((_, i) => i < L || i > R);
  const markers: Record<number, string> = {};
  if (L < R) { markers[L] = "L"; markers[R] = "R"; }

  return (
    <g>
      <TargetTag />
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
      <text x={VW / 2} y={G.y - 52} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 13, fill: done ? "var(--diff-easy)" : "var(--text-faint)" }}>
        {done
          ? (found ? `found ${ARR[L]} + ${ARR[R]} = 17 ✓  ·  ${steps} comparisons (vs 45)` : "no pair")
          : `${ARR[L]} + ${ARR[R]} = ${sum} → ${sum < TARGET ? "move L right" : "move R left"}`}
      </text>
      <g onClick={() => setS(init())} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label="replay"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setS(init()); } }}>
        <rect x={VW / 2 - 30} y={G.y + G.cellH + 42} width={60} height={26} rx={6} fill="var(--bg-card)" stroke="var(--line)" />
        <text x={VW / 2} y={G.y + G.cellH + 55} textAnchor="middle" dominantBaseline="central"
          className="font-mono select-none pointer-events-none" style={{ fontSize: 11, fill: "var(--text-muted)" }}>↺ replay</text>
      </g>
    </g>
  );
}

/* ── static: brute-force, one anchor against the rest ──────────────────────── */
function BruteForce() {
  const anchor = 0, j = 5;
  const tones: (Tone | undefined)[] = ARR.map((_, i) =>
    i === anchor ? "active" : i === j ? "muted" : undefined);
  const dim = ARR.map((_, i) => i > anchor && i < j);
  return (
    <g>
      <TargetTag />
      <CellRow geom={G} values={ARR} tones={tones} dim={dim} />
      <text x={VW / 2} y={G.y - 52} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 13, fill: "var(--diff-hard)" }}>
        {`arr[i] + arr[j] = ${ARR[anchor]} + ${ARR[j]} = ${ARR[anchor] + ARR[j]}  ·  up to 45 pairs to try`}
      </text>
    </g>
  );
}

/* ── static: one move retires a whole side (the "too small" case) ──────────── */
function RetireSide() {
  const L = 0, R = ARR.length - 1;
  const tones: (Tone | undefined)[] = ARR.map((_, i) => (i === L || i === R ? "active" : "bad"));
  const markers: Record<number, string> = { [L]: "L", [R]: "R" };
  return (
    <g>
      <CellRow geom={G} values={ARR} tones={tones} markers={markers} />
      <Bracket x1={G.left(L)} x2={G.left(R) + G.cellW} y={G.y - 14} label="every pair with arr[L] — all too small, gone in one move" />
      <Arrow x1={G.cx(L)} y1={G.y + G.cellH + 30} x2={G.cx(L + 1) - 6} y2={G.y + G.cellH + 30} />
      <text x={G.cx(L) + 30} y={G.y + G.cellH + 46} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 11, fill: "var(--accent-ink)" }}>L steps right</text>
    </g>
  );
}

/* ── static: 45 vs 9 stat bars ─────────────────────────────────────────────── */
function WinStat() {
  const y = 232, bh = 34;
  const max = 45, scale = 560 / max, x0 = (VW - 560) / 2;
  const Row = ({ row, label, n, tone }: { row: number; label: string; n: number; tone: string }) => {
    const yy = y + row * (bh + 22);
    return (
      <g>
        <text x={x0} y={yy - 7} className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>{label}</text>
        <rect x={x0} y={yy} width={n * scale} height={bh} rx={7} fill={`color-mix(in oklab, ${tone} 22%, var(--bg-card))`} stroke={tone} strokeWidth={2} />
        <text x={x0 + n * scale + 14} y={yy + bh / 2} dominantBaseline="central" className="font-mono select-none"
          style={{ fontSize: 14, fill: "var(--text)" }}>{n}</text>
      </g>
    );
  };
  return (
    <g>
      <Row row={0} label="check every pair (brute force)" n={45} tone="var(--diff-hard)" />
      <Row row={1} label="two fingers converging" n={9} tone="var(--diff-easy)" />
      <text x={VW / 2} y={y + 2 * (bh + 22) + 6} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text-faint)" }}>
        n = how many cards (here 10) · worst case is n−1 = 9 · this board finds it even sooner
      </text>
    </g>
  );
}

/* ── static: the palindrome generalization (letters stepping inward) ───────── */
function PalindromeScene() {
  const word = ["R", "A", "C", "E", "C", "A", "R"];
  const PG = rowGeom(word.length, VW, 250, 46, 8, 46);
  const L = 1, R = 5; // already stepped inward once; outer pair matched (green)
  const tones: (Tone | undefined)[] = word.map((_, i) =>
    i === 0 || i === 6 ? "good" : i === L || i === R ? "active" : undefined);
  const markers: Record<number, string> = { [L]: "L", [R]: "R" };
  return (
    <g>
      <CellRow geom={PG} values={word} tones={tones} markers={markers} />
      <text x={VW / 2} y={PG.y - 14} textAnchor="middle" className="font-mono select-none"
        style={{ fontSize: 12, fill: "var(--text-faint)" }}>palindrome? letters match at both ends → step both inward</text>
      <Arrow x1={PG.cx(L) - 22} y1={PG.y + PG.cellH + 30} x2={PG.cx(L) + 6} y2={PG.y + PG.cellH + 30} />
      <Arrow x1={PG.cx(R) + 22} y1={PG.y + PG.cellH + 30} x2={PG.cx(R) - 6} y2={PG.y + PG.cellH + 30} />
    </g>
  );
}

const idleRow = (tones?: (Tone | undefined)[], dim?: boolean[], markers?: Record<number, string>) => (
  <g>
    <TargetTag />
    <CellRow geom={G} values={ARR} tones={tones} dim={dim} markers={markers} />
  </g>
);

export const twoPointersLesson: LessonSpec = {
  topicTitle: "two pointers · find a pair that sums to 17",
  canvas: { width: VW, height: VH },
  codeSource: two_pointersPy as string,
  beats: [
    {
      id: "setup",
      label: "The setup",
      actionLabel: "I see the setup",
      visual: idleRow(),
      panels: [{
        left: 150, top: 22, width: 560, variant: "main", label: "The setup", title: "Ten cards on a table. Find the pair that adds up.",
        body: <>Ten number cards lie in a row, smallest to largest. A friend names a total &mdash; say <strong>17</strong> &mdash; and asks for two cards that add up to it exactly. The question: how few cards must you touch?</>,
      }],
      detail: (
        <>
          <p>Picture ten cards laid out in a row, smallest on the left, largest on the right. A friend points at a number &mdash; let&rsquo;s say <code>17</code> &mdash; and asks: &ldquo;Find me two cards that add up to exactly this.&rdquo;</p>
          <p>You&rsquo;re allowed to pick any two cards, lift them up, check their total, and put them back. The real question isn&rsquo;t <em>can</em> you do it &mdash; it&rsquo;s how <strong>few</strong> cards you have to touch before you&rsquo;re sure. That &ldquo;how few&rdquo; is the whole game here.</p>
        </>
      ),
      codeLabels: ["sig"],
    },
    {
      id: "brute",
      label: "The obvious thing",
      connector: "Before getting clever, what does the honest, no-tricks way actually cost?",
      actionLabel: "Sorted should mean something",
      visual: <BruteForce />,
      panels: [{
        left: 150, top: 300, width: 580, variant: "main", label: "The obvious thing", title: "Try every pair until one works.",
        body: <>The honest way: pick one card, test it against every other. Nothing sums to 17? Pick the next, test the rest. For ten cards that&rsquo;s up to <strong>45</strong> tries &mdash; you touch cards over and over. The cards are <strong>sorted</strong>, but we haven&rsquo;t used that.</>,
      }],
      detail: (
        <>
          <p>The honest answer: pick the first card, then test it against every other card. If nothing sums to <code>17</code>, pick the second card and test it against every card after it. Then the third, and so on. This is the <strong>brute-force</strong> way &mdash; try every possible pair and hope one fits.</p>
          <p>For ten cards that&rsquo;s <code>9 + 8 + 7 + &hellip; + 1 = 45</code> pairs to inspect, and you end up touching the same cards over and over. Scale it up: a thousand cards means roughly half a million pairs. We call this <code>O(n&sup2;)</code> work (&ldquo;order n-squared&rdquo;) &mdash; meaning if the number of cards <code>n</code> doubles, the effort roughly <em>quadruples</em>.</p>
          <p>Here&rsquo;s the waste: the cards are already <strong>sorted</strong>, smallest to largest, and we haven&rsquo;t used that fact at all. Surely the order is worth something.</p>
        </>
      ),
      arrows: [{ x1: G.cx(5), y1: 300, x2: G.cx(5), y2: G.y + G.cellH + 4 }],
      codeLabels: [],
    },
    {
      id: "wedge",
      label: "The instinct",
      connector: "If checking every pair wastes the sorted order, start at the two ends and let the order guide you.",
      actionLabel: "I see the pattern",
      visual: (api) => <MoveTheFingers api={api} />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The instinct", title: "Two fingers. One at each end. Move them.",
          body: <>Put one finger &mdash; call it <code>L</code> &mdash; on the smallest card, one (<code>R</code>) on the largest. <em><code>arr[L]</code> just means the card the L finger points at.</em> Add the two. Use the buttons: when the sum is too small, which finger makes it bigger?</>,
        },
        {
          left: 600, top: 360, width: 252, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">The instinct:</strong> too small &rarr; move which finger to grow the sum? Too big &rarr; which one to shrink it?</>,
        },
      ],
      detail: (
        <>
          <p>Put your left finger on the smallest card and your right finger on the largest. We&rsquo;ll call them <code>L</code> and <code>R</code> &mdash; just names for &ldquo;the card the left finger is on&rdquo; and &ldquo;the card the right finger is on.&rdquo; Add the two numbers together. Then use the buttons to move whichever finger you like, and just <em>watch</em> what the sum does.</p>
          <p>Don&rsquo;t reach for a strategy yet. Notice the feel of it: when does each finger want to move? What does it mean when the total comes out too small? Too big? The answer is hiding in plain sight because the cards are sorted &mdash; moving <code>L</code> right always lands on a bigger card, moving <code>R</code> left always lands on a smaller one.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The instinct question:</strong> if the sum is too small, which finger could you move to make it bigger? If the sum is too big, which one could you move to shrink it?
          </div>
        </>
      ),
      codeLabels: ["compute", "compare"],
      interaction: "wedge",
    },
    {
      id: "derive",
      label: "The derivation",
      connector: "You felt which finger to move — now here's the reason it's always the right call.",
      actionLabel: "Count the work",
      visual: <RetireSide />,
      panels: [
        {
          left: 150, top: 18, width: 560, variant: "main", label: "The derivation", title: "Each move retires a whole row of pairs.",
          body: <>Too small? <code>R</code> is already the biggest card left, so <em>every</em> pair using <code>arr[L]</code> is too small &mdash; never look at it again, step <code>L</code> right. Too big? Mirror it: step <code>R</code> left. One look retires a whole side.</>,
        },
        {
          left: 600, top: 360, width: 252, variant: "note",
          body: <><strong className="text-[var(--accent-ink)]">Why it works:</strong> sorted is a promise the cards keep &mdash; each comparison cuts a whole side, not one pair.</>,
        },
      ],
      detail: (
        <>
          <p>Call the fingers <code>L</code> and <code>R</code>, and look at the total <code>arr[L] + arr[R]</code> &mdash; the left card plus the right card.</p>
          <p><strong>Too small?</strong> Remember <code>R</code> is sitting on the biggest card left in play. So pairing <code>arr[L]</code> with <em>anything</em> between <code>L</code> and <code>R</code> can only be smaller still &mdash; every one of those pairs is also too small. That means <code>arr[L]</code> can never be part of the answer, so we throw it away for good and step <code>L</code> one card to the right.</p>
          <p><strong>Too big?</strong> The mirror image. Every pair using <code>arr[R]</code> with anything from <code>L</code> to <code>R</code> is also too big, so we retire <code>R</code> and step it one card to the left.</p>
          <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
            <strong>The principle:</strong>{" "}being sorted is a promise the cards keep. Each single comparison lets us eliminate a whole side of the remaining cards at once &mdash; not just one pair.
          </div>
        </>
      ),
      codeLabels: ["compute", "less", "move_left", "greater", "move_right"],
    },
    {
      id: "win",
      label: "The win",
      connector: "If one look retires a whole side, count how many looks the whole search can possibly take.",
      actionLabel: "See it converge",
      visual: <WinStat />,
      panels: [{
        left: 150, top: 26, width: 560, variant: "main", label: "The win", title: "Forty-five pairs becomes nine comparisons.",
        body: <>Trying every pair takes up to <code>n &times; (n &minus; 1) / 2</code> &mdash; with <code>n</code> (the card count) = 10, that&rsquo;s 45. Two fingers touch each card once: <code>L</code> only moves right, <code>R</code> only left. They meet in at most <code>n &minus; 1</code> = 9 steps.</>,
      }],
      detail: (
        <>
          <p>Put the two costs side by side. Brute force inspects up to <code>n &times; (n &minus; 1) / 2</code> pairs &mdash; here <code>n</code> is the card count, so with <code>n = 10</code> that&rsquo;s 45 comparisons. That formula is <code>O(n&sup2;)</code> work: double the cards and the effort roughly quadruples.</p>
          <p>The two fingers, by contrast, touch each card at most once. <code>L</code> only ever moves right, <code>R</code> only ever moves left, and they march toward each other until they meet. So after at most <code>n &minus; 1</code> = 9 steps the search is over. That&rsquo;s <code>O(n)</code> work (&ldquo;order n&rdquo;) &mdash; the effort grows in simple step with the number of cards, not with its square.</p>
          <p>Forty-five collapses to nine, and the gap only widens as the row gets longer. Next, see the fingers actually converge.</p>
        </>
      ),
      codeLabels: ["loop", "compute", "compare", "found"],
    },
    {
      id: "run",
      label: "The win, watched",
      connector: "Nine steps on paper — here it is happening, the retired cards fading out one move at a time.",
      actionLabel: "Where else it fits",
      visual: (api) => <AutoTwoPointers api={api} />,
      panels: [{
        left: 150, top: 18, width: 560, variant: "main", label: "Watch it converge", title: "The fingers walk inward on their own.",
        body: <>The two fingers start at the ends and step inward by themselves, each move shrinking what&rsquo;s left. Faded cards are retired &mdash; out of play for good. When the sum lands on 17, the pair turns green. Use <strong>&ldquo;↺ replay&rdquo;</strong> under the visual to run it again. This board finishes in well under nine looks.</>,
      }],
      detail: (
        <>
          <p>The rule from the last two beats now runs on its own &mdash; just watch. The two fingers start at the far ends and step inward one move at a time, and every move shrinks the part of the row still in play.</p>
          <p>The faded cards aren&rsquo;t just dimmed for looks &mdash; they&rsquo;re the ones we <em>retired</em>, gone for good because we proved they couldn&rsquo;t be part of the answer. When <code>arr[L] + arr[R]</code> finally lands on <code>17</code>, that pair turns green and the search stops. Count the moves: this board reaches the answer in well under the nine looks the worst case allows, because the fingers often meet the target before they ever get close to each other.</p>
        </>
      ),
      codeLabels: ["loop", "compute", "compare", "found"],
      interaction: "playback",
    },
    {
      id: "general",
      label: "The generalization",
      connector: "The cards were just one excuse to use the fingers — the same move answers questions that have nothing to do with sums.",
      actionLabel: "Name the pattern",
      visual: <PalindromeScene />,
      panels: [{
        left: 150, top: 18, width: 580, variant: "main", label: "The generalization", title: "Same fingers. New questions.",
        body: <>The fingers don&rsquo;t care <em>what</em> they compare. Is a word a palindrome (reads the same backward)? One finger at each end, step inward while letters match. They just need a <strong>direction</strong>: order, symmetry, or height.</>,
      }],
      detail: (
        <>
          <p>Try a different question with the same two fingers: is this word a <strong>palindrome</strong> &mdash; does it read the same forwards and backwards, like <em>racecar</em>? Put one finger at each end and compare the letters. If they match, both fingers step inward. The first time they don&rsquo;t, it&rsquo;s not a palindrome. Same convergence, about <code>n / 2</code> moves &mdash; roughly half as many steps as there are letters.</p>
          <p>Or a question with no list to search at all: given the heights of vertical lines, which two hold the most water between them? Two fingers at the ends, always move the <em>shorter</em> one inward, because the short line is the bottleneck. Same pattern again.</p>
          <p>The fingers genuinely don&rsquo;t care <em>what</em> they&rsquo;re comparing. All they need is that the thing underneath has a <em>direction</em> &mdash; sorted order, symmetry, height &mdash; that tells each finger which way to step.</p>
        </>
      ),
      codeLabels: ["loop", "compare"],
    },
    {
      id: "name",
      visual: idleRow(
        ARR.map((_, i) => (i === 2 || i === 6 ? "good" : undefined)),
        ARR.map((_, i) => i !== 2 && i !== 6),
        { 2: "✓", 6: "✓" },
      ),
      label: "The pattern",
      connector: "You've used it, proved it, and stretched it — here's its name and the cues that should make you reach for it.",
      panels: [{
        left: 150, top: 22, width: 600, variant: "main", label: "The pattern", title: "Two Pointers.",
        body: <>That&rsquo;s the name. Reach for it whenever a row has a <strong>direction</strong> &mdash; sorted order, symmetry, a one-way pattern &mdash; and one comparison can retire a whole side. Signals: &ldquo;sorted array + pair sum&rdquo;; &ldquo;palindrome&rdquo;; &ldquo;container with most water.&rdquo;</>,
      }],
      detail: (
        <>
          <p>That&rsquo;s the name: <strong>Two Pointers</strong>. The &ldquo;pointers&rdquo; are just the two fingers &mdash; markers that each remember a position in the row. The pattern fits whenever a line of data has a <em>direction</em> (sorted order, symmetry, or some one-way pattern) and a single comparison can rule out a whole side of what&rsquo;s left, instead of just one item.</p>
          <p>Reach for it when you spot signals like these:</p>
          <ul>
            <li>a &ldquo;sorted array&rdquo; plus a &ldquo;pair sum&rdquo; or &ldquo;target&rdquo;</li>
            <li>&ldquo;palindrome&rdquo; or &ldquo;symmetric&rdquo;</li>
            <li>&ldquo;remove duplicates in place&rdquo;</li>
            <li>&ldquo;container with most water&rdquo; or &ldquo;trap rainwater&rdquo;</li>
          </ul>
          <p>Open the Code panel to see exactly how the two fingers look written out in Python.</p>
        </>
      ),
      arrows: [
        { x1: G.cx(2), y1: G.y + G.cellH + 34, x2: G.cx(2), y2: G.y + G.cellH + 4 },
        { x1: G.cx(6), y1: G.y + G.cellH + 34, x2: G.cx(6), y2: G.y + G.cellH + 4 },
      ],
      codeLabels: ["found", "notfound"],
    },
  ],
};
