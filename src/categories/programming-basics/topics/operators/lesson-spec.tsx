"use client";

import { useState } from "react";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import { Cap, VW } from "../../_shared";
import operatorsPy from "./algorithm.py";

const ROWS = [
  { kind: "arithmetic", expr: "3 + 4 * 2", result: "11", tone: "accent" as const },
  { kind: "comparison", expr: "total > 10", result: "True", tone: "good" as const },
  { kind: "logical", expr: "is_big and total < 100", result: "True", tone: "good" as const },
];

const RY = 196, RH = 50, RGAP = 22, EX = 196, EW = 330, RES_X = 600, RES_W = 120;

/** show rows up to `upto` resolved; `active` is the focused row. */
function Rows({ upto, active }: { upto: number; active: number }) {
  return (
    <g>
      {ROWS.map((r, i) => {
        const y = RY + i * (RH + RGAP);
        const on = i === active;
        const resolved = i <= upto;
        const resTone = r.tone === "good" ? "var(--diff-easy)" : "var(--accent-line)";
        return (
          <g key={i} opacity={i <= Math.max(upto, active) ? 1 : 0.4} style={{ transition: "opacity .3s" }}>
            <text x={EX - 12} y={y + RH / 2} textAnchor="end" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 10, fill: "var(--text-faint)" }}>{r.kind}</text>
            <rect x={EX} y={y} width={EW} height={RH} rx={10} fill={on ? "var(--accent-soft)" : "var(--bg-card)"} stroke={on ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={EX + EW / 2} y={y + RH / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 15, fill: "var(--text)" }}>{r.expr}</text>
            <text x={EX + EW + 18} y={y + RH / 2} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 16, fill: "var(--text-faint)" }}>=</text>
            <rect x={RES_X} y={y + RH / 2 - 18} width={RES_W} height={36} rx={9}
              fill={resolved ? (r.tone === "good" ? "color-mix(in oklab, var(--diff-easy) 14%, var(--bg-card))" : "var(--accent-soft)") : "var(--bg-card)"}
              stroke={resolved ? resTone : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
            <text x={RES_X + RES_W / 2} y={y + RH / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 16, fill: resolved ? "var(--text)" : "var(--text-faint)" }}>{resolved ? r.result : "?"}</text>
          </g>
        );
      })}
    </g>
  );
}

/* ── prediction gate (the wedge): before row 0 resolves, the learner commits to
 *    which operator runs first — the lesson's one real fork (11 vs 14). Hosted
 *    in a <foreignObject> per Predict.tsx (panel layers are pointer-events-none
 *    and the scene layout's note panels don't render on mobile — the canvas is
 *    the one host every viewport shares). The transparent <rect> twin keeps the
 *    scene layout's auto-centring honest about the gate's footprint. The
 *    caption and the row's "11" are tap-conditional so the visual itself
 *    doesn't spoil the prediction; post-tap it is exactly the original scene.
 *    The gate sits over the two dimmed not-yet rows — decor for this beat. ── */
const GATE = { x: 190, y: 268, w: 480, h: 174 };

