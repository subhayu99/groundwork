"use client";

import { useEffect, useRef, useState } from "react";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import { pace } from "@/shared/lesson/pace";
import conditionalsPy from "./algorithm.py";

const VW = 860, VH = 470;

type RowStatus = "idle" | "false" | "true" | "skipped";

const ROWS = [
  { cond: "score >= 90", out: 'grade = "A"' },
  { cond: "score >= 60", out: 'grade = "B"' },
  { cond: "else", out: 'grade = "F"' },
];

const X0 = 188, COND_W = 224, ARROW = 56, OUT_W = 196, ROW_H = 54, GAP = 20, Y0 = 196;

/* The if / elif / else ladder. Each row colours by status: a failed test goes red,
   the matched one goes accent, rows below a match are skipped (greyed).
   `chip` (default true — every static beat unchanged) hides the score chip; only
   the prediction gate's PRE-reveal state uses it, so gate + ladder fit the band. */
function Ladder({ status, chip = true }: { status: RowStatus[]; chip?: boolean }) {
  return (
    <g>
      {/* the value being tested */}
      {chip && (
        <>
          <rect x={VW / 2 - 70} y={150} width={140} height={30} rx={8} fill="var(--bg-card-hi)" stroke="var(--line-strong)" strokeWidth={1.5} />
          <text x={VW / 2} y={165} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>score = 72</text>
        </>
      )}

      {ROWS.map((r, i) => {
        const y = Y0 + i * (ROW_H + GAP);
        const st = status[i];
        const isElse = r.cond === "else";
        const condStroke = st === "false" ? "var(--diff-hard)" : st === "true" ? "var(--accent-line)" : "var(--line)";
        const condFill = st === "false" ? "color-mix(in oklab, var(--diff-hard) 12%, var(--bg-card))" : st === "true" ? "var(--accent-soft)" : "var(--bg-card)";
        const out = st === "true";
        const verdict = isElse
          ? (st === "skipped" ? "skipped" : st === "true" ? "(nothing matched)" : "")
          : st === "false" ? "False" : st === "true" ? "True" : "";
        const verdictColor = st === "false" ? "var(--diff-hard)" : st === "true" ? "var(--diff-easy)" : "var(--text-faint)";
        return (
          <g key={i} opacity={st === "idle" || st === "skipped" ? 0.5 : 1} style={{ transition: "opacity .3s" }}>
            <rect x={X0} y={y} width={COND_W} height={ROW_H} rx={10} fill={condFill} stroke={condStroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={X0 + COND_W / 2} y={y + (verdict ? ROW_H / 2 - 8 : ROW_H / 2)} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 14, fill: "var(--text)" }}>
              {isElse ? "else" : r.cond}
            </text>
            {verdict && (
              <text x={X0 + COND_W / 2} y={y + ROW_H / 2 + 11} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: verdictColor }}>{verdict}</text>
            )}
            <line x1={X0 + COND_W} y1={y + ROW_H / 2} x2={X0 + COND_W + ARROW} y2={y + ROW_H / 2} stroke={out ? "var(--accent-line)" : "var(--line)"} strokeWidth={1.5} markerEnd="url(#lesson-arrow)" />
            <rect x={X0 + COND_W + ARROW} y={y + ROW_H / 2 - 17} width={OUT_W} height={34} rx={9} fill={out ? "var(--accent-soft)" : "var(--bg-card)"} stroke={out ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={X0 + COND_W + ARROW + OUT_W / 2} y={y + ROW_H / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{r.out}</text>
            {i < ROWS.length - 1 && st === "false" && (
              <text x={X0 + COND_W / 2} y={y + ROW_H + GAP / 2 + 3} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>no &darr;</text>
            )}
          </g>
        );
      })}
    </g>
  );
}

const cap = (t: string) => (
  <text x={VW / 2} y={Y0 + 3 * (ROW_H + GAP) + 6} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>{t}</text>
);

