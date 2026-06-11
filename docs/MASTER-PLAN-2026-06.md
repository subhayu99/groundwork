# Groundwork Master Plan — June 2026 ("the polish milestone")

> **Resumability:** this document is the canonical roadmap. If context is lost: read this file, find the
> first unchecked item in the Status Ledger, continue. Working agreements: `~/.claude/.../memory/`
> (`feedback_one_shot_master_plan`, `feedback_report_all_never_discard`). Companion inputs:
> `docs/PRODUCT-REVIEW-2026-06-11.md` (synthesis), `docs/inputs/RAW-REVIEW-FINDINGS-2026-06-11.json` (all 30 raw findings),
> `docs/inputs/REQUIREMENTS-INVENTORY-2026-06-11.md` (full requirements inventory A–H).
>
> **Prime directives:** 100% of findings/asks are planned — priority is sequencing, never discarding.
> Foundation-up layering: each layer only depends on layers below it. One-shot inputs: every decision
> Subhayu must make is in §7 (one batch); during execution we assume-and-flag, never stall.

## 0. Scope & definition of "polished"

All 29 lessons adaptive in voice AND length per audience; the platform introduces itself, points forward
at every step, proves learning (prediction gates + verified practice), gives a reason to return (recall
loop), measures its own funnel, and survives device loss — while honoring all 10 non-negotiables (inventory §A)
and all 18 anti-requirements (§F). Exit gate = the Wave-V verification fleet (persona re-review must show
every R/E item below resolved or explicitly parked).

## 1. Complete item ledger (nothing dropped)

IDs: `R-<lens><n>` = raw review findings (WN newcomer, WP practitioner, PS product, AQ app, PED pedagogy,
CN cohesion — 30 total). `E<n>` = inventory "expressed but not built" (30). `H<n>` = tensions (10).
Every ID appears in exactly one Layer task (§2–§6) or the Parking Lot (§8).

| ID | Item (short) | Planned at |
|---|---|---|
| R-WN1 / E13 | Lesson end is a dead stop; no ceremony | L2.6 |
| R-WN2 / E15 | Landing leads with jargon principle names | L2.2 |
| R-WN3 / E16 | /start map payoff below fold; 2999px mobile (R-AQ1) | L2.1 |
| R-WN4 | /learn doesn't answer "what do I do next week" | L2.3 |
| R-WN5 | "Hover a topic" dead instruction on touch | L2.7 |
| R-PS1 / E10 | Analytics stub; funnel blind | L0.6 |
| R-PS2 / R-AQ3 / R-WP1 | Register promise is 1/29 | L1 (whole wave) |
| R-PS3 / E5 | Zero reason to return; review shelf + recall deck | L0.5 + L4.1 |
| R-PS4 / E9a | localStorage-only identity (churn bomb) | L4.2 (Q2) |
| R-PS5 / R-WP3 / E7 | Interview practice thin; no hard tier | L3.3 (Q4) |
| R-AQ2 / E12b | /progress is a flat dump | L2.4 |
| R-AQ4 / E27a | Lesson pages: no persistent site nav (mobile dead-end) | L2.7 |
| R-AQ5 / E27b | /start unreachable from nav (profile chip) | L2.7 |
| R-WP2 | Why-card auto-collapses; rigorous prose hidden | L0.8 |
| R-WP4 | /learn: no interview overlay / time estimate | L2.3 |
| R-WP5 | Completion hand-off dead on replay; practice gated too hard | L2.6 |
| R-PED1 / E6 | No predict-before-reveal; wedge passes on ANY click | L0.4 + L1 |
| R-PED2 / E8a | "Solved" is self-report; nothing verified | L3.1 |
| R-PED3 | No spacing/return trigger (= R-PS3) | L0.5 + L4.1 |
| R-PED4 / E8b | No mixed/label-stripped sets; discrimination untrained | L3.2 |
| R-PED5 | Map asserts mastery from self-report; no test-out | L3.5 |
| R-CN1 / E14a | bridgeFrom typed but never rendered; lessons never recall previous | L0.3 + L1 |
| R-CN2 / E14b | Seven-ideas thesis invisible (PrincipleStamp) | L0.3 + L1 + L2.4 |
| R-CN3 / E12c | Category pages don't tell the track's story | L2.5 |
| R-CN4 | Tracks end without capstone/checkpoint | L2.6 |
| R-CN5 | Register fan-out lacks a narrative contract | L0.12 |
| E1 | Frame-by-frame burst sync audit (his explicit method) | L0.11 tool + L5.2 run |
| E2 | B5 contract consolidation (AI-generation seam) | L0.2 |
| E3 / E4 | Custom input editors + variants.ts generator | L3.4 |
| E11 | Shareable "I derived X" card | L2.6 |
| E17 | Cost derived physically before naming Big-O | L1 (authoring instr.) |
| E18 | "Complexity & edge cases" beat per topic | L1 (authoring instr.) |
| E19 | next-steps.ts links surfaced; curated videos (he verifies) | L2.8 |
| E20 | Climax 7a/7b split + mobile pinned active-line strip | L2.9 |
| E21 | Visual persistence across beats (immersion lever) | L0.10 (flagged) |
| E22 | Composite glossary keys (O(V+E)…) | L0.9 |
| E23 | Scene panel body invisible under title (design call) | L0.7 (default §7) |
| E24 | Contrast/axe auto-verification both themes | L5.3 |
| E25 | Richer aria narration of visual state | L5.3 |
| E26 | PR-level CI (hand him test.yml) + Node bump | L0.13 (manual apply) |
| E28a | "Request a topic" demand-signal widget | L2.2 |
| E28b | Trust/pricing signals on home | Parking P6 |
| E29 | Mobile home made visual (icons/grouping) | L2.7 |
| E30 / B9 | Manim evaluation | Parking P5 |
| D4 | Depth-adaptive beat count per register ("7 pages… absurd") | L0.1 + L1 |
| E9b / B2 | Freemium/payments build | Parking P1 |
| B3 | AI-generated pages | Parking P2 (seam = L0.2) |
| B5/B7 | Second domain (system design) as extensibility proof | Parking P3 |
| B4 | Community/shareable library | Parking P4 |

