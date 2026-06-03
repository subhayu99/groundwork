# Groundwork — Assessment V2 (Reworked Build)

*Synthesis of four persona assessments: Class-10 student (15, never coded) · Brilliant non-technical expert · Learning-experience/UX evaluator · Product & marketability strategist.*

*Date: 2026-06-01*

---

## Executive summary

The rework landed the hard part. On a laptop, every persona — including a literal 15-year-old who has never coded — got to "I understand this" through the phone-book and two-fingers framings, and all four independently named the same hero feature: the accreting **"WHAT WE'VE ESTABLISHED" spine** that grows a checkmark each beat. That spine, plus the per-beat italic "why," plus code-replaces-card in the same flank, is genuinely best-in-class pedagogy and the sharpest positioning in the category ("first principles, not patterns").

But the build keeps its "no coding background" promise only until notation appears, then **silently switches languages** — `O(n)`, `arr[mid]`, `//`, `lo/hi`, raw type-hinted Python — with no bridge from the plain-English story it just earned. Three of four personas flagged this as the single biggest credibility break; it is the exact moment a motivated non-coder is told, without anyone saying it, "this part isn't for you."

The second universal failure is **mobile**: the diagram that is explicitly "the hero" renders as a squished, illegible strip, pushed below a foundation nudge that eats the entire first screen. Since the target audience lives on phones, this means a 10th-grader would bounce on beat one. On desktop the same diagram has the opposite problem — it floats in a sea of dead space in an oversized box.

Finally, Groundwork is still a **beautiful read-only manifesto, not a product**: no account, no saved progress, no practice-with-feedback, no return loop, and a home page that hides its own magic. It is a fundable, demo-winning prototype that is roughly one mobile fix, one notation bridge, and one retention loop away from being chargeable.

---

## Consensus issues (raised by 2+ personas)

### 1. The notation cliff — the app breaks its own "no coding background" promise the moment symbols appear
**Raised by:** Class-10 student, Non-technical expert, UX evaluator (and echoed by the strategist as the read-only/PRACTICE gap).

The first half of every lesson treats the learner as a clever 15-year-old (phone books, Downloads folders, org charts). Then the code panel and the "established" spine assert `def binary_search(arr: list[int], target: int) -> int:`, `mid = (lo + hi) // 2`, `O(n)`, `O(n^2)`, `arr[L] + arr[R] = 1 + 20 = 21` with zero plain-language unpacking. Nobody explains `->`, `: int`, `//`, what `O(n)` *is* (a formula? a category?), or that `arr[L]` means "the card at position L." The student's words: "I went from feeling smart to feeling like I walked into a senior's class." The scientist's: "the lesson taught the idea beautifully in words, then quietly switched to a private notation and assumed I'd follow."

**Fix:** Build a real bridge from story into code. (a) A first-time-only plain-language gloss for each symbol: `O(n)` = "the work grows in step with the list's length"; `arr[i]` = "the item at position i"; `//` = "divide and drop the remainder"; `lo/hi/L/R` tied back to the word "marker" the prose already uses. (b) A "read the code in English first" layer — tap a line to see "this picks the middle card" — with type hints hidden behind a "show grown-up version" toggle. (c) Reveal code line-by-line in words rather than dumping the whole function.

### 2. Mobile destroys the hero — the diagram (the whole point) is an illegible sliver below a screen-eating nudge
**Raised by:** all four personas (Class-10 sev5, Non-technical sev4, UX sev5, Strategist sev3).

On a 390px screen the number row shrinks to a microscopic smear, `lo/hi/target` labels are unreadable, the interactive "try it on the canvas" affordance is invisible, and the "RECOMMENDED FOUNDATION / Continue anyway" block consumes the top third — so the italic lead-in and the spine are entirely off-screen on first load. The learner on a phone gets the words without the picture, which destroys the spatial intuition that *is* the lesson. This is the device most of the audience actually uses.

**Fix:** Make the mobile diagram the FIRST, full-width, legible block — horizontally scrollable / pinch-zoomable, or wrap the number row into chunks so cells stay readable. Collapse the foundation nudge to a single dismissible one-line chip on mobile. The hero must lead and be readable before anything else stacks below it.

