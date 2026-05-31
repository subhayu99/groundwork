# Groundwork — Improvement Implementation Plan

> **Resumable master plan.** Derived from `docs/PRODUCT-ASSESSMENT.md` (6-persona audit) + a
> 5-agent codebase recon (2026-05-31). Branch: **`annotated-canvas-conversion`** (NEVER push
> main — Subhayu reviews + merges). Execution is **phased**; each phase is shippable and
> review-able. Implemented via **parallel-agent workflows**, sequenced so agents never edit the
> same file concurrently.
>
> **HOW TO RESUME after context loss:** read this file top-to-bottom, then look at the
> **Progress Tracker** below — the first phase whose box is unchecked is the next to run. Each
> phase lists exact files, the change, the cross-file contracts, and acceptance criteria. The
> recon facts (paths, line numbers, data shapes) are in `docs/PRODUCT-ASSESSMENT.md` and inline
> here. Memory pointer: `project-groundwork-improvement-plan`.

---

## Progress Tracker

- [x] **Phase 1 — Foundation: a11y, mobile, wayfinding, prerequisites** (safe; no content/schema changes) ✅ done 2026-05-31
- [ ] **Phase 2 — Correctness & content quick-wins** (per-topic fan-out)
- [ ] **Phase 3 — Jargon tap-to-define** (shared component + content fan-out)
- [ ] **Phase 4 — Pedagogy: prediction gates + retrieval checkpoints** ⚠️ REVIEW-GATED (pilot binary-search first)
- [ ] **Phase 5 — Cognitive-load layout polish** (final-beat staging, mobile code strip)
- [ ] **Phase 6 — Depth & rigor** ⚠️ REVIEW-GATED (hard tier, dp-2d, more practice)
- [ ] **Phase 7 — Retention & growth** ⚠️ REVIEW-GATED (schema migration, streak, spaced review, share, SEO)

⚠️ = do NOT auto-run; confirm scope with Subhayu first (large, product-defining, or migration-risk).

---

## Key recon facts (the load-bearing ones)

- **Prerequisite data exists.** `TopicMeta.prerequisites: string[]` (bare topic keys) is populated for all 20 topics in `src/categories/**/meta.ts`. Resolve a key → meta via `listAllTopics().find(t => t.key === key)` (gives `.category`). Full map:
  `arrays=[]`, `strings=[arrays]`, `hash-maps=[arrays]`, `sets-tuples=[hash-maps,arrays]`, `stacks-queues=[arrays]`, `linked-lists=[arrays]`, `trees=[linked-lists]`, `graphs=[trees,hash-maps]`, `two-pointers=[arrays]`, `binary-search=[arrays]`, `sliding-window=[arrays]`, `sliding-window-variable=[sliding-window,hash-maps]`, `monotonic-stack=[arrays,stacks-queues]`, `activity-selection=[arrays]`, `recursion=[arrays,trees]`, `dfs=[arrays,graphs,recursion]`, `bfs=[arrays,graphs,stacks-queues]`, `dp-1d=[arrays,hash-maps,recursion]`, `backtracking=[arrays,recursion,dfs]`, `mergesort=[arrays,recursion]`.
- **Old prereq display is dead code:** `TopicPageClient.tsx:197-215` ("builds on" pills) only renders in the legacy `DerivationEngine` branch; all 20 topics now hit the `LessonRuntime` early-return (`getLessonSpec` ≠ null), so it never shows.
- **`LessonRuntime` knows nothing about prereqs** — props are `{ spec, practice?, nav?, onComplete?, initiallyCompleted? }` (line 27). Must thread a new prop.
- **The "N" button** = Next.js 16 dev-tools indicator, injected by `next dev`, absent in prod. **Do nothing.**
- **Theme = CSS vars in `src/app/globals.css`.** Dark is default (`:root`), light is `:root[data-theme="light"]` (lines 84-111). `MotionProvider.tsx` sets `data-theme`. Light-theme low-contrast tokens to fix: `--text-muted: oklch(0.440…)` and `--text-faint: oklch(0.650…)` (the worst). All lesson text references these vars, so **only globals.css changes** for contrast.
- **`output: 'export'`** (static) + `basePath '/groundwork'` in prod. No server/API. All progress is `localStorage` (`fp-progress-v1`, `PROGRESS_SCHEMA_VERSION = 1`). Use `<Link>` (auto-prepends basePath), never raw `<a>`.
  - **Bug:** practice links in `LessonRuntime` (~line 303) use `<a href>` not `<Link>` → break under prod basePath. Fix in Phase 1/2.
