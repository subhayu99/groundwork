"use client";

import { useState } from "react";
import type { BeatVisualApi, LessonSpec } from "@/shared/lesson/types";
import { Term } from "@/shared/lesson/Term";
import { PredictGate } from "@/shared/lesson/Predict";
import { reg } from "@/shared/audience/types";
import { Cap, VW } from "../../_shared";
import tryPy from "./algorithm.py";

const TX = 330, TY = 188, TW = 200, TH = 48; // try box

/** path: which route is lit — "none", "ok" (try succeeds), or "err" (jumps to except). */
function Flow({ path }: { path: "none" | "ok" | "err" }) {
  const okOn = path === "ok", errOn = path === "err";
  const okColor = okOn ? "var(--diff-easy)" : "var(--line)";
  const errColor = errOn ? "var(--diff-hard)" : "var(--line)";
  const box = (x: number, y: number, w: number, lines: string[], on: boolean, tone: "good" | "bad") => {
    const stroke = on ? (tone === "good" ? "var(--diff-easy)" : "var(--diff-hard)") : "var(--line)";
    const fill = on ? (tone === "good" ? "color-mix(in oklab, var(--diff-easy) 13%, var(--bg-card))" : "color-mix(in oklab, var(--diff-hard) 13%, var(--bg-card))") : "var(--bg-card)";
    return (
      <g opacity={on || path === "none" ? 1 : 0.45} style={{ transition: "opacity .3s" }}>
        <rect x={x} y={y} width={w} height={lines.length > 1 ? 56 : 40} rx={10} fill={fill} stroke={stroke} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} />
        {lines.map((l, i) => (
          <text key={i} x={x + w / 2} y={y + (lines.length > 1 ? 20 + i * 20 : 20)} textAnchor="middle" dominantBaseline="central" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--text)" }}>{l}</text>
        ))}
      </g>
    );
  };
  return (
    <g>
      {/* try box */}
      <rect x={TX} y={TY} width={TW} height={TH} rx={10} fill="var(--bg-card-hi)" stroke="var(--line-strong)" strokeWidth={2} />
      <text x={TX + TW / 2} y={TY + 17} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 12, fill: "var(--accent-ink)" }}>try:</text>
      <text x={TX + TW / 2} y={TY + 34} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 13, fill: "var(--text)" }}>return a / b</text>

      {/* OK path (left-down) */}
      <line x1={TX + 50} y1={TY + TH} x2={250} y2={320} stroke={okColor} strokeWidth={okOn ? 2 : 1.3} markerEnd="url(#lesson-arrow)" style={{ transition: "stroke .3s" }} />
      <text x={250} y={302} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: okOn ? "var(--diff-easy)" : "var(--text-faint)" }}>no error &darr;</text>
      {box(165, 326, 190, ["it worked", "→ returns 5.0"], okOn, "good")}

      {/* ERROR path (right-down) */}
      <line x1={TX + TW - 50} y1={TY + TH} x2={610} y2={320} stroke={errColor} strokeWidth={errOn ? 2 : 1.3} markerEnd="url(#lesson-arrow)" style={{ transition: "stroke .3s" }} />
      <text x={612} y={302} textAnchor="middle" className="font-mono select-none" style={{ fontSize: 11, fill: errOn ? "var(--diff-hard)" : "var(--text-faint)" }}>raises error &#9889;</text>
      {box(505, 326, 230, ["except ZeroDivisionError:", "→ returns 0"], errOn, "bad")}
    </g>
  );
}

/* ── prediction gate (the cost predict): before the happy-path run lights a
 *    route, the learner commits to what the except block does on a clean run —
 *    the fact the whole cost story (and the amortization stamp) stands on.
 *    One tap fires api.onInteractionDone() inside PredictGate (gate honesty);
 *    the tap also reveals the ORIGINAL ok visual (lit route + full caption),
 *    which would otherwise spoil the answer — per the variables exemplar.
 *    Hosted in a <foreignObject> per Predict.tsx (panels are pointer-events-
 *    none and note panels don't render on mobile — the canvas is the one host
 *    every viewport shares). The transparent <rect> twin keeps the scene
 *    layout's auto-centring honest about the gate's footprint. ────────────── */
const GATE = { x: 150, y: 398, w: 560, h: 150 };

