"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CodeHighlight } from "@/shared/code/CodeHighlight";
import { ArrowDefs, Arrow } from "./canvas";
import { PrereqNudge, type PrereqItem } from "./PrereqNudge";
import { useLessonEngine, type LessonRuntimeProps } from "./LessonRuntime";
import { gloss } from "./gloss";
import { PanZoom } from "./PanZoom";
import { useAudience } from "@/shared/audience/useAudience";

/**
 * The "focus" layout (opt-in via `spec.layout === "focus"`).
 *
 * One focal column, low cognitive load: a centered hero diagram + ONE caption
 * (the beat's idea + one supporting line). The deeper "why" (the `detail`), the
 * code, and the accreting recap are revealed ON DEMAND in a panel that opens
 * IN PLACE BELOW the caption — it never covers the always-pinned Back/Next bar,
 * and you can advance with it open. Nothing is forked: it consumes the SAME
 * engine, the SAME visual/arrows/notes + framer-motion choreography, the SAME
 * vShift centering and the SAME wedge gating as the scene/classic layouts —
 * so animations, depth, and interactions are preserved, only the arrangement
 * changes. On a phone, the diagram is shape-aware: a `diagramShape: "line"`
 * topic fits the WHOLE line to width (it never wraps); a "box" topic scales to
 * fit the box, as today.
 *
 * NOTE (Phase 3): CodePanel / Spine / the centering measurement are duplicated
 * with SceneLayout for now to keep the live scene layout byte-untouched during
 * the pilot. The thorough rollout extracts them into a shared lessonParts module.
 */
