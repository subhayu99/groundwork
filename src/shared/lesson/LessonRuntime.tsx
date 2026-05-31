"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CodeHighlight } from "@/shared/code/CodeHighlight";
import { prepareCode, resolveLines } from "@/shared/code/syncAnchors";
import { ArrowDefs, Arrow } from "./canvas";
import { PrereqNudge, type PrereqItem } from "./PrereqNudge";
import type { BeatVisualApi, LessonSpec } from "./types";

/**
 * Renders any annotated-canvas LessonSpec: the per-beat visual + its on-plane
 * text panels (with arrows) on the left, the real algorithm.py docked on the
 * right with the active line(s) following the beat. Fills the viewport; the
 * canvas scales to its area; the code pane collapses. Hosts interactive beats
 * (playback emits the live code line; a wedge beat gates "Next" until acted on).
 */
export type LessonPracticeLink = { title: string; href: string; difficulty?: string };
export type LessonNav = {
  homeHref: string;
  categoryName: string;
  categoryHref: string;
  prev?: { name: string; href: string };
  next?: { name: string; href: string };
};

export function LessonRuntime({
  spec,
  practice,
  nav,
  onComplete,
  initiallyCompleted,
  prerequisites,
}: {
  spec: LessonSpec;
  practice?: LessonPracticeLink[];
  nav?: LessonNav;
  onComplete?: () => void;
  initiallyCompleted?: boolean;
  prerequisites?: PrereqItem[];
}) {
  const { width: VW, height: VH } = spec.canvas;
  const { code: PY, labelToLine } = useMemo(() => prepareCode(spec.codeSource), [spec.codeSource]);

  const [b, setB] = useState(0);
  // Calm by default: code starts hidden (content first — it never pops up to
  // scare a new learner), and auto-reveals on the final beat (the recap) unless
  // the learner has manually set it. The fuller explanation (detail) stays open
  // by default since it IS the content. Both expand/collapse from their own spot.
  const [showCode, setShowCode] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const codeTouched = useRef(false);
  const [liveLabels, setLiveLabels] = useState<(string | number)[] | null>(null);
  const [interacted, setInteracted] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(!!initiallyCompleted);
  // The prerequisite nudge is advisory only: it shows once at the very start of
  // a fresh lesson and is dismissed (never re-shown) the moment the learner
  // chooses to continue. It NEVER gates navigation.
  const [prereqDismissed, setPrereqDismissed] = useState(false);
  const beat = spec.beats[b];
  const last = spec.beats.length - 1;

  // Code follows the beat: shown on the last beat (the recap), hidden elsewhere —
  // until the learner clicks the code tab, after which their choice sticks.
  useEffect(() => {
    if (codeTouched.current) return;
    setShowCode(b === last);
  }, [b, last]);
  const toggleCode = () => { codeTouched.current = true; setShowCode((v) => !v); };

  // Reset the live (emitted) highlight whenever the beat changes, so a stale
  // line never lingers when leaving a playback/wedge beat.
  // Emitted labels are mirrored in a ref so onActiveLine can dedupe and DEFER
  // its setState — a beat's visual may call onActiveLine during its own render,
  // and a synchronous parent setState there is the "setState while rendering"
  // crash. Deferring to a microtask lands the update right after commit.
  const liveRef = useRef<(string | number)[] | null>(null);
  useEffect(() => { liveRef.current = null; setLiveLabels(null); }, [b]);

  // Progress loads asynchronously (localStorage read in an effect), so
  // initiallyCompleted can flip true after first render — reflect it (sticky;
  // never auto-uncomplete).
  useEffect(() => { if (initiallyCompleted) setCompleted(true); }, [initiallyCompleted]);

  // Fit the fixed-size canvas (svg + the absolutely-positioned panels, together)
  // to whatever area the column gives it — so it fills the desktop viewport.
  const areaRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (w > 0 && h > 0) setScale(Math.max(0.3, Math.min(w / VW, h / VH, 1.9)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showCode, VW, VH]);

  const api: BeatVisualApi = useMemo(() => ({
    onActiveLine: (labels) => {
      const cur = liveRef.current;
      const same = cur != null && cur.length === labels.length && cur.every((v, i) => v === labels[i]);
      if (same) return; // already showing these — avoids a re-render loop
      liveRef.current = labels;
      const apply = () => setLiveLabels(labels);
      if (typeof queueMicrotask === "function") queueMicrotask(apply);
      else Promise.resolve().then(apply);
    },
    onInteractionDone: () => setInteracted((m) => (m[beat.id] ? m : { ...m, [beat.id]: true })),
  }), [beat.id]);

  const gated = beat.interaction === "wedge" && !interacted[beat.id];
  const activeLines = resolveLines(liveLabels ?? beat.codeLabels ?? [], labelToLine) ?? [];
  const visualNode = typeof beat.visual === "function" ? beat.visual(api) : beat.visual;

  // The code card hugs its content but caps at a max height, so a long file
  // scrolls. Keep the active line in view so "line follows the beat" holds even
  // when the highlighted line sits below the fold.
  const codeScrollRef = useRef<HTMLDivElement>(null);
  const activeKey = activeLines.join(",");
  useEffect(() => {
    if (!showCode) return;
    const el = codeScrollRef.current?.querySelector("[data-active-line]");
    el?.scrollIntoView({ block: "nearest" });
  }, [activeKey, showCode]);

  const goNext = () => {
    if (b < last) setB(b + 1);
    else {
      setCompleted(true);
      onComplete?.();
    }
  };

  return (
    <main className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      <div className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 py-3 min-h-[58px] border-b border-[var(--line-faint)] bg-[color-mix(in_oklab,var(--bg-card)_35%,transparent)]">
        {/* left — breadcrumb back to home / the category (the category page lists every
            topic). Under sm it collapses to a single back-chevron to the category. */}
        <div className="justify-self-start min-w-0">
          {nav && (
            <>
              {/* mobile: a single back-chevron to the category */}
              <Link href={nav.categoryHref} aria-label={`Back to ${nav.categoryName}`} title={`Back to ${nav.categoryName}`}
                className="sm:hidden inline-flex items-center justify-center min-w-[40px] min-h-[40px] -ml-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </Link>
              {/* desktop: full breadcrumb */}
              <nav className="hidden sm:flex items-center gap-2 text-[13px]">
                <Link href={nav.homeHref} aria-label="Home"
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors">
                  <span className="inline-block w-2.5 h-2.5 rotate-45 bg-[var(--accent-sky)]" />
                  <span className="font-medium hidden sm:inline">Groundwork</span>
                </Link>
                <span className="text-[var(--line-strong)]">/</span>
                <Link href={nav.categoryHref}
                  className="px-2.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors">
                  {nav.categoryName}
                </Link>
              </nav>
            </>
          )}
        </div>

        {/* center — topic title + step indicator (restores the numbered 1→N sequence).
            On mobile this stacks onto its own line(s), clear of the side controls. */}
        <div className="justify-self-center flex flex-col items-center gap-1 min-w-0 text-center">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block w-2.5 h-2.5 rotate-45 bg-[var(--accent-sky)] shrink-0" />
            <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-[var(--text)] truncate">{spec.topicTitle}</span>
          </div>
          {beat.label && (
            <div className="font-mono text-[12px] tracking-wider text-[var(--text-muted)]">
              step {b + 1} of {spec.beats.length} · <span className="uppercase font-semibold text-[var(--accent-ink)]">{beat.label}</span>
            </div>
          )}
        </div>

        {/* right — jump to the previous / next topic. Stays compact in the right
            column on every width; arrows-only under sm so it never crowds the title. */}
        <div className="justify-self-end min-w-0">
          {nav && (nav.prev || nav.next) && (
            <div className="flex items-center gap-1 text-[13px]">
              {nav.prev && (
                <Link href={nav.prev.href} title={`Previous topic: ${nav.prev.name}`} aria-label={`Previous topic: ${nav.prev.name}`}
                  className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors">
                  <span className="sm:hidden">‹</span><span className="hidden sm:inline">‹ prev</span>
                </Link>
              )}
              {nav.next && (
                <Link href={nav.next.href} title={`Next topic: ${nav.next.name}`} aria-label={`Next topic: ${nav.next.name}`}
                  className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)] transition-colors">
                  <span className="sm:hidden">›</span><span className="hidden sm:inline">next ›</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* builds on … — a compact, muted pill row of prerequisites (advisory). */}
      {prerequisites && prerequisites.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-5 py-2 border-b border-[var(--line-faint)] overflow-x-auto">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)] shrink-0">builds on</span>
          <ul className="flex items-center gap-1.5">
            {prerequisites.map((p) => (
              <li key={p.href}>
                <Link href={p.href}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--line-faint)] px-2.5 py-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors whitespace-nowrap">
                  {p.completed && <span className="text-[var(--accent-ink)]" aria-hidden="true">✓</span>}
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* prerequisite nudge — non-blocking banner, only at the very start of a
          fresh lesson and only when something it builds on is unfinished. */}
      {prerequisites && prerequisites.some((p) => !p.completed) && !prereqDismissed && !initiallyCompleted && b === 0 && (
        <PrereqNudge prerequisites={prerequisites} onContinue={() => setPrereqDismissed(true)} />
      )}

      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-5 px-5 pb-4 justify-center w-full">
        {/* LEFT — canvas (scales to fill its area) + controls beneath */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div ref={areaRef} className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
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
                      {beat.arrows?.map((a, i) => <Arrow key={i} {...a} />)}
                    </motion.g>
                  </AnimatePresence>
                </svg>

                {/* text panels — on the plane, scaling with the canvas */}
                <AnimatePresence mode="wait">
                  <motion.div key={beat.id} className="absolute inset-0 pointer-events-none"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.28, ease: [0.22, 0.65, 0.3, 1] }}>
                    {beat.panels.map((p, i) => (
                      <div
                        key={i}
                        data-canvas-panel={p.variant ?? "main"}
                        className={
                          p.variant === "note"
                            ? "absolute rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-2 text-[12.5px] leading-snug text-[var(--text-muted)]"
                            : "absolute rounded-xl border border-[var(--accent-line)] p-3.5"
                        }
                        style={{
                          left: p.left, top: p.top, width: p.width,
                          background: p.variant === "note" ? undefined : "color-mix(in oklab, var(--accent-sky) 9%, var(--bg-card))",
                        }}
                      >
                        {p.label && <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-ink)]">{p.label}</div>}
                        {p.title && <div className="font-semibold text-[15px] mt-0.5 mb-1.5 text-[var(--text)]">{p.title}</div>}
                        <div className="text-[13.5px] leading-relaxed text-[var(--text-muted)] [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)] [&_em]:text-[var(--text)]">
                          {p.body}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* detail — the fuller explanation. Open by default (content first); it
              collapses to a stub in this same spot, so the learner always knows
              where it lives and where to click to bring it back. */}
          {beat.detail && (
            <div className="shrink-0 w-full max-w-[780px] mx-auto">
              {showDetail ? (
                <AnimatePresence mode="wait">
                  <motion.div key={beat.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="max-h-[34vh] overflow-auto rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_70%,transparent)] px-5 py-4">
                    <div className="flex items-center justify-end gap-3 mb-1.5">
                      <button onClick={() => setShowDetail(false)} aria-label="collapse explanation" title="collapse"
                        className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
                      </button>
                    </div>
                    {beat.connector && (
                      <p className="text-[13px] italic text-[var(--text-faint)] mb-2">{beat.connector}</p>
                    )}
                    <div className="text-[14px] leading-relaxed text-[var(--text-muted)] space-y-2 [&_code]:text-[var(--accent-ink)] [&_code]:font-mono [&_strong]:text-[var(--text)] [&_em]:text-[var(--text)] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                      {beat.detail}
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <button onClick={() => setShowDetail(true)} title="read the full explanation"
                  className="w-full flex items-center gap-2 rounded-2xl border border-dashed border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_40%,transparent)] px-5 py-2.5 text-left hover:border-[var(--line-strong)]">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-faint)]"><path d="M6 9l6 6 6-6" /></svg>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-ink)]">{beat.label ?? "the idea"}</span>
                  <span className="text-[13px] text-[var(--text-muted)]">— read the full explanation</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — code (+ practice), reveal-on-demand. Calm by default: a slim tab
            on the right edge opens it in place; it auto-opens on the recap beat.
            Both the tab and the code card's collapse live in the same spot. */}
        {showCode ? (
          <motion.div
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, ease: [0.22, 0.65, 0.3, 1] }}
            className="w-full xl:w-[46%] xl:max-w-[680px] xl:min-w-[420px] self-center flex flex-col gap-3 max-h-full"
          >
            {/* code card hugs its content (caps + scrolls only if the file is long) */}
            <div className="flex flex-col max-h-[58vh] rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] shadow-2xl shadow-black/40 overflow-hidden">
              <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--line-faint)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">algorithm.py</span>
                  <span className="font-mono text-[10px] text-[var(--accent-ink)] truncate">▶ line follows the beat</span>
                </div>
                <button onClick={toggleCode} aria-label="hide code" title="hide code"
                  className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
              <div ref={codeScrollRef} className="min-h-0 overflow-auto p-1">
                <CodeHighlight code={PY} highlightedLines={activeLines} />
              </div>
            </div>
            {practice && practice.length > 0 && (
              <div className="max-h-[30vh] overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] shadow-2xl shadow-black/40">
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
        ) : (
          <button onClick={toggleCode} title="show the code (algorithm.py)" aria-label="show code"
            className="self-center shrink-0 inline-flex xl:flex-col items-center gap-2 rounded-2xl border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-card)_45%,transparent)] px-4 py-2.5 xl:px-2.5 xl:py-5 text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--line-strong)] transition-colors">
            <span className="font-mono text-[13px]">&lt;/&gt;</span>
            <span className="font-mono text-[10px] uppercase tracking-wider xl:[writing-mode:vertical-rl] xl:rotate-180">code</span>
          </button>
        )}
      </div>

      {/* controls — a full-width bar, always centered in the viewport (independent
          of whether the code panel is open) */}
      <div className="shrink-0 flex flex-col items-center gap-1.5 px-5 pb-4 pt-1">
        <div className="flex items-center gap-4">
          <button onClick={() => setB((x) => Math.max(0, x - 1))} disabled={b === 0}
            className="min-h-[40px] px-4 rounded-lg border border-[var(--line)] text-[var(--text-muted)] disabled:opacity-40 hover:border-[var(--line-strong)]">← Back</button>
          <nav aria-label="lesson steps">
            <ol role="list" className="flex items-center gap-2">
              {spec.beats.map((bt, i) => (
                <li key={bt.id}>
                  <button
                    onClick={() => setB(i)}
                    aria-current={i === b ? "step" : undefined}
                    aria-label={`step ${i + 1} of ${spec.beats.length}${bt.label ? ": " + bt.label : ""}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                  >
                    {/* the visual 10px dot; the current step also gets a ring + a
                        size bump so it reads without relying on color alone */}
                    <span
                      className={`block rounded-full transition-all ${i === b ? "w-3 h-3 ring-2 ring-offset-2 ring-offset-[var(--bg)] ring-[var(--accent)]" : "w-2.5 h-2.5"}`}
                      style={{ backgroundColor: i === b ? "var(--accent)" : "var(--line)" }}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <button onClick={goNext} disabled={gated}
            title={gated ? "Try the interaction on the canvas first" : undefined}
            className="min-h-[40px] px-4 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] disabled:opacity-40">
            {b === last ? (completed ? "Completed ✓" : "Finish ✓") : (beat.actionLabel ? `${beat.actionLabel} →` : "Next →")}
          </button>
        </div>
        {gated && <div className="font-mono text-[10px] text-[var(--accent-ink)]">↑ try it on the canvas to continue</div>}
      </div>

      {/* live region — announces the active step to screen readers without
          stealing focus or showing on screen */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`Step ${b + 1} of ${spec.beats.length}${beat.label ? ": " + beat.label : ""}`}
      </div>
    </main>
  );
}
