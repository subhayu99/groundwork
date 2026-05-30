# Annotated-Canvas Conversion — Wake-up Handoff

**Branch:** `annotated-canvas-conversion` · **`main` / production: untouched.**
Run while you slept. Read this top-to-bottom; it's the map.

---

## TL;DR — what's done

The lesson UX is converted from "7 text cards beside a diagram" to the **annotated canvas** we
designed: the explanation lives ON the visual (panels + arrows), the real `algorithm.py` docks beside
it with the active line following each beat, it fills the viewport, and the code pane collapses.

- ✅ **A reusable engine** — a lesson is now DATA (`LessonSpec`), rendered by one `LessonRuntime`.
  This is the template for every topic (and the shape an AI generator can later target).
- ✅ **5 topics fully converted, interactive, and browser-verified** — covering every visual shape:
  - `binary-search` (array) — the polished reference
  - `trees` (node graph) · `graphs` (node graph) · `dfs` (grid) · `stacks-queues` (stack)
- ✅ **"Replace on the branch" is live** — visiting these topics' real routes now serves the new form.
- ✅ **19/20 conversion specs** (peer-reviewed) for the remaining topics, ready to implement.
- ✅ Each lesson keeps its **wedge** (gates "Next" until you interact) and adds **auto-playback**
  (the code line follows the animation). Content rewritten beginner-safe.

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

## What's NOT done (and why)

- **The other 15 topics** are scaffolded (specs in `docs/ac-conversion/`) but not yet built. Depth-first
  was the call — 5 done well beats 20 done rough. Building each is now mechanical: follow its spec +
  the matching archetype reference. The fan-out workflow that built the 4 archetypes can be re-run for
  the rest.
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
(Appended below after the adversarial content-review pass completes.)
