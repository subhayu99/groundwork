"use client";

import { useState } from "react";

interface CodeHighlightProps {
  code: string;
  language?: "python";
  /** Lines (1-indexed) to highlight as the "active" step */
  highlightedLines?: number[];
  filename?: string;
}

export function CodeHighlight({ code, highlightedLines = [], filename }: CodeHighlightProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl border border-[var(--line-faint)] bg-[var(--bg-inset)] overflow-hidden font-mono text-[13px]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--line-faint)] text-[var(--text-muted)] text-[11px]">
        <span>{filename ?? "python"}</span>
        <button
          onClick={copyToClipboard}
          className="text-[10px] hover:text-[var(--text)]"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto py-3">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const isHighlighted = highlightedLines.includes(lineNo);
          return (
            <div
              key={i}
              className={`px-4 py-0.5 transition-colors ${
                isHighlighted ? "bg-[var(--accent-soft)] border-l-2 border-[var(--accent)]" : ""
              }`}
            >
              <span className="inline-block w-8 text-right pr-3 text-[var(--text-faint)] select-none">
                {lineNo}
              </span>
              <span className="text-[var(--text)]">{line || " "}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
