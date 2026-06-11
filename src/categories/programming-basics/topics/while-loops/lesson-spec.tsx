"use client";

import { useEffect, useRef, useState } from "react";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import { pace } from "@/shared/lesson/pace";
import { Box, Cap, VW } from "../../_shared";
import whilePy from "./algorithm.py";

const ROUNDS = [
  "count = 0    →    0 < 3  ✓    →    print 0,  count → 1",
  "count = 1    →    1 < 3  ✓    →    print 1,  count → 2",
  "count = 2    →    2 < 3  ✓    →    print 2,  count → 3",
];
const EXIT = "count = 3    →    3 < 3  ✗    →    stop the loop";
const RY = 196, RH = 44, RGAP = 12, RX = 150, RW = 560;

function Row({ i, text, tone = "accent", state }: { i: number; text: string; tone?: "accent" | "bad"; state: "idle" | "on" | "done" }) {
  const y = RY + i * (RH + RGAP);
  const stroke = state === "idle" ? "var(--line)" : tone === "bad" ? "var(--diff-hard)" : "var(--accent-line)";
  const fill = state === "on" ? (tone === "bad" ? "color-mix(in oklab, var(--diff-hard) 12%, var(--bg-card))" : "var(--accent-soft)") : "var(--bg-card)";
  return (
    <g opacity={state === "idle" ? 0.45 : 1} style={{ transition: "opacity .3s" }}>
      <rect x={RX} y={y} width={RW} height={RH} rx={10} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={RX + RW / 2} y={y + RH / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{text}</text>
    </g>
  );
}

const trace = (rounds: ("idle" | "on" | "done")[], exit?: "idle" | "on" | "done") => (
  <g>
    {ROUNDS.map((t, i) => <Row key={i} i={i} text={t} state={rounds[i]} />)}
    {exit && <Row i={3} text={EXIT} tone="bad" state={exit} />}
  </g>
);

/* ── prediction gate (the exit): the learner has watched count climb 0 → 1 → 2 → 3
 *    and knows the test; before the visual reveals the failed check they commit to
 *    what the loop does next. The original exit row + caption SPOIL that answer, so
 *    both are tap-conditional (per the variables exemplar): after the tap and a
 *    short feedback pause, the original visual lands unchanged. Gate hosted in a
 *    <foreignObject> per Predict.tsx (panel layers are pointer-events-none); the
 *    transparent <rect> twin keeps the scene layout's auto-centring honest about
 *    the gate's footprint. ──────────────────────────────────────────────────── */
const GATE = { x: 110, y: 360, w: 640, h: 120 };

function ExitPredict({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) {
    return <g><Cap>count is now 3 → 3 &lt; 3 is False → the loop stops</Cap>{trace(["done", "done", "done"], "on")}</g>;
  }
  return (
    <g>
      <Cap>three rounds done — count is 3, and the loop heads back up to the test</Cap>
      {trace(["done", "done", "done"])}
      <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} fill="transparent" />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <PredictGate
          question="count just became 3 — what does the loop do at the next check?"
          choices={[
            { id: "stop", label: "it stops — no more rounds", correct: true, note: "3 < 3 is False, so the block is skipped and the program moves on" },
            { id: "again", label: "one more round — 3 prints", note: "the check comes before the block — and 3 < 3 already fails, so 3 never prints" },
            { id: "reset", label: "it starts over from 0", note: "nothing resets count — the loop only ever re-asks its one test" },
          ]}
          api={api}
          onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(1600)); }}
        />
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 5 beats (need, setup, run, exit, recap)
 *   structured : 4 — cuts `setup` (the anatomy on-ramp); run's structured
 *                connector folds count = 0 and the test back in
 *   rigorous   : 3 — `run` (the model: pre-test loop + invariant, opener)
 *                  + `exit` (termination + edge cases, gate included)
 *                  + `recap` (name + close)
 *   refresh    : additionally trims `need` (trimOnRefresh).                    */