### 3. The "established" spine and canvas leak jargon (`O(n)`, `O(n^2)`, `O(1)`, `invariant`, `amortization`, `monotonicity`) without unpacking
**Raised by:** Class-10 student, Non-technical expert (and visible in the strategist's home-page concept-map note).

The reassuring checklist is great when it says "45 tries," but the `O(n^2)` sitting next to it is "a secret code." The home-page constellation map ("Monotonicity & Invariants," "Amortization," "Trade Space for Time") is a wall of unknown words right under the friendly headline, making the page feel secretly for university kids. For the quantitative thinker, the *cost* idea is the conceptual peak — and it's the least explained, delivered only as a symbol with no derivation.

**Fix:** Tap-to-explain tooltip (one plain sentence) on every piece of jargon, everywhere it appears — spine tags, canvas, and the home constellation map. Crucially, **derive the cost the way you derive the algorithm**: show the count physically first ("30 names, ~5 flips because each flip halves"; "15 cards, every-pair = 45 checks, two-fingers = ~10"), so `O(n)` is a *summary of something the learner watched*, not a pattern handed down. This also resolves the irony that the app derives the algorithm from first principles but states efficiency as a pattern.

### 4. Mobile foundation nudge is "non-blocking" but visually blocking; and it repeats verbatim
**Raised by:** UX evaluator, Strategist (mobile burying); Strategist + Class-10 (the nudge as kind/autonomy-respecting on desktop).

The nudge is rightly praised on desktop for respecting learner autonomy ("Continue anyway" — nobody locked out). But on mobile it out-weights the actual lesson on beat 1, and the *identical* copy appears verbatim on Binary Search and Two Pointers, so a multi-topic learner starts ignoring the whole band.

**Fix:** Collapse to a one-line chip on mobile (and a thin one-liner on desktop beat 1). Vary or suppress the copy once dismissed so it doesn't read as nagging. Keep the non-blocking behavior — that part is right.

### 5. Gated "Next" button: the "try it on the canvas" instruction is the smallest text on screen
**Raised by:** Class-10 student, UX evaluator.

On interaction-gated beats, the forward button ("I see the pattern," "Each node points to its kids") is greyed out, gated behind a tiny low-contrast footnote, while the disabled button still looks like the obvious target. "A 15-year-old's patience for 'why won't this let me continue' is about four seconds" — they'll think the app is broken.

**Fix:** Promote the instruction next to the controls, give it the contrast the dead button currently has, and de-emphasize the disabled button. Pulse/glow the clickable L/R buttons or nodes so the real next action is unmissable.

### 6. Desktop hero box is oversized; on interaction beats, prose lives in too many places
**Raised by:** UX evaluator (primary), with the lead-in-sentence complaint shared by Class-10.

The bordered hero reserves ~550px but the content occupies a thin band near center, so the eye lands on emptiness and the two columns don't share a baseline. Separately, the same beat sometimes shows the why-card (collapsed), an inline canvas why-bubble, AND the spine bullet — three overlapping explanatory surfaces, with inconsistent rules for when prose lives where. The italic lead-ins are also long "school-essay" sentences — the *first* thing read each beat is the hardest.

**Fix:** Make the hero box hug its content (or vertically center with a sensible max-height). Pick ONE canonical place per beat for the why-prose. Shorten lead-ins to one short line of everyday words. De-duplicate the repeated "THE DERIVATION" eyebrows to reclaim vertical space.

---

## Per-persona verdicts

### Class-10 student (15, never coded)
> "I'd happily finish a Binary Search lesson on a laptop and feel proud — but on my phone the squished diagram and the sudden scary Python would probably make me quit before lesson two. Right now I'd come back only if a teacher made me, not on my own."

- **Loved:** The phone-book "flip to the middle, throw away half" (the single best moment in the app — felt clever, not stupid). The growing checkmark spine ("see, you already know these things"). Consistent everyday metaphors (Downloads folder, org chart, names in boxes). The conversational forward button. The kind, non-locking foundation nudge.
- **Bounced on:** The code cliff (sev4 — `->`, `: int`, `//` unexplained). Squished mobile diagram (sev5). Constellation-map jargon wall (sev3). Mystery gated button (sev3). Long essay lead-ins harder than the body card (sev2). Mobile home reading like a 20-row textbook index (sev2). `O(...)` tags in the spine (sev3).
- **Net:** Capable on laptop, abandons on phone. Keeps the promise emotionally in the first half of each beat, breaks it the moment code/notation appears.

### Brilliant non-technical expert ("NASA scientist who doesn't know tech")
> "On desktop I'd keep using it and recommend it to any curious adult — the reasoning-first structure is that good. As it stands I'd hit a notation wall in most topics and quietly give up on a phone. Close the symbol-explanation gap and I'd happily pay for it."

- **Loved:** Analogies at the right intellectual altitude. The accreting spine as "exactly how a scientist builds an argument." Motivation-before-mechanism ordering. The recursion call-stack visual. Autonomy-respecting nudge. Color-coded hash-map collisions explained in words.
- **Bounced on:** Math/array notation with zero unpacking (sev4). Code panel as unlabeled noise with no "you may ignore this" reassurance (sev3). Mobile hero collapse (sev4). Unexplained single-letter pills `lo/hi/mid`, `L/R` (sev3). `O(n)` — the conceptual *peak* — being the least explained (sev4). PRACTICE links signalling "this is really for people who'll write code" (sev2).
- **Net:** A paying advocate on desktop, blocked by notation and mobile. Explicitly willing to pay once the symbol bridge exists.

### Learning-experience / UX evaluator
> "For a motivated 10th-grader on a laptop: yes, they'd keep going and likely recommend it. On a phone: they'd bounce on beat 1. Worth paying for once the mobile hero and the dead-space sizing are fixed — not before."

- **Loved:** The spine as "the single feature that delivers on first principles, not patterns." Per-beat italic lead-in doing real pedagogical work. Code-replaces-card in the same flank (right call over a modal). Caption band + contextual "why?" naming (THE SETUP/DERIVATION/INSTINCT/PATTERN) + changing action labels. Hash-map and recursion canvases carrying real teaching load.
- **Bounced on:** Oversized desktop hero floating in dead space + broken column baseline (sev4). Mobile hero as illegible sliver (sev5). Mobile nudge burying the hero (sev4). Ambiguous gated-button cue (sev3). Three competing "why?" surfaces with inconsistent rules (sev3). Wasted left margin when code is open (sev2). Redundant beat-name eyebrows stacking vertically (sev2).
- **Net:** "The composition and pedagogy are right; the spatial calibration is not." Fixing hero sizing at both viewport ends moves it from "good idea, awkward execution" to best-in-class.

### Product & marketability strategist
> "A learner would say 'whoa' to a single lesson and bookmark it — but with no account, no practice, and no come-back loop, they wouldn't pay yet and wouldn't reliably return. This is a fundable, demo-winning prototype that is one retention loop and one homepage-proof away from being a product."

- **Loved:** "First principles, not patterns" as an ownable wedge Brilliant/NeetCode/VisuAlgo don't claim. The lesson canvas as a delivering wow moment. The reveal-code sync as the most credible "we teach understanding" proof. First-principles framing carried consistently across topics (trust). Restrained, tasteful visual system. The recursion call-stack as the shareable screenshot.
- **Bounced on:** Home page sells the claim but shows zero product proof — the wow is buried one click deep (sev4). No trust/credibility signals anywhere (sev4). No account, no saved progress, no return loop (sev5 — "you cannot charge a subscription for something with no reason to return"). No practice/assessment loop — read-only learning (sev4). Mobile first screen wasted on meta-nudge (sev3). No shareable/virality hook on genuinely screenshot-worthy frames (sev3). Verbatim-repeated nudge risks feeling like nagging (sev2).
- **Net:** Best-in-class teaching artifact + sharpest positioning, wrapped in a read-only manifesto. The path to "product people pay for" is: surface the live lesson on the homepage + wrap one retention/active-recall loop.

---

## Prioritized roadmap

### Quick wins (small effort, ship this week)
1. **Plain-language symbol glosses (first-occurrence only).** Inline parenthetical or tap tooltip for `O(n)`, `O(n^2)`, `O(1)`, `arr[i]`, `//`, `lo/hi/mid`, `L/R` — each tied to the word the prose already used ("L = left marker"). *Closes consensus #1/#3 cheaply; unblocks both non-coder personas.*
2. **Honest label on the code panel.** One line: "Optional — the same idea in a computer's language. The lesson is complete without it." Reframe "line follows the beat" to invite, not obligate. *(Non-technical sev3.)*
3. **Fix the gated-button cue.** Promote "try it on the canvas" next to the controls with real contrast; dim the dead button; pulse/glow the clickable elements. *(Consensus #5.)*
4. **Hug the desktop hero box to its content** (or vertically center with a max-height) and **drop the duplicate beat-name eyebrow.** *(Consensus #6; UX sev4 + sev2.)*
5. **Shorten the italic lead-ins** to one short everyday-language line. *(Class-10 sev2.)*
6. **Vary / suppress the repeated foundation-nudge copy** after first dismissal. *(Consensus #4; Strategist sev2.)*

### High-impact (medium effort, the difference between "demo" and "keeps the promise")
1. **Rework the mobile lesson.** Diagram first, full-width, legible (horizontal scroll / pinch-zoom / wrapped row); foundation nudge collapses to a one-line chip. This is the single most important fix — it's where most of the audience and the worst failure both live. *(Consensus #2; all four personas.)*
2. **Build the story-into-code bridge.** "Read the code in English first" layer (tap a line → plain sentence), reveal line-by-line in words, hide type hints behind a "show grown-up version" toggle. *(Consensus #1; Class-10's "one big thing.")*
3. **Derive cost physically before naming it.** Show the count the learner can watch ("~5 flips for 30 names," "45 vs ~10 checks") so `O(n)` is a summary, not a symbol. *(Consensus #3; Non-technical sev4 — the conceptual peak.)*
4. **One canonical why-surface per beat.** Collapse the three overlapping explanatory blocks into one; make the rule consistent across setup vs derivation beats. *(Consensus #6; UX sev3.)*
5. **Make the mobile home visual.** Topic icons, preview thumbnails, grouped/collapsible categories so it stops reading like a 20-row syllabus. *(Class-10 sev2.)*
6. **Surface the live lesson on the home page.** Embedded auto-playing mini-canvas of the "eliminate half" move + "this is one of 7 ideas." Show the magic above the fold. *(Strategist sev4 — homepage proof.)*

### Strategic (larger effort, the path to a chargeable product)
1. **Accounts + retention loop.** Saved progress per topic (the PROGRESS nav already implies it but no auth backs it), a streak / daily-derivation goal, an email/push nudge. *This is the prerequisite to charging anything.* *(Strategist sev5.)*
2. **Active-recall practice with feedback.** Convert the static "PRACTICE · try these next" panel into an in-app "now you try" after the Pattern beat (drag the pointers / predict the return / pick the next move) with instant checking. Read-only → do-and-check. *(Strategist sev4; also reframes the PRACTICE links the non-technical persona found alienating.)*
3. **Trust + credibility + pricing signal on home.** Named pedagogical POV/about, 2-3 learner quotes, a "the 7 ideas are free" tier line. *(Strategist sev4.)*
4. **Shareable artifact.** Auto-generated "I derived binary search from scratch" card / badge at the end of each topic, hung on the already-screenshot-worthy recursion and hash-map frames. *(Strategist sev3 — the only built-in growth wedge.)*
5. **Demystify the home constellation map** (tap any node → one plain sentence) so the depth-signal stops reading as a university gatekeeper. *(Class-10 sev3; Non-technical home concern.)*

---

## Market readiness

**Not yet marketable as a paid product; very close to a fundable, demo-winning prototype.** Three of four personas would actively recommend it *on a laptop today*, and two (the scientist, the UX evaluator) explicitly said they would *pay* once two gates are cleared: the notation bridge and the mobile hero. That is a strong signal — the teaching artifact and the positioning ("first principles, not patterns") are already best-in-class and ownable against Brilliant, NeetCode, and VisuAlgo.

What stands between Groundwork and a shippable/chargeable product is a short, well-understood list. **For "shippable to learners":** fix mobile (the hero must lead and be legible) and ship the symbol bridge — without these, the majority phone audience bounces on beat one and the core "no coding background" promise breaks the moment notation appears. These are the two non-negotiables; they are mostly medium-effort, not research problems.

**For "chargeable":** you cannot charge a subscription for a read-only manifesto with no account and no reason to return on day two. The product needs accounts + a retention loop and at least one active-recall practice-with-feedback step — that is what closes the gap to Brilliant's paid value and what a parent or school can be sold on. The home page must also stop hiding its own magic: surface the live lesson and add minimal trust signals, or the bounce-risk visitor leaves having seen only a (beautiful, confident) slogan.

**The honest state:** the hardest, most differentiated thing — making a 15-year-old derive binary search and feel clever — is *done and verified across personas*. The remaining work is execution, not invention: spatial calibration, a translation layer, and the standard scaffolding (accounts, practice, proof) that turns a beautiful teaching artifact into a product people choose, return to, and pay for. Keep the scene/annotated-canvas format — every persona named it as the reason to keep going; improve its calibration and its bridge to code, do not discard it.
