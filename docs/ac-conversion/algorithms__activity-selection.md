# Activity Selection — Annotated-Canvas Conversion Plan

Source lesson: `src/categories/algorithms/topics/activity-selection/`
Target form: `src/app/sandbox/annotated-canvas/page.tsx` (one beat per derivation step; explanation lives ON the canvas as a positioned panel + arrow; real Python docks at right and the active line follows the beat).

**Canvas model.** The visual is a single-track timeline (one shared room) drawn as horizontal bars, one meeting per row. The x-axis is hours 9→17. Each bar's left edge = start, right edge = end. A dashed vertical line marks `free at` (when the room is next empty). This is the `array` primitive bent onto a time axis — treat each bar as one array element that also carries a start/end position. Mobile shrinks the hour pixel width; keep panels `top`/`bottom` so they never sit over the bars.

**@sync labels available in `algorithm.py`** (single source of truth): `sig`, `sort`, `result_init`, `last_end`, `loop`, `compatible`, `select`, `update`, `result`.

**Tone legend used below:** `idle` = plain bar; `active` = the bar currently being examined (sky); `accepted` = kept (green); `skipped` = rejected (red, it clashed); `dimmed` = not yet reached.

---

### Beat 1 — The setup · One room, seven requests — fit the most
- **narration**: One meeting room. Seven people each want it, each with a start time and an end time. Two meetings can share the room only if they don't overlap — touching is fine (one ends at 11, next starts at 11). Fit as many as you can.
- **visual**: array (timeline). All seven meeting bars drawn in their real positions on the 9→17 hour axis, all `idle`. Overlaps are visible as bars sitting at the same height/time. A counter shows "overlapping pairs" and "possible subsets to try". Nothing highlighted yet.
- **panel**: top
- **arrow**: from the panel down to the cluster of clashing bars around 11:00–14:00 (the most tangled region), to show "these all want the room at once".
- **codeLabels**: `sig`
- **interaction**: none

### Beat 2 — The obvious thing · Try everything, or grab a quick rule that lies
- **narration**: You could test every group of meetings and keep the biggest clash-free one — but seven meetings means 128 groups, thirty means a billion. Too slow. So you guess a rule: "shortest first?" A short midday meeting blocks both halves. "Earliest start?" An all-day 9-to-5 blocks everything. Both wrong.
- **visual**: array (timeline). Same seven bars. Highlight the all-day "all-hands" bar (9→17) in `skipped`/red to show how earliest-start or biggest-blocker rules backfire; tone the rest `dimmed`. Keep the "128 subsets" counter visible to make the brute-force cost concrete.
- **panel**: bottom
- **arrow**: from the panel up to the long all-day bar (the rule-breaker that "blocks everything").
- **codeLabels**: `sig`
- **interaction**: none

### Beat 3 — The wedge · Sort by end time, then always take the one that frees the room soonest
- **narration**: Try a rule about when each meeting FREES the room. Press "sort by end" — the bars reorder so the earliest-finishing one sits on top. Then press play: walk down the list, keep a meeting only if it starts at or after the last kept one ended. Freeing the room earliest can only help.
- **visual**: array (timeline), interactive. Bars animate into end-time order on "sort by end". On play, the scan walks top-down: current bar turns `active`, kept bars turn `accepted` (green), clashing bars turn `skipped` (red). A dashed vertical `free at <hour>` marker slides right each time a meeting is accepted.
- **panel**: top (instruction + the intuition note "the room is free at the earliest possible moment; that can only help"). Use a second `note` panel for the intuition line so the main panel stays short.
- **arrow**: from the panel to the dashed `free at` marker (the heart of the rule: "this line is when the room opens up again").
- **codeLabels**: `sort` on the sort action; then `compatible` on every check, plus `select` + `update` whenever a meeting is accepted (the visual emits these per frame via `onActiveLine`).
- **interaction**: wedge — the user MUST press "sort by end" (and then play/step) before continuing. PRESERVE this gating step.

