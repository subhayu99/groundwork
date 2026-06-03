# Annotated-Canvas Conversion — Wake-up Handoff

**Branch:** `annotated-canvas-conversion` · **`main` / production: untouched.**
Run while you slept. Read this top-to-bottom; it's the map.

---

## Latest session — depth/sequence restore + 5 UX improvements (most recent)

After the 20-topic conversion, a review pass restored what the concise rewrite had cut and
fixed five UX issues. All committed on the branch; tsc clean · build 95 pages · 18/18 tests.

**Depth / sequence / flow restored** — each beat now carries four fields (engine: `LessonBeat`):
`label` (step name), `connector` (a lead-in linking to the previous beat), `detail` (the fuller
explanation — paragraphs, `code`, named-principle callouts — restored from the old `derivation.tsx`),
and `actionLabel` (forward Next-button text). The header shows **"step k of N · LABEL"**.

**The 5 improvements (easiest→hardest, all done):**
1. **Renamed "the wedge" → "the instinct"** everywhere (display text only; `interaction:"wedge"`/`id:"wedge"` untouched).
2. **Header is a real navbar** — bigger/brighter, bordered, bold step label, visible breadcrumb + prev/next.
3. **Zen / reveal-on-demand** (content-first, calm default): code panel **hidden by default**, revealed via a
   slim **right-edge "</> code" tab** (its own position), and **auto-opens on the final beat** (the recap);
   the **detail explanation stays open** but collapses to a stub **in its own lower-left spot**. Everything
   expands/collapses from where it lives. Code toggle removed from the control bar.
4. **Control↔label sync** — the Next button no longer shows instruction-style labels that clash with the
   on-canvas controls (e.g. "Press play and watch" → "Make it a rule"); control-describing text now names the
   real buttons.
5. **Annotation overlaps fixed** — no on-canvas note/panel covers the visual or runs off the 860×470 canvas.

**Also:** global animation speed knob `src/shared/lesson/pace.ts` (`PLAYBACK_SLOWDOWN`, currently 1.6 →
~1.5 s/frame); raise it to slow every auto-play lesson at once.

**Engine file:** `src/shared/lesson/LessonRuntime.tsx` (header, detail card, Zen reveal-on-demand,
control bar, scroll-to-active-line). The lesson page wires it in
`src/app/categories/[category]/[topic]/TopicPageClient.tsx` (passes `practice`, `nav`, `onComplete`,
`initiallyCompleted`).

---

## TL;DR — what's done

The lesson UX is converted from "7 text cards beside a diagram" to the **annotated canvas** we
designed: the explanation lives ON the visual (panels + arrows), the real `algorithm.py` docks beside
it with the active line following each beat, it fills the viewport, and the code pane collapses.

- ✅ **A reusable engine** — a lesson is now DATA (`LessonSpec`), rendered by one `LessonRuntime`.
  This is the template for every topic (and the shape an AI generator can later target).
- ✅ **ALL 20 topics converted, registered, and screenshot-verified** — every one renders the new
  form on its real route, compiles (tsc clean), ships in the static build (95 pages), and walks with
  **0 console errors**.
- ✅ **Visual polish pass complete (screenshot-verified, not blind).** A fan-out audit workflow ran
  one agent per topic that drove the live lesson with headless Playwright, **read every beat's
  screenshot**, fixed real defects (panel/visual overlaps, label collisions, off-canvas clipping,
  arrow targets, left/right balance), then re-screenshotted to confirm. Highlights:
  - `monotonic-stack` — re-architected into a two-column layout (temperature bars left, waiting-stack
    right) to eliminate the bars-vs-stack overlap the user flagged.
  - `hash-maps` — moved the note panel clear of the bucket grid; fixed arrows starting inside panels.
  - `two-pointers` / `sliding-window` — lifted live status lines above the `target` pill (no overlap).
  - `binary-search`, `trees`, `graphs`, `dfs`, `stacks-queues` — re-checked; already clean.
  - `activity-selection` — verified clean as-is (no edit needed).
- ✅ **`linked-lists` built (20/20).** The last topic, hand-authored as SVG (the old HTML-div viz
  could not drop into the canvas). 7 beats incl. the insert/remove wedge and a net-new O(n)
  find-walk; screenshot-verified.
- ✅ **"Replace on the branch" is live** — visiting any converted topic's route serves the new form.
- ✅ Each lesson keeps its **wedge** (gates "Next" until you interact) and **auto-playback** (the code
  line follows the animation). The setState-in-render crash class was fixed centrally in the engine
  (`onActiveLine` defers via `queueMicrotask`).

## Try it (run `npm run dev`, then visit)
- `/categories/algorithms/binary-search`  ← start here (the reference)
- `/categories/data-structures/trees`
- `/categories/data-structures/graphs`
- `/categories/algorithms/dfs`
- `/categories/data-structures/stacks-queues`
- `/sandbox/lesson/binary-search` and `/sandbox/annotated-canvas` — the standalone prototypes.