function HappyPathGate({ api }: { api: BeatVisualApi }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <g>
      {revealed
        ? <Cap>safe_divide(10, 2): 10 / 2 works → returns 5.0, except skipped</Cap>
        : <Cap>safe_divide(10, 2): 10 / 2 works, no error this run</Cap>}
      <Flow path={revealed ? "ok" : "none"} />
      <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} fill="transparent" />
      <foreignObject x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} style={{ overflow: "visible" }}>
        <PredictGate
          question="10 / 2 succeeds — what does the except block do on this run?"
          choices={[
            { id: "skipped", label: "skipped entirely", correct: true, note: "a clean run never touches it — the handler exists only for trouble" },
            { id: "after", label: "runs anyway, after", note: "except is not a follow-up step — it runs only when the try raises" },
            { id: "checks", label: "checks the result", note: "nothing is double-checked — control simply never enters except" },
          ]}
          api={api}
          onRevealed={() => setRevealed(true)}
        />
      </foreignObject>
    </g>
  );
}

/* ── depth map (VOICE-AND-DEPTH / BEAT-RITUAL) ───────────────────────────────
 *   intuitive  : all 5 beats (need, try, except, ok, err)
 *   structured : all 5 — the lesson already sits at the 4–5 preset's compact end
 *   rigorous   : 3 — `except` (the model: watched region + matched jump; try's
 *                role folds into its prose) + `ok` (happy-path cost + edge
 *                cases, gate included) + `err` (the raising run + named close).
 *                The cut is the `registers` tags on `need` + `try`; the engine
 *                falls back to the full list if a cut ever empties.
 *   refresh    : additionally trims `need` + `try` (trimOnRefresh).            */
