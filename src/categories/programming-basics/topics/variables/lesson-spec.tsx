"use client";

import { useState } from "react";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import variablesPy from "./algorithm.py";

const VW = 860, VH = 470;
const BOX_W = 150, BOX_H = 66;

/* A labelled box: the variable's name floats above, its current value sits inside. */
function VarBox({ x, y, name, value, active, w = BOX_W }: { x: number; y: number; name: string; value: string; active?: boolean; w?: number }) {
  return (
    <g>
      <text x={x + w / 2} y={y - 12} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: active ? "var(--accent-ink)" : "var(--text-muted)" }}>{name}</text>
      <rect x={x} y={y} width={w} height={BOX_H} rx={12} fill={active ? "var(--accent-soft)" : "var(--bg-card)"} stroke={active ? "var(--accent-line)" : "var(--line)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={x + w / 2} y={y + BOX_H / 2} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 20, fill: value === "?" ? "var(--text-faint)" : "var(--text)" }}>{value}</text>
    </g>
  );
}

const caption = (t: string, x = VW / 2, y = 168) => (
  <text x={x} y={y} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-faint)" }}>{t}</text>
);

/* y for the single/centred box row */
const BY = 224;

/* ── prediction gate (the wedge): before the reveal line lands, the learner
 *    commits to what reassignment did with the OLD value. Hosted in a
 *    <foreignObject> per Predict.tsx (panels are pointer-events-none and the
 *    scene layout's note panels don't render on mobile — the canvas is the one
 *    host every viewport shares). The transparent <rect> twin keeps the scene
 *    layout's auto-centring honest about the gate's footprint. ─────────────── */
const GATE = { x: 190, y: 330, w: 480, h: 140 };

