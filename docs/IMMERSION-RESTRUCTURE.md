# Groundwork — Immersion Restructure

> **What this is.** A synthesis of four independent immersion/IA audits (spatial composition,
> progressive disclosure & focus mode, narrative flow & pacing, viewport & canvas choreography)
> into one restructuring plan for the lesson layout. **This is not a redesign.** Every piece the
> lesson needs already exists in `LessonRuntime.tsx` — the on-canvas panel, the detail card, the
> code pane, the connector, the arrows, the progress dots. The problem is purely **arrangement**:
> the pieces are stacked vertically when they should be composed spatially, and the chrome never
> recedes. This document says *where each piece should live* and *what melts away when*, grounded
> in the real engine (`src/shared/lesson/LessonRuntime.tsx`) and the persona gallery
> (`docs/ac-conversion/screens/`).
>
> Companion docs: `docs/IMPROVEMENT-PLAN.md` (Phase 5 = "Cognitive-load layout polish" is the
> natural home for most of this) and `docs/PRODUCT-ASSESSMENT.md` issues #3 (panel/card redundancy)
> and #4 (overloaded climax). **Honored throughout:** Subhayu's note to "use the empty lower space
> for the cards," the 10th-grade-accessible spirit, and reveal-on-demand (content-first, calm default).

---

## 1. Executive summary — the thesis

The lesson engine is excellent and the *content* is right; what is wrong is that **the layout
reads top-to-bottom as `text → diagram → text` when it should read as one annotated scene with the
diagram as its gravitational center.** Today the eye lands on the bright sky-tinted on-canvas
panel (top), skips past a small floating diagram, and settles on a large bordered detail card at
the bottom that repeats nearly the same sentence — so the animated array/grid/tree, the one thing
the learner is supposed to think *inside*, becomes a thin connective hyphen between two text blocks.
Meanwhile ~150–290px of always-on chrome (header + "BUILDS ON" row + prereq nudge) shoves the hero
down on every beat, the diagram floats in a centered column ringed by dead gutters that never get
filled, and `AnimatePresence mode="wait"` dissolves and re-mounts the whole scene on every "Next"
so seven beats read as seven slides instead of one continuous derivation.

The recomposition is four moves that reinforce each other. **(1) Make the diagram the hero** by
enlarging it to claim its plane and demoting the on-canvas panel to a single anchored takeaway line.
**(2) Re-home the detail card into the empty lower/side space beside the diagram** — exactly where
Subhayu pointed — so explanation sits *next to* the visual as a quiet rail, not stranded below it,
turning the text-diagram-text sandwich into one scene where you read across, not down. **(3) Make
the chrome recede** — show prerequisites and breadcrumbs once at beat 0, then collapse them into a
slim strip — and add a genuine **Focus Mode** that melts everything but canvas + caption + Next.
**(4) Make the scene persist across beats** — keep the array/grid/tree mounted and animate only the
incremental change, with an accreting "what we've established" spine growing in the now-used flank —
so each "Next" *adds a layer* instead of cutting to a new page. None of this invents a new component;
it relocates and re-roles the ones that already ship.

---

## 2. Current region map

What is on screen now, per the engine (`LessonRuntime.tsx`), confirmed against
`screens/binary-search-setup.png` (a *setup* beat with code open):