- **Hot file = `src/shared/lesson/LessonRuntime.tsx`.** Many phases touch it. **One agent owns it per phase** (never parallel-edit it). Key lines: header bar 134-177 (breadcrumb `absolute left-4`, prev/next `absolute right-4`, centered title), `<svg>` root 189 (no role/aria), progress dots 335-340 (bare buttons), gate `const gated = beat.interaction==='wedge' && !interacted[beat.id]` line 109, Next button 341, detail card 234-268, code tab 321.
- **Gate bug:** `ClickToHalve` (binary-search lesson-spec:23) calls `api.onInteractionDone()` *before* the bounds check → ANY click satisfies the gate. Prediction/graded-interaction work must fix this.
- **No glossary / `<Term>` component exists** → create for Phase 3.
- **Practice:** `ProblemDifficulty='easy'|'medium'|'hard'`; only easy/medium authored (**0 hard**). Most topics 2 problems; `dp-1d`, `sliding-window`, `two-pointers` have **1**.
- **All 10 video resources** in `next-steps.ts` use YouTube *search* URLs, not specific videos.

---

## Decisions log (resolved — don't re-litigate)

| Decision | Resolution |
|---|---|
| "N" floating button | It's Next.js dev-tools. Leave it. |
| Prereq UX | **Non-blocking dismissible banner** above the lesson ("you usually want *X*, *Y* first — continue anyway?"). Never blocks navigation. Skip if user already has progress (`currentStep > 1`) on the topic. Dismissal = session state (not persisted). |
| Jargon | Central `src/shared/lesson/glossary.ts` (`Record<string,string>`) + `<Term word="…">` chip with tap popover. |
| Contrast target | WCAG AA: body text ≥4.5:1 vs `--bg-card` (panels) and `--bg` (page). Only edit light-theme tokens. |
| Mobile concept map | Keep the readable grid fallback; improve the map, don't delete it. |
| Checkpoint questions | Hand-authored per `LessonSpec` (new optional field), not AI-runtime (static export). |
| Schema migration | Bump `PROGRESS_SCHEMA_VERSION→2`, **soften** the version-discard in `ProgressStore.load()` to a back-fill migration so no user loses progress. |
| Home aesthetics | Phase-1 changes are **functional & conservative** (match existing accent-button style). If Subhayu wants a hero redesign, he'll do it in Claude web and bring JSX back. |
| Freemium / accounts | **Spec only, don't build** without an explicit business decision. |

---

## PHASE 1 — Foundation: a11y, mobile, wayfinding, prerequisites

**Goal:** the universally-flagged, low-risk fixes that don't touch content or the progress schema.
Parallel agents, each owning **distinct files**. Cross-file contract pinned below.

### Cross-file contract (pin in every relevant agent prompt)
`PrereqNudge` and the prereq row consume:
```ts
type PrereqItem = { name: string; href: string; completed: boolean };
```
`LessonRuntime` gains an optional prop `prerequisites?: PrereqItem[]`.
`TopicPageClient` computes it: `bundle.meta.prerequisites.map(k => { const t = listAllTopics().find(x=>x.key===k); return t && { name:t.name, href:`/categories/${t.category}/${t.key}`, completed: getTopic(t.category,t.key).derivation.completed }; }).filter(Boolean)`.