### Beat 4 — The derivation · Sort once, walk once, track when the room is free
- **narration**: The whole thing is five steps: (1) sort meetings by end time; (2) keep `last_end`, a single number for when the room next opens; (3) walk the sorted list; (4) if a meeting starts at or after `last_end`, take it and set `last_end` to its end; (5) else skip. Why best? Swap any other first pick for ours — ours frees the room no later, so everything that fit after theirs still fits. The swap never loses a meeting.
- **visual**: array (timeline), auto-play, pre-sorted. Bars already in end-order; the greedy walk replays automatically (active → accepted/skipped), dashed `free at` marker sliding right. A small inset or callout shows the "swap" idea: two candidate first-bars, ours ending sooner, the tail of meetings fitting after either.
- **panel**: top (the five steps) + a `note` panel bottom-left stating the principle: "the locally best choice — free the room first — is never worse than any other. So greed wins." First use of `last_end`: gloss it in the narration as "a single number for when the room next opens" (done above).
- **arrow**: from the principle note to the two candidate first-bars in the swap inset (showing "ours ends no later").
- **codeLabels**: `sort`, `last_end`, `loop`, `compatible`, `select`, `update` (the full machine; the active line still marches with the auto-play scan via `onActiveLine`).
- **interaction**: playback

### Beat 5 — The operations · Sort once, then one clean pass
- **narration**: Sorting costs O(n log n) — that's "cost grows a bit faster than the number of meetings, but slowly": a thousand meetings is about ten thousand tiny comparisons. The walk costs O(n) — "cost grows in step with the number of meetings", one quick check each. Memory is just `last_end` plus the kept list. The sort is the only pricey part.
- **visual**: cascade / array (timeline). Keep the finished sorted timeline (all bars resolved: accepted green, skipped red) and overlay two cost labels: a slow-growing curve/badge for the sort (O(n log n)) and a straight one-per-bar badge for the walk (O(n)). Optionally a small bar showing "n=1000 → ~10,000 compares" to make O(n log n) tangible.
- **panel**: bottom
- **arrow**: from the panel up to the sorted bar stack labelled "this ordering = the O(n log n) sort; the walk over it = O(n)".
- **codeLabels**: `sort`, `loop`
- **interaction**: none

### Beat 6 — The generalization · Greedy works when the swap argument holds
- **narration**: Greedy means: at each step take the locally best option and never undo it. It's allowed whenever you can argue "if someone chose differently first, I could swap mine in without losing." Same shape: scheduling jobs on one machine, the most non-overlapping intervals, fitting talks in one track. It FAILS when no clean swap exists — like making 30¢ from coins worth 1, 12, 25: grabbing the 25 strands you. Then you need to step back (dynamic programming).
- **visual**: boundary / custom. Left half: the activity-selection timeline shrunk to a thumbnail with a green "swap works → greedy wins" tag. Right half: a coin-change failure strip — coins {1, 12, 25}, target 30 — showing greedy grabbing 25 then getting stuck on five 1s, tagged red "swap fails → needs backtracking". The contrast line splits "greedy" from "dynamic programming".
- **panel**: top
- **arrow**: from the panel to the boundary line between the green "greedy works" side and the red "greedy fails" coin side.
- **codeLabels**: `compatible`, `select` (the local-best choice that the swap argument protects).
- **interaction**: none

