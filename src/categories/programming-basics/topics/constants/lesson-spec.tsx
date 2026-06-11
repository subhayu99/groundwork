"use client";

import { useState } from "react";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import { Box, Cap, VW } from "../../_shared";
import constantsPy from "./algorithm.py";

const BY = 226, BW = 200;
const cx = (VW - BW) / 2;

function Lock({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="var(--accent-ink)" strokeWidth={2} fill="none">
      <rect x={x} y={y + 7} width={16} height={12} rx={2} fill="var(--accent-soft)" />
      <path d={`M ${x + 3} ${y + 7} v-3 a5 5 0 0 1 10 0 v3`} />
    </g>
  );
}

/* ── prediction gate (the lesson's one reveal): before the verdict lands, the
 *    learner commits to what Python does with a later MAX_SCORE = 50. Hosted in
 *    a <foreignObject> per Predict.tsx (panels are pointer-events-none; the
 *    canvas is the one host every viewport shares). The transparent <rect> twin
 *    keeps the scene layout's auto-centring honest about the gate's footprint.
 *    The spoiling caption + crossed-out verdict are tap-conditional (variables-
 *    exemplar pattern): pre-tap, the pending line shows with no verdict. ────── */
const GATE = { x: 190, y: 358, w: 480, h: 112 };

function PromisePredict({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <g>
      {revealed
        ? <Cap>nothing technically stops a reassignment — the CAPS name is a promise</Cap>
        : <Cap>further down the file, this line is about to run</Cap>}
      <Box x={cx} y={BY} w={BW} name="MAX_SCORE" value="100" />
      {revealed ? (
        <g>
          <rect x={cx} y={BY + 86} width={BW} height={34} rx={9} fill="color-mix(in oklab, var(--diff-hard) 10%, var(--bg-card))" stroke="var(--diff-hard)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={cx + BW / 2} y={BY + 103} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-muted)", textDecoration: "line-through" }}>MAX_SCORE = 50</text>
          <text x={cx + BW + 14} y={BY + 103} dominantBaseline="central" style={{ fontSize: 18, fill: "var(--diff-hard)" }}>&times;</text>
        </g>
      ) : (
        <text x={cx + BW / 2} y={BY + 103} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text-muted)" }}>MAX_SCORE = 50</text>
      )}
      <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} fill="transparent" />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <PredictGate
          question="Further down the file, MAX_SCORE = 50 runs. What does Python do?"
          choices={[
            { id: "error", label: "refuses — raises an error", note: "that's what a const lock does in some languages — Python has no such lock" },
            { id: "rebinds", label: "runs it — MAX_SCORE is now 50", correct: true, note: "nothing checks the casing; the promise is kept by people, not the language" },
            { id: "ignores", label: "keeps 100 and ignores the 50", note: "assignment always wins — after that line the name holds 50" },
          ]}
          api={api}
          onRevealed={() => setRevealed(true)}
        />
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 4 beats (need, define, use, promise)
 *   structured : 4 — same beats (this short lesson already sits at the preset)
 *   rigorous   : 2 — `define` (the model: the convention IS the mechanism;
 *                  need's why + use's one-edit-point payoff fold into its
 *                  rigorous prose) + `promise` (gate + enforcement edge cases
 *                  + name/close + stamp).
 *   refresh    : additionally trims `need` (trimOnRefresh).                   */
