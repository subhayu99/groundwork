# CONTINUE HERE — post-compaction briefing (annotated-canvas polish)

**You are continuing an autonomous overnight task.** The user is asleep (back in ~1–3h), said
**"I don't care about tokens or time — make the polish visible, fix ALL the small issues."** Repo:
`/Users/subhayu/Downloads/first-principles-learning-platform`. Branch: **`annotated-canvas-conversion`**
(NEVER touch `main` / push to prod — the user reviews the branch and merges himself). Commit freely on
the branch with the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## THE MISSION RIGHT NOW
**Visual UX polish of all 19 converted lessons.** They compile + render but many have small visual
problems: panel/visual **overlaps**, **misalignment** between the left canvas and right code pane,
arrows pointing at the wrong spot, text cut off / off-canvas, dim/cramped visuals. The user explicitly
named **`monotonic-stack`** and **`hash-maps`** as bad; assume ALL 14 "draft" topics need work, and
re-check the 5 "polished" ones too (the user said even those have "small small issues").

**The user demands ACTUAL SEEING:** take Playwright screenshots, LOOK at them (the Read tool renders
PNGs), fix the lesson-spec, **re-screenshot to confirm**. Not blind coordinate guessing.

## WHAT'S ALREADY DONE (committed on the branch)
- **Reusable engine**: `src/shared/lesson/` → `types.ts` (the `LessonSpec`/`LessonBeat` contract),
  `canvas.tsx` (SVG helpers), `LessonRuntime.tsx` (the renderer), `registry.ts` (which topics use it).
- **19/20 topics converted + registered** (each renders the new form at its real route). `linked-lists`
  is the ONLY one NOT built yet (build it from `docs/ac-conversion/data-structures__linked-lists.md`).
- **5 "polished + verified"**: `binary-search` (the gold-standard reference), `trees`, `graphs`, `dfs`,
  `stacks-queues`. **14 "drafts" (built by blind agents, need polish):** two-pointers, sliding-window,
  sliding-window-variable, monotonic-stack, recursion, bfs, backtracking, dp-1d, mergesort,
  activity-selection, arrays, strings, sets-tuples, hash-maps.
- **Just fixed (committed):** a setState-in-render crash — `LessonRuntime.onActiveLine` now defers via
  `queueMicrotask`. So a visual that calls `api.onActiveLine()` during render no longer crashes. Good.

## HOW A LESSON WORKS (so your fixes are correct)
A lesson = `LessonSpec` data: `{ topicTitle, canvas:{width:860,height:470}, codeSource (raw .py),
beats: LessonBeat[] }`. Each beat: `{ id, visual, panels[], arrows[], codeLabels[], interaction }`.
- **The canvas is ONE `<svg>` (860×470).** Each beat's `visual` is **SVG content** built ONLY from the
  helpers in `src/shared/lesson/canvas.tsx`: `CellRow`/`rowGeom` (arrays), `NodeGraph`/`GNode`/`GEdge`
  (trees/graphs), `GridCells`/`gridGeom` (grids), `StackBoxes` (stacks), `Arrow`, `Bracket`, `Pill`.
  **Never** import `Scene`/`TreeViz`/`GraphViz`/`GridViz`/`StackPanel`/`ArrayViz` (they render their own
  `<svg>`/HTML and break).
- **Panels** are HTML overlaid on the canvas (absolute `left/top/width` in the 860×470 space), scaled
  with it. **Arrows** are `{x1,y1,x2,y2}` in the same coords.
- **THE NO-OVERLAP ZONE RULE** (copy `binary-search/lesson-spec.tsx`): main panel = TOP band
  (top:18–24, ends ~y150); the VISUAL = MIDDLE band (y 180–430), centered + big; a NOTE panel =
  BOTTOM-RIGHT (left:540, top:372, width:290). The three regions must NOT overlap. Arrows go from the
  main panel's bottom (~y150) down to a visual element.
- **Interaction**: `visual` may be `(api) => <Comp api={api}/>`. `api.onActiveLine([labels])` drives the
  live code highlight (safe to call anywhere now). `api.onInteractionDone()` satisfies a `wedge` gate
  (call it from the click handler). `interaction: "wedge"` gates Next until acted on; `"playback"`
  auto-animates (mirror `AutoBinarySearch` in the binary-search spec: setInterval, emit per frame, ↺
  replay). `codeLabels` must be REAL `@sync` anchors from that topic's `algorithm.py`.
- **CONTENT RULE (non-negotiable):** narration must be understandable by a 15-year-old with ZERO CS.
  The first time Big-O / code syntax / a CS term (node, pointer, hash, bucket, stack, recursion,
  LIFO/FIFO, immutable, log, window) appears, gloss it in plain words. Panels ≤ ~45 words.

