# Groundwork — Modular Refactor Plan (audit → composable base)

Source: the 2026-05 audit (`docs/DATA-STRUCTURES-AUDIT.md`) + architecture audit. Goal: fix the
systemic bug classes **once, in shared composable blocks**, and leave behind the reusable base the
vision (`docs/VISION.md`) needs for AI-generated pages and new domains. **Zero duplication.**

## The one insight

Almost every functional bug (97 findings, 19/20 topics) traces to **two root causes**:
1. **Code↔visual sync has two forkable sources of truth** — `src/categories/code-maps.ts` (step→line)
   *and* a per-visualizer `LINE_*` constant block (18/20 files). They drift; maps point at comments,
   span two functions, and the live emit is coarse/fixed → the highlight is frozen or wrong.
2. **Every visualizer re-implements the engine** — playback loops, sub-view dispatch, reset, control
   bars, color, and the emit timing (some emit during render → the setState-in-render error in 6 files).

Fix the contract + provide the shared blocks, and the bug classes become impossible (and CI-enforceable).

## The composable blocks to establish (in dependency order)

### B1 — Label-based code sync (`@sync` anchors). *Kills FROZEN, COMMENT-ACTIVE, WIDE-SPAN, dual-source.*
- Make `algorithm.py` the **single source of truth**: tag executable lines with anchors, e.g.
  `mid = (lo + hi) // 2  # @sync: mid`. A shared `buildLineIndex(pythonCode)` resolves `label → lineNo`
  once (build/runtime), guaranteeing the active line is real and unique.
- Visualizers emit **labels**, not integers: `onActive(["compare", "mid"])`. `code-maps.ts` step→line
  is regenerated as step→labels (or derived). Per-visualizer `LINE_*` constants are deleted.
- Guard test: every anchor resolves to exactly one **non-comment** line; every emitted label exists.
  (Extends `code-maps.test.ts`, which today only checks range/completeness.)

### B2 — `AnimatedAlgorithmView` wrapper. *Kills playback/reset/control-bar duplication + setState-in-render.*
- A shared component that OWNS `usePlayback` + `PlaybackControls` + **emission timing** (emits only from
  effects/handlers, never render — fixing the 6 setState-in-render bugs centrally).
- Author/generator supplies a reducer + renderer: `initialState`, `step(state) → {state, active: Label[],
  done}`, `render(state)`. No visualizer touches `setInterval` or writes a Play/↺/→ row again.

### B3 — naive-phase suppression. *Fixes "naïve step highlights contradicting line".* ✅ DONE
- Achieved CENTRALLY (no per-visualizer churn): `TopicBundle.naiveThroughStep` (default 2). In
  `TopicPageClient`, steps ≤ naiveThrough drop the coarse step→line fallback; `ScrubbableCode` gains
  `suppressActive` so the panel shows NO bright line while idle in the naive phase (a manual scrub still
  highlights), with a "Deriving the real approach — the code lights up as you build it" note in the drawer.
- **`PhasedVisualizer` dispatch-dedup: evaluated, intentionally NOT built.** After B1+B2 removed the
  substantial duplication, each visualizer's top-level dispatch is ~4 readable lines that vary meaningfully
  per topic (different sub-phases). A generic phase-config would add indirection without simplifying, and
  re-churning 20 stabilized files is poor risk/reward. The behavioral goal was met centrally. (If/when B5
  consolidates the contract for AI-generated pages, a declarative phase descriptor can be revisited there.)

### B4 — Tone-driven viz primitives. *Kills inline `color-mix`/`lab()` (animation warnings) + unifies the visual language.*
- `ArrayViz`/`GridViz`/`TreeViz`/`GraphViz`/`StackPanel` accept a `Tone` per element (active/visited/
  target/idle) from `tones.ts`; delete inline color from `categories/**`. Resolve tones to
  Motion-animatable values (hex/rgb, not `color-mix`/`lab`) so Framer Motion stops warning.

### B5 — Contract consolidation for AI-generated pages & new domains.
- Move `TopicBundle` + `VisualizerProps` to `src/shared/topic/contract.ts`; fold `codeMap` INTO the bundle
  (one self-contained artifact a model emits). Replace the two near-identical `topics/index.ts` files and
  the `if (categoryKey===…)` switch with `defineTopics(domain, bundles)` + a domain registry. Make step
  count `number` (derived from `steps.length`), not the hardcoded `StepNumber = 1..7`.

### B6 — Domain-agnostic `Scene` primitive. *The seam that makes "any technical concept" real.*
- A positioned-nodes + labeled-edges + annotation layer that array/tree/graph are special cases of.
  Systems-design/DB blocks (load-balancer→servers, shards→key-ranges, OLAP/OLTP flows) reuse `Scene` +
  `AnimatedAlgorithmView` + the sync layer without forking the engine.

### B7 — Small shared utilities. `makeNode(value)` / `useStableIds()` (id ≠ display label) — fixes the
linked-list leak and prevents the whole class. De-blur dimmed code in `CodeHighlight` (opacity ~0.55, no
`blur`); debugger-style ▶ active-line marker.

## Cross-cutting (apply during the above, not as separate passes)
- **Jargon gating:** strip `O(...)` from early-revealed comments + viz button labels; gate complexity to
  step 5+. (Recurs in all 20 topics.)
- **Accessibility:** make interactive SVG nodes/sliders keyboard-operable (`role`/`tabindex`/keydown) and
  never pointer-gate progress; add a viz `aria-live` narration. (Belongs in `Scene`/wrapper so it's free
  for every topic.)

## Sequencing (highest leverage first)
1. **B1 + B7-guardtest** — anchors + the "active line is never a comment / always resolves" test. Single
   biggest correctness win; makes the rest safe.
2. **B2 + B3** — the wrapper + phases; collapses ~15 files of duplication and fixes setState-in-render +
   naive-step contradiction.
3. **B5** — consolidate the contract so an AI generator targets one file (and step-count is flexible).
4. **B4 + B7-rest** — tones (animation warnings), de-blur, id leak, active-line marker.
5. **B6** — `Scene` seam (unlocks new domains).
6. Cross-cutting jargon + a11y woven through.

Each step ships green (`tsc`, tests, build) and is verified by re-running the interaction analyzer
(`/tmp/analyze.js`) — the finding counts must drop toward zero.

## Validation harness (already built, reuse it)
- `/tmp/ds-walk*.js` + `/tmp/algo-walk.js` — drive all 20 topics, capture viz+code + active-line log.
- `/tmp/analyze.js` — flags COMMENT-ACTIVE / FROZEN / WIDE-SPAN / VIZ-LEAK / CONSOLE per topic.
- `/tmp/crawl.js` — route-wide console/overflow/leak crawl.
Re-run after each block; the numbers are the regression metric.
