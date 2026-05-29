# Groundwork — Vision & Architecture Principles

> This file is the north star for how we build. Read it before adding features or fixing bugs.
> It exists so that every change reinforces the reusable base instead of patching one topic.

## The long game

Groundwork ships today as a DSA learning platform, but it is the **base layer** for something larger:
a **first-principles visual-learning platform for any technical concept**. DSA is only the start — the
domain list is open-ended: systems design, database architectures, distributed systems, load balancing,
sharding, OLAP/OLTP, replication & consensus, and whatever comes next.

**Core thesis: every technical concept can be broken down into simple, composable blocks.** Groundwork is
the engine that assembles those reusable blocks into lessons — across any domain. So the codebase must be
a *library of composable blocks*, not a pile of topic-specific one-offs. Every concept is taught with the
same instrument:

> **a Socratic lesson card (left) ⟷ an interactive visualizer (right) ⟷ a real, synced code panel.**

On top of that base we intend to build:

1. **AI-generated lesson pages** — a user prompts ("teach me consistent hashing") and gets a whole
   generated page: derivation steps + a visualizer + synced code. Generated pages MUST conform to the
   exact same contracts the hand-built topics use today. The cleaner and more uniform those contracts,
   the more reliably a model can target them.
2. **Community** — shareable generated pages, a library others can learn from.
3. **Freemium** — a small number of free generations, then a paid tier.

**Consequence:** the architecture we have right now is the foundation everything else stands on.
Sloppiness here compounds. So:

## Non-negotiable engineering principles

1. **Zero code duplication.** If the same logic lives in N topic files, it belongs in ONE shared
   module. A bug that recurs across topics (e.g. code↔visual sync) is fixed once, in the shared
   engine — never patched per topic.
2. **Compose, don't reimplement.** Every per-topic file composes shared primitives. A `visualizer.tsx`
   wires data into shared viz components and the `onActiveLine` contract; it does not re-build playback,
   highlighting, or layout.
3. **Stable, documented contracts.** The seams an AI generator (and future domains) will target must be
   explicit and stable:
   - **Topic bundle** — `{ meta, steps, Visualizer, pythonCode, codeMap, problems?, nextSteps?, wedge? }`.
   - **Visualizer component contract** — `({ step, onWedgeInteraction?, onActiveLine? }) => JSX`, where
     `onActiveLine(lines)` reports the code line(s) the *current on-screen operation* maps to.
   - **Code↔visual sync** — `codeMaps` (step→lines) for coarse fallback; live `onActiveLine` for
     frame-by-frame. The active line must reflect the operation just shown — never a contradicting line,
     never a comment.
   - **DerivationEngine** — the 7-step Socratic flow, gating ("wedge"), progress, completion.
   - **Shared viz primitives** — `src/shared/viz/*` (playback, grid/tree/graph/array/stack panels, tones,
     fit-to-viewport). New visualizers build from these.
4. **The three learning rules hold for every domain and every generated page** (see also the
   first-principles rules in memory):
   - 10th-grader accessible — no jargon/Big-O before it is earned (≈ step 5+).
   - Left ⟷ right sync — the card, the visualizer, and the highlighted code show the SAME example.
   - The code panel is a real, synced code viewer — the active line teaches what that line DOES to the
     picture.
5. **Audit = architecture research.** When auditing, don't just list bugs — identify the reusable pattern
   behind a class of bugs and refactor toward it, so the fix prevents the whole class.

## How current fixes must land (audit → modular fix)

The 2026-05 audit (`docs/DATA-STRUCTURES-AUDIT.md`) found the recurring failure is **code↔visual sync**:
naive steps highlight contradicting lines, comments get highlighted as "running", sliders don't update
the line, some topics bind to the wrong function, values are hardcoded. These are NOT 8 separate bugs —
they are symptoms of an under-specified sync contract. The fix is to **strengthen the shared sync layer**
and make every visualizer emit correctly through it, plus guardrails (a test that no mapped/emitted line
is a comment or out of range), rather than editing each topic in isolation.

When we touch a topic to fix it, we also ask: *what shared primitive should have made this impossible?*
— and build that.
