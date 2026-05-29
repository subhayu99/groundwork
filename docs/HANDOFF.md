# Handoff — Groundwork

Live: https://subhayu.in/groundwork/ · auto-deploys on push to `main` (GitHub Actions → static export → Pages).

## Hard rules (non-negotiable — also in user memory)
1. **10th-grader accessible.** No CS jargon before Step 7 (invariant, monotone, predicate, amortized, recurrence, memoize/tabulate, subarray, immutable…). Big-O only from Step 5's operations table onward — never steps 1–4.
2. **Left↔right sync.** The card and the visualizer must show the SAME example (same target/names/numbers). Mismatch = bug.
3. **Code drawer = real syntax-highlighted viewer.**

## Round 2 — Mobile UX & usability overhaul — COMPLETE
Plan + empirical Playwright audit: `/Users/subhayu/.claude/plans/effervescent-snacking-treasure.md`.
- **Mobile learning loop:** `TopicLayout` no longer tabs Lesson/Visual/Code apart — on phones the visualizer is a fixed-height panel on top (collapsible via "hide visual") and the lesson cards scroll beneath it, so you read + watch together. Code is a collapsible block at the end of the lesson. Desktop unchanged (reflow via flex `order`; cards/visualizer mount once).
- **Responsive visualizers:** `FitViewport` fits by height + centers (`fitHeight`); `ArrayViz` is count-aware (cells+font sized to fit ~340px for any length); per-viz mobile tuning for binary-search/strings/activity-selection/stacks-queues/graphs (GraphViz gained a backward-compatible `viewBox`). 18/20 visualizers render at scale 1.0 at 390px (was ~0.48–0.66). Hooks: `src/shared/layout/useIsMobile.ts`, `src/shared/viz/useContainerWidth.ts`.
- **Touch:** sliding-window has ◀/▶ slide buttons (and drag fires on pointer-down) so the step-3 gate opens without a precise drag; ≥40–44px tap targets on PlaybackControls/ScrubBar/NextStepsSection.
- **A11y/motion:** `prefers-reduced-motion` CSS block + `<MotionConfig reducedMotion="user">` (in `src/app/MotionProvider.tsx`, wraps the app); ConceptMap settles the d3 sim instantly under reduced motion.
- **Usability:** "Continue where you left off" banner on home (`src/app/ResumeBanner.tsx`); `/progress` rows link to their topic; prev/next topic nav at the foot of every lesson; code-lock copy fixed; `px-5 md:px-8` content padding; breadcrumb truncates instead of clipping.
- Verified end-to-end via Playwright at 1440px + 390px (0 console errors, 0 overflow). Out of scope (future): settings UI / animationSpeed wiring, a touch concept-map for mobile (grid fallback kept), per-topic practice authoring.

## Audit & remediation (Round 1) — COMPLETE
Full audit + plan (superseded by Round 2 above): same plan file. Spec (intent): `/Users/subhayu/Documents/docs/superpowers/specs/2026-05-24-dsa-first-principles-design.md`.

All phases done & deployed. Final state: `npx tsc --noEmit` clean, 15/15 tests, build emits **57 static pages**, zero console errors across home / topic / principle routes (Playwright-verified at 1440px and 390px).

- **Phase 1 — consistency:** Hash Maps "find alice" now grinds (alice moved last in an unsorted book, 13 comparisons); 11 jargon/Big-O early-step violations reworded; 7 "drawer below" → "Code panel"; step-aware gate clean.
- **Phase 2a — shared viz primitives** (the spec's missing layer) in `src/shared/viz/`: `tones.ts`, `usePlayback`, `PlaybackControls`, `GridViz`, `StackPanel`, `TreeViz`, `GraphViz`. (`ArrayViz`, `StatsPanel`, `WindowOverlay` predate the audit and are still in active use — NOT dead code, kept.)
- **Phase 2b — DONE.** All visualizers with a play loop now use `usePlayback`+`PlaybackControls`; grids/trees/graphs/stacks go through the shared primitives. (sets-tuples/stacks-queues/linked-lists have no autoplay loop — interactive only, correctly left.)
- **Phase 3a — Step 8 / Next Steps — DONE.** `src/shared/next-steps/`: `types.ts` (`NextStepsContent`) + `NextStepsSection.tsx`. Each topic ships a `next-steps.ts` (recap, practice [in-app link when `problems.tsx` exists + external w/ collapsible hints], related topics, real-world, resources); wired via `TopicBundle.nextSteps`. Renders as Step 08 in `TopicPageClient` **only after the derivation completes** (`everCompleted`). All 20 authored; every related-topic href verified against real routes; no Big-O in content.
- **Phase 3b — DONE.** `/principles/[principle]` pages live (7, via generateStaticParams); topic-page pills link to them. Home/category grid pills stay spans (nested-anchor constraint).
- **Phase 3c — D3 concept-map home — DONE.** `src/app/ConceptMapHome.tsx`: d3-force layout — 7 principle chips + 2 anchored category hubs + 20 topic leaves (linked to category + each principle used); completed topics filled; hover traces neighborhood; click navigates. Mount-gated SVG contents avoid hydration mismatch under static export. `app/page.tsx` shows the map at md+ and the original topic grid as the mobile fallback.
- **Phase 4 — DONE.** No dead code to drop (StatsPanel/WindowOverlay still used). Full verify + this doc + memory updated.

## Out of scope (future): input editors, variants.ts template generator, bridgeFrom rendering, per-topic practice coverage (only sliding-window/two-pointers/dp-1d ship `problems.tsx`).

## How to resume / extend
Read this + the plan file + [[feedback-first-principles-rules]]. Adding a topic = drop a folder (`meta.ts` + `derivation.tsx` + `visualizer.tsx` + `algorithm.py`, optional `problems.tsx` + `next-steps.ts`) + one entry in the category's `topics/index.ts` (and `categories/registry.ts` for meta). Visualizers compose `src/shared/viz/` primitives (API docs at the top of each file). Step-08 content is `next-steps.ts` exporting a `NextStepsContent`. Commit per change; push to `main` auto-deploys.