export function FocusLayout({
  spec,
  practice,
  nav,
  onComplete,
  initiallyCompleted,
  prerequisites,
}: LessonRuntimeProps) {
  const e = useLessonEngine(spec, {
    initiallyCompleted,
    onComplete,
    scaleClamp: { min: 0.4, max: 2.4, biasWidth: true, widthFill: 1.0 },
  });
  const {
    VW, VH, PY, b, setB, last, beat, beats,
    bridge, resources, interviewAngle,
    completed, areaRef, scale, gated, activeLines, visualNode,
    codeScrollRef, goNext,
  } = e;

  const shape = spec.diagramShape ?? "box";
  const cueId = useId();
  const [prereqDismissed, setPrereqDismissed] = useState(false);

  // OPEN PANEL — the on-demand surface below the caption. null = nothing open
  // (calm default). Changing beats closes it. It lives INSIDE the scrollable
  // stage, so it can never sit over the pinned Back/Next bar.
  type Panel = "why" | "code" | "recap";
  const [openPanel, setOpenPanel] = useState<Panel | null>(null);
  const closePanel = () => setOpenPanel(null);
  const togglePanel = (p: Panel) => setOpenPanel((cur) => (cur === p ? null : p));

  const mainPanel = beat.panels.find((p) => p.variant !== "note");
  const noteePanels = beat.panels.filter((p) => p.variant === "note");

  // ── DESKTOP centering: same measurement as the scene layout, but the caption
  // lives BELOW the box (not pinned inside it), so the content centres in the
  // FULL box with only a small top cap. ──────────────────────────────────────
  const svgRef = useRef<SVGSVGElement>(null);
  const mSvgRef = useRef<SVGSVGElement>(null);
  const [vShift, setVShift] = useState(0);
  const [mVShift, setMVShift] = useState(0);
  useEffect(() => {
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
      root.querySelectorAll("svg rect, svg circle, svg path, svg line, svg text, svg polygon, svg polyline, svg ellipse, [data-canvas-panel]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 && r.height < 1) return;
        if (r.width >= rb.width * 0.95 && r.height >= rb.height * 0.92) return;
        const t = (r.top - rb.top) / sc - cur, b2 = (r.bottom - rb.top) / sc - cur;
        if (!isFinite(t) || !isFinite(b2)) return;
        top = Math.min(top, t); bot = Math.max(bot, b2);
      });
      return isFinite(top) ? { top, h: bot - top } : null;
    };
    const shiftFor = (svgEl: SVGSVGElement | null, cap: number) => {
      const ex = extent(svgEl);
      if (!ex) return null;
      const top = Math.max(cap, cap + (VH - cap - ex.h) / 2);
      return Math.round(top - ex.top);
    };
    const compute = () => {
      const d = shiftFor(svgRef.current, 20);   // focus: no in-box caption band → small cap
      if (d != null) setVShift(d);
      const m = shiftFor(mSvgRef.current, 12);
      if (m != null) setMVShift(m);
    };
    compute();
    const ts = [120, 320, 540].map((d) => setTimeout(compute, d));
    window.addEventListener("resize", compute);
    return () => { ts.forEach(clearTimeout); window.removeEventListener("resize", compute); };
  }, [b, beat.id, VW, VH, openPanel]);
  const shiftWrap = "transform .32s cubic-bezier(.22,.65,.3,1)";

  // ── MOBILE diagram scale — SHAPE-AWARE. A "line" fits the WHOLE width (so the
  // straight line never wraps and you watch it halve); a "box" fills the box
  // (height-biased), as the scene layout does. ───────────────────────────────
  const mAreaRef = useRef<HTMLDivElement>(null);
  const [mScale, setMScale] = useState(1);
  useEffect(() => {
    const el = mAreaRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (h <= 0) return;
      const byHeight = h / VH;
      const byWidth = w > 0 ? w / VW : byHeight;
      const next = shape === "line"
        ? Math.max(0.3, Math.min(byWidth, 1.6))            // whole line fits the width
        : Math.max(0.5, Math.min(Math.max(byHeight, byWidth), 1.6));
      setMScale(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [VW, VH, b, shape]);

  // keep the active code line in view while the code panel is open
  const activeKey = activeLines.join(",");
  useEffect(() => {
    if (openPanel !== "code") return;
    const el = codeScrollRef.current?.querySelector("[data-active-line]");
    el?.scrollIntoView({ block: "nearest" });
  }, [activeKey, openPanel, codeScrollRef]);

  const { profile } = useAudience();
  const isInterviewGoal = profile?.goal === "interview";
  const practiceListHref =
    practice && practice.length > 0 ? practice[0].href.replace(/\/[^/]+\/?$/, "") : null;

  const hasUnmetPrereq = !!prerequisites && prerequisites.some((p) => !p.completed);
  const showNudge = hasUnmetPrereq && !prereqDismissed && !initiallyCompleted && b === 0;
  const spineLines = beats.map((bt) => bt.takeaway ?? bt.label ?? "");
  const topicName = spec.topicTitle.split("·")[0].trim() || spec.topicTitle;
  const finalTakeaway = beats[last]?.takeaway ?? beats[last]?.label ?? null;
  const advanceLabel = b === last
    ? (completed ? "Completed ✓" : "Finish ✓")
    : (beat.actionLabel ? `${beat.actionLabel} →` : "Next →");

  function go(delta: number) {
    const nb = Math.max(0, Math.min(last, b + delta));
    if (nb !== b) { closePanel(); setB(nb); }
  }

  // KEYBOARD: ← / → walk the beats (forward respects the wedge gate). Tab + Enter
  // already activate buttons/links natively. (Broader keyboard control of the
  // on-canvas interactions is a separate later pass.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(input|textarea|select)$/i.test(t.tagName)) return;
      if (e.key === "ArrowRight") { if (!gated && !(b === last && completed)) { e.preventDefault(); goNext(); } }
      else if (e.key === "ArrowLeft") { if (b > 0) { e.preventDefault(); go(-1); } }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [b, last, gated, completed]); // eslint-disable-line react-hooks/exhaustive-deps

  // The diagram plane (svg + arrows + on-canvas note panels), shared by the
  // desktop and mobile boxes. `sref` is the svg ref used for centring.
  const plane = (sref: Ref<SVGSVGElement>, sc: number, shift: number, withNotes: boolean) => (
    <div style={{ width: VW * sc, height: VH * sc }} className="relative shrink-0">
      <div data-canvas-root className="absolute top-0 left-0"
        style={{ width: VW, height: VH, transform: `scale(${sc})`, transformOrigin: "top left" }}>
        <div className="absolute inset-0" style={{ transform: `translateY(${shift}px)`, transition: shiftWrap }}>
          <svg ref={sref} width={VW} height={VH} className="absolute inset-0 overflow-visible"
            role="img" aria-label={`${spec.topicTitle} — step ${b + 1}: ${beat.label ?? ""}`}>
            <ArrowDefs />
            <AnimatePresence mode="wait">
              <motion.g key={beat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                {visualNode}
                {beat.arrows?.map((a, i) => <Arrow key={i} {...a} />)}
              </motion.g>
            </AnimatePresence>
          </svg>
          {withNotes && noteePanels.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div key={beat.id} className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28, ease: [0.22, 0.65, 0.3, 1] }}>
                {noteePanels.map((p, i) => (
                  <div key={i} data-canvas-panel="note"
                    className="absolute rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-[12.5px] leading-snug text-[var(--text-muted)]"
                    style={{ left: p.left, top: p.top, width: p.width }}>
                    {p.body}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <main className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* ── TOP CHROME (minimal) ─────────────────────────────────────────── */}
      <div className="shrink-0">
        <div className="flex items-center gap-3 px-3 sm:px-5 py-2 min-h-[40px] border-b border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-card)_35%,transparent)]">
          {nav && (
            <Link href={nav.categoryHref} aria-label={`Back to ${nav.categoryName}`} title={`Back to ${nav.categoryName}`}
              className="inline-flex items-center justify-center min-w-[36px] min-h-[36px] -ml-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </Link>
          )}
          <Link href="/learn" aria-label="Back to the learning map" title="The learning map — all modules"
            className="inline-flex items-center gap-1 min-h-[36px] -ml-1 pl-1 pr-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13" /></svg>
            <span className="font-mono text-[10px] uppercase tracking-wider">map</span>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block w-2.5 h-2.5 rotate-45 bg-[var(--accent-sky)] shrink-0" />
            <span className="font-mono text-[12.5px] uppercase tracking-[0.16em] text-[var(--text)] truncate">{spec.topicTitle}</span>
            {spec.principle && (
              <Link href={`/principles/${spec.principle.key}`}
                title={`One of the ${spec.principle.total} core ideas — read the principle`}
                className="hidden sm:inline-flex items-center shrink-0 rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)] whitespace-nowrap hover:bg-[var(--bg-inset)] transition-colors">
                idea {spec.principle.n} of {spec.principle.total}
              </Link>
            )}
            {beat.label && (
              <span className="hidden sm:inline font-mono text-[11.5px] tracking-wider text-[var(--text-muted)] truncate">
                · step {b + 1}/{beats.length} · <span className="uppercase font-semibold text-[var(--accent-ink)]">{beat.label}</span>
              </span>
            )}
          </div>
        </div>
        {showNudge && (
          <div className="flex items-center gap-2 px-3 sm:px-5 py-1.5 border-b border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--accent-sky)_7%,transparent)]">
            <span className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)] shrink-0">builds on</span>
            <span className="text-[11.5px] text-[var(--text-muted)] truncate min-w-0">
              {prerequisites!.filter((p) => !p.completed).map((p) => p.name).join(", ")}
            </span>
            <button onClick={() => setPrereqDismissed(true)} aria-label="dismiss prerequisite note"
              className="ml-auto shrink-0 inline-flex items-center justify-center w-9 h-9 -mr-1.5 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
      </div>

      {/* ── BODY: a width-capped reading column flanked by full-height TAP ZONES.
          Click the LEFT margin → previous beat, the RIGHT margin → next (also the
          ← / → arrow keys). The column never sprawls across a wide screen, and the
          lower area stays uncluttered — navigation lives on the sides. ────────── */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* LEFT tap zone (lg+) — previous */}
        <button type="button" onClick={() => go(-1)} disabled={b === 0} aria-label="Previous step"
          className="hidden lg:flex absolute inset-y-0 left-0 right-[calc(50%_+_380px)] z-20 items-center justify-center group disabled:opacity-20 disabled:cursor-default cursor-pointer">
          <span className="flex flex-col items-center gap-1.5 text-[var(--text-faint)] transition-colors group-hover:text-[var(--text)]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em]">back</span>
          </span>
        </button>
        {/* RIGHT tap zone (lg+) — next (gated → no advance) */}
        <button type="button" onClick={() => { if (gated || (b === last && completed)) return; goNext(); }}
          aria-disabled={gated || (b === last && completed)} aria-describedby={gated ? cueId : undefined}
          aria-label={gated ? "Locked — try the diagram first" : "Next step"}
          className={`hidden lg:flex absolute inset-y-0 right-0 left-[calc(50%_+_380px)] z-20 items-center justify-center group cursor-pointer ${b === last && completed ? "opacity-30 cursor-default" : ""}`}>
          <span className={`flex flex-col items-center gap-1.5 transition-colors ${gated ? "text-[var(--text-faint)]" : "text-[var(--accent-ink)] group-hover:text-[var(--text)]"}`}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={gated ? "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v9H5z" : "M9 18l6-6-6-6"} /></svg>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] max-w-[140px] text-center truncate">{gated ? "locked" : b === last ? (completed ? "done" : "finish") : (beat.actionLabel ?? "next")}</span>
          </span>
        </button>

        {/* CENTER COLUMN — width-capped, centred */}
        <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-6 lg:px-0 py-2.5">
          <div className="w-full max-w-[720px] mx-auto flex-1 min-h-0 flex flex-col">
            <div className={`flex flex-col items-center min-h-0 overflow-y-auto ${openPanel ? "shrink-0" : "flex-1 justify-center"}`}>
              {/* bridge — beat 0 orientation; yields to the prereq nudge */}
              {bridge && b === 0 && !showNudge && (
                <div className="shrink-0 mb-3 max-w-[560px] px-1 text-center text-[12.5px] italic leading-snug text-[var(--text-faint)]">
                  <span className="not-italic font-mono text-[9.5px] uppercase tracking-wider">standing on · </span>{bridge}
                </div>
              )}

              {/* DESKTOP hero box — aspect-locked; smaller when a panel is open */}
              <div
                style={{ aspectRatio: `${VW} / ${VH}` }}
                className={`relative w-full shrink-0 hidden lg:block self-center rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_45%,transparent)] overflow-hidden transition-[max-height] duration-200 ${openPanel ? "lg:max-h-[26vh]" : "lg:max-h-[46vh]"}`}>
                <PanZoom ref={areaRef} className="absolute inset-0" contentWidth={VW * scale} contentHeight={VH * scale} minZoom={1} maxZoom={4} resetKey={beat.id}>
                  {plane(svgRef, scale, vShift, true)}
                </PanZoom>
              </div>

              {/* MOBILE hero box — shape-aware; smaller when a panel is open */}
              <PanZoom
                ref={mAreaRef}
                className={`lg:hidden relative w-full shrink-0 rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_45%,transparent)] ${openPanel ? "min-h-[18vh] max-h-[22vh]" : (shape === "line" ? "min-h-[24vh]" : "min-h-[40vh]")}`}
                contentWidth={VW * mScale} contentHeight={VH * mScale} minZoom={shape === "line" ? 1 : 0.5} maxZoom={4} allowPageScrollAtRest resetKey={beat.id}>
                {plane(mSvgRef, mScale, mVShift, false)}
              </PanZoom>

              {/* CAPTION — readable. Body clamps when a panel is open. */}
              {mainPanel && (
                <AnimatePresence mode="wait">
                  <motion.div key={beat.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 0.65, 0.3, 1] }}
                    className="shrink-0 mt-4 text-center max-w-[600px]">
                    {mainPanel.label && <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)] mb-1.5">{mainPanel.label}</div>}
                    <div className="font-semibold text-[21px] leading-snug text-[var(--text)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono">{mainPanel.title ?? mainPanel.body}</div>
                    {mainPanel.title != null && mainPanel.body != null && (
                      <div className={`mt-2 text-[14.5px] leading-relaxed text-[var(--text-muted)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)] [&_em]:text-[var(--text)] ${openPanel ? "line-clamp-2" : ""}`}>{mainPanel.body}</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* AFFORDANCE ROW — quiet, opt-in. why? · code · recap. */}
              <div className="shrink-0 mt-4 flex items-center justify-center flex-wrap gap-x-0.5">
                {beat.detail && (
                  <button onClick={() => togglePanel("why")} className={`font-mono text-[10.5px] uppercase tracking-[0.14em] px-2.5 py-1.5 transition-colors ${openPanel === "why" ? "text-[var(--accent-ink)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"}`}>why?</button>
                )}
                {beat.detail && <span className="text-[var(--line-strong)] text-[10px] select-none">·</span>}
                <button onClick={() => togglePanel("code")} className={`font-mono text-[10.5px] uppercase tracking-[0.14em] px-2.5 py-1.5 transition-colors ${openPanel === "code" ? "text-[var(--accent-ink)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"}`}>code</button>
                <span className="text-[var(--line-strong)] text-[10px] select-none">·</span>
                <button onClick={() => togglePanel("recap")} className={`font-mono text-[10.5px] uppercase tracking-[0.14em] px-2.5 py-1.5 transition-colors ${openPanel === "recap" ? "text-[var(--accent-ink)]" : "text-[var(--text-faint)] hover:text-[var(--text-muted)]"}`}>recap</button>
              </div>

              {/* PROGRESS DOTS — tappable; steps live here now so the bottom stays clear. */}
              <div className="shrink-0 mt-3 flex items-center justify-center gap-2">
                {beats.map((bt, i) => (
                  <button key={bt.id} onClick={() => { if (gated && i > b) return; closePanel(); setB(i); }} disabled={gated && i > b}
                    aria-current={i === b ? "step" : undefined} aria-label={`step ${i + 1} of ${beats.length}${bt.label ? ": " + bt.label : ""}`}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className={`block rounded-full transition-all ${i === b ? "w-2.5 h-2.5 ring-2 ring-offset-2 ring-offset-[var(--bg)] ring-[var(--accent)]" : "w-2 h-2"}`} style={{ backgroundColor: i === b ? "var(--accent)" : "var(--line)" }} />
                  </button>
                ))}
              </div>

              {gated && <div className="shrink-0 mt-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)]">↑ try it on the diagram to continue</div>}
            </div>

            {/* IN-FLOW PANEL — FILLS the remaining space below the top zone; its body
                scrolls INTERNALLY, so it can never run under the bar, at any height. */}
            {openPanel && (
              <div className="flex-1 min-h-0 w-full mt-3 flex flex-col overflow-hidden text-left rounded-2xl border border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-card)_55%,transparent)]">
                <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-[var(--line-faint)]">
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)]">
                    {openPanel === "why" ? (beat.label ?? "why") : openPanel === "code" ? "the code so far" : "what we've established"}
                  </span>
                  <button onClick={closePanel} aria-label="close" className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <div ref={openPanel === "code" ? codeScrollRef : undefined} className="flex-1 min-h-0 overflow-auto">
                  {openPanel === "why" && beat.detail && (
                    <div className="px-4 py-3 text-[13.5px] leading-relaxed text-[var(--text-muted)] space-y-2 [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)] [&_em]:text-[var(--text)] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                      {beat.connector && <p className="italic text-[var(--text-faint)] !mb-1">{beat.connector}</p>}
                      {beat.detail}
                    </div>
                  )}
                  {openPanel === "code" && <FocusCode code={PY} activeLines={activeLines} practice={practice} />}
                  {openPanel === "recap" && <FocusSpine lines={spineLines} current={b} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── COMPLETION CEREMONY (final beat) ─────────────────────────────── */}
      {completed && b === last && (
        <div className="shrink-0 px-3 sm:px-5 py-3 border-t border-[var(--accent-line)] bg-[var(--accent-soft)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="flex items-center gap-2 font-semibold text-[15px] text-[var(--accent-ink)]">
              <span aria-hidden="true" className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-[var(--accent-line)] bg-[var(--bg-card)] text-[13px]">✓</span>
              <span className="capitalize">{topicName}</span> derived
            </span>
            {spec.principle && (
              <Link href={`/principles/${spec.principle.key}`} title={`One of the ${spec.principle.total} core ideas — read the principle`}
                className="inline-flex items-center shrink-0 rounded-full border border-[var(--accent-line)] bg-[var(--bg-card)] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)] whitespace-nowrap hover:bg-[var(--bg-inset)] transition-colors">
                idea {spec.principle.n} of {spec.principle.total}
              </Link>
            )}
          </div>
          {finalTakeaway && (
            <p className="mt-1.5 text-[13px] leading-snug text-[var(--text-muted)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)]">
              {typeof finalTakeaway === "string" ? gloss(finalTakeaway) : finalTakeaway}
            </p>
          )}
          {resources.length > 0 && (
            <div className="mt-2.5">
              <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--text-faint)] mb-1">go deeper</div>
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {resources.map((r) => (
                  <li key={r.title} className="text-[12.5px] leading-snug min-w-0">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--accent-ink)] hover:underline">
                        <span className="font-mono text-[9.5px] uppercase text-[var(--text-faint)] mr-1.5">{r.type}</span>{r.title} <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span className="text-[var(--text-muted)]"><span className="font-mono text-[9.5px] uppercase text-[var(--text-faint)] mr-1.5">{r.type}</span>{r.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isInterviewGoal && interviewAngle && (
            <div className="mt-3 rounded-lg border border-[var(--accent-line)] bg-[var(--bg-card)] px-3 py-2.5">
              <div className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--accent-ink)] mb-1.5">in an interview</div>
              <p className="text-[12.5px] leading-snug text-[var(--text)]"><span className="font-semibold text-[var(--accent-ink)]">Asked as: </span>{interviewAngle.askedAs}</p>
              <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--text-muted)]"><span className="font-semibold text-[var(--text)]">The tell: </span>{interviewAngle.tip}</p>
              {interviewAngle.companies && interviewAngle.companies.length > 0 && (
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">e.g. {interviewAngle.companies.join(" · ")}</p>
              )}
            </div>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <Link href="/learn" className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)]">the map</Link>
            {practiceListHref && (
              <Link href={practiceListHref} className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-ink)] hover:text-[var(--text)]">practice this topic</Link>
            )}
            <Link href={nav?.next?.href ?? "/learn"} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-line)] bg-[var(--bg-card)] px-4 py-2 text-[14px] font-semibold text-[var(--accent-ink)] hover:bg-[var(--bg-inset)] transition-colors">
              {nav?.next ? <>Next: {nav.next.name} &rarr;</> : <>Explore the map &rarr;</>}
            </Link>
          </div>
        </div>
      )}

      {/* ── BOTTOM BAR — mobile/tablet only; on lg+ the side tap zones navigate. */}
      <div className="lg:hidden relative z-30 shrink-0 flex items-center gap-3 px-3 sm:px-5 pt-1.5 pb-3 border-t border-[var(--line)] bg-[var(--bg)]">
        <button onClick={() => go(-1)} disabled={b === 0} aria-label="Go to previous step"
          className="min-h-[42px] px-4 rounded-lg border border-[var(--line)] text-[var(--text-muted)] disabled:opacity-40 text-[14px]">← Back</button>
        <span className="mx-auto font-mono text-[11px] text-[var(--text-muted)] truncate px-2">{b + 1} / {beats.length}</span>
        <button onClick={() => { if (gated || (b === last && completed)) return; goNext(); }}
          aria-disabled={gated || (b === last && completed)} disabled={b === last && completed}
          aria-describedby={gated ? cueId : undefined}
          className={`min-h-[42px] px-5 rounded-lg border font-medium text-[14px] transition-colors ${
            gated
              ? "border-dashed border-[var(--line)] bg-transparent text-[var(--text-faint)]"
              : b === last && completed
                ? "border-[var(--accent-line)] bg-transparent text-[var(--accent-ink)] disabled:opacity-100"
                : "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
          }`}>
          {advanceLabel}
        </button>
      </div>
      <span id={cueId} className="sr-only">Try the interaction on the diagram to continue.</span>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Step ${b + 1} of ${beats.length}${beat.label ? ": " + beat.label : ""}${gated ? ". Interaction required: try it on the canvas to continue." : ""}`}
      </div>
    </main>
  );
}

/** Code + practice for the focus in-flow panel. (Phase 3: share with scene.) */
function FocusCode({ code, activeLines, practice }: {
  code: string;
  activeLines: number[];
  practice?: { title: string; href: string; difficulty?: string }[];
}) {
  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="flex items-center gap-2 px-2 pt-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)]">optional</span>
        <span className="font-mono text-[10px] text-[var(--text-faint)] truncate">algorithm.py · the lesson works without it</span>
      </div>
      <CodeHighlight code={code} highlightedLines={activeLines} />
      {practice && practice.length > 0 && (
        <div className="rounded-xl border border-[var(--line-faint)]">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--line-faint)]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">practice</span>
            <span className="font-mono text-[10px] text-[var(--text-faint)] normal-case">· try these next</span>
          </div>
          <ul className="p-2 flex flex-col gap-1.5">
            {practice.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="group flex items-center justify-between gap-3 rounded-lg border border-[var(--line-faint)] px-3 py-2 hover:border-[var(--line-strong)] hover:bg-[var(--bg-inset)]">
                  <span className="text-[13px] text-[var(--text)]">{p.title}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {p.difficulty && <span className="font-mono text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded text-[var(--text-faint)] border border-[var(--line-faint)]">{p.difficulty}</span>}
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

/** The accreting "what we've established" recap. (Phase 3: share with scene.) */
function FocusSpine({ lines, current }: { lines: ReactNode[]; current: number }) {
  return (
    <ol className="flex flex-col gap-1.5 px-4 py-3.5">
      {lines.map((line, i) => {
        if (i > current) return null;
        const done = i < current;
        const isCurrent = i === current;
        return (
          <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
            <span className={`mt-[2px] shrink-0 ${done ? "text-[var(--accent-ink)]" : isCurrent ? "text-[var(--accent)]" : "text-[var(--text-faint)]"}`} aria-hidden="true">{done ? "✓" : "•"}</span>
            <span className={isCurrent ? "text-[var(--text)] font-medium" : "text-[var(--text-muted)]"}>{typeof line === "string" ? gloss(line) : line}</span>
          </li>
        );
      })}
    </ol>
  );
}
