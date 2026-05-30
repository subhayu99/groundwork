"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CodeHighlight } from "@/shared/code/CodeHighlight";
import { prepareCode, resolveLines } from "@/shared/code/syncAnchors";
import { ArrowDefs, Arrow } from "./canvas";
import type { BeatVisualApi, LessonSpec } from "./types";

/**
 * Renders any annotated-canvas LessonSpec: the per-beat visual + its on-plane
 * text panels (with arrows) on the left, the real algorithm.py docked on the
 * right with the active line(s) following the beat. Fills the viewport; the
 * canvas scales to its area; the code pane collapses. Hosts interactive beats
 * (playback emits the live code line; a wedge beat gates "Next" until acted on).
 */
export type LessonPracticeLink = { title: string; href: string; difficulty?: string };

export function LessonRuntime({
  spec,
  practice,
  onComplete,
  initiallyCompleted,
}: {
  spec: LessonSpec;
  practice?: LessonPracticeLink[];
  onComplete?: () => void;
  initiallyCompleted?: boolean;
}) {
  const { width: VW, height: VH } = spec.canvas;
  const { code: PY, labelToLine } = useMemo(() => prepareCode(spec.codeSource), [spec.codeSource]);

  const [b, setB] = useState(0);
  const [showCode, setShowCode] = useState(true);
  const [liveLabels, setLiveLabels] = useState<(string | number)[] | null>(null);
  const [interacted, setInteracted] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState(!!initiallyCompleted);
  const beat = spec.beats[b];
  const last = spec.beats.length - 1;

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

  const goNext = () => {
    if (b < last) setB(b + 1);
    else {
      setCompleted(true);
      onComplete?.();
    }
  };

  return (
    <main className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      <div className="shrink-0 flex flex-col items-center gap-0.5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rotate-45 bg-[var(--accent-sky)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{spec.topicTitle}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-5 px-5 pb-4 justify-center w-full">
        {/* LEFT — canvas (scales to fill its area) + controls beneath */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div ref={areaRef} className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
            <div style={{ width: VW * scale, height: VH * scale }} className="relative shrink-0">
              <div
                className="absolute top-0 left-0"
                style={{ width: VW, height: VH, transform: `scale(${scale})`, transformOrigin: "top left" }}
              >
                <svg width={VW} height={VH} className="absolute inset-0 overflow-visible">
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

          {/* controls — directly beneath the canvas */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-4">
              <button onClick={() => setB((x) => Math.max(0, x - 1))} disabled={b === 0}
                className="min-h-[40px] px-4 rounded-lg border border-[var(--line)] text-[var(--text-muted)] disabled:opacity-40 hover:border-[var(--line-strong)]">← Back</button>
              <div className="flex items-center gap-2">
                {spec.beats.map((bt, i) => (
                  <button key={bt.id} onClick={() => setB(i)} aria-label={`beat ${i + 1}`}
                    className="w-2.5 h-2.5 rounded-full transition-colors" style={{ backgroundColor: i === b ? "var(--accent)" : "var(--line)" }} />
                ))}
              </div>
              <button onClick={goNext} disabled={gated}
                title={gated ? "Try the interaction on the canvas first" : undefined}
                className="min-h-[40px] px-4 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] disabled:opacity-40">
                {b === last ? (completed ? "Completed ✓" : "Finish ✓") : "Next →"}
              </button>
              <div className="w-px h-6 bg-[var(--line)] mx-0.5" />
              <button onClick={() => setShowCode((v) => !v)} aria-pressed={showCode}
                title={showCode ? "Hide the code panel" : "Show the code panel"}
                className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg border border-[var(--line)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)] font-mono text-[11px]">
                <span>&lt;/&gt;</span> {showCode ? "Hide code" : "Code"}
              </button>
            </div>
            {gated && <div className="font-mono text-[10px] text-[var(--accent-ink)]">↑ try it on the canvas to continue</div>}
          </div>
        </div>

        {/* RIGHT — the code as a floating card that pops in/out (one toggle, in the controls).
            Practice questions live below the code so the lesson is self-contained — no second page. */}
        <AnimatePresence>
          {showCode && (
            <motion.div
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22, ease: [0.22, 0.65, 0.3, 1] }}
              className="flex flex-col min-h-0 w-full xl:w-[44%] xl:max-w-[660px] xl:min-w-[420px] xl:my-1 gap-3"
            >
              <div className="flex flex-col min-h-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] shadow-2xl shadow-black/40 overflow-hidden">
                <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[var(--line-faint)]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">algorithm.py</span>
                  <span className="font-mono text-[10px] text-[var(--accent-ink)]">▶ line follows the beat</span>
                </div>
                <div className="flex-1 min-h-0 overflow-auto p-1">
                  <CodeHighlight code={PY} highlightedLines={activeLines} />
                </div>
              </div>
              {practice && practice.length > 0 && (
                <div className="shrink-0 max-h-[34%] overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] shadow-2xl shadow-black/40">
                  <div className="sticky top-0 flex items-center gap-2 px-4 py-2.5 border-b border-[var(--line-faint)] bg-[var(--bg-card)]">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-faint)]">practice</span>
                    <span className="font-mono text-[10px] text-[var(--text-faint)] normal-case">· try these next</span>
                  </div>
                  <ul className="p-2 flex flex-col gap-1.5">
                    {practice.map((p) => (
                      <li key={p.href}>
                        <a href={p.href}
                          className="group flex items-center justify-between gap-3 rounded-lg border border-[var(--line-faint)] px-3 py-2 hover:border-[var(--line-strong)] hover:bg-[var(--bg-inset)]">
                          <span className="text-[13px] text-[var(--text)]">{p.title}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            {p.difficulty && (
                              <span className="font-mono text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded text-[var(--text-faint)] border border-[var(--line-faint)]">{p.difficulty}</span>
                            )}
                            <span className="text-[var(--text-faint)] group-hover:text-[var(--accent-ink)]">→</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