```
DESKTOP (h-screen flex flex-col overflow-hidden — strictly zero-sum, no scroll)
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER  grid-cols-[1fr_auto_1fr]  ~58px       [L141]                          │
│  breadcrumb …………  ◆ TOPIC · step k/N · LABEL  ………… ‹prev  next›               │
├──────────────────────────────────────────────────────────────────────────────┤
│  BUILDS ON  ▸ pill  ▸ pill  ▸ pill            ~40px  [L206]  (every beat)       │
├──────────────────────────────────────────────────────────────────────────────┤
│  RECOMMENDED FOUNDATION  (beat 0 only) — full-width nudge banner  [L225]        │
├──────────────────────────────────────────────────────────────────────────────┤
│  flex-1  xl:flex-row                                                            │
│  ┌──────────────────────────────────────────┐   ┌───────────────────────────┐ │
│  │            (large empty top margin)        │   │  </>  CODE  (right ~46%)  │ │
│  │   ┌─────────────────────────┐              │   │  algorithm.py             │ │
│  │   │  ON-CANVAS PANEL [L255]  │ ← eye lands  │   │  ▶ line follows the beat  │ │
│  │   │  THE SETUP / takeaway    │   here 1st   │   │  1 def binary_search…     │ │
│  │   └─────────────────────────┘              │   │  …                        │ │
│  │           │ arrow                          │   │  (practice list appends   │ │
│  │           ▼                                 │   │   below code on last beat)│ │
│  │   [ 3 ][ 7 ][11][14]…[81]  ← small diagram │   └───────────────────────────┘ │
│  │             mid                             │                                 │
│  │                                             │                                 │
│  │      (WIDE EMPTY LOWER BAND — the void)     │ ← Subhayu: put the cards here   │
│  └──────────────────────────────────────────┘                                 │
│  ┌──────────────────────────────────────────┐  max-w-[780px] mx-auto [L286]    │
│  │  DETAIL CARD  (open by default)            │ ← eye lands here LAST,          │
│  │  connector (italic, faint, mid-card) [L299]│   repeats the panel sentence    │
│  │  the fuller why/how …                      │                                 │
│  └──────────────────────────────────────────┘                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│  CONTROLS   ← Back   ● ● ● ○ ○ ○ ○   Finish ✓        [L379]                      │
└──────────────────────────────────────────────────────────────────────────────┘
   (N) ← Next.js dev avatar, prod-absent; on mobile it sits over Back

MOBILE (<xl: the row linearizes to flex-col → one long scroll)
  header (triple-stack risk) → BUILDS ON → full nudge → tiny ~120px canvas band
  → on-canvas panel lands ON the diagram → large detail card → bottom row crams
  ‹ • • • › + "</> CODE" tab + "I have the question →" action together.
  Result: the diagram and the synced code line are NEVER co-visible.
```

**The attention problems (what the map shows):**

- **Hero unclear.** The intended hero (the SVG diagram) is the *smallest, palest* element. Reading
  order is panel → (skip diagram) → detail card: `text → diagram → text`. The array reads as
  decoration between two paragraphs, not the stage the story happens on.
- **Panel/card double-up.** The on-canvas panel (`L255`) and the lower detail card (`L286`) carry
  near-verbatim copies of the same idea (binary-search beat 1: the phone-book line appears in both).
  Two competing text regions for one idea split the reading path and double the working-memory load;
  PRODUCT-ASSESSMENT #3 flagged this as load — here the *flow* cost is that the beat lands twice with
  no forward motion.
- **Empty space.** Wide L/R gutters and a tall lower band frame the diagram as a postage stamp on a
  big page (clearest on `sliding-window-b1`, `two-pointers-bmid`, `dfs-bmid`). The void *severs* the
  detail card from the diagram so they read as two unrelated panels. This is exactly the real estate
  Subhayu wants the cards to occupy.
- **Crowded climax.** On the final beat `showCode` auto-opens (`L66-69`), the detail card stays open,
  and the practice list mounts beneath the code (`L343`) — four text-bearing regions compete at peak
  intrinsic load while the synced visual (the whole point of the recap) is the smallest thing on screen.
- **Beat-0 chrome stack.** Header + BUILDS ON + RECOMMENDED FOUNDATION eat the top ~150–290px before
  the lesson starts; on multi-prereq topics (`dfs-bmid`) the canvas is actively crushed. The first
  impression is administrative chrome, not the hook.
- **Mobile scroll breaks sync.** The left↔right visual↔code coupling that *is* the pedagogy becomes
  a top↔bottom ping-pong scroll. The panel lands on the diagram instead of pointing at it; the action
  button competes with the code tab and the dots. Cause and effect are never co-visible.
- **Slideshow, not derivation.** Three `AnimatePresence mode="wait"` blocks all keyed to `beat.id`
  (`L242`, `L251`, `L288`) dissolve-and-reset the whole scene every "Next." The array jumps vertically
  and the panel flips above/below it between beats — the stage reorganizes under the learner mid-thought.

---

## 3. Proposed restructure — before → after

Per region. Each is a **re-arrangement of existing pieces**, not a new component. Desktop first,
then the mobile variant, then why it deepens immersion.

### 3.1 Header / chrome  (`L141`, `L206`, `L225`)

**FROM (today):** Three always-on top bands. The 58px header, then a full-width "BUILDS ON" pill row
on *every* beat, then a full-width "RECOMMENDED FOUNDATION" banner on beat 0. ~150px (up to ~290px
on multi-prereq topics) of administrative chrome above the hero on every screen.

**TO (proposed):**
- **Beat 0 keeps the full orientation moment** — the header, a compact builds-on line, and the prereq
  nudge are appropriate *once*, at entry.
