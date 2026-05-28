"use client";

import { useState } from "react";
import { CodeHighlight } from "@/shared/code/CodeHighlight";

interface Props {
  code: string;
  /** Filename label shown in the header — e.g. "max_sum.py". */
  filename?: string;
}

export function CodeBlock({ code, filename = "solution.py" }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* give up silently */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <CodeHighlight
      code={code}
      header={
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--line-faint)] text-[10px] font-mono text-[var(--text-muted)]">
          <span>python · {filename}</span>
          <button
            onClick={copy}
            className="px-2 py-0.5 rounded-md border border-[var(--line)] text-[10px] uppercase tracking-wider hover:border-[var(--line-strong)] hover:text-[var(--text)] transition-colors"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      }
    />
  );
}
