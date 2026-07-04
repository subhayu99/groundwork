"use client";

import { useState } from "react";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import { Box, Cap, VW } from "../../_shared";
import forPy from "./algorithm.py";

const ITEMS = [10, 20, 30];
const IW = 96, IGAP = 26, IY = 240;
const totalW = ITEMS.length * IW + (ITEMS.length - 1) * IGAP;
const IX0 = 150;

/** the collection as a row of boxes, with the current item highlighted.
 *  `done` marks the whole row as finished (every item rendered as "past"). */
function Items({ current, done }: { current: number; done?: boolean }) {
  return (
    <g>
      <text x={IX0 + totalW / 2} y={IY - 26} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-muted)" }}>[ 10, 20, 30 ]</text>
      {ITEMS.map((v, i) => {
        const x = IX0 + i * (IW + IGAP), on = i === current, past = done || (current >= 0 && i < current);
        return (
          <g key={i} opacity={past ? 0.55 : 1} style={{ transition: "opacity .3s" }}>
            <rect x={x} y={IY} width={IW} height={56} rx={10} fill={on ? "var(--accent-soft)" : "var(--bg-card)"} stroke={on ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={x + IW / 2} y={IY + 28} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 18, fill: "var(--text)" }}>{v}</text>
            {on && <text x={x + IW / 2} y={IY + 74} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>price</text>}
          </g>
        );
      })}
    </g>
  );
}

const ACC_X = IX0 + totalW + 70;

/* ── prediction gate (the wedge): round 1's state is on canvas; before round 2
 *    lands, the learner commits to what the loop does to `price` — the rebind
 *    that separates `for` from the hand-driven `while`. Hosted in a
 *    <foreignObject> per Predict.tsx (panels are pointer-events-none and the
 *    scene layout's note panels don't render on mobile — the canvas is the one
 *    host every viewport shares). The transparent <rect> twin keeps the scene
 *    layout's auto-centring honest about the gate's footprint. The beat's
 *    original round-2 visual is the tap-conditional reveal that answers the
 *    prediction. ─────────────────────────────────────────────────────────────── */
const GATE = { x: 190, y: 330, w: 480, h: 140 };

