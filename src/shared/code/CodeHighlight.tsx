"use client";

import type { ReactNode } from "react";

interface CodeHighlightProps {
  code: string;
  language?: "python";
  /** Lines (1-indexed) to highlight as the "active" step */
  highlightedLines?: number[];
  /** Lines (1-indexed) the reader has "reached". When provided, every OTHER
   *  line is dimmed (progressive reveal). Omit to reveal everything. */
  revealedLines?: number[];
  /** Optional header rendered inside the same border (used by practice CodeBlock). */
  header?: ReactNode;
}

// Token kinds → color tokens. Stay inside our OKLCH palette so the code
// drawer looks integrated with the rest of the UI, not bolted on.
type TokenKind =
  | "keyword"
  | "builtin"
  | "string"
  | "number"
  | "comment"
  | "def"
  | "self"
  | "decorator"
  | "operator"
  | "punctuation"
  | "type"
  | "text";

const COLORS: Record<TokenKind, string> = {
  keyword:     "var(--text)",
  builtin:     "var(--accent-sky)",
  string:      "var(--text-muted)",
  number:      "var(--accent-sky)",
  comment:     "var(--text-faint)",
  def:         "var(--accent-sky)",
  self:        "var(--accent-sky)",
  decorator:   "var(--accent-sky)",
  operator:    "var(--text)",
  punctuation: "var(--text)",
  type:        "var(--accent-sky)",
  text:        "var(--text)",
};

const KEYWORDS = new Set([
  "and", "as", "assert", "async", "await", "break", "class", "continue",
  "def", "del", "elif", "else", "except", "finally", "for", "from",
  "global", "if", "import", "in", "is", "lambda", "nonlocal", "not",
  "or", "pass", "raise", "return", "try", "while", "with", "yield",
  "True", "False", "None",
]);

const BUILTINS = new Set([
  "print", "len", "range", "enumerate", "zip", "map", "filter", "sum",
  "min", "max", "abs", "sorted", "reversed", "list", "tuple", "set",
  "dict", "str", "int", "float", "bool", "type", "isinstance", "hasattr",
  "open", "input", "any", "all", "iter", "next", "append", "extend",
  "pop", "popleft", "insert", "remove", "discard", "add", "update",
  "items", "keys", "values", "get", "find", "split", "join", "strip",
  "upper", "lower", "replace", "startswith", "endswith", "format",
]);

const TYPES = new Set([
  "list", "dict", "set", "tuple", "str", "int", "float", "bool",
  "Optional", "Node", "TreeNode", "BSTNode", "deque",
]);

interface Token { kind: TokenKind; text: string }

// Lightweight Python tokenizer. Not perfect, but good enough to make
// keywords, strings, numbers, and comments visually distinct without
// pulling in a heavy syntax-highlighting library.
function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    const ch = line[i];

    // whitespace — keep as-is so indentation renders
    if (ch === " " || ch === "\t") {
      let j = i;
      while (j < n && (line[j] === " " || line[j] === "\t")) j++;
      tokens.push({ kind: "text", text: line.slice(i, j) });
      i = j;
      continue;
    }

    // comment — consumes the rest of the line
    if (ch === "#") {
      tokens.push({ kind: "comment", text: line.slice(i) });
      break;
    }

    // string literal — single or double quote, simple (no f-strings parsed)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      // triple-quoted string for the rest of the line (best effort)
      if (line.slice(i, i + 3) === quote.repeat(3)) {
        const end = line.indexOf(quote.repeat(3), i + 3);
        if (end >= 0) {
          tokens.push({ kind: "string", text: line.slice(i, end + 3) });
          i = end + 3;
        } else {
          tokens.push({ kind: "string", text: line.slice(i) });
          i = n;
        }
        continue;
      }
      let j = i + 1;
      while (j < n) {
        if (line[j] === "\\" && j + 1 < n) { j += 2; continue; }
        if (line[j] === quote) { j++; break; }
        j++;
      }
      tokens.push({ kind: "string", text: line.slice(i, j) });
      i = j;
      continue;
    }

    // number
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9._]/.test(line[j])) j++;
      tokens.push({ kind: "number", text: line.slice(i, j) });
      i = j;
      continue;
    }

    // decorator
    if (ch === "@") {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(line[j])) j++;
      tokens.push({ kind: "decorator", text: line.slice(i, j) });
      i = j;
      continue;
    }

    // identifier or keyword
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_]/.test(line[j])) j++;
      const word = line.slice(i, j);
      // peek ahead — is this immediately followed by '(' (function call)?
      let kind: TokenKind = "text";
      if (KEYWORDS.has(word))      kind = "keyword";
      else if (word === "self")    kind = "self";
      else if (TYPES.has(word))    kind = "type";
      else if (BUILTINS.has(word)) kind = "builtin";
      // function definition: previous non-space token was "def"
      if (tokens.length > 0) {
        const prev = [...tokens].reverse().find((t) => t.text.trim() !== "");
        if (prev && prev.text === "def") kind = "def";
      }
      tokens.push({ kind, text: word });
      i = j;
      continue;
    }

    // operators / punctuation
    if (/[(){}\[\],.;:]/.test(ch)) {
      tokens.push({ kind: "punctuation", text: ch });
      i++;
      continue;
    }
    if (/[+\-*/%=<>!&|^~]/.test(ch)) {
      let j = i;
      while (j < n && /[+\-*/%=<>!&|^~]/.test(line[j])) j++;
      tokens.push({ kind: "operator", text: line.slice(i, j) });
      i = j;
      continue;
    }

    // fallback — single character as plain text
    tokens.push({ kind: "text", text: ch });
    i++;
  }

  return tokens;
}

export function CodeHighlight({ code, highlightedLines = [], revealedLines, header }: CodeHighlightProps) {
  const lines = code.split("\n");
  const revealSet = revealedLines ? new Set(revealedLines) : null;

  return (
    <div className="rounded-xl border border-[var(--line-faint)] bg-[var(--bg-inset)] overflow-hidden font-mono text-[13px]">
      {header}
      <pre className="overflow-x-auto py-3 leading-[1.65]">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const isHighlighted = highlightedLines.includes(lineNo);
          // A line is "revealed" if no reveal set is given, it's in the set, or
          // it's the active line (active always implies reached).
          const isDimmed = revealSet ? !revealSet.has(lineNo) && !isHighlighted : false;
          const tokens = tokenizeLine(line);
          return (
            <div
              key={i}
              className={`relative px-4 transition-all duration-300 ${
                isHighlighted
                  ? "bg-[var(--accent-soft)] border-l-2 border-[var(--accent)]"
                  : "border-l-2 border-transparent"
              } ${isDimmed ? "opacity-55" : "opacity-100"}`}
            >
              {/* debugger-style "running now" marker on the active line */}
              {isHighlighted && (
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[var(--accent)] text-[8px] leading-none select-none">
                  ▶
                </span>
              )}
              <span className="inline-block w-8 text-right pr-3 text-[var(--text-faint)] select-none opacity-60">
                {lineNo}
              </span>
              <span>
                {tokens.length === 0 ? (
                  <span> </span>
                ) : (
                  tokens.map((t, k) => (
                    <span
                      key={k}
                      style={{ color: COLORS[t.kind], fontStyle: t.kind === "comment" ? "italic" : undefined }}
                    >
                      {t.text}
                    </span>
                  ))
                )}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
