# Annotated-Canvas Conversion — Autonomous Run Plan & Log

**Branch:** `annotated-canvas-conversion` (do NOT touch `main` / prod while running).
**Started:** 2026-05-30, autonomous overnight run (user asleep, back in ~2–7h).

## The idea (settled with the user over this session)
Replace the "column of 7 text cards beside a diagram" lesson with a single **annotated canvas**:
the per-beat visual stays, but the explanation lives ON the visual plane (text panels placed
top/bottom/side with arrows to the exact element), the real `algorithm.py` is docked beside it with
the active line(s) following the beat, and the whole thing fills the desktop viewport (two vertical
sections on desktop: canvas+controls | code; stacked on mobile). Reference prototype:
`src/app/sandbox/annotated-canvas/page.tsx`.

## User decisions for this run
1. **Depth first.** Perfect the reusable engine + ~5 **diverse-shape** topics (fully built,
   interactive, visually verified). Scaffold the rest with specs. Lowest rework risk.
2. **Replace on the branch.** Converted topics use the new form as THE lesson; old code stays in git
   history. Reversible (it's a branch).
3. **Rewrite content freely.** Full latitude on the writing — fix the "two halves" problem (the
   class-10 kid understood the stories but got lost when unexplained `O(n)` / `arr[i]` appeared), teach
   jargon the first time it shows up, tighten/expand anywhere weak.

## The 5 archetype topics (cover every visual primitive → proves the engine generalizes)
- **array** → `binary-search` (the reference; already prototyped)
- **tree** → `trees`  (Scene/TreeViz)
- **graph** → `graphs` (Scene/GraphViz)
- **grid** → `dfs` (GridViz)
- **stack** → `stacks-queues` (StackPanel)

## In scope tonight
Engine (`src/shared/lesson/`), the 5 topics fully converted + interactive (playback + wedge) +
content rewritten + Playwright-verified, the lesson page switched to the new form for converted
topics, critic/peer-review passes (UI/UX + content) with fixes, specs for the other 15, full report.

## OUT of scope (needs the user's decisions/credentials — left for them)
Backend, auth, payments, AI-generation infra, community/persistence. The static site has no server;
these are product/infra calls, not code I can responsibly make while they sleep.

## Engine design
- `src/shared/lesson/types.ts` — the `LessonSpec` / `LessonBeat` contract (the template a topic fills).
- `src/shared/lesson/canvas.tsx` — canvas coordinate space + shared SVG helpers (cells, arrows,
  brackets, markers) any topic draws with.
- `src/shared/lesson/LessonRuntime.tsx` — the shell: full-viewport two-section layout, scale-to-fit
  canvas, text-panel overlay, docked `CodeHighlight` with per-beat `@sync` highlighting, beat nav,
  wedge gating, playback hosting, animation. One engine; N topic specs.

## Sequence
1. Contract (`types.ts`) ✅ → research/spec swarm (all 20, with critics) → engine → binary-search on
   the engine (verify) → tree/graph/grid/stack topics (verify each) → switch lesson page → critic
   passes + fixes → scaffold remaining 15 → report.

## Run log
- 939d547 — prototype committed to branch (reference).
- (entries appended as the run proceeds…)