function NextRoundPredict({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <g>
      {revealed ? (
        <>
          <Cap>round 2: price = 20 → total = 10 + 20 = 30</Cap>
          <Items current={1} />
          <Box x={ACC_X} y={IY} w={150} name="total" value="30" active tone="good" />
        </>
      ) : (
        <>
          <Cap>round 1 done: price = 10, total = 10 — the loop heads back to the top</Cap>
          <Items current={0} />
          <Box x={ACC_X} y={IY} w={150} name="total" value="10" active tone="good" />
        </>
      )}
      <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} fill="transparent" />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <PredictGate
          question="Round 1 is done — what happens to price when round 2 begins?"
          choices={[
            { id: "refilled", label: "the loop refills it — just 20 now", correct: true, note: "the for line rebinds price to the next item at the top of every round — you never write that assignment" },
            { id: "manual", label: "still 10 — my code must change it", note: "that's while-thinking — moving to the next item is the for loop's own job, not the body's" },
            { id: "stacks", label: "it holds 10 and 20 now", note: "price is one box with one value — the next item replaces the last, every round" },
          ]}
          api={api}
          onRevealed={() => setRevealed(true)}
        />
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 4 beats (need, first, iterate, done)
 *   structured : 4 — same beats (the lesson is already lean; need folds slot 2,
 *                  the fiddly while-counter, into the open)
 *   rigorous   : 2 — `iterate` (the model: rebind → run → exhaust, with the
 *                  accumulator invariant; gate included) + `done` (edge cases +
 *                  name + close); need/first essentials fold into their prose.
 *   refresh    : additionally trims `need` + `first` (trimOnRefresh) — every
 *                  register re-derives from the gate beat + the close.          */
export const forLoopsLesson: LessonSpec = {
  topicTitle: "for loops · once per item",
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: 470 },
  codeSource: forPy as string,
  // standing on while-loops (per TRACK-NARRATIVES.md): the stop-promise the
  // learner kept by hand becomes the collection's job.
  bridgeFrom: reg({
    base: "A while loop runs while its condition holds, and you supply the progress. Now the collection does: one round per item.",
    intuitive: "With while, you kept the loop honest by counting toward the stop yourself. A for loop does that bookkeeping for you.",
    rigorous: "while = guard plus progress you maintain; for swaps the guard for exhaustion, so termination comes free.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 7): the accumulator carries
  // everything learned so far through the loop — the SEED of information
  // reuse, not a claim that for-loops are the algorithmic idea.
  principle: { key: "information-reuse", n: 1, total: 7 },
  beats: [
    {
      id: "need",
      label: "Walk a collection",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Set up the walk",
      takeaway: "A for loop runs its block once for each item, with no counter to manage.",
      visual: (
        <g>
          <Cap>you have a list of things; do the same step to each one</Cap>
          <Items current={-1} />
          <Box x={ACC_X} y={IY} w={150} name="total" value="0" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Walk a collection", title: "Do something to every item.",
        body: reg({
          base: <>Often you have a <em>collection</em> &mdash; prices, names, rows &mdash; and want the same step for each. A <code>while</code> with a counter works, but it&rsquo;s fiddly (start, condition, increment, off-by-one). The <code>for</code> loop is built exactly for this.</>,
          intuitive: <>Three prices sit in a list, 10, 20, 30, and you want them added up. You could use <code>while</code>: set up a counter, test it every round, bump it every round. That&rsquo;s three jobs of pure bookkeeping, and one slip (starting at 1, stopping a round early) makes the answer silently wrong. The <code>for</code> loop exists so you do none of those jobs.</>,
        }),
      }],
      detail: reg({
        base: <><p>Read it almost like English: <code>for price in [10, 20, 30]:</code> means &ldquo;for each <code>price</code> in this list, do the block.&rdquo; No counter, no condition to get wrong.</p></>,
        intuitive: (
          <>
            <p>Read the line out loud: <code>for price in [10, 20, 30]:</code> says &ldquo;for each <code>price</code> in this list, do the indented block.&rdquo; That&rsquo;s the entire setup. No counter to start, no test to write, no bump to forget.</p>
            <p><code>price</code> is just a variable, a labelled box, like always. The one new thing is <em>who fills it</em>. Hold that question for a moment.</p>
          </>
        ),
      }),
      codeLabels: ["init", "for"],
    },
    {
      id: "first",
      label: "First item",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      connector: "The loop hands you one item at a time.",
      actionLabel: "Next item",
      takeaway: reg({
        base: "Each round, the loop variable becomes the next item automatically.",
        intuitive: "Before each round, the loop drops the next item into the price box for you.",
      }),
      visual: (
        <g>
          <Cap>round 1: price = 10 → total = 0 + 10 = 10</Cap>
          <Items current={0} />
          <Box x={ACC_X} y={IY} w={150} name="total" value="10" active tone="good" />
          <line x1={IX0 + IW / 2} y1={IY + 56 + 30} x2={ACC_X + 75} y2={IY + 56 + 30} stroke="var(--accent-line)" strokeWidth={1.5} markerEnd="url(#lesson-arrow)" opacity={0.5} />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "First item", title: "price = 10  →  total = 10",
        body: reg({
          base: <>On the first round the loop sets <code>price</code> to the first item, <code>10</code>. The body runs: <code>total = total + price</code>, so <code>total</code> goes from <code>0</code> to <code>10</code>.</>,
          intuitive: <>Round 1 starts and the loop makes the first move: it puts the first item, <code>10</code>, into <code>price</code>. You never typed <code>price = 10</code>. Look for that line in the code; it isn&rsquo;t there. Then your block runs: <code>total = total + price</code> reads 0, adds 10, stores 10.</>,
        }),
      }],
      detail: reg({
        base: <><p>You never wrote <code>price = 10</code> yourself; the <code>for</code> loop assigned it for you. That&rsquo;s the convenience: the loop variable is handed the next item each round.</p></>,
        intuitive: (
          <>
            <p>Compare with the <code>while</code> version you&rsquo;d have written: there, <em>you</em> created the counter and <em>you</em> moved it along. Here the <code>for</code> line quietly does an <Term word="assignment">assignment</Term> for you at the top of every round, dropping the next item into the box.</p>
            <p>One box, by the way: <code>price</code> isn&rsquo;t a copy of the list. It holds exactly one item at a time.</p>
          </>
        ),
      }),
      codeLabels: ["for", "body"],
    },
    {
      id: "iterate",
      label: "Each one in turn",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "It keeps going down the list.",
        intuitive: "Round 1 banked the first price: total went 0 → 10. The loop swings back to the top.",
        structured: "Round 1 left total at 10. The loop comes back around on its own.",
        rigorous: "",
      }),
      actionLabel: "After the last",
      takeaway: reg({
        base: "It steps through every item, in order, until the collection runs out.",
        intuitive: "Each round the same price box is refilled with the next item; the old value is replaced.",
        rigorous: "for rebinds the target to each item in order; exhaustion, not a guard, ends it.",
      }),
      visual: (api) => <NextRoundPredict api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Each one in turn", title: "price = 20  →  total = 30",
        body: reg({
          base: <>Round 2: <code>price</code> is now <code>20</code>, and <code>total</code> becomes <code>30</code>. The loop simply walks to the next item and runs the same body; it knows when to stop on its own.</>,
          intuitive: <>Commit to a guess below, then watch round 2 land: the loop refills <code>price</code> with the next item and the same block runs again. Nothing in <em>your</em> code moved anything along. The loop itself did.</>,
          rigorous: <>Each round rebinds <code>price</code> to the next item and runs the body once. After round k, <code>total</code> holds the sum of the first k items: the loop&rsquo;s <Term word="invariant">invariant</Term>. There is no guard to maintain; the collection running out is the exit.</>,
        }),
      }],
      detail: reg({
        base: <><p>This is the key difference from <code>while</code>: there&rsquo;s no condition <em>you</em> manage and no risk of an infinite loop. The collection&rsquo;s length decides how many rounds happen.</p></>,
        intuitive: (
          <>
            <p>The habit to unlearn from <code>while</code>: nobody wrote <code>price = 20</code>, and nobody bumped a counter. The <code>for</code> line itself swaps what&rsquo;s in <code>price</code> for the next item at the top of every round: same box, new value, old one gone. Watch the 10 dim in the row: it&rsquo;s still in the list, but <code>price</code> has moved on.</p>
            <p>Count the rounds: three items, so the block runs exactly three times, then the loop is out of items. The list&rsquo;s length decides, not a test you wrote. That&rsquo;s why a plain <code>for</code> over a list can never become an <Term word="infinite loop">infinite loop</Term>.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model.</strong> <code>for price in items:</code> binds <code>price</code> to each item of <code>items</code> in order and runs the body once per binding. The assignment is the loop&rsquo;s, never yours, and each new binding replaces the last. Termination needs no progress argument: a finite collection exhausts. (Contrast <code>while</code>: guard plus progress you must maintain.)</p>
            <p><strong>The accumulator invariant.</strong> <code>total = 0</code> establishes it: the empty sum. Each round folds exactly one new item in, so after round k, <code>total</code> is the sum of the first k items; at exhaustion, k = n and <code>total</code> is the answer. Nothing is ever re-added.</p>
          </>
        ),
      }),
      codeLabels: ["for", "body"],
      interaction: "wedge",
    },
    {
      id: "done",
      label: "Out the other side",
      connector: reg({
        base: "When the items are used up, the loop is done.",
        rigorous: "Exhaustion, not a guard, ended it. Now name the shape.",
      }),
      actionLabel: "Done",
      takeaway: reg({
        base: "for = 'for each item'; the collection's length sets the rounds.",
        intuitive: "for + an accumulator: visit each item once, carry the running answer with you.",
        rigorous: "One body run per item, in order; the accumulator carries the partial answer.",
      }),
      visual: (
        <g>
          <Cap>✓ used every item · total = 10 + 20 + 30 = 60</Cap>
          <Items current={-1} done />
          <Box x={ACC_X} y={IY} w={150} name="total" value="60" active tone="good" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Out the other side",
        title: reg({
          base: "total = 60",
          rigorous: "Three items, three runs, done.",
        }),
        body: reg({
          base: <>After the third item there&rsquo;s nothing left, so the loop ends and <code>total</code> is <code>60</code>. The pattern &mdash; start an <Term word="accumulator">accumulator</Term>, add each item &mdash; is how you sum, count, or build things from a collection.</>,
          intuitive: <>The third item was the last, so the loop steps out the bottom, and <code>total</code> holds 60. Look at what <code>total</code> did all lesson: it started at 0 and <em>carried the answer-so-far</em> through every round. A box used that way is called an <Term word="accumulator">accumulator</Term>.</>,
          rigorous: <>n = 3 items, exactly 3 body runs, then the line after the loop. The shape to file: initialize an <Term word="accumulator">accumulator</Term>, fold one item in per round, read it after. Sum, count, max, and build-a-list all instantiate it.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Use <code>for</code> whenever you have a known set to walk; use <code>while</code> when you&rsquo;re waiting for a condition with no fixed count. Together they cover all repetition, and you&rsquo;ll see <code>for</code> on every array and list from here on.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 1 of 7, information reuse:</strong> the accumulator carries everything learned so far through the loop, so no round redoes the past.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>When to reach for which loop: <code>for</code> when you have a known set of things to walk, like a list, a word&rsquo;s letters, rows of a file. <code>while</code> when you&rsquo;re waiting for something with no fixed count. Together they cover all repetition, and you&rsquo;ll see <code>for</code> on every list from here on.</p>
            <p>One quiet case worth knowing: if the list is <em>empty</em>, the block simply never runs. The loop ends before round 1, <code>total</code> stays 0, and that&rsquo;s the right answer for &ldquo;the sum of nothing.&rdquo;</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The first big idea (1 of 7), reuse what you already know:</strong> <code>total</code> remembers all the adding done so far, so each round adds one new item, never the old ones again.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Edges.</strong> Empty collection: zero body runs; execution falls straight through and <code>total</code> keeps its initial value, the correct empty fold. One item: one run, no special case. After exit, <code>price</code> keeps its last binding (Python leaves the loop variable in scope). Mutating the collection while iterating over it is the classic hazard; iterate a copy if you must edit.</p>
            <p><strong>Cost, as counted.</strong> n items, exactly n body runs: the linear walk, written <Term word="O(n)"><code>O(n)</code></Term> once you start metering structures. Rule: <code>for</code> for a known collection, <code>while</code> for an open-ended condition.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 1 of 7, foreshadowed, information reuse:</strong> the accumulator is the carried partial result; round k folds in one item and never recomputes the first k &minus; 1.
            </div>
          </>
        ),
      }),
      codeLabels: ["body", "after"],
    },
  ],
};
