"use client";

import { useEffect, useMemo, useState } from "react";
import { CodeHighlight } from "./CodeHighlight";
import { ScrubBar } from "./ScrubBar";

interface Props {
  code: string;
  filename?: string;
  /** Lines (1-indexed) the current derivation step maps to. When provided, the
   *  highlight follows the visualization/step instead of sitting idle — the
   *  "code synced to the animation" the lesson promises. The user can still
   *  scrub manually to explore; the next step change re-syncs. */
  activeLines?: number[];
  /** Lines the reader has reached; others render dimmed (progressive reveal). */
  revealedLines?: number[];
}

/**
 * The code drawer body. By default a scrub bar walks an active-line highlight
 * down the file. When `activeLines` is supplied, the highlight tracks the
 * current step (synced to the visualization); manual scrubbing temporarily
 * takes over until the step changes again.
 */
export function ScrubbableCode({ code, filename = "algorithm.py", activeLines, revealedLines }: Props) {
  const lines = useMemo(() => code.replace(/\n$/, "").split("\n"), [code]);
  const total = lines.length;

  const stops = useMemo(
    () =>
      lines
        .map((l, i) => ({ l, n: i + 1 }))
        .filter(({ l }) => l.trim().length > 0)
        .map(({ n }) => n),
    [lines],
  );

  const lastStop = stops[stops.length - 1] ?? total;
  const [current, setCurrent] = useState(stops[0] ?? 1);
  const [playing, setPlaying] = useState(false);
  // Whether the user has scrubbed since the last step change. While false, the
  // highlight follows `activeLines` (synced); a manual scrub flips it true.
  const [manual, setManual] = useState(false);

  const syncKey = activeLines?.join(",");
  useEffect(() => {
    if (activeLines && activeLines.length > 0) {
      setManual(false);
      setCurrent(activeLines[0]);
      setPlaying(false);
    }
  }, [syncKey]); // re-sync whenever the step's lines change

  const synced = !manual && !!activeLines && activeLines.length > 0;

  const snap = (line: number) => {
    setManual(true);
    const clamped = Math.max(1, Math.min(total, line));
    const next = stops.find((s) => s >= clamped);
    setCurrent(next ?? lastStop);
  };

  const highlighted = synced ? activeLines! : [current];

  const header = (
    <ScrubBar
      currentLine={synced ? activeLines![0] : current}
      totalLines={lastStop}
      playing={playing}
      onLineChange={(line) => snap(line)}
      onPlayToggle={() => {
        setManual(true);
        setPlaying((p) => !p);
      }}
      onReset={() => {
        setPlaying(false);
        if (activeLines && activeLines.length > 0) {
          setManual(false);
          setCurrent(activeLines[0]);
        } else {
          setManual(true);
          setCurrent(stops[0] ?? 1);
        }
      }}
    />
  );

  return <CodeHighlight code={code} highlightedLines={highlighted} revealedLines={revealedLines} header={header} />;
}