### Beat 7 — The pattern · Greedy
- **narration**: The name is Greedy. The hard part isn't the code — it's knowing greed is allowed. The test is the swap argument: if the locally best choice is never worse than any other, stop second-guessing. Open the code panel — five lines of real work, one line of sort.
- **visual**: array (timeline), final frame. The completed schedule: kept meetings glowing `accepted`/green with a "kept N of 7" tally; skipped ones faded. A panel lists the pattern signals (fit-the-most non-overlapping things; minimum X to cover all Y; pick the cheapest available with a local-best rule; local-best can't block global-best).
- **panel**: bottom (signals list) + a `note` panel top with the one word "Greedy."
- **arrow**: from the "Greedy." note to the green accepted bars ("this clash-free set is what greedy produced").
- **codeLabels**: `sig`, `sort`, `loop`, `compatible`, `select`, `update`, `result` (light the whole function — "open the Code panel to see the Python").
- **interaction**: none

---

## Notes

- **Jargon taught in-lesson (first appearances):** `last_end` (Beat 4, glossed as "a single number for when the room next opens"); `O(n log n)` and `O(n)` (Beat 5, both glossed in plain words — "cost grows a bit faster than the count, but slowly" / "grows in step with the count"); "greedy", "swap argument", and "dynamic programming" (Beats 6–7, each glossed in plain words). "Overlap" is defined concretely in Beat 1 (touching endpoints are allowed). No raw `arr[i]`/`None`/`len`/pointer/stack terms appear, so nothing else needs a gloss.

- **Wedge preservation:** Beat 3 is the gating step in the live lesson (`SortAndPickViz` calls `onWedgeInteraction`). It MUST stay a `wedge`: the user presses "sort by end" and then play/step before "Next" unlocks. Map it to `onInteractionDone` in the new contract. Beats 4–7 are static or `playback`.

- **Code-sync mapping (verified against `algorithm.py`):** the live visualizer's constants `LINE_SORT_BY_END="sort"`, `LINE_COMPAT_CHECK="compatible"`, `LINE_ACCEPT="select"`, `LINE_UPDATE_LAST_END="update"` all resolve to real `@sync` anchors. The `.py` also exposes `sig`, `result_init`, `last_end`, `loop`, `result` which the cards never lit; this plan uses `last_end`/`loop` in Beat 4, `loop` in Beat 5, and the full set in Beat 7 so the docked panel shows the complete machine at least once.

- **Mobile / dense visual:** the timeline is wide (LABEL_W + 8·HOUR_PX). On mobile `HOUR_PX` drops to 28 and labels shrink to 8px. Keep all panels `top`/`bottom` (never `left`/`right`) so they don't crowd the already-narrow bars, and let the canvas scale-to-fit like the reference page's `ResizeObserver`. The `free at` marker label and hour ticks are tiny — verify legibility at mobile scale before shipping.

- **Content bug / weak spot spotted in the current lesson (Step 6 / Beat 6):** the coin-change counter-example in `derivation.tsx` is garbled. It says *"Better answer: two 12s and a 6… wait, there's no 6."* — 30 is genuinely NOT representable with {1, 12, 25} at all (12+12=24, +6 impossible; 25+5·1=30 is the only way and uses 6 coins; greedy gives exactly that). The "two 12s and a 6" aside is a dead end that confuses rather than clarifies. **Fix in the conversion:** use a denomination set where greedy provably loses to an exact better answer — e.g. coins {1, 3, 4}, target 6: greedy takes 4+1+1 = 3 coins, optimal is 3+3 = 2 coins. That cleanly demonstrates "greedy fails, DP wins" without the broken arithmetic. (Narration above keeps the original {1,12,25}/30 framing to stay faithful, but the visual/example should switch to {1,3,4}→6; flag for content review.)

- **Faithfulness:** all seven derivation steps map 1:1 to seven beats. The generalization (Beat 6) and the pattern-naming (Beat 7) are both preserved as distinct beats, matching the source's Step 6 and Step 7.

---

## Peer review

- **verdict: needs-work**

- **issues:**

  - **Beat 6 — visual/narration/note contradict each other on the coin example (must fix before build).** The narration and `visual` both hard-code the broken `{1, 12, 25}, target 30` example ("greedy grabs a 25 and gets stuck on five 1s"), but the author's own Notes section (line 82) correctly proves that 30 with {1,12,25} is NOT a greedy failure at all — `25 + 5×1 = 6 coins` is the *only* representation, so greedy is optimal there, and the lesson's "two 12s and a 6" is nonsense. The Notes say to switch the visual to `{1,3,4}→6` but leave the narration AND the Beat-6 `visual` line still showing `{1,12,25}/30`. As written, the beat would render a red "swap fails" tag over an example where the swap does NOT fail. CONCRETE FIX: rewrite the Beat 6 narration and `visual` to use `{1,3,4}, target 6` (greedy: 4+1+1 = 3 coins; optimal: 3+3 = 2 coins) end-to-end; do not keep the {1,12,25} framing "to stay faithful" — staying faithful to a wrong example is a bug, not faithfulness.

  - **FEASIBILITY — the "array (timeline)" primitive named throughout does not exist in the AC target.** The annotated-canvas page (`src/app/sandbox/annotated-canvas/page.tsx`) is hand-authored SVG built from `Cells` (a uniform 40px grid), `Bracket`, and `Arrow` — there is no generic `ArrayViz`/`GridViz`/`StackPanel` component, and `Cells` draws equal-width cells, not start/end-positioned bars on an hour axis. Every beat here needs a brand-new `Bars`-on-time-axis SVG renderer (left = start·HOUR_PX, width = (end−start)·HOUR_PX), an hour-tick axis, and an animated `free at` dashed line. That code already exists in the live `visualizer.tsx` (`SortAndPickViz`/`DerivedViz`) and must be ported into the AC page. CONCRETE FIX: state explicitly that Beat 1–7 require a new bespoke timeline SVG (port the bar/axis/`free-at` rendering from `activity-selection/visualizer.tsx`), not the binary-search `Cells` grid; otherwise "array (timeline)" reads as "reuse an existing primitive" which is false.

  - **FEASIBILITY — panels are positioned by absolute `{left, top, width}`, not the `top`/`bottom`/`left`/`right` keywords the plan uses.** The `Beat` interface is `panel: { left; top; width }` plus an optional `panel2`. The plan's `panel: top` / `panel: bottom` / `arrow: from the panel to X` are pseudocode that maps to real pixel coordinates plus a hand-placed `<Arrow x1 y1 x2 y2>`. The mobile note (line 80) says "keep all panels top/bottom (never left/right)," but the contract has no left/right concept — panels are free-positioned and the author must pick coordinates that clear the wide timeline at both desktop (HOUR_PX 56) and mobile (HOUR_PX 28) scale. CONCRETE FIX: replace the `top`/`bottom` keywords with concrete intent ("panel near y=28 above the bars" / "panel below the last row") and note each beat needs an explicit arrow endpoint pair, since the AC page does not auto-route arrows.

  - **Beat 1 — counters ("overlapping pairs", "possible subsets to try") need a renderer that doesn't exist yet, and risk being unexplained jargon for a 15-year-old.** "Possible subsets to try" is fine, but a bare "128" badge with no gloss invites "128 of what?". The number is also Beat 2's payload (brute force = 128). CONCRETE FIX: drop the counters from Beat 1 (keep it purely "here are seven requests, watch them clash") and introduce the 128 only in Beat 2 where the narration explains it; or label the Beat-1 badge in words ("128 ways to pick a subset of 7 meetings").

  - **Beat 4 — `last_end` is glossed, but `float("-inf")` (its initial value in `algorithm.py`) will be visible the moment the Code panel is open, and is never glossed.** A 15-year-old reading the docked Python sees `last_end = float("-inf")  # @sync: last_end`. The plan lights `last_end` as a codeLabel in Beats 4 and 7 but the narration only says "a single number for when the room next opens" — `-inf` ("the room has been free forever, so the first meeting always fits") is left unexplained. CONCRETE FIX: add one clause to Beat 4 narration glossing the start value, e.g. "we start `last_end` at 'minus infinity' — meaning the room has been free since before time, so the very first meeting always qualifies."

  - **Beat 3 — narration "keep a meeting only if it starts at or after the last kept one ended" silently assumes the FIRST meeting is always kept; a careful 15-year-old may stall on "what's the last kept one for meeting #1?".** This is the same `-inf` seed gap as above but it bites earlier, in the wedge beat where the learner is actively stepping. CONCRETE FIX: add "(the first meeting is always kept — nothing has used the room yet)" to Beat 3 so the first `active→accepted` transition isn't mysterious.

  - **COHERENCE — Beat 2 codeLabels `sig` mismatches the narration.** Beat 2 is entirely about brute force (128 subsets) and two wrong heuristics; none of that lives in `fit_meetings`'s signature line. Lighting `sig` again (after Beat 1 already lit it) tells the learner "this narration corresponds to the function signature," which it doesn't. CONCRETE FIX: either light nothing in Beat 2 (the Code panel stays dimmed while we discuss approaches the code does NOT take), or keep `sig` only if the docked panel is meant to read "this is the contract we're trying to satisfy" and SAY so in the narration.

  - **CORRECTNESS (minor) — Beat 5 "about ten thousand tiny comparisons" is right but the source says "small," not "tiny"; and O(n log n) for n=1000 is ~9966, fine to round to 10k.** No fix required; flagging only that the badge "n=1000 → ~10,000 compares" should say "comparisons" consistently with the gloss and not imply an exact count.

  - **Verified clean (no action):** all @sync labels used (`sig`, `sort`, `result_init`, `last_end`, `loop`, `compatible`, `select`, `update`, `result`) resolve to real anchors in `algorithm.py`; the four live-viz constants (`sort`/`compatible`/`select`/`update`) are correct; the wedge-preservation call-out for Beat 3 is correct (`SortAndPickViz` gates via `onWedgeInteraction`/`until: 3`); the "touching endpoints allowed" overlap definition matches the source; the 1:1 seven-step mapping is faithful; the swap-argument wedge and the greedy generalization are both preserved.
