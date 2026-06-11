# Groundwork Requirements Inventory (compiled 2026-06-11)

Sources: main session `e4929da6` (subhayu/Documents, 2026-05-24 → 2026-06-10; line numbers = JSONL lines, all verbatim Subhayu), memory dir `~/.claude/projects/-Users-subhayu-Documents/memory/`, repo docs `/Users/subhayu/Downloads/first-principles-learning-platform/docs/`, git/PR state (PRs #1–#12 merged, #13 open on `feat/audience-onboarding`, HEAD `674a322`).

## A. Non-negotiable principles

1. **10th-grader accessibility** — "The project is for those who don't understand shit about computers" (sess L2894, 05-28; memory feedback_first_principles_rules). Honored: glossary/Term chips, jargon gating to step 5+; still policed every audit.
2. **Left↔right sync** — "on one side… find at least… on the right-hand side… it's finding Harper. This is not something right" (L2894; memory). Honored via `@sync` anchors + onActiveLine; frame-by-frame burst audit still owed (BACKLOG #5).
3. **Real, cohesive, syntax-highlighted code viewer** — "doesn't look cohesive with the UI and there is no syntax highlighting… looks shitty as hell" (L2894). Honored (CodeHighlight tokenizer, OKLCH palette).
4. **Zero code duplication / composable blocks** — "I want zero code duplicacy… this will become the base of what I have planned next… find out patterns that can be reused later on" (compaction L11493 §6; memory feedback_modular_zero_duplication; docs/VISION.md). Honored: shared primitives, B1–B6, registers as skeleton+prose.
5. **Zero grunt work** — "they don't need to do the addition; they just need to understand… the essence" (L195; memory feedback_zero_grunt_work). Honored: all interactions auto-compute.
6. **First-principles, both layers** — "I want this to be as much first principles based as possible" (original Claude-web paste, L10): derive technique from problem AND from 7 shared ideas. Honored — it's the brand ("First principles, not patterns").
7. **Intuitive over fancy** — "I don't want any fancy stuff. I want what is the best way for a newcomer" (L19861; memory feedback_intuitive_over_fancy). Honored: d3-force graph deleted for layered tier map.
8. **Differentiation must never cost cognitive overload** — "distinguishable… from other learning platforms but not at the cost of cognitive overload or… having to navigate through multiple different options or pages" (L23711). Constraint on all register/depth work.
9. **Format must not cap depth** — "because you are in seven-step mode, you can't go into details… in a hard topic. I don't want that to happen" (L233, 05-24). Partially honored: beat count flexible, but no hard tier yet (Phase 6 open).
10. **Onboarding never changes as domains are added** — profile global/domain-agnostic; adding a domain = content + routing rule only ("changing onboarding scares users", memory project_groundwork_audience_onboarding). Built into PR #13 design.

## B. Product vision & future domains

1. **Personal tool first, sellable product later** — "I want to use this personally for a couple of days… I do have a vision for it at the end… foundations in the right place so that in the future… we have the flexibility" (L171, 05-24).
2. **Freemium** — "freemium model where certain topics can be explored for free, and then if you want to go deeper, you have to pay… and/or tiers of pricing" (L171); later: 1–2 free AI generations then pay (compaction L11493). Payments integration must be architecturally possible without rewrite.
3. **AI-generated lesson pages** — user prompts ("teach me consistent hashing") → full generated page conforming to the exact same topic contracts as hand-built lessons (docs/VISION.md; memory project_groundwork_vision).
4. **Community** — shareable generated pages, a library others learn from (VISION.md).
5. **Open-ended domain list** — "I noticed you stopped at DB architecture. It's not ending there… distributed systems… Load balancing… sharding… OLAP, OLTP… All these things can be broken down into simple composable blocks" (compaction L11493 §6). Memory adds: system design, data sharding, replication strategies, load balancing, **networking** (memory audience_onboarding).
6. **Core thesis** — every technical concept decomposes into simple composable blocks taught via lesson-card ⟷ visualizer ⟷ synced code (VISION.md).
7. **Tracks/domains pluggable** — curriculum organized as tracks; today one "foundations" track (programming-basics/data-structures/algorithms) (memory audience_onboarding).
8. **Audience is everyone, not him** — "someone in Finance… someone in tech [without] depth… a college student in mechanical engineering" (L157); basics (lists, dicts) must be taught before patterns for non-domain people (L207).
9. **Manim** noted as possible future visual tool — "add a future note so that I don't forget" (L329–335). Never revisited.

## C. Decided & shipped

1. Name "Groundwork", GitHub Pages static export, auto-deploy on push to main → live at subhayu.in/groundwork (L5190).
2. Topic-as-plugin registry; per-topic folder (meta/lesson-spec/algorithm.py/problems/next-steps) → `src/categories/*`.
3. Shared viz/sync layer (B1–B4): `@sync` label anchors, AnimatedAlgorithmView, phasedVisualizer, tone system → `src/shared/{code,viz}`.
4. B6 domain-agnostic `Scene` SVG primitive (trees/graphs collapsed into wrappers) — the seam for future domains → `src/shared/viz/Scene.tsx`.
5. Annotated-canvas idea ("texts within the visual plane itself… with lines or arrows", L12514/L12536) → LessonSpec/beats engine → one-scene `SceneLayout` on all topics.
6. Verbose content restored after friend feedback ("previous one was more verbose and easy to understand… there was a sequence 1–7", L15207) → label/connector/detail/actionLabel/takeaway per beat + accreting spine.
7. "Wedge" renamed — "nobody knows what the wedge means" (L15548) → "The instinct" (his swimming-instinct analogy).
8. Zen = reveal-on-demand code; auto-opens on final beat ("code… shouldn't just pop up right away; that will scare the user off", compaction L16707 §6).
9. Animation slowdown ("The animation needs to be slower!", L15067) → `pace()` ×1.6.
10. PWA installable/offline, hand-rolled SW, base-path-safe (L12223; memory project_groundwork_pwa).
11. Free-form pan+zoom canvas ("user has the independence to actually zoom in, zoom out", L19523) → PanZoom, PR #3; reset-on-beat fixed in PR #8.
12. Landing page + layered dependency map with hierarchy levels ("level 0 things, level 1 things…", L19898) + directional arrows ("small arrowheads", L20147) replacing force-graph → PR #4 (`/` landing, `/learn` TopicTierMap).
13. Programming Basics track (variables…try-except, 9 topics) as new level-1, everything re-tiered below (L20225, L20613) → PR #5 (+#6 test fixtures).
14. Lesson completion hand-off — "no page shows where to go next once completed" (L21222) → PR #7/#12 banner (Next: X / all modules).
15. Jun-8 fan-out audit (73 agents, 103 findings, docs/AUDIT-2026-06-08.md) fixed in batched PRs #8–#11 incl. never-rendered `beat.arrows`, graphs code-vs-visual mismatch, glossary +25 terms.
16. Glossary/Term tap-to-define + auto-glossed spine (`gloss.tsx`); popover portaled to body after his screenshot ("still issues with the text glossary boxes", L22680).
17. Non-blocking prereq nudge + "builds on" chips — "It shouldn't be obstructive… but you need some foundation" (L16907) → PrereqNudge.
18. Practice problems inline below code — "pop them below the code; we don't even need to go to a second page" (compaction L16707).
19. Mobile legible hero (canvas-first, own scale) + code panel reframed "Optional — the lesson works without it" (ASSESSMENT-V2 gates).
20. a11y baseline: keyboard-operable SVG nodes/slider wedge, aria-live line narration, AA light-theme contrast tokens, role=img canvas (Phase 1 + cross-cutting).
21. Settings (theme/motion/progress export-import), resume banner, /progress, prev-next topic nav (Rounds 2–3, old layout era — still live).

## D. Decided, in-flight

1. **PR #13 (OPEN): onboarding questionnaire front door** — "questionnaires that can actually determine what kind of audience they are, and then they get to the main meat" (L22929); profiles Stage×Experience×Goal → routes + content register (memory audience_onboarding).
2. **3 content registers named `intuitive` / `structured` / `rigorous`** (his pick, L22998); Stage drives register; Experience routes entry; Goal tunes recommendations — registers stay 3, never 3×3×3.
3. **Content model = shared skeleton + register-resolved prose** (`reg()` with `base` fallback) — NOT full content copies; pilot on binary-search only (1/29) awaiting his voice validation, then fan-out + per-register VOICE SPEC + cohesion layer (course/category intros).
4. **Depth-adaptive beat COUNT per register** — "for someone who is just wanting a refresher, it can be a one-page overview… No need for seven pages… do you really think that for making someone understand what a variable is, we need seven pages?" (L23711). Beats get `registers?: Register[]` tag; intuitive ≈7, structured ≈4-5, rigorous 1-3; goal=refresh trims further; NO new menus.
5. **Live personalized map under the quiz** — "The map should show right below the questions so that whenever I change, I can see the exact map… customized for the answers… stored in local storage or something or maybe account later on" (L23518) → shipped on branch (`674a322`); visibility/fold issues flagged (PRODUCT-REVIEW item 4).
6. **The one-shot master plan itself** — compile every input (this inventory) + Jun-11 6-lens review (docs/PRODUCT-REVIEW-2026-06-11.md, untracked) → exhaustive plan → ONE question batch → massively parallel execution (L23711; memory feedback_one_shot_master_plan).

## E. Expressed but NOT yet built

1. **Frame-by-frame sync burst audit** — "it moves in a video-like thing… take short intervals, like bursts of photos" (L11363); he ordered it LAST after B6/cross-cutting/content (docs/BACKLOG.md #5). Harness stubs `/tmp/burst-sync.js`. Still owed; he "still perceives sync issues".
2. **B5 contract consolidation for AI-generated pages** — one self-contained topic object, flexible step count, `defineTopics(domain, bundles)` — "Number one we can actually do later on; just keep this in memory somewhere" (L11436; BACKLOG #1). Prerequisite for the AI-generation pillar.
3. **Custom input editors** — let users edit visualizer inputs (`customInputs` store field exists, unused) — explicitly chosen-then-deferred (memory project_dsa_revision "Deferred").
4. **variants.ts template generator** — per-topic variant generation, deferred alongside input editors (memory project_dsa_revision).
5. **Retention loop** — spaced review + streak/daily goal on ProgressStore v2 (timestamps + migration that never loses progress); "due for re-derivation" shelf + 60-second recall deck from takeaways (IMPROVEMENT-PLAN Phase 7 unstarted; PRODUCT-REVIEW #3/Bet 2; assessments: "3/10 reason-to-return").
6. **Prediction gates + retrieval checkpoints** — commit-an-answer before reveals; fix gate bug where ANY click satisfies the wedge; 2–3Q end-of-lesson checkpoint; pilot binary-search then fan out (Phase 4 ⚠️ review-gated, unstarted; PRODUCT-REVIEW #9: "convert existing connector questions into 3-choice tap-to-predict overlays").
7. **Hard tier + dp-2d + practice depth** — "0 hard" anywhere; interview-form variants (Koko, Split Array), ~5 tagged problems/topic, dp-2d with generative fill-a-cell interaction as new gold reference (Phase 6 ⚠️ unstarted; PRODUCT-ASSESSMENT; PRODUCT-REVIEW #10).
8. **Practice that verifies** — "solved" is self-report; gate on checkable responses (predict-the-output, Parsons reorder, which-line-breaks) + label-stripped mixed "which pattern?" sets (PRODUCT-REVIEW #8, from the review HE commissioned L23661).
9. **Freemium/accounts/payments build** — SPEC ONLY until his explicit business decision (IMPROVEMENT-PLAN decisions log); durable identity (anon sync-code / magic link + KV) flagged as the L-sized follow-on (PRODUCT-REVIEW #12); he hinted "maybe account later on" (L23518).
10. **Analytics funnel** — `emitEvent` is a console.debug stub; /start emits zero events; point at cookieless sink (Plausible/PostHog) so land→quiz→lesson→completion is measurable (PRODUCT-REVIEW #2).
11. **Shareable "I derived X" card** at completion — the only built-in growth wedge (PRODUCT-ASSESSMENT strategic; ASSESSMENT-V2 #4).
12. **Forward-pointing surfaces** — /learn resume/"you are here" ring + goal overlay; /progress beyond flat dump; numbered category chapter pages (PRODUCT-REVIEW #6).
13. **Milestone moments** — lesson-completion ceremony + per-track capstone checkpoints (PRODUCT-REVIEW #7).
14. **bridgeFrom narrative** — typed since the original spec, never rendered; register-aware "standing on" line + PrincipleStamp "idea n of 7" with "ideas collected" in progress (PRODUCT-REVIEW #11).
15. **Landing de-jargon** — principles grid ("Monotonicity & Invariants / Amortization") still the second thing a newcomer reads; swap for the friendly 3-step explainer (PRODUCT-REVIEW #5; every class-10 persona bounced on it).
16. **/start map payoff visibility** — preview below the fold / 2999px mobile stack; cap to scrollable band, auto-scroll to start chip, echo "your start: X" (PRODUCT-REVIEW #4 — polish on the in-flight feature).
17. **Cost derived physically before naming Big-O** — "derive the cost the way you derive the algorithm… so O(n) is a summary of something the learner watched" (ASSESSMENT-V2 consensus #3; glossary mitigates but the derivation beat doesn't exist).
18. **"Complexity & edge cases" beat per topic** (Phase 6 item; PRODUCT-ASSESSMENT high-impact).
19. **Next-steps resources surfaced** — external links authored in every `next-steps.ts` are never shown in the scene UI; also replace YouTube *search* URLs with curated videos, he verifies links (Phase 2 item; PRODUCT-REVIEW #10).
20. **Climax 7a/7b split** (synced code line-by-line first, then summary+practice) + **mobile pinned active-code-line strip** (Phase 5 optional remainders; IMMERSION-RESTRUCTURE).
21. **Visual persistence across beats** — keep the visual mounted, animate only the incremental change (old Phase 8 remnant after Focus Mode removal; IMMERSION-RESTRUCTURE "biggest immersion lever").
22. **Composite glossary keys** — O(V+E), O(n+m), O(j−i), O(cells+walls) not tappable (Phase 3 follow-up note).
23. **Scene panel `body` design call** — `body` (and its Term chips) invisible when panel has `title`; surface body under title OR declare body dead (memory reference_scene_layout_panel_body — "the top design decision" he was handed).
24. **Contrast auto-verification** — axe/Lighthouse pass never run on dark+light; "don't claim until measured" (BACKLOG cross-cutting TODO).
25. **Richer aria narration of visual state** (not just code line) — future note in BACKLOG a11y work.
26. **PR-level CI** — deploy.yml runs only on push to main; he must add test.yml himself (token lacks workflow scope); offered, undecided (memory feedback_run_full_test_suite). Plus Node 20→24 bump.
27. **Nav hygiene** — tappable "← Map" in lesson header, /start reachable from nav via profile chip "change →", "Tap a topic" on touch (PRODUCT-REVIEW appendix).
28. **"Request a topic" demand-signal + trust/pricing signals on home** (PRODUCT-ASSESSMENT/ASSESSMENT-V2 strategic; feeds the freemium decision).
29. **Mobile home made visual** — icons/thumbnails/grouping so it stops reading "like a 20-row textbook index" (ASSESSMENT-V2; class-10 persona).
30. **Manim evaluation** for future visuals (L329) — parked by his own request, never resolved.

## F. Explicit dislikes / anti-requirements

1. "I don't want any fancy stuff" — lead with the most intuitive newcomer path; wow views secondary (L19861; memory).
2. Force-directed graph home: "very unidentified and not very intuitive. What does the user start from?" (L19788) — never bring it back.
3. "The focus stuff is shit! Remove it!" (L18300) — no Focus Mode resurrection.
4. No cognitive overload / no extra navigation choices to get depth — depth must come from the profile automatically, "no new menus" (L23711; memory audience_onboarding HARD CONSTRAINT).
5. No in-app code editor — "the user anyway has a laptop they can open an editor at any point" (L457).
6. Code must not pop up immediately — "that will scare the user off" (compaction L16707 §6); but also must not be undiscoverable (audit counterpoint).
7. Controls must not move — "The code button should stay at the same place even after it opens"; expand/collapse at same location, no top-right collapse button (L17737); "The thing is, the card header expands and goes up" (L17865); "You moved it up! It was good in the middle!" (L17911).
8. No generic labels — card header showing only "Why?" on every slide was wrong (L17979); Next-button labels must not parrot the on-canvas controls ("Press play and watch" on a manual beat, L15529).
9. Don't trust agent self-reports for visuals — "I want you check this yourself!" (L16133); screenshots must be READ; loading screen ≠ verification (global CLAUDE.md).
10. Never push directly to main or to a merged branch — "Gandoo! If you are pushing it directly to that branch, the PR is already merged. Create a new PR and from now on operate on a different branch" (L19770). He reviews + merges.
11. Don't touch `.github/` (token lacks workflow scope — push gets rejected).
12. Onboarding must not change once domains are added (memory audience_onboarding).
13. No per-topic patching of shared bugs — fix once in the shared primitive (memory feedback_modular_zero_duplication; VISION.md).
14. Registers must not become full content copies (zero-duplication overrides his first "can probably keep copies" phrasing, L22900 → resolved to skeleton+prose).
15. Quiz must not be big / on its own page separated from the map — "I don't want the map to be on another page. Neither do I want the questions to be that big" (L23518).
16. No drip-feed questioning during execution — inputs once at plan gate; if blocked, assume a sensible default, proceed, flag (L23711; memory feedback_one_shot_master_plan).
17. Don't bypass auth in UI tests; use his DevTools state-injection flow (global CLAUDE.md — relevant only when accounts exist).
18. No jargon before it's earned — including labels/pills/map bubbles, not just prose (L3231, audits).

## G. Working-style requirements

1. **Full suite before any PR**: `npx tsc --noEmit && npm run build && npm run test` — build-green ≠ tests-green; CI only runs on main push ("tests failing!" L21062; memory feedback_run_full_test_suite).
2. **PR per coherent batch; he merges** — "Open a PR. I will merge it to main" (L19479); disjoint-file batching so PRs merge in any order (Jun-8 audit pattern).
3. **Massively parallel subagents/workflows with critic/peer-review agents** — "open critic agents as well… like how peer reviewers work" (L13051); persona fleets (class-10 kid, NASA scientist, SDE, architect, UI/UX, investment banker, CFA) are his recurring audit instrument (L12470, L16742, L18469).
4. **Autonomous long runs; don't stall** — "become me and start in an autonomous mode. Keep going unless it is ready as the whole product" (L13051); "Brother, I think you stalled" (L6413); "I don't care about tokens or time" (L13739).
5. **Cost is no object, polish is the bar** — "It can cost me how many dollars it can. I don't care… I want a polished product at the end. Time could be reduced by parallelizing… by pre-planning" (L23711).
6. **One-shot inputs at the plan gate** — single consolidated question batch with recommendations pre-marked; assume-and-flag during execution (L23711; memory feedback_one_shot_master_plan).
7. **Resumable plans + handoff docs in docs/** so compaction never loses the roadmap — "create a plan in a way that even if this context runs out… we can continue" (L16907; HANDOFF.md / CONTINUE-HERE.md / IMPROVEMENT-PLAN.md pattern he repeatedly requested: L3248, L9575, L13779).
8. **Verification by actually seeing** — Playwright walks, burst screenshots, objective bounding-box detectors over eyeballing; re-screenshot after fix (L1229, L1717, L16133).
9. **Visual design via Claude web** — I write the prompt, he iterates on claude.ai, brings JSX back (L181; memory feedback_design_workflow).
10. **Memory upkeep** — "save this to your memory or the Claude.md file" (compaction L11493); durable decisions must be persisted.
11. **ccaudit MCP** for searching past conversations across compactions (L23760).
12. **Commit trailer** convention on this repo: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (historical; current global default is Claude Fable 5 trailer — confirm which at plan time).
13. **Repo gotchas**: `gh auth setup-git` fixes 403s; dev server on :3000 (no basePath in dev); workflow agents (not background Agent-tool) for ~/Downloads edits if TCC bites; SceneLayout `widthFill` must stay 1.0.
14. **DRY confirmed from day one** — "we'll [be] using the DRY pattern everywhere, right?" (L222).

## H. Open contradictions / tensions

1. **Depth vs approachability** — interview-prepper wants hard/2-D DP; class-10 already drowning at bs-b4. Resolved on paper (protected gentle spine + opt-in hard surfaces, PRODUCT-ASSESSMENT) but Phase 6 unbuilt — the master plan must keep hard content opt-in, never default.
2. **Verbose vs short content** — friend: old verbose content was easier (L15207, restored); him: "7 pages to explain a variable… absurd" for refreshers (L23711). Read: register-driven LENGTH (intuitive long, rigorous 1–3 beats) reconciles both — length is per-audience, not global.
3. **"Keep copies of content" (L22900) vs zero-duplication (A4)** — resolved to shared skeleton + register prose with base fallback; watch that register fan-out agents don't drift into full copies.
4. **Not linear, but not a graph** — rejected force-graph (F2) AND "Not just linear" (L19898). Resolution = layered hierarchy with directional arrows; any new map work must stay in that middle band.
5. **Code reveal-on-demand vs discoverability** — he wants code hidden so it doesn't scare (F6), audits say the code tab is near-invisible to people who want it. Read: keep hidden-by-default, raise affordance (labeled tab/peek), auto-open at climax.
6. **Socratic prediction gates vs zero-grunt-work** — gates add friction; zero-grunt says observe-don't-compute. Read: predictions must be recognition taps (3-choice), never arithmetic; graded gently with retry.
7. **One-shot autonomy vs review-gated phases** — Phases 4/6/7 are marked "confirm with Subhayu first" while he simultaneously wants no mid-execution questions. Read: fold every ⚠️ gate into the ONE plan-time question batch (his stated preference, memory feedback_one_shot_master_plan).
8. **"operate on a different branch or main" (L19770) vs "NEVER push main"** — not a real conflict: branch from fresh main per PR; direct-to-main remains forbidden.
9. **Onboarding-never-changes vs /start still being polished** — the freeze applies to the questionnaire's structure once users exist; pre-launch UX fixes (map fold, space efficiency) are expected. Confirm freeze point in the master plan.
10. **localStorage-first (PWA/offline) vs future accounts** — he wants local now, "maybe account later" (L23518); ProgressStore v2 migration rule (never lose progress) must govern any identity/sync work.
