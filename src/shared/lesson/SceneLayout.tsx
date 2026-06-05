"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CodeHighlight } from "@/shared/code/CodeHighlight";
import { ArrowDefs } from "./canvas";
import { PrereqNudge, type PrereqItem } from "./PrereqNudge";
import { useLessonEngine, type LessonRuntimeProps } from "./LessonRuntime";
import { gloss } from "./gloss";
import { PanZoom } from "./PanZoom";

/**
 * The "one-scene" immersive layout (opt-in via `spec.layout === "scene"`).
 *
 * Read ACROSS: a bordered, aspect-locked diagram box is the hero; a right flank
 * holds the deeper "why?" card + the accreting "what we've established" spine.
 * Toggling code REPLACES those two cards in the same flank (the flank widens) —
 * no separate overlay. On mobile everything stacks into one scroll column below
 * the visual (no bottom-sheet / FAB). Nothing here touches the classic layout.
 */
export function SceneLayout({
  spec,
  practice,
  nav,
  onComplete,
  initiallyCompleted,
  prerequisites,
}: LessonRuntimeProps) {
  // Box is aspect-locked to the canvas, so a pure width-fit (widthFill 1.0) makes
  // the 860x470 plane fill the box exactly — no margins, no edge clipping.
  const e = useLessonEngine(spec, {
    initiallyCompleted,
    onComplete,
    scaleClamp: { min: 0.4, max: 2.4, biasWidth: true, widthFill: 1.0 },
  });
  const {
    VW, VH, PY, b, setB, last, beat,
    showCode, toggleCode, showDetail, setShowDetail,
    completed, areaRef, scale, gated, activeLines, visualNode,
    codeScrollRef, goNext,
  } = e;

  const [prereqDismissed, setPrereqDismissed] = useState(false);

  // MOBILE hero scale — computed independently of the engine's (desktop) scale so
  // the phone diagram reads LEGIBLY large. We bias to the box HEIGHT (the mobile
  // box gets a real min-height) and let the wide plane overflow horizontally
  // (the box is overflow-x-auto), instead of shrinking everything to a sliver to
  // fit the narrow width. Desktop is untouched: it keeps using the engine's
  // areaRef/scale on its own (xl-only) plane below.
  const mAreaRef = useRef<HTMLDivElement>(null);
  const [mScale, setMScale] = useState(1);
  useEffect(() => {
    const el = mAreaRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (h <= 0) return;
      // Fill the (tall) box height; never go below a width-fit so a tall narrow
      // plane can't overflow horizontally for no reason. Clamp so labels stay
      // crisp (cap) and a very short viewport still fits (floor).
      const byHeight = h / VH;
      const byWidth = w > 0 ? w / VW : byHeight;
      setMScale(Math.max(0.5, Math.min(Math.max(byHeight, byWidth), 1.6)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [VW, VH, b]);

  // VERTICALLY CENTRE the drawn content in the canvas band. The per-topic visuals
  // were authored for the CLASSIC layout, whose tall on-canvas top panel occupied
  // ~150-200 design px; the scene layout replaced that with a thin caption band,
  // so every topic's content was left bottom-stuck with a dead zone up top. Rather
  // than retune 20 sets of geometry constants, we measure the SVG content's bbox
  // (in design coords) and translate svg+notes to centre it — once, in the shared
  // layer, so every current and future topic is balanced for free.
  const svgRef = useRef<SVGSVGElement>(null);
  const mSvgRef = useRef<SVGSVGElement>(null);
  const [vShift, setVShift] = useState(0);
  const [mVShift, setMVShift] = useState(0);
  useEffect(() => {
    // Authored (shift-independent) vertical extent of the real drawn content in a
    // canvas plane: union the RENDERED boxes of svg leaves + on-canvas notes, minus
    // the shift already applied (read off the wrapper's transform). Using
    // getBoundingClientRect — not svg.getBBox — means unrendered <defs> markers are
    // 0-sized and excluded for free; full-canvas backdrops are dropped explicitly.
    // Notes are folded in so centring the diagram can never push an annotation off-screen.
    const extent = (svgEl: SVGSVGElement | null) => {
      const root = svgEl?.closest("[data-canvas-root]") as HTMLElement | null;
      if (!root || !svgEl?.parentElement) return null;
      const rb = root.getBoundingClientRect();
      const VHpx = root.offsetHeight;
      if (!VHpx || rb.height < 1) return null;
      const sc = rb.height / VHpx;
      let cur = 0;
      try { cur = new DOMMatrixReadOnly(getComputedStyle(svgEl.parentElement).transform).f; } catch { /* identity */ }
      let top = Infinity, bot = -Infinity;
      root.querySelectorAll("svg rect, svg circle, svg path, svg line, svg text, svg polygon, svg polyline, svg ellipse, [data-canvas-panel]").forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.width < 1 && r.height < 1) return;                                  // unrendered (defs marker)
        if (r.width >= rb.width * 0.95 && r.height >= rb.height * 0.92) return;   // full-canvas backdrop
        const t = (r.top - rb.top) / sc - cur, b2 = (r.bottom - rb.top) / sc - cur;
        if (!isFinite(t) || !isFinite(b2)) return;
        top = Math.min(top, t); bot = Math.max(bot, b2);
      });
      return isFinite(top) ? { top, h: bot - top } : null;
    };
    const shiftFor = (svgEl: SVGSVGElement | null, cap: number) => {
      const e = extent(svgEl);
      if (!e) return null;
      const top = Math.max(cap, cap + (VH - cap - e.h) / 2);
      return Math.round(top - e.top);
    };
    const compute = () => {
      const d = shiftFor(svgRef.current, 58);  // desktop: caption band overlays the top ~58 design px
      if (d != null) setVShift(d);
      const m = shiftFor(mSvgRef.current, 12); // mobile: caption sits BELOW the hero, ~whole band free
      if (m != null) setMVShift(m);
    };
    compute();
    const ts = [120, 320, 540].map((d) => setTimeout(compute, d)); // converge as the per-beat fade settles
    window.addEventListener("resize", compute);
    return () => { ts.forEach(clearTimeout); window.removeEventListener("resize", compute); };
  }, [b, beat.id, VW, VH]);
  const shiftWrap = "transform .32s cubic-bezier(.22,.65,.3,1)";

  // The "why?" card defaults open on beat 0, collapsed after — but ONCE THE
  // LEARNER TOGGLES IT, the choice STICKS across every beat (like the code panel).
  const detailTouched = useRef(false);
  useEffect(() => {
    if (detailTouched.current) return;
    setShowDetail(b === 0);
  }, [b, setShowDetail]);
  const toggleDetail = () => { detailTouched.current = true; setShowDetail((v) => !v); };

  // Align the flank content's TOP with the TOP of the diagram's caption band. The
  // box is vertically centred, so we measure its top relative to the (full-height)
  // flank and apply that as the flank's paddingTop. Re-measured on beat change /
  // code toggle / resize.
  const asideRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [railTop, setRailTop] = useState(0);
  useEffect(() => {
    const measure = () => {
      const aside = asideRef.current, box = boxRef.current;
      if (!aside || !box) return;
      setRailTop(Math.max(0, Math.round(box.getBoundingClientRect().top - aside.getBoundingClientRect().top)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [b, showCode]);

  const hasUnmetPrereq = !!prerequisites && prerequisites.some((p) => !p.completed);
  const showNudge = hasUnmetPrereq && !prereqDismissed && !initiallyCompleted && b === 0;
  const isSetup = b === 0;
  const spineLines = spec.beats.map((bt) => bt.takeaway ?? bt.label ?? "");
  const mainPanel = beat.panels.find((p) => p.variant !== "note");
  const advanceLabel = b === last
    ? (completed ? "Completed ✓" : "Finish ✓")
    : (beat.actionLabel ? `${beat.actionLabel} →` : "Next →");

  return (
    <main className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* ── TOP CHROME (always visible) ─────────────────────────────────────── */}
      <div className="shrink-0">
        <div className="flex items-center gap-3 px-3 sm:px-5 py-2 min-h-[40px] border-b border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-card)_35%,transparent)]">
          {nav && (
            <Link href={nav.categoryHref} aria-label={`Back to ${nav.categoryName}`} title={`Back to ${nav.categoryName}`}
              className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] -ml-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </Link>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block w-2.5 h-2.5 rotate-45 bg-[var(--accent-sky)] shrink-0" />
            <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-[var(--text)] truncate">{spec.topicTitle}</span>
            {beat.label && (
              <span className="hidden sm:inline font-mono text-[11.5px] tracking-wider text-[var(--text-muted)] truncate">
                · step {b + 1}/{spec.beats.length} · <span className="uppercase font-semibold text-[var(--accent-ink)]">{beat.label}</span>
              </span>
            )}
          </div>
          <div className="flex-1" />
          {isSetup && prerequisites && prerequisites.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-faint)] shrink-0">builds on</span>
              {prerequisites.map((p) => (
                <Link key={p.href} href={p.href} title={`Prerequisite: ${p.name}`}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--line-faint)] px-2 py-0.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors whitespace-nowrap">
                  {p.completed && <span className="text-[var(--accent-ink)]" aria-hidden="true">✓</span>}
                  {p.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        {showNudge && (
          <>
            {/* desktop keeps the full advisory nudge */}
            <div className="hidden xl:block px-3 sm:px-5 py-2 border-b border-[var(--line-faint)]">
              <PrereqNudge prerequisites={prerequisites!} onContinue={() => setPrereqDismissed(true)} />
            </div>
            {/* mobile: one-line dismissible chip so it never eats the first screen */}
            <div className="xl:hidden flex items-center gap-2 px-3 sm:px-5 py-1.5 border-b border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--accent-sky)_7%,transparent)]">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)] shrink-0">builds on</span>
              <span className="text-[11.5px] text-[var(--text-muted)] truncate min-w-0">
                {prerequisites!.filter((p) => !p.completed).map((p) => p.name).join(", ")}
              </span>
              <button onClick={() => setPrereqDismissed(true)} aria-label="dismiss prerequisite note"
                className="ml-auto shrink-0 inline-flex items-center justify-center w-7 h-7 -mr-1 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── THE SCENE ───────────────────────────────────────────────────────
          Desktop: [ hero diagram | flank ]. Mobile: one scroll column. */}
      <div className="flex-1 min-h-0 overflow-y-auto xl:overflow-hidden flex flex-col xl:flex-row gap-4 px-3 sm:px-5 pt-3 pb-2 min-w-0 justify-start xl:justify-center xl:items-center">
        <section className="min-w-0 flex flex-col gap-3 xl:flex-1 xl:min-h-0 xl:justify-center">
          {/* connector lead-in — a quiet italic line above the box */}
          {beat.connector && (
            <AnimatePresence mode="wait">
              <motion.div key={beat.id}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="shrink-0 px-1 text-[12.5px] italic leading-snug text-[var(--text-faint)]">
                {beat.connector}
              </motion.div>
            </AnimatePresence>
          )}
          {/* HERO box (DESKTOP) — aspect-locked so it hugs the diagram, capped +
              vertically centred. Hidden on mobile, which renders its own taller,
              legibly-scaled hero below (the engine's areaRef stays on THIS box). */}
          <div
            ref={boxRef}
            style={{ aspectRatio: `${VW} / ${VH}` }}
            className="relative w-full shrink-0 hidden xl:block xl:max-h-full xl:self-center rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_45%,transparent)] overflow-hidden">
            {/* MAIN caption — consistent title band pinned to the top of the box (desktop) */}
            {mainPanel && (
              <AnimatePresence mode="wait">
                <motion.div key={beat.id}
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 0.65, 0.3, 1] }}
                  className="hidden xl:block absolute top-0 inset-x-0 z-10 px-5 pt-3 pb-2.5 border-b border-[var(--accent-line)] bg-[color-mix(in_oklab,var(--accent-sky)_10%,var(--bg-card))]">
                  {mainPanel.label && <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)]">{mainPanel.label}</div>}
                  <div className="font-semibold text-[15px] leading-snug text-[var(--text)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono">{mainPanel.title ?? mainPanel.body}</div>
                </motion.div>
              </AnimatePresence>
            )}
            {/* the scaled canvas plane in a free pan/zoom viewport (wheel + drag to inspect) */}
            <PanZoom ref={areaRef} className="absolute inset-0" contentWidth={VW * scale} contentHeight={VH * scale} minZoom={1} maxZoom={4}>
              <div style={{ width: VW * scale, height: VH * scale }} className="relative shrink-0">
                <div data-canvas-root className="absolute top-0 left-0"
                  style={{ width: VW, height: VH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <div className="absolute inset-0" style={{ transform: `translateY(${vShift}px)`, transition: shiftWrap }}>
                  <svg ref={svgRef} width={VW} height={VH} className="absolute inset-0 overflow-visible"
                    role="img" aria-label={`${spec.topicTitle} — step ${b + 1}: ${beat.label ?? ""}`}>
                    <ArrowDefs />
                    <AnimatePresence mode="wait">
                      <motion.g key={beat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                        {visualNode}
                      </motion.g>
                    </AnimatePresence>
                  </svg>
                  {/* on-canvas NOTE annotations — desktop only (real spatial notes) */}
                  <AnimatePresence mode="wait">
                    <motion.div key={beat.id} className="absolute inset-0 pointer-events-none hidden xl:block"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.28, ease: [0.22, 0.65, 0.3, 1] }}>
                      {beat.panels.filter((p) => p.variant === "note").map((p, i) => (
                        <div key={i} data-canvas-panel="note"
                          className="absolute rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-[12.5px] leading-snug text-[var(--text-muted)]"
                          style={{ left: p.left, top: p.top, width: p.width }}>
                          {p.body}
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                  </div>
                </div>
              </div>
            </PanZoom>
          </div>

          {/* MOBILE inline stack — the LEGIBLE hero diagram first, then caption +
              (cards OR code) directly below it (no FAB / bottom-sheet). */}
          <div className="xl:hidden flex flex-col gap-3 pb-2">
            {/* MOBILE HERO — full-width, real height (44vh) so the diagram reads
                large. The plane is scaled to fill that height (mScale, biased to
                height) and wrapped in a PanZoom viewport: pinch to zoom, drag to
                pan, so a wide diagram is inspected rather than shrunk to a sliver. */}
            <PanZoom
              ref={mAreaRef}
              className="relative w-full shrink-0 min-h-[44vh] rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_45%,transparent)]"
              contentWidth={VW * mScale} contentHeight={VH * mScale} minZoom={0.5} maxZoom={4} allowPageScrollAtRest>
              <div style={{ width: VW * mScale, height: VH * mScale }} className="relative shrink-0">
                <div data-canvas-root className="absolute top-0 left-0"
                  style={{ width: VW, height: VH, transform: `scale(${mScale})`, transformOrigin: "top left" }}>
                  <div className="absolute inset-0" style={{ transform: `translateY(${mVShift}px)`, transition: shiftWrap }}>
                  <svg ref={mSvgRef} width={VW} height={VH} className="absolute inset-0 overflow-visible"
                    role="img" aria-label={`${spec.topicTitle} — step ${b + 1}: ${beat.label ?? ""}`}>
                    <ArrowDefs />
                    <AnimatePresence mode="wait">
                      <motion.g key={beat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                        {visualNode}
                      </motion.g>
                    </AnimatePresence>
                  </svg>
                  </div>
                </div>
              </div>
            </PanZoom>
            {mainPanel && (
              <div className="rounded-xl border border-[var(--accent-line)] bg-[color-mix(in_oklab,var(--accent-sky)_8%,var(--bg-card))] px-3.5 py-2.5">
                {mainPanel.label && <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)]">{mainPanel.label}</div>}
                <div className="font-semibold text-[14px] leading-snug text-[var(--text)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono">{mainPanel.title ?? mainPanel.body}</div>
              </div>
            )}
            {showCode ? (
              <CodePanel code={PY} activeLines={activeLines} practice={practice} />
            ) : (
              <>
                {beat.detail && <WhyCard label={beat.label} detail={beat.detail} open={showDetail} onToggle={toggleDetail} />}
                <SceneSpine lines={spineLines} current={b} />
              </>
            )}
          </div>
        </section>

        {/* RIGHT FLANK (desktop) — the why? card + spine, OR the code (replacing
            them; the flank widens for code). Top-aligned with the caption band. */}
        <aside ref={asideRef} style={{ paddingTop: railTop }}
          className={`hidden xl:flex shrink-0 flex-col self-stretch min-h-0 transition-[width] duration-200 ${showCode ? "xl:w-[600px]" : "xl:w-[340px]"}`}>
          {showCode ? (
            <CodePanel code={PY} activeLines={activeLines} practice={practice} scrollRef={codeScrollRef} fillHeight />
          ) : (
            <div className="flex flex-col gap-3 min-h-0">
              {beat.detail && <WhyCard label={beat.label} detail={beat.detail} open={showDetail} onToggle={toggleDetail} />}
              <SceneSpine lines={spineLines} current={b} />
            </div>
          )}
        </aside>
      </div>

      {/* ── COMPLETION HAND-OFF ─────────────────────────────────────────────
          Finished the last beat? Don't dead-end — point straight at the next
          module (path order) plus a way back to the full map. */}
      {completed && b === last && (
        <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 px-3 sm:px-5 py-2.5 border-t border-[var(--accent-line)] bg-[var(--accent-soft)]">
          <span className="flex items-center gap-1.5 font-semibold text-[14px] text-[var(--accent-ink)]">
            <span aria-hidden="true">✓</span> Lesson complete
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/learn" className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)]">
              all modules
            </Link>
            <Link
              href={nav?.next?.href ?? "/learn"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-line)] bg-[var(--bg-card)] px-4 py-2 text-[14px] font-semibold text-[var(--accent-ink)] hover:bg-[var(--bg-inset)] transition-colors"
            >
              {nav?.next ? <>Next: {nav.next.name} &rarr;</> : <>Explore the map &rarr;</>}
            </Link>
          </div>
        </div>
      )}

      {/* ── ACTION BAR ──────────────────────────────────────────────────────── */}
      <div className="relative z-30 shrink-0 flex items-center gap-2 sm:gap-4 px-3 sm:px-5 pt-1 pb-3 border-t border-[var(--line)] bg-[var(--bg)]">
        <button onClick={() => setB((x) => Math.max(0, x - 1))} disabled={b === 0}
          className="min-h-[40px] px-3 sm:px-4 rounded-lg border border-[var(--line)] text-[var(--text-muted)] disabled:opacity-40 hover:border-[var(--line-strong)] text-[14px]">← Back</button>

        <nav aria-label="lesson steps" className="hidden sm:block">
          <ol role="list" className="flex items-center gap-2">
            {spec.beats.map((bt, i) => (
              <li key={bt.id}>
                <button onClick={() => setB(i)} aria-current={i === b ? "step" : undefined}
                  aria-label={`step ${i + 1} of ${spec.beats.length}${bt.label ? ": " + bt.label : ""}`}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full">
                  <span className={`block rounded-full transition-all ${i === b ? "w-3 h-3 ring-2 ring-offset-2 ring-offset-[var(--bg)] ring-[var(--accent)]" : "w-2.5 h-2.5"}`}
                    style={{ backgroundColor: i === b ? "var(--accent)" : "var(--line)" }} />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <span className="sm:hidden font-mono text-[11px] text-[var(--text-muted)]">{b + 1}/{spec.beats.length}</span>
        <div className="flex-1" />

        {/* single CODE / HIDE-CODE toggle (same place; highlighted when open) */}
        <button onClick={toggleCode} aria-pressed={showCode}
          title={showCode ? "hide the code" : "show the code (algorithm.py)"} aria-label={showCode ? "hide code" : "show code"}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors ${showCode ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)]" : "border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)]"}`}>
          <span className="font-mono text-[13px]">&lt;/&gt;</span>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">{showCode ? "hide code" : "code"}</span>
        </button>

        {/* Forward CTA. When gated, it's intentionally muted (looks LOCKED, not
            broken) — the prominent cue below the bar carries the real instruction. */}
        <button onClick={goNext} disabled={gated || (b === last && completed)}
          title={gated ? "Try the interaction on the canvas first" : undefined}
          className={`min-h-[40px] px-4 sm:px-5 rounded-lg border font-medium text-[14px] transition-colors ${
            gated
              ? "border-dashed border-[var(--line)] bg-transparent text-[var(--text-faint)]"
              : b === last && completed
                ? "border-[var(--accent-line)] bg-transparent text-[var(--accent-ink)] disabled:opacity-100"
                : "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
          }`}>
          {advanceLabel}
        </button>
      </div>
      {/* Gated cue. On mobile it's a prominent high-contrast banner just under the
          controls (so the locked forward button doesn't read as broken); on
          desktop it stays the quiet inline hint it always was. */}
      {gated && (
        <>
          <div className="xl:hidden shrink-0 mx-3 sm:mx-5 mb-2 flex items-center justify-center gap-2 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-center text-[12.5px] font-medium text-[var(--accent-ink)]">
            <span aria-hidden="true" className="text-[15px] leading-none">↑</span>
            <span>Try it on the canvas above to continue</span>
          </div>
          <div className="hidden xl:block shrink-0 text-center font-mono text-[10px] text-[var(--accent-ink)] pb-1">↑ try it on the canvas to continue</div>
        </>
      )}

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Step ${b + 1} of ${spec.beats.length}${beat.label ? ": " + beat.label : ""}`}
      </div>
    </main>
  );
}

/** The expandable "why?" card. Header row is the single toggle (chevron rotates). */
function WhyCard({ label, detail, open, onToggle }: { label?: string; detail: ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_55%,transparent)] overflow-hidden">
      <button onClick={onToggle} aria-expanded={open} title={open ? "hide the explanation" : "read the deeper why / how"}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--bg-inset)] transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--accent-ink)]"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>
        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-ink)] truncate">{label ?? "why"}</span>
        {!open && <span className="text-[12.5px] text-[var(--text-muted)] truncate shrink-0">— why &amp; how</span>}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`ml-auto shrink-0 text-[var(--text-faint)] transition-transform ${open ? "rotate-90" : ""}`}><path d="M9 6l6 6-6 6" /></svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.65, 0.3, 1] }} className="overflow-hidden border-t border-[var(--line-faint)]">
            <div className="max-h-[42vh] overflow-auto px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text-muted)] space-y-2 [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)] [&_em]:text-[var(--text)] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
              {detail}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Code + practice — shown in the flank (desktop) or inline (mobile), replacing the cards. */
function CodePanel({ code, activeLines, practice, scrollRef, fillHeight }: {
  code: string;
  activeLines: number[];
  practice?: { title: string; href: string; difficulty?: string }[];
  scrollRef?: Ref<HTMLDivElement>;
  fillHeight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className={`flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] overflow-hidden ${fillHeight ? "min-h-0 xl:flex-1" : ""}`}>
        {/* Optional, inviting framing — never obligates a non-coder. */}
        <div className="shrink-0 flex flex-col gap-0.5 px-4 py-2.5 border-b border-[var(--line-faint)]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)]">optional</span>
            <span className="font-mono text-[10px] text-[var(--text-faint)] truncate">algorithm.py</span>
          </div>
          <span className="text-[11.5px] leading-snug text-[var(--text-muted)]">The same idea in a computer&rsquo;s language. The lesson works without it.</span>
        </div>
        <div ref={scrollRef} className={`overflow-auto p-1 ${fillHeight ? "min-h-0" : "max-h-[58vh]"}`}>
          <CodeHighlight code={code} highlightedLines={activeLines} />
        </div>
      </div>
      {practice && practice.length > 0 && (
        <div className="shrink-0 max-h-[34vh] overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-card)]">
          <div className="sticky top-0 flex items-center gap-2 px-4 py-2.5 border-b border-[var(--line-faint)] bg-[var(--bg-card)]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">practice</span>
            <span className="font-mono text-[10px] text-[var(--text-faint)] normal-case">· try these next</span>
          </div>
          <ul className="p-2 flex flex-col gap-1.5">
            {practice.map((p) => (
              <li key={p.href}>
                <Link href={p.href}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-[var(--line-faint)] px-3 py-2 hover:border-[var(--line-strong)] hover:bg-[var(--bg-inset)]">
                  <span className="text-[13px] text-[var(--text)]">{p.title}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {p.difficulty && (
                      <span className="font-mono text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded text-[var(--text-faint)] border border-[var(--line-faint)]">{p.difficulty}</span>
                    )}
                    <span className="text-[var(--text-faint)] group-hover:text-[var(--accent-ink)]">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** The accreting "what we've established" spine. */
function SceneSpine({ lines, current }: { lines: ReactNode[]; current: number }) {
  return (
    <div className="shrink-0 rounded-2xl border border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-card)_40%,transparent)] px-4 py-3">
      <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-faint)] mb-2">what we&rsquo;ve established</div>
      <ol className="flex flex-col gap-1.5">
        {lines.map((line, i) => {
          if (i > current) return null;
          const done = i < current;
          const isCurrent = i === current;
          return (
            <li key={i} className="flex items-start gap-2 text-[12px] leading-snug">
              <span className={`mt-[2px] shrink-0 ${done ? "text-[var(--accent-ink)]" : isCurrent ? "text-[var(--accent)]" : "text-[var(--text-faint)]"}`} aria-hidden="true">
                {done ? "✓" : "•"}
              </span>
              <span className={isCurrent ? "text-[var(--text)] font-medium" : "text-[var(--text-muted)]"}>{typeof line === "string" ? gloss(line) : line}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
