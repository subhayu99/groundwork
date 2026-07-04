# Anti-slop content playbook

How we keep learner-facing prose from reading as AI-generated. Apply this when
writing or migrating any lesson's content (and to orientation / front-door copy).

## What the audit found (Jun 2026)

Across all 29 topics, the content is **clean on vocabulary and constructions**.
The one dominant tell was **em-dash overuse**: ~2,500 user-facing em-dashes
(906 literal `—` + 1,617 `&mdash;` entities), ~87 per topic. Everything else
was already fine. So the cleanup is narrow: thin and vary the em-dashes.

## The one real fix: thin & vary em-dashes

Both encodings count: the literal `—` and the HTML entity `&mdash;`.

Goal is **not zero dashes** — uniformity (every dash → a period) is its own
tell. Reduce a topic from ~70–100 dashes to **≤ ~12**, and **vary** the fix:

- **period** — split a dash-joined clause into two sentences (most common)
- **comma** — when the second half continues the thought
- **colon** — when the second half *defines / explains / lists* the first
- **semicolon** — to link two tight independent clauses (use sparingly)
- **light restructure** — reorder so no joiner is needed
- **keep an em-dash** only where it's a genuine sharp aside/interruption that
  reads naturally aloud — at most ~1 per long paragraph

Before → after (from the binary-search pilot):

| before | after | fix |
|---|---|---|
| `A sorted phone book — find one name without reading it all.` | `A sorted phone book. Find one name without reading it all.` | period |
| `Reading page by page is O(n) — and wastes the sorted order.` | `Reading page by page is O(n), and it wastes the sorted order.` | comma |
| `Strip the array away — the real requirement is a monotone predicate.` | `Strip the array away: the real requirement is a monotone predicate.` | colon |
| `An array hands you any position in one step — now add sorted order, and one look can rule out half the row.` | `An array hands you any position in one step. Add sorted order, and one look rules out half the row.` | period + restructure |

## Leave these alone (NOT slop)

- **Curly quotes / entities**: `&rsquo;` `&ldquo;` `&rdquo;` `&hellip;` `&gt;`
  `&lt;` `&#8322;` — correct typography for rendered prose.
- **"not just X" emphasis** (e.g. "Not just grids. Anything with neighbours.")
  — that's deliberate emphasis, not the slop "it's not just X — it's Y" pattern.
- **em-dashes inside code/markup**: `<code>…</code>`, `<Term word="…">`, JSX
  attributes, PredictGate `question=`/`choices`, terse SVG UI status strings,
  and ALL comments (`//`, `/* */`, JSDoc). Only edit human-readable prose.

## Watch-list (rare here, but cut on sight)

- Banned words: delve, tapestry, testament, leverage, elevate, showcase,
  underscore, pivotal, realm, foster, resonate, embrace, meticulous,
  groundbreaking, game-changer, "ever-evolving", seamless, robust, unlock,
  unleash, "dive into". (Audit found ~0 in content; keep it that way.)
- Rhetorical scaffolding openers: "Here's the thing", "The secret:",
  "The magic:", "Let that sink in", "Make no mistake". Soften to plain prose.
- Rule-of-three adjective stacks ("vibrant, rich, and profound").

## Hard rule for any rewrite

**Preserve meaning exactly.** This is pedagogical content: never change a number,
example, technical claim, or the distinct voice of each register (base /
intuitive / rigorous / structured — different wordings of the same beat are
deliberate). Only touch punctuation and sentence structure.

## Audit / verify commands

```sh
# count em-dashes in a topic spec (literal + entity)
rg -c '—' src/categories/<cat>/topics/<topic>/lesson-spec.tsx
rg -c '&mdash;' src/categories/<cat>/topics/<topic>/lesson-spec.tsx

# platform-wide user-facing em-dash sweep
rg -n '—' src/categories src/app --glob '*.tsx' --glob '*.ts' | rg '"|<>|<p>|<em>' | wc -l
```

After editing, gate as usual: `npx tsc --noEmit && npm run test && npm run build`.

## Status

- **binary-search (focus pilot): done** — 105 → ~11 dashes, the rest in
  code/comments/props.
- **other 28 topics: pending** — clean each as it migrates to the focus layout
  in Phase 3 (one topic at a time, re-audit + gate per topic).
