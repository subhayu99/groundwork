# JOURNEY SPINE — frozen contract (Front-Door Wave, 2026-06)

This file freezes the `spine.ts` + `plans.ts` API and the `NextStepsContent`
extension for the front-door wave. **Every leaf imports these; none redefine
them.** If a leaf needs a shape that isn't here, that's a contract change —
edit this file and the contract source in the SAME serial step, never fork a
local copy.

Sources of truth (the code wins over this doc if they ever diverge):

- `src/shared/journey/spine.ts`
- `src/shared/journey/plans.ts`
- `src/shared/next-steps/types.ts`

Tests (the workflow re-runs these, reads the real exit code):

- `src/tests/journey-spine.test.ts`
- `src/tests/journey-plans.test.ts`

---

## 1. `spine.ts` — the named journey layer

A thin, domain-agnostic layer over `src/categories/registry.ts`. It **names**
the existing 3-track arc into a 4-stage journey and answers "where am I / what's
next." It re-orders nothing. Adding a track later (e.g. system-design) + one
`STAGES` row extends the journey with zero leaf changes.

```ts
interface JourneyStage {
  key: string;          // stable stage id (also the URL/test key)
  n: number;            // 1-based stage number (1..total)
  total: number;        // always 4
  name: string;         // display name
  promise: string;      // one-line "what this stage lets you do"
  categoryKeys: string[]; // registry category keys (EMPTY for the destination)
  href: string;         // where the stage CTA goes
}

const STAGES: JourneyStage[]; // 4 stages, total = 4 on every stage

function stageForCategory(categoryKey: string): JourneyStage | undefined;
function stageForTopic(topicKey: string): JourneyStage | undefined; // via registry lookup

interface StageProgress {
  stage: JourneyStage;
  doneInStage: number;   // completed registry topics in this stage's categories
  totalInStage: number;  // total registry topics in this stage's categories (0 for destination)
  overallDone: number;   // platform-wide completed (concrete stages); same on every row
  overallTotal: number;  // platform-wide total (concrete stages); same on every row
}

function journeyProgress(state: ProgressState): StageProgress[];
```

### The 4-stage table (FROZEN)

| n | key | name | promise | categoryKeys | href |
|---|---|---|---|---|---|
| 1 | `foundations` | Foundations | `Make the computer do what you say.` | `["programming-basics"]` | `/categories/programming-basics` |
| 2 | `structures` | Structures | `Hold data so you can find it again.` | `["data-structures"]` | `/categories/data-structures` |
| 3 | `techniques` | Techniques | `Turn the seven ideas into algorithms.` | `["algorithms"]` | `/categories/algorithms` |
| 4 | `fluency` | Fluency | `Make it stick — practice, recall, interview-ready.` | `[]` | `/progress` |

- Stage 4 (`fluency`) is the **destination**: empty `categoryKeys`,
  `totalInStage = 0`, points at `/progress`. It exists so the journey has an end,
  not a dead stop at the last topic.
- **Current stage is NOT returned** by `journeyProgress`. Consumers compute it:
  the first stage with `doneInStage < totalInStage`, falling through to `fluency`
  when every concrete stage is complete.
- `journeyProgress` **NEVER throws** on an empty/partial/bare `{}` ProgressState
  (newcomers are the common case). Stale/unknown saved keys are ignored — they
  cannot inflate a count; a topic recorded-but-not-completed does not count.
- `overallDone` / `overallTotal` are PLATFORM-WIDE running totals over the
  concrete stages (1..3) — identical on every returned row (a convenience for
  rendering "x of N across the whole journey" on any stage).

---

## 2. `plans.ts` — goal-driven study plans

Lights up the (previously dead) `Goal` wiring. A plan is a computed, time-boxed
sequence of milestones over the registry topics, shaped by the learner's goal.
**v1 is computed-and-displayed (no persistence).**