function PrecedencePredict({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <g>
      <Cap>{revealed ? "3 + 4 * 2 = 11, not 14 — multiply first, just like maths" : "3 + 4 * 2 — two operators, one line: something has to run first"}</Cap>
      <Rows upto={revealed ? 0 : -1} active={0} />
      <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} fill="transparent" />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <PredictGate
          question="3 + 4 * 2 — which operator runs first?"
          choices={[
            { id: "plus", label: "the + — it's first, left to right", note: "code follows maths order, not reading order — the * goes first, so this makes 11, not 14" },
            { id: "times", label: "the * — multiply before add", correct: true, note: "the school order applies: 4 * 2 first, so the line makes 11, not 14" },
            { id: "parens", label: "neither — it needs parentheses", note: "parentheses are allowed but not required — Python already has one fixed order: the maths one" },
          ]}
          api={api}
          onRevealed={() => setRevealed(true)}
        />
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 5 beats (need, arith, compare, logical, recap)
 *   structured : all 5 — the lesson has no slot-2 "obvious thing" to fold away
 *   rigorous   : 3 — `arith` (the evaluation model, gate included)
 *                  + `logical` (edge cases; comparison essentials folded into
 *                    its rigorous prose) + `recap` (name + close).
 *   refresh    : additionally trims `need` (trimOnRefresh).                   */
export const operatorsLesson: LessonSpec = {
  topicTitle: "operators · combining values",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: operatorsPy as string,
  // standing on variables (the bridge anchor per TRACK-NARRATIVES.md): a name
  // stands in for its value — this lesson is how stored values combine.
  bridgeFrom: reg({
    base: "A name stands in for its value wherever you write it — now combine those values into new ones.",
    intuitive: "You can make a named box and read it back by name — next: turning what your boxes hold into new values.",
    rigorous: "Names bind values; reading a name yields its value — operators are how bound values combine into new ones.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 4): big expressions evaluate as
  // small ones combined — the SEED of decomposition, not a claim it IS it.
  principle: { key: "decomposition", n: 4, total: 7 },
  beats: [
    {
      id: "need",
      label: "Combine values",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Do the maths",
      takeaway: reg({
        base: "Operators take values and produce a new one.",
        intuitive: "An operator is a tiny machine: values go in, one new value comes out.",
      }),
      visual: <g><Cap>operators take values in and give a new value out</Cap><Rows upto={-1} active={-1} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Combine values", title: "Turn values into new values.",
        body: reg({
          base: <>Storing values is half of it; the other half is <strong>combining</strong> them. An <Term word="operator">operator</Term> like <code>+</code> or <code>&gt;</code> takes one or two values and works out a result. Three families do almost everything.</>,
          intuitive: <>Your named boxes can <em>hold</em> a score or a total &mdash; but a program also has to <strong>do</strong> things with them: add the score, check the total. An <Term word="operator">operator</Term> is the doing part &mdash; a symbol like <code>+</code> or <code>&gt;</code> (&ldquo;greater than&rdquo;) that takes one or two values and works out one new value. Three families of them do almost everything.</>,
        }),
      }],
      detail: reg({
        base: <><p>An <Term word="expression">expression</Term> is any piece of code that works out to a value &mdash; <code>3 + 4 * 2</code>, <code>total &gt; 10</code>. Operators are how you build them.</p></>,
        intuitive: (
          <>
            <p>Any piece of code that works out to a value has a name: an <Term word="expression">expression</Term>. <code>3 + 4 * 2</code> is one; so is <code>total &gt; 10</code>. Operators are the joints inside an expression &mdash; each one takes the values beside it and turns them into one new value.</p>
            <p>The canvas shows the three families, one row each. By the end of this page you&rsquo;ll read all three rows at a glance.</p>
          </>
        ),
      }),
      codeLabels: ["arith"],
    },
    {
      id: "arith",
      label: "Arithmetic",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "Start with ordinary maths.",
        rigorous: "",
      }),
      actionLabel: "Compare them",
      takeaway: reg({
        base: "Arithmetic (+ - * / ) follows maths order: × and ÷ before + and −.",
        intuitive: "Maths symbols in code follow school order: multiply and divide before add and subtract.",
        rigorous: "Arithmetic follows precedence — multiplicative before additive; parentheses override.",
      }),
      visual: (api) => <PrecedencePredict api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Arithmetic", title: "3 + 4 * 2  →  11",
        body: reg({
          base: <>The familiar ones: <code>+ - * /</code>. They obey the same <strong>order</strong> you learned in school &mdash; <code>*</code> and <code>/</code> happen before <code>+</code> and <code>-</code> &mdash; so <code>3 + 4 * 2</code> is <code>11</code>. Use parentheses to force a different order.</>,
          intuitive: <>The maths family: <code>+ - * /</code> (<code>*</code> is multiply, <code>/</code> is divide). They run in the order you learned at school &mdash; multiply and divide first, then add and subtract &mdash; never simply left to right. Commit to a guess below, then watch the row resolve. Parentheses, as in <code>(3 + 4) * 2</code>, force a different order.</>,
          rigorous: <>Standard precedence: <code>* / // %</code> bind tighter than <code>+ -</code>; equal precedence associates left to right; parentheses override. So <code>3 + 4 * 2</code> groups as <code>3 + (4 * 2)</code>. Commit below, then the row resolves.</>,
        }),
      }],
      detail: reg({
        base: <><p>Two handy extras: <code>//</code> divides and drops the remainder (<code>7 // 2 = 3</code>), and <code>%</code> gives just the remainder (<code>7 % 2 = 1</code>). Both work on numbers (integers or decimals), not on text.</p></>,
        intuitive: (
          <>
            <p>Why 11 and not 14? Code isn&rsquo;t read like a sentence. Python follows the order of operations from school maths: multiplication and division first, then addition and subtraction. So <code>4 * 2</code> happens first (8), then <code>3 + 8</code> &mdash; 11. Want the adding first? Say so with parentheses: <code>(3 + 4) * 2</code> is 14.</p>
            <p>Two extras you&rsquo;ll meet constantly: <code>7 // 2</code> is <code>3</code> &mdash; divide, then <em>drop</em> the leftover. <code>7 % 2</code> is <code>1</code> &mdash; keep <em>only</em> the leftover. Leftover-maths sounds niche but shows up everywhere: is a number even? did the counter wrap around?</p>
          </>
        ),
        rigorous: (
          <>
            <p>Evaluation is recursive: each operand is itself an expression, fully evaluated before its operator applies &mdash; <code>3 + 4 * 2</code> is <code>+(3, *(4, 2))</code>. Precedence only decides how that tree is built; parentheses rebuild it. One associativity exception: <code>**</code> groups right, so <code>2 ** 3 ** 2</code> is <code>2 ** 9</code>.</p>
            <p>Numeric edges worth keeping loaded: <code>/</code> always yields a <Term word="float">float</Term>, even when it divides exactly; <code>//</code> floors toward negative infinity (<code>-7 // 2 == -4</code>); <code>%</code> takes the sign of the divisor. Mixed <Term word="integer">int</Term>/float arithmetic promotes to float.</p>
          </>
        ),
      }),
      codeLabels: ["arith"],
      interaction: "wedge",
    },
    {
      id: "compare",
      label: "Comparison",
      registers: ["intuitive", "structured"],
      connector: "Now ask questions about values.",
      actionLabel: "Combine answers",
      takeaway: reg({
        base: "Comparisons ( > < == ) produce a boolean — True or False.",
        intuitive: "A comparison asks a yes/no question — the answer is a value: True or False.",
      }),
      visual: <g><Cap>{"total > 10  →  True · a comparison answers a yes/no question"}</Cap><Rows upto={1} active={1} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Comparison", title: "total > 10  →  True",
        body: reg({
          base: <>Comparison operators &mdash; <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>, <code>==</code> (equal), <code>!=</code> (not equal) &mdash; don&rsquo;t give a number. They give a <Term word="boolean">boolean</Term>: <code>True</code> or <code>False</code>.</>,
          intuitive: <>Six question-askers: <code>&gt;</code> greater, <code>&lt;</code> less, <code>&gt;=</code> at least, <code>&lt;=</code> at most, <code>==</code> equal, <code>!=</code> not equal. The answer is never a number &mdash; it&rsquo;s a <Term word="boolean">boolean</Term> (a yes/no value): <code>True</code> or <code>False</code>. And it&rsquo;s a real value: <code>is_big = total &gt; 10</code> stores the answer in a box.</>,
        }),
      }],
      detail: reg({
        base: <><p>Note <code>==</code> (two equals, &ldquo;is it equal?&rdquo;) versus <code>=</code> (one equals, assignment). Mixing them up is a classic bug: <code>=</code> stores, <code>==</code> asks.</p></>,
        intuitive: (
          <>
            <p>One trap to dodge early: <code>=</code> and <code>==</code> look like twins but do opposite jobs. One equals sign <strong>stores</strong> &mdash; <code>total = 10</code> puts 10 in the box. Two equals signs <strong>ask</strong> &mdash; <code>total == 10</code> checks, and answers <code>True</code> or <code>False</code>. Read <code>=</code> as &ldquo;store&rdquo; and <code>==</code> as &ldquo;is it equal?&rdquo; and the classic beginner bug never bites.</p>
            <p>Asking is gentle, too: checking <code>total &gt; 10</code> doesn&rsquo;t change <code>total</code> &mdash; just like reading a box never emptied it.</p>
          </>
        ),
      }),
      codeLabels: ["compare"],
    },
    {
      id: "logical",
      label: "Logical",
      connector: reg({
        base: "And glue yes/no answers together.",
        rigorous: "Comparisons — >, <, >=, <=, ==, != — each yield a boolean; three operators combine them.",
      }),
      actionLabel: "See it whole",
      takeaway: reg({
        base: "and / or / not combine booleans into one True/False.",
        intuitive: "and needs both sides True; or needs either one; not flips the answer.",
        rigorous: "and / or / not compose booleans; evaluation short-circuits left to right.",
      }),
      visual: <g><Cap>{"is_big and total < 100  →  True · both sides must be True for 'and'"}</Cap><Rows upto={2} active={2} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Logical", title: "is_big and total < 100  →  True",
        body: reg({
          base: <><code>and</code>, <code>or</code>, <code>not</code> combine booleans. <code>and</code> is True only if <em>both</em> sides are; <code>or</code> if <em>either</em> is; <code>not</code> flips it. So you can ask compound questions in one go.</>,
          intuitive: <>Three glue words for yes/no answers: <code>and</code> says True only when <em>both</em> sides are True; <code>or</code> says True when <em>at least one</em> is; <code>not</code> flips the answer. So &ldquo;is it big, and still under 100?&rdquo; becomes one line with one True/False answer.</>,
          rigorous: <>Comparisons (<code>&gt; &lt; &gt;= &lt;= == !=</code>) produce booleans; <code>and</code>/<code>or</code>/<code>not</code> compose them. Evaluation short-circuits: <code>and</code> stops at a false left operand, <code>or</code> at a true one &mdash; the right side never runs. Comparisons also chain: <code>0 &lt; x &lt; 10</code> means <code>0 &lt; x and x &lt; 10</code>.</>,
        }),
      }],
      detail: reg({
        base: <><p>This is how real conditions get expressive: <code>age &gt;= 18 and has_ticket</code>. The whole thing still works out to a single <code>True</code>/<code>False</code>.</p></>,
        intuitive: (
          <>
            <p>This is where conditions start to read like English: <code>age &gt;= 18 and has_ticket</code> &mdash; &ldquo;an adult, with a ticket.&rdquo; However long the line grows, it still works out to one single <code>True</code> or <code>False</code> &mdash; one answer to one (compound) question.</p>
          </>
        ),
        rigorous: (
          <>
            <p>Edge cases that bite: <code>=</code> binds, <code>==</code> compares &mdash; Python rejects <code>=</code> inside an expression, so the classic C slip is a syntax error here, not a silent bug. Short-circuiting is load-bearing, not an optimisation: <code>x != 0 and 1 / x &lt; 1</code> is safe precisely because the division never runs when <code>x</code> is 0.</p>
            <p>Strictly, <code>and</code>/<code>or</code> return an <em>operand</em>, not necessarily a bool &mdash; <code>0 or &quot;default&quot;</code> yields <code>&quot;default&quot;</code> &mdash; and every value is truthy or falsy (<code>0</code>, <code>&quot;&quot;</code>, empty containers are falsy). That pair of rules is what makes the default-value idiom work.</p>
          </>
        ),
      }),
      codeLabels: ["logical"],
    },
    {
      id: "recap",
      label: "Three families",
      connector: reg({
        base: "Step back and see the shape.",
        rigorous: "Three families, one mechanism — name it and file it.",
      }),
      actionLabel: "Done",
      takeaway: reg({
        base: "Arithmetic makes numbers; comparison & logical make booleans for decisions.",
        intuitive: "Operators hand back numbers or yes/no answers — and yes/no is what decisions run on.",
        rigorous: "Operators split by result: arithmetic yields numbers; comparison and logical yield booleans.",
      }),
      visual: <g><Cap>{"arithmetic → numbers  ·  comparison & logical → booleans"}</Cap><Rows upto={2} active={-1} /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Three families", title: "Numbers out, or booleans out.",
        body: reg({
          base: <>Arithmetic gives you new <strong>numbers</strong>; comparison and logical give you <strong>booleans</strong>. Those booleans are exactly the fuel an <code>if</code> burns &mdash; which is where decisions come from.</>,
          intuitive: <>Every operator you met hands back one of two kinds of value: <strong>numbers</strong> (the maths family) or <strong>booleans</strong> (comparisons and the glue words). The booleans are exactly what the next lesson feeds to <code>if</code> &mdash; the line where a program starts choosing.</>,
          rigorous: <>Two result kinds: numbers (arithmetic) and booleans (comparison, logical). Expressions of any size stay tractable because evaluation is compositional &mdash; each operator consumes the values of its sub-expressions. The booleans feed <code>if</code> next.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>You now have values (variables, types) and ways to combine them (operators). Put a boolean operator inside an <code>if</code> and the program starts making choices &mdash; that&rsquo;s conditionals.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 4 of 7 &mdash; decomposition:</strong> a big expression is never solved in one go &mdash; Python works out the small pieces and combines their results.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Put together, you now own two of the three ingredients of every program: values in named boxes, and operators to combine what they hold. Each full combination &mdash; <code>3 + 4 * 2</code>, <code>is_big and total &lt; 100</code> &mdash; is an <Term word="expression">expression</Term>: code that works out to one value. Next lesson, a True/False goes inside an <code>if</code> &mdash; and the program takes one road and skips the other.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The first glimpse of idea 4 of 7 &mdash; break it into smaller pieces:</strong> even <code>3 + 4 * 2</code> isn&rsquo;t solved in one go. Python solves a small piece (<code>4 * 2</code>), then a simpler leftover (<code>3 + 8</code>). Big problems as little ones, combined &mdash; you&rsquo;ll meet this move again and again.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p>The model, complete: variables name values; operators combine them into expressions; expressions evaluate inside-out &mdash; every operand resolved before its operator applies &mdash; and conditionals consume the booleans. Result types partition the families; precedence and short-circuiting decide order.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 4 of 7, foreshadowed &mdash; decomposition:</strong> an expression is evaluated as smaller expressions combined; later, whole problems get the same treatment.
            </div>
          </>
        ),
      }),
      codeLabels: ["print"],
    },
  ],
};