Screenshots of every converted lesson are committed under `docs/ac-conversion/screens/` so you can
review without running anything.

---

## How it works (the template — add a topic in one file)

```
src/shared/lesson/
  types.ts          ← LessonSpec / LessonBeat contract (a lesson = ordered beats of
                       {visual, on-plane panels, arrows, codeLabels, interaction})
  canvas.tsx        ← SVG drawing helpers every beat uses: CellRow (arrays), NodeGraph
                       (trees/graphs), GridCells (grids), StackBoxes (stacks), Arrow/Bracket/Pill
  LessonRuntime.tsx ← the engine shell: viewport layout, scale-to-fit canvas, docked code with
                       @sync highlighting, beat nav, wedge gating, playback hosting
  registry.ts       ← maps "category/topic" → its LessonSpec (the "replace" switch)
```

**To convert a topic:** write `src/categories/<cat>/topics/<topic>/lesson-spec.tsx` exporting a
`LessonSpec` (copy `binary-search/lesson-spec.tsx` — it's the reference, with a static beat, a wedge
beat, and a playback beat), then add one line to `registry.ts`. That's it — the lesson page picks it
up. `TopicPageClient` renders `<LessonRuntime>` when a spec is registered, else the old form.

**Interactive beats:** a beat's `visual` can be `(api) => <Comp api={api}/>`; the component calls
`api.onActiveLine([labels])` to drive the live code highlight and `api.onInteractionDone()` to satisfy
a `wedge` gate. See `ClickToHalve` / `AutoBinarySearch` in the binary-search spec.

---

## The exact next steps (in priority order)
1. ✅ ~~Build `linked-lists`~~ — DONE (20/20 topics converted).
2. ✅ ~~Visual polish the draft topics~~ — DONE (screenshot-verified fan-out; see TL;DR).
3. **Content-critic pass (in progress / next).** The visual pass only fixed *layout*; a beginner-safety
   wording sweep (Big-O glossed on first use, no undefined CS jargon, panels ≤45 words) across the
   drafts + `linked-lists` is the remaining quality lever. Any wording change must keep panels short
   and be re-screenshotted so it doesn't overflow.
4. **Eyeball review + merge.** Walk the 20 routes (`npm run dev`), and if happy, merge
   `annotated-canvas-conversion` → `main`. The 5 originals' medium/low critic notes
   (`docs/ac-conversion/REVIEW__*.md`) are optional tightenings, not blockers.

## What's NOT done (and why)
- **Backend-dependent product pieces** (auth, payments, AI generation, community) — out of scope; they
  need your decisions/credentials, not code.
- **Known polish items** (logged for a later pass): the canvas letterboxes vertically for wide-short
  visuals (inherent); the old lesson chrome — breadcrumb, progress bar, practice/next-steps — is bypassed
  for converted topics (the new lesson is immersive/full-screen). If you want those back, we add a thin
  header + a "practice" affordance to `LessonRuntime`.

## Branch / how to proceed
- Review the 5 routes + screenshots. If happy: merge `annotated-canvas-conversion` → `main` (it
  auto-deploys). If not: it's isolated — `main` is exactly where you left it.
- Everything is committed in small steps (`git log annotated-canvas-conversion`).

## Critic findings + fixes
An adversarial reviewer read each of the 5 lessons (full reviews in
`docs/ac-conversion/REVIEW__*.md`). Verdicts: binary-search, graphs, dfs = *minor-fixes*;
trees, stacks-queues = *needs-work*. **All 4 HIGH-severity issues fixed** (they were the same
class — Big-O / `log` / DFS-BFS used before being explained in plain words):
- trees · "operations" beat — `O(n)`/`O(log n)`/`log`/"balanced" now led with the plain idea, symbol as an aside.
- trees · "fits" beat — `O(1)` now defined in plain words ("jumps straight to one value in a single step").
- stacks-queues · "obvious" beat — `O(n)` and `n` now defined at first use.
- stacks-queues · "fits" beat — `DFS`/`BFS` now expanded inline ("going as deep as you can…" / "one ring out at a time").

Verified after fixes: tsc clean · 18/18 tests · build = 95 static pages.

**Remaining (medium/low, deferred — see the REVIEW files):** a handful of wording tightenings and a
few `codeLabels` that could map more precisely. None are beginner-safety blockers. Good next-session task.

---

## Bottom line
The annotated-canvas form is real, reusable, and live on 5 diverse topics on the branch — interactive,
beginner-safe, verified. The engine makes the remaining 15 a mechanical follow-on (specs ready). Review
the 5 routes + `docs/ac-conversion/screens/`, and merge when you're happy.
