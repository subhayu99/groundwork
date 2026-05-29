# Handoff — Groundwork

Live: https://subhayu.in/groundwork/ · auto-deploys on push to `main` (GitHub Actions → static export → Pages).

## Hard rules (non-negotiable — also in user memory)
1. **10th-grader accessible.** No CS jargon before Step 7 (invariant, monotone, predicate, amortized, recurrence, memoize/tabulate, subarray, immutable…). Big-O only from Step 5's operations table onward — never steps 1–4.
2. **Left↔right sync.** The card and the visualizer must show the SAME example (same target/names/numbers). Mismatch = bug.
3. **Code drawer = real syntax-highlighted viewer.**

## Audit & remediation (in progress)
Full audit + plan: `/Users/subhayu/.claude/plans/effervescent-snacking-treasure.md`. Spec (intent): `/Users/subhayu/Documents/docs/superpowers/specs/2026-05-24-dsa-first-principles-design.md`.

**DONE & deployed:**
- **Phase 1 — consistency:** Hash Maps "find alice" now grinds (alice moved last in an unsorted book, 13 comparisons); 11 jargon/Big-O early-step violations reworded; 7 "drawer below" → "Code panel"; step-aware gate clean.
- **Phase 2a — shared viz primitives** (the spec's missing layer) in `src/shared/viz/`: `tones.ts`, `usePlayback`, `PlaybackControls`, `GridViz`, `StackPanel`, `TreeViz`, `GraphViz`.
- **Phase 2b (partial) — 10/20 visualizers migrated** to compose primitives: dfs/bfs/backtracking (GridViz), monotonic-stack/recursion (StackPanel), mergesort/activity-selection/dp-1d (usePlayback+TreeViz), graphs (GraphViz), trees (TreeViz). All tsc-clean, 15/15 tests, zero console errors.

- **Phase 2b — DONE.** All visualizers with a play loop now use `usePlayback`+`PlaybackControls`; grids/trees/graphs/stacks go through the shared primitives. (sets-tuples/stacks-queues/linked-lists have no autoplay loop — interactive only, correctly left.)
- **Phase 3b — DONE.** `/principles/[principle]` pages live (7, via generateStaticParams); topic-page pills link to them. Home/category grid pills stay spans (nested-anchor constraint).

**REMAINING:**
- **Phase 3a — Step 8 / Next Steps:** build `shared/NextStepsSection` + typed `next-steps` shape; normalize the 2 orphan files (`sliding-window/next-steps.tsx`, `two-pointers/next-steps.ts`); author `next-steps` for all 20 (related + 2-3 practice + real-world + resources, reuse existing `problems.tsx`); render as Step 8 in TopicLayout/DerivationEngine. (Content-heavy — delegate per-topic authoring to subagents with terse returns.)
- **Phase 3c — D3 concept-map home:** replace static grid in `app/page.tsx` with d3 force-layout (d3 already a dep); client-only component; responsive grid fallback on mobile below a breakpoint.
- **Phase 4:** drop unused `StatsPanel`/`WindowOverlay` if subsumed; full verify; update this doc + memory.

## Out of scope (future): input editors, variants.ts template generator, bridgeFrom rendering.

## How to resume
Read this + the plan file + [[feedback-first-principles-rules]]. Migrations are behavior-preserving (screenshot before/after). Commit per phase; push deploys. Primitive API reference lives at the top of each file in `src/shared/viz/`.