export const constantsLesson: LessonSpec = {
  topicTitle: "constants · a value that won't change",
  layout: "scene",
  canvas: { width: VW, height: 470 },
  codeSource: constantsPy as string,
  // standing on variables (bridge anchor per TRACK-NARRATIVES.md row 2):
  // a name you can reassign at will — now the values that must never change.
  bridgeFrom: reg({
    base: "A variable is a name you can reassign at will — this lesson is about the values that must never change.",
    intuitive: "You can swap what's in a box whenever you like — but some values must stay put. Here's how we mark them.",
    rigorous: "Assignment rebinds a name at will — a constant is a binding you promise never to rebind.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 2): a value that is a kept promise
  // — the SEED of monotonicity & invariants, not a claim constants ARE the idea.
  principle: { key: "monotonicity-and-invariants", n: 3, total: 7 },
  beats: [
    {
      id: "need",
      label: "The fixed value",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Lock it in",
      takeaway: "Some values should never change — mark them so nobody does.",
      visual: (
        <g>
          <Cap>some values are settings that should never change mid-program</Cap>
          <Box x={cx} y={BY} w={BW} name="MAX_SCORE" value="100" />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The fixed value", title: "A value that stays put.",
        body: reg({
          base: <>Some values are <strong>settings</strong> &mdash; the maximum score, the price of a ticket, &pi;. They&rsquo;re used all over, and changing one by accident would be a nasty bug. We want to say &ldquo;this never changes.&rdquo;</>,
          intuitive: <>Some numbers in a program are <strong>settings</strong>: the top score you can reach, the price of one ticket, the number &pi;. They get used in lots of places &mdash; and if one changed by accident, every place that uses it would quietly go wrong. We want a way to say: &ldquo;this one never changes.&rdquo;</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>A variable can be reassigned any time &mdash; great for a score, dangerous for a setting. A <strong>constant</strong> is just a variable you&rsquo;ve decided to treat as fixed.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Last lesson&rsquo;s box can be swapped out any time you like &mdash; perfect for a score that keeps climbing, risky for a setting that has to hold still.</p>
            <p>A <strong>constant</strong> is just a variable you&rsquo;ve decided to treat as fixed. The question is how to make that decision visible to everyone reading the code &mdash; including future you.</p>
          </>
        ),
      }),
      codeLabels: ["define"],
    },
    {
      id: "define",
      label: "Name it in CAPS",
      // Appears for EVERY register — rigorous opens here, so its connector is empty.
      connector: reg({
        base: "So how do we signal 'do not change this'?",
        rigorous: "",
      }),
      actionLabel: reg({
        base: "Use it",
        rigorous: "What enforces it?",
      }),
      takeaway: reg({
        base: "UPPER_CASE names are the convention for 'don't reassign me'.",
        intuitive: "A name in capitals tells everyone: this value is not meant to change.",
        rigorous: "UPPER_CASE marks a bound-once name — one definition site, by convention only.",
      }),
      visual: (
        <g>
          <Cap>MAX_SCORE = 100   ·   the ALL-CAPS name is the signal</Cap>
          <Box x={cx} y={BY} w={BW} name="MAX_SCORE" value="100" active />
          <Lock x={cx + BW - 24} y={BY - 26} />
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Name it in CAPS", title: "MAX_SCORE = 100",
        body: reg({
          base: <>You make it exactly like a variable, but write the name in <code>UPPER_CASE</code>. That casing is a <Term word="constant">constant</Term> <Term word="convention">convention</Term> &mdash; a message to every reader: <em>this isn&rsquo;t meant to change.</em></>,
          intuitive: <>You build it exactly the way you built a variable &mdash; name, <code>=</code>, value. One difference: the name is written in capital letters. Those capitals are a <Term word="constant">constant</Term> <Term word="convention">convention</Term> &mdash; a shared habit, not a rule &mdash; telling every reader: <em>this isn&rsquo;t meant to change.</em></>,
          rigorous: <>Mechanically an ordinary <Term word="assignment">assignment</Term> &mdash; the constancy lives entirely in the name. <code>UPPER_CASE</code> is the PEP 8 convention for &ldquo;bound once, never rebound&rdquo;: define it at module top, reference it everywhere. Readers, reviewers, and linters all take the casing as the contract.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>Python doesn&rsquo;t have a special &ldquo;const&rdquo; keyword. Instead the whole community agrees: a name in <code>ALL_CAPS</code> is a constant. Tools and teammates read it the same way.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Python has no special &ldquo;make this unchangeable&rdquo; keyword. Instead, everyone who writes Python shares one habit: a name in <code>ALL_CAPS</code> means &ldquo;hands off &mdash; don&rsquo;t reassign this.&rdquo; Teammates and tools all read it the same way.</p>
            <p>So the lock in the picture isn&rsquo;t a mechanism &mdash; it&rsquo;s a label. Whether anything actually <em>stops</em> you is a question we&rsquo;ll answer in a moment.</p>
          </>
        ),
        rigorous: (
          <>
            <p>No <code>const</code> in the language &mdash; the convention does the work. The payoff is the single definition site: a raw <code>100</code> scattered through a file is n edit points and a silent-drift bug when one is missed; <code>MAX_SCORE</code> is one line to change and an unambiguous meaning at every read.</p>
          </>
        ),
      }),
      codeLabels: ["define"],
    },
    {
      id: "use",
      label: "Use it anywhere",
      registers: ["intuitive", "structured"],
      connector: "A constant is read exactly like any other value.",
      actionLabel: "The promise",
      takeaway: reg({
        base: "Read a constant by name — change it in ONE place, everywhere updates.",
        intuitive: "Write the name everywhere — then a change means fixing one line, not hunting ten.",
      }),
      visual: (
        <g>
          <Cap>percent = score / MAX_SCORE * 100   →   70.0</Cap>
          <Box x={150} y={BY} w={170} name="MAX_SCORE" value="100" />
          <Box x={540} y={BY} w={170} name="percent" value="70.0" active tone="good" />
          <line x1={320} y1={BY + 32} x2={540} y2={BY + 32} stroke="var(--accent-line)" strokeWidth={1.5} markerEnd="url(#lesson-arrow)" />
          <text x={430} y={BY + 22} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: "var(--accent-ink)" }}>score / MAX_SCORE * 100</text>
        </g>
      ),
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Use it anywhere", title: "percent = score / MAX_SCORE * 100",
        body: reg({
          base: <>Say a quiz <code>score</code> of <code>70</code> out of a <code>MAX_SCORE</code> of <code>100</code>. Wherever the limit matters, you write <code>MAX_SCORE</code> instead of a bare <code>100</code>. The code reads like English &mdash; and the meaning of that <code>100</code> is never a mystery.</>,
          intuitive: <>A quiz <code>score</code> of <code>70</code>, a <code>MAX_SCORE</code> of <code>100</code>. To get a percent you divide by the maximum &mdash; and you write its <em>name</em>, not a bare <code>100</code>. Now the line says what it means: divide by the max score. No mystery numbers.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>The real payoff: if the maximum ever <em>does</em> change, you edit <strong>one line</strong> &mdash; <code>MAX_SCORE = 100</code> &mdash; and every calculation that uses it updates at once. Hunting down scattered <code>100</code>s is exactly the bug constants prevent.</p>
          </>
        ),
        intuitive: (
          <>
            <p>Here&rsquo;s the payoff. Suppose next year the maximum becomes <code>120</code>. If you had typed <code>100</code> in ten different places, you&rsquo;d be hunting all ten &mdash; and the one you miss becomes a bug that&rsquo;s hard to spot. With a constant there is exactly <strong>one line</strong> to edit, and every calculation that uses the name updates at once.</p>
          </>
        ),
      }),
      codeLabels: ["read"],
    },
    {
      id: "promise",
      label: "A promise, not a lock",
      connector: reg({
        base: "One honest caveat about Python.",
        rigorous: "So what actually enforces the casing contract?",
      }),
      actionLabel: "Done",
      takeaway: reg({
        base: "Python won't enforce it — the CAPS name is a promise you keep.",
        intuitive: "Nothing stops a reassignment — the CAPS promise is kept by people, not Python.",
        rigorous: "Unenforced at runtime — typing.Final plus a checker makes the promise verifiable.",
      }),
      visual: (api) => <PromisePredict api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "A promise, not a lock", title: "Honest about Python.",
        body: reg({
          base: <>Python won&rsquo;t actually stop you writing <code>MAX_SCORE = 50</code> later &mdash; it just trusts you not to. The <code>ALL_CAPS</code> name is a promise to your future self and your teammates.</>,
          intuitive: <>The capitals <em>look</em> official &mdash; like the lock in the picture. But further down the file, someone writes <code>MAX_SCORE = 50</code> anyway. Before the reveal: what do you think Python does with that line? Tap your prediction.</>,
          rigorous: <>Nothing. A later <code>MAX_SCORE = 50</code> is an ordinary rebinding and the runtime runs it &mdash; the contract is social. Where it must be mechanical, annotate <code>typing.Final</code>: a static checker then rejects the rebind. The runtime never will.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the whole idea: a constant is a variable you&rsquo;ve named in <code>CAPS</code> to mark as fixed. Same mechanics as a variable; different intent.</p>
            <p>Some languages enforce it with a keyword (<code>const</code>, <code>final</code>); Python relies on the shared convention.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 3 of 7 &mdash; monotonicity &amp; invariants:</strong> a constant is your first <Term word="invariant">invariant</Term> &mdash; a fact that stays true for the whole run, so every line can lean on it without checking.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>So that&rsquo;s the whole idea, told honestly: a <strong>constant</strong> is a variable whose name is in <code>CAPS</code>, marking it as fixed. Same mechanics as a variable &mdash; different <em>intent</em>. Python will run the reassignment; your team simply never writes it.</p>
            <p>Some languages do bolt the box shut with a keyword (<code>const</code>, <code>final</code>). Python chose trust plus a naming habit &mdash; and next lesson, a name picks up a different kind of guarantee: what <em>kind</em> of value it holds.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The third big idea (3 of 7), planted early &mdash; a promise that doesn&rsquo;t break:</strong> when a value can&rsquo;t change, every line that reads it can trust it without re-checking. Whole algorithms will be built on promises kept like this &mdash; they&rsquo;re called <Term word="invariant">invariants</Term>.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The model, complete:</strong> a constant is an ordinary binding plus a kept promise &mdash; <code>UPPER_CASE</code>, bound once at module top, read everywhere, rebound never. Runtime enforcement is zero; <code>typing.Final</code> plus a type checker makes the promise machine-checked, and linters flag rebinds of capitalized names.</p>
            <p><strong>Edge case worth knowing:</strong> the promise covers the <em>binding</em>, not the value. <code>ALLOWED = [1, 2]</code> in caps still has mutable contents &mdash; <code>ALLOWED.append(3)</code> keeps the letter and breaks the spirit. Prefer immutable values (numbers, strings, tuples) for constants.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 3 of 7, foreshadowed &mdash; monotonicity &amp; invariants:</strong> a constant is the trivial <Term word="invariant">invariant</Term> &mdash; established once, true for the whole program. The loop invariants ahead are this same promise, held under iteration.
            </div>
          </>
        ),
      }),
      codeLabels: ["print"],
      interaction: "wedge",
    },
  ],
};