### Tasks (file ownership = one agent each, run in parallel)
1. **`src/app/globals.css`** — raise light-theme `--text-muted` (→ ~`oklch(0.40 …)`) and `--text-faint` (→ ~`oklch(0.50 …)`) to clear AA against `--bg-card`/`--bg`; verify difficulty-tag colors (`--diff-*`) and the `--accent` on white. Don't touch dark theme. Acceptance: a contrast check (panel body, connector, step caption, EASY/MEDIUM tags) ≥4.5:1; tsc clean.
2. **`src/shared/lesson/LessonRuntime.tsx`** (single owner) —
   a. **Mobile header:** convert the header bar (134) to `grid grid-cols-[1fr_auto_1fr] items-center`; make breadcrumb + prev/next normal grid children (drop `absolute left-4/right-4`); under `sm` stack to: row1 = back-chevron + `step N/total`, row2 = title; move prev/next into/near the bottom control bar. No overlap at 320-390px.
   b. **Accessible stepper:** wrap dots (335) in `<nav aria-label="lesson steps"><ol>`, each `<button>` gets `aria-current={i===b?'step':undefined}` + `aria-label="step N of T: <label>"`, hit area ≥24px (pad around the 10px dot), add a non-color cue (ring/size) for the active dot.
   c. **Canvas voice:** `<svg>` (189) gets `role="img"` + dynamic `aria-label="<topicTitle> — step N: <label>"`; add an `sr-only` `aria-live="polite"` region (before `</main>`) announcing the beat on change.
   d. **Label de-dup:** remove the `beat.label` repeat in the detail-card header (243-245) since the on-canvas panel already shows it.
   e. **Prereq prop:** accept `prerequisites?: PrereqItem[]`; render `<PrereqNudge>` (gated by internal `useState`) before beat 0 when any `!completed`, and a compact "builds on …" pill row in/under the header always.
   f. **basePath bug:** change practice `<a href>` (~303) to `next/link` `<Link>`.
   Acceptance: tsc clean; screenshot mobile (390) shows tidy header; dots keyboard-focusable with visible ring.
3. **`src/shared/lesson/canvas.tsx`** (single owner) — remove `outline:"none"` on the three interactive `<g>` (CellRow 116, NodeGraph 180, GridCells 221); add a visible `:focus-visible` ring (3px `var(--accent-sky)`, accounting for the scaled plane). Extend the `aria-label` builders (121/183/224) to include STATE where the visual encodes it (e.g. `cell 3, value 14, eliminated`/`role enters`/`visited`). Acceptance: tab through cells shows a ring; tsc clean.
4. **`src/shared/lesson/PrereqNudge.tsx`** (NEW file) — pure presentational component: props `{ prerequisites: PrereqItem[]; onContinue: () => void }`. Renders a dismissible banner listing unmet prereqs as `<Link>`s ("You usually want **Arrays** first") + a "Continue anyway →" button calling `onContinue`. Non-blocking styling. Acceptance: renders standalone; tsc clean.
5. **`src/app/categories/[category]/[topic]/TopicPageClient.tsx`** (single owner) — in the `lessonSpec` branch (49-92), compute `prerequisites: PrereqItem[]` (contract above) and pass to `LessonRuntime`. Use `next/link`. Acceptance: binary-search shows "builds on Arrays"; visiting binary-search with Arrays incomplete shows the nudge; tsc clean.
6. **`src/app/page.tsx`** (single owner) — add a primary CTA below the subtitle: `<Link href="/categories/algorithms/binary-search" className="…bg-[var(--accent)] text-[var(--bg)]…">Start with Binary Search →</Link>` (conservative styling). Keep ResumeBanner below. Acceptance: CTA visible above the fold, links correctly; tsc clean.
7. **`src/app/ConceptMapHome.tsx`** (single owner) —
   a. **Legend readability:** fix the orphaned `ml-auto` hint (361 → `sm:ml-auto`, wraps cleanly on mobile); ensure all swatches readable; distinguish principle vs topic pills (shape/weight).
   b. **Prereq edges:** add `"topic-prereq"` to `GLink.kind`; in the `useMemo` (121-139) push a prereq edge per `t.prerequisites` (resolve key→`t:{category}/{key}` via a `Map` of `topics`); add a `forceLink` distance/strength case (~dist 100, strength 0.35).
   c. **Status colors:** topic not-completed but all prereqs completed → "ready / recommended next" style (distinct fill or dashed ring); add a "start here" ring on binary-search.
   d. Extend legend with prereq-edge + ready-node entries.
   Acceptance: map shows dependency edges; binary-search highlighted; tsc clean.