Tensions honored throughout: H1 hard=opt-in never default (L3.3) · H2 length is per-register (L0.1) ·
H3 skeleton+prose, agents must not copy content (L1 contract) · H4 map stays layered-hierarchy ·
H5 code hidden-by-default + raised affordance (L2.9) · H6 predictions are recognition taps, never
arithmetic (L0.4) · H7 all review-gates collapsed into §7 (this batch) · H8 fresh branch off main per
PR, he merges · H9 onboarding freeze = first deploy after this milestone (per §7 default) · H10 every
store change ships with a never-lose-progress migration.

## 2. LAYER 0 — Bedrock (engine, contracts, models; serialized — shared-file owners)

| # | Task | Files (primary) | Notes |
|---|---|---|---|
| 0.1 | Beat depth: `registers?: Register[]` on LessonBeat; engine filters pre-resolution; `goal=refresh` trims one level further; depth defaults i=full / s≈4-5 / r≤3 | lesson/types.ts, LessonRuntime.tsx | tests for filter+fallback |
| 0.2 | B5 contract: one self-contained topic object; `defineTopics(domain, bundles)`; registry consumes it | categories/*, shared/lesson | the AI-page + new-domain seam |
| 0.3 | `bridgeFrom` ("standing on" line, register-aware) + `PrincipleStamp` ("idea n of 7") render slots | SceneLayout.tsx, types.ts | data authored in L1 |
| 0.4 | Prediction-gate primitive: 3-choice tap-to-predict overlay; wedge gates require the real answer; gentle retry | new shared/lesson/Predict.tsx, engine | recognition taps only (H6) |
| 0.5 | ProgressStore v2: review-schedule fields, recall results, version migration (never lose progress) | progress/* | model only; surfaces in L4 |
| 0.6 | ~~Analytics~~ — **PARKED → P9 by Subhayu's call (Jun 11: "the product itself is not ready")**; emitEvent stays a stub; no event wiring anywhere this milestone | — | trigger: he declares market-ready |
| 0.7 | Scene panel body: render `body` beneath `title` (default per §7) — un-hides prose platform-wide | SceneLayout.tsx | re-measure centering after |
| 0.8 | Why-card: respect user toggle across beats; default-open for rigorous | SceneLayout.tsx | |
| 0.9 | Composite glossary keys tappable: O(V+E), O(n+m), O(j−i), O(cells+connections) | glossary.ts, gloss.tsx | |
| 0.10 | Visual persistence across beats (mount-once, animate deltas) behind a flag; enable per-topic in L1 verify | SceneLayout/LessonRuntime | biggest immersion lever; flagged rollout |
| 0.11 | Burst-sync audit harness: scripted bursts + objective frame-pair checker (code-line vs visual state) | tools/ + playwright | run in L5.2 |
| 0.12 | Narrative contracts: per-track narrative page + extended voice/depth spec + beat-skeleton ritual + banned moves | docs/contracts/*.md | gates L1; protects cohesion |
| 0.13 | Hand over `test.yml` (PR-level CI) + Node 24 bump instructions — he applies (token lacks workflow scope) | docs/ci/ | manual step, flagged |

Layer-0 exit gate: tsc + 100% tests + build + binary-search pilot re-verified under depth filtering.

## 3. LAYER 1 — The content wave (29 topics, massively parallel; gated by §7-Q1 + L0)

One agent per topic, ONE authoring pass each (never four passes over 29 files): register prose
(voice spec) · depth tags (i/s/r beat subsets, connectors bridge the cuts) · `bridgeFrom` line ·
`PrincipleStamp` · prediction-gate conversion of wedges/connector questions · physical cost derivation
before Big-O naming (E17, algorithms track esp.) · "complexity & edge cases" beat (E18) · takeaway
hygiene (recall-deck-ready) · analytics beat events. Contract: skeleton untouchable; prose via `reg()`;
no content copies (H3); base text stays character-identical.

Then a paired verifier per topic: per-register Playwright pass (3 registers × key beats), burst-sync
audit on animated beats (E1), gate honesty check, JSX safety, tsc. Pipeline (convert→verify per topic,
no global barrier). Binary-search pilot upgraded to depth tags + bridges in the same wave.

## 4. LAYER 2 — Surfaces (parallel teams, disjoint files; worktree isolation where shared)

2.1 `/start` payoff visible: capped scrollable map band + auto-scroll to start chip + inline "your start: X"
echo; honest quiz copy until L1 merges (then restore). · 2.2 Landing: de-jargon grid → friendly 3-step,
principles post-opt-in; "request a topic" widget (E28a). · 2.3 `/learn`: resume ring/"you are here",
next-node CTA, goal overlay + time estimates, "Tap" on touch. · 2.4 `/progress`: forward-pointing home —
continue CTA, ideas-collected (stamps), review-shelf slot, per-track bars. · 2.5 Category chapter pages:
numbered, track story from narrative contracts. · 2.6 Completion: milestone moment (recap + principle +
next CTA), persistent practice entry (any beat/replay/goal), shareable "I derived X" card (E11), track
capstones. · 2.7 Nav hygiene: "← Map" in lesson chrome, /start profile chip, mobile home visual (E29).
· 2.8 next-steps links in scene UI + curated videos (assume-and-flag: links inserted, verification list
handed to Subhayu). · 2.9 Climax 7a/7b split + mobile pinned active-line strip + code-tab affordance (H5).

## 5. LAYER 3 — Practice & proof (gated by L0.4/L0.5)

3.1 Verified-response primitives (predict-the-output, Parsons-lite, which-line-breaks) gating "solved".
3.2 Mixed label-stripped "which pattern?" sets. · 3.3 Hard tier (§7-Q4): one hard adapt-the-pattern
variant per algorithm topic + dp-2d (generative fill-a-cell) + interview-form classics; opt-in, never
default (H1). · 3.4 Custom input editors + variants.ts generator (E3/E4). · 3.5 Test-out for "assumed"
tracks (2-min recall) + stale-topic "refresh?" ring.

## 6. LAYER 4 — Retention & identity (gated by L0.5 + L1 takeaways)

4.1 Recall deck (60-second) + "due for re-derivation" shelf + gentle streak/daily goal (no dark patterns).
4.2 **Accounts-READY, build-nothing (Subhayu, Jun 11)**: define the sync seam only — a `ProfileSync`
interface, a versioned serialization of the full ProgressState blob, and the never-lose-progress
migration rule (H10) — so sync-code/KV or full accounts can drop in later without remodel. The actual
backend is **Parking P10** (trigger: his go after the sync-code explainer / freemium decision).

## 7. THE ONE DECISION BATCH — ANSWERED (Jun 11)

**Q1 voice:** "Show me more samples first" → **L1 gate = sample review of `variables` + `arrays`**, full
treatment (registers + depth tags + bridge + stamp + prediction gates) — variables chosen deliberately:
it's the exact "7 pages for a variable" lesson; rigorous must read as 2–3 beats. **Q2 identity:**
accounts-READY architecture only, build nothing now (see L4.2/P10). **Q3 analytics: PARKED hard → P9**
("product itself is not ready"); never re-suggest until he declares market-ready. **Q4 hard tier:**
approved as recommended (12 hard variants + dp-2d + verified-response primitives; opt-in, H1).

Standing defaults (not vetoed → in force): scene `body` renders beneath `title` (L0.7) · depth =
i:full / s:4-5 / r:≤3, refresh −1 · onboarding freeze starts at this milestone's deploy · commit
trailer = current Fable 5 · curated-video links inserted but flagged for his verification (E19) ·
L0.10 visual persistence ships behind a flag.

## 8. PARKING LOT (explicit triggers — never forgotten)

P1 Freemium/payments — trigger: his business go (spec stays current). · P2 AI-generated pages — trigger:
L0.2 merged + one prototype behind a flag. · P3 System-design track (extensibility proof) — trigger: next
milestone; cost collapsed by L0.2. · P4 Community/library — trigger: accounts. · P5 Manim — trigger: a
visual exceeds SVG primitives. · P6 Trust/pricing signals — trigger: P1. · P7 (none) more languages —
deliberately Python-only. · P8 test.yml + Node bump — trigger: immediate, his manual apply (L0.13).
· **P9 Analytics (whole funnel)** — trigger: Subhayu declares the product market-ready ("I give you a
heads up"); then: cookieless sink + land/quiz/lesson/complete events. · **P10 Identity backend**
(sync-code KV → magic-link accounts) — trigger: his go post-explainer / freemium decision; L4.2's seam
makes it drop-in.

## 9. Execution mechanics

Branching: merge PR #13 first; then one fresh branch off main per wave-PR (L0 → one PR; L1 → one PR;
L2 split 2-3 disjoint PRs; L3, L4 one each; V fixes batched) — he merges (F10). Conflict control: L0
owns all shared files serially; L1 agents touch ONLY their topic dir; L2 teams have disjoint surfaces
(worktrees if overlap). Models: conversion/verify = sonnet; judgment (contracts, synthesis, persona
fleet) = default. Every PR: `npx tsc --noEmit && npm run test && npm run build` + Playwright evidence
(G1, F9 — screenshots read, not trusted). Assume-and-flag protocol (F16): blocked agents pick the
plan-consistent default and log it in the PR description under "Assumptions".

## 10. WAVE V — final verification fleet (exit gate)

5.1 Full gates on the integration of all PRs. · 5.2 Burst-sync audit across every animated beat (E1) with
objective checker. · 5.3 axe/contrast both themes (E24) + aria visual-state narration (E25). · 5.4 Persona
re-fleet (newcomer, practitioner, pedagogy, cohesion, product, app) — every R-item must read fixed;
regressions loop back as fix tasks. · 5.5 PWA/offline + bundle check + SW VERSION bump. · 5.6 Final
report mapping ledger → done/parked, delivered to Subhayu.

## 11. Status ledger

- [ ] L0.1–L0.13 · - [ ] L1 (29 convert + 29 verify) · - [ ] L2.1–L2.9 · - [ ] L3.1–L3.5 ·
- [ ] L4.1–L4.2 · - [ ] V5.1–V5.6 · - [ ] Parking lot reviewed at milestone close