function ChangeItPredict({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <g>
      {caption("score = score + 10   →   read 0, add 10, put 10 back")}
      <VarBox x={(VW - BOX_W) / 2} y={BY} name="score" value="10" active />
      {revealed && (
        <text x={VW / 2} y={BY + BOX_H + 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>0 + 10 = 10 &mdash; the old 0 is gone</text>
      )}
      <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} fill="transparent" />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <PredictGate
          question="score held 0 a moment ago — where is that 0 now?"
          choices={[
            { id: "replaced", label: "gone — replaced", correct: true, note: "one name, one value — the 10 took its place" },
            { id: "stacked", label: "still under the 10", note: "a variable has no layers — it holds exactly one value" },
            { id: "autosaved", label: "saved automatically", note: "nothing keeps an old value unless you store it somewhere yourself" },
          ]}
          api={api}
          onRevealed={() => setRevealed(true)}
        />
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 6 beats (need, create, update, use, types, recap)
 *   structured : 5 — cuts `types` (the slot-6 generalization)
 *   rigorous   : 2 — `update` (the model: evaluate-then-rebind, gate included)
 *                  + `recap` (name + close); create/use/types essentials are
 *                  folded into those two beats' rigorous prose.
 *   refresh    : additionally trims `need` + `types` (trimOnRefresh).          */
export const variablesLesson: LessonSpec = {
  topicTitle: "variables · a labelled box",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: variablesPy as string,
  // Front door of the whole platform — deliberately NO bridgeFrom.
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 1): the close frames it as the
  // SEED of information reuse, not a claim that variables are the algorithm idea.
  principle: { key: "information-reuse", n: 1, total: 7 },
  beats: [
    {
      id: "need",
      label: "The need",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Make a box",
      takeaway: "A program needs to remember values to use them later.",
      visual: (
        <g>
          {caption("you need to remember a number to use later")}
          <VarBox x={(VW - BOX_W) / 2} y={BY} name="score" value="?" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The need", title: "Hold onto a value.",
        body: <>A program that can&rsquo;t remember anything can&rsquo;t do much. You need a place to <strong>keep a value</strong> &mdash; a player&rsquo;s score, a name, a total &mdash; and get it back later.</>,
      }],
      detail: (
        <>
          <p>Think of a labelled box. You write a name on it &mdash; <code>score</code> &mdash; and you can drop a value inside, look at what&rsquo;s in there whenever you want, and swap it for something new.</p>
          <p>That box is a <strong>variable</strong>. Everything else in programming is built on top of remembering values this way.</p>
        </>
      ),
      codeLabels: ["create"],
    },
    {
      id: "create",
      label: "Create it",
      registers: ["intuitive", "structured"],
      connector: "So we make the box and put something in it.",
      actionLabel: "Now change it",
      takeaway: reg({
        base: "name = value stores a value under that name.",
        intuitive: "Writing name = value makes a labelled box holding that value.",
      }),
      visual: (
        <g>
          {caption("score = 0   →   the value 0 goes into the box named score")}
          <VarBox x={(VW - BOX_W) / 2} y={BY} name="score" value="0" active />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Create it", title: "score = 0",
        body: reg({
          base: <>Write the name, an <code>=</code>, then the value. <code>score = 0</code> makes a box called <code>score</code> and puts <code>0</code> in it.</>,
          intuitive: <>Three things, in order: a name, the <code>=</code> sign, a value. <code>score = 0</code> says &ldquo;label a box <code>score</code> and drop <code>0</code> inside.&rdquo; From now on the program remembers it.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The <code>=</code> here is <strong>not</strong> &ldquo;equals&rdquo; like in maths. It&rsquo;s an <Term word="assignment">assignment</Term>: &ldquo;take the value on the right and store it in the name on the left.&rdquo;</p>
            <p>Read it right-to-left: compute <code>0</code>, then put it in <code>score</code>.</p>
          </>
        ),
        intuitive: (
          <>
            <p>One warning about <code>=</code>: in maths it claims two sides are equal. Here it&rsquo;s a command &mdash; an <Term word="assignment">assignment</Term>: &ldquo;work out whatever is on the right, then store it under the name on the left.&rdquo;</p>
            <p>So read <code>score = 0</code> right to left: get <code>0</code> ready, then tuck it into the box labelled <code>score</code>. The box exists from this moment on.</p>
          </>
        ),
      }),
      codeLabels: ["create"],
    },
    {
      id: "update",
      label: "Change it",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "The whole point of a box is that what's inside can change.",
        rigorous: "",
      }),
      actionLabel: reg({
        base: "Use the value",
        rigorous: "Name the idea",
      }),
      takeaway: reg({
        base: "Reassigning replaces the old value — right side first, then store.",
        intuitive: "Changing a box swaps its value — the old one is pushed out, not kept.",
        rigorous: "Assignment rebinds: evaluate the right side, rebind the name, old binding gone.",
      }),
      visual: (api) => <ChangeItPredict api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Change it", title: "score = score + 10",
        body: reg({
          base: <>The right side is worked out <em>first</em> using the current value, then the answer is stored back. <code>score</code> was <code>0</code>, so this puts <code>10</code> in.</>,
          intuitive: <>Run the right side first, using what&rsquo;s in the box right now: <code>score + 10</code> means <code>0 + 10</code>, which is <code>10</code>. Then that <code>10</code> is stored back into <code>score</code>. A box holds just one thing &mdash; so what about the 0?</>,
          rigorous: <>The right-hand side is evaluated <em>first</em>, against the current binding (<code>score</code> &rarr; <code>0</code>); then <code>=</code> rebinds the name to the result. One name, one binding &mdash; assignment replaces it.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>This looks strange as maths (<code>score = score + 10</code>?!) but makes perfect sense as assignment: <strong>read</strong> the current <code>score</code> (0), <strong>add</strong> 10, then <strong>store</strong> the result (10) back in the same box.</p>
            <p>The previous value is simply overwritten &mdash; a box only ever holds one thing at a time.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Reading <code>score = score + 10</code> like maths feels broken &mdash; nothing can equal itself plus ten. But it&rsquo;s not a claim, it&rsquo;s an instruction with three small steps: <strong>read</strong> the box (it holds 0), <strong>work out</strong> 0 + 10, <strong>store</strong> the 10 back in.</p>
            <p>And the 0? A box has no layers and no memory of its own &mdash; one value lives there at a time, so storing the 10 pushes the 0 out for good. If you wanted to keep the 0, you&rsquo;d need to put it in another box first.</p>
          </>
        ),
        rigorous: (
          <>
            <p><code>=</code> is binding, not equality: evaluate the right-hand side fully, then bind the name on the left to the result. Here <code>score + 10</code> reads the current binding (0), yields 10, and <code>score</code> is rebound to it. The old value isn&rsquo;t altered &mdash; it&rsquo;s simply no longer reachable through this name.</p>
            <p><strong>Rebinding vs mutation:</strong> rebinding points the name at a new value; mutation changes a value in place while the binding stays put. Python ints are immutable, so <code>score = score + 10</code> is always a rebind &mdash; the distinction starts to matter with mutable containers later.</p>
          </>
        ),
      }),
      codeLabels: ["update"],
      interaction: "wedge",
    },
    {
      id: "use",
      label: "Use it",
      registers: ["intuitive", "structured"],
      connector: "Once a value is stored, you can read it anywhere — including to make new values.",
      actionLabel: reg({
        base: "Hold other things",
        structured: "See it together",
      }),
      takeaway: reg({
        base: "Read a variable by name; it stands in for its value.",
        intuitive: "Using a box's name hands you its value — reading never empties it.",
      }),
      visual: (
        <g>
          {caption("bonus = score * 2   →   read score (10), make a new box")}
          <VarBox x={200} y={BY} name="score" value="10" />
          <VarBox x={510} y={BY} name="bonus" value="20" active />
          {/* flow arrow score -> bonus */}
          <line x1={200 + BOX_W} y1={BY + BOX_H / 2} x2={510} y2={BY + BOX_H / 2} stroke="var(--accent-line)" strokeWidth={1.5} markerEnd="url(#lesson-arrow)" />
          <text x={(200 + BOX_W + 510) / 2} y={BY + BOX_H / 2 - 10} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>&times; 2</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Use it", title: "bonus = score * 2",
        body: reg({
          base: <>Using a variable just means writing its name. <code>score</code> stands in for its value (<code>10</code>), so <code>score * 2</code> is <code>20</code> &mdash; stored in a brand-new box, <code>bonus</code>.</>,
          intuitive: <>Anywhere you write a box&rsquo;s name, the program swaps in whatever the box holds at that moment. <code>score</code> holds <code>10</code>, so <code>score * 2</code> works out to <code>20</code> &mdash; and that lands in a brand-new box, <code>bonus</code>.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Wherever you write <code>score</code>, the program swaps in whatever value the box currently holds. Reading it doesn&rsquo;t empty the box &mdash; <code>score</code> is still <code>10</code> afterwards.</p>
          </>
        ),
        intuitive: (
          <>
            <p>This is the payoff of naming things: store a value once, then <em>reuse it by name</em> wherever you need it &mdash; no re-typing it, no working it out again.</p>
            <p>And reading is gentle: looking at <code>score</code> doesn&rsquo;t empty or change the box. After <code>bonus = score * 2</code>, <code>score</code> still holds <code>10</code>.</p>
          </>
        ),
      }),
      codeLabels: ["use"],
    },
    {
      id: "types",
      label: "Any kind of value",
      registers: ["intuitive"],
      trimOnRefresh: true,
      connector: "Boxes aren't only for numbers.",
      actionLabel: "See it together",
      takeaway: "A variable can hold any type of value — numbers, text, more.",
      visual: (
        <g>
          {caption("name = \"Ada\"   →   a box can hold text too")}
          <VarBox x={(VW - 180) / 2} y={BY} name="name" value="Ada" active w={180} />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Any kind of value", title: 'name = "Ada"',
        body: <>The same idea holds any kind of value. Text (in quotes) is a <Term word="string">string</Term>; you&rsquo;ve already seen whole numbers. The box doesn&rsquo;t care what it holds.</>,
      }],
      detail: (
        <>
          <p>Numbers, text, <Term word="boolean"><code>True</code>/<code>False</code></Term>, and bigger things later (lists, and so on) all live in variables the same way. The quotes around <code>&quot;Ada&quot;</code> are how Python knows it&rsquo;s text, not a name to look up.</p>
        </>
      ),
      codeLabels: ["another"],
    },
    {
      id: "recap",
      label: "Put together",
      connector: reg({
        base: "Three boxes, each remembering one value — that's a tiny program.",
        rigorous: "All five lines have run: three names bound — that is the program's entire state.",
      }),
      actionLabel: "Done",
      takeaway: reg({
        base: "Variables are named boxes you read, reuse, and reassign.",
        intuitive: "A variable is a named box: make it with =, read it by name, change it anytime.",
        rigorous: "A variable binds a name to one value — assign to rebind, read to reuse.",
      }),
      visual: (
        <g>
          {caption("three named boxes — the program's memory")}
          <VarBox x={120} y={BY} name="score" value="10" />
          <VarBox x={355} y={BY} name="bonus" value="20" />
          <VarBox x={590} y={BY} name="name" value="Ada" />
          <text x={VW / 2} y={BY + BOX_H + 34} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text-faint)" }}>print(name, score, bonus)  &rarr;  Ada 10 20</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Put together",
        title: reg({
          base: "The program's memory",
          rigorous: "A variable: a name bound to a value.",
        }),
        body: reg({
          base: <>Each line made or changed a box; together they&rsquo;re what the program <em>remembers</em>. <code>print</code> just reads the boxes back out.</>,
          intuitive: <>Every line so far made a box or changed one. Those boxes are everything the program knows right now &mdash; and <code>print</code> simply reads three of them back out by name.</>,
          rigorous: <>Five statements, three live bindings. <code>print</code> resolves each name to its current value at call time. Names carry no type &mdash; the values do &mdash; so any name could be rebound to a different kind of value next line.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the whole idea: a variable is a <strong>name bound to a value</strong>. Create with <code>=</code>, read by writing the name, change by assigning again.</p>
            <p>Tip: when a value should <em>never</em> change, programmers write its name in <code>UPPER_CASE</code> (like <code>MAX_SCORE = 100</code>) as a signal &mdash; that&rsquo;s a <Term word="constant">constant</Term>.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 1 of 7 &mdash; information reuse:</strong> name a value once and nothing has to be figured out twice.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>The move you just learned has a proper name: a <strong>variable</strong> &mdash; a name attached to a value. Make one with <code>=</code>, read it by writing its name, change it by assigning again. Everything else in programming stands on this.</p>
            <p>One habit worth copying early: when a value should <em>never</em> change, programmers write its name in capitals &mdash; like <code>MAX_SCORE = 100</code> &mdash; as a signal to each other. That&rsquo;s called a <Term word="constant">constant</Term>.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The first big idea (1 of 7) &mdash; reuse what you already know:</strong> once a value has a name, you never work it out again &mdash; you just ask for it.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model, complete:</strong> a variable is a name bound to a value. Assignment binds (or rebinds) the name to the fully evaluated right-hand side; reading a name yields its current value and never changes the binding; names are untyped &mdash; values carry the type.</p>
            <p><code>UPPER_CASE</code> names mark constants &mdash; a convention only, nothing enforced.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 1 of 7, foreshadowed &mdash; information reuse:</strong> bind once, reference everywhere; nothing is computed twice.
            </div>
          </>
        ),
      }),
      codeLabels: ["read"],
    },
  ],
};