```ts
interface PlanMilestone {
  topicKey: string;
  name: string;             // === registry meta.name
  href: string;             // `/categories/${category}/${key}`
  minutes: number;          // === registry meta.estimatedMinutes
  cumulativeMinutes: number;// running sum of minutes (non-decreasing)
  stageKey: string;         // spine stage key for the topic ("" if unmapped)
  done: boolean;            // read from ProgressState
}

interface StudyPlan {
  goal: Goal;               // "understand" | "interview" | "refresh"
  title: string;
  subtitle: string;
  totalMinutes: number;     // sum of milestone minutes
  milestones: PlanMilestone[];
}

function planFor(goal: Goal, state: ProgressState, topics: TopicMeta[]): StudyPlan;
```

`topics` is the registry topic list — callers pass `listAllTopics()`. Kept as a
parameter so the function is pure and trivially testable. **NEVER throws** on
empty/partial state.

### The three shapes (FROZEN)

- **`understand`** → ALL topics in **registry order**, nothing trimmed (the full path).
- **`interview`** → ALL `algorithms` topics + the six interview-relevant DS topics
  `[arrays, strings, hash-maps, linked-lists, trees, graphs]`, **EXCLUDING
  programming-basics**, ordered by **tier then registry order** (tier rank
  `free < premium < pro`; equal tiers keep registry order via a stable sort).
  Count today = 12 algorithms + 6 DS = 18.
- **`refresh`** → ONE canonical exemplar topic **per principle** (the seven ideas),
  shortest pass, walked in **idea order (1..7)**. The exemplar map (per
  `TRACK-NARRATIVES.md`, the clearest algorithmic teacher of each idea):

  | idea n | principle | exemplar topic |
  |---|---|---|
  | 1 | `information-reuse` | `sliding-window` |
  | 2 | `search-space-pruning` | `binary-search` |
  | 3 | `monotonicity-and-invariants` | `two-pointers` |
  | 4 | `decomposition` | `recursion` |
  | 5 | `trade-space-for-time` | `hash-maps` |
  | 6 | `amortization` | `monotonic-stack` |
  | 7 | `greedy-choice` | `activity-selection` |

  → exactly 7 milestones, each stamping a distinct principle covering all seven.

### Invariants (enforced by tests)

- `cumulativeMinutes` is the exact running sum of `minutes` → non-decreasing,
  last == `totalMinutes` == sum of all milestone minutes.
- No duplicate milestones.
- `interview` contains **no** programming-basics topic.
- `refresh` has exactly one topic per principle (7 total, all distinct).
- `done` reflects `state.categories[category][key].derivation.completed`.

---

## 3. `NextStepsContent` extension — `interviewAngle?`

Added to `src/shared/next-steps/types.ts` (purely additive, breaks nothing):

```ts
interviewAngle?: { askedAs: string; tip: string; companies?: string[] };
```

- Authored **only** for interview-relevant topics: the 12 algorithms topics +
  the 6 DS topics `[arrays, strings, hash-maps, linked-lists, trees, graphs]`.
- **Foundations (programming-basics) topics get none, on purpose** — an
  interview angle for `variables` would be noise. (They also have no
  `next-steps.ts` file at all — see §4.) Report this omission, don't silently skip.
- `companies` is optional and **illustrative**, never exhaustive/authoritative.

---

## 4. NextStepsContent AUTHORING PATH (exact targets for content + integration agents)

There are TWO completion surfaces, because there are two lesson renderers. Both
ultimately read from each topic's per-topic `next-steps.ts` content object.

### 4a. Where each topic's `NextStepsContent` object lives

One file per topic, exporting a single `…NextSteps: NextStepsContent` const:

- algorithms (12): `src/categories/algorithms/topics/<topic>/next-steps.ts`
- data-structures (8): `src/categories/data-structures/topics/<topic>/next-steps.ts`
- programming-basics (9): **none exist** (no `next-steps.ts` files) — consistent
  with "foundations get no interviewAngle."

**To author `interviewAngle`:** add the field to the relevant existing
`next-steps.ts` const. The 18 interview-relevant files are exactly the 12
algorithms + `arrays, strings, hash-maps, linked-lists, trees, graphs`. (The two
DS files that should NOT get an angle: `stacks-queues`, `sets-tuples`.)

### 4b. How those objects reach a TopicBundle