/* ── prediction gate (the wedge): row 2 is about to match. Before the visual
 *    reveals "(and we stop checking)" — the ladder's defining move — the learner
 *    commits to the fate of the rows below a True test. Hosted in a
 *    <foreignObject> per Predict.tsx (the layouts' panel layers are
 *    pointer-events-none; the canvas is the one host every viewport shares).
 *    data-canvas-panel opts the gate into the scene layout's content-extent
 *    measurement; the score chip stays hidden until the reveal so ladder + gate
 *    fit the canvas band without clipping. On the tap, feedback shows, then the
 *    beat's original visual (chip + matched row + caption) answers it. ──────── */
const GATE = { x: 170, y: 404, w: 520, h: 170 };

function StopCheckingPredict({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current != null) window.clearTimeout(timer.current); }, []);

  if (revealed) {
    return (
      <g>
        <Ladder status={["false", "true", "idle"]} />
        {cap("72 >= 60 ?  →  True, so grade = B  (and we stop checking)")}
      </g>
    );
  }
  return (
    <g>
      <Ladder status={["false", "idle", "idle"]} chip={false} />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <div data-canvas-panel="predict">
          <PredictGate
            api={api}
            question={'72 >= 60 is about to pass, so grade = "B" runs. What happens to the else row below?'}
            choices={[
              { id: "skip", label: "skipped, unread", correct: true, note: "one True and the ladder is done — every row below is abandoned" },
              { id: "check", label: "still checked", note: "the ladder stops at its first True — nothing below is even looked at" },
              { id: "else", label: "else runs too", note: "else fires only when every test above it failed" },
            ]}
            onRevealed={() => { timer.current = window.setTimeout(() => setRevealed(true), pace(2200)); }}
          />
        </div>
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 5 beats (need, if, elif, else, recap)
 *   structured : 5 — same beats; the lesson has no slot-6 generalization to cut
 *   rigorous   : 3 — `elif` (the model + first-True-wins invariant, gate
 *                  included; the if-mechanics fold into its rigorous prose)
 *                  + `else` (edge cases: boundaries, overlap, missing-else)
 *                  + `recap` (name + stamp + close).
 *   refresh    : additionally trims `need` (trimOnRefresh).                    */
export const conditionalsLesson: LessonSpec = {
  topicTitle: "if / else · choosing a path",
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: VH },
  codeSource: conditionalsPy as string,
  // standing on operators (TRACK-NARRATIVES.md row 5): comparisons already
  // produce booleans — this lesson is where the program finally acts on one.
  bridgeFrom: reg({
    base: "Comparisons like score >= 90 already hand you a True or False. Now the program finally acts on the answer.",
    intuitive: "You can already ask a value a yes/no question. Now the program takes one road for yes, another for no.",
    rigorous: "Operators yield booleans; conditionals consume them: one test selects a branch, the rest never run.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 5): one test abandons a whole
  // branch of what-could-run — the SEED of search-space pruning, not its proof.
  principle: { key: "search-space-pruning", n: 2, total: 7 },
  beats: [
    {
      id: "need",
      label: "The choice",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Ask a question",
      takeaway: reg({
        base: "A condition lets a program choose what to do, based on a value.",
        intuitive: "A program chooses by asking a yes/no question about a value.",
      }),
      visual: <Ladder status={["idle", "idle", "idle"]} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The choice", title: "Turn a score into a grade.",
        body: reg({
          base: <>Code that does the same thing every time can&rsquo;t react. Given a <code>score</code>, we want different results: 90+ is an A, 60+ is a B, otherwise F. The program has to <strong>choose</strong>.</>,
          intuitive: <>Up to now a program does the exact same thing every run, so it can&rsquo;t react. Given a <code>score</code>, we want different endings: 90 or more earns an A, 60 or more a B, anything else an F. The program has to pick <em>one</em> of three roads.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>So far a program runs every line, top to bottom. To make it <em>decide</em>, we ask a yes/no question about a value and only run some lines when the answer is yes.</p>
            <p>Here the value is <code>score = 72</code>. Which grade should come out?</p>
          </>
        ),
        intuitive: (
          <>
            <p>Until now, every line of a program runs, top to bottom, every single time. A program like that can&rsquo;t react to anything.</p>
            <p>To make it decide, we hand it a yes/no question about a value, like &ldquo;is the score at least 90?&rdquo;, and let the answer pick which lines run. Picture three doors in a hallway, each with its own rule on the front: you walk in carrying your score, and the first door that accepts it is the one you go through.</p>
            <p>Today&rsquo;s walker: <code>score = 72</code>. Before we trace it, which grade do you think comes out?</p>
          </>
        ),
      }),
      codeLabels: ["var"],
    },
    {
      id: "if",
      label: "if: the first test",
      registers: ["intuitive", "structured"],
      connector: "Start with the top question and check it.",
      actionLabel: "It failed. Now what?",
      takeaway: reg({
        base: "if runs its block only when its condition is True.",
        intuitive: "An if asks a yes/no question; its indented lines run only on yes.",
      }),
      visual: (
        <g>
          <Ladder status={["false", "idle", "idle"]} />
          {cap("72 >= 90 ?  →  False, so the A block is skipped")}
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "if: the first test", title: "if score >= 90:",
        body: reg({
          base: <>An <Term word="if">if</Term> is a <Term word="condition">condition</Term>: a yes/no test. <code>score &gt;= 90</code> with <code>score = 72</code> is <strong>False</strong>, so the <Term word="indented">indented</Term> <code>grade = &quot;A&quot;</code> never runs.</>,
          intuitive: <>The first door&rsquo;s rule is an <Term word="if">if</Term>, a yes/no <Term word="condition">condition</Term>. &ldquo;Is 72 at least 90?&rdquo; No. So the door stays shut: the <Term word="indented">indented</Term> line <code>grade = &quot;A&quot;</code> is never even touched.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The <code>&gt;=</code> (&ldquo;greater than or equal&rdquo;) gives back a <Term word="boolean">boolean</Term>: <code>True</code> or <code>False</code>. <code>72 &gt;= 90</code> is <code>False</code>.</p>
            <p>The <strong>indented</strong> lines under the <code>if</code> are its <Term word="block">block</Term>. They run only when the test is True, so here they&rsquo;re skipped entirely.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The <code>&gt;=</code> sign simply asks &ldquo;at least?&rdquo;, and it always answers with a <Term word="boolean">boolean</Term>: the computer&rsquo;s plain yes or no, written <code>True</code> or <code>False</code>. Here <code>72 &gt;= 90</code> answers <code>False</code>.</p>
            <p>The lines shifted right underneath the <code>if</code> are <em>inside</em> it. That shift is <Term word="indented">indentation</Term>, and the shifted lines are the if&rsquo;s <Term word="block">block</Term>. Shut door, untouched block: for a 72, <code>grade = &quot;A&quot;</code> might as well not exist.</p>
          </>
        ),
      }),
      codeLabels: ["if", "a"],
    },
    {
      id: "elif",
      label: "elif: the next test",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "The first answer was no, so fall through to the next question.",
        rigorous: "",
      }),
      actionLabel: "And if all fail?",
      takeaway: reg({
        base: "elif checks the next condition only if the ones above were False.",
        intuitive: "elif is the next door, tried only after every door above said no.",
        rigorous: "Chain order is semantics: the first True test runs; later tests are never evaluated.",
      }),
      visual: (api) => <StopCheckingPredict api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "elif: the next test", title: "elif score >= 60:",
        body: reg({
          base: <><code>elif</code> (&ldquo;else if&rdquo;) is checked only because the <code>if</code> was False. <code>72 &gt;= 60</code> is <strong>True</strong>, so <code>grade = &quot;B&quot;</code> runs, and the ladder stops.</>,
          intuitive: <>The next door&rsquo;s rule is <code>elif</code>, short for &ldquo;else, if&rdquo;. It&rsquo;s only even read because the first door said no. &ldquo;Is 72 at least 60?&rdquo; Yes, so <code>grade = &quot;B&quot;</code> runs. But what about the door below? Commit to your prediction first.</>,
          rigorous: <>Evaluation is top to bottom: <code>elif</code> is reached only because <code>score &gt;= 90</code> was <code>False</code>. <code>72 &gt;= 60</code> is <code>True</code>, so this block runs. The chain&rsquo;s defining rule is what happens to the rows below a satisfied test, so commit to a prediction below.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Conditions are checked <strong>top to bottom</strong>. The moment one is True, its block runs and every remaining <code>elif</code>/<code>else</code> is ignored, even if a later one would also be True.</p>
            <p>That &ldquo;stop at the first match&rdquo; rule is why order matters: put the strictest test first.</p>
          </>
        ),
        intuitive: (
          <>
            <p>The doors are tried strictly <strong>top to bottom</strong>, and the first one that opens ends the walk. You&rsquo;re through, and the doors below are never even glanced at. That&rsquo;s what you just predicted: the ladder <em>stops</em> at its first yes.</p>
            <p>That rule has teeth. Take a score of 95: it would pass the first test <em>and</em> the second. Only the first one fires, so 95 earns an A, not a B. Order is what keeps the grades honest: put the strictest test first.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The invariant:</strong> conditions are <Term word="expression">expressions</Term> evaluated lazily, in source order, until the first <code>True</code>; that block executes and the chain ends. Every test below is genuinely unevaluated &mdash; a later, ill-defined condition (a guarded division, say) is still safe once an earlier test passes. An <code>if/elif/&hellip;/else</code> chain is sugar for nested two-way branches.</p>
            <p>Order resolves overlap: 95 satisfies both <code>&gt;= 90</code> and <code>&gt;= 60</code> and takes the first, so overlapping ranges are written strictest-first. Reordering the tests changes the function the chain computes.</p>
          </>
        ),
      }),
      codeLabels: ["elif", "b"],
      interaction: "wedge",
    },
    {
      id: "else",
      label: "else: the fallback",
      connector: reg({
        base: "What grade comes out when none of the tests pass?",
        rigorous: "One case remains: no test passes.",
      }),
      actionLabel: "See it whole",
      takeaway: reg({
        base: "else is the catch-all: it runs only when every test above was False.",
        intuitive: "else is the otherwise: it catches every value no test above claimed.",
        rigorous: "With else the chain is total: exactly one branch runs, no value falls through.",
      }),
      visual: (
        <g>
          <Ladder status={["false", "true", "skipped"]} />
          {cap("else is skipped here — but it would catch a score like 40 → F")}
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "else: the fallback", title: "else:",
        body: reg({
          base: <><code>else</code> has no condition: it&rsquo;s the <strong>otherwise</strong>. It runs when every <code>if</code>/<code>elif</code> above came out False. With <code>72</code> we already matched B, so <code>else</code> is skipped.</>,
          intuitive: <>The last door, <code>else</code>, has no rule on it at all. It&rsquo;s the <strong>otherwise</strong>, and it opens for anyone who reaches it. A 72 never gets that far (door two already opened), so today it stays unused.</>,
          rigorous: <><code>else</code> executes exactly when every preceding condition evaluated <code>False</code>: the complement of the tests above. Here the <code>elif</code> matched, so for 72 the <code>else</code> block is dead. It is the chain&rsquo;s totality guarantee.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>If <code>score</code> were <code>40</code>: <code>40 &gt;= 90</code> False, <code>40 &gt;= 60</code> False, so <code>else</code> fires and <code>grade</code> becomes <code>&quot;F&quot;</code>.</p>
            <p><code>else</code> guarantees <em>some</em> branch always runs, so <code>grade</code> is never left unset.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Walk a 40 through the hallway: &ldquo;at least 90?&rdquo; No. &ldquo;At least 60?&rdquo; No. Both doors shut, so the 40 reaches the <code>else</code> and leaves with an F. Nobody walks out of this hallway without a grade.</p>
            <p>Two walkers worth checking by hand: exactly 90 passes the first test, because <code>&gt;=</code> means &ldquo;90 counts&rdquo;, so it earns an A. Exactly 60 just makes the B. Sneaky mistakes love to hide right at those edges.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>Edges.</strong> The boundaries sit on the <code>&gt;=</code>: 90 &rarr; A, 60 &rarr; B; switching to <code>&gt;</code> silently demotes both. The all-False path (a 40) belongs to the <code>else</code>; drop the <code>else</code> and that path assigns nothing: <code>grade</code> stays unbound and <code>print(grade)</code> raises <code>NameError</code>.</p>
            <p><strong>Exactly-one, sketch:</strong> tests run in order; the first True selects its block and ends the chain; <code>else</code> covers the all-False case. With an else, exactly one branch executes; without one, at most one.</p>
          </>
        ),
      }),
      codeLabels: ["else", "f"],
    },
    {
      id: "recap",
      label: "Exactly one path",
      connector: reg({
        base: "Read the whole ladder as one decision.",
        rigorous: "The chain, end to end: one selection.",
      }),
      actionLabel: "Done",
      takeaway: reg({
        base: "if / elif / else: tests run top-to-bottom, exactly one branch wins.",
        intuitive: "A conditional picks one road: the first test that says yes wins, the rest are skipped.",
        rigorous: "if/elif/else selects exactly one branch: the first True test in source order.",
      }),
      visual: (
        <g>
          <Ladder status={["false", "true", "skipped"]} />
          {cap("✓ exactly one branch runs · grade = B")}
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Exactly one path", title: "One question, one answer.",
        body: reg({
          base: <>An <code>if / elif / else</code> chain is a single decision: Python walks the tests top to bottom and runs the <strong>first</strong> block whose condition is True. Exactly one runs, then it continues with <code>print</code>.</>,
          intuitive: <>This whole shape is a <strong>conditional</strong>, the program&rsquo;s way of choosing. It walks the questions top to bottom, the <strong>first</strong> yes opens its door, exactly one door is used, and then the program carries on with <code>print</code>.</>,
          rigorous: <>The construct is a <strong>conditional</strong>: conditions evaluated in source order, the first satisfied branch executed. Exactly one of the three assignments runs, then control falls through to <code>print</code>.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>You now have the two halves of every program: <strong>remember</strong> values (variables) and <strong>decide</strong> with them (conditions). Next we&rsquo;ll make the program <em>repeat</em> the same steps with loops.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 2 of 7, search-space pruning:</strong> one yes/no test abandons a whole branch of code without ever running it.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>You now own the two halves of every program: <strong>remember</strong> values (variables) and <strong>decide</strong> with them (conditionals). Next we&rsquo;ll make the program <em>repeat</em> steps with loops: one decision, asked again and again.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The second big idea (2 of 7), rule it out instead of trying it:</strong> one question, and whole roads are abandoned unwalked. Later, the same move aimed at data, binary search, throws away half a million possibilities one question at a time.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model, complete:</strong> conditions are boolean expressions; the chain evaluates them in source order, executes the first satisfied block, and leaves the rest unevaluated; <code>else</code> makes the selection total. Branching plus the bindings you already have is a program that computes different things on different inputs. Next: a condition re-asked, the loop.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 2 of 7, foreshadowed as search-space pruning:</strong> a single test discards entire branches unexecuted. Aim the same move at data and you get binary search: one comparison, half the candidates gone.
            </div>
          </>
        ),
      }),
      codeLabels: ["print"],
    },
  ],
};