export const whileLoopsLesson: LessonSpec = {
  topicTitle: "while loops · repeat while true",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: whilePy as string,
  // standing on conditionals (TRACK-NARRATIVES row 6): one yes/no test chose a
  // road once — this lesson re-asks that same test until the answer flips.
  bridgeFrom: reg({
    base: "A condition picks one branch and runs it once — while re-asks that same test, repeating until the answer flips.",
    intuitive: "You've seen a yes/no test send the program down one road — now one test gets asked again and again, until it says no.",
    rigorous: "if evaluates its condition once and branches; while re-evaluates it every pass — repeat on True, exit on False.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 6): the guard + progress toward it
  // is what proves the loop stops — the SEED of monotonicity-and-invariants,
  // not a claim that while IS the algorithmic idea.
  principle: { key: "monotonicity-and-invariants", n: 3, total: 7 },
  beats: [
    {
      id: "need",
      label: "Repeat without copying",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Set it up",
      takeaway: reg({
        base: "A loop repeats a block so you don't copy-paste it.",
        intuitive: "A loop writes the repetition once and runs it as many times as needed.",
      }),
      visual: <g><Cap>do the same thing many times — without writing it many times</Cap>{trace(["idle", "idle", "idle"])}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Repeat without copying", title: "Repetition, written once.",
        body: reg({
          base: <>To print <code>0</code>, <code>1</code>, <code>2</code> you could write three lines &mdash; but for a thousand? You need a way to say &ldquo;keep doing this&rdquo; once, and let the computer repeat it.</>,
          intuitive: <>To print <code>0</code>, <code>1</code>, <code>2</code> you could copy the print line three times &mdash; count it: three written lines for three prints. A thousand prints would cost a thousand copied lines. You need a way to say &ldquo;keep doing this&rdquo; <em>once</em>, and let the computer do the repeating.</>,
        }),
      }],
      detail: reg({
        base: <><p>A <Term word="loop">loop</Term> runs the same block of code again and again. The <code>while</code> loop is the most basic kind: it repeats <strong>as long as a condition is True</strong>.</p></>,
        intuitive: (
          <>
            <p>Copy-paste has a second, sneakier problem: it only works when you <em>know</em> the number of repeats up front. &ldquo;Keep asking until the user types quit&rdquo; can&rsquo;t be copy-pasted &mdash; nobody knows if that&rsquo;s 2 rounds or 200.</p>
            <p>A <Term word="loop">loop</Term> fixes both problems: it runs the same <Term word="block">block</Term> of code &mdash; the indented lines that move together &mdash; again and again. The <code>while</code> loop is the most basic kind: it repeats <strong>as long as a condition is True</strong>.</p>
          </>
        ),
      }),
      codeLabels: ["init"],
    },
    {
      id: "setup",
      label: "A counter + a test",
      // intuitive-only on-ramp: structured folds these two pieces into `run`'s
      // connector; rigorous opens at `run` with them stated in its prose.
      registers: ["intuitive"],
      connector: "Every while loop needs two things to start.",
      actionLabel: "Run it",
      takeaway: "while needs a starting value and a condition to check each round.",
      visual: (
        <g>
          <Cap>count starts at 0; the loop will run while count &lt; 3</Cap>
          <Box x={(VW - 150) / 2} y={232} w={150} name="count" value="0" active />
          <text x={VW / 2} y={336} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 14, fill: "var(--accent-ink)" }}>while count &lt; 3:</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "A counter + a test", title: "count = 0   ·   while count < 3:",
        body: <>First a starting value: <code>count = 0</code>. Then the <code>while</code> with a <Term word="condition">condition</Term>: <code>count &lt; 3</code>. The indented block below runs every time that test is True.</>,
      }],
      detail: <><p>It&rsquo;s like an <code>if</code> that keeps re-asking. Before each round Python checks the condition; if True, it runs the block, then checks again.</p></>,
      codeLabels: ["init", "cond"],
    },
    {
      id: "run",
      label: "Round by round",
      // Appears for EVERY register — rigorous opens here, so its connector is
      // empty; structured's connector folds in the `setup` beat it never saw.
      connector: reg({
        base: "Watch it actually run.",
        structured: "Two pieces set it up — count = 0, then the test count < 3 — now watch it run.",
        rigorous: "",
      }),
      actionLabel: "When does it stop?",
      takeaway: reg({
        base: "Each round: check the condition, run the block, then check again.",
        intuitive: "Every round re-asks the question: still True? run the block once more.",
        rigorous: "Each iteration: test the guard, run the block; the step drives the guard toward False.",
      }),
      visual: <g><Cap>all three rounds, side by side — each one: check, run the block, then loop back</Cap>{trace(["on", "on", "on"])}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Round by round", title: "Check → run → repeat.",
        body: reg({
          base: <>Round 1: <code>0 &lt; 3</code> is True, so it prints <code>0</code> and bumps <code>count</code> to <code>1</code>. Round 2 with <code>1</code>, round 3 with <code>2</code> &mdash; each time it loops back to the test.</>,
          intuitive: <>Read the rounds top to bottom. Round 1: is <code>0 &lt; 3</code>? Yes &mdash; so print <code>0</code>, bump <code>count</code> to <code>1</code>, and walk back up to the test. Round 2 asks again with <code>1</code>; round 3 with <code>2</code>. The same small rhythm every time: check, run, back to the check.</>,
          rigorous: <>Setup: <code>count = 0</code>; guard: <code>count &lt; 3</code>. Each pass evaluates the guard &mdash; True &rarr; run the block, return to the test. The block&rsquo;s last line steps <code>count</code> up by one, so every pass moves the state one step toward a failing guard. Three passes: 0, 1, 2.</>,
        }),
      }],
      detail: reg({
        base: <><p>The line <code>count = count + 1</code> is doing the crucial work: it moves the counter <strong>toward</strong> the condition becoming False. Without it, the test would stay True forever.</p></>,
        intuitive: (
          <>
            <p>Spot the quiet hero: <code>count = count + 1</code>. The print is what you came for, but this line is what moves the story forward &mdash; every round it pushes the counter one step <strong>toward</strong> the day the answer is no. Without it, the test would stay True forever.</p>
            <p>There&rsquo;s also a steady promise being kept: at every check, <code>count</code> equals how many prints have already happened &mdash; 0, then 1, then 2. Noticing what <em>stays</em> true while everything changes is a habit that pays off in a big way later.</p>
          </>
        ),
        rigorous: (
          <>
            <p><code>while</code> is a pre-test loop: guard, block, repeat. Two facts make this trace provable rather than hopeful: the step line makes <code>count</code> strictly increasing, and the guard bounds it above. An <Term word="invariant">invariant</Term> holds at every check: <code>count</code> = completed iterations.</p>
          </>
        ),
      }),
      codeLabels: ["cond", "body", "step"],
    },
    {
      id: "exit",
      label: "The exit",
      connector: reg({
        base: "So what finally ends it?",
        rigorous: "Now the exit — commit to it before it runs.",
      }),
      actionLabel: reg({
        base: "The catch",
        rigorous: "Name the shape",
      }),
      takeaway: reg({
        base: "When the condition turns False, the loop ends and code continues.",
        intuitive: "The loop ends the moment its question's answer turns False.",
        rigorous: "Guard False → exit before the block runs again; no progress step → infinite loop.",
      }),
      visual: (api) => <ExitPredict api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The exit",
        title: reg({
          base: "3 < 3  →  False  →  stop",
          intuitive: "count is 3 — the test gets asked once more.",
        }),
        body: reg({
          base: <>After the third round <code>count</code> is <code>3</code>. Now <code>3 &lt; 3</code> is <strong>False</strong>, so the block is skipped and the program moves on to whatever comes after the loop.</>,
          intuitive: <>After the third round <code>count</code> is <code>3</code>, and the loop walks back up to its question one more time. You already know everything you need to call this one &mdash; tap your prediction in the picture and watch what the check decides.</>,
          rigorous: <>After three iterations <code>count = 3</code>: the guard <code>3 &lt; 3</code> evaluates False, the block is skipped, and control falls through to the line after the loop. Exit happens only at the test &mdash; never mid-block.</>,
        }),
      }],
      detail: reg({
        base: <><p>The danger: if the condition can <em>never</em> become False (you forget <code>count = count + 1</code>), the loop runs forever &mdash; an <Term word="infinite loop">infinite loop</Term>. Every <code>while</code> must make progress toward its exit.</p></>,
        intuitive: (
          <>
            <p>Count the asks across the whole run: <strong>four checks for three rounds</strong> &mdash; the extra one is the check that says no. That&rsquo;s how every while loop ends: it finds out it&rsquo;s done by asking one more time.</p>
            <p>Two situations to keep in your pocket. If the answer is already False at the very start (imagine beginning with <code>count = 5</code>), the block never runs at all &mdash; zero rounds is a perfectly legal run. And if the answer can <em>never</em> turn False &mdash; you forget <code>count = count + 1</code> &mdash; the loop runs forever: an <Term word="infinite loop">infinite loop</Term>. Every <code>while</code> must make progress toward its exit.</p>
          </>
        ),
        rigorous: (
          <>
            <p>Count the guard evaluations: <code>n</code> iterations cost <code>n + 1</code> checks &mdash; four tests for three rounds here, the failing one being the exit. Edges: guard False on entry &rarr; zero iterations, the block never runs; no progress step &rarr; the guard never changes and the loop diverges. The termination argument is always the same pair: a bounded guard plus strictly <Term word="monotonic">monotone</Term> progress toward falsifying it.</p>
          </>
        ),
      }),
      codeLabels: ["step", "after"],
      interaction: "wedge",
    },
    {
      id: "recap",
      label: "Repeat while true",
      connector: reg({
        base: "The whole shape, in one view.",
        rigorous: "The shape, named.",
      }),
      actionLabel: "Done",
      takeaway: reg({
        base: "while = repeat while a condition holds; make progress toward False.",
        intuitive: "A while loop repeats while its question is True — and must step toward False.",
        rigorous: "while = guard + body + progress; monotone progress to a False guard proves it stops.",
      }),
      visual: <g><Cap>✓ printed 0, 1, 2 — then stopped</Cap>{trace(["done", "done", "done"], "done")}</g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Repeat while true",
        title: reg({
          base: "Repeat while the condition holds.",
          rigorous: "Guard, body, progress.",
        }),
        body: reg({
          base: <>A <code>while</code> loop is a question asked over and over: while it&rsquo;s True, run the block; the moment it&rsquo;s False, stop. The body must nudge the world toward that False, or it never ends.</>,
          intuitive: <>That&rsquo;s the whole machine: one question, asked over and over. While the answer is True the block runs; the moment it&rsquo;s False the loop is done. And the block itself must nudge the world toward that False &mdash; that nudge is the loop&rsquo;s promise to stop.</>,
          rigorous: <>The full form: initialize state, guard on it, let the body advance it. &ldquo;Repeat while True&rdquo; is half the contract; the other half is progress &mdash; the guarantee the guard eventually fails. Guard + progress is the loop&rsquo;s termination proof.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p><code>while</code> is perfect when you don&rsquo;t know how many rounds you&rsquo;ll need (&ldquo;until the user quits&rdquo;). When you&rsquo;re going through a <em>known</em> set of things one by one, the <strong>for</strong> loop is cleaner &mdash; that&rsquo;s next.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 3 of 7 &mdash; invariants &amp; progress:</strong> a test you can trust, plus steady progress toward it, is what proves a loop stops.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>The move you just derived is the <code>while</code> loop: set a counter, ask a question, run the block while the answer is True &mdash; and make every round step toward a no. It&rsquo;s the tool for when you <em>can&rsquo;t</em> know the round count up front (&ldquo;keep going until the user quits&rdquo;). For walking a known set of things one by one, the <strong>for</strong> loop is cleaner &mdash; that&rsquo;s next.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>A first taste of big idea 3 of 7 &mdash; promises you can lean on:</strong> the loop stops because two things stay true: its question has a &ldquo;no&rdquo; in its future, and every round steps toward it. (Kept promises like these are called <Term word="invariant">invariants</Term> &mdash; they grow into a superpower later.)
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><code>while</code> covers the unknown-trip-count case; <code>for</code> (next) specializes it for a known collection. Same skeleton either way: state, guard, progress.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7, foreshadowed &mdash; monotonicity &amp; invariants:</strong> a monotone measure under a bounding guard is the termination proof &mdash; the same pair that later drives two-pointers and binary search.
            </div>
          </>
        ),
      }),
      codeLabels: ["after"],
    },
  ],
};