**Phase 1 sequencing note:** tasks 2,4,5 share the `PrereqItem` contract — pin it in all three prompts so they agree on the prop name/shape and can run in parallel safely. After the workflow, run `npx tsc --noEmit` (whole repo) + `npm run build` and a Playwright sweep (desktop + 390px) before committing.

---

## PHASE 2 — Correctness & content quick-wins

Per-topic fan-out (independent files) + a few one-offs.
- **Overflow-safe mid:** use `mid = lo + (hi - lo) // 2` in binary-search `lesson-spec.tsx` code beats AND `problems.tsx` solutions AND `algorithm.py`; add one detail line on *why* (overflow in fixed-width langs). (binary-search only)
- **Re-tag Backtracking** away from "eliminate half each step" → "try, prune, undo". Find where the principle/tag label is sourced (topic `principles` array or the principle display map) and correct it so it doesn't imply halving.
- **YouTube links:** in each `next-steps.ts` (10 topics), replace `youtube.com/results?search_query=…` with a specific curated video URL. ⚠️ Mark each as "needs Subhayu to verify the link resolves" in the commit.
- **basePath `<a>`→`<Link>`** anywhere still using raw anchors for internal nav (if not fixed in P1).
- Acceptance: tsc + build clean; binary-search solution & lesson agree on `mid`; category page shows corrected Backtracking tag.

---

## PHASE 3 — Jargon tap-to-define

- **Create** `src/shared/lesson/glossary.ts` (`Record<string,string>` of 10th-grade one-liners: `O(n)`, `O(log n)`, `log₂`, `monotonicity`, `linear scan`, `recursion`, `bisect`, `None`, `invariant`, `amortization`, `LIFO/FIFO`, etc.) and `src/shared/lesson/Term.tsx` (dotted-underline chip; tap → popover; `pointer-events-auto` because panel containers are `pointer-events-none`).
- **Fan out** across 20 `lesson-spec.tsx`: wrap each term's *first* appearance in `<Term word="…"/>`. Also wrap the abstract principle bubbles on the home map.
- Acceptance: tapping a term shows its definition; no layout shift; tsc clean. (Component first, then the 20-topic fan-out depends on it.)

---

## PHASE 4 — Pedagogy: prediction gates + retrieval checkpoints ⚠️ REVIEW-GATED

The headline pedagogical upgrade (delivers the "Socratic" promise). **Pilot on binary-search, get Subhayu's review, then fan out.**
- **types.ts:** add `BeatInteraction` value `"prediction"`; add `LessonBeat.prediction?: { prompt: string; choices?: string[]; correctIndex?: number }`; add `LessonSpec.checkpoint?: CheckpointQuestion[]`.
- **LessonRuntime (single owner):** prediction overlay rendered in the `data-canvas-root` div (so it scales) before the reveal; new `predicted` state; gate `goNext` until answered, show right/wrong feedback. On the last beat, show `CheckpointModal` (new `src/shared/lesson/CheckpointModal.tsx`) before firing `onComplete`.
- **Fix the gate bug:** make `ClickToHalve` (and every `wedge` visual) call `onInteractionDone()` only on a *correct/qualifying* action, with a one-line correction + retry on a wrong click.
- **Pilot → fan out:** author prediction beats + a 2–3Q checkpoint for binary-search → review → then per-topic fan-out.
- Acceptance: can't advance the win/derivation beats without answering; wrong answers give feedback; checkpoint fires before completion.

