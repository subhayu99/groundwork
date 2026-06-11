"use client";

import { useState } from "react";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import { Box, Cap, VW, VH } from "../../_shared";
import functionsPy from "./algorithm.py";

const MX = 350, MY = 214, MW = 220, MH = 108;

/** The function as a machine: inputs flow in on the left, the result comes out the right. */
function Machine({ wv, hv, out, lit }: { wv: string; hv: string; out: string; lit?: boolean }) {
  const inChip = (y: number, label: string) => (
    <g>
      <rect x={150} y={y} width={120} height={34} rx={8} fill="var(--bg-card)" stroke="var(--line)" strokeWidth={1.5} />
      <text x={210} y={y + 17} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>{label}</text>
      <line x1={270} y1={y + 17} x2={MX} y2={y + 17} stroke="var(--accent-line)" strokeWidth={1.5} markerEnd="url(#lesson-arrow)" opacity={0.6} />
    </g>
  );
  return (
    <g>
      {inChip(MY + 14, wv)}
      {inChip(MY + 60, hv)}
      <rect x={MX} y={MY} width={MW} height={MH} rx={14} fill={lit ? "var(--accent-soft)" : "var(--bg-card-hi)"} stroke={lit ? "var(--accent-line)" : "var(--line-strong)"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
      <text x={MX + MW / 2} y={MY + 30} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--accent-ink)" }}>area(width, height)</text>
      <text x={MX + MW / 2} y={MY + 64} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-muted)" }}>return</text>
      <text x={MX + MW / 2} y={MY + 84} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-muted)" }}>width * height</text>
      <line x1={MX + MW} y1={MY + MH / 2} x2={615} y2={MY + MH / 2} stroke={out === "?" ? "var(--line)" : "var(--accent-line)"} strokeWidth={1.5} markerEnd="url(#lesson-arrow)" />
      <Box x={615} y={MY + MH / 2 - 20} w={110} h={40} value={out} active={out !== "?"} tone="good" />
    </g>
  );
}

/* ── prediction gate (the wedge): a second area is needed, and BEFORE the lit
 *    result lands the learner commits to the move — copy the formula again,
 *    edit the definition, or call the one machine with new inputs. Hosted in a
 *    <foreignObject> per Predict.tsx (panels are pointer-events-none and the
 *    scene layout's note panels don't render on mobile — the canvas is the one
 *    host every viewport shares). The transparent <rect> twin keeps the scene
 *    layout's auto-centring honest about the gate's footprint. The original
 *    caption and the lit out=20 box would spoil the prediction, so they reveal
 *    on tap (per the variables exemplar). ───────────────────────────────────── */
const GATE = { x: 170, y: 334, w: 520, h: 132 };

