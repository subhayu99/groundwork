"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { GLOSSARY } from "./glossary";

/**
 * NOTATION BRIDGE — a tap-to-define gloss chip.
 *
 * Wrap the FIRST appearance of a piece of notation or jargon in plain prose:
 *
 *     <Term word="O(n)">O(n)</Term>
 *
 * It renders the term as a dotted-underline accent chip. Tap / click (or focus +
 * Enter/Space) toggles a small popover with the one-line plain-language gloss from
 * GLOSSARY. The lookup is case-insensitive. Outside-click and Escape dismiss it.
 *
 * The popover is rendered in a PORTAL on document.body with `position: fixed`, and
 * clamped into the viewport. That's deliberate: chips live inside cards that scroll
 * (`overflow-auto`) or clip (`overflow-hidden`) — an absolutely-positioned popover
 * would be cut off by those ancestors. A portal escapes them entirely, so the gloss
 * never goes out of bounds no matter where the chip sits.
 *
 * Keeps the app's promise of "no coding background needed": a reader who hits
 * unfamiliar notation can unpack it in place without leaving the lesson.
 */
export function Term({ word, children }: { word: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  // viewport-fixed coords for the portal popover; null until measured (kept hidden
  // until then so it never flashes at the wrong spot).
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const popId = useId();
  // portals need the DOM — gate on mount so SSR / first render don't touch document.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // case-insensitive lookup against GLOSSARY keys
  const gloss = (() => {
    const direct = GLOSSARY[word];
    if (direct) return direct;
    const want = word.toLowerCase();
    const hit = Object.keys(GLOSSARY).find((k) => k.toLowerCase() === want);
    return hit ? GLOSSARY[hit] : undefined;
  })();

  // Position the popover next to the chip and CLAMP it inside the viewport. Runs on
  // open and re-runs on scroll/resize so it tracks the chip (the card it lives in
  // can scroll). Measures the real popover size, so the clamp is exact.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const b = btnRef.current?.getBoundingClientRect();
      const p = popRef.current;
      if (!b || !p) return;
      const M = 8; // viewport margin
      const pw = p.offsetWidth;
      const ph = p.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // horizontal: align to the chip's left, then pull back so it can't spill off
      // either edge.
      let left = b.left;
      if (left + pw > vw - M) left = vw - M - pw;
      if (left < M) left = M;
      // vertical: open downward; flip up if it would overflow the bottom.
      let top = b.bottom + 6;
      if (top + ph > vh - M) {
        const up = b.top - ph - 6;
        top = up >= M ? up : Math.max(M, vh - M - ph);
      }
      setPos({ left, top });
    };
    place();
    window.addEventListener("scroll", place, true); // capture: catch inner scrollers
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // dismiss on outside-click / Escape (only while open). The popover is portalled
  // OUTSIDE the chip's DOM subtree, so the outside check must spare both nodes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // reset measured position when closing so the next open re-measures from scratch
  useEffect(() => { if (!open) setPos(null); }, [open]);

  const label = children ?? word;

  // No gloss on file? degrade gracefully to plain text — never show a dead chip.
  if (!gloss) return <>{label}</>;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        aria-label={`Define ${word}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="cursor-help font-medium align-baseline"
        style={{
          color: "var(--accent-ink)",
          textDecorationLine: "underline",
          textDecorationStyle: "dotted",
          textUnderlineOffset: "3px",
          textDecorationColor: "var(--accent-line)",
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          pointerEvents: "auto",
        }}
      >
        {label}
      </button>
      {open &&
        mounted &&
        createPortal(
          <div
            ref={popRef}
            id={popId}
            role="note"
            className="block w-max max-w-[16rem] rounded-lg px-3 py-2 text-[12.5px] leading-snug font-normal not-italic shadow-lg"
            style={{
              position: "fixed",
              left: pos?.left ?? -9999,
              top: pos?.top ?? -9999,
              visibility: pos ? "visible" : "hidden",
              zIndex: 9999,
              color: "var(--text-muted)",
              background: "var(--bg-card)",
              border: "1px solid var(--line)",
              pointerEvents: "auto",
            }}
          >
            <span className="block font-mono font-semibold text-[11px] mb-0.5" style={{ color: "var(--accent-ink)" }}>
              {word}
            </span>
            {gloss}
          </div>,
          document.body,
        )}
    </>
  );
}
