# Front-Door & Journey Wave — Implementation Plan (2026-06)

> **For agentic workers:** contract-first, TDD-per-leaf, gates-as-barriers. The workflow
> re-runs the test suite and reads the real exit code — no self-certification.

**Origin.** Study of ArchAIst (mishrayashi/ArchAIst) — a breadth-first career-roadmap
learning site whose *journey design* is excellent (shallow content, strong orientation).
Groundwork is the inverse: deep derivation content, weak front door. This wave steals the
journey scaffolding ArchAIst does well and maps it onto Groundwork's real structure.

**User decision (2026-06-17).** Fold in **all four** journey moves + the meta-lesson, as a
**front-door mini-wave NOW**, before L3. Latitude to extend adjacent parts if the build needs it.

**Goal:** Give Groundwork a *named, repeated journey backbone* and the orientation/trust/
direction surfaces around it, so a newcomer always knows what this is, where they are, and
what's next — without touching the (already-strong) lesson engine.

**Architecture:** A thin **journey-spine** layer over the existing 3-track registry (it
*names* the arc, it does not re-order anything), plus goal-driven **study plans** that light
up the currently-dead `Goal` wiring, plus two prose orientation pages and a per-topic
**interview-payoff** field. New static surfaces; the scene-lesson engine is untouched.

**Tech:** Next.js 16 / React 19 / Tailwind v4, static export (`output: "export"`,
`basePath=/groundwork` in prod, `trailingSlash: true`). Vitest. Burst-sync UI harness.

---

## Cross-reference to existing planning (no duplicate IDs)

This wave *advances* items already ledgered — it does not invent a parallel track.

