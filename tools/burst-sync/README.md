# burst-sync — frame-by-frame left↔right audit harness (E1 / L0.11)

Subhayu's explicit verification method, made scriptable: for every animated beat,
capture a **burst** of paired evidence — a screenshot frame + a DOM probe — every
~250 ms for ~6 s, then run an **objective** checker over the pairs. A human (or a
Wave-V agent) reads the flagged frames, not all of them.

The left↔right sync promise being audited: *the highlighted code line always
matches what the visual is doing right now.*

## Layout

```
tools/burst-sync/
  capture.js   collects evidence  (Playwright; run via the playwright-skill executor)
  check.js     judges evidence    (plain node, zero deps)
  out/<category>/<topic>/
    probes.json     all probes + capture metadata
    frames/*.jpg    one viewport frame per probe (b<beat>-f<frame>.jpg)
    verdict.json    written by check.js
```

`out/` is generated evidence — do not commit it.

## Running

Playwright is **not** a repo dependency (kept that way deliberately). Capture runs
through the playwright-skill executor, which provides it:

```bash
# 1. dev server up
npm run dev                                  # http://localhost:3000

# 2. capture one topic (FROM THE REPO ROOT — output resolves via $PWD).
#    The script path MUST be absolute: the executor chdirs into the skill dir
#    before resolving its file argument.
node /Users/subhayu/.claude/plugins/cache/playwright-skill/playwright-skill/4.1.0/skills/playwright-skill/run.js \
  "$PWD/tools/burst-sync/capture.js" algorithms/binary-search

# 3. check it (plain node)
node tools/burst-sync/check.js algorithms/binary-search
```

`check.js` exits 0 on pass (warnings allowed), 1 on fail, and writes
`verdict.json` next to `probes.json`.

### Knobs (env)

| var | default | meaning |
|---|---|---|
| `BASE` | `http://localhost:3000` | app origin (no trailing slash needed) |
| `TOPIC` | — | `category/topic`; equivalent to the CLI arg |
| `OUT` | `$PWD/tools/burst-sync/out` | output root (capture runs chdir'd into the skill dir, so `$PWD`/`OUT` is how it finds home — run from the repo root or set `OUT`) |
| `BURST_MS` | `250` | probe cadence |
| `BURST_S` | `6` | burst length per beat |
| `SETTLE_MS` | `700` | wait after arriving on a beat (entry fade) |
| `REGISTER` | `structured` | injected learner profile (`intuitive`/`structured`/`rigorous`); `none` = raw first-visit state |
| `FULL` | off | `1` = full burst even on visually static beats (default short-circuits them at ~2.5 s) |
| `HEADFUL` | off | `1` = headed browser |
| `FADE_MS` / `MIN_STEPS` / `MAX_STUCK` | `700` / `2` / `3` | checker thresholds (see below) |

## What capture does

1. Injects a learner profile into `localStorage` (`fp-progress-v1`) so first-visit
   chrome never blocks automation, then opens `/categories/<cat>/<topic>/` at
   1680×950 (desktop layout: hero + flank + step dots).
2. Opens the code panel once (`aria-label="show code"`) — the engine makes a
   manual toggle sticky across beats.
3. Steps beat → beat via the step-dot nav. If a wedge gate blocks forward dots
   (scene layout), it satisfies the gate by clicking canvas `[role="button"]`
   targets (cells before reset/replay controls) until the gate cue clears.
4. Per beat, after the settle wait: a probe + screenshot every `BURST_MS` for
   `BURST_S`. Each probe records:
   - `activeCodeLines` — 1-based line numbers of `[data-active-line]` rows
   - `step`/`beatLabel` — from the lesson's `aria-live` step announcement
   - `svgSig`/`svgHash` — a serialization of the visible hero svg (tags,
     geometry/paint attrs, inline opacity, text content) and its hash
   - `codeOpen`, `gateActive`, `totalCodeLines`, `tMs`, paired `frame` path

## What check judges (objectively)

A **visual step** = consecutive probe pair with different `svgHash`, both past
`FADE_MS` (so the beat-mount fade can't masquerade as playback). A beat **is
animating** when it has ≥ `MIN_STEPS` visual steps.

| rule | severity | fires when |
|---|---|---|
| `empty-during-animation` | error | `activeCodeLines` is `[]` in any frame inside the animating window while the code panel is open |
| `stuck-line` | error | the same line set stays lit across > `MAX_STUCK` consecutive visual steps |
| `line-outside-file` | error | an active line number is outside `1..totalCodeLines` |
| `code-panel-closed` | warning | a beat animated but the panel was closed the whole burst (A/B unjudgeable) |
| `gate-stuck` | warning | capture couldn't get past a wedge gate; later beats lack evidence |

Verdict = `fail` iff any error. The flagged frames (`findings[].frame`) are the
ones a human should actually open.

### Known limits (read before trusting a verdict)

- The svg hash treats ANY attr/text change as motion — a blinking caret-style
  element or `…` ticker would count. Raise `MIN_STEPS` if a topic has such an
  element.
- `stuck-line` is a heuristic: a long single-line loop legitimately re-lighting
  the same line across many visual steps will flag. Inspect the frames; raise
  `MAX_STUCK` per-topic if the lit line is genuinely correct, and say so in the
  audit notes.
- Probe cadence is best-effort (~`BURST_MS` + screenshot latency, ≈80–150 ms
  headless). `tMs` records the real timestamps.
- The checker proves line/visual *co-movement*, not semantic correctness — a
  beat lighting the *wrong-but-changing* line still passes A/B. That last mile
  stays human (read the flagged + a sample of passing frames).

## Wave-V acceptance bar (L5.2)

The full run = `capture.js` + `check.js` across **every topic × the beats that
animate** (all 29 topics; registers: at least `structured`, plus `intuitive` and
`rigorous` for the depth-tagged pilots):

1. **0 errors** (`empty-during-animation`, `stuck-line`, `line-outside-file`)
   across all topics — each flagged beat is either fixed or explicitly waived
   with a frame-level justification in the audit notes.
2. **0 unexplained warnings** — every `code-panel-closed`/`gate-stuck` is
   resolved (harness fix or topic fix), not ignored.
3. Every topic's `verdict.json` committed to the audit record (NOT to the repo)
   and summarized in the Wave-V report, with per-topic
   pass/fail + waivers.
4. Spot-check (human): for ≥1 animated beat per track, open the paired frames
   and confirm the lit line genuinely describes the visual action — the
   checker's co-movement pass is necessary, not sufficient.
