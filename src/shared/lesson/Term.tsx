"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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
 * Keeps the app's promise of "no coding background needed": a reader who hits
 * unfamiliar notation can unpack it in place without leaving the lesson.
 */
export function Term({ word, children }: { word: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  // which horizontal edge to anchor the popover to, so it never spills off-screen
  const [flipRight, setFlipRight] = useState(false);
  // open upward instead of downward when the chip sits low in the viewport
  const [flipUp, setFlipUp] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popId = useId();

  // case-insensitive lookup against GLOSSARY keys
  const gloss = (() => {
    const direct = GLOSSARY[word];
    if (direct) return direct;
    const want = word.toLowerCase();
    const hit = Object.keys(GLOSSARY).find((k) => k.toLowerCase() === want);
    return hit ? GLOSSARY[hit] : undefined;
  })();

  // dismiss on outside-click / Escape (only while open)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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

  const label = children ?? word;

  // No gloss on file? degrade gracefully to plain text — never show a dead chip.
  if (!gloss) return <>{label}</>;

  return (
    <span ref={wrapRef} className="relative inline-block" style={{ pointerEvents: "auto" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        aria-label={`Define ${word}`}
        onClick={(e) => {
          e.stopPropagation();
          // decide which way to open: if the chip is in the right ~60% of the
          // viewport, anchor the popover to its right edge so it grows leftward
          // and stays on-screen (the reading rail is narrow on the right).
          if (!open) {
            const r = wrapRef.current?.getBoundingClientRect();
            const vw = typeof window !== "undefined" ? window.innerWidth : 0;
            const vh = typeof window !== "undefined" ? window.innerHeight : 0;
            setFlipRight(!!r && vw > 0 && r.left > vw * 0.4);
            // if the chip is in the bottom ~40% of the viewport, grow upward so the
            // gloss doesn't run off the bottom edge (common at the foot of a panel).
            setFlipUp(!!r && vh > 0 && r.bottom > vh * 0.6);
          }
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
        }}
      >
        {label}
      </button>
      {open && (
        <span
          id={popId}
          role="note"
          className={`absolute z-50 block w-max max-w-[16rem] rounded-lg px-3 py-2 text-[12.5px] leading-snug font-normal not-italic shadow-lg ${
            flipUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${flipRight ? "right-0" : "left-0"}`}
          style={{
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
        </span>
      )}
    </span>
  );
}
