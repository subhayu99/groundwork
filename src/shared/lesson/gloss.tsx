"use client";

import { Fragment, type ReactNode } from "react";
import { Term } from "./Term";

/**
 * NOTATION BRIDGE (auto) — turn raw notation inside a plain string into
 * tap-to-define <Term> chips, so the "what we've established" spine glosses
 * O(n²) / O(log n) / arr[i] the same way the prose does, with ZERO per-topic
 * authoring. The spine lines are short and notation-dense, so auto-linking every
 * occurrence reads cleanly there.
 *
 * Conceptual PROSE still wraps its FIRST occurrence by hand with <Term> (so a
 * word like "pointer" isn't underlined on every appearance). This helper is for
 * the spine only — keep the two paths distinct.
 *
 * We list the exact GLOSSARY keys to auto-link (longest first so "O(log n)" wins
 * over "O(n)"), and deliberately OMIT short ambiguous keys (lo, hi, mid, L, R,
 * //) that would false-match inside ordinary words like "below" or "this".
 */
const AUTO_TOKENS = [
  "O(n log n)",
  "O(log n)",
  "O(n^2)",
  "O(n²)",
  "O(n)",
  "O(1)",
  "arr[i]",
  "monotonicity",
  "invariant",
  "amortization",
  "recursion",
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// One alternation, longest-first. The capture group makes String.split keep the
// matched delimiters in the result array so we can swap them for <Term> chips.
const RE = new RegExp(`(${AUTO_TOKENS.map(escapeRe).join("|")})`, "g");
const TOKEN_SET = new Set(AUTO_TOKENS.map((t) => t.toLowerCase()));

export function gloss(text: string): ReactNode {
  const parts = text.split(RE);
  if (parts.length === 1) return text; // nothing matched — return the plain string
  return parts.map((part, i) =>
    TOKEN_SET.has(part.toLowerCase()) ? (
      <Term key={i} word={part}>
        {part}
      </Term>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
