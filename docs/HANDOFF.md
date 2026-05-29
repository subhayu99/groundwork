# Handoff — Groundwork

Live: https://subhayu.in/groundwork/ · auto-deploys on push to `main` (GitHub Actions → static export → Pages).

## Hard rules (non-negotiable — also in user memory)
1. **10th-grader accessible.** No CS jargon before Step 7 (invariant, monotone, predicate, amortized, recurrence, memoize/tabulate, subarray, immutable…). Big-O only from Step 5's operations table onward — never steps 1–4.
2. **Left↔right sync.** The card and the visualizer must show the SAME example (same target/names/numbers). Mismatch = bug.
3. **Code drawer = real syntax-highlighted viewer.**

## Round 4 — Live code↔visualization sync + always-open progressive code panel — COMPLETE
Full plan: `/Users/subhayu/.claude/plans/effervescent-snacking-treasure.md`.

**Phase 3 — robustness + verify — DONE:**
- **Line-range guard test** (`src/tests/code-maps.test.ts`): asserts (a) every registered topic has a `codeMaps` entry (20/20), (b) no mapped line exceeds its `algorithm.py` length, (c) every topic maps all steps 1–7. 18/18 tests pass; protects against silent drift when a `.py` changes.
- **Runtime verification (Playwright, desktop 1440 + mobile 390, 0 console errors):**
  - *Phase 1* — all **20/20** topics: code panel open + unlocked at step 1 (no "finish to unlock") with unreached-step lines dimmed; mobile code block opens + unlocked too.
  - *Phase 2 live emit* — confirmed across every interaction modality: binary-search cell-click (`[9,10]→[13,14]`), stacks-queues buttons (push→`[7]`, enqueue→`[20]`), hash-maps input-type (`[27,31]→[27,28]`), dfs grid-candidate click (`→[20,27]`), sliding-window step-4 autoplay (`→[14]`). Live emits override the coarse step→line fallback as designed.
  - *No regression* — wedge gate still blocks advancing past step 3 until the user interacts, then opens; topic completion still registers (`completed=true`) and reveals Step 08.

**DONE & deployed (Phases 1–2):**
- **Phase 1 — always-open, unlocked, progressive code panel.** Code panel is no longer locked until completion: open by default below the viz, unlocked from step 1. Lines for steps not yet reached render **dimmed** (`opacity-30 blur-[0.4px]`); reaching/revisiting reveals more; completion reveals all. Wiring: `CodeHighlight.tsx` gained a `revealedLines` tier (per-line dim, additive); threaded `TopicPageClient → TopicLayout → ScrubbableCode → CodeHighlight`. `TopicLayout` drawer `useState(true)`; `TopicPageClient` passes `codeDrawerLocked={false}` + computes `codeRevealedLines` = ∪ `codeMaps[step]` for steps ≤ furthest reached.
- **Phase 2 — live frame-by-frame sync (ALL 20 topics).** Visualizer contract gained `onActiveLine?: (lines:number[]) => void` (in `Visualizer` type in `src/categories/algorithms/topics/index.ts`). `TopicPageClient` holds `liveLines` (reset on step change) and uses `codeActiveLines = liveLines ?? stepCodeLines?.[min(currentStep, steps.length)]`. Each topic's **final/interactive view** calls `onActiveLine([...])` at each operation, using named `LINE_*` constants = actual `algorithm.py` lines (same source as `src/categories/code-maps.ts`). Naive/setup views (steps 1–2) intentionally DON'T emit → fall back to the step map. Verified live on binary-search (playback walks mid→narrow-left→narrow-right); tsc clean, 15/15 tests, build 92 pages, 0 console errors.

**REMAINING (Phase 3 — robustness + verify; NOT done):**
1. **Line-range guard test** (new vitest, e.g. `src/categories/code-maps.test.ts`): assert every `codeMaps` line number is within its `algorithm.py` line count AND all 20 topics have a map entry. NOTE: the per-visualizer `LINE_*` emit constants are NOT covered by this — consider extending the test or moving them into `code-maps` for coverage.
2. **Broader Playwright runtime verification**: only Phase 1 + binary-search frame-by-frame were exercised at runtime; the other 19 topics' live emits are confirmed by tsc + subagent self-reports only. Spot-check archetypes — a grid/click (dfs), a drag (sliding-window), an input (hash-maps), a node-click (trees/graphs) — confirm the highlight changes with the action; plus a completion/Step-08 + wedge no-regression pass; 0 console errors; desktop + mobile.
3. **Confirm the latest deploy went green** (`gh run watch`) and smoke the live site.

**How to resume:** read the plan file + this section. The feature is functionally complete; Phase 3 is verification + the guard test. Dev server runs on :3000. Playwright executor: `cd ~/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill && node run.js <inline-or-/tmp-script>`. To detect a highlighted line in the DOM: `pre div.bg-\[var\(--accent-soft\)\]`; dimmed lines: `pre div.opacity-30`. Push gotcha: `git push` may 403 (wrong cached cred) → `gh auth setup-git`; token lacks `workflow` scope so don't touch `.github/`.

## Round 3 — Features, content & bug fixes — COMPLETE (2 items deferred)
- **Practice problems for all 20 topics** — every topic now ships `problems.tsx` (2 problems each: prompt, examples, hints, Python solution + walkthrough). Build is 92 static pages.
- **Settings** (`/settings`) — theme System/Light/Dark (full light OKLCH palette in `globals.css` `[data-theme="light"]`), motion System/Reduce, progress export/import/reset. Applied app-wide by `src/app/MotionProvider.tsx` (reads saved prefs: `data-theme` + `html.reduce-motion` class + `MotionConfig`). `useProgress` gained `updateSettings`/`resetProgress`.
- **Touch concept map** — nodes are tap-to-trace / tap-again-to-open (mouse + touch); the map now shows on phones too (grid kept below).
- **Code ↔ visualization sync** (was reported broken) — the code drawer highlight now follows the derivation step via `src/categories/code-maps.ts` (per-topic step→line map); plumbed `currentStep → TopicLayout → ScrubbableCode` (`activeLines`), manual scrub overrides, re-syncs on step change. Topics without a map fall back to the manual scrubber.
- **"Mark complete" fix** (was reported broken) — root cause was per-instance `useProgress` state with no cross-sync; added subscribe/notify to `ProgressStore` so every consumer re-reads on save (lesson page now reveals Next Steps + unlocks code + collapses the card on completion).
- **"Builds on" bridge** — topic headers link to prerequisite topics (partial take on spec `bridgeFrom`).
- **Polish/maintenance** — last 2 visualizers (sliding-window-variable, stacks-queues) to scale 1.0 on mobile; all 20 now fit. (CI Node-24 bump authored but NOT pushed — the gh token lacks `workflow` scope; bump `node-version` in `deploy.yml` manually with a `workflow`-scoped token, or `gh auth refresh -s workflow`.)
- **DEFERRED (large, future):** custom **input editors** (let users edit visualizer inputs — invasive per-visualizer; `customInputs` store field still unused) and the **variants.ts** template generator. Each warrants its own focused session.

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