function ReuseCallPredict({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <g>
      {revealed
        ? <Cap>area(10, 2) → 20   ·   one definition, any inputs</Cap>
        : <Cap>the hall is 10 by 2 — and the machine is already built</Cap>}
      <Machine wv="10" hv="2" out={revealed ? "20" : "?"} lit={revealed} />
      <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} fill="transparent" />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <PredictGate
          question="The hall is 10 by 2 — how does the program get its area?"
          choices={[
            { id: "copy", label: "write width * height again", note: "the copy-paste trap from the start — one typo in one copy and they quietly disagree" },
            { id: "call", label: "call area(10, 2)", correct: true, note: "the same definition runs again — the blanks fill fresh at every call" },
            { id: "edit", label: "change the def line to 10 and 2", note: "that would re-aim the machine for everyone — values arrive at the call; the definition stays put" },
          ]}
          api={api}
          onRevealed={() => setRevealed(true)}
        />
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 5 beats (need, define, call, reuse, recap)
 *   structured : 5 — the on-ramp is already fused (need carries the
 *                copy-paste cost, the slot-2 seed), so nothing cuts safely.
 *   rigorous   : 3 — `call` (the model: evaluate args, bind, run, the call
 *                becomes its value; def's essentials folded into its prose)
 *                + `reuse` (the win + edge cases, gate included)
 *                + `recap` (name + close).
 *   refresh    : additionally trims `need` (trimOnRefresh).                    */
export const functionsLesson: LessonSpec = {
  topicTitle: "functions · inputs in, answer out",
  layout: "scene",
  canvas: { width: VW, height: VH },
  codeSource: functionsPy as string,
  // standing on conditionals (TRACK-NARRATIVES row 8): the learner can already
  // make a program choose a branch — now whole blocks of steps get a name.
  bridgeFrom: reg({
    base: "Your program can already choose — one test, one branch runs. Now fold a whole block of steps under a single name.",
    intuitive: "Your program can pick a road with a yes/no test — now bottle a run of steps under one name you press like a button.",
    rigorous: "Branching selects which statements run; a function names a parameterized block — define once, call anywhere.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 8): a program becomes smaller
  // named problems — the SEED of decomposition, not its proof.
  principle: { key: "decomposition", n: 4, total: 7 },
  beats: [
    {
      id: "need",
      label: "Name a set of steps",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Define it",
      takeaway: "A function packages steps under a name so you reuse, not repeat.",
      visual: <g><Cap>the same calculation, needed in many places</Cap><Machine wv="width" hv="height" out="?" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Name a set of steps", title: "Bottle up a calculation.",
        body: reg({
          base: <>You keep needing the same steps &mdash; the area of a room, then a hall, then a desk. Copy-pasting <code>width * height</code> everywhere is error-prone. A <Term word="function">function</Term> lets you write it <strong>once</strong>, give it a name, and reuse it.</>,
          intuitive: <>The same steps keep coming up &mdash; the area of a room, then a hall, then a desk. Copying <code>width * height</code> around invites typos, and a fix has to be hunted down in every copy. A <Term word="function">function</Term> is the way out: write the steps <strong>once</strong>, name them, and from then on use the name.</>,
        }),
      }],
      detail: reg({
        base: <><p>Think of a machine: you feed values in, it does its work, and hands a result back. Define the machine once; press its button as often as you like.</p></>,
        intuitive: (
          <>
            <p>Picture a little machine: you drop values in, it does its work, and hands one answer back out. Build the machine once; press its button as often as you like.</p>
            <p>That&rsquo;s all a function is &mdash; and most of programming turns out to be building small machines and snapping them together.</p>
          </>
        ),
      }),
      codeLabels: ["def"],
    },
    {
      id: "define",
      label: "def — the recipe",
      registers: ["intuitive", "structured"],
      connector: "First write the machine, with blanks for its inputs.",
      actionLabel: "Press the button",
      takeaway: reg({
        base: "def names the function; its parameters are blanks filled in later.",
        intuitive: "def files the recipe under a name — the blanks wait, nothing runs yet.",
      }),
      visual: <g><Cap>def area(width, height): return width * height   ·   not run yet</Cap><Machine wv="width" hv="height" out="?" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "def — the recipe", title: "def area(width, height):",
        body: reg({
          base: <><code>def</code> defines a function. <code>width</code> and <code>height</code> are <Term word="parameter">parameters</Term> &mdash; named blanks for the inputs. The indented body is the recipe; <code>def</code> just stores it &mdash; nothing runs yet.</>,
          intuitive: <>The word <code>def</code> is short for &ldquo;define&rdquo; &mdash; it builds the machine. <code>width</code> and <code>height</code> are <Term word="parameter">parameters</Term>: named blanks, waiting for real values. The <Term word="indented">indented</Term> lines underneath are the steps themselves &mdash; and here&rsquo;s the surprise: <code>def</code> only files them away. Nothing runs yet.</>,
        }),
      }],
      detail: reg({
        base: <><p>The <code>return</code> line says what the function hands back. Defining is like writing a recipe card and filing it away &mdash; no cooking happens until someone actually calls it.</p></>,
        intuitive: (
          <>
            <p>The <code>return</code> line is the machine&rsquo;s out-tray: whatever it works out is what gets handed back.</p>
            <p>Defining is writing a recipe card and filing it in a drawer. The kitchen stays cold &mdash; no cooking happens until someone actually asks for the dish.</p>
          </>
        ),
      }),
      codeLabels: ["def", "return"],
    },
    {
      id: "call",
      label: "call — fill the blanks",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "Now actually use it with real values.",
        rigorous: "",
      }),
      actionLabel: "Use it again",
      takeaway: reg({
        base: "Calling fills the parameters with arguments; return hands a value back.",
        intuitive: "Calling the machine fills its blanks, runs the steps, and hands one answer back.",
        rigorous: "A call binds arguments to parameters and evaluates to its returned value.",
      }),
      visual: <g><Cap>area(4, 3): width = 4, height = 3 → returns 12</Cap><Machine wv="4" hv="3" out="12" lit /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "call — fill the blanks", title: "room = area(4, 3)",
        body: reg({
          base: <>Writing <code>area(4, 3)</code> <strong>calls</strong> it: <code>4</code> fills <code>width</code>, <code>3</code> fills <code>height</code> (these are the <Term word="argument">arguments</Term>). The body runs, <code>return</code> hands back <code>12</code>, and that value lands in <code>room</code>.</>,
          intuitive: <>Writing <code>area(4, 3)</code> presses the button &mdash; that&rsquo;s a <strong>call</strong>. The <code>4</code> drops into the <code>width</code> blank, the <code>3</code> into <code>height</code>; values you pass in are called <Term word="argument">arguments</Term>. The steps run, <code>return</code> hands back <code>12</code>, and the <code>12</code> lands in the box named <code>room</code>.</>,
          rigorous: <>A call: evaluate the arguments, bind them to the parameters (<code>width</code>&rarr;<code>4</code>, <code>height</code>&rarr;<code>3</code>) in a fresh local <Term word="frame">frame</Term>, run the body. <code>return</code> ends the call, and <code>area(4, 3)</code> evaluates to <code>12</code> &mdash; bound to <code>room</code>.</>,
        }),
      }],
      detail: reg({
        base: <><p>The returned value <em>replaces</em> the call: <code>room = area(4, 3)</code> becomes <code>room = 12</code>. A function call is just an expression that stands in for whatever it returns.</p></>,
        intuitive: (
          <>
            <p>Here&rsquo;s the quiet superpower: when the machine finishes, the whole call <em>becomes</em> its answer. <code>room = area(4, 3)</code> turns into <code>room = 12</code> &mdash; as if the <code>12</code> had been typed right there.</p>
            <p>That makes a call an <Term word="expression">expression</Term> &mdash; a piece of code that stands for a value &mdash; so it can go anywhere a value can: stored in a box, printed, even fed into another call.</p>
          </>
        ),
        rigorous: (
          <>
            <p><code>def</code> ran earlier and did exactly one thing: bound the name <code>area</code> to the stored body &mdash; nothing executed at definition time. Execution is per call: arguments are evaluated first, parameters bind in a fresh <Term word="frame">frame</Term> on the <Term word="call stack">call stack</Term>, the body runs until <code>return</code>, the frame is discarded.</p>
            <p>The call expression stands for the returned value &mdash; <code>room = area(4, 3)</code> assigns <code>12</code> &mdash; so calls compose anywhere an expression can appear.</p>
          </>
        ),
      }),
      codeLabels: ["call1", "return"],
    },
    {
      id: "reuse",
      label: "Reuse it",
      connector: reg({
        base: "Same machine, brand new inputs.",
        rigorous: "A second use arrives — commit to the move before it runs.",
      }),
      actionLabel: "Sum up",
      takeaway: reg({
        base: "Define once, call many times with different inputs.",
        intuitive: "One recipe, many calls — every call fills the blanks fresh.",
        rigorous: "One definition serves every call site; parameters rebind per call, then vanish.",
      }),
      visual: (api) => <ReuseCallPredict api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Reuse it", title: "hall = area(10, 2)  →  20",
        body: reg({
          base: <>Call it again with different arguments and you get a different answer &mdash; <code>20</code> &mdash; from the very same definition. That&rsquo;s the whole point: write the logic once, reuse it everywhere.</>,
          intuitive: <>Press the button again with new values and the very same machine hands back a new answer &mdash; <code>20</code>. The blanks fill fresh on every call; nothing from last time lingers. Build once, press anywhere.</>,
          rigorous: <>A second call site, same definition: <code>area(10, 2)</code> rebinds the parameters in a new frame and returns <code>20</code>. Call sites multiply; the definition doesn&rsquo;t &mdash; and a fix lands once, for every caller.</>,
        }),
      }],
      detail: reg({
        base: <><p>If the formula ever changes, you fix it in <strong>one</strong> place and every call updates. Functions are how programs stay small even as they do more.</p></>,
        intuitive: (
          <>
            <p>This is the payoff of giving steps a name: if the formula was ever wrong, you fix the recipe card <em>once</em> and every call everywhere serves the corrected answer. More calls, never more copies &mdash; that&rsquo;s how programs stay small while doing more.</p>
            <p>One quiet detail: the blanks really do empty between calls. <code>width</code> and <code>height</code> exist only while the machine runs &mdash; after <code>return</code> they&rsquo;re gone, ready to be filled fresh next time.</p>
          </>
        ),
        rigorous: (
          <>
            <p><strong>One definition, n call sites:</strong> a change propagates to every caller. Parameters are locals &mdash; bound at call time, alive only in that call&rsquo;s frame, gone on return; they never collide with outer names, and two calls never share state through them.</p>
            <p><strong>Edges:</strong> a body that ends without <code>return</code> (or a bare <code>return</code>) yields <code>None</code>; the wrong number of arguments raises <code>TypeError</code> before the body starts; arguments are evaluated exactly once, before binding.</p>
          </>
        ),
      }),
      codeLabels: ["call2"],
      interaction: "wedge",
    },
    {
      id: "recap",
      label: "Inputs in, answer out",
      connector: reg({
        base: "The shape of every function.",
        rigorous: "One definition, two call sites, two values — the whole mechanism on one screen.",
      }),
      actionLabel: "Done",
      takeaway: reg({
        base: "Functions: inputs (arguments) in, one result (return) out, reusable.",
        intuitive: "A function is a named machine: inputs in, one answer out, usable anywhere.",
        rigorous: "A function names a parameterized block — the unit programs decompose into.",
      }),
      visual: <g><Cap>one definition, called many times: room = 12, hall = 20</Cap><Machine wv="width" hv="height" out="?" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Inputs in, answer out",
        title: reg({
          base: "Define once, call anywhere.",
          rigorous: "A function: a name bound to a parameterized block.",
        }),
        body: reg({
          base: <>A function is a named machine: arguments go in, the body runs, a value comes back via <code>return</code>. It turns &ldquo;a block of steps&rdquo; into &ldquo;one word you can reuse.&rdquo;</>,
          intuitive: <>A function is a named machine: <Term word="argument">arguments</Term> go in, the steps run, one answer comes back through <code>return</code>. A whole block of work is now a single word you can write anywhere.</>,
          rigorous: <>A function binds a name to a parameterized block: arguments in, the body evaluates in its own frame, one value out via <code>return</code>. Programs are then built by composing named units &mdash; calls of calls.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Functions are also how you tame complexity: each one hides its steps behind a name, so bigger programs read as a few clear calls. Nearly all the code you&rsquo;ll meet lives inside functions.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 4 of 7 &mdash; decomposition:</strong> a big program becomes smaller, named problems &mdash; solve each once, then call it by name.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>Step back and look at the new power: you can hide any set of steps behind a name, then build with names. Big programs are exactly this &mdash; a few clear calls, each hiding its own steps &mdash; so they read like short stories instead of walls of code.</p>
            <p>Next lesson: the world misbehaves &mdash; and a function learns to stay standing when it does.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The fourth big idea (4 of 7) &mdash; break it into smaller problems:</strong> name a smaller problem, solve it once, and the big one becomes a few calls.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model, complete:</strong> <code>def</code> binds a name to a parameterized block; a call evaluates its arguments, binds parameters in a fresh frame, runs the body, and the call expression becomes the returned value. Locals die with the frame; a missing <code>return</code> yields <code>None</code>.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 4 of 7, foreshadowed &mdash; decomposition:</strong> a program becomes smaller named problems &mdash; recursion and divide-and-conquer grow from this seed.
            </div>
          </>
        ),
      }),
      codeLabels: ["print"],
    },
  ],
};
