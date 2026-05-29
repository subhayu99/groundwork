# Data-Structures Audit — findings & fixes (2026-05-29)

How this was produced: I drove all 8 data-structure visualizers as a real user (clicking every
button, dragging sliders, clicking nodes, playing animations) via Playwright, capturing **221
screenshots** of the full instrument (lesson card + visualizer + code panel) plus a log of exactly
which code line was highlighted for every action. Those screenshots were then reviewed by **8
"naïve 15-year-old" persona agents** (one per topic, zero CS knowledge) and **4 senior expert
agents** (UX researcher, product/visual designer, accessibility engineer, professional power-user).
Findings below are deduplicated and grounded in screenshot + source evidence.

Severity: **P0** = breaks the core promise / blocks a user / destroys trust · **P1** = significant
confusion or quality gap · **P2** = polish.

Topics: arrays, strings, stacks-queues, linked-lists, sets-tuples, hash-maps, trees, graphs.

---

## Theme 1 — Code ↔ visualization sync is wrong (the core complaint). **P0**

The promise is "the highlighted code line shows what just happened in the picture." Across the data
structures it frequently highlights the **wrong line, a comment, or a stale/hardcoded line**, or
sits **frozen** while the picture moves. This is the single biggest cluster.

1. **Naïve/early-step views highlight a line that contradicts the animation.**
   Steps 1–2 animate a brute-force demo that isn't in `algorithm.py`, so they don't emit a live
   line and fall back to the coarse `codeMaps[step]` — which points at lines that *contradict* what's
   on screen.
   - arrays step 1: cursor **crawls** the pile one book at a time, but code highlights
     `third = books[2]  # "Calm"` — *direct indexing*, the literal opposite of crawling.
     (`arrays/s1-00..02`)
   - strings step 1: letter-by-letter search animates, code stays on line 1 (a `#` comment) +
     `s = "..."`; the `s.find("brown")` line never lights. (`strings/s1-00..03`)
   - hash-maps step 1: "Play through" search counter ticks 0→8→13, highlight frozen on
     `phone: dict[str,str] = {}`. (`hash-maps/s1-00..02`)
   - stacks-queues steps 1–2, linked-lists steps 1–2: pop/insert change the picture, highlight sits
     on a declaration (`class Node`, `def insert_after`, `history=[]`).
   **Fix:** for steps whose visualizer is a naïve/non-final demo, **do not highlight a specific
   contradictory line.** Either render the code fully dimmed with a one-line banner ("this is the
   slow way — the real code comes next"), or emit a neutral line that matches the demo. Never let the
   highlighted line teach the opposite of the animation.

2. **Sliders don't move the highlight; the highlighted line's literal index is hardcoded.**
   - arrays step 3: dragging shows `arr[2]`, `arr[8]` in the picture, code frozen on
     `third = books[2]`. (`arrays/s3-09 slider-right`, `s3-10 slider-far`)
   - strings step 3: picture shows `s[0:5]`→`s[2:7]`→`s[8:13]`, code frozen on
     `word = s[4:9]  # "quick"` (numbers + word match no window). (`strings/s3-05..07`)
   **Fix:** emit `onActiveLine` on every slider change, and show a **generic** indexed line
   (`books[i]` / `s[i:j]`) so the literal index can't contradict the slider — or interpolate the
   value into the displayed line.

3. **Comment lines are highlighted as if they execute.**
   - hash-maps step 3/4: typing a name highlights `# bucket_index = hash(key) % capacity` and
     `# table[bucket_index].append(...)` — both commented-out pseudo-code. (`hash-maps/s3-05/06`,
     `s4-07`)
   - strings step 4/immutability: "replace s[0]" highlights `# 6. Cannot mutate in place — ...`.
     (`strings/s4-09`, `s5-12`)
   **Fix:** point the maps/emits at **real executable lines**, or convert those commented
   pseudo-code lines into real code. A `#` line must never be the "active" line.

4. **trees: the code panel binds to the last control type, not the current view.**
   Step 5 shows a **BST "find 70"** picture, but clicking a node highlights the *general-tree DFS*
   function (`out=[node.value]; for child in node.children: out.extend(dfs(child))`), which doesn't
   even use `.left/.right`; only the "find" buttons hit the BST search. And BST search is **frozen**
   on `cur = root` / `if v == cur.value:` for every target — the branch lines (`if v < cur.value` →
   go left/right), which are the whole point, never light. (`trees/s4-10..12`, `s5-13/14`)
   **Fix:** bind the active code region to the **currently rendered visualizer mode**; make BST
   search emit the comparison/branch line per hop so the path is visible in code.

5. **graphs: two identical lines in different functions light at once.**
   Step 6 highlights `for neighbor in friends[node]:` at **line 32 (bfs)** *and* **line 49 (dfs)**
   simultaneously; step 1 highlights `def bfs(...)` before BFS is introduced. (`graphs/s6-22`,
   `s1-00`) DFS is never actually animated, so its code only ever lights via this bug.
   **Fix:** per-step maps reference only the relevant function; the neighbor-iteration emit picks the
   function that's actually running; add a DFS play-through or stop revealing dfs lines.

6. **sets-tuples: highlight is hardcoded to "alice" no matter which name you add.**
   `LINE_SET_ADD = 6 // logged_in.add("alice")` — adding bob/cara highlights the *alice* line; the
   picture correctly adds cara while the code shouts alice. (`sets-tuples/s3-10`, `s4-15`)
   **Fix:** use a generic add line (`logged_in.add(name)`), or interpolate the actual value.

7. **React console error in `SetTupleViz`** (reproduced once during the walk):
   `Cannot update a component (TopicPageClient) while rendering a different component (SetTupleViz)`
   — an `onActiveLine`/`setState` is reaching the parent during render. **Fix:** move that emit into
   an effect/handler so it never fires during render. (Only console error found in the whole sweep.)

8. **Later steps invite clicks but nothing responds** (highlight + picture byte-identical):
   trees steps 4/6/7, graphs steps 1/2/6/7, linked-lists step 6. **Fix:** either make the click do
   something or remove the "click any …" affordance on those steps.

---

## Theme 2 — Visual / data correctness bugs. **P0–P1**

1. **linked-lists: raw node ID leaks into the caption. P0.**
   `id = Date.now() + Math.random()` is used as the node id and printed:
   `remove node(1780068061301.346) · 1 pointer swap`. (`linked-lists/s3-07`, `s4-11`, `s5-15`)
   **Fix:** label nodes by **value** (caption `remove node(3)`), keep ids internal.

2. **linked-lists: removed node doesn't visibly disappear; counters climb but the chain is
   unchanged/longer. P0.** The "look how little moves on remove" lesson collapses. (`s3-07`, `s5-15`)
   **Fix:** ensure the reducer actually removes the node from the rendered list; assert
   post-op state so caption and chain can't diverge.

3. **linked-lists: inserts reuse existing values → duplicate pile-up** (`…6 → 6 → 6…`), reads as a
   rendering glitch. (`s4-10`, `s5-14`) **Fix:** insert visibly **new** values (e.g. 3, then 8).

4. **arrays step 1: the target is inconsistent** — card says "Find the 487th (487 lifts)", picture
   says "FIND THE 7TH BOOK", counter stops at "6 / 6 lifts". (`arrays/s1-00`) **Fix:** one coherent
   target/number throughout the step.

5. **sets-tuples: adding an already-present member shows no visible change** and pairs with a
   misleading highlight, so the click feels dead; the "silently ignored — already in" idea is told,
   not shown. (`s4-14`) **Fix:** flash "already here" on the picture when a dup is rejected.

6. **sets-tuples: the tuple "you can't change it" buttons are never demonstrated in the flow** — the
   single most important tuple lesson stays words-only. (content/UX gap) **Fix:** surface/auto-demo
   the `tuple[0]=…` / `tuple.append` rejection.

---

## Theme 3 — Jargon shown before it's earned (violates hard-rule #1). **P1 (recurs in all 8)**

Big-O and CS terms appear in **early steps** while the plain-English explanation arrives at step 5+.
Sources: code-comment annotations (revealed/active in the code panel), visualizer **button labels**,
and card copy.
- `O(1)/O(n)/O(k)/O(log n)/O(n·m)/O((V+E)logV)` in steps 1–4: arrays (`s3-08` code "Indexed access —
  O(1)", `s4` buttons "append · O(1)" / "insert · O(n)"), strings (`s3`, `s5`, `s6` table + "KMP"),
  hash-maps (`s2` "O(1) average", `s3` "mod 16"), linked-lists (step-1 code "O(1)"),
  stacks-queues (`s1` "pop front · O(n)", LIFO/FIFO before step 4/5), trees (`s6` "O(log n)" before
  defined), graphs (`s6` "Dijkstra", `O((V+E)logV)`), sets-tuples (`s5` "O(min(|A|,|B|))").
- Undefined terms early: "array" in the **first line** of strings; "hash/bucket" before step 4;
  "pointer/node" before step 4 (linked-lists); "adjacency list" (graphs); "immutable/allocates"
  (strings step 4 title).
**Fix:** gate every Big-O annotation and CS term to **step 5+**. Strip `O(...)` from button labels
and from comments that are revealed before step 5 (or hide complexity annotations until the
operations/complexity step). This is the platform's #1 rule and it's broken on every topic.

---

## Theme 4 — UI / visual design. **P0–P1** (cross-cutting)

1. **Dimmed code lines are *blurred* (`opacity-30 blur(0.4px)`) → reads as a rendering bug. P0.**
   On every topic ~70% of the panel looks like a smudged/failed-load screenshot; beginners read it as
   "broken/locked", engineers as a glitch. **Fix:** remove blur entirely; dim to **~0.55**, with
   executed lines (~0.7) brighter than not-yet-reached (~0.45) so the eye reads program direction.
   *(Single highest-leverage visual change.)*

2. **The active line doesn't read as "running now." P1.** Faint tint + thin border blends in, and when
   the active line is a comment it's the least-visible thing on screen. **Fix:** debugger-style **▶
   gutter marker** at the active line, raise active-bg alpha, 2–3px solid accent left-border, force
   active-line text to full strength, 120ms ease on move (respect reduce-motion).

3. **Comments are indistinguishable from prose/dimmed code. P1** (and comments are often *the
   lesson*). **Fix:** give comments a distinct legible hue (≥4.5:1); don't dim a comment that
   annotates the active line.

4. **Everything is too dark / low-contrast. P1.** Home concept-map is nearly invisible (pills ~2:1),
   progress "not started" labels near-invisible, a forest of `--text-faint` micro-labels below
   readable contrast. (`_ux/home-desktop`, `progress-desktop`, all topic pages) **Fix:** lift map
   surface/labels to ≥4.5:1; split `--text-faint` into two tiers (section labels ≥4.5:1, secondary
   meta ≥3:1).

5. **Right-column balance: code panel is height-starved; tree/graph viz squeezed into a thin strip.**
   (`trees/s4-10`, `_ux/topic-arrays-desktop-step1`) **Fix:** deliberate viz/code ratio with internal
   scroll; min node size (~40px); optional viz-heavy/code-heavy toggle.

6. **Visualizer color isn't a shared language** (yellow cursor, orange counter, red dashed edges, blue
   slot mean different things per topic). **Fix:** one global legend — active=accent, visited=green,
   target=amber, idle=neutral — applied everywhere, with an inline key when ≥3 colors.

---

## Theme 5 — Accessibility (WCAG 2.2). **P0**

1. **Keyboard/SR users are hard-blocked from completing lessons. P0.** The wedge gate ungates only
   after a **mouse-only** interaction: SVG `<circle>` node clicks (trees/graphs) and drag sliders
   (arrays/strings) aren't keyboard-operable, and bare SVG shapes expose no role/name/focus.
   (2.1.1, 4.1.2, 2.4.7) **Fix:** make nodes real controls (`<button>` or `role="button"` +
   `tabindex=0` + Enter/Space handler + `aria-label` + focus ring); use native `<input type=range>`
   or full slider ARIA; and never gate progress on a pointer-only gesture (accept keyboard equivalent
   or a "I've explored this" escape).
2. **The animated SVG *is* the lesson but has no text alternative/live region. P0.** Screen-reader
   users get nothing. (1.1.1, 4.1.3) **Fix:** `role="img"`+`aria-label`/`<desc>` summarizing state, and
   an `aria-live="polite"` region narrating each step ("Popped latte; 4 shifted; total shifts 4").
3. **Blur on text + 30% opacity fails contrast/legibility** (1.4.3/1.4.8) — see Theme 4.1.
4. **Target sizes** (viz buttons, slider thumb, SVG node hit areas, mobile taps) look < 24×24.
   (2.5.8) **Fix:** ≥24×24 (44×44 touch); pad node hit areas; slider stepper buttons (2.5.7).
5. **Verify** focus order across the 3 panes (2.4.3), settings toggles as `radiogroup`/`aria-checked`,
   and that reduce-motion truly stops auto-play. (I can validate these live with Playwright.)

---

## Theme 6 — Pacing, dual-audience, IA, depth. **P1–P2**

1. **No first-run orientation of the 3-pane instrument. P1.** Nothing tells a novice the picture is
   interactive, that dimmed code = future content, or to start at the card. **Fix:** one-time
   dismissible coach-marks ("1 read · 2 try · 3 watch the code"), a first-visit pulse on the first
   interactive element.
2. **Interactivity is under-signified. P1.** Nodes/cells/sliders don't look clickable; within one
   pane, op-pills look like buttons but the (more important) data nodes don't. **Fix:** consistent
   `cursor:pointer` + hover ring/glow on every directly-interactive element; one shared "clickable
   data element" treatment.
3. **Linear 7-step gating with no skip/TL;DR punishes experts. P1.** 6 clicks to reach the
   complexity table/full code. **Fix:** an **"expert mode / skip to summary"** that unlocks all steps
   + jumps to the complexity table & full code; a clickable **step rail** (TOC) for non-linear jumps.
4. **Mobile splits the instrument** — code and picture never co-visible; "open code" barely reveals
   anything above the dock. **Fix:** sticky collapsible viz at top + a "Picture | Code" segmented
   toggle, or open code as a ~70vh bottom sheet.
5. **IA: no cross-structure comparison.** Add an operation × structure complexity matrix that links
   into the relevant step; make the home map navigable or demote it.
6. **Depth/rigor: amortization, load-factor/resize, BST balancing are named but never derived.**
   Add optional "the honest version" expanders (amortized append doubling, resize trigger,
   degenerate-BST worst case).
7. **Settings: destructive "Reset progress" is unguarded** next to Export/Import. **Fix:** confirm
   step + "export first?".

---

## Per-topic snapshot

| Topic | Worst issues | Verdict (kid) |
|---|---|---|
| arrays | step-1 highlight = opposite of crawl; slider highlight frozen; 487/7th/6 mismatch; O(1) early | story great, code panel misleads |
| strings | search highlights a comment; slider frozen on `s[4:9]`; "replace" highlights a comment; "array" in line 1 | pictures good, code panel broken |
| stacks-queues | steps 1–2 code dead; LIFO/FIFO/O(n) before defined; clearest analogy arrives last | **best of the 8** from step 3 on |
| linked-lists | **node-ID leak**, removed node stays, duplicate pile-up; jargon early | trust-breaking glitches |
| sets-tuples | **add always highlights "alice"**; setState-in-render console error; dup add shows nothing; tuple-immutability never shown | "alice" lie kills trust |
| hash-maps | highlights **comment** lines on the key step; step-1 search highlight frozen; hash/bucket/mod early | pictures teach, code panel lets it down |
| trees | BST search highlight **frozen**; picture/code mismatch (children-DFS vs BST); clicks dead on 4/6/7; O(log n) early | learns shape, not the code |
| graphs | **double-highlight** bfs+dfs lines; `def bfs` on step 1; DFS never animated; Big-O dump | great framing, code panel incoherent |

---

## Recommended fix sequencing

**P0 (correctness & trust — do first):**
- T1.1–T1.6 code-sync corrections (naïve-step non-contradiction, slider emits, no comment-as-active,
  trees view-binding + BST branch emits, graphs single-function, sets-tuples generic add line).
- T1.7 SetTupleViz setState-in-render fix.
- T2.1–T2.3 linked-lists (id leak, real removal, distinct insert values).
- T4.1 remove code blur (+ readable dim tiers).
- T5.1–T5.2 keyboard-operable nodes/sliders + don't pointer-gate progress; viz text/live-region.

**P1:**
- T3 jargon gating (Big-O/terms → step 5+) across all topics.
- T4.2–T4.4 active-line debugger marker, comment color, global contrast lift.
- T2.4–T2.6 arrays target consistency, sets dup feedback, tuple-immutability demo.
- T6.1–T6.4 onboarding coach-marks, affordances, expert-mode/step-rail, mobile co-visibility.

**P2:** T4.5/4.6 layout balance & color language, T6.5–T6.7 comparison matrix, depth expanders,
reset confirmation, target sizes/focus-order verification.

---

## v2 — full-platform automated sweep (all 20 topics, 407 interaction captures)

After the DS-only review above, I drove **all 20 topics** (algorithms too) through every step/interaction
and ran an automated mismatch analyzer. It found **97 distinct findings across 19 of 20 topics** — the
issues are **systemic, not scattered**, and cluster into a few root causes (each fixable once, in a shared
layer — see `docs/REFACTOR-PLAN.md`):

| Cluster | Count | Topics | Root cause |
|---|---|---|---|
| **FROZEN-INTERACTIVE** (highlight never changes across different clicks/plays) | 34 | 12 (binary-search, bfs, dfs, dp-1d, graphs, mergesort, recursion, trees, two-pointers, sliding-window-variable, backtracking…) | Live `onActiveLine` is coarse/fixed per step → effectively falls back to the static step-map; Round-4 frame-by-frame sync isn't actually live on most algorithm topics. |
| **COMMENT-ACTIVE** (the "running" line is a `#` comment) | 24 | 8 (arrays, hash-maps, strings, stacks-queues, recursion, bfs, graphs) | `codeMaps`/`LINE_*` point at comment lines. |
| **WIDE-SPAN** (active lines from two functions at once) | 19 | graphs (4..49), sets-tuples (5..32), mergesort (16..39), trees (16..34), strings, arrays… | step→line maps list scattered lines spanning multiple functions. |
| **CONSOLE: setState-in-render error** | 6 visualizers | backtracking, bfs, dfs, monotonic-stack, recursion, sets-tuples | a derived/auto view emits `onActiveLine` during render/commit, updating the parent mid-render (React error). |
| **CONSOLE: "not an animatable color"** (Framer Motion) | 4 | backtracking, bfs, sliding-window, graphs | animating `color-mix(...)`/`lab(...)` values Motion can't interpolate (also the graphs "animate from undefined" warning). |
| **VIZ-LEAK** (raw id in the UI) | 5 | linked-lists | `Date.now()+Math.random()` id printed as a node label. |

**Conclusion:** the data-structure report's "code↔visual sync is wrong" is a *platform-wide* condition. The
dual source of truth (`code-maps.ts` + per-visualizer `LINE_*`) + per-topic re-implementation of playback/
emit is the mechanism. The fix is architectural (one shared sync layer + emission wrapper), not 20 patches.
Full plan: **`docs/REFACTOR-PLAN.md`**.

---

## What's already working (keep)
- The concrete, jargon-free **framing/metaphors** (book pile/shelf, phone book→hash, org-chart→tree,
  browser-history/barista→LIFO/FIFO, "position is not address").
- **Idiomatic, honest Python** (`@dataclass`, `deque`+`popleft`, `defaultdict`, average-vs-worst Big-O).
- The **self-labeling gated button** ("Move the slider first →") — a model affordance.
- stacks-queues from step 3 on, and the array operations buttons (steps 4–5): clicks light the exact
  matching line and the shifts counter makes cost real — proof the instrument works when wired right.
- Local-first, portable progress (export/import, no account); reduce-motion + light theme exist.