---

## PHASE 5 — Cognitive-load layout polish

- **Stage the final beat:** split each topic's last beat into (1) synced code w/ live line, then (2) summary + practice — done per `lesson-spec` (add beats) + a LessonRuntime tweak if needed.
- **Mobile co-visibility:** pin a thin 2-line "active code line + neighbours" strip under the canvas on `<430px` (tap to expand). Keeps left↔right sync alive on phones.
- **Detail card:** optional collapsed-by-default "go deeper" disclosure to cut the panel/card double-read.
- Acceptance: climax beat no longer stacks code+summary+practice at once; mobile shows visual + live line together.

---

## PHASE 6 — Depth & rigor ⚠️ REVIEW-GATED (depth-vs-approachability tension)

Keep the beginner spine gentle; add hard content on an **opt-in difficulty track** that never blocks beginners.
- **"Complexity & edge cases" beat** per topic (Big-O + empty/single/duplicates/absent/overflow checklist). Consider optional `LessonBeat.timeComplexity?/spaceComplexity?`.
- **Hard tier:** 1–2 genuine interview-form problems per pattern (binary-search → Koko / Split Array Largest Sum; backtracking → Word Search II; etc.), tagged by sub-pattern. Triple practice to ~5/topic; backfill the 1-problem topics (`dp-1d`, `sliding-window`, `two-pointers`).
- **New `dp-2d` topic:** full bundle (meta + lesson-spec + visualizer + `algorithm.py` + problems + next-steps + registry wiring). Hand-author with a real *generative* "fill one cell from its neighbours" interaction — the new gold reference for what "interaction" means.
- Acceptance: hard problems exist + tagged; dp-2d live; beginner path unchanged.

---

## PHASE 7 — Retention & growth ⚠️ REVIEW-GATED (schema migration + product mechanics)

- **ProgressStore v2:** add `lastCompletedAt`/`lastReviewedAt`/`lastVisitedAt` to `TopicProgress`; bump `PROGRESS_SCHEMA_VERSION→2`; replace the discard-on-mismatch in `ProgressStore.load()` with a back-fill migration. Write timestamps in both completion paths.
- **Streak + daily goal** widget (home + `/progress`); **spaced-review nudge** (overdue completed topics surfaced on home) — one system serves retention science *and* the come-back-tomorrow loop.
- **"I derived X" shareable card** at payoff/completion (static image or styled card + deep link).
- **SEO:** plain-keyword `<title>`/H1/meta per topic alongside the poetic in-canvas marquee.
- **Freemium/accounts/"request a topic":** SPEC ONLY — needs Subhayu's business decision before building.
- Acceptance: no progress lost on migration (test with v1 data); streak increments across days; overdue topics surface.

---

## Verification gate (every phase)
1. `npx tsc --noEmit` clean.
2. `npm run build` → 92 static pages (or current count), no errors.
3. Playwright sweep at **1440** and **390** of the touched routes; for visual/a11y changes, screenshot + Read to confirm (no loading screens — wait for `[data-canvas-root]`).
4. Commit on `annotated-canvas-conversion` with the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Never push main. Don't touch `.github/`.
5. Tick the Progress Tracker box + note the commit SHA here.

## Commit log (fill as we go)
- Phase 1 (2026-05-31): contrast→AA (globals.css), mobile header grid + accessible stepper + canvas role=img/aria-live + label de-dup + practice `<a>`→`<Link>` + prereq prop (LessonRuntime), focus rings + state-in-aria (canvas.tsx), new PrereqNudge.tsx, prereq wiring (TopicPageClient), home "Start with Binary Search" CTA (page.tsx), concept-map prereq edges + ready/start-here styling + legend (ConceptMapHome). tsc clean, build 95 pages, verified desktop+mobile. SHA: see git log (this commit).