Each track's `topics/index.ts` imports the topic's `next-steps.ts` and assigns it
to the bundle's `nextSteps` field (the bundle's `nextSteps?: NextStepsContent`
type is declared in `src/categories/algorithms/topics/index.ts:24`):

- `src/categories/algorithms/topics/index.ts` — imports at lines 103–114,
  assigned as `nextSteps: <topic>NextSteps` per bundle (e.g. `binary-search` at
  line 151).
- `src/categories/data-structures/topics/index.ts` — imports at lines 52–59,
  assigned as `nextSteps:` per bundle (lines 82–173).

### 4c. CLASSIC renderer — full `NextStepsSection`

`src/shared/next-steps/NextStepsSection.tsx` renders the full content object
(recap, practice, related, real-world, resources). It is mounted ONLY by the
classic branch of the topic page:

- **`src/app/categories/[category]/[topic]/TopicPageClient.tsx:246-253`** —
  `{nextSteps && everCompleted && <NextStepsSection content={nextSteps} … />}`.
- This branch runs only for topics WITHOUT a scene lesson spec (the classic
  card+visualizer path). Today every topic in `src/shared/lesson/registry.ts`
  (all 29) has a scene spec, so the live completion surface is the SCENE one
  (§4d). `interviewAngle` should still be rendered here for correctness/parity
  if a topic ever falls back to classic: add it to `NextStepsSection` (props
  already carry the whole `content`).

### 4d. SCENE renderer — completion ceremony (the LIVE surface today)

Scene topics render via `LessonRuntime` → `SceneLayout`. The completion ceremony
is the block gated by `completed && b === last`:

- **`src/shared/lesson/SceneLayout.tsx:472`** — completion-ceremony block opens
  (`{completed && b === last && ( … )}`).
- **`src/shared/lesson/SceneLayout.tsx:494-517`** — the "go deeper" external
  resources row (the only piece of `NextStepsContent` currently surfaced here),
  rendered from `resources` (see below).
- The ceremony already reads `useAudience()` (SceneLayout ~line 176) so the
  active **goal** is available — the `interviewAngle` block should render here,
  prominently when `goal === "interview"`.

The scene path does NOT thread the full content object through the topic page.
It recovers ONLY the `resources` slice via a slug-keyed lookup:

- **`src/shared/lesson/nextStepsResources.ts`** — `RESOURCES_BY_SLUG`
  (lines 43–66) re-keys each topic's `…NextSteps.resources` by its
  `"<category>/<topic>"` slug; `getLessonResources(slug)` (line 69) returns the
  list or `[]`.
- **`src/shared/lesson/LessonRuntime.tsx:79-82`** — `useLessonEngine` recovers
  the slug by reverse-matching the spec against `lessonSpecs`, then calls
  `getLessonResources(slug)`; the result is exposed on the engine as `resources`
  (returned at LessonRuntime.tsx ~line 214) and consumed by SceneLayout.

**Integration target for `interviewAngle` on the scene path (the recommended
pattern, mirroring resources — keeps the un-owned topic page untouched):**

1. In `nextStepsResources.ts`, add an `INTERVIEW_ANGLE_BY_SLUG` map +
   `getInterviewAngle(slug)` that returns
   `RESOURCES`-style the `…NextSteps.interviewAngle` for the slug (or `undefined`).
2. In `LessonRuntime.tsx` `useLessonEngine`, resolve `interviewAngle` from the
   same recovered slug and expose it on the engine return (next to `resources`).
3. In `SceneLayout.tsx`, inside the completion block (after the resources row),
   render the `interviewAngle` when present — emphasized when the audience
   `goal === "interview"`.

This is the single, exact place the integrator wires the new field; content
agents only edit the per-topic `next-steps.ts` files in §4a.

---

## 5. Report-all (deferred, not discarded)

1. `interviewAngle` for foundations topics — intentionally omitted (no
   `next-steps.ts` exists for them; an angle for `variables` would be noise).
2. Plans as editable/savable schedules — v1 is computed-and-displayed only.
3. `journeyProgress` does not return the current stage — consumers compute it
   (first incomplete concrete stage → else the `fluency` destination).