| This wave delivers | Existing IDs it satisfies/extends | Source |
|---|---|---|
| Named journey spine | **CN1, CN2** (bridgeFrom/PrincipleStamp made visible at the journey level) | MASTER-PLAN, PRODUCT-ASSESSMENT #1 |
| Orientation home | **R-WN2, R-WN3** (de-jargon landing, payoff visible) — *beyond* what L2 shipped | PRODUCT-REVIEW Bet 1 |
| How-to-learn meta-lesson | **D4** voice/depth mechanism reused; new content | VOICE-AND-DEPTH.md |
| Our promise / lay-of-the-land | **R-AQ3/R-PS2** (state the promise; readable entry) | ASSESSMENT-V2 strategist |
| Skippable→readable quiz | **R-WN3** (entry that isn't just a bare map) | PRODUCT-REVIEW |
| Time-boxed plans | **R-WN4** ("what do I do next week"); lights up `Goal` | MASTER-PLAN L2.3 |
| Interview destination | **R-WP4/R-WP5** (interview payoff + completion moment) | PRODUCT-REVIEW Bet 2 |

L2 surfaces (de-jargon landing v1, /learn resume ring, /progress home, chapter pages,
completion ceremony, profile chip) are **already merged** (#17). This wave is the next layer,
not a redo. **L3/L4/Wave V remain after this**, unchanged in the MASTER-PLAN §11 ledger.

**Out of scope (explicit):** analytics/event sink (PARKED hard per standing instruction until
Groundwork is declared market-ready), accounts backend (P10), the code↔viz-sync plan (a
separate stale plan-mode file — unrelated). An Archie-style in-page assistant is **deferred**
(not selected for this wave; bigger build).

---

## The central contract — the Journey Spine

Groundwork already has a natural arc in `src/categories/registry.ts`: three ordered tracks
(programming-basics → data-structures → algorithms), each with ordered topics and
`estimatedMinutes`. The spine is a **named layer on top** — it renames the arc into a 4-stage
journey and answers "where am I / what's next." It re-orders nothing.

**Four stages** (derived from track registry + a stages config, so new tracks later — e.g.
system-design — become new stages with no rewrite):

| n | key | name | promise (one line) | maps to |
|---|---|---|---|---|
| 1 | `foundations` | Foundations | "Make the computer do what you say." | programming-basics (9) |
| 2 | `structures` | Structures | "Hold data so you can find it again." | data-structures (8) |
| 3 | `techniques` | Techniques | "Turn the seven ideas into algorithms." | algorithms (12) |
| 4 | `fluency` | Fluency | "Make it stick — practice, recall, interview-ready." | practice + recall (goal/destination) |

Stage 4 has no category of its own; it points at `/progress` + the recall loop (L4) and the
interview payoff. It exists so the journey has a *destination*, not a dead stop at "last topic."

**Files & API (frozen in Phase 0):**

- `src/shared/journey/spine.ts`
  - `export interface JourneyStage { key: string; n: number; total: number; name: string; promise: string; categoryKeys: string[]; href: string }`
  - `export const STAGES: JourneyStage[]` (the 4 above; `total` = 4)
  - `export function stageForCategory(categoryKey: string): JourneyStage | undefined`
  - `export function stageForTopic(topicKey: string): JourneyStage | undefined` (via registry lookup)
  - `export function journeyProgress(state): { stage: JourneyStage; doneInStage: number; totalInStage: number; overallDone: number; overallTotal: number }[]` — per-stage rollup from ProgressState; the current stage = first incomplete stage.
- `src/shared/journey/plans.ts`
  - `export interface PlanMilestone { topicKey: string; name: string; href: string; minutes: number; cumulativeMinutes: number; stageKey: string; done: boolean }`
  - `export interface StudyPlan { goal: Goal; title: string; subtitle: string; totalMinutes: number; milestones: PlanMilestone[] }`
  - `export function planFor(goal: Goal, state, topics): StudyPlan` — three shapes:
    - `understand` → the full path, all stages, nothing trimmed.
    - `interview` → algorithms track + interview-relevant DS (arrays, strings, hash-maps, linked-lists, trees, graphs), ordered by tier, time-boxed.
    - `refresh` → one topic per principle (shortest pass), using TRACK-NARRATIVES principle map.
- `docs/contracts/JOURNEY-SPINE.md` — the frozen contract doc; every leaf imports `spine.ts`/`plans.ts`, none redefine these types.

These are domain-agnostic: stage definitions reference `categoryKeys`; adding a track + a
stages row extends the journey with zero leaf changes.

---

## File map

**New (created by leaves):**
- `src/shared/journey/spine.ts` — contract (Phase 0)
- `src/shared/journey/plans.ts` — contract (Phase 0)
- `src/shared/journey/JourneySpine.tsx` — ribbon component (`variant`, `currentStage`, `showProgress`)
- `src/shared/journey/PlanTimeline.tsx` — visual milestone timeline (ArchAIst roadmap style)
- `src/app/how-it-works/page.tsx` — lay-of-the-land + our promise (one cohesive page)
- `src/app/how-to-learn/page.tsx` — the meta-lesson (derive, the wall, spaced re-derivation)
- `src/app/plan/page.tsx` — goal-aware study plan (composes `planFor` + `PlanTimeline`)
- `src/tests/journey-spine.test.ts`, `src/tests/journey-plans.test.ts` — TDD + contract-conformance

**Extended (contract change, Phase 0):**
- `src/shared/next-steps/types.ts` — add `interviewAngle?: { askedAs: string; tip: string; companies?: string[] }` to `NextStepsContent`.

**Authored (leaves, per-topic):**
- `interviewAngle` populated for interview-relevant topics (algorithms ×12 + arrays, strings,
  hash-maps, linked-lists, trees, graphs ≈ 18). Foundations topics get **none, on purpose**
  (an interview angle for "variables" would be noise) — reported, not silently skipped.

**Integration chokepoints (ONE integrator, serial — never parallel-edited):**
- `src/app/page.tsx` — landing: full spine below hero, real scope row (29 lessons · 7 ideas · 3 tracks), "See how it works →" link. Replaces the ambiguity of the lesson-format STEPS block being mistaken for the journey.
- `src/shared/layout/Chrome.tsx` — add a single "how it works" nav affordance (minimal).
- `src/app/start/OnboardingQuiz.tsx` — "prefer to read first? →" to `/how-it-works`; goal-aware "see your plan →" to `/plan` in the result.
- `src/app/learn/page.tsx` — compact spine (current stage lit) above the map; link to `/plan`.
- `src/app/categories/[category]/[topic]/` completion surface — show `interviewAngle` prominently when `goal === "interview"`.

---

## Phases

### Phase 0 — Freeze contracts (SERIAL, single integrator). Barrier before any fan-out.
1. Write `spine.ts` + `plans.ts` (types, selectors, STAGES data, planFor). Tests first (must fail), then green.
2. Extend `next-steps/types.ts` with `interviewAngle?` (+ update the conformance test to allow it).
3. Write `docs/contracts/JOURNEY-SPINE.md`.
4. **Gate 0:** `npx tsc --noEmit` clean; `npm run test` green (new selector tests pass). Contracts frozen.

### Phase 1 — Leaves (PARALLEL, TDD each; every leaf imports the frozen contracts).
- **A — JourneySpine.tsx**: test asserts full variant renders 4 numbered stages in order with promises; compact variant lights `currentStage`; `showProgress` reads rollup. Then implement.
- **B — PlanTimeline.tsx**: test asserts milestones render in order with cumulative time + done state. Then implement.
- **C — how-it-works page**: prose (what Groundwork is · our promise · the 4-stage spine · the 7 ideas · where to start). Renders the spine. Honors VOICE-AND-DEPTH + anti-slop. Test: route renders, contains the promise + a spine, links to /start and /learn.
- **D — how-to-learn page**: the meta-lesson — derive don't memorize; the frustration wall (the moment a derivation won't click — everyone hits it); spaced re-derivation; type the code. Test: route renders, links to a real topic by takeaway (not name).
- **E — /plan page**: composes `planFor(goal,…)` + `PlanTimeline`; falls back to `understand` when no profile. Test: each goal yields a non-empty, correctly-ordered plan with monotonic cumulative time.
- **F (×3, by track) — interviewAngle content**: author for algorithms, then the 6 DS topics, then assert via a conformance test that every interview-relevant topic has a non-empty `askedAs` + `tip` and foundations topics have none.

Each leaf returns `{testsPassed, command, failures}`; the workflow re-runs `npm run test` and reads the real exit code.

**Gate 1 (barrier):** `tsc` clean · `vitest` all green · `build` succeeds. No integration until green.

### Phase 2 — Integration (SERIAL, single integrator).
Edit the five chokepoints above to mount the new pieces and register the 3 new routes.
Commit per logical edit.

**Gate 2 (barrier):** `tsc` · `vitest` · `build` (expect prior 116 + `/how-it-works` + `/how-to-learn` + `/plan` ≈ 119 static pages) · 0 console errors on a route sweep.

### Phase 3 — Verify & ship.
- **Playwright (1440 + 390)**, walking the *new journey*, waiting for content selectors (never asserting on a loading screen): landing spine → how-it-works → quiz (read-first link) → /plan (each goal) → /learn compact spine → a topic → completion interview surface (goal=interview).
- **UI-safety (the part you're protective of):** pixel-diff the **unchanged** surfaces — every lesson page, the map, /progress — against a baseline at clean `main`; require ~0 diff (these files aren't touched). Run `burst-sync` on `algorithms/binary-search` as a sanity check that the lesson engine is byte-stable.
- **Adversarial + completeness pass:** a verifier agent re-reads the diff for anything unwired/untested; a completeness critic asks "what surface still doesn't point forward / what's authored-but-unrendered."
- Failures loop to a bounded self-repair agent; still-red is surfaced, never silently skipped.

---

## Verification facts
- Dev server `http://localhost:3000`; **trailing slash** on routes; **no** `/groundwork` basePath locally.
- Gate command: `npx tsc --noEmit && npm run test && npm run build`.
- Burst-sync: `node tools/burst-sync/check.js algorithms/binary-search` (dev server up; capture first).
- Playwright skill harness: `node <skill>/run.js <ABSOLUTE script path>`; `headless:false`; read screenshots, don't trust them.

## Report-all — deferred, not discarded (priority = order)
1. interviewAngle for foundations topics — intentionally omitted (rationale above).
2. Register-variant prose for the two new pages — base voice now; register fan-out queued.
3. Archie-style grounded assistant — deferred (not selected this wave).
4. Plans as fully editable/savable schedules — v1 is computed-and-displayed; persistence later.

## Done = 
A newcomer on `/` sees a named 4-stage journey, can read "how it works" and "how to learn"
instead of being forced through the quiz, gets a time-boxed plan for their goal, always sees
which stage they're in, and — if prepping for interviews — sees where each technique shows up.
The lesson engine, map, and progress surfaces are pixel-unchanged. All gates green.