export const tryExceptLesson: LessonSpec = {
  topicTitle: "try / except · catching errors",
  layout: "focus",
  diagramShape: "line",
  canvas: { width: VW, height: 470 },
  codeSource: tryPy as string,
  // standing on functions (the bridge anchor, per TRACK-NARRATIVES.md): a
  // procedure is named and reusable — now it must survive real-world inputs.
  bridgeFrom: reg({
    base: "A function packages steps under one name you can call anywhere. But the world can hand it inputs that break it.",
    intuitive: "You can wrap steps under a name and reuse them. Now: what happens when someone hands those steps a bad input?",
    rigorous: "Functions made procedures reusable. This lesson keeps a procedure total when an input makes it raise.",
  }),
  // ⚑ foreshadow stamp (TRACK-NARRATIVES row 9): keep the common path cheap;
  // the rare failure pays — the SEED of amortization, not its proof.
  principle: { key: "amortization", n: 6, total: 7 },
  beats: [
    {
      id: "need",
      label: "Code that can fail",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      actionLabel: "Wrap it",
      takeaway: reg({
        base: "Some operations can fail at runtime, and an error stops everything.",
        intuitive: "A failing line normally crashes the whole program on the spot.",
      }),
      visual: <g><Cap>some lines can fail, and a failure crashes the whole program</Cap><Flow path="none" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "Code that can fail", title: "When a line blows up.",
        body: reg({
          base: <>Some operations can fail while running: dividing by zero, opening a missing file, bad input. By default an <Term word="exception">error</Term> like this <strong>crashes</strong> the whole program right there.</>,
          intuitive: <>Programs meet a messy world: someone types <code>0</code>, a file has gone missing, the input is garbage. When a line fails like that, Python raises an <Term word="exception">error</Term> to announce the failure, and by default the whole program <strong>stops dead</strong>, right there.</>,
        }),
      }],
      detail: reg({
        base: <><p>These runtime errors are called <strong>exceptions</strong>. <code>10 / 0</code> raises a <code>ZeroDivisionError</code>. We need a way to say &ldquo;try this, but if it fails, do something sensible instead of dying.&rdquo;</p></>,
        intuitive: (
          <>
            <p>Picture a tiny calculator that divides two numbers a user typed in. The day someone types a zero, <code>10 / 0</code> has no answer, so Python raises a <code>ZeroDivisionError</code>: an alarm that says &ldquo;this line failed, and here&rsquo;s why.&rdquo;</p>
            <p>Left alone, that alarm doesn&rsquo;t just skip the line. It ends the entire run. One bad input, everything gone. So the question of this lesson: how do you <em>attempt</em> a risky line and stay standing when it fails?</p>
          </>
        ),
      }),
      codeLabels: ["def"],
    },
    {
      id: "try",
      label: "try — attempt it",
      registers: ["intuitive", "structured"],
      trimOnRefresh: true,
      connector: "So we mark the risky part.",
      actionLabel: "And the safety net",
      takeaway: reg({
        base: "Put the risky code in a try block.",
        intuitive: "try: draws a fence around the lines that might fail.",
      }),
      visual: <g><Cap>wrap the line that might fail inside try:</Cap><Flow path="none" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "try — attempt it", title: "try:  return a / b",
        body: reg({
          base: <>Put the line that might fail inside a <code>try:</code> block. Python will <strong>attempt</strong> it, and if anything goes wrong, instead of crashing it looks for a matching <code>except</code> to handle it.</>,
          intuitive: <>First move: draw a fence around the risky line. Putting it inside a <code>try:</code> <Term word="block">block</Term> tells Python &ldquo;<strong>attempt</strong> this, and if it blows up, don&rsquo;t die; go look for my backup plan instead.&rdquo;</>,
        }),
      }],
      detail: reg({
        base: <><p>On its own, <code>try</code> changes nothing about the happy path. Its power only shows when something inside it actually raises an error.</p></>,
        intuitive: <><p>Note what <code>try</code> does <em>not</em> do: it doesn&rsquo;t fix anything, and on a good day it changes nothing at all. It only marks <em>where</em> trouble is allowed to happen: the fence Python watches while those lines run.</p></>,
      }),
      codeLabels: ["try", "divide"],
    },
    {
      id: "except",
      label: "except — catch it",
      // Appears for EVERY register — rigorous opens here, so its connector is empty
      // and its prose folds in try's role (the watched region).
      connector: reg({
        base: "What happens when it does fail?",
        rigorous: "",
      }),
      actionLabel: reg({
        base: "The good case",
        rigorous: "Price the happy path",
      }),
      takeaway: reg({
        base: "except catches a matching error and runs a recovery block instead.",
        intuitive: "If the try fails, Python jumps to except, the backup plan you wrote.",
        rigorous: "A raise exits the try at that line; the first matching except handles it.",
      }),
      visual: <g><Cap>if a matching error is raised, control jumps to except</Cap><Flow path="none" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "except — catch it", title: "except ZeroDivisionError:",
        body: reg({
          base: <>The <code>except</code> block is the safety net. If the <code>try</code> raises that kind of error, Python <strong>jumps</strong> straight to <code>except</code> and runs it, here returning <code>0</code> instead of crashing.</>,
          intuitive: <>Here&rsquo;s the backup plan. The moment the marked line fails, Python <strong>abandons it mid-step</strong> and leaps straight to the matching <code>except</code> block: here, one that calmly returns <code>0</code> instead of letting the program die.</>,
          rigorous: <>A raise inside the <code>try</code> aborts the block at that line; control transfers to the first <code>except</code> clause whose type matches (subclasses included). With no match, the exception keeps propagating up the <Term word="call stack">call stack</Term>.</>,
        }),
      }],
      detail: reg({
        base: <><p>You name the error you expect (<code>ZeroDivisionError</code>) so you only catch what you understand. Catching <em>everything</em> blindly hides real bugs, so be specific.</p></>,
        intuitive: (
          <>
            <p>Two things make the jump trustworthy. You <em>name</em> the trouble you expect, and <code>except ZeroDivisionError:</code> only catches that one kind, so a surprise you <em>didn&rsquo;t</em> plan for still stops the program loudly instead of being quietly swallowed.</p>
            <p>And the jump is one-way: Python doesn&rsquo;t go back and retry the failed line. The backup block simply takes over and finishes the job its own way.</p>
          </>
        ),
        rigorous: (
          <>
            <p>The model: <code>try</code> delimits a watched region; a raise anywhere inside it transfers control to the first matching handler. Matching is by exception type, subclass-aware, clauses tested top to bottom. The failed statement is never resumed. A raise the region doesn&rsquo;t cover (outside the <code>try</code>, or an unmatched type) propagates caller-by-caller until something matches, or the program dies with a traceback.</p>
            <p>Catch the narrowest type you can recover from: a bare <code>except:</code> also swallows the <code>TypeError</code>s from your own bugs &mdash; masking, not handling.</p>
          </>
        ),
      }),
      codeLabels: ["except", "handle"],
    },
    {
      id: "ok",
      label: "The happy path",
      connector: reg({
        base: "Run it once where nothing goes wrong.",
        rigorous: "Now price the construct on the run that doesn't raise.",
      }),
      actionLabel: "Now break it",
      takeaway: reg({
        base: "If the try succeeds, the except block is skipped entirely.",
        intuitive: "A clean run never touches except; the net is free until it's needed.",
        rigorous: "The non-raising path costs nothing; only an actual raise pays for handling.",
      }),
      visual: (api) => <HappyPathGate api={api} />,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The happy path", title: "safe_divide(10, 2)  →  5.0",
        body: reg({
          base: <>With <code>10</code> and <code>2</code>, <code>10 / 2</code> works fine. The <code>try</code> succeeds, returns <code>5.0</code>, and the <code>except</code> is <strong>skipped completely</strong>. It only exists for trouble.</>,
          intuitive: <>Hand it <code>10</code> and <code>2</code>: the division simply works. Two routes leave the <code>try</code> box. Before the run lights one up, commit: what does the <code>except</code> block do when nothing fails?</>,
          rigorous: <>On <code>safe_divide(10, 2)</code> the block runs to its <code>return</code> with the handler never consulted. The construct&rsquo;s cost sits entirely on the raising path, so predict, then confirm.</>,
        }),
      }],
      detail: reg({
        base: <><p>So <code>try/except</code> costs nothing when things go right. The safety net just sits there, unused, until it&rsquo;s needed.</p></>,
        intuitive: (
          <>
            <p>Count it like a ledger. Call this function a thousand times today with good inputs: a thousand clean runs, and the <code>except</code> block never runs once, not even a peek. The protection costs you nothing on a good day; only the rare bad call will ever pay for the detour.</p>
            <p>One honest catch while we&rsquo;re here: the net only catches the kind of trouble you <em>named</em>. Feed this function text instead of numbers and a different error (<code>TypeError</code>) sails right past <code>except ZeroDivisionError</code>, and the program still crashes. The fence is real, but it&rsquo;s not a dome.</p>
          </>
        ),
        rigorous: (
          <>
            <p>Exact cost: the non-raising path does no handler work at all. CPython (3.11+) compiles <code>try</code> to an exception table consulted only when something raises, so the happy path runs as if the <code>try</code> weren&rsquo;t there. The raising path pays: build the exception object, unwind to the handler, match, run it.</p>
            <p>Edge cases: a non-matching type (<code>TypeError</code> here) is not caught and still kills the run; only code <em>inside</em> the block is covered; a handler that itself raises starts a new propagation; a bare <code>except:</code> matches everything, including the bugs you wanted loud.</p>
          </>
        ),
      }),
      codeLabels: ["divide", "ok"],
      interaction: "wedge",
    },
    {
      id: "err",
      label: "The caught error",
      connector: "Now feed it the input that fails.",
      actionLabel: "Done",
      takeaway: reg({
        base: "try/except lets a program survive errors instead of crashing.",
        intuitive: "try/except: attempt the risky line; a caught failure runs your backup plan.",
        rigorous: "Exception handling: cheap common path; a matched handler absorbs the rare raise.",
      }),
      visual: <g><Cap>safe_divide(10, 0): 10 / 0 raises → jumps to except → returns 0</Cap><Flow path="err" /></g>,
      panels: [{
        left: 150, top: 24, width: 560, variant: "main", label: "The caught error", title: "safe_divide(10, 0)  →  0",
        body: reg({
          base: <>With <code>0</code>, <code>10 / 0</code> raises <code>ZeroDivisionError</code>. Instead of crashing, control jumps to <code>except</code>, which returns <code>0</code>. The program <strong>keeps running</strong>.</>,
          intuitive: <>Now the bad day: with a <code>0</code> underneath, <code>10 / 0</code> fails mid-line. Instead of the whole program dying, control leaps to <code>except</code>, which hands back <code>0</code>, and the program <strong>shrugs and keeps going</strong>.</>,
          rigorous: <><code>10 / 0</code> raises <code>ZeroDivisionError</code>; control lands on the matching handler, which returns <code>0</code>: the caller sees a value, not a crash. One construct, both runs covered.</>,
        }),
      }],
      detail: reg({
        base: (
          <>
            <p>That&rsquo;s the whole idea: <code>try</code> the risky thing, <code>except</code> catches the failure you anticipated, and your program stays alive and predictable. It&rsquo;s how real software handles the messy world.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of idea 6 of 7, amortization:</strong> keep the common path cheap and let the rare failure pay. Averaged over many runs, the protection is nearly free.
            </div>
          </>
        ),
        intuitive: (
          <>
            <p>The move you just derived has a proper name: <strong>exception handling</strong>. You <code>try</code> the risky thing, let <code>except</code> catch the failure you anticipated, and the program stays standing in a messy world.</p>
            <p>And a milestone: this was the last piece of the basics track. You can now read every line of the little programs the rest of this platform will show you.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>The seed of big idea 6 of 7, <Term word="amortization">amortization</Term>:</strong> 999 clean runs pay nothing extra; the one bad call pays the detour. Spread out, safety is nearly free.
            </div>
          </>
        ),
        rigorous: (
          <>
            <p><strong>The pattern: exception handling.</strong> Wrap the risky region, name the recoverable failure, return a defined fallback. Callers get a total function: every input yields a value, none a crash. Recover only where you can act; elsewhere let the exception propagate to a caller that can.</p>
            <div className="mt-1 p-3 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-line)] text-[var(--text)]">
              <strong>Idea 6 of 7, foreshadowed, amortization:</strong> zero cost on the non-raising path, bounded cost on the rare raise &mdash; the average tends to the happy path&rsquo;s.
            </div>
          </>
        ),
      }),
      codeLabels: ["zero", "handle"],
    },
  ],
};
