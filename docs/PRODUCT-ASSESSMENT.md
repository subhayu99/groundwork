# Groundwork — Multi-Persona Product Assessment

> Generated 2026-05-31 via a 6-persona evaluation workflow. Each persona evaluated the same
> shared screenshot gallery (home + mobile, the binary-search gold lesson beat-by-beat,
> code-open state, and a spread of other topics' default/interaction/last beats) plus the
> source where depth claims needed verification. Branch: `annotated-canvas-conversion`.
> No code was changed — this is assessment only.

Personas: **UX/usability researcher**, **Class-10 student (15 y/o target learner)**,
**Self-taught interview-prepper**, **Accessibility specialist (WCAG 2.2)**,
**Learning scientist**, **Product/growth strategist**.

---

## Executive summary

> **A 9/10 lesson engine wrapped in a 4/10 front door and a 3/10 reason-to-return.**

Every persona independently praised the binary-search gold lesson (bs-b1..b7) as best-in-class
instructional sequencing, and that quality holds across all 20 topics. But the product's value
is gated behind two weaknesses almost everyone hit:

1. A **home "map" that orients no one** — no entry point, jargon-named bubbles, decorative not navigational. (raised by 4/6)
2. A **mobile header that visibly breaks** on the device teens actually use. (raised by 6/6)

Three deeper structural gaps emerged beneath the polish:
- The **"Socratic" promise is overstated** — learners click *past* narration rather than predict before the reveal; the lone interaction unlocks on *any* click.
- **Zero retrieval / spacing / return loop** — the schemas these lessons build decay within days.
- **Accessibility for blind learners is absent** — the entire lesson lives in one undescribed `<svg>`.

The good news: the fixes are largely **additive** and reuse existing plumbing (beat specs,
the wedge-gate, ProgressStore, CollapsibleSection). The canvas format does not need rethinking —
it needs to be finished.

---

## What's genuinely strong (consensus praise)

- **The derivation arc itself.** "Visualgo animates a finished algorithm; this *makes* you derive it." (product strategist). The name "Binary Search" only appears on beat 7, after the mechanism is built (learning scientist: textbook abstract-after-concrete).
- **Per-beat forward-button labels** ("I have the question →", "Use the sortedness →", "Count the work →") act as a friendly nudge and state the next mental step.
- **Real, idiomatic, correct Python** — not pseudo-code. `@sync` tags make left↔right sync a real mechanism. (interview-prepper, after reading `algorithm.py`)
- **Reveal-on-demand code** correctly respects expertise-reversal — beginners aren't shown Python on beat 1.
- **A real reduced-motion provider + keyboard-operable cells** — "more than most edtech ships." (accessibility specialist)
- **Plain-language analogies** (phone book, Downloads-folder tree, names raining into buckets) land for the 15-year-old.

---

## Each persona's "one big thing"

| Persona | The single change they'd make |
|---|---|
| UX researcher | **Fix the front door** — the home map orients no one; add a "Start with Binary Search →" + recommended path + readable legend. |
| Class-10 student | **Fix the front door** — "asks me to choose between *Amortization*, *Monotonicity & Invariants* with no 'start here'. I'd bounce before reaching the great lessons." |
| Interview-prepper | **Add a 'hard' tier** — "the pedagogy already derives binary-search-on-the-answer (bs-b6) but never lets me *practice* the hard form. Everything tops out at medium." |
| Accessibility | **Give the canvas a voice** — `role="img"` + per-beat `aria-label`/`aria-live` from the beat spec you already have; today it's a silent rectangle to a blind learner. |
| Learning scientist | **Add a commit-an-answer step before each reveal** — flips it from fluent passive narration (illusion of competence) into genuine retrieval, without changing a single visual. |
| Product strategist | **Fix the front door + add a return loop** — replace the decorative graph with a derivation hook, then layer in a streak/daily-goal. |

Note how four of six converge on the **home page** and two independently land on the same
**prediction-before-reveal** fix.

---

## Consensus issues (raised by 2+ personas — highest confidence)

### 1. The home map fails as a front door — severity 5
*Raised by: UX, Class-10, Learning scientist, Product strategist*
No "start here", clipped/undeciphered legend, jargon-named bubbles that conflate abstract
"principles" with unmet "topics". It demands the learner already know the taxonomy it's
supposed to teach. **This is the conversion bottleneck for the entire product.**
→ Add one prominent **"New here? Start with Binary Search →"** CTA (deep-linked to bs-b1) +
a highlighted recommended path; move the legend into an always-visible readable key;
distinguish "principle" vs "topic" pills by shape/weight, not just color.

### 2. Mobile lesson header overlaps/collapses at ~390px — severity 4
*Raised by: all 6*
Breadcrumb + title + prev/next triple-stack; the floating "N" avatar covers the **Back**
button; progress dots nearly invisible. This is the primary device for teens *and* for shared
word-of-mouth traffic.
→ Responsive stack under ~430px: row 1 = back-chevron + step N/7, row 2 = title; move prev/next
into the bottom control bar; move/shrink the avatar off Back.

### 3. Top panel and lower detail card are largely redundant — severity 3
*Raised by: UX, Class-10, Learning scientist*
The same explanation appears twice (bs-b1, graphs-b1 say it nearly verbatim), doubling reading
load and competing for the same working-memory slot.
→ Differentiate by role: panel = short beat takeaway; lower card = deeper "why/how" behind the
existing **CollapsibleSection**, collapsed by default. Cut one where they fully duplicate.

### 4. The climax beat overloads — severity 3
*Raised by: UX, Class-10, Learning scientist*
On the last beat, code auto-opens AND the detail card AND the practice list appear at once —
exactly at peak intrinsic load, with the synced visual shrunk.
→ Stage it: synced code with the live line as its own step (panel demoted to a one-liner),
*then* reveal summary + practice. Highlight one code line at a time, tied back to the visual.

### 5. Jargon unexplained at point of use — severity 4
*Raised by: Class-10, Accessibility (readability), UX (legend taxonomy)*
On the map ("Amortization", "Monotonicity & Invariants") and inside lessons (O(n), log₂,
monotonicity, linear scan, bisect, None). "Each unexplained term is a small 'you're not smart
enough' jab."
→ First-appearance jargon = a dotted-underline chip that opens a one-line 10th-grade definition
on tap. Separate concrete "Topics" from abstract "principle" bubbles on the map.

### 6. Insufficient depth/practice ceiling — severity 4
*Raised by: Interview-prepper, Learning scientist (template robustness)*
Only 1–2 practice problems per topic, **no "hard" tier anywhere**, DP stops at 1-D — the exact
variants interviews grill on. (Source: 45 easy / 45 medium / 8 foundation / **0 hard**.)
→ Add a "hard" tier of true interview-form variants (Koko/Split Array for binary-search-on-answer;
a `dp-2d` topic), triple practice to ~5 per topic tagged by sub-pattern, hand-author dp-1d with
a real generative interaction first.

---

## Prioritized roadmap

### Quick wins (low effort, do first)
- Home legend always-visible & readable; "principle" vs "topic" pills distinguished by shape/weight.
- "New here? Start with Binary Search →" CTA deep-linked to bs-b1 (smallest version: one button).
- Progress dots → accessible stepper: ≥24px hit area, `aria-current="step"`, non-color cue, descriptive label.
- Make ClickToHalve **graded** — fire completion only on correct narrowing, with a one-line correction + retry.
- Connector questions → optional "think first / show answer" self-explanation toggles.
- Consolidate the three "back" affordances; add an explicit "Map / All topics" exit.
- Overflow-safe `mid = lo + (hi-lo)//2` in both lesson and solution; re-tag Backtracking "try, prune, undo"; swap YouTube-search links for vetted picks.
- Restore visible SVG focus rings; `aria-describedby` on the gated forward button.
- Plain keywords in `<title>`/H1/meta for SEO alongside the poetic marquee.

### High impact (medium effort, high payoff)
- **Fix the mobile header** (responsive stack, prev/next to bottom bar, avatar off Back) — universal, 6/6.
- **Give every canvas a voice** — `role="img"` + per-beat `aria-label`/`desc` + `aria-live` summary + state in cell names. *The one change that makes the product WCAG-conformant.*
- **Fix light-theme contrast to AA** across panels, captions, tags; audit both themes.
- **Commit-an-answer prediction gates** before the reveal on win/derivation/generalization beats (reuse wedge-gate). *Delivers on the Socratic promise.*
- Collapse the redundant panel/card into one progressive layer; stage the overloaded final beat.
- Tap-to-define jargon chips (lessons + map).
- End-of-lesson retrieval checkpoint (2–3 recall/applied questions) before practice.
- Rebuild home around a derivation hook + autoplaying clip; demote the graph to secondary.
- "Complexity & edge cases" penultimate beat on every lesson.

### Strategic (larger / structural bets)
- **Spaced-review + streak/daily-goal loop on ProgressStore** — one system that serves *both* retention science (anti-decay) and the freemium funnel (come-back-tomorrow). Natural fusion with the founder's "DSA revision tool".
- Turn the home graph into a true **guided dependency map** (prerequisite edges, status-colored nodes, recommended next node).
- A **"hard" tier + `dp-2d` topic** + tripled tagged practice — on a separate difficulty track so it never intimidates beginners.
- Hand-author **dp-1d** with a real generative "fill one cell from its neighbors" interaction as the new gold reference, then pressure-test the template *before* scaling AI-generated lessons.
- Define the **freemium value ladder** + lightweight account capture + "request a topic" demand signal.
- **"I derived X" shareable cards** as an organic growth loop.

---

## The core tension — and how to resolve it

**Depth vs. approachability.** The interview-prepper wants a hard tier, 2-D DP, ~5 problems/topic;
the class-10 student is already drowning at the derivation beat (bs-b4) and bounces off jargon.
Pushing depth into the default path deepens the intimidation; softening everything caps the
product at "pretty re-explanation".

**Resolution: separate difficulty from the spine rather than averaging them.**
- Keep the single linear derivation arc (bs-b1..b7) deliberately gentle and 10th-grade-accessible — that's the **protected core**.
- Layer harder content as **opt-in surfaces that never block the beginner**: a "hard" practice tier and dp-2d behind a difficulty toggle *after* the lesson; a "Complexity & edge cases" beat the beginner skims and the prepper mines; tap-to-define chips so beginners ignore jargon while experts move fast.
- The **prediction-gate fix serves both at once** — it adds the desirable difficulty the prepper/scientist want *while* making the beginner feel smart for getting an answer right.
- The same **spaced-review** system the scientist needs for retention is the **streak loop** the strategist needs for return visits; the same per-beat **aria-text** the a11y specialist needs is generable from the beat spec the team already authors.

The seemingly divergent asks largely **converge on shared infrastructure** rather than competing for it.