## THE RECOMMENDED PLAN (do this)
Run a **Workflow** (the user opted into multi-agent — it's authorized). One agent per topic, each does
a **see → fix → re-verify loop**. Concurrency is capped automatically; tell agents to use **headless**
Playwright + **unique** temp paths so they don't collide. The dev server is running at
`http://localhost:3000` (routes: `/categories/<cat>/<topic>/`; basePath is empty in dev). If it's down,
restart: `cd <repo> && (npm run dev > /tmp/dev.log 2>&1 &)` and poll `curl http://localhost:3000/`.

**Each agent's instructions (per topic `<cat>/<topic>`):**
1. Write `/tmp/audit-<topic>.js`: launch chromium **headless**, `emulateMedia dark`, viewport 1600×900,
   goto the route, step through ALL beats (when the Next button is disabled, it's a wedge — click an
   `svg [role="button"]` to satisfy it), screenshot each beat to `/tmp/audit-<topic>-bN.png`, collect
   `pageerror`/console errors. Run it: `cd /Users/subhayu/.claude/plugins/cache/playwright-skill/playwright-skill/*/skills/playwright-skill && node run.js /tmp/audit-<topic>.js`.
2. **Read every screenshot** (Read tool on the PNGs — it shows you the image) and list concrete visual
   defects: panel overlapping the visual or another panel; text clipped / off the 860×470 canvas;
   arrow not pointing at its element; the visual too small/dim/cramped or not centered in the middle
   band; left canvas vs right code pane imbalance; anything that doesn't look polished.
3. Edit `src/categories/<cat>/topics/<topic>/lesson-spec.tsx` to fix — apply the ZONE RULE, resize/
   recenter the visual into the middle band, fix arrow coords, fix tones/contrast. Keep narration +
   codeLabels + interactions intact (only fix wording if it breaks the CONTENT RULE).
4. **Re-run the script, re-read the screenshots, confirm fixed.** Iterate until clean.
5. `npx tsc --noEmit 2>&1 | grep -c error` must be 0. Report defects-found / fixed / any-remaining.

After the workflow returns: **you (orchestrator) spot-check** a few topics yourself with Playwright +
screenshots, fix anything agents missed, then **commit per batch**. Then run a content-critic workflow
if time (the `ac-critic-lessons` script pattern). Finally build `linked-lists`.

## VERIFY / COMMANDS
- Typecheck: `npx tsc --noEmit` (must be 0). Build: `npm run build` (expect 95 static pages). Tests:
  `npm run test` (18). Routes to eyeball: `/categories/algorithms/binary-search` (reference), then any.
- Playwright skill: `cd /Users/subhayu/.claude/plugins/cache/playwright-skill/playwright-skill/*/skills/playwright-skill && node run.js <script.js>`. Use `headless:true` for batch.
- A working walker template is `/tmp/pw-archetypes.js` (may be gone post-compaction; the pattern: goto
  route, loop Next, click `svg [role="button"]` when Next disabled, screenshot, collect errors).

## KEY FILES
- Engine: `src/shared/lesson/{types.ts,canvas.tsx,LessonRuntime.tsx,registry.ts}`
- Reference lesson (copy this): `src/categories/algorithms/topics/binary-search/lesson-spec.tsx`
- The 19 lesson specs: `src/categories/<cat>/topics/<topic>/lesson-spec.tsx`
- Specs + critic reviews: `docs/ac-conversion/<cat>__<topic>.md` and `REVIEW__<cat>__<topic>.md`
- Status docs: `docs/ANNOTATED-CANVAS-HANDOFF.md`, `docs/ANNOTATED-CANVAS-PLAN.md`, this file.
- Review screenshots of the 5: `docs/ac-conversion/screens/`

## GUARDRAILS
- Branch only; never push `main`. Commit small, verify tsc before each commit, keep the tree green.
- The lesson page switch is in `src/app/categories/[category]/[topic]/TopicPageClient.tsx` (renders
  `<LessonRuntime>` when `getLessonSpec(cat,topic)` exists). Don't break the fallback path.
- Don't reintroduce setState-in-render: emit from handlers/effects; the engine defends, but keep it clean.

## DONE = 
All 19 (ideally 20 incl. linked-lists) lessons screenshot-verified with: no overlaps, visuals centered
& legible in the middle band, arrows correct, balanced left/right, 0 console errors, tsc+build green —
and you've committed it all on the branch with an updated `ANNOTATED-CANVAS-HANDOFF.md`.