- **From beat 1 onward, collapse the top into one ~32px strip**: `◆ TOPIC · step k/N · LABEL` + a
  back-chevron. Breadcrumb, prev/next-topic, and BUILDS ON tuck behind a hover/tap on that strip.
- **Demote prerequisites into the header**: BUILDS ON becomes a single small chip ("builds on Arrays
  ⓘ") next to the title; the foundation nudge becomes a one-line dismissible inline strip or corner
  toast — never a full-width band that displaces the canvas. Reclaim ~110–200px so the canvas begins
  by ~y=80.

**MOBILE:** The header responsively stacks (row 1 = back-chevron + step k/N, row 2 = title) — already
the Phase 1 grid fix. The nudge/builds-on collapse to a one-line dismissible bar shown *only* on beat 0.

**Why it deepens immersion:** the hero diagram becomes the first and largest thing in view instead of
the third. Orientation stays one tap away (still advisory, never gating — per the resolved Decisions
log) but stops shouting on every beat. This is the prerequisite for everything below: the canvas can
only become the field of view once the ~150px above it recedes.

### 3.2 The visual / hero  (`L232-248`, the `areaRef` scale clamp `L90-101`)

**FROM (today):** Fixed 860×470 plane centered in a `flex-1` column, scaled to fit but never widened.
On wide-aspect topics it floats as a small island ringed by large empty L/R gutters and a tall empty
lower band (`screens/binary-search-setup.png`: the array sits mid-plane with the entire lower half empty).

**TO (proposed):**
- **Let the plane claim its area.** Raise the scale clamp and bias the fit toward width so wide-aspect
  topics enlarge into the side space — cells/grids/nodes get physically bigger (which also improves
  legibility and the click targets for `ClickToHalve` and the two-pointers cells).
- **Left-bias the visual** and reserve a flank for the (now short) panel and the relocated detail rail
  (3.4), so nothing in the plane is dead.
- **Per-beat fit, optionally:** sparse beats center tighter and pull the side rail inward; dense beats
  (e.g. `recursion`, which already uses width well) expand toward full-bleed. A static one-size plane
  is what makes some beats feel cramped and others lost in space.

**MOBILE:** the canvas gets the **top ~60%** of the viewport as the default field, rendered at full
mobile width as the top block — the diagram stays whole and is the most-visible region, not a ~120px sliver.

**Why it deepens immersion:** an empty margin signals "nothing important here." A plane-filling diagram
is unmistakably the thing the eye commits to first. The visual stops being a hyphen and becomes the stage.

### 3.3 On-canvas panel  (`L255-275`)

**FROM (today):** A bright sky-tinted bordered box (top-center on most beats) carrying a label, title,
and a full paragraph — frequently the *same* paragraph as the detail card. It's the heaviest thing on
screen, so the eye lands there first and treats it, not the diagram, as the content.

**TO (proposed):** **The panel = one-line beat takeaway**, anchored by its arrow to the exact cell/node
it describes (e.g. "lo and hi bracket what's still possible," with the arrow on the bracket). Demote it
from a bordered box to a calm caption tied to the visual. It carries the "what just changed" — never the
deeper why/how, and **never restates a sentence that also lives in the detail rail.**

**MOBILE:** drop the absolute positioning that lands the panel *on* the array. Render the short panel
*immediately beneath* the visual with a small arrow/connector pointing up at it, so it annotates the
diagram from just below rather than covering it.

**Why it deepens immersion:** one short canonical line on the canvas keeps the eye on the diagram; the
panel becomes the diagram's caption, not a competing hero. This single move ends the "read it twice"
collapse of the one-beat-one-move rhythm.

### 3.4 Detail card  (`L286-316`) — **the core move, honoring "use the empty lower space"**

**FROM (today):** A separate boxed container, `max-w-[780px] mx-auto`, open by default, sitting *below*
the canvas separated by a ~120–180px void, capped at `max-h-[34vh]` and frequently clipped (in
`bs-b4` the named-principle callout is cut off at the card's bottom edge). It repeats the panel and
is the *last* thing the eye reaches — the `text → diagram → text` sandwich.

**TO (proposed):** **Re-home the detail content into the empty lower/side region of the canvas plane,
beside the diagram** — exactly where Subhayu pointed.
- On `xl+`, dock the fuller explanation as a **quiet vertical reading rail in the flanking dead band**
  (the side opposite the on-canvas arrow), **top-aligned with the canvas** so the diagram and its words
  sit side by side in one glance — read *across*, not *down*. No scroll-down, no clip.
- **Re-role it so it never duplicates the panel:** the rail carries *strictly the deeper why/how* that
  is NOT in the panel. If it would only paraphrase the panel, it doesn't render (PRODUCT-ASSESSMENT #3).
- **Default it collapsed to a thin tab once past beat 0** (reveal-on-demand): the short panel carries the
  beat; the rail is opt-in depth adjacent to the visual. Setup beats may keep it open; derivation/interaction
  beats auto-collapse it to a stub so the canvas + short panel carry the action.
- **Promote the connector out of the card.** Today it's buried mid-card, faint and italic (`L299`),
  visible only when the card is open. Render it as a brief, prominent **lead-in line that animates in
  *first* on beat entry** — a one-line band at the top of the canvas area — carrying "last beat concluded
  X, so now ask Y" at the *threshold* of the new beat, then it settles. It is the narrative glue; it
  belongs at the door, not in a footnote.

**MOVE THE CONNECTOR'S SIBLING IDEA INTO A PERSISTENT SPINE.** Use part of the reclaimed lower flank for
a slim **accreting "what we've established so far" rail** that grows one short line per completed beat
("1. sorted means a guess tells you direction · 2. check the middle · 3. each check drops a half…"),
current line lit. It stays across beats and accumulates — the visible spine of the derivation.

**MOBILE:** the detail prose moves into a **bottom sheet that pulls up on demand**, replacing the
always-open card. The diagram + its short caption stay in view; depth is one tap away.

**Why it deepens immersion:** this single move does four things at once — executes Subhayu's "use the
empty space," closes the visual-to-text void that severs explanation from diagram, kills the second
competing text hero, and recovers the clipped-principle problem (a top-aligned rail isn't capped at
34vh below a fold). The scene becomes one annotated stage: visual + words in one glance.

### 3.5 Code panel  (`L322-374`)

**FROM (today):** Opening code switches the row to `flex` and the canvas re-fits to ~46% width and
shifts left (`L90-101`, `L322-325`); the code grows to near-full height. Reveal-on-demand currently
*rebuilds the room* — every glance at code costs a re-orientation of where the diagram now lives. At
the synced climax this inverts the hero relationship: code dominates, the visual shrinks.

**TO (proposed):**
- **Reserve the right gutter for the whole lesson** so opening code fills *reserved* space rather than
  reflowing the hero. Keep the visual's scale and position stable when code opens; dim (don't resize)
  the canvas, or open code as a right-side overlay drawer that slides over the gutter. A stable diagram
  means peeking at code costs no re-orientation.
- **On open, draw a connecting beat between the highlighted line and the cell/marker it operates on**
  (a hairline or shared color pulse) so the spatial message is "this line IS that move," not "two separate
  panels side by side." The code is the same derivation in Python — the transition should read as
  continuation, not a mode-switch into an IDE.
- **At the code-open split, keep the canvas at least equal share.** Cap code at a comfortable reading
  width; if the file is long let it scroll within its pane rather than steal width from the visual. The
  synced line is only meaningful against a legible diagram. Keep the slim `</> CODE` tab where it is for entry.

**MOBILE:** **swap, don't stack.** Pin the canvas in the upper viewport; directly beneath it a single
**sticky one-line code strip** shows ONLY the active line(s) (e.g. `return mid`), tappable to expand the
full file as a sheet. The detail text scrolls below both. The diagram and its live line *never* separate.
(This is the Phase 5 "mobile code strip" item made concrete.)

**Why it deepens immersion:** reveal-on-demand should *add a layer*, not relocate the learner's spatial
anchor. Holding the visual steady and tying line↔cell makes the reveal feel like the reasoning
crystallizing into code. On mobile it restores the non-negotiable left↔right sync as an up↔down
co-visible pair — the pedagogy survives the small screen.

### 3.6 Controls  (`L379-411`)

**FROM (today):** A centered bar (Back · dots · Finish/Next). On mobile the "</> CODE" tab and the
forward action share the bottom band with the dots, so the single most important control (advance the
beat) is visually equal to a secondary affordance and tiny dots; the dev avatar can clip Back.

**TO (proposed):** Keep the desktop bar as is. **On mobile, lift prev/next + a single unmistakable
primary forward button into a fixed bottom action bar (Back · dots · big Next), and demote the code
affordance** to the tap-to-expand strip under the canvas (3.5) so it stops competing at the foot of the
screen. Lift the avatar off Back.

**Why it deepens immersion:** the path forward should be thumb-obvious and singular. Removing the
three-way competition at the foot of the screen makes advancing beats feel effortless rather than fiddly.

### 3.7 Transition behavior (cross-cutting, the engine itself — `L242`, `L251`, `L288`)

**FROM (today):** Three `AnimatePresence mode="wait"` blocks all keyed to `beat.id` — the SVG group, the
panel layer, and the detail card all cross-fade out and back in on every "Next." The shared array/grid/tree
jumps vertically and the panel flips sides of it between beats. Interaction end-state (lo/hi placed, window
slid) resets on every beat change (`L79`), so the learner's action evaporates.

**TO (proposed):**
- **Persist the hero visual.** Key the visual's `AnimatePresence` on the visual's *identity*, not the
  beat — keep the same array/grid/tree mounted across beats and animate only the per-beat overlays
  (markers, highlights, arrows) in/out. Cells recolor or gain a `lo`/`hi` tag rather than dissolve. Lock
  the visual to one fixed vertical anchor so it never jumps.
- **Carry interaction end-state into the next beat as its start-state** — seed the next beat with the
  configuration the learner left (markers stay where they put them; the new beat builds on top).

**Why it deepens immersion:** persistence-over-dissolve is the single biggest lever for "one continuous
derivation vs slideshow." When the same 14 cells stay put and merely gain annotations, every "Next"
reads as "more is now understood about THIS," not "here is a new page." Continuity of consequence makes
the derivation feel co-authored rather than watched. (This is engine work — heavier than layout; see the
moves table for sizing.)

---

## 4. A genuine focus / immersion mode

**What it is.** A real mode (toggle + auto-engage after the learner advances past beat 0) where the
diagram becomes the *entire* field. It reuses across all 20 topics with zero per-lesson authoring —
the format already wants the diagram to be the hero; this is the missing primitive that lets the chrome
finally recede.

**What melts away (animates out):**
- the header bar, the BUILDS ON row, the breadcrumb, the prev/next-topic links;
- the prereq nudge (it only belonged at beat 0 anyway);
- the dev avatar;
- the boxed framing of the on-canvas panel (it becomes a calm caption anchored to the visual);
- the code tab is demoted to a hairline edge.

**What stays:**
- the diagram, expanded to fill the freed width and height;
- the short beat caption (the panel's one-liner) and the accreting spine in the flank;
- a single thin **progress + Next** affordance;
- a small persistent **"exit focus"** control, top-right.

**Code & practice arrive as staged overlays, not stage rebuilds** — code slides over the reserved gutter
and dims the canvas (3.5); practice is deferred to a closing sub-beat (see §5 / the staged climax).

**How to enter/exit.** Enter: a toggle, or auto-engage on advancing past beat 0. Exit: `Esc`,
**hover-to-top** (the chrome slides back in for orientation, then recedes), or the explicit "exit focus"
control. On mobile, Focus Mode is the *default* — canvas-first with chrome and detail behind sheets.

**Why one primitive.** Focus Mode resolves the empty-gutter, redundant-card, always-on-chrome, and
overloaded-climax frictions at once, and it is the cleanest home for the staged climax: enter Focus Mode
with canvas + synced code side-by-side, one highlighted line at a time, detail demoted to a connector
line, practice hidden — then a "you derived it" sub-beat reveals the name, summary, and practice list as
a calm closing card in the now-freed canvas space.

---

## 5. Prioritized moves

Tagged S (quick win) / M (high-impact) / L (bold), with the IMPROVEMENT-PLAN phase each folds into.
**Phase 5 ("Cognitive-load layout polish") is the natural home for the layout moves**; the
persistence/transition work is genuinely *new* (it's engine choreography beyond Phase 5's stated scope).

| # | Move | Size | Region | Phase tie |
|---|------|------|--------|-----------|
| 1 | **Demote beat-0 prereq chrome out of the vertical stack** — BUILDS ON → header chip; foundation nudge → one-line dismissible strip/toast; collapse the top to a ~32px strip from beat 1. Reclaim ~110–200px. | S | Header/chrome (§3.1) | Phase 5 (extends Phase 1 prereq work) |
| 2 | **Differentiate panel vs detail by role so they stop doubling** — panel = one-line anchored takeaway; rail = deeper why/how only; never restate. | S | Panel + detail (§3.3, §3.4) | Phase 5 (= PRODUCT-ASSESSMENT #3) |
| 3 | **Promote the connector to a prominent transition lead-in** that animates in first on beat entry, above/atop the canvas — out of the card footnote. | S | Detail/connector (§3.4, §3.7) | Phase 5 |
| 4 | **Enlarge + left-bias the visual to fill its plane** (raise scale clamp, bias to width); reserve the flank for panel + rail. | M | Visual (§3.2) | Phase 5 |
| 5 | **Re-home the detail card into the empty lower/side flank as a top-aligned reading rail beside the diagram**, collapsed-by-default past beat 0. *(The core move — executes "use the empty space.")* | M | Detail card (§3.4) | Phase 5 |
| 6 | **Add the accreting "what we've established" spine** in the reclaimed flank — one lit line per completed beat. | M | Detail/flank (§3.4) | Phase 5 |
| 7 | **Stage the climax across two sub-beats** — 7a: canvas + synced code, one line at a time, no practice; 7b: name + summary + practice in the freed space. | M | Climax (§3.5, §4) | Phase 5 (= IMPROVEMENT-PLAN P5 final-beat staging + PRODUCT-ASSESSMENT #4) |
| 8 | **Make code an overlay drawer, not a stage rebuild** — reserve the gutter, hold the visual stable, draw a line↔cell connector on open. | M | Code (§3.5) | Phase 5 |
| 9 | **Mobile: canvas-first** — diagram top ~60%, short panel beneath it (not over it), sticky one-line code strip, detail in a bottom sheet, single fixed bottom action bar. | M | Mobile, all regions (§3.3–3.6) | Phase 5 (= IMPROVEMENT-PLAN P5 mobile code strip) |
| 10 | **Build a true Focus Mode** (toggle + auto-engage; chrome melts to canvas + caption + Next + spine; Esc/hover-to-top/exit control; default on mobile). | L | All chrome (§4) | **new** (layout primitive beyond P5 scope) |
| 11 | **Persist the hero visual across beats** — key AnimatePresence on visual identity, animate only per-beat overlays, lock the vertical anchor; carry interaction end-state into the next beat. | L | Transitions/engine (§3.7) | **new** (engine choreography) |
| 12 | **Per-beat canvas-fit mode** — sparse beats center tighter, dense beats go fuller-bleed; pairs with the Focus Mode fullscreen watch. | L | Visual (§3.2) | **new** (per-beat layout contract) |

**Suggested order:** 1 → 2 → 3 (quick wins, mostly text/CSS) ship the biggest perceived-immersion gain
for the least risk; then 4 → 5 → 6 (reclaim the void, the headline re-arrangement); 7 → 8 → 9 (climax,
code, mobile); finally the bold 10 → 11 → 12 (Focus Mode + persistence are the deepest but most rewarding).

---

## 6. Open questions for Subhayu

Genuine forks where the audits diverge or where it's your taste call, not a clear right answer:

1. **Canvas: full-bleed vs boxed?** Should the diagram go edge-to-edge (an environment you're *inside*,
   strongest immersion) or stay a confidently-sized but bordered plane (calmer, keeps the "scene" frame)?
   Per-beat fit (move #12) can split the difference — but the default matters.
2. **Detail rail: open or collapsed by default past beat 0?** Reveal-on-demand says collapse it to a tab
   so the panel + diagram carry the beat; the content-first instinct says keep the depth visible. The
   middle path: open on *setup* beats, auto-collapse on *derivation/interaction* beats. Which default?
3. **Detail rail side: fixed, or opposite the arrow?** Always-right (predictable single axis for "more")
   vs. dynamically opposite the on-canvas arrow (never collides with what the panel points at)?
4. **Mobile: swap-views vs pinned-strip?** Swap between canvas and code as full-width views (each gets the
   whole screen) vs. a pinned canvas with a one-line code strip underneath (always co-visible, but the
   strip shows only the active line). The strip preserves sync; the swap gives each its full size.
5. **Focus Mode: auto-engage after beat 0, or opt-in only?** Auto = the immersive default the audits push
   for; opt-in = never surprises a learner who wants the orientation chrome present. (Auto on mobile,
   opt-in on desktop is one compromise.)
6. **Persistence (move #11): how far?** Full continuous-object morphing across all beats is the biggest
   immersion lever but the largest engine change. Acceptable to pilot it on binary-search (the gold
   reference) and fan out, mirroring how Phase 4 is being piloted — or hold it until the layout moves land?
7. **Climax practice reveal:** auto-advance to the "you derived it / practice" sub-beat, or require an
   explicit "Finish" click to surface practice (deferring the menu until the learner asks for it)?
