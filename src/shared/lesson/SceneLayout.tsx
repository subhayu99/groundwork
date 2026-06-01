"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CodeHighlight } from "@/shared/code/CodeHighlight";
import { ArrowDefs } from "./canvas";
import { PrereqNudge, type PrereqItem } from "./PrereqNudge";
import { useLessonEngine, type LessonRuntimeProps } from "./LessonRuntime";

/**
 * The "one-scene" immersive layout (opt-in via `spec.layout === "scene"`).
 *
 * Same engine, same primitives — a different ARRANGEMENT. The diagram is the
 * enlarged, left-biased hero inside a confidently-boxed rounded plane; the
 * on-canvas panel is demoted to a short anchored caption; the fuller detail
 * moves to a collapsible right reading rail; an accreting "what we've
 * established" spine grows one line per completed beat in that flank; the top
 * chrome demotes to a slim strip past beat 0; and a Focus Mode melts everything
 * but the diagram + caption + spine + Next. Code stays a reveal-on-demand
 * overlay over the reserved right column, holding the stage stable.
 *
 * Pilot scope: binary-search only. Nothing here touches the classic layout.
 */
export function SceneLayout({
  spec,
  practice,
  nav,
  onComplete,
  initiallyCompleted,
  prerequisites,
}: LessonRuntimeProps) {
  // Scene biases the canvas scale toward width and raises the cap so the diagram
  // dominates its plane (the hero), instead of floating as a postage stamp.
  const e = useLessonEngine(spec, {
    initiallyCompleted,
    onComplete,
    // widthFill > 1: scale the diagram up so its CONTENT fills the box width and
    // the canvas's empty side margins overflow/clip — the diagram reads large
    // (esp. on mobile, where it was a thin strip) rather than floating small.
    scaleClamp: { min: 0.4, max: 2.4, biasWidth: true, widthFill: 1.0 },
  });
  const {
    VW, VH, PY, b, setB, last, beat,
    showCode, toggleCode, showDetail, setShowDetail,
    completed, areaRef, scale, api, gated, activeLines, visualNode,
    codeScrollRef, goNext,
  } = e;

  const [prereqDismissed, setPrereqDismissed] = useState(false);
  const [focus, setFocus] = useState(false);
  // Mobile bottom-sheet detail toggle (separate from the desktop rail's open
  // state so the two viewports don't fight over one boolean).
  const [mobileDetail, setMobileDetail] = useState(false);

  // Mobile detection via the SAME breakpoint the layout uses for its mobile
  // arrangement (Tailwind `xl` = 1280px; below it the rail/captions swap). Done
  // client-side after mount so SSR/hydration stays stable (server renders desktop
  // defaults; this flips on the client where matchMedia exists).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(max-width: 1279px)");
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  // The reading rail defaults open on beat 0 (orientation) and collapsed after —
  // but ONCE THE LEARNER TOGGLES IT, that choice STICKS across every beat (like the
  // code panel's codeTouched). detailTouched latches on the first manual toggle and
  // stops the per-beat auto-steering, so open-on-one-beat = open on all the others.
  const detailTouched = useRef(false);
  useEffect(() => {
    if (detailTouched.current) return;
    setShowDetail(b === 0);
  }, [b, setShowDetail]);

  // Focus Mode default differs by viewport (report §4): DESKTOP is opt-in (manual
  // FOCUS toggle only — never auto-engaged here). MOBILE auto-engages Focus from
  // beat 1 onward (canvas-first), but keeps beat 0 chrome visible for orientation.
  // Steered on each beat change so a manual exit (toggle / Esc / tap) sticks for
  // the current beat and only re-engages when the learner advances.
  useEffect(() => {
    if (!isMobile) return;
    setFocus(b >= 1);
  }, [b, isMobile]);

  // Esc exits Focus Mode (the report's required exit affordance).
  useEffect(() => {
    if (!focus) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") setFocus(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  // Align the rail card's TOP with the TOP of the diagram's caption band. The box
  // is vertically centred, so its top isn't a fixed offset — we measure the box's
  // top relative to the row and pad the (full-height) rail by that amount, so the
  // "why?" header lines up exactly with the visual header. Re-measured on beat
  // change (connector height shifts the box), code toggle, focus, and resize.
  const asideRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [railTop, setRailTop] = useState(0);
  useEffect(() => {
    const measure = () => {
      const aside = asideRef.current, box = boxRef.current;
      if (!aside || !box) return;
      // measured relative to the aside's own top (its border-box top is unaffected
      // by its paddingTop), so applying this as paddingTop lands the card top exactly
      // on the box top — no double-counting of the row's padding.
      setRailTop(Math.max(0, Math.round(box.getBoundingClientRect().top - aside.getBoundingClientRect().top)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (boxRef.current) ro.observe(boxRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [b, showCode, focus]);

  const hasUnmetPrereq = !!prerequisites && prerequisites.some((p) => !p.completed);
  const showNudge = hasUnmetPrereq && !prereqDismissed && !initiallyCompleted && b === 0;
  const isSetup = b === 0;

  // The accreting spine: one short line per beat, derived from takeaway || label.
  // Completed (past) beats are quiet ticks; the current beat is lit.
  const spineLines = spec.beats.map((bt) => bt.takeaway ?? bt.label ?? "");

  // The short on-canvas caption = the panel's title (the one-line "what changed").
  // The panel's paragraph body lives in the rail (beat.detail), so the two never
  // double up. Note-variant panels (e.g. the wedge question) stay as-is.
  const advanceLabel = b === last
    ? (completed ? "Completed ✓" : "Finish ✓")
    : (beat.actionLabel ? `${beat.actionLabel} →` : "Next →");

  return (
    <main className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* ── TOP CHROME ──────────────────────────────────────────────────────
          Beat 0 keeps the orientation moment (compact). From beat 1, and always
          in Focus Mode, it collapses to a slim strip. */}
      <AnimatePresence initial={false}>
        {!focus && (
          <motion.div
            key="chrome"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 0.65, 0.3, 1] }}
            className="shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-2 min-h-[40px] border-b border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-card)_35%,transparent)]">
              {/* back affordance */}
              {nav && (
                <Link href={nav.categoryHref} aria-label={`Back to ${nav.categoryName}`} title={`Back to ${nav.categoryName}`}
                  className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] -ml-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </Link>
              )}
              {/* title + step */}
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
              {/* builds-on demoted to a small chip (only useful at orientation) */}
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
              {/* focus toggle */}
              <button onClick={() => setFocus(true)} title="Focus mode — melt the chrome" aria-label="Enter focus mode"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3" /></svg>
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">focus</span>
              </button>
            </div>

            {/* prereq nudge — one-line strip on beat 0 only */}
            {showNudge && (
              <div className="px-5 py-2 border-b border-[var(--line-faint)]">
                <PrereqNudge prerequisites={prerequisites!} onContinue={() => setPrereqDismissed(true)} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* exit-focus control — a small persistent corner control while focused */}
      {focus && (
        <button onClick={() => setFocus(false)} title="Exit focus mode (Esc)" aria-label="Exit focus mode"
          className="fixed top-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg-card)] px-2.5 py-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors shadow-lg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          <span className="font-mono text-[10px] uppercase tracking-wider">exit focus</span>
        </button>
      )}

      {/* ── THE SCENE ───────────────────────────────────────────────────────
          Read ACROSS: [ hero diagram | reading rail + spine ]. The diagram is the
          left-biased hero; the rail uses the previously-empty flank. */}
      <div className={`flex-1 min-h-0 flex flex-col xl:flex-row gap-4 px-3 sm:px-5 pt-3 pb-2 min-w-0 xl:items-center justify-center transition-[padding] duration-200 ${showCode ? "xl:pr-[660px]" : ""}`}>
        {/* HERO — the bordered, rounded, enlarged diagram plane. Left-biased and
            given the lion's share of the width so it is unmistakably the hero.
            DESKTOP (xl+): the box is sized to the CANVAS ASPECT RATIO
            (spec.canvas, ≈1.83:1) with a max-height, and vertically centered in
            the column — so a wide-but-short diagram hugs its box instead of
            floating in a tall empty frame. MOBILE: the canvas claims a generous
            top band of the viewport (it is the most-visible region, never a thin
            strip), so the diagram renders comfortably large at full mobile width. */}
        <section className="flex-1 min-w-0 flex flex-col gap-2 min-h-0 justify-start xl:justify-center">
          {/* connector lead-in — a quiet italic line ABOVE the box (never overlaps
              the diagram or its on-canvas panels), animates in at the threshold of
              the beat. Lifting it out of the box is what keeps the enlarged panel
              from colliding with it. */}
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
          <div
            ref={boxRef}
            style={{ aspectRatio: `${VW} / ${VH}` }}
            className="relative w-full max-h-full self-center rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_45%,transparent)] overflow-hidden">
            {/* MAIN caption — a CONSISTENT title band pinned to the top of the box
                (desktop). Same position on every beat (the authored per-beat
                left/top were tuned for the classic sticky-note + arrow style and
                made the title jump — e.g. beat 2 sat below the array). As a band it
                is always aligned to the box edges and never moves between beats. */}
            {(() => {
              const main = beat.panels.find((p) => p.variant !== "note");
              if (!main) return null;
              return (
                <AnimatePresence mode="wait">
                  <motion.div key={beat.id}
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 0.65, 0.3, 1] }}
                    className="hidden xl:block absolute top-0 inset-x-0 z-10 px-5 pt-3 pb-2.5 border-b border-[var(--accent-line)] bg-[color-mix(in_oklab,var(--accent-sky)_10%,var(--bg-card))]">
                    {main.label && <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)]">{main.label}</div>}
                    <div className="font-semibold text-[15px] leading-snug text-[var(--text)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono">{main.title ?? main.body}</div>
                  </motion.div>
                </AnimatePresence>
              );
            })()}
            {/* the canvas plane (scaled), centered in its box. Centering keeps the
                widthFill overflow symmetric — only the canvas's empty side margins
                clip, never the live cells — while the reading rail lives in its own
                separate flank column (the aside), not over the plane. */}
            <div ref={areaRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div style={{ width: VW * scale, height: VH * scale }} className="relative shrink-0">
                <div
                  data-canvas-root
                  className="absolute top-0 left-0"
                  style={{ width: VW, height: VH, transform: `scale(${scale})`, transformOrigin: "top left" }}
                >
                  <svg width={VW} height={VH} className="absolute inset-0 overflow-visible"
                    role="img" aria-label={`${spec.topicTitle} — step ${b + 1}: ${beat.label ?? ""}`}>
                    <ArrowDefs />
                    <AnimatePresence mode="wait">
                      <motion.g key={beat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                        {visualNode}
                        {/* caption-anchor arrows are suppressed in scene mode — the
                            caption is now a fixed top band, so an arrow from its old
                            in-plane position would dangle. State reads via the
                            cell labels/colours instead. */}
                      </motion.g>
                    </AnimatePresence>
                  </svg>

                  {/* on-canvas NOTE annotations — DESKTOP only. Real spatial notes
                      (e.g. the wedge question) keep their authored position + body.
                      The MAIN caption is the consistent top band above, not here, so
                      the title no longer jumps between beats. */}
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
          </div>

          {/* MOBILE caption — beneath the diagram (never over the cells). Carries
              the short takeaway; depth is a tap away in the bottom sheet. */}
          <div className="xl:hidden shrink-0">
            <AnimatePresence mode="wait">
              <motion.div key={beat.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-[var(--accent-line)] bg-[color-mix(in_oklab,var(--accent-sky)_8%,var(--bg-card))] px-3.5 py-2.5">
                {beat.panels.filter((p) => p.variant !== "note").slice(0, 1).map((p, i) => (
                  <div key={i}>
                    {p.label && <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)]">{p.label}</div>}
                    <div className="font-semibold text-[14px] leading-snug text-[var(--text)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono">{p.title ?? p.body}</div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* RIGHT FLANK — reading rail + accreting spine, grouped as one calm,
            top-aligned block: the "why?" toggle/detail first, then the
            established-spine directly beneath it (no pinned-to-bottom gap).
            Hidden in Focus Mode except the spine; hidden on mobile (bottom sheet). */}
        {/* The flank fills the column height; railTop (measured) pads it so the
            "why?" header's TOP aligns with the TOP of the diagram's caption band.
            The header stays pinned there and the card body expands DOWNWARD
            (capped + scrollable), so it never moves on toggle. Card + spine
            grouped. Kept in Focus Mode (Focus melts the top chrome, not the card);
            hidden when code is open / on mobile. */}
        <aside ref={asideRef} style={{ paddingTop: railTop }} className={`w-[330px] shrink-0 flex-col self-stretch min-h-0 ${showCode ? "hidden" : "hidden xl:flex"}`}>
          <div className="shrink-0 flex flex-col gap-3 min-h-0">
            {/* the reading rail — the HEADER ROW is the single toggle (same spot to
                expand AND collapse; chevron rotates; body opens in place below). */}
            {beat.detail && (
              <div className="rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_55%,transparent)] overflow-hidden">
                <button onClick={() => { detailTouched.current = true; setShowDetail((v) => !v); }} aria-expanded={showDetail}
                  title={showDetail ? "hide the explanation" : "read the deeper why / how"}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--bg-inset)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--accent-ink)]"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-ink)] truncate">{beat.label ?? "why"}</span>
                  {!showDetail && <span className="text-[12.5px] text-[var(--text-muted)] truncate shrink-0">— why &amp; how</span>}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`ml-auto shrink-0 text-[var(--text-faint)] transition-transform ${showDetail ? "rotate-90" : ""}`}><path d="M9 6l6 6-6 6" /></svg>
                </button>
                <AnimatePresence initial={false}>
                  {showDetail && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 0.65, 0.3, 1] }}
                      className="overflow-hidden border-t border-[var(--line-faint)]">
                      <div className="max-h-[32vh] overflow-auto px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text-muted)] space-y-2 [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)] [&_em]:text-[var(--text)] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                        {beat.detail}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* the accreting spine — "what we've established so far", grouped
                directly beneath the why? card. */}
            <SceneSpine lines={spineLines} current={b} />
          </div>
        </aside>
      </div>

      {/* ── CODE OVERLAY ────────────────────────────────────────────────────
          Reveal-on-demand. Slides over the reserved right region without
          rebuilding the stage (the diagram keeps its scale/position). Auto-opens
          on the recap beat via the engine. */}
      <AnimatePresence>
        {showCode && (
          <>
            {/* Scrim restricted to the reserved right drawer/gutter region only —
                the diagram on the left stays FULLY LIT (no full-viewport backdrop).
                On mobile the drawer is full-width, so its scrim spans the width too,
                but the diagram sits above it (upper viewport) and reads clearly.
                The faint click-catcher to its left only closes the drawer; it does
                not dim the canvas. */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="fixed inset-0 z-20 sm:right-[560px] xl:right-[620px] bg-transparent" onClick={toggleCode} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.24, ease: [0.22, 0.65, 0.3, 1] }}
              className="fixed top-0 right-0 z-20 h-full w-full sm:w-[560px] xl:w-[620px] flex flex-col gap-3 p-3 sm:p-4 bg-[color-mix(in_oklab,var(--bg)_55%,transparent)] sm:bg-black/30"
              role="dialog" aria-label="algorithm.py"
            >
              <div className="flex flex-col max-h-[62vh] rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] shadow-2xl shadow-black/40 overflow-hidden">
                <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--line-faint)]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">algorithm.py</span>
                    <span className="font-mono text-[10px] text-[var(--accent-ink)] truncate">▶ line follows the beat</span>
                  </div>
                  {/* no close button here — the single CODE/HIDE-CODE toggle lives
                      in the control bar (same place to open and close). */}
                </div>
                <div ref={codeScrollRef} className="min-h-0 overflow-auto p-1">
                  <CodeHighlight code={PY} highlightedLines={activeLines} />
                </div>
              </div>
              {practice && practice.length > 0 && (
                <div className="max-h-[32vh] overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] shadow-2xl shadow-black/40">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MOBILE detail bottom sheet ──────────────────────────────────────── */}
      <AnimatePresence>
        {mobileDetail && beat.detail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="xl:hidden fixed inset-0 z-20 bg-black/30" onClick={() => setMobileDetail(false)} aria-hidden="true" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.26, ease: [0.22, 0.65, 0.3, 1] }}
              className="xl:hidden fixed bottom-0 inset-x-0 z-20 max-h-[70vh] flex flex-col rounded-t-2xl border-t border-[var(--line)] bg-[var(--bg-card)] shadow-2xl shadow-black/40"
              role="dialog" aria-label="explanation">
              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--line-faint)]">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)]">{beat.label ?? "why"}</span>
                <button onClick={() => setMobileDetail(false)} aria-label="close explanation"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="min-h-0 overflow-auto px-4 py-3 text-[14px] leading-relaxed text-[var(--text-muted)] space-y-2 [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)] [&_em]:text-[var(--text)] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                {beat.detail}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ACTION BAR ──────────────────────────────────────────────────────
          One bar: Back · stepper · (why/code on mobile) · big Next. On mobile the
          forward action is the unmistakable primary; code + why are secondary. */}
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

        {/* mobile-only step readout (the dots are desktop) */}
        <span className="sm:hidden font-mono text-[11px] text-[var(--text-muted)]">{b + 1}/{spec.beats.length}</span>

        <div className="flex-1" />

        {/* code affordance — a SINGLE toggle that stays in the SAME place whether
            the drawer is open or closed (label flips code → hide code; highlighted
            while open). This is the only show/hide control — no separate close
            button inside the drawer. */}
        <button onClick={toggleCode} aria-pressed={showCode}
          title={showCode ? "hide the code" : "show the code (algorithm.py)"} aria-label={showCode ? "hide code" : "show code"}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors ${showCode ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)]" : "border-[var(--line)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)]"}`}>
          <span className="font-mono text-[13px]">&lt;/&gt;</span>
          <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">{showCode ? "hide code" : "code"}</span>
        </button>

        {/* mobile-only "why?" — opens the bottom sheet */}
        {beat.detail && (
          <button onClick={() => setMobileDetail(true)} title="the deeper why / how" aria-label="why"
            className="xl:hidden inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg border border-[var(--line)] text-[var(--accent-ink)] hover:border-[var(--line-strong)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>
          </button>
        )}

        <button onClick={goNext} disabled={gated}
          title={gated ? "Try the interaction on the canvas first" : undefined}
          className="min-h-[40px] px-4 sm:px-5 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] font-medium disabled:opacity-40 text-[14px]">
          {advanceLabel}
        </button>
      </div>
      {gated && <div className="shrink-0 text-center font-mono text-[10px] text-[var(--accent-ink)] pb-1">↑ try it on the canvas to continue</div>}

      {/* live region — announces the active step to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Step ${b + 1} of ${spec.beats.length}${beat.label ? ": " + beat.label : ""}`}
      </div>
    </main>
  );
}

/**
 * The accreting "what we've established" spine. One short line per beat; past
 * beats are quiet ticks, the current beat is lit, future beats are dimmed. It
 * persists and grows across beats — the visible spine of the derivation.
 */
function SceneSpine({ lines, current }: { lines: string[]; current: number }) {
  return (
    <div className="shrink-0 rounded-2xl border border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-card)_40%,transparent)] px-4 py-3">
      <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-faint)] mb-2">what we&rsquo;ve established</div>
      <ol className="flex flex-col gap-1.5">
        {lines.map((line, i) => {
          const done = i < current;
          const isCurrent = i === current;
          // Quietly reveal only up to (and including) the current beat — future
          // lines stay hidden so the spine ACCRETES rather than spoiling ahead.
          if (i > current) return null;
          return (
            <li key={i} className="flex items-start gap-2 text-[12px] leading-snug">
              <span className={`mt-[2px] shrink-0 ${done ? "text-[var(--accent-ink)]" : isCurrent ? "text-[var(--accent)]" : "text-[var(--text-faint)]"}`} aria-hidden="true">
                {done ? "✓" : "•"}
              </span>
              <span className={isCurrent ? "text-[var(--text)] font-medium" : "text-[var(--text-muted)]"}>
                {line}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
